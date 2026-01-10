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
  if (diffMin < 60) return `${diffMin} min${diffMin === 1 ? "" : "s"} ago`;
  if (diffHrs < 24) return `${diffHrs} hr${diffHrs === 1 ? "" : "s"} ago`;
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
  const [markedAsRead, setMarkedAsRead] = useState({
    group: false,
    accepted: false,
  });
  
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
    mutationFn: ({ requestIds, type }) => markFriendNotificationsRead(requestIds, type),
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
  const unreadAcceptedRequests = visibleAccepted.filter(n => !n.read);

  // Auto-mark GROUP notifications as read when viewed
  useEffect(() => {
    if (unreadGroupNotifications.length > 0 && !markedAsRead.group) {
      const timer = setTimeout(() => {
        const unreadIds = unreadGroupNotifications.map(n => n._id);
        markGroupNotificationsReadMutation(unreadIds);
        setMarkedAsRead(prev => ({ ...prev, group: true }));
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [unreadGroupNotifications.length, markedAsRead.group]);

  // Auto-mark ACCEPTED friend requests as read when viewed
  useEffect(() => {
    if (unreadAcceptedRequests.length > 0 && !markedAsRead.accepted) {
      const timer = setTimeout(() => {
        const unreadIds = unreadAcceptedRequests.map(n => n._id);
        markFriendNotificationsReadMutation({ requestIds: unreadIds, type: 'accepted' });
        setMarkedAsRead(prev => ({ ...prev, accepted: true }));
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [unreadAcceptedRequests.length, markedAsRead.accepted]);

  // Reset marked state when leaving page
  useEffect(() => {
    return () => {
      setMarkedAsRead({ group: false, accepted: false });
    };
  }, []);

  const isLoading = loadingFriends || loadingGroups;
  const totalUnread = unreadGroupNotifications.length + unreadAcceptedRequests.length;

  return (
    <div className="min-h-screen bg-base-100  sm:pb-6">
      {/* FIXED: Better responsive container with proper padding */}
      <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6">
        
        {/* FIXED: Better responsive header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
            Notifications
          </h1>
          {totalUnread > 0 && (
            <button
              onClick={() => {
                if (unreadGroupNotifications.length > 0) {
                  markGroupNotificationsReadMutation();
                }
                if (unreadAcceptedRequests.length > 0) {
                  markFriendNotificationsReadMutation({ type: 'accepted' });
                }
              }}
              className="btn btn-ghost btn-xs sm:btn-sm gap-1 sm:gap-2 flex-shrink-0"
            >
              <CheckCircle size={14} className="sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Mark all read</span>
              <span className="xs:hidden">Read</span>
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : (
          <div className="space-y-6 sm:space-y-8">
            {/* INCOMING FRIEND REQUESTS */}
            {incomingRequests.length > 0 && (
              <section className="space-y-3 sm:space-y-4">
                <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2 flex-wrap">
                  <UserCheckIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                  <span>Friend Requests</span>
                  <span className="badge badge-primary badge-sm">
                    {incomingRequests.length}
                  </span>
                </h2>

                <div className="space-y-2 sm:space-y-3">
                  {incomingRequests.map((request) => (
                    <div
                      key={request._id}
                      className="card bg-primary/10 border-2 border-primary/20 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="card-body p-3 sm:p-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          {/* Avatar */}
                          <div className="avatar flex-shrink-0">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-base-300">
                              <img
                                src={request.sender.profilePic}
                                alt={request.sender.fullName}
                              />
                            </div>
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm sm:text-base truncate">
                              {request.sender.fullName}
                            </h3>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {request.sender.nativeLanguages && request.sender.nativeLanguages.length > 0 && (
                                <span className="badge badge-secondary badge-xs sm:badge-sm">
                                  Native: {Array.isArray(request.sender.nativeLanguages) 
                                    ? request.sender.nativeLanguages.join(", ") 
                                    : request.sender.nativeLanguages}
                                </span>
                              )}
                              {request.sender.learningLanguages && request.sender.learningLanguages.length > 0 && (
                                <span className="badge badge-outline badge-xs sm:badge-sm">
                                  Learning: {Array.isArray(request.sender.learningLanguages)
                                    ? request.sender.learningLanguages.join(", ")
                                    : request.sender.learningLanguages}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Accept Button */}
                          <button
                            className="btn btn-primary btn-xs sm:btn-sm flex-shrink-0"
                            onClick={() => acceptRequestMutation(request._id)}
                            disabled={acceptingFriend}
                          >
                            {acceptingFriend ? (
                              <span className="loading loading-spinner loading-xs"></span>
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

            {/* GROUP NOTIFICATIONS */}
            {formattedGroupNotifications.length > 0 && (
              <section className="space-y-3 sm:space-y-4">
                <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2 flex-wrap">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-info flex-shrink-0" />
                  <span>Group Updates</span>
                  {unreadGroupNotifications.length > 0 && (
                    <span className="badge badge-info badge-sm">
                      {unreadGroupNotifications.length}
                    </span>
                  )}
                </h2>

                <div className="space-y-2 sm:space-y-3">
                  {formattedGroupNotifications.map((notification) => (
                    <Link
                      key={notification._id}
                      to={`/groups/${notification.groupId._id}`}
                      className={`card shadow-sm hover:shadow-md transition-all block ${
                        notification.read ? "bg-base-200" : "bg-info/10 border-2 border-info/20"
                      }`}
                    >
                      <div className="card-body p-3 sm:p-4">
                        <div className="flex items-start gap-2 sm:gap-3">
                          {/* Group Avatar */}
                          <div className="avatar flex-shrink-0">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg">
                              <img
                                src={notification.groupId.image}
                                alt={notification.groupId.name}
                              />
                            </div>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm sm:text-base truncate">
                              {notification.groupId.name}
                            </h3>
                            <p className="text-xs sm:text-sm my-1 text-base-content/70">
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

                          {/* Status Badges */}
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            {notification.type === "approved" && (
                              <div className="badge badge-success badge-xs sm:badge-sm whitespace-nowrap">
                                Approved
                              </div>
                            )}
                            {!notification.read && (
                              <div className="w-2 h-2 rounded-full bg-info"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* NEW CONNECTIONS */}
            {visibleAccepted.length > 0 && (
              <section className="space-y-3 sm:space-y-4">
                <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2 flex-wrap">
                  <BellIcon className="h-4 w-4 sm:h-5 sm:w-5 text-success flex-shrink-0" />
                  <span>New Connections</span>
                  {unreadAcceptedRequests.length > 0 && (
                    <span className="badge badge-success badge-sm">
                      {unreadAcceptedRequests.length}
                    </span>
                  )}
                </h2>

                <div className="space-y-2 sm:space-y-3">
                  {visibleAccepted.map((notification) => (
                    <div
                      key={notification._id}
                      className={`card shadow-sm ${
                        notification.read ? "bg-base-200" : "bg-success/10 border-2 border-success/20"
                      }`}
                    >
                      <div className="card-body p-3 sm:p-4">
                        <div className="flex items-start gap-2 sm:gap-3">
                          {/* Avatar */}
                          <div className="avatar flex-shrink-0">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full">
                              <img
                                src={notification.recipient.profilePic}
                                alt={notification.recipient.fullName}
                              />
                            </div>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm sm:text-base truncate">
                              {notification.recipient.fullName}
                            </h3>
                            <p className="text-xs sm:text-sm my-1 text-base-content/70">
                              You are now friends with {notification.recipient.fullName}
                            </p>
                            <p className="text-xs flex items-center text-base-content/60">
                              <ClockIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                              {notification.timeLabel}
                            </p>
                          </div>

                          {/* Badge */}
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <div className="badge badge-success badge-xs sm:badge-sm flex items-center gap-1 whitespace-nowrap">
                              <MessagesSquareIcon className="h-3 w-3" />
                              <span className="hidden sm:inline">New Friend</span>
                            </div>
                            {!notification.read && (
                              <div className="w-2 h-2 rounded-full bg-success"></div>
                            )}
                          </div>
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
              <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center px-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-base-300 flex items-center justify-center mb-3 sm:mb-4">
                  <BellIcon className="w-6 h-6 sm:w-8 sm:h-8 opacity-40" />
                </div>

                <h3 className="text-base sm:text-lg font-semibold mb-2">No notifications yet</h3>
                <p className="text-sm sm:text-base text-base-content/60 max-w-md">
                  When you receive friend requests, group updates, or messages, they'll appear here.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default NotificationsPage;