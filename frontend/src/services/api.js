import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// User API
export const userApi = {
  create: (data) => api.post('/users', data),
  getById: (id) => api.get(`/users/${id}`),
  getByUsername: (username) => api.get(`/users/username/${username}`),
  getAll: () => api.get('/users'),
  search: (query) => api.get(`/users/search?query=${query}`),
  updateStatus: (id, status) => api.put(`/users/${id}/status`, { status }),
  update: (id, data) => api.put(`/users/${id}`, data),
};

// Conversation API
export const conversationApi = {
  getUserConversations: (userId) => api.get(`/conversations/${userId}`),
  getById: (conversationId) => api.get(`/conversations/detail/${conversationId}`),
  createPrivate: (user1Id, user2Id) =>
    api.post('/conversations/private', { user1Id, user2Id }),
  markAsRead: (conversationId, userId) =>
    api.put(`/conversations/${conversationId}/read`, { userId }),
};

// Message API
export const messageApi = {
  getMessages: (conversationId, page = 0, size = 50) =>
    api.get(`/messages/${conversationId}?page=${page}&size=${size}`),
};

// Group API
export const groupApi = {
  create: (name, creatorId, memberIds) =>
    api.post('/groups', { name, creatorId, memberIds }),
  getById: (groupId) => api.get(`/groups/${groupId}`),
  getUserGroups: (userId) => api.get(`/groups/user/${userId}`),
  addMember: (groupId, userId) =>
    api.post(`/groups/${groupId}/members`, { userId }),
  removeMember: (groupId, userId, requesterId) =>
    api.delete(`/groups/${groupId}/members/${userId}?requesterId=${requesterId}`),
};

// Health check
export const healthCheck = () => api.get('/health');

export default api;
