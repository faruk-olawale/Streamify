import { useState } from "react";
import {
  X,
  Image as ImageIcon,
  FileText,
  Pin,
  Search,
  Users,
  Bell,
  BellOff,
  Copy,
  Download,
  Share2,
  MessageSquarePlus,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Link as LinkIcon,
  Trash2,
  Archive,
  Flag,
  Smile,
  Paperclip,
  AtSign,
  Hash,
  Clock,
  TrendingUp,
  Activity,
} from "lucide-react";
import toast from "react-hot-toast";
import ScheduleMessageModal from "./ScheduleMessageModal";
import CreatePollModal from "./CreatePollModal";

const QuickActionsMenu = ({ group, channel, onClose, userRole, authUser }) => {
  const [activeCategory, setActiveCategory] = useState("messaging");
  const [isNotificationMuted, setIsNotificationMuted] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);

  const handleCopyGroupLink = () => {
    const link = `${window.location.origin}/groups/${group._id}`;
    navigator.clipboard.writeText(link);
    toast.success("Group link copied to clipboard!");
  };

  const handleShareGroup = async () => {
    const shareData = {
      title: group.name,
      text: `Join ${group.name} on LanguageConnect!`,
      url: `${window.location.origin}/groups/${group._id}`,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast.success("Shared successfully!");
      } catch (err) {
        if (err.name !== "AbortError") {
          handleCopyGroupLink();
        }
      }
    } else {
      handleCopyGroupLink();
    }
  };

  const handleExportChat = async () => {
    try {
      toast.loading("Preparing chat export...", { id: "export" });
      
      // Fetch recent messages
      const response = await channel.query({
        messages: { limit: 100 },
      });

      const messages = response.messages.map((msg) => ({
        sender: msg.user.name || msg.user.id,
        text: msg.text,
        time: new Date(msg.created_at).toLocaleString(),
      }));

      // Create text content
      let content = `${group.name} - Chat Export\n`;
      content += `Exported on: ${new Date().toLocaleString()}\n`;
      content += `Total messages: ${messages.length}\n`;
      content += `\n${"=".repeat(50)}\n\n`;

      messages.forEach((msg) => {
        content += `[${msg.time}] ${msg.sender}: ${msg.text}\n\n`;
      });

      // Download file
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${group.name}-chat-export-${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Chat exported successfully!", { id: "export" });
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export chat", { id: "export" });
    }
  };

  const handleToggleNotifications = () => {
    setIsNotificationMuted(!isNotificationMuted);
    toast.success(
      isNotificationMuted
        ? "Notifications enabled"
        : "Notifications muted for this group"
    );
  };

  const handleScheduleMessage = () => {
    setShowScheduleModal(true);
  };

  const handleCreatePoll = () => {
    setShowPollModal(true);
  };

  const handleViewStatistics = () => {
    toast.info("Group statistics coming soon!", {
      icon: "📈",
    });
  };

  const handleMentionAll = async () => {
    if (!userRole?.isAdmin) {
      toast.error("Only admins can mention all members");
      return;
    }
    
    try {
      // Create mention text for all members
      const memberMentions = group.members.map(member => ({
        id: member._id,
        name: member.fullName
      }));

      // Send a message with @everyone mention
      await channel.sendMessage({
        text: `@everyone 👋 Attention all members!`,
        mentioned_users: memberMentions.map(m => m.id),
      });

      toast.success("All members have been notified!");
      onClose();
    } catch (error) {
      console.error("Mention all error:", error);
      toast.error("Failed to mention all members");
    }
  };

  const quickActions = {
    messaging: [
      {
        id: "mention-all",
        icon: AtSign,
        label: "Mention All",
        description: "Notify all members",
        action: handleMentionAll,
        adminOnly: true,
        color: "text-info",
        bgColor: "bg-info/10 hover:bg-info/20",
      },
      {
        id: "schedule",
        icon: Clock,
        label: "Schedule Message",
        description: "Send message later",
        action: handleScheduleMessage,
        color: "text-warning",
        bgColor: "bg-warning/10 hover:bg-warning/20",
      },
      {
        id: "poll",
        icon: MessageSquarePlus,
        label: "Create Poll",
        description: "Get group opinions",
        action: handleCreatePoll,
        color: "text-secondary",
        bgColor: "bg-secondary/10 hover:bg-secondary/20",
      },
    ],
    sharing: [
      {
        id: "share",
        icon: Share2,
        label: "Share Group",
        description: "Invite via link",
        action: handleShareGroup,
        color: "text-success",
        bgColor: "bg-success/10 hover:bg-success/20",
      },
      {
        id: "copy-link",
        icon: Copy,
        label: "Copy Link",
        description: "Copy group link",
        action: handleCopyGroupLink,
        color: "text-primary",
        bgColor: "bg-primary/10 hover:bg-primary/20",
      },
      {
        id: "export",
        icon: Download,
        label: "Export Chat",
        description: "Download messages",
        action: handleExportChat,
        color: "text-accent",
        bgColor: "bg-accent/10 hover:bg-accent/20",
      },
    ],
    settings: [
      {
        id: "notifications",
        icon: isNotificationMuted ? BellOff : Bell,
        label: isNotificationMuted ? "Unmute" : "Mute",
        description: isNotificationMuted
          ? "Enable notifications"
          : "Disable notifications",
        action: handleToggleNotifications,
        color: isNotificationMuted ? "text-error" : "text-info",
        bgColor: isNotificationMuted
          ? "bg-error/10 hover:bg-error/20"
          : "bg-info/10 hover:bg-info/20",
      },
      {
        id: "statistics",
        icon: TrendingUp,
        label: "Statistics",
        description: "View group stats",
        action: handleViewStatistics,
        color: "text-primary",
        bgColor: "bg-primary/10 hover:bg-primary/20",
      },
    ],
  };

  const categories = [
    { id: "messaging", label: "Messaging", icon: MessageSquarePlus },
    { id: "sharing", label: "Sharing", icon: Share2 },
    { id: "settings", label: "Settings", icon: Activity },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fadeIn"
        onClick={onClose}
      ></div>

      {/* Menu Panel */}
      <div className="fixed inset-x-0 bottom-0 sm:inset-auto sm:bottom-8 sm:right-8 sm:w-[440px] z-50 animate-slideUp">
        <div className="bg-gradient-to-br from-base-100 to-base-200 rounded-t-3xl sm:rounded-3xl shadow-2xl border-2 border-primary/20 overflow-hidden max-h-[80vh] sm:max-h-[600px] flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 p-5 border-b border-base-300/50 flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
                  <Activity size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Quick Actions</h3>
                  <p className="text-xs text-base-content/60">
                    {group.name}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="btn btn-ghost btn-sm btn-circle hover:bg-error/10 hover:text-error transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex-1 px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-2 ${
                    activeCategory === cat.id
                      ? "bg-primary text-primary-content shadow-lg scale-105"
                      : "bg-base-200/50 text-base-content/60 hover:bg-base-200"
                  }`}
                >
                  <cat.icon size={14} />
                  <span className="hidden sm:inline">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Actions Grid */}
          <div className="p-5 overflow-y-auto flex-1">
            <div className="grid grid-cols-1 gap-3">
              {quickActions[activeCategory].map((action) => {
                // Skip admin-only actions if user is not admin
                if (action.adminOnly && !userRole?.isAdmin) {
                  return null;
                }

                return (
                  <button
                    key={action.id}
                    onClick={() => {
                      action.action();
                      // Don't close menu for toggle actions or modal actions
                      if (action.id !== "notifications" && action.id !== "schedule" && action.id !== "poll") {
                        setTimeout(onClose, 300);
                      }
                    }}
                    className={`${action.bgColor} p-4 rounded-2xl border border-base-300/30 transition-all hover:scale-[1.02] hover:shadow-lg active:scale-95 group`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-xl ${action.bgColor} flex items-center justify-center ${action.color} group-hover:scale-110 transition-transform`}
                      >
                        <action.icon size={24} />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold text-sm mb-0.5 flex items-center gap-2">
                          {action.label}
                          {action.adminOnly && (
                            <span className="badge badge-warning badge-xs">
                              Admin
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-base-content/60">
                          {action.description}
                        </p>
                      </div>
                      <div className={`${action.color} opacity-0 group-hover:opacity-100 transition-opacity`}>
                        <CheckCircle2 size={18} />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Info */}
          <div className="p-4 bg-base-200/50 border-t border-base-300/50 flex-shrink-0">
            <div className="flex items-center gap-2 text-xs text-base-content/60">
              <AlertCircle size={14} />
              <span>
                {userRole?.isAdmin
                  ? "You have full access to all actions"
                  : "Some actions are admin-only"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Styles */}
      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-slideUp {
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>

      {/* Modals */}
      {showScheduleModal && (
        <ScheduleMessageModal
          channel={channel}
          onClose={() => {
            setShowScheduleModal(false);
            onClose();
          }}
        />
      )}

      {showPollModal && (
        <CreatePollModal
          channel={channel}
          onClose={() => {
            setShowPollModal(false);
            onClose();
          }}
        />
      )}
    </>
  );
};

export default QuickActionsMenu;