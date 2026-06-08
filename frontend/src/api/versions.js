import { api } from './client';

export function listVersions(projectId) {
  return api.get(`/api/projects/${projectId}/versions`);
}
