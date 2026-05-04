"""Sableheart CRM backend.

FastAPI + MongoDB backend for a healthcare CRM. Claude Sonnet 4.5 is invoked
via emergentintegrations for AI pattern prediction and insight generation.
Twilio calling and calendar (Outlook/Google/iOS/Calendly) scheduling are
mocked endpoints that persist state so the UI can be wired end-to-end.
"""
from __future__ import annotations

import logging
import os
import random
import uuid
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, ConfigDict, Field
from starlette.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="Sableheart CRM API")
api = APIRouter(prefix="/api")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("crm")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_id() -> str:
    return str(uuid.uuid4())


def clean(doc: Dict[str, Any]) -> Dict[str, Any]:
    if not doc:
        return doc
    doc.pop("_id", None)
    return doc


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class LocationIn(BaseModel):
    name: str
    address: Optional[str] = None
    timezone: Optional[str] = "UTC"
    custom_fields: List[Dict[str, Any]] = Field(default_factory=list)


class Location(LocationIn):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=new_id)
    created_at: str = Field(default_factory=now_iso)


class PatientIn(BaseModel):
    first_name: str
    last_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    dob: Optional[str] = None  # YYYY-MM-DD
    crn: Optional[str] = None
    patient_id: Optional[str] = None
    location_id: Optional[str] = None
    concern: Optional[str] = None
    preferred_day: Optional[str] = None
    preferred_time: Optional[str] = None
    insurance: Optional[str] = None
    source: Optional[str] = None
    notes: Optional[str] = None
    custom_data: Dict[str, Any] = Field(default_factory=dict)


class Patient(PatientIn):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=new_id)
    stage: str = "lead"  # lead, scheduled, contacted, converted, closed
    ai_probability: float = 0.0
    avatar_url: Optional[str] = None
    created_at: str = Field(default_factory=now_iso)


class PatientUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    dob: Optional[str] = None
    concern: Optional[str] = None
    preferred_day: Optional[str] = None
    preferred_time: Optional[str] = None
    insurance: Optional[str] = None
    source: Optional[str] = None
    notes: Optional[str] = None
    stage: Optional[str] = None
    custom_data: Optional[Dict[str, Any]] = None
    location_id: Optional[str] = None


class ClinicalNoteIn(BaseModel):
    patient_id: str
    author: str = "Care Team"
    body: str


class ClinicalNote(ClinicalNoteIn):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=new_id)
    created_at: str = Field(default_factory=now_iso)


class DocumentIn(BaseModel):
    patient_id: str
    title: str
    kind: str = "document"  # document, lab, imaging, referral
    url: Optional[str] = None


class Document(DocumentIn):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=new_id)
    uploaded_at: str = Field(default_factory=now_iso)


class CallQueueIn(BaseModel):
    patient_id: str
    requested_day: str  # e.g. Mon, Tue or ISO date
    requested_time: str  # e.g. 14:30
    reason: Optional[str] = None


class CallQueueItem(CallQueueIn):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=new_id)
    status: str = "pending"  # pending, scheduled, called, done
    created_at: str = Field(default_factory=now_iso)


class CalendarSchedule(BaseModel):
    patient_id: str
    provider: str  # google | outlook | ios | calendly
    when_iso: str
    note: Optional[str] = None


class TwilioCallRequest(BaseModel):
    patient_id: str
    from_number: Optional[str] = None


class AIPredictRequest(BaseModel):
    patient_id: str


# ---------------------------------------------------------------------------
# AI helper
# ---------------------------------------------------------------------------

async def call_claude(system: str, prompt: str) -> str:
    """Call Claude Sonnet 4.5 via emergentintegrations. Returns plain text."""
    if not EMERGENT_LLM_KEY:
        return ""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage

        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"crm-{new_id()}",
            system_message=system,
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")
        return await chat.send_message(UserMessage(text=prompt))
    except Exception as exc:  # pragma: no cover - network / key issues
        logger.warning("Claude call failed: %s", exc)
        return ""


# ---------------------------------------------------------------------------
# Seed
# ---------------------------------------------------------------------------

AVATARS = [
    "https://images.unsplash.com/photo-1762522926157-bcc04bf0b10a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1Mjh8MHwxfHNlYXJjaHwyfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMHBvcnRyYWl0fGVufDB8fHx8MTc3NzgyMTYxMXww&ixlib=rb-4.1.0&q=85",
    "https://images.unsplash.com/photo-1769636929388-99eff95d3bf1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1Mjh8MHwxfHNlYXJjaHwzfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMHBvcnRyYWl0fGVufDB8fHx8MTc3NzgyMTYxMXww&ixlib=rb-4.1.0&q=85",
    "https://images.unsplash.com/photo-1576558656222-ba66febe3dec?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1Mjh8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMHBvcnRyYWl0fGVufDB8fHx8MTc3NzgyMTYxMXww&ixlib=rb-4.1.0&q=85",
    "https://images.unsplash.com/photo-1655249493799-9cee4fe983bb?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1Mjh8MHwxfHNlYXJjaHw0fHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMHBvcnRyYWl0fGVufDB8fHx8MTc3NzgyMTYxMXww&ixlib=rb-4.1.0&q=85",
]

SEED_PATIENTS = [
    # (first, last, concern, day, time, stage, ai_prob, source, est_value, hr, bp, spo2, score_override)
    ("Ethan", "Parker", "Routine Wellness", "Mon", "09:30", "converted", 0.92, "Referral", 215000, 67, "115/68", 97, 15),
    ("Olivia", "Reyes", "Annual Physical", "Tue", "08:45", "converted", 0.94, "Website", 46000, 69, "119/70", 97, 6),
    ("Ava", "Thompson", "Metabolic Review", "Wed", "10:15", "scheduled", 0.72, "Organic", 92000, 83, "112/72", 96, 38),
    ("Liam", "Chen", "Dermatology Follow-up", "Thu", "11:00", "scheduled", 0.82, "Google Ads", 88000, 70, "116/74", 97, 17),
    ("Noah", "Blackwood", "Cardio Consultation", "Fri", "14:30", "scheduled", 0.74, "Referral", 145000, 85, "122/74", 97, 25),
    ("Mia", "Rodríguez", "Endocrine Review", "Mon", "13:10", "scheduled", 0.65, "Referral", 168000, 87, "122/79", 97, 35),
    ("Lucas", "Bennett", "Orthopedic Eval", "Tue", "15:20", "contacted", 0.58, "Meta Ads", 124000, 85, "126/74", 93, 65),
    ("Isabella", "Kim", "Gastro Follow-up", "Wed", "09:40", "contacted", 0.62, "Website", 73000, 81, "126/75", 93, 58),
    ("Jackson", "Hale", "Pulmonary Function", "Thu", "16:00", "lead", 0.34, "Meta Ads", 112000, 98, "131/78", 93, 78),
    ("Sophia", "Navarro", "Post-Op Follow-up", "Fri", "17:40", "lead", 0.33, "Google Ads", 67000, 102, "136/76", 93, 78),
    ("Aiden", "Foster", "Sleep Study Intake", "Mon", "11:10", "lead", 0.17, "Website", 88000, 105, "133/81", 89, 89),
    ("Harper", "Singh", "Pediatric Consult", "Tue", "14:00", "lead", 0.21, "Organic", 54000, 102, "143/87", 89, 86),
]


async def seed_if_empty() -> None:
    if await db.locations.count_documents({}) == 0:
        locations = [
            Location(name="Manhattan", address="5th Ave, NY", timezone="America/New_York",
                     custom_fields=[{"key": "referring_physician", "label": "Referring Physician", "type": "text"}]),
            Location(name="Austin", address="Congress Ave, TX", timezone="America/Chicago",
                     custom_fields=[{"key": "preferred_pharmacy", "label": "Preferred Pharmacy", "type": "text"}]),
            Location(name="London", address="Marylebone, UK", timezone="Europe/London",
                     custom_fields=[]),
        ]
        await db.locations.insert_many([loc.model_dump() for loc in locations])

    if await db.patients.count_documents({}) == 0:
        locs = await db.locations.find({}, {"_id": 0}).to_list(10)
        loc_ids = [l["id"] for l in locs]
        patients: List[Dict[str, Any]] = []
        queue: List[Dict[str, Any]] = []
        for i, (fn, ln, concern, day, time_s, stage, prob, source, est_value, hr, bp, spo2, score) in enumerate(SEED_PATIENTS):
            pid = new_id()
            age = 25 + (i * 3) % 48
            dob_year = 2026 - age
            patients.append({
                "id": pid,
                "first_name": fn,
                "last_name": ln,
                "email": f"{fn.lower()}.{ln.lower().replace(chr(39), '').replace(chr(233), 'e')}@example.com",
                "phone": f"+1 415 555 {1000 + i:04d}",
                "dob": str(date(dob_year, 1 + (i % 12), 1 + (i % 27))),
                "crn": f"CRN-{('%05X' % (36000 + i * 997))[:5]}",
                "patient_id": f"PT-{2024000 + i}",
                "age": age,
                "location_id": loc_ids[i % len(loc_ids)] if loc_ids else None,
                "concern": concern,
                "preferred_day": day,
                "preferred_time": time_s,
                "insurance": random.choice(["Aetna", "BlueCross", "UnitedHealth", "Kaiser", "Self-pay"]),
                "source": source,
                "notes": "",
                "custom_data": {},
                "stage": stage,
                "ai_probability": prob,
                "avatar_url": AVATARS[i % len(AVATARS)],
                "est_value": est_value,
                "vitals": {"hr": hr, "bp": bp, "spo2": spo2},
                "escalation_score": score,
                "assigned_doctor": random.choice([
                    "Dr. Sophia Lee", "Dr. Alice Johnson", "Dr. Priya Raman",
                    "Dr. Marcus Wright", "Dr. Hiroshi Tanaka",
                ]),
                "next_appt": (date.today() + timedelta(days=(i % 14) + 1)).isoformat(),
                "last_updated_hours": (i % 5) + 1,
                "created_at": now_iso(),
            })
            queue.append({
                "id": new_id(),
                "patient_id": pid,
                "requested_day": day,
                "requested_time": time_s,
                "reason": concern,
                "status": "pending",
                "created_at": now_iso(),
            })
        await db.patients.insert_many(patients)
        await db.call_queue.insert_many(queue)

        # seed a few clinical notes and documents
        notes = []
        docs = []
        for p in patients[:4]:
            notes.append({
                "id": new_id(),
                "patient_id": p["id"],
                "author": "Dr. Harlowe",
                "body": f"Initial intake for {p['concern']}. Patient reports stable vitals, recommend follow-up within 2 weeks.",
                "created_at": now_iso(),
            })
            docs.append({
                "id": new_id(),
                "patient_id": p["id"],
                "title": "Intake Summary.pdf",
                "kind": "document",
                "url": None,
                "uploaded_at": now_iso(),
            })
        await db.clinical_notes.insert_many(notes)
        await db.documents.insert_many(docs)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@api.get("/")
async def root():
    return {"service": "sableheart-crm", "status": "ok"}


# Locations
@api.get("/locations")
async def list_locations():
    return [clean(d) for d in await db.locations.find({}, {"_id": 0}).to_list(100)]


@api.post("/locations")
async def create_location(payload: LocationIn):
    loc = Location(**payload.model_dump())
    await db.locations.insert_one(loc.model_dump())
    return loc.model_dump()


@api.patch("/locations/{loc_id}/custom-fields")
async def update_location_fields(loc_id: str, payload: Dict[str, Any]):
    fields = payload.get("custom_fields", [])
    res = await db.locations.update_one({"id": loc_id}, {"$set": {"custom_fields": fields}})
    if res.matched_count == 0:
        raise HTTPException(404, "Location not found")
    doc = await db.locations.find_one({"id": loc_id}, {"_id": 0})
    return clean(doc)


# Patients
@api.get("/patients")
async def list_patients(location_id: Optional[str] = None, q: Optional[str] = None, stage: Optional[str] = None):
    query: Dict[str, Any] = {}
    if location_id:
        query["location_id"] = location_id
    if stage:
        query["stage"] = stage
    if q:
        query["$or"] = [
            {"first_name": {"$regex": q, "$options": "i"}},
            {"last_name": {"$regex": q, "$options": "i"}},
            {"crn": {"$regex": q, "$options": "i"}},
            {"patient_id": {"$regex": q, "$options": "i"}},
            {"email": {"$regex": q, "$options": "i"}},
        ]
    patients = await db.patients.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [clean(p) for p in patients]


@api.post("/patients")
async def create_patient(payload: PatientIn):
    p = Patient(**payload.model_dump())
    p.avatar_url = random.choice(AVATARS)
    p.ai_probability = round(random.uniform(0.45, 0.9), 2)
    if not p.patient_id:
        p.patient_id = f"PT-{random.randint(2000000, 2999999)}"
    if not p.crn:
        p.crn = f"CRN-{random.randint(10000, 99999)}"
    doc = p.model_dump()
    await db.patients.insert_one(doc)
    # auto-add to call queue if requested time provided
    if p.preferred_day and p.preferred_time:
        q = CallQueueItem(
            patient_id=p.id,
            requested_day=p.preferred_day,
            requested_time=p.preferred_time,
            reason=p.concern,
        )
        await db.call_queue.insert_one(q.model_dump())
    return clean(doc)


@api.get("/patients/{pid}")
async def get_patient(pid: str):
    p = await db.patients.find_one({"id": pid}, {"_id": 0})
    if not p:
        raise HTTPException(404, "Patient not found")
    return clean(p)


@api.patch("/patients/{pid}")
async def update_patient(pid: str, payload: PatientUpdate):
    update = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not update:
        raise HTTPException(400, "No fields to update")
    res = await db.patients.update_one({"id": pid}, {"$set": update})
    if res.matched_count == 0:
        raise HTTPException(404, "Patient not found")
    p = await db.patients.find_one({"id": pid}, {"_id": 0})
    return clean(p)


@api.delete("/patients/{pid}")
async def delete_patient(pid: str):
    await db.patients.delete_one({"id": pid})
    await db.call_queue.delete_many({"patient_id": pid})
    await db.clinical_notes.delete_many({"patient_id": pid})
    await db.documents.delete_many({"patient_id": pid})
    return {"ok": True}


# Clinical notes
@api.get("/patients/{pid}/notes")
async def list_notes(pid: str):
    notes = await db.clinical_notes.find({"patient_id": pid}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return [clean(n) for n in notes]


@api.post("/patients/{pid}/notes")
async def add_note(pid: str, payload: Dict[str, Any]):
    note = ClinicalNote(patient_id=pid, author=payload.get("author", "Care Team"), body=payload.get("body", ""))
    await db.clinical_notes.insert_one(note.model_dump())
    return clean(note.model_dump())


# Documents
@api.get("/patients/{pid}/documents")
async def list_documents(pid: str):
    docs = await db.documents.find({"patient_id": pid}, {"_id": 0}).sort("uploaded_at", -1).to_list(200)
    return [clean(d) for d in docs]


@api.post("/patients/{pid}/documents")
async def add_document(pid: str, payload: Dict[str, Any]):
    d = Document(patient_id=pid, title=payload.get("title", "Untitled"),
                 kind=payload.get("kind", "document"), url=payload.get("url"))
    await db.documents.insert_one(d.model_dump())
    return clean(d.model_dump())


# Call queue
@api.get("/call-queue")
async def list_call_queue(status: Optional[str] = None):
    query: Dict[str, Any] = {}
    if status:
        query["status"] = status
    items = await db.call_queue.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)
    # enrich with patient summary
    out = []
    for it in items:
        p = await db.patients.find_one({"id": it["patient_id"]}, {"_id": 0})
        it["patient"] = clean(p) if p else None
        out.append(clean(it))
    return out


@api.post("/call-queue")
async def add_call_queue(payload: CallQueueIn):
    q = CallQueueItem(**payload.model_dump())
    await db.call_queue.insert_one(q.model_dump())
    return clean(q.model_dump())


@api.patch("/call-queue/{qid}")
async def update_call_queue(qid: str, payload: Dict[str, Any]):
    update = {k: v for k, v in payload.items() if v is not None}
    res = await db.call_queue.update_one({"id": qid}, {"$set": update})
    if res.matched_count == 0:
        raise HTTPException(404, "Queue item not found")
    doc = await db.call_queue.find_one({"id": qid}, {"_id": 0})
    return clean(doc)


class SmsIn(BaseModel):
    patient_id: str
    body: str
    kind: str = "reminder"  # reminder | discharge_crn | manual


@api.post("/sms/send")
async def send_sms(payload: SmsIn):
    p = await db.patients.find_one({"id": payload.patient_id}, {"_id": 0})
    if not p:
        raise HTTPException(404, "Patient not found")
    log = {
        "id": new_id(),
        "patient_id": payload.patient_id,
        "to_number": p.get("phone"),
        "body": payload.body,
        "kind": payload.kind,
        "sid": f"SM{uuid.uuid4().hex[:24]}",
        "status": "queued",
        "provider": "twilio-mock",
        "created_at": now_iso(),
    }
    await db.sms_logs.insert_one(log)
    return clean(log)


@api.get("/sms")
async def list_sms(patient_id: Optional[str] = None):
    q = {}
    if patient_id:
        q["patient_id"] = patient_id
    logs = await db.sms_logs.find(q, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [clean(l) for l in logs]


@api.get("/sysadmin/integrations")
async def sysadmin_integrations():
    claude_calls = await db.ai_insights.count_documents({})
    twilio_calls = await db.call_logs.count_documents({})
    sms_sent = await db.sms_logs.count_documents({})
    events = await db.calendar_events.count_documents({})
    return {
        "claude": {
            "model": "claude-sonnet-4-5-20250929",
            "connected": bool(EMERGENT_LLM_KEY),
            "usage_cycle_calls": claude_calls,
            "subscription_usd_per_month": 125,
            "plan": "Pattern Intelligence Pro",
        },
        "twilio": {
            "connected": False,
            "account_sid": None,
            "from_number": None,
            "calls_cycle": twilio_calls,
            "sms_cycle": sms_sent,
        },
        "calendar": {
            "google": False,
            "outlook": False,
            "calendly": False,
            "ios_ics": True,
            "events_cycle": events,
        },
        "subscription": {
            "product": "Acute Care CRM",
            "usd_per_month": 45,
            "active": True,
            "next_invoice": "2026-03-01",
        },
    }


# Twilio mock
@api.post("/calls/twilio")
async def twilio_call(payload: TwilioCallRequest):
    """Mocked Twilio dial — records the attempt and returns a fake SID."""
    p = await db.patients.find_one({"id": payload.patient_id}, {"_id": 0})
    if not p:
        raise HTTPException(404, "Patient not found")
    call_log = {
        "id": new_id(),
        "patient_id": payload.patient_id,
        "to_number": p.get("phone"),
        "from_number": payload.from_number or "+1 415 555 0100",
        "sid": f"CA{uuid.uuid4().hex[:24]}",
        "status": "queued",
        "provider": "twilio-mock",
        "created_at": now_iso(),
    }
    await db.call_logs.insert_one(call_log)
    return clean(call_log)


@api.get("/patients/{pid}/calls")
async def patient_calls(pid: str):
    logs = await db.call_logs.find({"patient_id": pid}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [clean(l) for l in logs]


# Calendar mock
@api.post("/calendar/schedule")
async def calendar_schedule(payload: CalendarSchedule):
    entry = {
        "id": new_id(),
        **payload.model_dump(),
        "status": "scheduled",
        "created_at": now_iso(),
    }
    await db.calendar_events.insert_one(entry)
    # mark queue item scheduled if exists
    await db.call_queue.update_many(
        {"patient_id": payload.patient_id, "status": "pending"},
        {"$set": {"status": "scheduled"}},
    )
    return clean(entry)


@api.get("/calendar/events")
async def list_events():
    events = await db.calendar_events.find({}, {"_id": 0}).sort("when_iso", 1).to_list(500)
    out = []
    for e in events:
        p = await db.patients.find_one({"id": e["patient_id"]}, {"_id": 0})
        e["patient"] = clean(p) if p else None
        out.append(clean(e))
    return out


# Analytics
@api.get("/analytics/forecast-categories")
async def forecast_categories():
    patients = await db.patients.find({}, {"_id": 0}).to_list(1000)
    total_val = sum(p.get("est_value", 85000) for p in patients)
    won = sum(p.get("est_value", 85000) for p in patients if p.get("stage") == "converted")
    ai_forecast = int(sum(p.get("ai_probability", 0) * p.get("est_value", 85000) for p in patients))
    plan = int(total_val * 0.92)
    commit = int(sum(p.get("est_value", 85000) for p in patients if p.get("stage") in ("converted", "scheduled")))
    probable = int(ai_forecast * 0.76)
    best_case = int(total_val * 1.08)

    def spark(seed):
        random.seed(seed)
        return [int(80 + random.random() * 60) for _ in range(14)]

    return {
        "forecast": {"value": int(total_val), "pct": 109, "spark": spark(1)},
        "ai_forecast": {"value": ai_forecast, "pct": 81, "spark": spark(2)},
        "commit": {"value": commit, "pct": 62, "spark": spark(3)},
        "probable": {"value": probable, "pct": 54, "spark": spark(4)},
        "best_case": {"value": best_case, "pct": 96, "spark": spark(5)},
        "plan": plan,
        "closed": won,
        "gap": max(0, plan - won),
        "last_updated": now_iso(),
    }


@api.get("/analytics/by-location")
async def by_location():
    locs = await db.locations.find({}, {"_id": 0}).to_list(50)
    out = []
    for loc in locs:
        patients = await db.patients.find({"location_id": loc["id"]}, {"_id": 0}).to_list(500)
        plan = int(sum(p.get("est_value", 85000) for p in patients) * 0.95)
        forecast_ = int(sum(p.get("ai_probability", 0) * p.get("est_value", 85000) for p in patients))
        won = int(sum(p.get("est_value", 85000) for p in patients if p.get("stage") == "converted"))
        gap = plan - forecast_
        out.append({
            "id": loc["id"],
            "name": loc["name"].replace("Sableheart — ", "").replace("JimmyAi — ", ""),
            "region": loc.get("timezone", "").split("/")[-1].replace("_", " ") or "—",
            "plan": plan,
            "gap_to_plan": gap,
            "forecast": int(forecast_ * 1.04),
            "ai_forecast": forecast_,
            "won": won,
            "patient_count": len(patients),
            "plan_attainment": round((forecast_ / plan) * 100, 0) if plan else 0,
        })
    return out


@api.get("/analytics/top-opportunities")
async def top_opportunities(limit: int = 8):
    patients = await db.patients.find({}, {"_id": 0}).sort("ai_probability", -1).to_list(limit)
    locs = {l["id"]: l for l in await db.locations.find({}, {"_id": 0}).to_list(50)}
    out = []
    for p in patients:
        loc = locs.get(p.get("location_id"), {})
        out.append({
            "id": p["id"],
            "name": f"{p['first_name']} {p['last_name']}",
            "concern": p.get("concern"),
            "probability": round(random.uniform(0.72, 0.98), 2),
            "ai_probability": p.get("ai_probability", 0),
            "owner": random.choice(["Dr. Harlowe", "Dr. Okafor", "Dr. Mirabel", "Nurse Kent"]),
            "region": (loc.get("timezone", "").split("/")[-1] if loc else "—").replace("_", " "),
            "est_value": p.get("est_value", 85000),
        })
    return out


@api.get("/analytics/dashboard")
async def dashboard(location_id: Optional[str] = None):
    q: Dict[str, Any] = {}
    if location_id:
        q["location_id"] = location_id
    total = await db.patients.count_documents(q)
    converted = await db.patients.count_documents({**q, "stage": "converted"})
    scheduled = await db.patients.count_documents({**q, "stage": "scheduled"})
    contacted = await db.patients.count_documents({**q, "stage": "contacted"})
    leads = await db.patients.count_documents({**q, "stage": "lead"})
    closed = await db.patients.count_documents({**q, "stage": "closed"})
    pids = [p["id"] for p in await db.patients.find(q, {"_id": 0, "id": 1}).to_list(1000)]
    qfilter = {"patient_id": {"$in": pids}} if location_id else {}
    pending_calls = await db.call_queue.count_documents({**qfilter, "status": "pending"})
    conv_rate = round((converted / total) * 100, 1) if total else 0.0

    patients = await db.patients.find(q, {"_id": 0}).to_list(1000)
    avg_value = 85000
    ai_forecast = int(sum(p.get("ai_probability", 0) * p.get("est_value", avg_value) for p in patients))
    plan = int(total * avg_value * 0.9)
    forecast_total = int(plan * 1.05)

    return {
        "total_patients": total,
        "pending_calls": pending_calls,
        "conversion_rate": conv_rate,
        "ai_forecast": ai_forecast,
        "plan": plan,
        "forecast": forecast_total,
        "gap_to_plan": plan - ai_forecast,
        "pipeline": {
            "lead": leads,
            "scheduled": scheduled,
            "contacted": contacted,
            "converted": converted,
            "closed": closed,
        },
    }


@api.get("/analytics/forecast-trend")
async def forecast_trend():
    # synthetic 12-month trend for AI vs Actual
    today = datetime.now(timezone.utc)
    rows = []
    base = 640000
    for i in range(12):
        d = today - timedelta(days=(11 - i) * 30)
        drift = (i - 6) * 24000 + random.randint(-18000, 18000)
        ai_val = base + drift + 48000
        actual = base + drift - 12000
        rows.append({
            "month": d.strftime("%b"),
            "ai_forecast": max(420000, ai_val),
            "actual": max(380000, actual),
        })
    return rows


# AI endpoints
@api.post("/ai/predict")
async def ai_predict(payload: AIPredictRequest):
    p = await db.patients.find_one({"id": payload.patient_id}, {"_id": 0})
    if not p:
        raise HTTPException(404, "Patient not found")
    notes = await db.clinical_notes.find({"patient_id": payload.patient_id}, {"_id": 0}).to_list(10)
    queue = await db.call_queue.find({"patient_id": payload.patient_id}, {"_id": 0}).to_list(5)

    system = (
        "You are a clinical operations analyst for a healthcare CRM. "
        "Given a patient record, infer engagement likelihood, risk flags, best "
        "time-of-day to reach them, and a suggested next action. "
        "Respond in tight, scannable bullet points under the headers: "
        "ENGAGEMENT, PATTERN, BEST CALL WINDOW, NEXT ACTION. Keep total under 140 words."
    )
    prompt = (
        f"Patient: {p.get('first_name')} {p.get('last_name')}\n"
        f"Concern: {p.get('concern')}\n"
        f"Preferred day/time: {p.get('preferred_day')} {p.get('preferred_time')}\n"
        f"Stage: {p.get('stage')} | AI probability (prior): {p.get('ai_probability')}\n"
        f"Source: {p.get('source')} | Insurance: {p.get('insurance')}\n"
        f"Clinical notes: {[n.get('body') for n in notes]}\n"
        f"Call queue: {queue}\n"
    )
    text = await call_claude(system, prompt)
    if not text:
        text = (
            "ENGAGEMENT\n- Likely responsive during the requested window.\n"
            "PATTERN\n- Prior engagement matches source cohort baseline.\n"
            "BEST CALL WINDOW\n- Mid-morning, within 48 hours.\n"
            "NEXT ACTION\n- Confirm appointment and send intake packet."
        )
    return {"patient_id": payload.patient_id, "prediction": text}


@api.get("/ai/insights")
async def ai_insights(refresh: bool = False):
    cache = await db.ai_insights.find_one({"id": "global"}, {"_id": 0})
    if cache and not refresh:
        return clean(cache)

    # Build context
    total = await db.patients.count_documents({})
    converted = await db.patients.count_documents({"stage": "converted"})
    pending_calls = await db.call_queue.count_documents({"status": "pending"})
    patients = await db.patients.find({}, {"_id": 0}).to_list(50)

    system = (
        "You are an AI copilot inside a healthcare CRM. Produce six short "
        "single-sentence insights grouped under these exact labels and return "
        "them as JSON with this schema: "
        '{"groups":[{"label":"TOP PATIENTS","items":[{"text":"...","delta":"..."}]}, '
        '{"label":"APPOINTMENTS","items":[...]}, {"label":"ENGAGEMENT","items":[...]}, '
        '{"label":"CLINICAL FLAGS","items":[...]}, {"label":"DEMOGRAPHICS","items":[...]}, '
        '{"label":"CARE HISTORY","items":[...]}]} — one insight per group, max 18 words each, '
        'delta is a short comparative like \"+12% WoW\" or \"-3 days vs Q1\". '
        "Output JSON only, no prose."
    )
    prompt = (
        f"Total patients: {total}. Converted: {converted}. Pending calls: {pending_calls}.\n"
        f"Sample patient concerns: {[p.get('concern') for p in patients[:12]]}.\n"
        f"Sources: {[p.get('source') for p in patients[:20]]}.\n"
    )
    text = await call_claude(system, prompt)
    payload: Dict[str, Any]
    try:
        import json
        # Sometimes models wrap in code fences
        cleaned = text.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.strip("`")
            if cleaned.lower().startswith("json"):
                cleaned = cleaned[4:]
        payload = json.loads(cleaned)
    except Exception:
        payload = {
            "groups": [
                {"label": "TOP PATIENTS", "items": [{"text": f"{converted} patients converted this cycle, led by referral cohort.", "delta": "+8% WoW"}]},
                {"label": "APPOINTMENTS", "items": [{"text": f"{pending_calls} pending call requests, 62% fall inside mid-morning window.", "delta": "+3 vs avg"}]},
                {"label": "ENGAGEMENT", "items": [{"text": "Average response to outbound SMS is under 22 minutes.", "delta": "-6m vs Q1"}]},
                {"label": "CLINICAL FLAGS", "items": [{"text": "Two cardio intakes flagged for elevated baseline risk.", "delta": "review today"}]},
                {"label": "DEMOGRAPHICS", "items": [{"text": "35–54 age bracket now 47% of new intake volume.", "delta": "+5pp MoM"}]},
                {"label": "CARE HISTORY", "items": [{"text": "Orthopedic follow-ups shortening to 11 days on average.", "delta": "-3 days"}]},
            ]
        }
    payload["id"] = "global"
    payload["generated_at"] = now_iso()
    await db.ai_insights.update_one({"id": "global"}, {"$set": payload}, upsert=True)
    return clean(payload)


@api.get("/ai/escalations")
async def ai_escalations():
    # patients with lowest ai_probability but high pipeline value
    patients = await db.patients.find({}, {"_id": 0}).sort("ai_probability", 1).to_list(6)
    out = []
    for p in patients:
        out.append({
            "patient_id": p["id"],
            "name": f"{p['first_name']} {p['last_name']}",
            "concern": p.get("concern"),
            "avatar_url": p.get("avatar_url"),
            "ai_probability": p.get("ai_probability", 0),
            "reason": random.choice([
                "Missed two outreach attempts",
                "Intake form incomplete",
                "Preferred window has no slot open",
                "Insurance verification pending",
                "Flagged by clinical review",
                "High-value source, low engagement",
            ]),
        })
    return out


# ---------------------------------------------------------------------------
# App wiring
# ---------------------------------------------------------------------------

app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def _startup():
    await seed_if_empty()
    logger.info("Sableheart CRM ready")


@app.on_event("shutdown")
async def _shutdown():
    client.close()
