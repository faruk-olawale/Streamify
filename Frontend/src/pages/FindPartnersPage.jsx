import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRecommendedPartners, sendFriendReqests } from "../lib/api";
import { Sparkles, RefreshCw, UserPlus, CheckCircle, Zap } from "lucide-react";
import Avatar from "../component/Avatar";
import toast from "react-hot-toast";

const FindPartnersPage = () => {
  const queryClient = useQueryClient();
  const [sentRequests, setSentRequests] = useState(new Set());

  const { data: matchesData, isLoading, refetch } = useQuery({
    queryKey: ["recommended-partners"],
    queryFn: () => getRecommendedPartners(),
  });

  const { mutate: sendRequestMutation } = useMutation({
    mutationFn: sendFriendReqests,
    onSuccess: (_, userId) => {
      toast.success("Friend request sent!");
      setSentRequests(prev => new Set([...prev, userId]));
      queryClient.invalidateQueries({ queryKey: ["outgoingFriendsReqs"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to send request");
    },
  });

  const matches = matchesData?.matches || [];

  const getScoreColor = (score) => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-warning";
    return "text-info";
  };

  const getScoreBadgeClass = (score) => {
    if (score >= 80) return "badge-success";
    if (score >= 60) return "badge-warning";
    return "badge-info";
  };

  return (
    <div className="min-h-screen bg-base-100 pb-24 lg:pb-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-secondary p-6 text-primary-content">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Sparkles size={32} />
                Find Practice Partners
              </h1>
              <p className="mt-2 opacity-90">
                Smart matches based on your learning goals and availability
              </p>
            </div>
            <button
              onClick={() => refetch()}
              className="btn btn-ghost gap-2"
              disabled={isLoading}
            >
              <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-12">
            <Sparkles size={64} className="mx-auto text-base-content/30 mb-4" />
            <h3 className="text-xl font-bold mb-2">No matches found yet</h3>
            <p className="text-base-content/70 mb-4">
              Complete your learning profile to get better recommendations
            </p>
            <button className="btn btn-primary">
              Complete Profile
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">
                Your Top Matches ({matches.length})
              </h2>
              <p className="text-base-content/70">
                These partners are highly compatible with your learning goals
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {matches.map((match) => {
                const user = match.user;
                const isRequestSent = sentRequests.has(user._id);

                return (
                  <div
                    key={user._id}
                    className="card bg-base-200 hover:shadow-lg transition-all"
                  >
                    <div className="card-body p-4">
                      {/* Match Score Badge */}
                      <div className="flex items-start justify-between mb-3">
                        <div 
                          className={`badge badge-lg gap-2 ${getScoreBadgeClass(match.overallScore)}`}
                        >
                          <Zap size={14} />
                          {match.overallScore}% Match
                        </div>
                      </div>

                      {/* User Info */}
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar
                          src={user.profilePic}
                          alt={user.fullName}
                          size="lg"
                          showRing={false}
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg truncate">
                            {user.fullName}
                          </h3>
                          {user.location && (
                            <p className="text-sm text-base-content/60 truncate">
                              {user.location}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Bio */}
                      {user.bio && (
                        <p className="text-sm text-base-content/70 mb-3 line-clamp-2">
                          {user.bio}
                        </p>
                      )}

                      {/* Languages */}
                      <div className="space-y-2 mb-3">
                        {user.nativeLanguages && user.nativeLanguages.length > 0 && (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold">Speaks:</span>
                            {user.nativeLanguages.map(lang => (
                              <span key={lang} className="badge badge-secondary badge-sm">
                                {lang}
                              </span>
                            ))}
                          </div>
                        )}
                        {user.learningLanguages && user.learningLanguages.length > 0 && (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold">Learning:</span>
                            {user.learningLanguages.map(lang => (
                              <span key={lang} className="badge badge-outline badge-sm">
                                {lang}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Match Reasons */}
                      {match.reasons && match.reasons.length > 0 && (
                        <div className="bg-base-300/50 rounded-lg p-3 mb-3">
                          <p className="text-xs font-semibold mb-1 flex items-center gap-1">
                            <Sparkles size={12} />
                            Why you match:
                          </p>
                          <ul className="text-xs space-y-1">
                            {match.reasons.slice(0, 3).map((reason, idx) => (
                              <li key={idx} className="flex items-start gap-1">
                                <span className="text-primary">•</span>
                                <span>{reason}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Goals */}
                      {user.learningGoals && user.learningGoals.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {user.learningGoals.slice(0, 3).map(goal => (
                            <span key={goal} className="badge badge-xs badge-ghost">
                              {goal}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Availability */}
                      {user.availability && user.availability.length > 0 && (
                        <div className="text-xs text-base-content/60 mb-3">
                          Available: {user.availability.slice(0, 2).join(", ")}
                        </div>
                      )}

                      {/* Action Button */}
                      <button
                        onClick={() => sendRequestMutation(user._id)}
                        disabled={isRequestSent}
                        className={`btn w-full ${
                          isRequestSent ? "btn-disabled" : "btn-primary"
                        }`}
                      >
                        {isRequestSent ? (
                          <>
                            <CheckCircle size={18} />
                            Request Sent
                          </>
                        ) : (
                          <>
                            <UserPlus size={18} />
                            Send Request
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FindPartnersPage;