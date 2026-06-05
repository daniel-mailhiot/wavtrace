import { api } from './client';

export function listProjects() {
  return api.get('/api/projects');
}

export function getProject(id) {
  return api.get(`/api/projects/${id}`);
}

export function createProject(name) {
  return api.post('/api/projects', { name });
}

export function renameProject(id, name) {
  return api.patch(`/api/projects/${id}`, { name });
}

export function deleteProject(id) {
  return api.del(`/api/projects/${id}`);
}

export function addMember(id, email, role) {
  return api.post(`/api/projects/${id}/members`, { email, role });
}

export function updateMember(id, userId, role) {
  return api.patch(`/api/projects/${id}/members/${userId}`, { role });
}

export function removeMember(id, userId) {
  return api.del(`/api/projects/${id}/members/${userId}`);
}
