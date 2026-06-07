import { api } from './client';

const cache = new Map();

export function getCachedProject(id) {
  return cache.get(id) ?? null;
}

export function listProjects() {
  return api.get('/api/projects');
}

export function getProject(id) {
  return api.get(`/api/projects/${id}`).then((project) => {
    cache.set(id, project);
    return project;
  });
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
