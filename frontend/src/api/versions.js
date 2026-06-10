import { api } from './client';

export function listVersions(projectId) {
  return api.get(`/api/projects/${projectId}/versions`);
}

// 'file' matches what multer expects on backend (upload.single('file'))
export function uploadVersion(projectId, file) {
  const form = new FormData();
  form.append('file', file);
  return api.post(`/api/projects/${projectId}/versions`, form);
}
