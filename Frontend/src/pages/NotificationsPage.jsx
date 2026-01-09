import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  getFriendReqests, 
  acceptFriendRequest,
  getGroupNotifications,
  markGroupNotificationsRead,
  markFriendNotificationsRead
} from "../lib/api";
import {
  UserCheckIcon,
  BellIcon,
  ClockIcon,
  MessagesSquareIcon,
  Users,
  CheckCircle,
} from "lucide-react";
import { Link } from "react-router";

// Format time function
function formatTime(timestamp) {
  if (!timestamp) return "Recently";

  const now = Date.now();
  const diffMs = now - new Date(timestamp).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffMs / (1000 * 60));
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
  if (diffHrs < 24) return `${diffHrs} hour${diffHrs === 1 ? "" : "s"} ago`;
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} month${months === 1 ? "" : "s"} ago`;
  }
  const years = Math.floor(diffDays / 365);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}

function NotificationsPage() {
  const queryClient = useQueryClient();
  
  const { data: friendRequests, isLoading: loadingFriends } = useQuery({
    queryKey: ["friendRequests"],
    queryFn: getFriendReqests,
  });

  const { data: groupNotificationsData, isLoading: loadingGroups } = useQuery({
    queryKey: ["groupNotifications"],
    queryFn: getGroupNotifications,
  });

  const { mutate: acceptRequestMutation, isPending: acceptingFriend } = useMutation({
    mutationFn: acceptFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
  });

  const { mutate: markGroupNotificationsReadMutation } = useMutation({
    mutationFn: markGroupNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groupNotifications"] });
    },
  });

  const { mutate: markFriendNotificationsReadMutation } = useMutation({
    mutationFn: markFriendNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
    },
  });

  const incomingRequests = friendRequests?.incomingReqs || [];
  const acceptedRequests = friendRequests?.acceptedReqs || [];
  const groupNotifications = groupNotificationsData?.notifications || [];

  // Re-render every minute for live time updates
  const [, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // All accepted requests are visible
  const visibleAccepted = acceptedRequests.map((n) => ({
    ...n,
    timeLabel: formatTime(n.updatedAt || n.createdAt),
  }));

  // Format group notifications
  const formattedGroupNotifications = groupNotifications.map((n) => ({
    ...n,
    timeLabel: formatTime(n.createdAt),
  }));

  const unreadGroupNotifications = formattedGroupNotifications.filter(n => !n.read);
  const unreadFriendNotifications = visibleAccepted.filter(n => !n.read);

  // Auto-mark notifications as read when page loads
  useEffect(() => {
    // Mark unread group notifications as read after 2 seconds
    if (unreadGroupNotifications.length > 0) {
      const timer = setTimeout(() => {
        const unreadIds = unreadGroupNotifications.map(n => n._id);
        markGroupNotificationsReadMutation(unreadIds);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [groupNotifications.length]); // Only run when notifications change

  // Mark friend notifications as read
  useEffect(() => {
    if (unreadFriendNotifications.length > 0) {
      const timer = setTimeout(() => {
        const unreadIds = unreadFriendNotifications.map(n => n._id);
        markFriendNotificationsReadMutation(unreadIds);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [acceptedRequests.length]);

  const isLoading = loadingFriends || loadingGroups;

  return (
    <div className="min-h-screen bg-base-100 px-4 sm:px-6 lg:px-8 py-6 pb-20 lg:pb-6">
      <div className="container mx-auto max-w-4xl space-y-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Notifications
          </h1>
          {(unreadGroupNotifications.length > 0 || unreadFriendNotifications.length > 0) && (
            <button
              onClick={() => {
                if (unreadGroupNotifications.length > 0) {
                  markGroupNotificationsReadMutation();
                }
                if (unreadFriendNotifications.length > 0) {
                  markFriendNotificationsReadMutation();
                }
              }}
              className="btn btn-ghost btn-sm gap-2"
            >
              <CheckCircle size={16} />
              Mark all read
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : (
          <>
            {/* GROUP NOTIFICATIONS */}
            {formattedGroupNotifications.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Users className="h-5 w-5 text-info" />
                  Group Updates
                  {unreadGroupNotifications.length > 0 && (
                    <span className="badge badge-info ml-2">
                      {unreadGroupNotifications.length}
                    </span>
                  )}
                </h2>

                <div className="space-y-3">
                  {formattedGroupNotifications.map((notification) => (
                    <Link
                      key={notification._id}
                      to={`/groups/${notification.groupId._id}`}
                      className={`card shadow-sm hover:shadow-md transition-all ${
                        notification.read ? "bg-base-200" : "bg-info/10 border-2 border-info/20"
                      }`}
                    >
                      <div className="card-body p-4">
                        <div className="flex items-start gap-3">
                          <div className="avatar">
                            <div className="w-10 h-10 rounded-lg">
                              <img
                                src={notification.groupId.image}
                                alt={notification.groupId.name}
                              />
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm md:text-base truncate">
                              {notification.groupId.name}
                            </h3>
                            <p className="text-xs md:text-sm my-1 text-base-content/70">
                              {notification.type === "approved" && (
                                <>🎉 Your request to join has been approved! You can now chat with the group.</>
                              )}
                              {notification.type === "rejected" && (
                                <>Your request to join was declined.</>
                              )}
                              {notification.type === "removed" && (
                                <>You were removed from the group.</>
                              )}
                            </p>
                            <p className="text-xs flex items-center text-base-content/60">
                              <ClockIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                              {notification.timeLabel}
                            </p>
                          </div>

                          {notification.type === "approved" && (
                            <div className="badge badge-success badge-sm flex-shrink-0">
                              Approved
                            </div>
                          )}
                          {!notification.read && (
                            <div className="w-2 h-2 rounded-full bg-info flex-shrink-0 mt-2"></div>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* INCOMING FRIEND REQUESTS */}
            {incomingRequests.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <UserCheckIcon className="h-5 w-5 text-primary" />
                  Friend Requests
                  <span className="badge badge-primary ml-2">
                    {incomingRequests.length}
                  </span>
                </h2>

                <div className="space-y-3">
                  {incomingRequests.map((request) => (
                    <div
                      key={request._id}
                      className="card bg-base-200 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="card-body p-4">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                          <div className="flex items-center gap-3">
                            <div className="avatar">
                              <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-base-300">
                                <img
                                  src={request.sender.profilePic}
                                  alt={request.sender.fullName}
                                />
                              </div>
                            </div>
                            <div>
                              <h3 className="font-semibold text-sm md:text-base">
                                {request.sender.fullName}
                              </h3>
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                {request.sender.nativeLanguages && (
                                  <span className="badge badge-secondary badge-sm">
                                    Native: {request.sender.nativeLanguages}
                                  </span>
                                )}
                                {request.sender.learningLanguages && (
                                  <span className="badge badge-outline badge-sm">
                                    Learning: {request.sender.learningLanguages}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => acceptRequestMutation(request._id)}
                            disabled={acceptingFriend}
                          >
                            {acceptingFriend ? (
                              <>
                                <span className="loading loading-spinner loading-xs"></span>
                                Accepting...
                              </>
                            ) : (
                              "Accept"
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* NEW CONNECTIONS */}
            {visibleAccepted.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <BellIcon className="h-5 w-5 text-success" />
                  New Connections
                  {unreadFriendNotifications.length > 0 && (
                    <span className="badge badge-success ml-2">
                      {unreadFriendNotifications.length}
                    </span>
                  )}
                </h2>

                <div className="space-y-3">
                  {visibleAccepted.map((notification) => (
                    <div
                      key={notification._id}
                      className={`card shadow-sm ${
                        notification.read ? "bg-base-200" : "bg-success/10 border-2 border-success/20"
                      }`}
                    >
                      <div className="card-body p-4">
                        <div className="flex items-start gap-3">
                          <div className="avatar">
                            <div className="w-10 h-10 rounded-full">
                              <img
                                src={notification.recipient.profilePic}
                                alt={notification.recipient.fullName}
                              />
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm md:text-base truncate">
                              {notification.recipient.fullName}
                            </h3>
                            <p className="text-xs md:text-sm my-1 text-base-content/70">
                              You are now friends with {notification.recipient.fullName}
                            </p>
                            <p className="text-xs flex items-center text-base-content/60">
                              <ClockIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                              {notification.timeLabel}
                            </p>
                          </div>

                          <div className="badge badge-success badge-sm flex-shrink-0">
                            <MessagesSquareIcon className="h-3 w-3 mr-1" />
                            New Friend
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 rounded-full bg-success flex-shrink-0 mt-2"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* EMPTY STATE */}
            {incomingRequests.length === 0 && 
             visibleAccepted.length === 0 && 
             formattedGroupNotifications.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-base-300 flex items-center justify-center mb-4">
                  <BellIcon className="w-8 h-8 opacity-40" />
                </div>

                <h3 className="text-lg font-semibold mb-2">No notifications yet</h3>
                <p className="text-base-content/60">
                  When you receive friend requests, group updates, or messages, they'll appear here.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default NotificationsPage;