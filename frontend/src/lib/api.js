import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

const http = axios.create({
  baseURL: API,
  headers: { "Content-Type": "application/json" },
});

export const api = {
  listPatients: (params = {}) =>
    http.get("/patients", { params }).then((r) => r.data),
  getPatient: (id) => http.get(`/patients/${id}`).then((r) => r.data),
  createPatient: (payload) =>
    http.post("/patients", payload).then((r) => r.data),
  updatePatient: (id, payload) =>
    http.patch(`/patients/${id}`, payload).then((r) => r.data),
  deletePatient: (id) => http.delete(`/patients/${id}`).then((r) => r.data),

  listLocations: () => http.get("/locations").then((r) => r.data),

  listQueue: (params = {}) =>
    http.get("/call-queue", { params }).then((r) => r.data),
  updateQueueItem: (id, payload) =>
    http.patch(`/call-queue/${id}`, payload).then((r) => r.data),

  dashboard: () => http.get("/analytics/dashboard").then((r) => r.data),
  forecastTrend: () =>
    http.get("/analytics/forecast-trend").then((r) => r.data),
  forecastCategories: () =>
    http.get("/analytics/forecast-categories").then((r) => r.data),
  listEvents: () => http.get("/calendar/events").then((r) => r.data),
  byLocation: () => http.get("/analytics/by-location").then((r) => r.data),
  topOpportunities: () =>
    http.get("/analytics/top-opportunities").then((r) => r.data),

  insights: (refresh = false) =>
    http
      .get(`/ai/insights${refresh ? "?refresh=true" : ""}`)
      .then((r) => r.data),
  escalations: (location_id) =>
    http
      .get(`/ai/escalations${location_id ? `?location_id=${location_id}` : ""}`)
      .then((r) => r.data),
  predict: (patient_id) =>
    http.post("/ai/predict", { patient_id }).then((r) => r.data),

  twilioCall: (patient_id) =>
    http.post("/calls/twilio", { patient_id }).then((r) => r.data),
  patientCalls: (id) => http.get(`/patients/${id}/calls`).then((r) => r.data),

  schedule: (payload) =>
    http.post("/calendar/schedule", payload).then((r) => r.data),

  sendSms: (patient_id, body, kind = "manual") =>
    http.post("/sms/send", { patient_id, body, kind }).then((r) => r.data),
  listSms: (patient_id) =>
    http
      .get(`/sms${patient_id ? `?patient_id=${patient_id}` : ""}`)
      .then((r) => r.data),
  sysadminIntegrations: () =>
    http.get("/sysadmin/integrations").then((r) => r.data),

  listNotes: (pid) => http.get(`/patients/${pid}/notes`).then((r) => r.data),
  addNote: (pid, body) =>
    http.post(`/patients/${pid}/notes`, { body }).then((r) => r.data),

  listDocs: (pid) => http.get(`/patients/${pid}/documents`).then((r) => r.data),
  addDoc: (pid, title) =>
    http.post(`/patients/${pid}/documents`, { title }).then((r) => r.data),
};
