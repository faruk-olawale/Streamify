import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  getRecommendedUsers,
  getUserFriends,
  getOutgoingFriendsReqs,
  sendFriendReqests,
} from "../lib/api";
import { Link } from "react-router";
import { UserIcon } from "lucide-react";
import FriendCard from "../component/FriendCard";
import NoFriendsFound from "../component/NoFriendsFound";

const HomePage = () => {
  const queryClient = useQueryClient();
  const [outgoingRequestIds, setOutgoingRequestIds] = useState(new Set());

  // Queries
  const { data: friends = [], isLoading: loadingFriends } = useQuery({
    queryKey: ["friends"],
    queryFn: getUserFriends,
  });

  const { data: recommendedUsers = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: getRecommendedUsers,
  });

  const { data: outgoingFriendsReqs } = useQuery({
    queryKey: ["outgoingFriendsReqs"],
    queryFn: getOutgoingFriendsReqs,
  });

  // Mutation
  const { mutateAsync: sendRequestMutation } = useMutation({
    mutationFn: sendFriendReqests,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["outgoingFriendsReqs"] }),
  });

  // Track outgoing requests
  useEffect(() => {
    const outgoingIds = new Set();
    if (outgoingFriendsReqs?.length) {
      outgoingFriendsReqs.forEach((req) => outgoingIds.add(req.recipient._id));
      setOutgoingRequestIds(outgoingIds);
    }
  }, [outgoingFriendsReqs]);

  return (
    <div className="min-h-screen bg-base-100 px-4 sm:px-6 lg:px-8 py-6">
      <div className="container mx-auto space-y-10">
        {/* FRIENDS HEADER */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-wider">Your Friends</h2>
          <Link to="/notifications" className="btn btn-outline btn-sm">
            <UserIcon className="mr-2 size-4" />
            Friends Requests
          </Link>
        </div>

        {/* FRIENDS LIST */}
        {loadingFriends ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg" />
          </div>
        ) : friends.length === 0 ? (
          <NoFriendsFound />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {friends.map((friend) => (
              <FriendCard
                key={friend._id}
                friend={friend}
                isFriend={true} // This shows the "Message" button
              />
            ))}
          </div>
        )}

        {/* RECOMMENDED USERS */}
        <section>
          <div className="mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Meet New Learners</h2>
            <p className="opacity-70">
              Discover perfect language exchange partners based on your profile
            </p>
          </div>

          {loadingUsers ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : recommendedUsers.length === 0 ? (
            <div className="card bg-base-200 p-6 text-center">
              <h3 className="font-semibold text-lg mb-2">No recommendations available</h3>
              <p className="text-base-content opacity-70">
                Check back later for new language partners!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {recommendedUsers.map((user) => (
                <FriendCard
                  key={user._id}
                  friend={user}
                  sendRequest={sendRequestMutation}
                  isRequestSent={outgoingRequestIds.has(user._id)}
                  isFriend={false} // This shows the "Send Friend Request" button
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default HomePage;