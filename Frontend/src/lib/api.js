import { axiosInstance } from "./axios";

// ============================================
// AUTHENTICATION API
// ============================================

export const signup = async (signupData) => {
  const response = await axiosInstance.post("/auth/signup", signupData);
  return response.data;
};

export const login = async (loginData) => {
  const response = await axiosInstance.post("/auth/login", loginData);
  return response.data;
};

export const logout = async () => {
  const response = await axiosInstance.post("/auth/logout");
  return response.data;
};

export const getAuthUser = async () => {
  try {
    const res = await axiosInstance.get("/auth/me");
    return res.data;
  } catch (error) {
    console.log("Error in getAuthUser", error);
    return null;
  }
};

export const completeOnboarding = async (userData) => {
  const res = await axiosInstance.post("/auth/onboarding", userData);
  return res.data;
};

// ============================================
// USER & FRIENDS API
// ============================================

export const getUserFriends = async () => {
  const res = await axiosInstance.get("/users/friends");
  return res.data;
};

export const getRecommendedUsers = async () => {
  const response = await axiosInstance.get("/users");
  return response.data.users || response.data || [];
};

export const getOutgoingFriendsReqs = async () => {
  const response = await axiosInstance.get("/users/outgoing-friend-requests");
  return response.data.outgoingRequests || response.data || [];
};

export const sendFriendReqests = async (userId) => {
  const response = await axiosInstance.post(`/users/friend-requests/${userId}`);
  return response.data;
};

export const getFriendReqests = async () => {
  const response = await axiosInstance.get("/users/friend-requests");
  return response.data;
};

export const acceptFriendRequest = async (requestId) => {
  const response = await axiosInstance.put(`/users/friend-requests/${requestId}/accept`);
  return response.data;
};

export const updateProfile = async (data) => {
  const res = await axiosInstance.put("/users/update-profile", data);
  return res.data;
};

export const getUserProfile = async (userId) => {
  const response = await axiosInstance.get(`/users/${userId}/profile`);
  return response.data;
};

export const markFriendNotificationsRead = async (requestIds, type) => {
  const res = await axiosInstance.patch("/users/friend-notifications/read", {
    requestIds,
    type
  });
  return res.data;
};

// ============================================
// STREAM CHAT API
// ============================================

export const getStreamToken = async () => {
  const res = await axiosInstance.get("/chat/token");
  return res.data;
};

// ============================================
// GROUP CHAT API - BASIC OPERATIONS
// ============================================

export const createGroup = async (groupData) => {
  const res = await axiosInstance.post("/groups/create", groupData);
  return res.data;
};

export const getAllGroups = async () => {
  const res = await axiosInstance.get("/groups/all");
  return res.data;
};

export const getUserGroups = async () => {
  const res = await axiosInstance.get("/groups/my-groups");
  return res.data;
};

export const getGroupDetails = async (groupId) => {
  const res = await axiosInstance.get(`/groups/${groupId}`);
  return res.data;
};

export const updateGroup = async (groupId, updateData) => {
  const res = await axiosInstance.patch(`/groups/${groupId}`, updateData);
  return res.data;
};

export const deleteGroup = async (groupId) => {
  const res = await axiosInstance.delete(`/groups/${groupId}`);
  return res.data;
};

// ============================================
// GROUP CHAT API - MEMBERSHIP
// ============================================

export const requestJoinGroup = async (groupId) => {
  const res = await axiosInstance.post(`/groups/${groupId}/request-join`);
  return res.data;
};

export const approveJoinRequest = async (groupId, userId) => {
  const res = await axiosInstance.post(`/groups/${groupId}/approve/${userId}`);
  return res.data;
};

export const rejectJoinRequest = async (groupId, userId) => {
  const res = await axiosInstance.post(`/groups/${groupId}/reject/${userId}`);
  return res.data;
};

export const addMemberDirectly = async (groupId, userId) => {
  const res = await axiosInstance.post(`/groups/${groupId}/add-member`, { userId });
  return res.data;
};

export const removeMember = async (groupId, userId) => {
  const res = await axiosInstance.delete(`/groups/${groupId}/members/${userId}`);
  return res.data;
};

export const makeAdmin = async (groupId, userId) => {
  const res = await axiosInstance.post(`/groups/${groupId}/make-admin/${userId}`);
  return res.data;
};

export const leaveGroup = async (groupId) => {
  const res = await axiosInstance.post(`/groups/${groupId}/leave`);
  return res.data;
};

export const getAvailableFriendsForGroup = async (groupId) => {
  const res = await axiosInstance.get(`/groups/${groupId}/available-friends`);
  return res.data.friends || res.data || [];
};

// ============================================
// GROUP CHAT API - NOTIFICATIONS
// ============================================

export const getGroupNotifications = async () => {
  const res = await axiosInstance.get("/groups/notifications/all");
  return res.data;
};

export const markGroupNotificationsRead = async (notificationIds) => {
  const res = await axiosInstance.patch("/groups/notifications/read", {
    notificationIds
  });
  return res.data;
};

export const getUnreadGroupNotificationCount = async () => {
  const res = await axiosInstance.get("/groups/notifications/unread-count");
  return res.data;
};

// ============================================
// GROUP CHAT API - PINNED MESSAGES
// ============================================

export const pinMessage = async (groupId, messageId) => {
  const response = await axiosInstance.post(
    `/groups/${groupId}/messages/${messageId}/pin`
  );
  return response.data;
};

export const unpinMessage = async (groupId, messageId) => {
  const response = await axiosInstance.delete(
    `/groups/${groupId}/messages/${messageId}/pin`
  );
  return response.data;
};

export const getPinnedMessages = async (groupId) => {
  const response = await axiosInstance.get(
    `/groups/${groupId}/pinned-messages`
  );
  return response.data;
};

// ============================================
// GROUP CHAT API - ACTIVITY TIMELINE
// ============================================

export const getGroupActivity = async (groupId, limit = 20, offset = 0) => {
  const response = await axiosInstance.get(
    `/groups/${groupId}/activity?limit=${limit}&offset=${offset}`
  );
  return response.data;
};

// ============================================
// GROUP CHAT API - QUICK ACTIONS
// ============================================

export const scheduleVideoSession = async (groupId, sessionData) => {
  const response = await axiosInstance.post(
    `/groups/${groupId}/sessions`,
    sessionData
  );
  return response.data;
};

export const createPoll = async (groupId, pollData) => {
  const response = await axiosInstance.post(
    `/groups/${groupId}/polls`,
    pollData
  );
  return response.data;
};

export const votePoll = async (groupId, pollId, optionId) => {
  const response = await axiosInstance.post(
    `/groups/${groupId}/polls/${pollId}/vote`,
    { optionId }
  );
  return response.data;
};

export const setPracticeGoal = async (groupId, goalData) => {
  const response = await axiosInstance.post(
    `/groups/${groupId}/goals`,
    goalData
  );
  return response.data;
};

// ============================================
// UPLOAD API
// ============================================

export const uploadGroupImage = async (file) => {
  const formData = new FormData();
  formData.append("image", file);

  const res = await axiosInstance.post("/upload/group-image", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

// ============================================
// MATCHING API
// ============================================

export const getRecommendedPartners = async (limit = 10) => {
  const res = await axiosInstance.get(`/matching/partners?limit=${limit}`);
  return res.data;
};

export const getCompatibilityWithUser = async (userId) => {
  const res = await axiosInstance.get(`/matching/compatibility/${userId}`);
  return res.data;
};

export const getMatchExplanation = async (userId) => {
  const res = await axiosInstance.get(`/matching/explanation/${userId}`);
  return res.data;
};

export const refreshMatches = async () => {
  const res = await axiosInstance.post("/matching/refresh");
  return res.data;
};

// ============================================
// PRACTICE API
// ============================================

export const getPracticeStats = async () => {
  const res = await axiosInstance.get("/practice/stats");
  return res.data;
};

export const recordPractice = async (data) => {
  const res = await axiosInstance.post("/practice/record", data);
  return res.data;
};