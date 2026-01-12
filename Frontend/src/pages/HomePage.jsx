import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  getRecommendedUsers,
  getUserFriends,
  getOutgoingFriendsReqs,
  sendFriendReqests,
} from "../lib/api";
import { Link } from "react-router";
import { Sparkles, UserIcon } from "lucide-react";
import FriendCard from "../component/FriendCard";
import NoFriendsFound from "../component/NoFriendsFound";

const HomePage = () => {
  const queryClient = useQueryClient();
  const [outgoingRequestIds, setOutgoingRequestIds] = useState(new Set());

  /* =======================
     QUERIES
  ======================= */
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

  /* =======================
     MUTATION
  ======================= */
  const { mutateAsync: sendRequestMutation } = useMutation({
    mutationFn: sendFriendReqests,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["outgoingFriendsReqs"] }),
  });

  /* =======================
     TRACK OUTGOING REQUESTS
  ======================= */
  useEffect(() => {
    const ids = new Set();
    outgoingFriendsReqs?.forEach((req) => ids.add(req.recipient._id));
    setOutgoingRequestIds(ids);
  }, [outgoingFriendsReqs]);

  return (
    <div className="min-h-screen bg-base-100 px-4 sm:px-6 lg:px-8 py-6">
      <div className="container mx-auto space-y-10">

        {/* =======================
           FEATURED FIND PARTNERS BANNER
        ======================= */}
        <Link
          to="/find-partners"
          className="block card bg-gradient-to-r from-primary to-secondary text-primary-content hover:shadow-xl transition-all"
        >
          <div className="card-body p-4 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Sparkles size={32} />
                <div>
                  <h3 className="text-lg sm:text-xl font-bold">
                    Find Practice Partners
                  </h3>
                  <p className="text-sm opacity-90">
                    Smart matches based on your learning goals and availability
                  </p>
                </div>
              </div>

              <span className="hidden sm:inline btn btn-ghost text-primary-content">
                Browse Matches →
              </span>
            </div>
          </div>
        </Link>

        {/* =======================
           FRIENDS HEADER
        ======================= */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-wider">
            Your Friends
          </h2>

          <Link to="/notifications" className="btn btn-outline btn-sm">
            <UserIcon className="mr-2 size-4" />
            Friend Requests
          </Link>
        </div>

        {/* =======================
           FRIENDS LIST
        ======================= */}
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
                isFriend={true}
              />
            ))}
          </div>
        )}

        {/* =======================
           MEET NEW LEARNERS
        ======================= */}
        <section>
          <div className="mb-6 sm:mb-8 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Meet New Learners
              </h2>
              <p className="opacity-70">
                Discover new people — or use smart matching for better results
              </p>
            </div>

            <Link to="/find-partners" className="btn btn-primary gap-2">
              <Sparkles size={18} />
              <span className="hidden sm:inline">Smart Matches</span>
            </Link>
          </div>

          {loadingUsers ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : recommendedUsers.length === 0 ? (
            <div className="card bg-base-200 p-6 text-center">
              <h3 className="font-semibold text-lg mb-2">
                No recommendations available
              </h3>
              <p className="opacity-70">
                Complete your profile to get better matches
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
                  isFriend={false}
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
