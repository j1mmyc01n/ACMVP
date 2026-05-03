import { api } from '../../../core/api/index.js'

export const clientsApi = {
  list: (q = '') => api.get(`/clients-list${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  create: (body) => api.post('/clients-create', body),
  update: (body) => api.patch('/clients-update', body),
}
