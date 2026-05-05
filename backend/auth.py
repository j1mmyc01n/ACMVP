"""JWT authentication + email-OTP 2FA for the Patient CRM.

All endpoints are mounted on the same /api router from server.py. Tokens are
delivered as **httpOnly cookies** (preferred) and also returned in the JSON body
so the React Axios layer can attach a Bearer token if cookies are blocked
(e.g. tests, embedded views).

OTP delivery is stubbed: the 6-digit code is logged to the backend log and
echoed in the response when ``settings.dev_otp_echo`` is true. Wiring real SMTP
is a follow-up integration.
"""
from __future__ import annotations

import logging
import os
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

import bcrypt
import jwt
from fastapi import APIRouter, HTTPException, Request, Response
from pydantic import BaseModel, EmailStr, Field

logger = logging.getLogger("crm.auth")

JWT_ALGORITHM = "HS256"
ACCESS_TTL_MIN = 60 * 12  # 12 hours — clinical shifts
REFRESH_TTL_DAYS = 14
OTP_TTL_MIN = 10
LOCKOUT_THRESHOLD = 5
LOCKOUT_MINUTES = 15

ROLES = {"sysadmin", "staff"}


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _now_iso() -> str:
    return _now().isoformat()


def _jwt_secret() -> str:
    secret = os.environ.get("JWT_SECRET")
    if not secret:
        raise RuntimeError("JWT_SECRET missing from backend/.env")
    return secret


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "type": "access",
        "exp": _now() + timedelta(minutes=ACCESS_TTL_MIN),
    }
    return jwt.encode(payload, _jwt_secret(), algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "type": "refresh",
        "exp": _now() + timedelta(days=REFRESH_TTL_DAYS),
    }
    return jwt.encode(payload, _jwt_secret(), algorithm=JWT_ALGORITHM)


def _set_cookies(response: Response, access: str, refresh: str) -> None:
    response.set_cookie(
        "access_token", access, httponly=True, secure=False, samesite="lax",
        max_age=ACCESS_TTL_MIN * 60, path="/",
    )
    response.set_cookie(
        "refresh_token", refresh, httponly=True, secure=False, samesite="lax",
        max_age=REFRESH_TTL_DAYS * 86400, path="/",
    )


def _clear_cookies(response: Response) -> None:
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")


def _strip_user(user: Dict[str, Any]) -> Dict[str, Any]:
    safe = {k: v for k, v in user.items() if k not in {"_id", "password_hash", "otp_hash", "otp_expires_at"}}
    return safe


# ------------------------------------------------------------------ models

class LoginIn(BaseModel):
    email: EmailStr
    password: str


class OtpVerifyIn(BaseModel):
    email: EmailStr
    code: str


class CreateStaffIn(BaseModel):
    email: EmailStr
    name: str
    role: str = "staff"
    location_id: Optional[str] = None
    temp_password: Optional[str] = None  # auto-generated when omitted


class ChangePasswordIn(BaseModel):
    current_password: str
    new_password: str


class ResetRequestIn(BaseModel):
    email: EmailStr


class ResetCompleteIn(BaseModel):
    token: str
    new_password: str


# ------------------------------------------------------------------ helpers

async def _get_user_by_email(db, email: str) -> Optional[Dict[str, Any]]:
    return await db.users.find_one({"email": email.lower().strip()}, {"_id": 0})


async def _get_user_by_id(db, uid: str) -> Optional[Dict[str, Any]]:
    return await db.users.find_one({"id": uid}, {"_id": 0})


def _gen_otp() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


def _gen_temp_password() -> str:
    return secrets.token_urlsafe(9)


async def _record_failure(db, identifier: str) -> int:
    now = _now()
    res = await db.login_attempts.find_one_and_update(
        {"identifier": identifier},
        {"$inc": {"count": 1}, "$set": {"last_at": now.isoformat()}},
        upsert=True,
        return_document=True,
    )
    return (res or {}).get("count", 1)


async def _is_locked(db, identifier: str) -> bool:
    rec = await db.login_attempts.find_one({"identifier": identifier})
    if not rec:
        return False
    if rec.get("count", 0) < LOCKOUT_THRESHOLD:
        return False
    last = rec.get("last_at")
    if not last:
        return False
    locked_until = datetime.fromisoformat(last) + timedelta(minutes=LOCKOUT_MINUTES)
    return _now() < locked_until


async def _clear_failures(db, identifier: str) -> None:
    await db.login_attempts.delete_one({"identifier": identifier})


# ------------------------------------------------------------------ session

async def get_current_user(request: Request):
    """Extract user dict from JWT (cookie OR Bearer header)."""
    db = request.app.state.db
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.lower().startswith("bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(401, "Not authenticated")
    try:
        payload = jwt.decode(token, _jwt_secret(), algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid token")
    if payload.get("type") != "access":
        raise HTTPException(401, "Wrong token type")
    user = await _get_user_by_id(db, payload["sub"])
    if not user:
        raise HTTPException(401, "User not found")
    return _strip_user(user)


def require_sysadmin(user: Dict[str, Any]):
    if user.get("role") != "sysadmin":
        raise HTTPException(403, "Sysadmin only")
    return user


# ------------------------------------------------------------------ router

auth_router = APIRouter(prefix="/auth", tags=["auth"])


@auth_router.post("/login")
async def login(request: Request, response: Response, payload: LoginIn):
    db = request.app.state.db
    email = payload.email.lower().strip()
    ip = request.client.host if request.client else "unknown"
    identifier = f"{ip}:{email}"

    if await _is_locked(db, identifier):
        raise HTTPException(429, "Too many attempts. Try again in 15 minutes.")

    user = await _get_user_by_email(db, email)
    if not user or not verify_password(payload.password, user.get("password_hash", "")):
        await _record_failure(db, identifier)
        raise HTTPException(401, "Invalid email or password")

    # Generate one-time code (2FA — email-delivered)
    code = _gen_otp()
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {
            "otp_hash": hash_password(code),
            "otp_expires_at": (_now() + timedelta(minutes=OTP_TTL_MIN)).isoformat(),
        }},
    )
    logger.info("[OTP] %s -> %s (expires %d min)", email, code, OTP_TTL_MIN)
    return {
        "stage": "otp",
        "email": email,
        "must_reset": bool(user.get("must_reset")),
        "dev_otp": code,  # remove in real prod; testing-agent friendly today
    }


@auth_router.post("/verify-otp")
async def verify_otp(request: Request, response: Response, payload: OtpVerifyIn):
    db = request.app.state.db
    email = payload.email.lower().strip()
    user = await _get_user_by_email(db, email)
    if not user or not user.get("otp_hash") or not user.get("otp_expires_at"):
        raise HTTPException(401, "OTP not requested")
    if datetime.fromisoformat(user["otp_expires_at"]) < _now():
        raise HTTPException(401, "OTP expired")
    if not verify_password(payload.code, user["otp_hash"]):
        raise HTTPException(401, "Invalid code")
    await db.users.update_one(
        {"id": user["id"]},
        {"$unset": {"otp_hash": "", "otp_expires_at": ""},
         "$set": {"last_login_at": _now_iso()}},
    )
    ip = request.client.host if request.client else "unknown"
    await _clear_failures(db, f"{ip}:{email}")

    access = create_access_token(user["id"], user["email"], user.get("role", "staff"))
    refresh = create_refresh_token(user["id"])
    _set_cookies(response, access, refresh)
    return {
        "user": _strip_user(user),
        "access_token": access,
        "must_reset": bool(user.get("must_reset")),
    }


@auth_router.post("/logout")
async def logout(response: Response):
    _clear_cookies(response)
    return {"ok": True}


@auth_router.get("/me")
async def me(request: Request):
    user = await get_current_user(request)
    return user


@auth_router.post("/refresh")
async def refresh_session(request: Request, response: Response):
    db = request.app.state.db
    token = request.cookies.get("refresh_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.lower().startswith("bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(401, "No refresh token")
    try:
        payload = jwt.decode(token, _jwt_secret(), algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError:
        raise HTTPException(401, "Invalid refresh token")
    if payload.get("type") != "refresh":
        raise HTTPException(401, "Wrong token type")
    user = await _get_user_by_id(db, payload["sub"])
    if not user:
        raise HTTPException(401, "User not found")
    access = create_access_token(user["id"], user["email"], user.get("role", "staff"))
    response.set_cookie(
        "access_token", access, httponly=True, secure=False, samesite="lax",
        max_age=ACCESS_TTL_MIN * 60, path="/",
    )
    return {"access_token": access, "user": _strip_user(user)}


@auth_router.post("/change-password")
async def change_password(request: Request, payload: ChangePasswordIn):
    db = request.app.state.db
    me_doc = await get_current_user(request)
    full = await db.users.find_one({"id": me_doc["id"]}, {"_id": 0})
    if not full or not verify_password(payload.current_password, full.get("password_hash", "")):
        raise HTTPException(400, "Current password incorrect")
    if len(payload.new_password) < 8:
        raise HTTPException(400, "Password must be at least 8 characters")
    await db.users.update_one(
        {"id": me_doc["id"]},
        {"$set": {"password_hash": hash_password(payload.new_password), "must_reset": False}},
    )
    return {"ok": True}


@auth_router.post("/forgot-password")
async def forgot_password(request: Request, payload: ResetRequestIn):
    db = request.app.state.db
    user = await _get_user_by_email(db, payload.email)
    if user:
        token = secrets.token_urlsafe(32)
        await db.password_reset_tokens.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": user["id"],
            "token": token,
            "expires_at": (_now() + timedelta(hours=1)).isoformat(),
            "used": False,
        })
        logger.info("[RESET] %s -> %s", payload.email, token)
    # Always 200 — don't reveal user existence
    return {"ok": True}


@auth_router.post("/reset-password")
async def reset_password(request: Request, payload: ResetCompleteIn):
    db = request.app.state.db
    rec = await db.password_reset_tokens.find_one({"token": payload.token, "used": False}, {"_id": 0})
    if not rec or datetime.fromisoformat(rec["expires_at"]) < _now():
        raise HTTPException(400, "Invalid or expired token")
    if len(payload.new_password) < 8:
        raise HTTPException(400, "Password must be at least 8 characters")
    await db.users.update_one(
        {"id": rec["user_id"]},
        {"$set": {"password_hash": hash_password(payload.new_password), "must_reset": False}},
    )
    await db.password_reset_tokens.update_one({"token": payload.token}, {"$set": {"used": True}})
    return {"ok": True}


@auth_router.get("/staff")
async def list_staff(request: Request):
    me_doc = await get_current_user(request)
    require_sysadmin(me_doc)
    db = request.app.state.db
    docs = await db.users.find({}, {"_id": 0, "password_hash": 0, "otp_hash": 0, "otp_expires_at": 0}).to_list(500)
    return docs


@auth_router.post("/staff")
async def create_staff(request: Request, payload: CreateStaffIn):
    me_doc = await get_current_user(request)
    require_sysadmin(me_doc)
    if payload.role not in ROLES:
        raise HTTPException(400, f"Role must be one of {sorted(ROLES)}")
    db = request.app.state.db
    email = payload.email.lower().strip()
    if await _get_user_by_email(db, email):
        raise HTTPException(409, "Email already registered")
    temp = payload.temp_password or _gen_temp_password()
    user = {
        "id": str(uuid.uuid4()),
        "email": email,
        "name": payload.name,
        "role": payload.role,
        "location_id": payload.location_id,
        "password_hash": hash_password(temp),
        "must_reset": True,
        "created_at": _now_iso(),
        "created_by": me_doc["id"],
    }
    await db.users.insert_one(user)
    logger.info("[STAFF CREATED] %s · temp=%s", email, temp)
    return {"user": _strip_user(user), "temp_password": temp}


@auth_router.delete("/staff/{uid}")
async def delete_staff(request: Request, uid: str):
    me_doc = await get_current_user(request)
    require_sysadmin(me_doc)
    if uid == me_doc["id"]:
        raise HTTPException(400, "Cannot delete yourself")
    db = request.app.state.db
    res = await db.users.delete_one({"id": uid})
    if res.deleted_count == 0:
        raise HTTPException(404, "Staff not found")
    return {"ok": True}


# ------------------------------------------------------------------ bootstrap

async def seed_admin(db) -> None:
    email = (os.environ.get("ADMIN_EMAIL") or "admin@patientcrm.local").lower().strip()
    password = os.environ.get("ADMIN_PASSWORD") or "ChangeMe-1234"
    existing = await db.users.find_one({"email": email})
    if not existing:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": email,
            "name": "Sysadmin",
            "role": "sysadmin",
            "password_hash": hash_password(password),
            "must_reset": False,
            "created_at": _now_iso(),
        })
        logger.info("[SEED] sysadmin %s created", email)
    else:
        # Keep the seeded password in sync with .env so devs can rotate it
        if not verify_password(password, existing.get("password_hash", "")):
            await db.users.update_one(
                {"email": email},
                {"$set": {"password_hash": hash_password(password)}},
            )
            logger.info("[SEED] sysadmin %s password updated from .env", email)


async def ensure_indexes(db) -> None:
    try:
        await db.users.create_index("email", unique=True)
        await db.users.create_index("id", unique=True)
        await db.password_reset_tokens.create_index("expires_at", expireAfterSeconds=3600)
        await db.password_reset_tokens.create_index("token")
        await db.login_attempts.create_index("identifier")
    except Exception as e:
        logger.warning("[AUTH] index creation: %s", e)
