import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  getRecommendedUsers,
  getOutgoingFriendsReqs,
  sendFriendReqests,
} from "../lib/api";
import { Sparkles, Filter, Search, Users } from "lucide-react";
import FriendCard from "../component/FriendCard";
import { LANGUAGES } from "../constants";

const FindPartnersPage = () => {
  const queryClient = useQueryClient();
  const [outgoingRequestIds, setOutgoingRequestIds] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Filter states
  const [filters, setFilters] = useState({
    language: "",
    minMatchScore: 0,
    onlineOnly: false,
  });

  /* =======================
     QUERIES
  ======================= */
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

  /* =======================
     FILTERING LOGIC
  ======================= */
  const filteredUsers = recommendedUsers.filter((user) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = user.fullName?.toLowerCase().includes(query);
      const matchesBio = user.bio?.toLowerCase().includes(query);
      const matchesLocation = user.location?.toLowerCase().includes(query);
      
      if (!matchesName && !matchesBio && !matchesLocation) {
        return false;
      }
    }

    // Language filter
    if (filters.language) {
      const hasLanguage = 
        user.nativeLanguages?.includes(filters.language) ||
        user.learningLanguages?.includes(filters.language);
      
      if (!hasLanguage) return false;
    }

    // Match score filter
    if (filters.minMatchScore > 0) {
      if (!user.matchScore || user.matchScore < filters.minMatchScore) {
        return false;
      }
    }

    // Online filter (placeholder - implement real online status)
    if (filters.onlineOnly) {
      // TODO: Check real online status
      // For now, randomly filter for demo
      if (Math.random() > 0.3) return false;
    }

    return true;
  });

  const hasActiveFilters = 
    filters.language || 
    filters.minMatchScore > 0 || 
    filters.onlineOnly || 
    searchQuery;

  const clearFilters = () => {
    setFilters({
      language: "",
      minMatchScore: 0,
      onlineOnly: false,
    });
    setSearchQuery("");
  };

  return (
    <div className="min-h-screen bg-base-100 px-4 sm:px-6 lg:px-8 py-6">
      <div className="container mx-auto space-y-6">

        {/* =======================
           HEADER
        ======================= */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            {/* <Link 
              to="/" 
              className="btn btn-ghost btn-circle"
              title="Back to home"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </Link> */}
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                <Sparkles className="text-primary" size={32} />
                Find Language Partners
              </h1>
              <p className="text-sm opacity-70 mt-1">
                Discover {recommendedUsers.length} learners matched to your profile
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 opacity-50" />
              <input
                type="text"
                placeholder="Search by name, bio, or location..."
                className="input input-bordered w-full pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn ${hasActiveFilters ? 'btn-primary' : 'btn-outline'}`}
            >
              <Filter className="size-5" />
              Filters
              {hasActiveFilters && (
                <span className="badge badge-sm">
                  {[filters.language, filters.minMatchScore > 0, filters.onlineOnly, searchQuery].filter(Boolean).length}
                </span>
              )}
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="card bg-base-200">
              <div className="card-body p-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  
                  {/* Language Filter */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Language</span>
                    </label>
                    <select
                      className="select select-bordered select-sm"
                      value={filters.language}
                      onChange={(e) => setFilters({ ...filters, language: e.target.value })}
                    >
                      <option value="">All Languages</option>
                      {LANGUAGES.map((lang) => (
                        <option key={lang} value={lang}>{lang}</option>
                      ))}
                    </select>
                  </div>

                  {/* Match Score Filter */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Min Match Score</span>
                    </label>
                    <select
                      className="select select-bordered select-sm"
                      value={filters.minMatchScore}
                      onChange={(e) => setFilters({ ...filters, minMatchScore: Number(e.target.value) })}
                    >
                      <option value="0">Any Score</option>
                      <option value="80">Excellent (80%+)</option>
                      <option value="60">Great (60%+)</option>
                      <option value="40">Good (40%+)</option>
                    </select>
                  </div>

                  {/* Online Only */}
                  <div className="form-control">
                    <label className="label cursor-pointer justify-start gap-2">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-primary"
                        checked={filters.onlineOnly}
                        onChange={(e) => setFilters({ ...filters, onlineOnly: e.target.checked })}
                      />
                      <span className="label-text">Show online only</span>
                    </label>
                  </div>
                </div>

                {hasActiveFilters && (
                  <div className="flex justify-end mt-2">
                    <button onClick={clearFilters} className="btn btn-ghost btn-sm">
                      Clear Filters
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Results Count */}
          <div className="flex items-center justify-between text-sm">
            <span className="opacity-70">
              {filteredUsers.length} {filteredUsers.length === 1 ? 'match' : 'matches'} found
            </span>
            
            {hasActiveFilters && (
              <span className="text-primary font-medium">
                Filters active
              </span>
            )}
          </div>
        </div>

        {/* =======================
           RESULTS GRID
        ======================= */}
        {loadingUsers ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="card bg-base-200 p-8 text-center">
            <Users className="size-16 mx-auto mb-4 text-primary opacity-50" />
            <h3 className="font-semibold text-lg mb-2">
              {hasActiveFilters ? 'No matches found' : 'No recommendations yet'}
            </h3>
            <p className="opacity-70 mb-4">
              {hasActiveFilters 
                ? 'Try adjusting your filters or search query'
                : 'Complete your profile to get personalized matches'
              }
            </p>
            {hasActiveFilters ? (
              <button onClick={clearFilters} className="btn btn-primary btn-sm mx-auto">
                Clear Filters
              </button>
            ) : (
              <a href="/profile" className="btn btn-primary btn-sm mx-auto">
                Complete Profile
              </a>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((user) => (
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

        {/* Load More (Future Enhancement) */}
        {filteredUsers.length >= 20 && (
          <div className="text-center py-8">
            <button className="btn btn-outline">
              Load More
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FindPartnersPage;