import axios from "axios";

const API_URL = "http://localhost:5000/api";

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