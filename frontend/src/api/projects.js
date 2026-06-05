import { api } from './client';

export function listProjects() {
  return api.get('/api/projects');
}
