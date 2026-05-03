import { api } from '../../../core/api/index.js'

export const fieldAgentsApi = {
  list: (status = 'active') =>
    api.get(`/field-agents-list${status ? `?status=${encodeURIComponent(status)}` : ''}`),
  create: (body) => api.post('/field-agents-create', body),
  checkIn: (body) => api.post('/field-agents-checkin', body),
  checkIns: (agentId) =>
    api.get(`/field-agents-checkins${agentId ? `?agentId=${encodeURIComponent(agentId)}` : ''}`),
}
