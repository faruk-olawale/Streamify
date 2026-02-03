import { useState, useEffect } from "react";
import {
  UserPlus,
  UserMinus,
  Users,
  Crown,
  Shield,
  Edit,
  MessageSquare,
  Calendar,
  TrendingUp,
  CheckCircle,
  XCircle,
  LogOut,
  Trash2,
  Clock,
} from "lucide-react";

const ActivityTimelinePanel = ({ group, groupId }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!group) return;

    // Generate activity timeline from group data
    const generateActivities = () => {
      const timeline = [];

      // Group creation
      if (group.createdAt) {
        timeline.push({
          id: `created-${group._id}`,
          type: "group_created",
          icon: Users,
          color: "text-primary",
          bgColor: "bg-primary/10",
          title: "Group Created",
          description: `${group.createdBy?.fullName || "Someone"} created this group`,
          timestamp: group.createdAt,
          user: group.createdBy,
        });
      }

      // Members joined (current members)
      group.members?.forEach((member, index) => {
        if (member._id !== group.createdBy?._id) {
          timeline.push({
            id: `member-joined-${member._id}`,
            type: "member_joined",
            icon: UserPlus,
            color: "text-success",
            bgColor: "bg-success/10",
            title: "Member Joined",
            description: `${member.fullName} joined the group`,
            timestamp: member.joinedAt || group.createdAt,
            user: member,
          });
        }
      });

      // Admin promotions
      group.admins?.forEach((admin) => {
        if (admin._id !== group.createdBy?._id) {
          timeline.push({
            id: `admin-promoted-${admin._id}`,
            type: "admin_promoted",
            icon: Shield,
            color: "text-info",
            bgColor: "bg-info/10",
            title: "Admin Promoted",
            description: `${admin.fullName} was promoted to admin`,
            timestamp: admin.promotedAt || group.createdAt,
            user: admin,
          });
        }
      });

      // Pending requests
      group.pendingRequests?.forEach((request) => {
        timeline.push({
          id: `request-pending-${request.userId._id}`,
          type: "join_request",
          icon: Clock,
          color: "text-warning",
          bgColor: "bg-warning/10",
          title: "Join Request",
          description: `${request.userId.fullName} requested to join`,
          timestamp: request.requestedAt || new Date(),
          user: request.userId,
        });
      });

      // Sort by timestamp (newest first)
      timeline.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      setActivities(timeline);
      setLoading(false);
    };

    generateActivities();
  }, [group]);

  const getRelativeTime = (timestamp) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffInSeconds = Math.floor((now - past) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
    return past.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="mt-4 text-sm text-base-content/60">Loading activity...</p>
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
          <TrendingUp size={32} className="text-primary/50" />
        </div>
        <p className="text-sm text-base-content/50 font-medium">No activity yet</p>
        <p className="text-xs text-base-content/40 mt-1">
          Group activity will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="stat bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-3 border border-primary/20">
          <div className="stat-title text-xs opacity-70">Members</div>
          <div className="stat-value text-2xl text-primary">
            {group.members?.length || 0}
          </div>
        </div>
        <div className="stat bg-gradient-to-br from-success/10 to-success/5 rounded-xl p-3 border border-success/20">
          <div className="stat-title text-xs opacity-70">Admins</div>
          <div className="stat-value text-2xl text-success">
            {group.admins?.length || 0}
          </div>
        </div>
        <div className="stat bg-gradient-to-br from-warning/10 to-warning/5 rounded-xl p-3 border border-warning/20">
          <div className="stat-title text-xs opacity-70">Pending</div>
          <div className="stat-value text-2xl text-warning">
            {group.pendingRequests?.length || 0}
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="space-y-3">
        <h4 className="font-bold text-lg flex items-center gap-2 mb-4">
          <TrendingUp size={20} className="text-primary" />
          Activity Timeline
        </h4>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[23px] top-0 bottom-0 w-0.5 bg-base-300"></div>

          {/* Activity items */}
          <div className="space-y-4">
            {activities.map((activity, index) => {
              const Icon = activity.icon;
              return (
                <div
                  key={activity.id}
                  className="relative flex gap-4 group"
                  style={{
                    animation: `fadeInUp 0.3s ease-out ${index * 0.05}s backwards`,
                  }}
                >
                  {/* Icon */}
                  <div
                    className={`flex-shrink-0 w-12 h-12 rounded-xl ${activity.bgColor} ${activity.color} flex items-center justify-center z-10 ring-4 ring-base-100 group-hover:scale-110 transition-transform shadow-md`}
                  >
                    <Icon size={20} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 bg-base-200/50 rounded-xl p-4 border border-base-300/50 group-hover:bg-base-200 group-hover:shadow-md transition-all">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <h5 className="font-semibold text-sm">{activity.title}</h5>
                        <p className="text-xs text-base-content/70 mt-1 break-words">
                          {activity.description}
                        </p>
                      </div>
                      {activity.user && (
                        <div className="avatar flex-shrink-0">
                          <div className="w-8 h-8 rounded-full ring-2 ring-primary/20">
                            <img
                              src={
                                activity.user.profilePic ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                  activity.user.fullName || "User"
                                )}&background=random`
                              }
                              alt={activity.user.fullName}
                              onError={(e) => {
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                  activity.user.fullName || "User"
                                )}&background=random`;
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-base-content/50 flex-wrap">
                      <Calendar size={12} />
                      <span>{getRelativeTime(activity.timestamp)}</span>
                      <span>•</span>
                      <span className="hidden sm:inline">
                        {new Date(activity.timestamp).toLocaleString()}
                      </span>
                      <span className="sm:hidden">
                        {new Date(activity.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Animation keyframes */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default ActivityTimelinePanel;