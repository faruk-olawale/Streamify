import { useQuery } from "@tanstack/react-query";
import { getUserFriends } from "../lib/api";
import { Link } from "react-router";
import { Video, MessageCircle, Users, Shuffle, Calendar, TrendingUp } from "lucide-react";
import Avatar from "../component/Avatar";

const PracticePage = () => {
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

  return (
    <div className="min-h-screen bg-base-100 px-4 sm:px-6 lg:px-8 py-6">
      <div className="container mx-auto max-w-4xl space-y-6">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            Ready to Practice? 🎯
          </h1>
          <p className="text-base-content/70">
            Choose how you'd like to practice today
          </p>
        </div>

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
          <Link 
            to="/video-call"
            className="card bg-base-200 hover:bg-base-300 hover:shadow-xl transition-all cursor-pointer group"
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
                  
                  {onlineFriends.length > 0 && (
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
                  )}
                </div>
              </div>
            </div>
          </Link>

          {/* Text Chat */}
          <Link 
            to="/chat"
            className="card bg-base-200 hover:bg-base-300 hover:shadow-xl transition-all cursor-pointer group"
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
                      {friends.length} friends to chat with
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Link>

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
                    <span className="badge badge-warning badge-sm">Coming Soon</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {/* Quick Practice */}
          <button 
            className="card bg-base-200 hover:bg-base-300 hover:shadow-xl transition-all cursor-pointer group"
            onClick={() => {
              // TODO: Randomly select an online friend
              if (onlineFriends.length > 0) {
                const randomFriend = onlineFriends[Math.floor(Math.random() * onlineFriends.length)];
                window.location.href = `/chat/${randomFriend._id}`;
              } else {
                alert('No friends online right now. Try messaging instead!');
              }
            }}
          >
            <div className="card-body p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-secondary/20 rounded-full group-hover:bg-secondary/30 transition-colors">
                  <Shuffle className="size-8 text-secondary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-1">Quick Practice</h3>
                  <p className="text-sm opacity-70 mb-3">
                    Start chatting with a random online friend
                  </p>
                  
                  {onlineFriends.length > 0 ? (
                    <span className="text-xs text-success font-medium">
                      Ready to connect!
                    </span>
                  ) : (
                    <span className="text-xs opacity-70">
                      No one online right now
                    </span>
                  )}
                </div>
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
            <div className="flex gap-3 overflow-x-auto pb-4">
              {onlineFriends.map((friend) => (
                <Link
                  key={friend._id}
                  to={`/chat/${friend._id}`}
                  className="card bg-base-200 hover:shadow-md transition-shadow flex-shrink-0 w-40"
                >
                  <div className="card-body p-3 text-center">
                    <div className="avatar online mx-auto">
                      <div className="w-16 rounded-full">
                        <img src={friend.profilePic} alt={friend.fullName} />
                      </div>
                    </div>
                    <h4 className="font-semibold text-sm truncate">{friend.fullName}</h4>
                    <p className="text-xs opacity-70 truncate">
                      {friend.nativeLanguages?.[0] || 'Language learner'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PracticePage;