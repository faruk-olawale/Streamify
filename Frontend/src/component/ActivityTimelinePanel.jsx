import { UserPlus, MessageSquare, Pin, Edit, Calendar, TrendingUp, Award, Users } from "lucide-react";

const ActivityTimelinePanel = ({ group }) => {
  // Mock activity data - in real app, fetch from API
  const activities = [
    {
      id: 1,
      type: "member_joined",
      user: { name: "Sarah Chen", image: "https://via.placeholder.com/40" },
      timestamp: new Date(Date.now() - 3600000),
      description: "joined the group",
    },
    {
      id: 2,
      type: "message_pinned",
      user: { name: "Admin", image: "https://via.placeholder.com/40" },
      timestamp: new Date(Date.now() - 7200000),
      description: "pinned a message",
    },
    {
      id: 3,
      type: "members_milestone",
      timestamp: new Date(Date.now() - 86400000),
      description: "Group reached 50 members! 🎉",
      count: 50,
    },
    {
      id: 4,
      type: "group_updated",
      user: { name: "John Admin", image: "https://via.placeholder.com/40" },
      timestamp: new Date(Date.now() - 172800000),
      description: "updated group settings",
    },
    {
      id: 5,
      type: "practice_session",
      timestamp: new Date(Date.now() - 259200000),
      description: "Group practice session completed",
      participants: 12,
    },
    {
      id: 6,
      type: "member_joined",
      user: { name: "Mike Rodriguez", image: "https://via.placeholder.com/40" },
      timestamp: new Date(Date.now() - 345600000),
      description: "joined the group",
    },
    {
      id: 7,
      type: "achievement",
      timestamp: new Date(Date.now() - 432000000),
      description: "Group completed 100 practice sessions! 🏆",
    },
    {
      id: 8,
      type: "member_joined",
      user: { name: "Emma Thompson", image: "https://via.placeholder.com/40" },
      timestamp: new Date(Date.now() - 518400000),
      description: "joined the group",
    },
  ];

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case "member_joined":
        return <UserPlus size={16} className="text-success" />;
      case "message_pinned":
        return <Pin size={16} className="text-warning" />;
      case "group_updated":
        return <Edit size={16} className="text-info" />;
      case "practice_session":
        return <Calendar size={16} className="text-primary" />;
      case "members_milestone":
        return <Users size={16} className="text-secondary" />;
      case "achievement":
        return <Award size={16} className="text-accent" />;
      default:
        return <TrendingUp size={16} className="text-base-content/50" />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case "member_joined":
        return "border-success/20 bg-success/5";
      case "message_pinned":
        return "border-warning/20 bg-warning/5";
      case "group_updated":
        return "border-info/20 bg-info/5";
      case "practice_session":
        return "border-primary/20 bg-primary/5";
      case "members_milestone":
        return "border-secondary/20 bg-secondary/5";
      case "achievement":
        return "border-accent/20 bg-accent/5";
      default:
        return "border-base-300 bg-base-100";
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold mb-1">Activity Timeline</h4>
        <p className="text-sm text-base-content/60">Recent group activities and events</p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="p-3 bg-primary/10 rounded-lg text-center">
          <div className="text-lg font-bold text-primary">5</div>
          <div className="text-xs text-base-content/60">New members this week</div>
        </div>
        <div className="p-3 bg-secondary/10 rounded-lg text-center">
          <div className="text-lg font-bold text-secondary">24</div>
          <div className="text-xs text-base-content/60">Messages today</div>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {activities.map((activity, index) => (
          <div
            key={activity.id}
            className={`relative p-3 rounded-lg border ${getActivityColor(activity.type)} transition-all hover:scale-[1.02]`}
          >
            {/* Timeline connector */}
            {index !== activities.length - 1 && (
              <div className="absolute left-6 top-12 w-0.5 h-8 bg-base-300"></div>
            )}

            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="w-8 h-8 rounded-full bg-base-100 border border-base-300 flex items-center justify-center flex-shrink-0 relative z-10">
                {getActivityIcon(activity.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {activity.user && (
                      <img
                        src={activity.user.image}
                        alt={activity.user.name}
                        className="w-5 h-5 rounded-full"
                      />
                    )}
                    <span className="text-sm">
                      {activity.user && (
                        <span className="font-semibold">{activity.user.name} </span>
                      )}
                      <span className="text-base-content/70">{activity.description}</span>
                    </span>
                  </div>
                  <span className="text-xs text-base-content/50 whitespace-nowrap flex-shrink-0">
                    {formatTimestamp(activity.timestamp)}
                  </span>
                </div>

                {/* Additional info */}
                {activity.count && (
                  <div className="text-xs text-base-content/60 mt-1">
                    <Users size={12} className="inline mr-1" />
                    {activity.count} members
                  </div>
                )}
                {activity.participants && (
                  <div className="text-xs text-base-content/60 mt-1">
                    <UserPlus size={12} className="inline mr-1" />
                    {activity.participants} participants
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load more */}
      <button className="btn btn-ghost btn-sm btn-block">
        Load more activity
      </button>
    </div>
  );
};

export default ActivityTimelinePanel;