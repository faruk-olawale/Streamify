import { useQuery } from "@tanstack/react-query";
import { getUserFriends } from "../lib/api";
import { Link, useNavigate } from "react-router";
import { Video, MessageCircle, Users, Shuffle, Calendar, TrendingUp, ArrowRight } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

const PracticePage = () => {
  const navigate = useNavigate();
  const [showFriendSelector, setShowFriendSelector] = useState(false);
  const [selectorMode, setSelectorMode] = useState(null); // 'video' or 'chat'

  const { data: friends = [], isLoading } = useQuery({
    queryKey: ["friends"],
    queryFn: getUserFriends,
  });

  // Simulate online status (replace with real data)
  const onlineFriends = friends.filter(() => Math.random() > 0.7);
  
  // Simulate upcoming sessions (replace with real data)
  const upcomingSessions = [
    // { friend: friendObj, time: "2:00 PM", type: "video" }
  ];

  const handleVideoCall = () => {
    if (friends.length === 0) {
      toast.error("You need friends to start a video call. Find language partners first!");
      setTimeout(() => navigate("/find-partners"), 1500);
      return;
    }
    setSelectorMode('video');
    setShowFriendSelector(true);
  };

  const handleChat = () => {
    if (friends.length === 0) {
      toast.error("You need friends to chat. Find language partners first!");
      setTimeout(() => navigate("/find-partners"), 1500);
      return;
    }
    
    // If only one friend, go directly to chat
    if (friends.length === 1) {
      navigate(`/chat/${friends[0]._id}`);
      return;
    }
    
    // Otherwise show selector
    navigate("/messages");
  };

  const handleQuickPractice = () => {
    if (onlineFriends.length > 0) {
      const randomFriend = onlineFriends[Math.floor(Math.random() * onlineFriends.length)];
      navigate(`/chat/${randomFriend._id}`);
      toast.success(`Starting chat with ${randomFriend.fullName}!`);
    } else if (friends.length > 0) {
      const randomFriend = friends[Math.floor(Math.random() * friends.length)];
      navigate(`/chat/${randomFriend._id}`);
      toast.success(`Starting chat with ${randomFriend.fullName}!`);
    } else {
      toast.error("You need friends to quick practice. Find language partners first!");
      setTimeout(() => navigate("/find-partners"), 1500);
    }
  };

  const selectFriendForVideo = (friendId) => {
    setShowFriendSelector(false);
    // Navigate to a video call page (you'll need to create this)
    navigate(`/video-call/${friendId}`);
    toast.success("Starting video call...");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100 px-4 sm:px-6 lg:px-8 py-6">
      <div className="container mx-auto max-w-4xl space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <Link to="/" className="btn btn-ghost btn-circle">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl font-bold mb-1">
              Ready to Practice? 
            </h1>
            <p className="text-base-content/70">
              Choose how you'd like to practice today
            </p>
          </div>
        </div>

        {/* No Friends Warning */}
        {friends.length === 0 && (
          <div className="alert alert-warning">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>You don't have any language partners yet. Find partners to start practicing!</span>
            <Link to="/find-partners" className="btn btn-sm btn-primary">
              Find Partners
            </Link>
          </div>
        )}

        {/* Upcoming Sessions */}
        {upcomingSessions.length > 0 && (
          <div className="card bg-primary/10 border-2 border-primary/30">
            <div className="card-body p-4">
              <div className="flex items-center gap-3">
                <Calendar className="size-6 text-primary" />
                <div className="flex-1">
                  <h3 className="font-semibold">Upcoming Session</h3>
                  <p className="text-sm opacity-70">
                    Video call with Maria at 2:00 PM
                  </p>
                </div>
                <button className="btn btn-primary btn-sm">
                  Join Now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Practice Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Video Call */}
          <button 
            onClick={handleVideoCall}
            className="card bg-base-200 hover:bg-base-300 hover:shadow-xl transition-all cursor-pointer group text-left"
            disabled={friends.length === 0}
          >
            <div className="card-body p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/20 rounded-full group-hover:bg-primary/30 transition-colors">
                  <Video className="size-8 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-1">Start Video Call</h3>
                  <p className="text-sm opacity-70 mb-3">
                    Practice speaking with a language partner
                  </p>
                  
                  {onlineFriends.length > 0 ? (
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {onlineFriends.slice(0, 3).map((friend, i) => (
                          <div key={i} className="avatar online">
                            <div className="w-6 rounded-full border-2 border-base-200">
                              <img src={friend.profilePic} alt={friend.fullName} />
                            </div>
                          </div>
                        ))}
                      </div>
                      <span className="text-xs text-success font-medium">
                        {onlineFriends.length} online now
                      </span>
                    </div>
                  ) : friends.length > 0 ? (
                    <span className="text-xs opacity-70">
                      {friends.length} friends available
                    </span>
                  ) : (
                    <span className="text-xs text-error">
                      No friends yet
                    </span>
                  )}
                </div>
                <ArrowRight className="size-5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </button>

          {/* Text Chat */}
          <button 
            onClick={handleChat}
            className="card bg-base-200 hover:bg-base-300 hover:shadow-xl transition-all cursor-pointer group text-left"
            disabled={friends.length === 0}
          >
            <div className="card-body p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-success/20 rounded-full group-hover:bg-success/30 transition-colors">
                  <MessageCircle className="size-8 text-success" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-1">Send Messages</h3>
                  <p className="text-sm opacity-70 mb-3">
                    Practice writing and reading
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs opacity-70">
                      {friends.length > 0 
                        ? `${friends.length} friends to chat with`
                        : 'No friends yet'
                      }
                    </span>
                  </div>
                </div>
                <ArrowRight className="size-5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </button>

          {/* Study Groups */}
          <Link 
            to="/groups"
            className="card bg-base-200 hover:bg-base-300 hover:shadow-xl transition-all cursor-pointer group"
          >
            <div className="card-body p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-warning/20 rounded-full group-hover:bg-warning/30 transition-colors">
                  <Users className="size-8 text-warning" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-1">Join Study Group</h3>
                  <p className="text-sm opacity-70 mb-3">
                    Learn together with other learners
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs opacity-70">
                      Connect with groups
                    </span>
                  </div>
                </div>
                <ArrowRight className="size-5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </Link>

          {/* Quick Practice */}
          <button 
            className="card bg-gradient-to-br from-secondary/20 to-secondary/10 hover:from-secondary/30 hover:to-secondary/20 hover:shadow-xl transition-all cursor-pointer group border-2 border-secondary/30 text-left"
            onClick={handleQuickPractice}
            disabled={friends.length === 0}
          >
            <div className="card-body p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-secondary/30 rounded-full group-hover:bg-secondary/40 transition-colors">
                  <Shuffle className="size-8 text-secondary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-1">Quick Practice</h3>
                  <p className="text-sm opacity-70 mb-3">
                    Start chatting with a random friend
                  </p>
                  
                  {onlineFriends.length > 0 ? (
                    <span className="text-xs text-success font-medium flex items-center gap-1">
                      <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>
                      {onlineFriends.length} friends online!
                    </span>
                  ) : friends.length > 0 ? (
                    <span className="text-xs opacity-70">
                      {friends.length} friends available
                    </span>
                  ) : (
                    <span className="text-xs text-error">
                      No friends yet
                    </span>
                  )}
                </div>
                <ArrowRight className="size-5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </button>
        </div>

        {/* Today's Progress */}
        <div className="card bg-base-200">
          <div className="card-body p-6">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="size-6 text-primary" />
              <h3 className="font-bold text-lg">Today's Progress</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="stat bg-base-100 rounded-lg p-4">
                <div className="stat-title text-xs">Practice Time</div>
                <div className="stat-value text-2xl">0 min</div>
                <div className="stat-desc">Goal: 30 min</div>
                <progress className="progress progress-primary w-full mt-2" value="0" max="30"></progress>
              </div>

              <div className="stat bg-base-100 rounded-lg p-4">
                <div className="stat-title text-xs">Conversations</div>
                <div className="stat-value text-2xl">0</div>
                <div className="stat-desc">Goal: 2 today</div>
                <progress className="progress progress-success w-full mt-2" value="0" max="2"></progress>
              </div>

              <div className="stat bg-base-100 rounded-lg p-4">
                <div className="stat-title text-xs">Streak</div>
                <div className="stat-value text-2xl">5 🔥</div>
                <div className="stat-desc">Keep it going!</div>
              </div>
            </div>
          </div>
        </div>

        {/* Online Friends */}
        {onlineFriends.length > 0 && (
          <div>
            <h3 className="font-bold text-lg mb-3">Friends Online Now ({onlineFriends.length})</h3>
            <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory">
              {onlineFriends.map((friend) => (
                <Link
                  key={friend._id}
                  to={`/chat/${friend._id}`}
                  className="card bg-base-200 hover:shadow-md hover:scale-105 transition-all flex-shrink-0 w-40 snap-start"
                >
                  <div className="card-body p-3 text-center">
                    <div className="avatar online mx-auto">
                      <div className="w-16 rounded-full ring ring-success ring-offset-base-100 ring-offset-2">
                        <img src={friend.profilePic} alt={friend.fullName} />
                      </div>
                    </div>
                    <h4 className="font-semibold text-sm truncate mt-2">{friend.fullName}</h4>
                    <p className="text-xs opacity-70 truncate">
                      {friend.nativeLanguages?.[0] || 'Language learner'}
                    </p>
                    <button className="btn btn-success btn-xs mt-2 gap-1">
                      <MessageCircle className="size-3" />
                      Chat Now
                    </button>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* All Friends List */}
        {friends.length > 0 && onlineFriends.length === 0 && (
          <div>
            <h3 className="font-bold text-lg mb-3">Your Friends ({friends.length})</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {friends.slice(0, 8).map((friend) => (
                <Link
                  key={friend._id}
                  to={`/chat/${friend._id}`}
                  className="card bg-base-200 hover:shadow-md hover:scale-105 transition-all"
                >
                  <div className="card-body p-3 text-center">
                    <div className="avatar mx-auto">
                      <div className="w-14 rounded-full">
                        <img src={friend.profilePic} alt={friend.fullName} />
                      </div>
                    </div>
                    <h4 className="font-semibold text-xs truncate mt-2">{friend.fullName}</h4>
                  </div>
                </Link>
              ))}
            </div>
            {friends.length > 8 && (
              <div className="text-center mt-4">
                <Link to="/friends" className="btn btn-ghost btn-sm">
                  View All {friends.length} Friends →
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Friend Selector Modal for Video Call */}
      {showFriendSelector && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">
              Select a friend to call
            </h3>
            
            <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
              {friends.map((friend) => (
                <button
                  key={friend._id}
                  onClick={() => selectFriendForVideo(friend._id)}
                  className="card bg-base-200 hover:bg-base-300 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="card-body p-4 text-center">
                    <div className="avatar mx-auto">
                      <div className="w-16 rounded-full">
                        <img src={friend.profilePic} alt={friend.fullName} />
                      </div>
                    </div>
                    <h4 className="font-semibold text-sm truncate mt-2">
                      {friend.fullName}
                    </h4>
                    <p className="text-xs opacity-70 truncate">
                      {friend.nativeLanguages?.[0] || 'Language learner'}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            <div className="modal-action">
              <button 
                onClick={() => setShowFriendSelector(false)}
                className="btn btn-ghost"
              >
                Cancel
              </button>
            </div>
          </div>
          <div 
            className="modal-backdrop" 
            onClick={() => setShowFriendSelector(false)}
          />
        </div>
      )}
    </div>
  );
};

export default PracticePage;