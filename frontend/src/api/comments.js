import { api } from './client';

export function listComments(projectId, versionId) {
  return api.get(`/api/projects/${projectId}/versions/${versionId}/comments`);
}

export function createComment(projectId, versionId, comment) {
  return api.post(`/api/projects/${projectId}/versions/${versionId}/comments`, comment);
}

export function updateComment(projectId, versionId, commentId, body) {
  return api.patch(`/api/projects/${projectId}/versions/${versionId}/comments/${commentId}`, { body });
}

export function deleteComment(projectId, versionId, commentId) {
  return api.del(`/api/projects/${projectId}/versions/${versionId}/comments/${commentId}`);
}
