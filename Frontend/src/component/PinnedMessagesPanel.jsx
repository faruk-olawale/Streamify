import { useState, useEffect } from "react";
import { X, Pin, Trash2, MessageSquare, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { pinMessage, unpinMessage, getPinnedMessages } from "../lib/api";

const PinnedMessagesPanel = ({ channel, onClose, groupId, userRole }) => {
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPinnedMessages();
  }, [groupId]);

  const loadPinnedMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get pinned messages from your backend
      const extractedGroupId = groupId || channel.id.split('messaging:')[1];
      const result = await getPinnedMessages(extractedGroupId);
      
      setPinnedMessages(result.pinnedMessages || []);
    } catch (error) {
      console.error("Error loading pinned messages:", error);
      setError("Failed to load pinned messages");
    } finally {
      setLoading(false);
    }
  };

  const handleUnpin = async (messageId) => {
    try {
      const extractedGroupId = groupId || channel.id.split('messaging:')[1];
      await unpinMessage(extractedGroupId, messageId);
      
      setPinnedMessages((prev) => prev.filter((msg) => msg.messageId !== messageId));
      toast.success("Message unpinned");
    } catch (error) {
      console.error("Error unpinning message:", error);
      toast.error("Failed to unpin message");
    }
  };

  const jumpToMessage = async (messageId) => {
    try {
      // Jump to message in Stream Chat
      await channel.state.loadMessageIntoState(messageId);
      toast.info("Jumped to message");
      onClose();
    } catch (error) {
      console.error("Error jumping to message:", error);
      toast.error("Could not find message");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="p-6 bg-gradient-to-b from-warning/5 to-transparent">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Pin size={18} className="text-warning" />
            <h4 className="font-semibold">Pinned Messages</h4>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-xs btn-circle">
            <X size={16} />
          </button>
        </div>
        <div className="flex items-center justify-center py-8">
          <span className="loading loading-spinner loading-md text-warning"></span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gradient-to-b from-error/5 to-transparent">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Pin size={18} className="text-error" />
            <h4 className="font-semibold">Pinned Messages</h4>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-xs btn-circle">
            <X size={16} />
          </button>
        </div>
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <AlertCircle size={32} className="text-error/50" />
          <p className="text-sm text-error/70">{error}</p>
          <button 
            onClick={loadPinnedMessages}
            className="btn btn-sm btn-outline btn-error"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gradient-to-b from-warning/5 to-transparent border-b border-warning/10">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-warning/10 rounded-lg">
            <Pin size={16} className="text-warning" />
          </div>
          <div>
            <h4 className="font-semibold text-sm">Pinned Messages</h4>
            {pinnedMessages.length > 0 && (
              <p className="text-xs text-base-content/50">{pinnedMessages.length} pinned</p>
            )}
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="btn btn-ghost btn-xs btn-circle hover:bg-base-300 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {pinnedMessages.length === 0 ? (
        <div className="text-center py-8 px-4">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-warning/10 flex items-center justify-center">
            <Pin size={24} className="text-warning/50" />
          </div>
          <p className="text-sm text-base-content/60 font-medium mb-1">No pinned messages</p>
          <p className="text-xs text-base-content/40">
            Admins can pin important messages to show them here
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {pinnedMessages.map((message) => (
            <div
              key={message.messageId || message._id}
              className="group p-3 bg-base-100/80 backdrop-blur-sm rounded-lg border border-warning/20 hover:border-warning/40 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start gap-3 mb-2">
                <div className="avatar flex-shrink-0">
                  <div className="w-8 h-8 rounded-full ring-1 ring-warning/20">
                    <img
                      src={message.pinnedBy?.profilePic || "https://via.placeholder.com/40"}
                      alt={message.pinnedBy?.fullName || "User"}
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          message.pinnedBy?.fullName || "User"
                        )}&background=random`;
                      }}
                    />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-base-content">
                      {message.pinnedBy?.fullName || "Someone"}
                    </span>
                    <span className="text-xs text-base-content/40">•</span>
                    <span className="text-xs text-base-content/50">
                      {formatDate(message.pinnedAt || message.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-base-content/80 break-words whitespace-pre-wrap">
                    {message.text || "Message content"}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-base-300/50">
                <span className="text-xs text-base-content/40">
                  Pinned by {message.pinnedBy?.fullName || "admin"}
                </span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => jumpToMessage(message.messageId)}
                    className="btn btn-ghost btn-xs gap-1 text-primary hover:bg-primary/10"
                    title="Jump to message"
                  >
                    <MessageSquare size={12} />
                    <span className="hidden sm:inline">Jump</span>
                  </button>
                  {userRole?.isAdmin && (
                    <button
                      onClick={() => {
                        if (confirm("Unpin this message?")) {
                          handleUnpin(message.messageId);
                        }
                      }}
                      className="btn btn-ghost btn-xs gap-1 text-error hover:bg-error/10"
                      title="Unpin"
                    >
                      <Trash2 size={12} />
                      <span className="hidden sm:inline">Unpin</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PinnedMessagesPanel;