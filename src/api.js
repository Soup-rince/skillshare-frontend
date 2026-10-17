import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL ||
  (window.location.hostname === "localhost"
    ? "http://localhost:5000/api"
    : "https://skillshare-backend-1qq5.onrender.com/api");

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;

    if (status === 403 && data?.code === "ACCOUNT_SUSPENDED") {
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      localStorage.removeItem("role");
      localStorage.removeItem("userName");

      const isAuthPage = ["/login", "/register"].includes(window.location.pathname);
      if (!isAuthPage) {
        const message = data?.reason
          ? `Your account has been suspended. Reason: ${data.reason}`
          : "Your account has been suspended. Please contact the administrator.";

        window.location.href = `/login?suspended=1&message=${encodeURIComponent(message)}`;
      }
    }

    return Promise.reject(error);
  }
);

export const login = (credentials) => axios.post(`${API_URL}/auth/login`, credentials);

export const sendMessage = (data, token) =>
    axios.post(`${API_URL}/messages`, data, {
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

export const deletePost = (id, data, token) =>
  axios.delete(`${API_URL}/posts/${id}`, {
    data: data || {},
    headers: { Authorization: `Bearer ${token}` }
  });

export const checkAdmin = (token) =>
  axios.get(`${API_URL}/admin/check`, {
    headers: { Authorization: `Bearer ${token}` }
  });

export const checkModerator = (token) =>
  axios.get(`${API_URL}/moderator/check`, {
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

export const unsuspendUser = (id, data, token) =>
  axios.patch(`${API_URL}/admin/users/${id}/unsuspend`, data || {}, {
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

export const uploadPostImage = (formData, token) =>
  axios.post(`${API_URL}/posts/upload`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });

export const forgotPassword = (data) =>
  axios.post(`${API_URL}/auth/forgot-password`, data);

export const resetPassword = (token, data) =>
  axios.post(`${API_URL}/auth/reset-password/${token}`, data);

export const getMyNotifications = (token) =>
  axios.get(`${API_URL}/notifications`, {
    headers: { Authorization: `Bearer ${token}` }
  });

export const getUnreadNotificationCount = (token) =>
  axios.get(`${API_URL}/notifications/unread/count`, {
    headers: { Authorization: `Bearer ${token}` }
  });

export const markNotificationAsRead = (id, token) =>
  axios.patch(`${API_URL}/notifications/${id}/read`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });

export const markAllNotificationsAsRead = (token) =>
  axios.patch(`${API_URL}/notifications/read-all`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });

export const deleteNotification = (id, token) =>
  axios.delete(`${API_URL}/notifications/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

export const editMessage = (id, data, token) =>
  axios.patch(`${API_URL}/messages/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });

export const searchUsers = (q = "", page = 1, limit = 12, token) =>
  axios.get(`${API_URL}/users/search`, {
    params: { q, page, limit },
    headers: { Authorization: `Bearer ${token}` },
  });

export const deleteMessage = (id, token) =>
  axios.delete(`${API_URL}/messages/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

export const getSuperAdminStats = (token) =>
  axios.get(`${API_URL}/superadmin/stats`, {
    headers: { Authorization: `Bearer ${token}` }
  });

export const getAllAdmins = (token) =>
  axios.get(`${API_URL}/superadmin/admins`, {
    headers: { Authorization: `Bearer ${token}` }
  });

export const getAllSuperAdmins = (token) =>
  axios.get(`${API_URL}/superadmin/superadmins`, {
    headers: { Authorization: `Bearer ${token}` }
  });

export const promoteToSuperAdmin = (id, data, token) =>
  axios.patch(`${API_URL}/superadmin/admins/${id}/promote`, data || {}, {
    headers: { Authorization: `Bearer ${token}` }
  });

export const demoteFromSuperAdmin = (id, data, token) =>
  axios.patch(`${API_URL}/superadmin/superadmins/${id}/demote`, data || {}, {
    headers: { Authorization: `Bearer ${token}` }
  });

export const verifyCode = (email, code) =>
  axios.post(`${API_URL}/auth/verify-code`, { email, code });

export const resendVerification = (email) =>
  axios.post(`${API_URL}/auth/resend-verification`, { email });

export const getAuditLogs = (params, token) =>
  axios.get(`${API_URL}/superadmin/audit-logs`, {
    params,
    headers: { Authorization: `Bearer ${token}` }
  });

export const exportAuditLogs = (params, token) =>
  axios.get(`${API_URL}/superadmin/audit-logs/export`, {
    params,
    responseType: "blob",
    headers: { Authorization: `Bearer ${token}` }
  });

export const getMyActivity = (params, token) =>
  axios.get(`${API_URL}/superadmin/my-activity`, {
    params,
    headers: { Authorization: `Bearer ${token}` }
  });

export const exportMyActivity = (params, token) =>
  axios.get(`${API_URL}/superadmin/my-activity/export`, {
    params,
    responseType: "blob",
    headers: { Authorization: `Bearer ${token}` }
  });

export const getActiveAnnouncement = (token) =>
  axios.get(`${API_URL}/announcements/active`, {
    headers: { Authorization: `Bearer ${token}` }
  });

export const dismissAnnouncement = (id, token) =>
  axios.post(`${API_URL}/announcements/${id}/dismiss`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });

export const getAllAnnouncements = (token) =>
  axios.get(`${API_URL}/announcements/all`, {
    headers: { Authorization: `Bearer ${token}` }
  });

export const createAnnouncement = (data, token) =>
  axios.post(`${API_URL}/announcements`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });

export const updateAnnouncement = (id, data, token) =>
  axios.patch(`${API_URL}/announcements/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });

export const toggleAnnouncement = (id, token) =>
  axios.patch(`${API_URL}/announcements/${id}/toggle`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });

export const deleteAnnouncement = (id, token) =>
  axios.delete(`${API_URL}/announcements/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

export const getModeratorReports = (params, token) =>
  axios.get(`${API_URL}/moderator/reports`, {
    params,
    headers: { Authorization: `Bearer ${token}` }
  });

export const updateModeratorReportStatus = (id, data, token) =>
  axios.patch(`${API_URL}/moderator/reports/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });

export const getModeratorMyActivity = (params, token) =>
  axios.get(`${API_URL}/moderator/my-activity`, {
    params,
    headers: { Authorization: `Bearer ${token}` }
  });

export const exportModeratorMyActivity = (params, token) =>
  axios.get(`${API_URL}/moderator/my-activity/export`, {
    params,
    responseType: "blob",
    headers: { Authorization: `Bearer ${token}` }
  });

export const getAllModerators = (token) =>
  axios.get(`${API_URL}/superadmin/moderators`, {
    headers: { Authorization: `Bearer ${token}` }
  });

export const getAdminAuditLogs = (params, token) =>
  axios.get(`${API_URL}/superadmin/admin-audit-logs`, {
    params,
    headers: { Authorization: `Bearer ${token}` }
  });

export const exportAdminAuditLogs = (params, token) =>
  axios.get(`${API_URL}/superadmin/admin-audit-logs/export`, {
    params,
    responseType: "blob",
    headers: { Authorization: `Bearer ${token}` }
  });

export const suspendModerator = (id, data, token) =>
  axios.patch(`${API_URL}/superadmin/moderators/${id}/suspend`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });

export const unsuspendModerator = (id, data, token) =>
  axios.patch(`${API_URL}/superadmin/moderators/${id}/unsuspend`, data || {}, {
    headers: { Authorization: `Bearer ${token}` }
  });

export const suspendAdmin = (id, data, token) =>
  axios.patch(`${API_URL}/superadmin/admins/${id}/suspend`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });

export const unsuspendAdmin = (id, data, token) =>
  axios.patch(`${API_URL}/superadmin/admins/${id}/unsuspend`, data || {}, {
    headers: { Authorization: `Bearer ${token}` }
  });

  export const createUserReport = (data, token) =>
  axios.post(`${API_URL}/reports/user`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });

  export const getEscalatedReports = (token) =>
  axios.get(`${API_URL}/admin/users/escalated-reports`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  export const acceptTerms = (data) =>
  axios.post(`${API_URL}/auth/accept-terms`, data);