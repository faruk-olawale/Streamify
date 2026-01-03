import { CheckCircleIcon, UserPlusIcon, MapPinIcon, MessageCircleIcon } from "lucide-react";
import { LANGUAGE_TO_FLAG } from "../constants";
import { Link } from "react-router";

const FriendCard = ({ friend, sendRequest, isRequestSent, isFriend = false }) => {
  return (
    <div className="card bg-base-200 hover:shadow-md transition-shadow">
      <div className="card-body p-4">

        {/* USER INFO + LOCATION */}
        <div className="flex items-center gap-3 mb-3">
          <div className="avatar">
            <div className="w-12 h-12 rounded-full">
              <img src={friend.profilePic} alt={friend.fullName} />
            </div>
          </div>

          <div className="flex flex-col">
            <h3 className="font-semibold truncate">{friend.fullName}</h3>

            {friend.location && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPinIcon className="size-4" />
                <span>{friend.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* BIO */}
        {friend.bio && (
          <p className="text-sm text-base-content/70 mb-3 line-clamp-2">
            {friend.bio}
          </p>
        )}

        {/* LANGUAGES */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="badge badge-secondary text-xs">
            {getLanguageFlag(friend.nativeLanguages)}
            Native: {friend.nativeLanguages || ""}
          </span>

          <span className="badge badge-outline text-xs">
            {getLanguageFlag(friend.learningLanguages)}
            Learning: {friend.learningLanguages || "N/A"}
          </span>
        </div>

        {/* BUTTON - Show Message for friends, Send Request for others */}
        {isFriend ? (
          <Link 
            to={`/chat/${friend._id}`} 
            className="btn btn-outline text-xs w-full"
          >
            <MessageCircleIcon className="size-4 mr-2" />
            Message
          </Link>
        ) : (
          <button
            className={`btn w-full mt-2 ${isRequestSent ? "btn-disabled" : "btn-primary"}`}
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
    </div>
  );
};

export default FriendCard;

export function getLanguageFlag(language) {
  if (!language) return null;

  const langLower = language.toLowerCase();
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