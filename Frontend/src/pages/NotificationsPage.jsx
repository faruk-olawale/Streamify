import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getFriendReqests, acceptFriendRequest } from "../lib/api";
import {
  UserCheckIcon,
  BellIcon,
  ClockIcon,
  MessagesSquareIcon,
} from "lucide-react";

// Format time since a timestamp
function formatTime(timestamp) {
  if (!timestamp) return "Recently";

  const now = Date.now();
  const diffMs = now - new Date(timestamp).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffMs / (1000 * 60));
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffSec < 60) return "Recently"; // 0–59 sec
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
  if (diffHrs < 24) return `${diffHrs} hour${diffHrs === 1 ? "" : "s"} ago`;
  if (diffHrs < 30) return "1 day ago"; // 24–30 hours
  return null; // Remove after ~30 hours
}

function NotificationsPage() {
  const queryClient = useQueryClient();
  const { data: friendRequests, isLoading } = useQuery({
    queryKey: ["friendRequests"],
    queryFn: getFriendReqests,
  });

  const { mutate: acceptRequestMutation, isPending } = useMutation({
    mutationFn: acceptFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
  });

  const incomingRequests = friendRequests?.incomingReqs || [];
  const acceptedRequests = friendRequests?.acceptedReqs || [];

  // Re-render every minute for live time updates
  const [, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter accepted requests that are still visible
  const visibleAccepted = acceptedRequests
    .map((n) => ({ ...n, timeLabel: formatTime(n.updatedAt || n.createdAt) }))
    .filter((n) => n.timeLabel !== null);

  return (
    <div className="min-h-screen bg-base-100 px-4 sm:px-6 lg:px-8 py-6">
      <div className="container mx-auto max-w-4xl space-y-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6">
          Notifications
        </h1>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <span className="loading-spinner loading-lg"></span>
          </div>
        ) : (
          <>
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
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="avatar">
                              <div className="w-14 rounded-full bg-base-300">
                                <img
                                  src={request.sender.profilePic}
                                  alt={request.sender.fullName}
                                />
                              </div>
                            </div>
                            <div>
                              <h3 className="font-semibold">{request.sender.fullName}</h3>
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                {request.sender.nativeLanguages && (
                                  <span className="badge badge-secondary badge-sm">
                                    Native:{" "}
                                    {Array.isArray(request.sender.nativeLanguages)
                                      ? request.sender.nativeLanguages.join(", ")
                                      : request.sender.nativeLanguages}
                                  </span>
                                )}
                                {request.sender.learningLanguages && (
                                  <span className="badge badge-outline badge-sm">
                                    Learning:{" "}
                                    {Array.isArray(request.sender.learningLanguages)
                                      ? request.sender.learningLanguages.join(", ")
                                      : request.sender.learningLanguages}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => acceptRequestMutation(request._id)}
                            disabled={isPending}
                          >
                            {isPending ? "Accepting..." : "Accept"}
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
                </h2>

                <div className="space-y-3">
                  {visibleAccepted.map((notification) => (
                    <div
                      key={notification._id}
                      className="card bg-base-200 shadow-sm"
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

                          <div className="flex-1">
                            <h3 className="font-semibold">{notification.recipient.fullName}</h3>
                            <p className="text-sm my-1">
                              You are now friends with {notification.recipient.fullName}
                            </p>
                            <p className="text-xs flex items-center opacity-70">
                              <ClockIcon className="h-3 w-3 mr-1" />
                              {notification.timeLabel}
                            </p>
                          </div>

                          <div className="badge badge-success">
                            <MessagesSquareIcon className="h-3 w-3 mr-1" />
                            New Friend
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* EMPTY STATE */}
            {incomingRequests.length === 0 && visibleAccepted.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="size-16 rounded-full bg-base-300 flex items-center justify-center mb-4">
                  <BellIcon className="size-8 opacity-40" />
                </div>

                <h3 className="text-lg font-semibold mb-2">No notifications yet</h3>
                <p className="opacity-70">
                  When you receive friend requests or messages, they'll appear here.
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
