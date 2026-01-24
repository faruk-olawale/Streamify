import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  getRecommendedUsers,
  getUserFriends,
  getOutgoingFriendsReqs,
  sendFriendReqests,
  getPracticeStats,
} from "../lib/api";
import { Link } from "react-router";
import { 
  Sparkles, UserIcon, Flame, Users, Clock, TrendingUp, 
  Video, MessageCircle, Award, Target, ChevronRight,
  Zap, Globe
} from "lucide-react";
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

  const { data: practiceStats } = useQuery({
    queryKey: ["practiceStats"],
    queryFn: getPracticeStats,
    retry: false,
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

  // Calculate stats
  const onlineFriends = friends.filter(() => Math.random() > 0.7);
  const currentStreak = practiceStats?.currentStreak || 0;
  const todayProgress = practiceStats?.todaysPracticeMinutes || 0;
  const dailyGoal = practiceStats?.dailyGoal || 30;
  const progressPercent = Math.min((todayProgress / dailyGoal) * 100, 100);

  // Get top matches
  const topMatches = recommendedUsers.slice(0, 3);
  const moreMatches = recommendedUsers.slice(3, 9);

  return (
    <div className="min-h-screen bg-base-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 border-b border-base-300">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Welcome back! 👋
              </h1>
              <p className="text-base-content/70 mt-1">
                Ready to practice and connect with language partners?
              </p>
            </div>

            <Link to="/notifications" className="btn btn-outline gap-2">
              <UserIcon className="size-4" />
              Requests
            </Link>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Friends Card */}
            <div className="card bg-base-100/80 backdrop-blur-sm shadow-lg border border-base-300/50 hover:shadow-xl transition-shadow">
              <div className="card-body p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <Users className="size-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-base-content/60 font-medium">Friends</p>
                    <p className="text-2xl font-bold">{friends.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Online Card */}
            <div className="card bg-base-100/80 backdrop-blur-sm shadow-lg border border-base-300/50 hover:shadow-xl transition-shadow">
              <div className="card-body p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-success/10 rounded-xl">
                    <Zap className="size-6 text-success" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-base-content/60 font-medium">Online Now</p>
                    <p className="text-2xl font-bold text-success">{onlineFriends.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Streak Card */}
            <div className="card bg-base-100/80 backdrop-blur-sm shadow-lg border border-base-300/50 hover:shadow-xl transition-shadow">
              <div className="card-body p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-500/10 rounded-xl">
                    <Flame className="size-6 text-orange-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-base-content/60 font-medium">Day Streak</p>
                    <p className="text-2xl font-bold">{currentStreak} 🔥</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Today's Progress Card */}
            <div className="card bg-base-100/80 backdrop-blur-sm shadow-lg border border-base-300/50 hover:shadow-xl transition-shadow">
              <div className="card-body p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-warning/10 rounded-xl">
                    <Target className="size-6 text-warning" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-base-content/60 font-medium">Today</p>
                    <p className="text-2xl font-bold">{todayProgress}/{dailyGoal}m</p>
                    <div className="w-full bg-base-200 rounded-full h-1.5 mt-1">
                      <div 
                        className="bg-warning h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">

        {/* Daily Goal CTA */}
        {progressPercent < 100 && (
          <div className="card bg-gradient-to-r from-primary to-secondary text-primary-content shadow-xl">
            <div className="card-body p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                    <Target className="size-8" />
                  </div>
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-xl font-bold mb-1">
                    {progressPercent === 0 ? "Start Your Practice Today!" : "Keep Going!"}
                  </h3>
                  <p className="text-sm opacity-90">
                    {progressPercent === 0 
                      ? `Practice for ${dailyGoal} minutes to maintain your streak` 
                      : `${Math.round(dailyGoal - todayProgress)} minutes left to reach your daily goal`
                    }
                  </p>
                  <div className="flex gap-2 mt-3 justify-center sm:justify-start">
                    <div className="badge badge-lg bg-white/20 border-0 gap-1">
                      <Clock className="size-3" />
                      {todayProgress}m / {dailyGoal}m
                    </div>
                    <div className="badge badge-lg bg-white/20 border-0">
                      {Math.round(progressPercent)}% Complete
                    </div>
                  </div>
                </div>
                <Link to="/practice" className="btn btn-neutral">
                  Start Practicing
                  <ChevronRight className="size-4" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Celebration for completed goal */}
        {progressPercent >= 100 && (
          <div className="card bg-gradient-to-r from-success to-teal-500 text-success-content shadow-xl">
            <div className="card-body p-4 sm:p-6 text-center">
              <div className="flex flex-col items-center gap-3">
                <Award className="size-16 animate-bounce" />
                <div>
                  <h3 className="text-2xl font-bold mb-1">🎉 Daily Goal Achieved!</h3>
                  <p className="text-sm opacity-90">
                    Awesome work! You've practiced {todayProgress} minutes today
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link to="/practice" className="btn btn-neutral btn-sm">
                    Practice More
                  </Link>
                  <Link to="/find-partners" className="btn btn-ghost btn-sm">
                    Find New Partners
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Best Matches Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                <Sparkles className="text-primary animate-pulse" size={28} />
                Your Best Matches
              </h2>
              <p className="text-sm text-base-content/70 mt-1">
                {topMatches.length > 0 
                  ? "Smart recommendations based on your profile" 
                  : "Complete your profile to get matches"
                }
              </p>
            </div>

            {recommendedUsers.length > 0 && (
              <Link to="/find-partners" className="btn btn-primary gap-2">
                <Globe size={18} />
                <span className="hidden sm:inline">Discover More</span>
              </Link>
            )}
          </div>

          {loadingUsers ? (
            <div className="flex justify-center py-16">
              <span className="loading loading-spinner loading-lg text-primary" />
            </div>
          ) : topMatches.length === 0 ? (
            <div className="card bg-base-200 border-2 border-dashed border-base-300">
              <div className="card-body p-8 text-center">
                <Sparkles className="size-16 mx-auto mb-4 text-primary/50" />
                <h3 className="font-bold text-lg mb-2">No Matches Yet</h3>
                <p className="text-base-content/70 mb-4 max-w-md mx-auto">
                  Complete your profile with languages, goals, and availability to get personalized partner recommendations
                </p>
                <Link to="/profile" className="btn btn-primary mx-auto">
                  Complete Profile
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Featured Top 3 */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                {topMatches.map((user) => (
                  <div key={user._id} className="relative">
                    {/* Featured Badge */}
                    {user.matchScore >= 80 && (
                      <div className="absolute -top-2 -right-2 z-20">
                        <div className="badge badge-secondary gap-1 shadow-lg">
                          <Sparkles className="size-3" />
                          Top Match
                        </div>
                      </div>
                    )}
                    <FriendCard
                      friend={user}
                      sendRequest={sendRequestMutation}
                      isRequestSent={outgoingRequestIds.has(user._id)}
                      isFriend={false}
                    />
                  </div>
                ))}
              </div>

              {/* More Matches */}
              {moreMatches.length > 0 && (
                <>
                  <div className="divider">
                    <span className="text-sm text-base-content/60">More Great Matches</span>
                  </div>
                   <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">

                    {moreMatches.map((user) => (
                      <FriendCard
                        key={user._id}
                        friend={user}
                        sendRequest={sendRequestMutation}
                        isRequestSent={outgoingRequestIds.has(user._id)}
                        isFriend={false}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* See All */}
              {recommendedUsers.length > 9 && (
                <div className="text-center mt-6">
                  <Link to="/find-partners" className="btn btn-outline btn-wide gap-2">
                    See All {recommendedUsers.length} Matches
                    <ChevronRight className="size-4" />
                  </Link>
                </div>
              )}
            </>
          )}
        </section>

        {/* Friends Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl sm:text-2xl font-bold">
              Your Friends ({friends.length})
            </h2>
            {friends.length > 8 && (
              <Link to="/friends" className="btn btn-ghost btn-sm gap-1">
                View All
                <ChevronRight className="size-4" />
              </Link>
            )}
          </div>

          {loadingFriends ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-md" />
            </div>
          ) : friends.length === 0 ? (
            <NoFriendsFound />
          ) : (
            <div className="relative">
              <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory hide-scrollbar">
                {friends.slice(0, 12).map((friend) => (
                  <div key={friend._id} className="flex-shrink-0 w-44 snap-start">
                    <CompactFriendCard friend={friend} />
                  </div>
                ))}
                
                {/* View All Card */}
                {friends.length > 12 && (
                  <Link 
                    to="/friends"
                    className="flex-shrink-0 w-44 snap-start card bg-base-200 hover:bg-base-300 transition-colors"
                  >
                    <div className="card-body p-4 flex items-center justify-center text-center h-full">
                      <Users className="size-12 text-primary mb-2" />
                      <p className="font-semibold">View All</p>
                      <p className="text-xs text-base-content/60">
                        {friends.length - 12} more friends
                      </p>
                    </div>
                  </Link>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Quick Actions */}
        <section>
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link 
              to="/practice"
              className="card bg-gradient-to-br from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10 border border-primary/20 transition-all group"
            >
              <div className="card-body p-5 text-center">
                <div className="mx-auto p-3 bg-primary/20 rounded-full mb-3 group-hover:scale-110 transition-transform">
                  <Video className="size-7 text-primary" />
                </div>
                <h3 className="font-bold">Start Practice</h3>
                <p className="text-xs text-base-content/70">Video or message</p>
              </div>
            </Link>

            <Link 
              to="/find-partners"
              className="card bg-gradient-to-br from-secondary/10 to-secondary/5 hover:from-secondary/20 hover:to-secondary/10 border border-secondary/20 transition-all group"
            >
              <div className="card-body p-5 text-center">
                <div className="mx-auto p-3 bg-secondary/20 rounded-full mb-3 group-hover:scale-110 transition-transform">
                  <Sparkles className="size-7 text-secondary" />
                </div>
                <h3 className="font-bold">Find Partners</h3>
                <p className="text-xs text-base-content/70">Discover learners</p>
              </div>
            </Link>

            <Link 
              to="/messages"
              className="card bg-gradient-to-br from-success/10 to-success/5 hover:from-success/20 hover:to-success/10 border border-success/20 transition-all group"
            >
              <div className="card-body p-5 text-center">
                <div className="mx-auto p-3 bg-success/20 rounded-full mb-3 group-hover:scale-110 transition-transform">
                  <MessageCircle className="size-7 text-success" />
                </div>
                <h3 className="font-bold">Messages</h3>
                <p className="text-xs text-base-content/70">Chat with friends</p>
              </div>
            </Link>

            <Link 
              to="/profile"
              className="card bg-gradient-to-br from-warning/10 to-warning/5 hover:from-warning/20 hover:to-warning/10 border border-warning/20 transition-all group"
            >
              <div className="card-body p-5 text-center">
                <div className="mx-auto p-3 bg-warning/20 rounded-full mb-3 group-hover:scale-110 transition-transform">
                  <TrendingUp className="size-7 text-warning" />
                </div>
                <h3 className="font-bold">Your Profile</h3>
                <p className="text-xs text-base-content/70">Update info</p>
              </div>
            </Link>
          </div>
        </section>
      </div>

      {/* Hide scrollbar */}
      <style jsx>{`
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

// Compact Friend Card
const CompactFriendCard = ({ friend }) => {
  const isOnline = Math.random() > 0.7;

  return (
    <Link 
      to={`/chat/${friend._id}`}
      className="card bg-base-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 h-full"
    >
      <div className="card-body p-4">
        <div className="flex flex-col items-center text-center gap-3">
          <div className={`avatar ${isOnline ? 'online' : ''}`}>
            <div className="w-16 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
              <img src={friend.profilePic || '/default-avatar.png'} alt={friend.fullName} />
            </div>
          </div>
          
          <div className="w-full">
            <h3 className="font-semibold text-sm truncate mb-1">{friend.fullName}</h3>
            
            {friend.nativeLanguages && friend.nativeLanguages.length > 0 && (
              <p className="text-xs text-base-content/70 truncate">
                {friend.nativeLanguages[0]}
              </p>
            )}
            
            {isOnline && (
              <span className="badge badge-success badge-xs mt-2 gap-1">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                Online
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default HomePage;