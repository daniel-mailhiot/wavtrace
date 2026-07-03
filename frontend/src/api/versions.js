import { api } from './client';

export function listVersions(projectId) {
  return api.get(`/api/projects/${projectId}/versions`);
}

// 'file' matches what multer expects on backend (upload.single('file'))
export function uploadVersion(projectId, file, description) {
  const form = new FormData();
  form.append('file', file);
  if (description) form.append('description', description);
  return api.post(`/api/projects/${projectId}/versions`, form);
}

// Add or edit a version's description after upload
export function updateVersionDescription(projectId, versionId, description) {
  return api.patch(`/api/projects/${projectId}/versions/${versionId}`, { description });
}
