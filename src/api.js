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