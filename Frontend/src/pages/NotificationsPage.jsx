import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getFriendReqests,
  acceptFriendRequest,
  getGroupNotifications,
  markGroupNotificationsRead,
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

function formatTime(timestamp) {
  if (!timestamp) return "Recently";

  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);

  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  if (hrs < 24) return `${hrs} hr ago`;
  if (days < 7) return `${days} days ago`;
  return new Date(timestamp).toLocaleDateString();
}

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [, forceUpdate] = useState(Date.now());

  const { data: friendRequests, isLoading: loadingFriends } = useQuery({
    queryKey: ["friendRequests"],
    queryFn: getFriendReqests,
  });

  const { data: groupData, isLoading: loadingGroups } = useQuery({
    queryKey: ["groupNotifications"],
    queryFn: getGroupNotifications,
  });

  useEffect(() => {
    const t = setInterval(() => forceUpdate(Date.now()), 60000);
    return () => clearInterval(t);
  }, []);

  const { mutate: acceptFriend } = useMutation({
    mutationFn: acceptFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
  });

  const { mutate: markRead } = useMutation({
    mutationFn: markGroupNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groupNotifications"] });
    },
  });

  const incoming = friendRequests?.incomingReqs || [];
  const accepted = friendRequests?.acceptedReqs || [];
  const groupNotifications = groupData?.notifications || [];

  const unreadGroups = groupNotifications.filter(n => !n.read);
  const loading = loadingFriends || loadingGroups;
  
  useEffect(() => {
  // User has opened notifications page
    localStorage.setItem("notificationsSeen", "true");
  }, []);


  return (
    <div className="min-h-screen bg-base-100 px-4 py-6 ">
      <div className="mx-auto max-w-5xl space-y-8">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold">Notifications</h1>

          {unreadGroups.length > 0 && (
            <button
              onClick={() => markRead()}
              className="btn btn-ghost btn-sm gap-2 self-start sm:self-auto"
            >
              <CheckCircle size={16} />
              Mark all read
            </button>
          )}
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg" />
          </div>
        )}

        {!loading && (
          <>
            {/* GROUP UPDATES */}
            {groupNotifications.length > 0 && (
              <section className="space-y-4">
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <Users className="h-5 w-5 text-info" />
                  Group Updates
                  {unreadGroups.length > 0 && (
                    <span className="badge badge-info">{unreadGroups.length}</span>
                  )}
                </h2>

                <div className="space-y-3">
                  {groupNotifications.map(n => (
                    <Link
                      key={n._id}
                      to={`/groups/${n.groupId?._id}`}
                      onClick={() =>
                        markRead({ notificationIds: [n._id] })
                      }
                      className={`card transition border ${
                        n.read
                          ? "bg-base-200"
                          : "bg-info/10 border-info/30"
                      }`}
                    >
                      <div className="card-body p-4">
                        <div className="flex flex-col sm:flex-row gap-3">

                          {/* IMAGE */}
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-base-300 flex-shrink-0">
                            <img
                              src={n.groupId?.image || "/group-placeholder.png"}
                              alt={n.groupId?.name || "Group"}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          {/* CONTENT */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate">
                              {n.groupId?.name}
                            </h3>

                            <p className="text-sm text-base-content/70 mt-1">
                              {n.type === "approved" && "🎉 Your request was approved"}
                              {n.type === "rejected" && "Your request was declined"}
                              {n.type === "removed" && "You were removed from the group"}
                            </p>

                            <p className="text-xs flex items-center mt-1 text-base-content/60">
                              <ClockIcon className="w-3 h-3 mr-1" />
                              {formatTime(n.createdAt)}
                            </p>
                          </div>

                          {/* BADGES */}
                          {n.type === "approved" && (
                            <div className="hidden sm:flex badge badge-success">
                              Approved
                            </div>
                          )}

                          {!n.read && (
                            <div className="hidden sm:block w-2 h-2 bg-info rounded-full mt-2" />
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* FRIEND REQUESTS */}
            {incoming.length > 0 && (
              <section className="space-y-4">
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <UserCheckIcon className="h-5 w-5 text-primary" />
                  Friend Requests
                  <span className="badge badge-primary">{incoming.length}</span>
                </h2>

                <div className="space-y-3">
                  {incoming.map(r => (
                    <div key={r._id} className="card bg-base-200">
                      <div className="card-body p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                          <div className="flex items-center gap-3">
                            <img
                              src={r.sender.profilePic}
                              alt={r.sender.fullName}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                            <span className="font-semibold">
                              {r.sender.fullName}
                            </span>
                          </div>

                          <button
                            onClick={() => acceptFriend(r._id)}
                            className="btn btn-primary btn-sm w-full sm:w-auto"
                          >
                            Accept
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* NEW CONNECTIONS */}
            {accepted.length > 0 && (
              <section className="space-y-4">
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <BellIcon className="h-5 w-5 text-success" />
                  New Connections
                </h2>

                <div className="space-y-3">
                  {accepted.map(n => (
                    <div key={n._id} className="card bg-base-200">
                      <div className="card-body p-4 flex gap-3">
                        <img
                          src={n.recipient.profilePic}
                          className="w-10 h-10 rounded-full"
                        />
                        <div className="flex-1">
                          <p className="font-semibold">
                            You are now friends with {n.recipient.fullName}
                          </p>
                          <p className="text-xs text-base-content/60">
                            {formatTime(n.updatedAt || n.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* EMPTY */}
            {incoming.length === 0 &&
              accepted.length === 0 &&
              groupNotifications.length === 0 && (
                <div className="text-center py-20">
                  <BellIcon className="mx-auto w-10 h-10 opacity-40" />
                  <p className="mt-3 text-base-content/60">
                    No notifications yet
                  </p>
                </div>
              )}
          </>
        )}
      </div>
    </div>
  );
}
