import { useState } from "react";
import { CheckCircleIcon, UserPlusIcon, MapPinIcon, MessageCircleIcon, ChevronDown, ChevronUp, Sparkles, Heart, ThumbsUp, Check } from "lucide-react";
import { LANGUAGE_TO_FLAG } from "../constants";
import { Link } from "react-router";
import Avatar from "./Avatar";

const FriendCard = ({ friend, sendRequest, isRequestSent, isFriend = false }) => {
  const [showMatchDetails, setShowMatchDetails] = useState(false);
  
  // Check if we have match data (only for recommended users, not friends)
  const hasMatchData = !isFriend && friend.matchScore !== undefined;

  return (
    <div className="card bg-base-200 hover:shadow-md transition-shadow relative">
      {/* MATCH SCORE BADGE - Top right corner */}
      {hasMatchData && (
        <div className="absolute top-3 right-3 z-10">
          <MatchScoreBadge score={friend.matchScore} tier={friend.matchTier} />
        </div>
      )}

      <div className="card-body p-4">
        {/* USER INFO + LOCATION */}
        <div className="flex items-center gap-3 mb-3">
          <Avatar 
            src={friend.profilePic}
            alt={friend.fullName}
            size="md"
            showRing={false}
          />

          <div className="flex flex-col flex-1 min-w-0">
            <h3 className="font-semibold truncate">{friend.fullName}</h3>

            {friend.location && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPinIcon className="size-4" />
                <span className="truncate">{friend.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* BIO */}
        {friend.bio && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {friend.bio}
          </p>
        )}

        {/* LANGUAGES */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {/* Native Languages */}
          {friend.nativeLanguages && friend.nativeLanguages.length > 0 && (
            <span className="badge badge-secondary text-xs flex items-center gap-1">
              {getLanguageFlag(friend.nativeLanguages[0])}
              Native: {friend.nativeLanguages.join(", ")}
            </span>
          )}

          {/* Learning Languages */}
          {friend.learningLanguages && friend.learningLanguages.length > 0 ? (
            <span className="badge badge-outline text-xs flex items-center gap-1">
              {getLanguageFlag(friend.learningLanguages[0])}
              Learning: {friend.learningLanguages.join(", ")}
            </span>
          ) : (
            <span className="badge badge-outline text-xs opacity-50">
              Learning: N/A
            </span>
          )}
        </div>

        {/* MATCH REASONS - Collapsible (only for non-friends with match data) */}
        {hasMatchData && friend.matchReasons && friend.matchReasons.length > 0 && (
          <div className="mb-3">
            <button
              onClick={() => setShowMatchDetails(!showMatchDetails)}
              className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
            >
              {showMatchDetails ? (
                <>
                  <ChevronUp className="size-3" />
                  Hide match details
                </>
              ) : (
                <>
                  <ChevronDown className="size-3" />
                  Why you're matched
                </>
              )}
            </button>

            {showMatchDetails && (
              <div className="mt-2 p-3 bg-base-100 rounded-lg space-y-2 animate-in fade-in duration-200">
                {/* Match Reasons */}
                {friend.matchReasons.map((reason, index) => (
                  <div key={index} className="flex items-start gap-2 text-xs">
                    <Check className="size-3 text-success mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">{reason}</span>
                  </div>
                ))}

                {/* Proficiency Levels */}
                {friend.proficiencyLevels && Object.keys(friend.proficiencyLevels).length > 0 && (
                  <div className="pt-2 border-t border-base-content/10">
                    <p className="text-xs font-semibold text-gray-500 mb-1">Proficiency:</p>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(friend.proficiencyLevels).map(([lang, data]) => (
                        <span key={lang} className="badge badge-outline badge-xs">
                          {lang}: {data.level || data}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Shared Goals */}
                {friend.matchDetails?.sharedGoals && friend.matchDetails.sharedGoals.length > 0 && (
                  <div className="pt-2 border-t border-base-content/10">
                    <p className="text-xs font-semibold text-gray-500 mb-1">Shared Goals:</p>
                    <div className="flex flex-wrap gap-1">
                      {friend.matchDetails.sharedGoals.map((goalData, index) => (
                        <div key={index} className="contents">
                          {goalData.goals?.map((goal, i) => (
                            <span key={i} className="badge badge-accent badge-xs">
                              {goal}
                            </span>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* BUTTON - Show Message for friends, Send Request for others */}
        {isFriend ? (
          <Link 
            to={`/chat/${friend._id}`} 
            className="btn btn-outline text-xs"
          >
            <MessageCircleIcon className="size-4 mr-2" />
            Message
          </Link>
        ) : (
          <button
            className={`btn w-full mt-2 text-xs ${isRequestSent ? "btn-disabled" : "btn-primary"}`}
            onClick={() => sendRequest(friend._id)}
            disabled={isRequestSent}
          >
            {isRequestSent ? (
              <>
                <CheckCircleIcon className="size-4 mr-2" />
                Request Sent
              </>
            ) : (
              <>
                <UserPlusIcon className="size-4 mr-2" />
                Send Friend Request
              </>
            )}
          </button>
        )}
      </div>

      {/* Tier Glow Effect for Excellent Matches */}
      {hasMatchData && friend.matchTier === 'excellent' && (
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-rose-500/5 pointer-events-none rounded-2xl" />
      )}
    </div>
  );
};

export default FriendCard;

// MATCH SCORE BADGE COMPONENT
const MatchScoreBadge = ({ score, tier }) => {
  const getTierConfig = () => {
    switch (tier) {
      case 'excellent':
        return {
          bgClass: 'bg-gradient-to-r from-pink-500 to-rose-500',
          textClass: 'text-white',
          icon: Sparkles,
        };
      case 'great':
        return {
          bgClass: 'bg-gradient-to-r from-purple-500 to-indigo-500',
          textClass: 'text-white',
          icon: Heart,
        };
      case 'good':
        return {
          bgClass: 'bg-gradient-to-r from-blue-500 to-cyan-500',
          textClass: 'text-white',
          icon: ThumbsUp,
        };
      default:
        return {
          bgClass: 'bg-base-300',
          textClass: 'text-base-content',
          icon: Check,
        };
    }
  };

  const config = getTierConfig();
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-1 rounded-full ${config.bgClass} ${config.textClass} text-xs px-2.5 py-1 font-semibold shadow-lg`}>
      <Icon className="size-3" />
      <span>{score}%</span>
    </div>
  );
};

// LANGUAGE FLAG HELPER (keep your existing function)
export function getLanguageFlag(language) {
  if (!language) return null;

  // If it's an array, get the first element
  const langToCheck = Array.isArray(language) ? language[0] : language;
  
  if (!langToCheck) return null;

  const langLower = langToCheck.toLowerCase();
  const countryCode = LANGUAGE_TO_FLAG[langLower];

  if (!countryCode) return null;

  return (
    <img
      src={`https://flagcdn.com/24x18/${countryCode}.png`}
      alt={`${langLower} flag`}
      className="h-3 mr-1 inline-block"
    />
  );
}