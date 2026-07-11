import { api } from './client';

export function listVersions(projectId) {
  return api.get(`/api/projects/${projectId}/versions`);
}

// 'file' matches what multer expects on backend (upload.single('file'))
// edits are the optional section marks, JSON since multipart fields are strings
export function uploadVersion(projectId, file, description, edits) {
  const form = new FormData();
  form.append('file', file);
  if (description) form.append('description', description);
  if (edits?.length) form.append('edits', JSON.stringify(edits));
  return api.post(`/api/projects/${projectId}/versions`, form);
}

// Add or edit a version's description after upload
export function updateVersionDescription(projectId, versionId, description) {
  return api.patch(`/api/projects/${projectId}/versions/${versionId}`, { description });
}
