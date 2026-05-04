"""Sableheart CRM backend regression tests.

Covers all API endpoints listed in the test plan: locations, patients
CRUD + custom data, notes, documents, call queue, twilio mock,
calendar mock, analytics, AI insights/predict/escalations.
"""
from __future__ import annotations

import os
import time
import uuid

import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/") if os.environ.get("REACT_APP_BACKEND_URL") else None
if not BASE_URL:
    # fall back to frontend env
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL"):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
                break

API = f"{BASE_URL}/api"


@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# --- Healthcheck -----------------------------------------------------------

def test_health(session):
    r = session.get(f"{API}/")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "ok"
    assert data["service"] == "sableheart-crm"


# --- Locations -------------------------------------------------------------

def test_locations_seeded(session):
    r = session.get(f"{API}/locations")
    assert r.status_code == 200
    locs = r.json()
    assert isinstance(locs, list)
    assert len(locs) >= 3
    assert all("id" in l and "name" in l for l in locs)
    # at least one with custom_fields configured
    assert any(l.get("custom_fields") for l in locs)


# --- Patients --------------------------------------------------------------

def test_patients_seeded(session):
    r = session.get(f"{API}/patients")
    assert r.status_code == 200
    pts = r.json()
    assert isinstance(pts, list)
    assert len(pts) >= 12
    p0 = pts[0]
    for k in ("id", "first_name", "last_name", "stage", "ai_probability"):
        assert k in p0


def test_patient_get_by_id(session):
    pts = session.get(f"{API}/patients").json()
    pid = pts[0]["id"]
    r = session.get(f"{API}/patients/{pid}")
    assert r.status_code == 200
    assert r.json()["id"] == pid


def test_patient_get_404(session):
    r = session.get(f"{API}/patients/{uuid.uuid4()}")
    assert r.status_code == 404


def test_patient_create_with_queue_and_persistence(session):
    locs = session.get(f"{API}/locations").json()
    loc_id = locs[0]["id"]
    payload = {
        "first_name": "TEST_Auto",
        "last_name": f"User{uuid.uuid4().hex[:6]}",
        "email": "test_auto@example.com",
        "phone": "+1 415 555 9999",
        "location_id": loc_id,
        "concern": "Test Concern",
        "preferred_day": "Mon",
        "preferred_time": "10:00",
        "custom_data": {"referring_physician": "Dr. Test"},
    }
    r = session.post(f"{API}/patients", json=payload)
    assert r.status_code == 200, r.text
    p = r.json()
    assert p["first_name"] == "TEST_Auto"
    assert p["custom_data"]["referring_physician"] == "Dr. Test"
    assert p["patient_id"].startswith("PT-")
    assert p["crn"].startswith("CRN-")
    pid = p["id"]

    # GET verifies persistence
    g = session.get(f"{API}/patients/{pid}")
    assert g.status_code == 200
    assert g.json()["concern"] == "Test Concern"

    # Queue auto-created
    q = session.get(f"{API}/call-queue").json()
    assert any(it["patient_id"] == pid for it in q), "Patient not added to call queue"

    # cleanup
    session.delete(f"{API}/patients/{pid}")


def test_patient_patch(session):
    pts = session.get(f"{API}/patients").json()
    pid = pts[-1]["id"]
    r = session.patch(f"{API}/patients/{pid}", json={"notes": "TEST_updated_note", "stage": "contacted"})
    assert r.status_code == 200
    body = r.json()
    assert body["notes"] == "TEST_updated_note"
    assert body["stage"] == "contacted"
    # verify
    g = session.get(f"{API}/patients/{pid}").json()
    assert g["notes"] == "TEST_updated_note"


def test_patient_search_filter(session):
    pts = session.get(f"{API}/patients?q=Ava").json()
    assert any("Ava" in p["first_name"] for p in pts)


def test_patient_location_filter(session):
    locs = session.get(f"{API}/locations").json()
    r = session.get(f"{API}/patients?location_id={locs[0]['id']}")
    assert r.status_code == 200
    pts = r.json()
    assert all(p.get("location_id") == locs[0]["id"] for p in pts)


# --- Notes -----------------------------------------------------------------

def test_notes_get_and_post(session):
    pts = session.get(f"{API}/patients").json()
    pid = pts[0]["id"]
    r = session.get(f"{API}/patients/{pid}/notes")
    assert r.status_code == 200
    initial = len(r.json())

    add = session.post(f"{API}/patients/{pid}/notes", json={"author": "TEST", "body": "TEST body"})
    assert add.status_code == 200
    assert add.json()["body"] == "TEST body"

    after = session.get(f"{API}/patients/{pid}/notes").json()
    assert len(after) == initial + 1


# --- Documents -------------------------------------------------------------

def test_documents_get_and_post(session):
    pts = session.get(f"{API}/patients").json()
    pid = pts[0]["id"]
    r = session.get(f"{API}/patients/{pid}/documents")
    assert r.status_code == 200
    initial = len(r.json())

    add = session.post(f"{API}/patients/{pid}/documents", json={"title": "TEST_doc.pdf", "kind": "lab"})
    assert add.status_code == 200
    assert add.json()["title"] == "TEST_doc.pdf"

    after = session.get(f"{API}/patients/{pid}/documents").json()
    assert len(after) == initial + 1


# --- Call queue ------------------------------------------------------------

def test_call_queue_list_enriched(session):
    r = session.get(f"{API}/call-queue")
    assert r.status_code == 200
    items = r.json()
    assert len(items) >= 12
    assert items[0].get("patient") is not None
    assert "first_name" in items[0]["patient"]


def test_call_queue_patch(session):
    items = session.get(f"{API}/call-queue").json()
    qid = items[0]["id"]
    r = session.patch(f"{API}/call-queue/{qid}", json={"status": "called"})
    assert r.status_code == 200
    assert r.json()["status"] == "called"
    # restore
    session.patch(f"{API}/call-queue/{qid}", json={"status": "pending"})


# --- Twilio mock + call history --------------------------------------------

def test_twilio_call_mock(session):
    pts = session.get(f"{API}/patients").json()
    pid = pts[0]["id"]
    r = session.post(f"{API}/calls/twilio", json={"patient_id": pid})
    assert r.status_code == 200
    data = r.json()
    assert data["sid"].startswith("CA")
    assert data["provider"] == "twilio-mock"

    history = session.get(f"{API}/patients/{pid}/calls")
    assert history.status_code == 200
    logs = history.json()
    assert any(l["sid"] == data["sid"] for l in logs)


# --- Calendar mock ---------------------------------------------------------

def test_calendar_schedule(session):
    pts = session.get(f"{API}/patients").json()
    pid = pts[1]["id"]
    r = session.post(
        f"{API}/calendar/schedule",
        json={"patient_id": pid, "provider": "google", "when_iso": "2026-02-01T10:00:00Z"},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["provider"] == "google"
    assert body["status"] == "scheduled"


# --- Analytics -------------------------------------------------------------

def test_analytics_dashboard(session):
    r = session.get(f"{API}/analytics/dashboard")
    assert r.status_code == 200
    d = r.json()
    for k in ("total_patients", "pending_calls", "conversion_rate", "ai_forecast",
              "plan", "forecast", "gap_to_plan", "pipeline"):
        assert k in d, f"missing {k}"
    for stage in ("lead", "scheduled", "contacted", "converted", "closed"):
        assert stage in d["pipeline"]
    assert d["total_patients"] >= 12


def test_analytics_forecast_trend(session):
    r = session.get(f"{API}/analytics/forecast-trend")
    assert r.status_code == 200
    rows = r.json()
    assert len(rows) == 12
    assert all("month" in row and "ai_forecast" in row and "actual" in row for row in rows)


# --- AI --------------------------------------------------------------------

def test_ai_insights(session):
    r = session.get(f"{API}/ai/insights", timeout=60)
    assert r.status_code == 200
    data = r.json()
    assert "groups" in data
    labels = {g["label"] for g in data["groups"]}
    # 6 buckets expected
    expected = {"TOP PATIENTS", "APPOINTMENTS", "ENGAGEMENT", "CLINICAL FLAGS", "DEMOGRAPHICS", "CARE HISTORY"}
    assert expected.issubset(labels), f"missing labels: {expected - labels}"


def test_ai_predict(session):
    pts = session.get(f"{API}/patients").json()
    pid = pts[0]["id"]
    r = session.post(f"{API}/ai/predict", json={"patient_id": pid}, timeout=60)
    assert r.status_code == 200
    data = r.json()
    assert data["patient_id"] == pid
    assert isinstance(data["prediction"], str)
    assert len(data["prediction"]) > 20


def test_ai_escalations(session):
    r = session.get(f"{API}/ai/escalations")
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 6
    for item in data:
        assert "name" in item and "ai_probability" in item and "reason" in item
