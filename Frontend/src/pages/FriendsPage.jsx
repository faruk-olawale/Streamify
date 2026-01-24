import { useQuery } from "@tanstack/react-query";
import { getUserFriends } from "../lib/api";
import { Link } from "react-router";
import { ArrowLeft, Search } from "lucide-react";
import { useState } from "react";

const FriendsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: friends = [], isLoading } = useQuery({
    queryKey: ["friends"],
    queryFn: getUserFriends,
  });

  // Filter friends based on search
  const filteredFriends = friends.filter(friend => 
    friend.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.nativeLanguages?.some(lang => lang.toLowerCase().includes(searchQuery.toLowerCase())) ||
    friend.learningLanguages?.some(lang => lang.toLowerCase().includes(searchQuery.toLowerCase())) ||
    friend.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Generate fallback avatar
  const getAvatarUrl = (friend) => {
    if (friend.profilePic && friend.profilePic !== '') {
      return friend.profilePic;
    }
    const name = encodeURIComponent(friend.fullName || 'User');
    return `https://ui-avatars.com/api/?name=${name}&background=random&size=128`;
  };

  return (
    <div className="min-h-screen bg-base-100 px-4 sm:px-6 lg:px-8 py-6">
      <div className="container mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Link to="/" className="btn btn-ghost btn-circle">
              <ArrowLeft className="size-5" />
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Your Friends</h1>
              <p className="text-sm text-base-content/70">
                {filteredFriends.length} {searchQuery ? 'found' : 'language learning partners'}
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-base-content/40" />
            <input
              type="text"
              placeholder="Search by name, language, or location..."
              className="input input-bordered w-full pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 btn btn-ghost btn-xs btn-circle"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Friends Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg" />
          </div>
        ) : filteredFriends.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-xl font-bold mb-2">
              {searchQuery ? 'No friends found' : 'No friends yet'}
            </h3>
            <p className="text-base-content/70 mb-4">
              {searchQuery 
                ? 'Try a different search term'
                : 'Start connecting with language learners'
              }
            </p>
            {searchQuery ? (
              <button 
                onClick={() => setSearchQuery('')}
                className="btn btn-primary"
              >
                Clear Search
              </button>
            ) : (
              <Link to="/find-partners" className="btn btn-primary">
                Find Language Partners
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredFriends.map((friend) => (
              <Link
                key={friend._id}
                to={`/chat/${friend._id}`}
                className="card bg-base-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
              >
                <div className="card-body p-3 text-center">
                  <div className="avatar online mx-auto">
                    <div className="w-16 rounded-full">
                      <img
                        src={getAvatarUrl(friend)}
                        alt={friend.fullName}
                        onError={(e) => {
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.fullName || 'User')}&background=random&size=128`;
                        }}
                      />
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
        )}
      </div>
    </div>
  );
};

export default FriendsPage;