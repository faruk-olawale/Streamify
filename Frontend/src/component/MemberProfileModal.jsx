import { X, MessageSquare, Video, Calendar, Globe, Target, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router";

const MemberProfileModal = ({ member, group, onClose }) => {
  const navigate = useNavigate();

  // Mock data - in real app, fetch from API
  const memberProfile = {
    languages: ["Spanish", "English", "French"],
    learningGoals: "Improve conversational fluency and pronunciation",
    practiceSchedule: "Weekdays 7-9 PM EST",
    joinedDate: "2 months ago",
    totalSessions: 24,
    mutualFriends: 5,
  };

  const handleSendDM = () => {
    // Navigate to DM with this user
    navigate(`/chat/${member._id}`);
    onClose();
  };

  const handleStartVideoCall = () => {
    // Implement video call functionality
    alert("Video call feature coming soon!");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fadeIn">
      <div className="bg-base-200 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl animate-slideUp">
        {/* Header */}
        <div className="sticky top-0 bg-base-200 border-b border-base-300 p-4 flex items-center justify-between">
          <h3 className="font-bold text-lg">Member Profile</h3>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
            <X size={20} />
          </button>
        </div>

        {/* Profile Content */}
        <div className="p-6 space-y-6">
          {/* Avatar and Basic Info */}
          <div className="text-center">
            <div className="avatar">
              <div className="w-24 h-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                <img
                  src={member.profilePic}
                  alt={member.fullName}
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      member.fullName
                    )}&background=random`;
                  }}
                />
              </div>
            </div>
            <h4 className="font-bold text-xl mt-3">{member.fullName}</h4>
            <p className="text-sm text-base-content/60">@{member.fullName.toLowerCase().replace(/\s+/g, "")}</p>
            
            {/* Status */}
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-success/10 text-success rounded-full text-sm">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
              Available to practice
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleSendDM}
              className="btn btn-primary gap-2"
            >
              <MessageSquare size={18} />
              Send DM
            </button>
            <button
              onClick={handleStartVideoCall}
              className="btn btn-secondary gap-2"
            >
              <Video size={18} />
              Video Call
            </button>
          </div>

          {/* Languages */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Globe size={18} className="text-primary" />
              <h5 className="font-semibold">Languages</h5>
            </div>
            <div className="flex flex-wrap gap-2">
              {memberProfile.languages.map((lang, index) => (
                <span
                  key={index}
                  className="badge badge-lg badge-primary"
                >
                  {lang}
                </span>
              ))}
            </div>
          </div>

          {/* Learning Goals */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Target size={18} className="text-secondary" />
              <h5 className="font-semibold">Learning Goals</h5>
            </div>
            <p className="text-sm text-base-content/70">
              {memberProfile.learningGoals}
            </p>
          </div>

          {/* Practice Schedule */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={18} className="text-accent" />
              <h5 className="font-semibold">Practice Schedule</h5>
            </div>
            <p className="text-sm text-base-content/70">
              {memberProfile.practiceSchedule}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-base-100 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {memberProfile.totalSessions}
              </div>
              <div className="text-xs text-base-content/60">Sessions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary">
                {memberProfile.mutualFriends}
              </div>
              <div className="text-xs text-base-content/60">Mutual</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">
                {memberProfile.joinedDate}
              </div>
              <div className="text-xs text-base-content/60">Joined</div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="text-xs text-center text-base-content/50">
            Member of {group.name}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default MemberProfileModal;