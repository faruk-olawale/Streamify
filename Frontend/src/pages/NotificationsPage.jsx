import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getFriendReqests, acceptFriendRequest } from "../lib/api";
import { UserCheckIcon, BellIcon, ClockIcon, MessagesSquareIcon } from "lucide-react";

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

  // Debug: Log the data to console
  console.log("Friend Requests Data:", friendRequests);
  console.log("Incoming Requests:", incomingRequests);
  console.log("Accepted Requests:", acceptedRequests);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
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
                              <h3 className="font-semibold">
                                {request.sender.fullName}
                              </h3>
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

            {/* ACCEPTED REQUESTS NOTIFICATION */}
            {acceptedRequests.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <BellIcon className="h-5 w-5 text-success" />
                  New Connections
                </h2>

                <div className="space-y-3">
                  {acceptedRequests.map((notification) => (
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
                            <h3 className="font-semibold">
                              {notification.recipient.fullName}
                            </h3>
                            <p className="text-sm my-1">
                              {notification.recipient.fullName} accepted your
                              friend request
                            </p>
                            <p className="text-xs flex items-center opacity-70">
                              <ClockIcon className="h-3 w-3 mr-1" />
                              Recently
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
            {incomingRequests.length === 0 && acceptedRequests.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="size-16 rounded-full bg-base-300 flex items-center justify-center mb-4">
                <BellIcon className="size-8 text-base-content opacity-40" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  No notifications yet
                </h3>
                <p className="text-base-content opacity-70">
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