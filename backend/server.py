from fastapi import FastAPI, APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import json
import logging
import asyncio
import random
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="Acute Connect - Crisis Kanban API")
api_router = APIRouter(prefix="/api")

# ---------- Logging ----------
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("kanban")


# ---------- Crisis levels ----------
CRISIS_LEVELS = ["stable", "monitoring", "elevated", "high_risk", "critical"]


# ---------- Models ----------
class Vitals(BaseModel):
    model_config = ConfigDict(extra="ignore")
    hr: int = Field(..., description="Heart rate (bpm)")
    bp_sys: int = Field(..., description="Blood pressure systolic")
    bp_dia: int = Field(..., description="Blood pressure diastolic")
    spo2: int = Field(..., description="SpO2 %")


class Patient(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    crn: str = Field(default_factory=lambda: f"CRN-{uuid.uuid4().hex[:6].upper()}")
    name: str
    age: int
    avatar_url: Optional[str] = None
    crisis_level: str = "stable"
    risk_score: int = 0  # 0 - 100
    assigned_clinician: str
    clinician_avatar: Optional[str] = None
    vitals: Vitals
    notes: str = ""
    review_date: str  # ISO date yyyy-mm-dd
    last_update: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    order: int = 0  # position inside the column


class PatientCreate(BaseModel):
    name: str
    age: int
    avatar_url: Optional[str] = None
    crisis_level: str = "stable"
    risk_score: int = 0
    assigned_clinician: str
    clinician_avatar: Optional[str] = None
    vitals: Vitals
    notes: str = ""
    review_date: str


class PatientUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    avatar_url: Optional[str] = None
    crisis_level: Optional[str] = None
    risk_score: Optional[int] = None
    assigned_clinician: Optional[str] = None
    clinician_avatar: Optional[str] = None
    vitals: Optional[Vitals] = None
    notes: Optional[str] = None
    review_date: Optional[str] = None
    order: Optional[int] = None


class MovePayload(BaseModel):
    crisis_level: str
    order: int


# ---------- WebSocket manager ----------
class ConnectionManager:
    def __init__(self):
        self.active: List[WebSocket] = []
        self.lock = asyncio.Lock()

    async def connect(self, ws: WebSocket):
        await ws.accept()
        async with self.lock:
            self.active.append(ws)
        logger.info(f"WS connected. total={len(self.active)}")

    async def disconnect(self, ws: WebSocket):
        async with self.lock:
            if ws in self.active:
                self.active.remove(ws)
        logger.info(f"WS disconnected. total={len(self.active)}")

    async def broadcast(self, event: Dict[str, Any]):
        payload = json.dumps(event, default=str)
        dead = []
        for ws in list(self.active):
            try:
                await ws.send_text(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            await self.disconnect(ws)


manager = ConnectionManager()


# ---------- Helpers ----------
def _serialize(doc: dict) -> dict:
    doc = {k: v for k, v in doc.items() if k != "_id"}
    if isinstance(doc.get("last_update"), str):
        try:
            doc["last_update"] = datetime.fromisoformat(doc["last_update"])
        except Exception:
            pass
    return doc


def _persist(doc: dict) -> dict:
    d = dict(doc)
    if isinstance(d.get("last_update"), datetime):
        d["last_update"] = d["last_update"].isoformat()
    return d


# ---------- Routes ----------
@api_router.get("/")
async def root():
    return {"message": "Acute Connect - Crisis Kanban API", "status": "ok"}


@api_router.get("/patients", response_model=List[Patient])
async def list_patients():
    docs = await db.patients.find({}, {"_id": 0}).sort([("order", 1)]).to_list(1000)
    return [Patient(**_serialize(d)) for d in docs]


@api_router.post("/patients", response_model=Patient)
async def create_patient(payload: PatientCreate):
    if payload.crisis_level not in CRISIS_LEVELS:
        raise HTTPException(status_code=400, detail="Invalid crisis_level")
    # place new patient at end of its column
    count = await db.patients.count_documents({"crisis_level": payload.crisis_level})
    patient = Patient(**payload.model_dump(), order=count)
    await db.patients.insert_one(_persist(patient.model_dump()))
    await manager.broadcast({"type": "patient.created", "patient": json.loads(patient.model_dump_json())})
    return patient


@api_router.patch("/patients/{patient_id}", response_model=Patient)
async def update_patient(patient_id: str, payload: PatientUpdate):
    existing = await db.patients.find_one({"id": patient_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Patient not found")

    updates = {k: v for k, v in payload.model_dump(exclude_none=True).items()}
    if "crisis_level" in updates and updates["crisis_level"] not in CRISIS_LEVELS:
        raise HTTPException(status_code=400, detail="Invalid crisis_level")
    if updates.get("vitals") is not None and isinstance(updates["vitals"], dict) is False:
        updates["vitals"] = updates["vitals"].model_dump()
    updates["last_update"] = datetime.now(timezone.utc).isoformat()

    await db.patients.update_one({"id": patient_id}, {"$set": updates})
    refreshed = await db.patients.find_one({"id": patient_id}, {"_id": 0})
    patient = Patient(**_serialize(refreshed))
    await manager.broadcast({"type": "patient.updated", "patient": json.loads(patient.model_dump_json())})
    return patient


@api_router.patch("/patients/{patient_id}/move", response_model=Patient)
async def move_patient(patient_id: str, payload: MovePayload):
    if payload.crisis_level not in CRISIS_LEVELS:
        raise HTTPException(status_code=400, detail="Invalid crisis_level")
    existing = await db.patients.find_one({"id": patient_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Patient not found")

    await db.patients.update_one(
        {"id": patient_id},
        {"$set": {
            "crisis_level": payload.crisis_level,
            "order": payload.order,
            "last_update": datetime.now(timezone.utc).isoformat(),
        }}
    )
    refreshed = await db.patients.find_one({"id": patient_id}, {"_id": 0})
    patient = Patient(**_serialize(refreshed))
    await manager.broadcast({
        "type": "patient.moved",
        "patient": json.loads(patient.model_dump_json()),
        "from_level": existing.get("crisis_level"),
        "to_level": payload.crisis_level,
    })
    return patient


@api_router.delete("/patients/{patient_id}")
async def delete_patient(patient_id: str):
    res = await db.patients.delete_one({"id": patient_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Patient not found")
    await manager.broadcast({"type": "patient.deleted", "id": patient_id})
    return {"ok": True, "id": patient_id}


@api_router.post("/patients/seed")
async def seed_patients(reset: bool = True):
    """(Re)populate demo crisis patients. Useful for testing & demos."""
    if reset:
        await db.patients.delete_many({})
    patients = _demo_patients()
    await db.patients.insert_many([_persist(p.model_dump()) for p in patients])
    await manager.broadcast({"type": "patients.seeded", "count": len(patients)})
    return {"seeded": len(patients)}


# WebSocket endpoint at /api/ws so it passes through the ingress '/api' prefix
@app.websocket("/api/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Send initial snapshot so clients can sync state
        docs = await db.patients.find({}, {"_id": 0}).sort([("order", 1)]).to_list(1000)
        patients = [json.loads(Patient(**_serialize(d)).model_dump_json()) for d in docs]
        await websocket.send_text(json.dumps({"type": "snapshot", "patients": patients}))
        while True:
            # We simply keep the connection alive; clients don't need to push
            msg = await websocket.receive_text()
            # echo ping/pong
            if msg == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
    except WebSocketDisconnect:
        await manager.disconnect(websocket)
    except Exception as e:
        logger.warning(f"WS error: {e}")
        await manager.disconnect(websocket)


# ---------- Demo data ----------
AVATARS = [
    "https://images.pexels.com/photos/19438566/pexels-photo-19438566.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=150&w=150",
    "https://images.pexels.com/photos/32160037/pexels-photo-32160037.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=150&w=150",
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop",
    "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop",
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop",
    "https://images.unsplash.com/photo-1603415526960-f7e0328c63b1?w=150&h=150&fit=crop",
]

CLINICIANS = [
    ("Dr. Sophia Lee", "https://images.pexels.com/photos/19438566/pexels-photo-19438566.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=150&w=150"),
    ("Dr. Alice Johnson", "https://images.pexels.com/photos/32160037/pexels-photo-32160037.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=150&w=150"),
    ("Dr. Marcus Wright", "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop"),
    ("Dr. Priya Raman", "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=150&h=150&fit=crop"),
]

PATIENT_NAMES = [
    ("Ethan Parker", 34), ("Olivia Reyes", 28), ("Liam Chen", 41), ("Ava Thompson", 22),
    ("Noah Blackwood", 55), ("Mia Rodríguez", 19), ("Lucas Bennett", 47), ("Isabella Kim", 31),
    ("Jackson Hale", 60), ("Sophia Navarro", 25), ("Aiden Foster", 38), ("Harper Singh", 29),
]


def _demo_patients() -> List[Patient]:
    # Distribute across the 5 columns
    distribution = [
        ("stable", 5, 20),
        ("monitoring", 21, 45),
        ("elevated", 46, 65),
        ("high_risk", 66, 84),
        ("critical", 85, 98),
    ]
    out: List[Patient] = []
    name_idx = 0
    for col_idx, (level, low, high) in enumerate(distribution):
        # 2-3 patients per column from the pool
        per_col = 3 if col_idx < 2 else (2 if col_idx < 4 else 2)
        for i in range(per_col):
            if name_idx >= len(PATIENT_NAMES):
                break
            name, age = PATIENT_NAMES[name_idx]
            clinician, c_avatar = CLINICIANS[name_idx % len(CLINICIANS)]
            avatar = AVATARS[name_idx % len(AVATARS)]
            risk = random.randint(low, high)
            hr_base = 70 + (col_idx * 8) + random.randint(-5, 10)
            spo2 = max(88, 99 - col_idx * 2 - random.randint(0, 2))
            bp_sys = 110 + col_idx * 6 + random.randint(-4, 10)
            bp_dia = 70 + col_idx * 3 + random.randint(-3, 6)
            review = (datetime.now(timezone.utc) + timedelta(days=random.randint(-2, 10))).date().isoformat()
            out.append(Patient(
                name=name, age=age,
                avatar_url=avatar,
                crisis_level=level,
                risk_score=risk,
                assigned_clinician=clinician,
                clinician_avatar=c_avatar,
                vitals=Vitals(hr=hr_base, bp_sys=bp_sys, bp_dia=bp_dia, spo2=spo2),
                notes=_demo_note(level),
                review_date=review,
                order=i,
            ))
            name_idx += 1
    return out


def _demo_note(level: str) -> str:
    notes_map = {
        "stable": "Routine check-in complete. Mood stable. Continue current treatment plan.",
        "monitoring": "Mild anxiety reported. Sleep disturbance noted. Flagged for weekly review.",
        "elevated": "Increased agitation in last session. Family support engaged.",
        "high_risk": "Suicidal ideation disclosed. Safety plan activated. Daily check-ins scheduled.",
        "critical": "Acute crisis. Inpatient evaluation underway. On-call psychiatrist paged.",
    }
    return notes_map.get(level, "")


# ---------- App lifecycle ----------
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def _on_startup():
    count = await db.patients.count_documents({})
    if count == 0:
        logger.info("No patients found. Seeding demo data...")
        patients = _demo_patients()
        await db.patients.insert_many([_persist(p.model_dump()) for p in patients])
        logger.info(f"Seeded {len(patients)} demo patients")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
