"""End-to-end backend tests against the live FastAPI app.

The DB starts empty; each test creates the data it needs and cleans up
after itself so the suite is repeatable.
"""
from __future__ import annotations

import os
import uuid
from typing import Any, Dict

import pytest
import requests

API = os.environ.get(
    "BACKEND_BASE",
    f"{os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001')}/api",
)
if not API.endswith("/api"):
    API = f"{API.rstrip('/')}/api"


@pytest.fixture
def location() -> Dict[str, Any]:
    name = f"PyTest Centre {uuid.uuid4().hex[:6]}"
    res = requests.post(
        f"{API}/locations",
        json={"name": name, "speciality": "general", "seats": 3},
        timeout=15,
    )
    assert res.status_code == 200, res.text
    loc = res.json()
    yield loc
    requests.delete(f"{API}/locations/{loc['id']}", timeout=15)


def test_default_pipeline_stages(location):
    keys = [s["key"] for s in location["pipeline_stages"]]
    assert keys == ["intake", "triage", "active", "follow_up", "discharged"]


def test_list_locations_backfills_stages():
    res = requests.get(f"{API}/locations", timeout=15)
    assert res.status_code == 200
    for loc in res.json():
        assert loc.get("pipeline_stages"), f"{loc['name']} missing stages"


def test_update_stages_normalises_keys(location):
    res = requests.patch(
        f"{API}/locations/{location['id']}/stages",
        json={"pipeline_stages": [
            {"label": "Care Plan", "color": "#10b981"},
            {"label": "  Discharge  "},
        ]},
        timeout=15,
    )
    assert res.status_code == 200
    keys = [s["key"] for s in res.json()["pipeline_stages"]]
    assert keys == ["care_plan", "discharge"]


def test_update_stages_rejects_empty(location):
    res = requests.patch(
        f"{API}/locations/{location['id']}/stages",
        json={"pipeline_stages": []},
        timeout=15,
    )
    assert res.status_code == 400


def test_update_stages_404_on_missing_location():
    res = requests.patch(
        f"{API}/locations/not-a-real-id/stages",
        json={"pipeline_stages": [{"label": "Foo"}]},
        timeout=15,
    )
    assert res.status_code == 404


def test_patient_default_stage_is_intake(location):
    res = requests.post(
        f"{API}/patients",
        json={"first_name": "Foo", "last_name": "Bar", "location_id": location["id"]},
        timeout=15,
    )
    assert res.status_code == 200
    patient = res.json()
    assert patient["stage"] == "intake"
    requests.delete(f"{API}/patients/{patient['id']}", timeout=15)


def test_system_integrations_round_trip():
    # Set
    res = requests.patch(
        f"{API}/integrations/system",
        json={"provider": "twilio", "config": {
            "account_sid": "ACpytest12345abcdef",
            "auth_token": "tokpytestsecretvalue",
            "from_number": "+15550100",
        }},
        timeout=15,
    )
    assert res.status_code == 200
    twilio = res.json()["integrations"]["twilio"]
    assert twilio["connected"] is True
    # auth_token masked, ends with last 4
    assert twilio["auth_token"].endswith("alue")
    assert "•" in twilio["auth_token"]
    # from_number not masked
    assert twilio["from_number"] == "+15550100"

    # Empty value does not overwrite
    requests.patch(
        f"{API}/integrations/system",
        json={"provider": "twilio", "config": {"from_number": ""}},
        timeout=15,
    )
    j = requests.get(f"{API}/integrations/system", timeout=15).json()
    assert j["integrations"]["twilio"]["from_number"] == "+15550100"

    # Disconnect
    res = requests.delete(f"{API}/integrations/system/twilio", timeout=15)
    assert res.status_code == 200
    assert res.json()["integrations"]["twilio"]["connected"] is False


def test_location_integrations_isolated(location):
    res = requests.patch(
        f"{API}/locations/{location['id']}/integrations",
        json={"provider": "google", "config": {
            "client_id": "1234.apps.googleusercontent.com",
            "client_secret": "GOCSPX-pytestsecretvalue",
        }},
        timeout=15,
    )
    assert res.status_code == 200
    g = res.json()["integrations"]["google"]
    assert g["connected"] is True
    assert g["client_secret"].endswith("alue")  # masked


def test_unknown_provider_rejected():
    res = requests.patch(
        f"{API}/integrations/system",
        json={"provider": "nonexistent", "config": {"foo": "bar"}},
        timeout=15,
    )
    assert res.status_code == 400


def test_delete_location_unscopes_patients(location):
    p = requests.post(
        f"{API}/patients",
        json={"first_name": "Carol", "last_name": "Doe", "location_id": location["id"]},
        timeout=15,
    ).json()
    requests.delete(f"{API}/locations/{location['id']}", timeout=15)
    after = requests.get(f"{API}/patients/{p['id']}", timeout=15).json()
    assert after.get("location_id") in (None, "")
    requests.delete(f"{API}/patients/{p['id']}", timeout=15)
