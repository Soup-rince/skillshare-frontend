import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL ||
  (window.location.hostname === "localhost"
    ? "http://localhost:5000/api"
    : "https://skillshare-backend-1qq5.onrender.com/api");

//Auth
export const login = (credentials) => axios.post(`${API_URL}/auth/login`, credentials);

//Messages (need token, to pass per request) and every endpoints wrapped with axios call
export const sendMessage = (data, token) =>
    axios.post(`${API_URL}/messages`, data, { //API_URL will match the express server PORT
        headers: {Authorization: `Bearer ${token}`}
    });

export const getConversation = (userId, token) =>
    axios.get(`${API_URL}/messages/${userId}`, {
        headers: {Authorization:`Bearer ${token}`}
    });

export const getInbox = (token) =>
     axios.get(`${API_URL}/messages/inbox`, {
        headers: { Authorization: `Bearer ${token}` }
     });

export const uploadMedia = (formData, token) =>
  axios.post(`${API_URL}/messages/upload`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });
    
export const getSkillPosts = (params) =>
  axios.get(`${API_URL}/posts`, { params });

export const getPostById = (id) => axios.get(`${API_URL}/posts/${id}`);

export const getUserProfile = (id, token) =>
  axios.get(`${API_URL}/users/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

export const getDashboard = (token) =>
  axios.get(`${API_URL}/dashboard`, {
    headers: { Authorization: `Bearer ${token}` }
  });

export const createPost = (data, token) =>
  axios.post(`${API_URL}/posts`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });

export const updatePost = (id, data, token) =>
  axios.patch(`${API_URL}/posts/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });

export const deletePost = (id, token) =>
  axios.delete(`${API_URL}/posts/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

export const checkAdmin = (token) =>
  axios.get(`${API_URL}/admin/check`, {
    headers: { Authorization: `Bearer ${token}` }
  });

export const updateProfile = (data, token) =>
  axios.patch(`${API_URL}/users/me/update`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });

export const markWelcomeSeen = (token) =>
  axios.patch(`${API_URL}/users/me/welcome-seen`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });

  export const createReview = (data, token) =>
  axios.post(`${API_URL}/reviews`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });

export const getUserReviews = (userId, token) =>
  axios.get(`${API_URL}/reviews/user/${userId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

export const getMyReviewForUser = (userId, token) =>
  axios.get(`${API_URL}/reviews/me/for/${userId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

export const createExchange = (data, token) =>
  axios.post(`${API_URL}/exchanges`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });

export const confirmExchange = (id, token) =>
  axios.patch(`${API_URL}/exchanges/${id}/confirm`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });

export const getExchangeWith = (userId, token) =>
  axios.get(`${API_URL}/exchanges/with/${userId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  export const getMatches = (token) =>
  axios.get(`${API_URL}/match`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  export const createReport = (data, token) =>
  axios.post(`${API_URL}/reports`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });

export const getReports = (params, token) =>
  axios.get(`${API_URL}/reports`, {
    params,
    headers: { Authorization: `Bearer ${token}` }
  });

export const updateReportStatus = (id, data, token) =>
  axios.patch(`${API_URL}/reports/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });

export const getPendingReportCount = (token) =>
  axios.get(`${API_URL}/reports/pending/count`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  export const getAllUsers = (params, token) =>
  axios.get(`${API_URL}/admin/users`, {
    params,
    headers: { Authorization: `Bearer ${token}` }
  });

export const suspendUser = (id, data, token) =>
  axios.patch(`${API_URL}/admin/users/${id}/suspend`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });

export const unsuspendUser = (id, token) =>
  axios.patch(`${API_URL}/admin/users/${id}/unsuspend`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });

export const changeUserRole = (id, data, token) =>
  axios.patch(`${API_URL}/admin/users/${id}/role`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });

  export const getVapidPublicKey = () =>
  axios.get(`${API_URL}/push/vapid-public-key`);

export const subscribePush = (subscription, token) =>
  axios.post(`${API_URL}/push/subscribe`, { subscription }, {
    headers: { Authorization: `Bearer ${token}` }
  });

export const unsubscribePush = (token) =>
  axios.post(`${API_URL}/push/unsubscribe`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });