import { axiosInstance } from "./axios";

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

// ---- FRIENDS API ----
export const getUserFriends = async () => {
  const res = await axiosInstance.get("/users/friends");
  return res.data;   // NOT res.data.friends
};


export async function getRecommendedUsers() {
  const response = await axiosInstance.get("/users");
  return response.data.users || response.data || [];
}

export async function getOutgoingFriendsReqs() {
  const response = await axiosInstance.get("/users/outgoing-friend-requests");
  return response.data.outgoingRequests || response.data || [];
}

export async function sendFriendReqests(userId) {
  const response = await axiosInstance.post(`/users/friend-requests/${userId}`);
  return response.data;
}

export async function getFriendReqests() {
  const response = await axiosInstance.get("users/friend-requests");
  return response.data;
}


export async function acceptFriendRequest(requestId) {
  const response = await axiosInstance.put(`/users/friend-requests/${requestId}/accept`);
  return response.data;
}

export async function getStreamToken() {
  const res = await axiosInstance.get("/chat/token");
  return res.data;
}

// -------- GROUP CHAT API ---------

// Create a new group
export async function createGroup(groupData) {
  const res = await axiosInstance.post("/groups/create", groupData);
  return res.data;
}

// Get all public groups
export async function getAllGroups() {
  const res = await axiosInstance.get("/groups/all");
  return res.data;
}

// Get user's groups
export async function getUserGroups() {
  const res = await axiosInstance.get("/groups/my-groups");
  return res.data;
}

// Get group details
export async function getGroupDetails(groupId) {
  const res = await axiosInstance.get(`/groups/${groupId}`);
  return res.data;
}

// Request to join group
export async function requestJoinGroup(groupId) {
  const res = await axiosInstance.post(`/groups/${groupId}/request-join`);
  return res.data;
}

// Approve join request (admin)
export async function approveJoinRequest(groupId, userId) {
  const res = await axiosInstance.post(`/groups/${groupId}/approve/${userId}`);
  return res.data;
}

// Reject join request (admin)
export async function rejectJoinRequest(groupId, userId) {
  const res = await axiosInstance.post(`/groups/${groupId}/reject/${userId}`);
  return res.data;
}

// Remove member (admin)
export async function removeMember(groupId, userId) {
  const res = await axiosInstance.delete(`/groups/${groupId}/members/${userId}`);
  return res.data;
}

// Make user admin (creator)
export async function makeAdmin(groupId, userId) {
  const res = await axiosInstance.post(`/groups/${groupId}/make-admin/${userId}`);
  return res.data;
}

// Leave group
export async function leaveGroup(groupId) {
  const res = await axiosInstance.post(`/groups/${groupId}/leave`);
  return res.data;
}

// Delete group (creator)
export async function deleteGroup(groupId) {
  const res = await axiosInstance.delete(`/groups/${groupId}`);
  return res.data;
}

// Update group details (admin)
export async function updateGroup(groupId, updateData) {
  const res = await axiosInstance.patch(`/groups/${groupId}`, updateData);
  return res.data;
}

// Upload group image
export async function uploadGroupImage(file) {
  const formData = new FormData();
  formData.append("image", file);

  const res = await axiosInstance.post("/upload/group-image", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
}

// Get group notifications
export async function getGroupNotifications() {
  const res = await axiosInstance.get("/groups/notifications/all");
  return res.data;
}

// Mark group notifications as read
export async function markGroupNotificationsRead(notificationIds) {
  const res = await axiosInstance.patch("/groups/notifications/read", {
    notificationIds
  });
  return res.data;
}
// Mark friend notifications as read
export async function markFriendNotificationsRead(requestIds, type) {
  const res = await axiosInstance.patch("/users/friend-notifications/read", {
    requestIds,
    type
  });
  return res.data;
}

// Get unread group notification count
export async function getUnreadGroupNotificationCount() {
  const res = await axiosInstance.get("/groups/notifications/unread-count");
  return res.data;
}

// Add member directly to group (admin only)
export async function addMemberDirectly(groupId, userId) {
  const res = await axiosInstance.post(`/groups/${groupId}/add-member`, { userId });
  return res.data;
}

// Get friends available to add to group
export async function getAvailableFriendsForGroup(groupId) {
  const res = await axiosInstance.get(`/groups/${groupId}/available-friends`);
  return res.data;
}

export async function updateProfile(data) {
  const res = await fetch("/api/user/update-profile", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to update profile");
  }

  return res.json();
}