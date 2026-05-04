"""Backend tests for Acute Connect Crisis Kanban API."""
import os
import json
import asyncio
import pytest
import requests
import websockets

BASE_URL = os.environ['REACT_APP_BACKEND_URL'].rstrip('/') if os.environ.get('REACT_APP_BACKEND_URL') else None
if not BASE_URL:
    # Read from frontend .env directly
    with open('/app/frontend/.env') as f:
        for line in f:
            if line.startswith('REACT_APP_BACKEND_URL='):
                BASE_URL = line.split('=', 1)[1].strip().rstrip('/')
                break

WS_URL = BASE_URL.replace('https://', 'wss://').replace('http://', 'ws://') + '/api/ws'

CRISIS_LEVELS = ["stable", "monitoring", "elevated", "high_risk", "critical"]


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module", autouse=True)
def reseed(session):
    """Reseed before tests to guarantee 12 patients."""
    r = session.post(f"{BASE_URL}/api/patients/seed?reset=true")
    assert r.status_code == 200, r.text
    yield


# ------- Health -------
def test_root(session):
    r = session.get(f"{BASE_URL}/api/")
    assert r.status_code == 200
    data = r.json()
    assert data.get("status") == "ok"


# ------- List patients -------
def test_list_patients_returns_12(session):
    r = session.get(f"{BASE_URL}/api/patients")
    assert r.status_code == 200
    patients = r.json()
    assert isinstance(patients, list)
    assert len(patients) == 12
    p = patients[0]
    for field in ["id", "crn", "name", "age", "crisis_level", "risk_score",
                  "assigned_clinician", "vitals", "review_date", "last_update", "order"]:
        assert field in p, f"missing {field}"
    for vf in ["hr", "bp_sys", "bp_dia", "spo2"]:
        assert vf in p["vitals"]
    assert p["crisis_level"] in CRISIS_LEVELS


# ------- Create -------
def test_create_patient(session):
    payload = {
        "name": "TEST_Patient_Create",
        "age": 33,
        "crisis_level": "monitoring",
        "risk_score": 40,
        "assigned_clinician": "Dr. Tester",
        "vitals": {"hr": 80, "bp_sys": 120, "bp_dia": 80, "spo2": 98},
        "notes": "test",
        "review_date": "2026-02-01",
    }
    r = session.post(f"{BASE_URL}/api/patients", json=payload)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["name"] == "TEST_Patient_Create"
    assert data["crisis_level"] == "monitoring"
    assert "id" in data
    # GET to verify persisted
    r2 = session.get(f"{BASE_URL}/api/patients")
    ids = [p["id"] for p in r2.json()]
    assert data["id"] in ids
    # cleanup
    session.delete(f"{BASE_URL}/api/patients/{data['id']}")


def test_create_patient_invalid_crisis_level(session):
    payload = {
        "name": "TEST_BadLevel", "age": 30, "crisis_level": "bogus",
        "assigned_clinician": "Dr. X",
        "vitals": {"hr": 80, "bp_sys": 120, "bp_dia": 80, "spo2": 98},
        "review_date": "2026-02-01",
    }
    r = session.post(f"{BASE_URL}/api/patients", json=payload)
    assert r.status_code == 400


# ------- Update -------
def test_update_patient(session):
    r = session.get(f"{BASE_URL}/api/patients")
    pid = r.json()[0]["id"]
    r2 = session.patch(f"{BASE_URL}/api/patients/{pid}", json={"notes": "updated_TEST"})
    assert r2.status_code == 200
    assert r2.json()["notes"] == "updated_TEST"
    # GET verify
    r3 = session.get(f"{BASE_URL}/api/patients")
    matched = [p for p in r3.json() if p["id"] == pid][0]
    assert matched["notes"] == "updated_TEST"


def test_update_patient_invalid_level(session):
    r = session.get(f"{BASE_URL}/api/patients")
    pid = r.json()[0]["id"]
    r2 = session.patch(f"{BASE_URL}/api/patients/{pid}", json={"crisis_level": "wrong"})
    assert r2.status_code == 400


def test_update_nonexistent_returns_404(session):
    r = session.patch(f"{BASE_URL}/api/patients/nonexistent-id", json={"notes": "x"})
    assert r.status_code == 404


# ------- Move -------
def test_move_patient(session):
    r = session.get(f"{BASE_URL}/api/patients")
    p = r.json()[0]
    pid = p["id"]
    target = "critical" if p["crisis_level"] != "critical" else "stable"
    r2 = session.patch(f"{BASE_URL}/api/patients/{pid}/move",
                       json={"crisis_level": target, "order": 0})
    assert r2.status_code == 200, r2.text
    assert r2.json()["crisis_level"] == target


def test_move_invalid_level(session):
    r = session.get(f"{BASE_URL}/api/patients")
    pid = r.json()[0]["id"]
    r2 = session.patch(f"{BASE_URL}/api/patients/{pid}/move",
                       json={"crisis_level": "bogus", "order": 0})
    assert r2.status_code == 400


def test_move_nonexistent_404(session):
    r = session.patch(f"{BASE_URL}/api/patients/no-such/move",
                      json={"crisis_level": "stable", "order": 0})
    assert r.status_code == 404


# ------- Delete -------
def test_delete_patient(session):
    payload = {
        "name": "TEST_DeleteMe", "age": 30, "crisis_level": "stable",
        "assigned_clinician": "Dr. T",
        "vitals": {"hr": 80, "bp_sys": 120, "bp_dia": 80, "spo2": 98},
        "review_date": "2026-02-01",
    }
    r = session.post(f"{BASE_URL}/api/patients", json=payload)
    pid = r.json()["id"]
    r2 = session.delete(f"{BASE_URL}/api/patients/{pid}")
    assert r2.status_code == 200
    # verify gone
    r3 = session.get(f"{BASE_URL}/api/patients")
    assert pid not in [p["id"] for p in r3.json()]


def test_delete_nonexistent_404(session):
    r = session.delete(f"{BASE_URL}/api/patients/nope-id")
    assert r.status_code == 404


# ------- Seed reset -------
def test_seed_reset(session):
    r = session.post(f"{BASE_URL}/api/patients/seed?reset=true")
    assert r.status_code == 200
    assert r.json()["seeded"] == 12
    r2 = session.get(f"{BASE_URL}/api/patients")
    assert len(r2.json()) == 12


# ------- WebSocket -------
@pytest.mark.asyncio
async def test_websocket_snapshot_and_broadcast(session):
    async with websockets.connect(WS_URL, open_timeout=10) as ws:
        # Initial snapshot
        msg = await asyncio.wait_for(ws.recv(), timeout=10)
        data = json.loads(msg)
        assert data["type"] == "snapshot"
        assert isinstance(data["patients"], list)

        # Trigger an update via REST and expect broadcast
        plist = session.get(f"{BASE_URL}/api/patients").json()
        pid = plist[0]["id"]

        # Run patch concurrently while listening
        async def trigger():
            await asyncio.sleep(0.5)
            session.patch(f"{BASE_URL}/api/patients/{pid}",
                          json={"notes": "ws_test"})

        task = asyncio.create_task(trigger())
        # Read until we get patient.updated (skip stray events)
        got = False
        for _ in range(5):
            msg = await asyncio.wait_for(ws.recv(), timeout=10)
            evt = json.loads(msg)
            if evt.get("type") == "patient.updated":
                assert evt["patient"]["id"] == pid
                got = True
                break
        await task
        assert got, "Did not receive patient.updated broadcast"


@pytest.mark.asyncio
async def test_websocket_move_event():
    async with websockets.connect(WS_URL, open_timeout=10) as ws:
        # Snapshot
        snap = json.loads(await asyncio.wait_for(ws.recv(), timeout=10))
        assert snap["type"] == "snapshot"
        plist = snap["patients"]
        pid = plist[0]["id"]
        original_level = plist[0]["crisis_level"]
        target = "critical" if original_level != "critical" else "stable"

        async def trigger():
            await asyncio.sleep(0.5)
            requests.patch(f"{BASE_URL}/api/patients/{pid}/move",
                           json={"crisis_level": target, "order": 0})

        task = asyncio.create_task(trigger())
        got = False
        for _ in range(5):
            evt = json.loads(await asyncio.wait_for(ws.recv(), timeout=10))
            if evt.get("type") == "patient.moved":
                assert evt["from_level"] == original_level
                assert evt["to_level"] == target
                got = True
                break
        await task
        assert got
