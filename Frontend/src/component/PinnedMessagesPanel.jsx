import { useState, useEffect } from "react";
import { X, Pin, Trash2, MessageSquare } from "lucide-react";
import toast from "react-hot-toast";

const PinnedMessagesPanel = ({ channel, onClose }) => {
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPinnedMessages();
  }, [channel]);

  const loadPinnedMessages = async () => {
    try {
      setLoading(true);
      // Query messages with pinned custom field
      const response = await channel.query({
        messages: { limit: 100 },
      });

      // Filter pinned messages (in real implementation, use custom field)
      // For now, using mock data
      const mockPinnedMessages = [
        {
          id: "1",
          text: "📌 Welcome to the Spanish Learning Group! Please introduce yourself and share your learning goals.",
          user: { name: "Admin", image: "https://via.placeholder.com/40" },
          created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
          pinned_by: "Admin",
        },
        {
          id: "2",
          text: "🎯 Group Rules:\n1. Be respectful\n2. Practice regularly\n3. Help each other\n4. Have fun!",
          user: { name: "Moderator", image: "https://via.placeholder.com/40" },
          created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
          pinned_by: "Moderator",
        },
      ];

      setPinnedMessages(mockPinnedMessages);
    } catch (error) {
      console.error("Error loading pinned messages:", error);
      toast.error("Failed to load pinned messages");
    } finally {
      setLoading(false);
    }
  };

  const unpinMessage = async (messageId) => {
    try {
      // In real implementation, update message custom field
      setPinnedMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      toast.success("Message unpinned");
    } catch (error) {
      console.error("Error unpinning message:", error);
      toast.error("Failed to unpin message");
    }
  };

  const jumpToMessage = (messageId) => {
    // Implement jumping to message in chat
    toast.info("Jump to message feature coming soon!");
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Pin size={18} className="text-warning" />
          <h4 className="font-semibold">
            Pinned Messages {!loading && `(${pinnedMessages.length})`}
          </h4>
        </div>
        <button onClick={onClose} className="btn btn-ghost btn-xs btn-circle">
          <X size={16} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <span className="loading loading-spinner loading-md"></span>
        </div>
      ) : pinnedMessages.length === 0 ? (
        <div className="text-center py-8">
          <Pin size={32} className="mx-auto text-base-content/30 mb-2" />
          <p className="text-sm text-base-content/60">No pinned messages</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {pinnedMessages.map((message) => (
            <div
              key={message.id}
              className="p-3 bg-base-100 rounded-lg border border-warning/20 hover:border-warning/40 transition-colors"
            >
              <div className="flex items-start gap-2 mb-2">
                <img
                  src={message.user.image}
                  alt={message.user.name}
                  className="w-8 h-8 rounded-full"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">
                      {message.user.name}
                    </span>
                    <span className="text-xs text-base-content/50">
                      {formatDate(message.created_at)}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-2 pt-2 border-t border-base-300">
                <span className="text-xs text-base-content/50">
                  Pinned by {message.pinned_by}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => jumpToMessage(message.id)}
                    className="btn btn-ghost btn-xs gap-1"
                    title="Jump to message"
                  >
                    <MessageSquare size={14} />
                    Jump
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Unpin this message?")) {
                        unpinMessage(message.id);
                      }
                    }}
                    className="btn btn-ghost btn-xs gap-1"
                    title="Unpin"
                  >
                    <Trash2 size={14} />
                  </button>
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