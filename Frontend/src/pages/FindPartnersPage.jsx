import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRecommendedPartners, sendFriendReqests } from "../lib/api";
import { Sparkles, RefreshCw, UserPlus, CheckCircle, Zap, ArrowLeft, AlertCircle, Edit } from "lucide-react";
import Avatar from "../component/Avatar";
import toast from "react-hot-toast";
import { useNavigate } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { getRequiredFieldsForMatching } from "../utils/profileHelper";

const FindPartnersPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { authUser } = useAuthUser();
  const [sentRequests, setSentRequests] = useState(new Set());

  // Check profile completeness
  const missingFields = getRequiredFieldsForMatching(authUser || {});
  const isProfileComplete = missingFields.length === 0;

  const { data: matchesData, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["recommended-partners"],
    queryFn: () => getRecommendedPartners(),
    enabled: isProfileComplete, // Only fetch if profile is complete
    onSuccess: (data) => {
      console.log("✅ Matches loaded:", data);
    },
    onError: (error) => {
      console.error("❌ Error loading matches:", error);
    }
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

  console.log("📊 FindPartnersPage Debug:", {
    isLoading,
    isError,
    error: error?.message,
    matchesData,
    matchesCount: matches.length
  });

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

  const getScoreLabel = (score) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Low";
  };

  const getScoreDescription = (score) => {
    if (score >= 80) return "Highly compatible - Perfect practice partner!";
    if (score >= 60) return "Good match - Compatible in most areas";
    if (score >= 40) return "Fair match - Some compatibility";
    return "Limited compatibility";
  };

  return (
    <div className="min-h-screen bg-base-100 pb-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-secondary p-4 sm:p-6 text-primary-content">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Back Button - Always Visible */}
            <button
              onClick={() => navigate("/")}
              className="btn btn-ghost btn-sm sm:btn-md btn-circle flex-shrink-0"
              aria-label="Back to home"
            >
              <ArrowLeft size={20} className="sm:w-6 sm:h-6" />
            </button>

            {/* Title Section */}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-3xl font-bold flex items-center gap-2">
                <Sparkles size={24} className="sm:w-8 sm:h-8 flex-shrink-0" />
                <span className="truncate">Find Practice Partners</span>
              </h1>
              <p className="mt-1 sm:mt-2 text-xs sm:text-base opacity-90 hidden sm:block">
                Smart matches based on your learning goals and availability
              </p>
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => refetch()}
              className="btn btn-ghost btn-sm sm:btn-md gap-2 flex-shrink-0"
              disabled={isLoading}
            >
              <RefreshCw size={16} className={`sm:w-[18px] sm:h-[18px] ${isLoading ? "animate-spin" : ""}`} />
              <span className="hidden md:inline">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Profile Incomplete Warning */}
        {!isProfileComplete && (
          <div className="alert alert-warning mb-6">
            <AlertCircle size={24} />
            <div className="flex-1">
              <h3 className="font-bold">Complete Your Profile to Find Matches</h3>
              <div className="text-sm mt-2">
                <p className="mb-2">We need a few more details to find your perfect practice partners:</p>
                <ul className="list-disc list-inside space-y-1">
                  {missingFields.map((field, idx) => (
                    <li key={idx}>
                      <strong>{field.field}</strong> - {field.reason}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {/* UPDATED: Pass navigation state */}
            <button 
              onClick={() => navigate('/profile', { state: { from: 'find-partner' } })}
              className="btn btn-sm btn-primary gap-2"
            >
              <Edit size={16} />
              Complete Profile
            </button>
          </div>
        )}

        {isProfileComplete && (
          <>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) : matches.length === 0 ? (
              <div className="text-center py-12">
                <Sparkles size={64} className="mx-auto text-base-content/30 mb-4" />
                <h3 className="text-xl font-bold mb-2">No matches found yet</h3>
                <p className="text-base-content/70 mb-4">
                  Try updating your profile or check back later for new matches
                </p>
                <button 
                  onClick={() => navigate('/profile')}
                  className="btn btn-primary"
                >
                  Update Profile
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
                          {/* Match Score Badge with Details */}
                          <div className="mb-3">
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <div 
                                className={`badge badge-lg gap-2 ${getScoreBadgeClass(match.overallScore)}`}
                              >
                                <Zap size={14} />
                                {match.overallScore}% {getScoreLabel(match.overallScore)}
                              </div>
                            </div>
                            <p className="text-xs text-base-content/60">
                              {getScoreDescription(match.overallScore)}
                            </p>
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

                          {/* Match Reasons - Enhanced */}
                          {match.reasons && match.reasons.length > 0 && (
                            <div className="bg-base-300/50 rounded-lg p-3 mb-3">
                              <p className="text-xs font-semibold mb-2 flex items-center gap-1 text-primary">
                                <Sparkles size={14} />
                                Why {match.overallScore >= 80 ? "you're a great match" : "this might work"}:
                              </p>
                              <ul className="text-xs space-y-1.5">
                                {match.reasons.map((reason, idx) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <span className="text-success mt-0.5">✓</span>
                                    <span className="flex-1">{reason}</span>
                                  </li>
                                ))}
                              </ul>
                              
                              {/* Score Breakdown */}
                              {match.scoreBreakdown && (
                                <div className="mt-3 pt-3 border-t border-base-content/10">
                                  <p className="text-xs font-semibold mb-2">Match Details:</p>
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    {match.scoreBreakdown.languageCompatibility >= 70 && (
                                      <div className="flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full bg-success"></div>
                                        <span>Language: {Math.round(match.scoreBreakdown.languageCompatibility)}%</span>
                                      </div>
                                    )}
                                    {match.scoreBreakdown.availabilityMatch >= 50 && (
                                      <div className="flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full bg-info"></div>
                                        <span>Schedule: {Math.round(match.scoreBreakdown.availabilityMatch)}%</span>
                                      </div>
                                    )}
                                    {match.scoreBreakdown.goalsAlignment >= 50 && (
                                      <div className="flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full bg-warning"></div>
                                        <span>Goals: {Math.round(match.scoreBreakdown.goalsAlignment)}%</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
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
          </>
        )}
      </div>
    </div>
  );
};

export default FindPartnersPage;