import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  getRecommendedUsers,
  getUserFriends,
  getOutgoingFriendsReqs,
  sendFriendReqests,
} from "../lib/api";
import { Link } from "react-router";
import { Sparkles, UserIcon, Flame, Users, Clock, MessageCircle } from "lucide-react";
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

  // Calculate online friends (placeholder)
  const onlineFriends = friends.filter(() => Math.random() > 0.7);

  return (
    <div className="min-h-screen bg-base-100">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">

        {/* =======================
           WELCOME HEADER - Mobile Optimized
        ======================= */}
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold truncate">
              Welcome back! 👋
            </h1>
            <p className="text-xs sm:text-sm opacity-70 mt-0.5 sm:mt-1">
              Ready to practice?
            </p>
          </div>

          <Link to="/notifications" className="btn btn-outline btn-sm flex-shrink-0">
            <UserIcon className="size-4 sm:mr-2" />
            <span className="hidden sm:inline">Requests</span>
          </Link>
        </div>

        {/* =======================
           QUICK STATS - Mobile Optimized
        ======================= */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <div className="stat bg-base-200 rounded-lg p-3 sm:p-4">
            <div className="stat-figure text-primary hidden sm:block">
              <Users className="size-6 sm:size-8" />
            </div>
            <div className="stat-title text-xs sm:text-sm">Friends</div>
            <div className="stat-value text-lg sm:text-2xl lg:text-3xl text-primary">
              {friends.length}
            </div>
          </div>

          <div className="stat bg-base-200 rounded-lg p-3 sm:p-4">
            <div className="stat-figure text-success hidden sm:block">
              <div className="avatar online">
                <div className="w-8 sm:w-12 h-8 sm:h-12 rounded-full bg-success/20 flex items-center justify-center">
                  <Users className="size-4 sm:size-6 text-success" />
                </div>
              </div>
            </div>
            <div className="stat-title text-xs sm:text-sm">Online</div>
            <div className="stat-value text-lg sm:text-2xl lg:text-3xl text-success">
              {onlineFriends.length}
            </div>
          </div>

          <div className="stat bg-base-200 rounded-lg p-3 sm:p-4">
            <div className="stat-figure text-warning hidden sm:block">
              <Flame className="size-6 sm:size-8" />
            </div>
            <div className="stat-title text-xs sm:text-sm">Streak</div>
            <div className="stat-value text-lg sm:text-2xl lg:text-3xl">5 🔥</div>
          </div>
        </div>

        {/* =======================
           TODAY'S GOAL - Mobile Optimized
        ======================= */}
        <div className="card bg-gradient-to-r from-primary/10 to-secondary/10 border-2 border-primary/20">
          <div className="card-body p-3 sm:p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="p-2 sm:p-3 bg-primary/20 rounded-full flex-shrink-0">
                <Clock className="size-5 sm:size-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm sm:text-base">
                  Today's Goal: Practice for 30 minutes
                </h3>
                <p className="text-xs sm:text-sm opacity-70 mt-1">
                  Start a conversation with your partners
                </p>
              </div>
              <Link to="/find-partners" className="btn btn-primary btn-sm w-full sm:w-auto">
                Start Now
              </Link>
            </div>
          </div>
        </div>

        {/* =======================
           YOUR BEST MATCHES - Mobile Optimized
        ======================= */}
        <section>
          <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold flex items-center gap-2">
                <Sparkles className="text-primary flex-shrink-0" size={24} />
                <span className="truncate">Your Best Matches</span>
              </h2>
              <p className="text-xs sm:text-sm opacity-70 mt-1">
                {recommendedUsers.length} learners matched to you
              </p>
            </div>

            <Link to="/find-partners" className="btn btn-primary btn-sm gap-2 w-full sm:w-auto">
              <Sparkles size={16} />
              See All
            </Link>
          </div>

          {loadingUsers ? (
            <div className="flex justify-center py-8 sm:py-12">
              <span className="loading loading-spinner loading-md sm:loading-lg" />
            </div>
          ) : recommendedUsers.length === 0 ? (
            <div className="card bg-base-200 p-4 sm:p-6 text-center">
              <Sparkles className="size-10 sm:size-12 mx-auto mb-3 sm:mb-4 text-primary opacity-50" />
              <h3 className="font-semibold text-base sm:text-lg mb-2">
                No recommendations yet
              </h3>
              <p className="text-sm opacity-70 mb-3 sm:mb-4">
                Complete your profile to get matches
              </p>
              <Link to="/profile" className="btn btn-primary btn-sm mx-auto">
                Complete Profile
              </Link>
            </div>
          ) : (
            <>
              {/* Top Matches - Responsive Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4">
                {recommendedUsers.slice(0, 6).map((user) => (
                  <FriendCard
                    key={user._id}
                    friend={user}
                    sendRequest={sendRequestMutation}
                    isRequestSent={outgoingRequestIds.has(user._id)}
                    isFriend={false}
                  />
                ))}
              </div>

              {/* See More */}
              {recommendedUsers.length > 6 && (
                <div className="text-center mt-4">
                  <Link to="/find-partners" className="btn btn-outline btn-sm sm:btn-md btn-wide">
                    See All {recommendedUsers.length} Matches
                  </Link>
                </div>
              )}
            </>
          )}
        </section>

        {/* =======================
           YOUR FRIENDS - Mobile Optimized
        ======================= */}
        <section>
          <div className="mb-3 sm:mb-4 flex items-center justify-between gap-2">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold">
              Your Friends ({friends.length})
            </h2>

            {friends.length > 0 && (
              <Link to="/friends" className="btn btn-ghost btn-xs sm:btn-sm">
                View All →
              </Link>
            )}
          </div>

          {loadingFriends ? (
            <div className="flex justify-center py-6 sm:py-8">
              <span className="loading loading-spinner loading-md" />
            </div>
          ) : friends.length === 0 ? (
            <NoFriendsFound />
          ) : (
            <div className="relative">
              {/* Horizontal Scroll Container */}
              <div className="flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory hide-scrollbar">
                {friends.slice(0, 12).map((friend) => (
                  <div key={friend._id} className="flex-shrink-0 w-40 sm:w-48 snap-start">
                    <CompactFriendCard friend={friend} />
                  </div>
                ))}
              </div>

              {/* Scroll Indicator - Mobile Only */}
              {friends.length > 2 && (
                <div className="flex justify-center gap-1 mt-2 sm:hidden">
                  {Array.from({ length: Math.min(friends.length, 5) }).map((_, i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-base-content/20" />
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* =======================
           QUICK ACTIONS - Mobile Optimized
        ======================= */}
        <section className="grid grid-cols-3 gap-2 sm:gap-4 pb-4">
          <Link 
            to="/find-partners"
            className="card bg-primary/10 hover:bg-primary/20 transition-colors cursor-pointer"
          >
            <div className="card-body p-3 sm:p-4 text-center">
              <Sparkles className="size-6 sm:size-8 mx-auto text-primary mb-1 sm:mb-2" />
              <h3 className="font-semibold text-xs sm:text-sm">Find</h3>
              <p className="text-[10px] sm:text-xs opacity-70 hidden sm:block">Partners</p>
            </div>
          </Link>

          <Link 
            to="/chat"
            className="card bg-success/10 hover:bg-success/20 transition-colors cursor-pointer"
          >
            <div className="card-body p-3 sm:p-4 text-center">
              <MessageCircle className="size-6 sm:size-8 mx-auto text-success mb-1 sm:mb-2" />
              <h3 className="font-semibold text-xs sm:text-sm">Practice</h3>
              <p className="text-[10px] sm:text-xs opacity-70 hidden sm:block">Chat now</p>
            </div>
          </Link>

          <Link 
            to="/profile"
            className="card bg-warning/10 hover:bg-warning/20 transition-colors cursor-pointer"
          >
            <div className="card-body p-3 sm:p-4 text-center">
              <UserIcon className="size-6 sm:size-8 mx-auto text-warning mb-1 sm:mb-2" />
              <h3 className="font-semibold text-xs sm:text-sm">Profile</h3>
              <p className="text-[10px] sm:text-xs opacity-70 hidden sm:block">Update</p>
            </div>
          </Link>
        </section>
      </div>

      {/* Custom Scrollbar Hiding */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

// Compact Friend Card - Fixed Avatar
const CompactFriendCard = ({ friend }) => {
  const isOnline = Math.random() > 0.7;
  
  // Fallback avatar if none exists
  const avatarSrc = friend.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.fullName || 'User')}&background=random`;

  return (
    <Link 
      to={`/chat/${friend._id}`}
      className="card bg-base-200 hover:shadow-md transition-all h-full"
    >
      <div className="card-body p-3">
        <div className="flex flex-col items-center text-center gap-2">
          {/* Avatar with Fallback */}
          <div className={`avatar ${isOnline ? 'online' : ''}`}>
            <div className="w-14 sm:w-16 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
              <img 
                src={avatarSrc}
                alt={friend.fullName}
                onError={(e) => {
                  // If image fails to load, use initials avatar
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.fullName || 'User')}&background=random`;
                }}
              />
            </div>
          </div>
          
          <div className="w-full">
            <h3 className="font-semibold text-xs sm:text-sm truncate">
              {friend.fullName}
            </h3>
            
            {friend.nativeLanguages && friend.nativeLanguages.length > 0 && (
              <p className="text-[10px] sm:text-xs opacity-70 truncate">
                {friend.nativeLanguages[0]}
              </p>
            )}
            
            {isOnline && (
              <span className="badge badge-success badge-xs mt-1">Online</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default HomePage;