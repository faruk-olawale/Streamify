import { useState, useEffect } from "react";
import { Pin, X, Trash2, Calendar, MessageSquare } from "lucide-react";
import toast from "react-hot-toast";

const PinnedMessagesPanel = ({ channel, groupId, userRole, onClose }) => {
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!channel) return;

    const fetchPinnedMessages = async () => {
      setLoading(true);
      try {
        const response = await channel.query({
          messages: { limit: 100 },
        });

        const pinned = response.messages.filter((msg) => msg.pinned === true);
        
        pinned.sort((a, b) => {
          const timeA = a.pinned_at ? new Date(a.pinned_at) : new Date(a.created_at);
          const timeB = b.pinned_at ? new Date(b.pinned_at) : new Date(b.created_at);
          return timeB - timeA;
        });

        setPinnedMessages(pinned);
      } catch (error) {
        console.error("Error fetching pinned messages:", error);
        toast.error("Failed to load pinned messages");
      } finally {
        setLoading(false);
      }
    };

    fetchPinnedMessages();

    const handleEvent = (event) => {
      if (event.type === "message.updated") {
        if (event.message.pinned) {
          setPinnedMessages((prev) => {
            const exists = prev.find((msg) => msg.id === event.message.id);
            if (exists) {
              return prev.map((msg) =>
                msg.id === event.message.id ? event.message : msg
              );
            }
            return [event.message, ...prev];
          });
        } else {
          setPinnedMessages((prev) =>
            prev.filter((msg) => msg.id !== event.message.id)
          );
        }
      }
    };

    channel.on("message.updated", handleEvent);

    return () => {
      channel.off("message.updated", handleEvent);
    };
  }, [channel]);

  const unpinMessage = async (message) => {
    try {
      const client = channel.getClient();
      
      // Use client.partialUpdateMessage
      await client.partialUpdateMessage(message.id, {
        set: { pinned: false },
      });
      
      toast.success("Message unpinned");
      setPinnedMessages((prev) => prev.filter((msg) => msg.id !== message.id));
    } catch (error) {
      console.error("Error unpinning message:", error);
      toast.error("Failed to unpin. Please unpin from the message menu.");
    }
  };

  const jumpToMessage = (messageId) => {
    try {
      const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
      if (messageElement) {
        messageElement.scrollIntoView({ behavior: "smooth", block: "center" });
        messageElement.classList.add("highlight-message");
        setTimeout(() => {
          messageElement.classList.remove("highlight-message");
        }, 2000);
      }
      onClose();
    } catch (error) {
      console.error("Error jumping to message:", error);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="absolute top-0 left-0 right-0 bottom-0 bg-base-100 z-30 flex flex-col">
      <div className="flex-shrink-0 bg-gradient-to-r from-warning/20 to-warning/10 border-b-2 border-warning/30 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-warning/20 rounded-lg">
              <Pin size={20} className="text-warning" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Pinned Messages</h3>
              <p className="text-xs text-base-content/60">
                {pinnedMessages.length} {pinnedMessages.length === 1 ? "message" : "messages"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle hover:bg-error/10 hover:text-error"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="text-center">
              <span className="loading loading-spinner loading-lg text-primary"></span>
              <p className="mt-4 text-sm text-base-content/60">Loading pinned messages...</p>
            </div>
          </div>
        ) : pinnedMessages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-warning/10 flex items-center justify-center">
              <Pin size={40} className="text-warning/50" />
            </div>
            <h4 className="font-bold text-lg mb-2">No pinned messages</h4>
            <p className="text-sm text-base-content/60 mb-4">
              Important messages can be pinned here
            </p>
            <div className="text-xs text-base-content/50 max-w-sm mx-auto">
              <p className="mb-2">💡 <strong>How to pin:</strong></p>
              <ol className="text-left space-y-1">
                <li>• Hover over a message</li>
                <li>• Click the three dots (...)</li>
                <li>• Select "Pin Message"</li>
              </ol>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {pinnedMessages.map((message) => (
              <div
                key={message.id}
                className="card bg-base-200 shadow-md hover:shadow-lg transition-all border border-warning/20 hover:border-warning/40"
              >
                <div className="card-body p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="avatar">
                        <div className="w-10 h-10 rounded-full ring-2 ring-warning/30">
                          <img
                            src={
                              message.user?.image ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                message.user?.name || "User"
                              )}&background=random`
                            }
                            alt={message.user?.name}
                            onError={(e) => {
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                message.user?.name || "User"
                              )}&background=random`;
                            }}
                          />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">
                          {message.user?.name || "Unknown User"}
                        </p>
                        <p className="text-xs text-base-content/60 flex items-center gap-1">
                          <Calendar size={12} />
                          {formatTime(message.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="badge badge-warning badge-sm gap-1">
                      <Pin size={12} />
                      Pinned
                    </div>
                  </div>

                  <div className="bg-base-100 rounded-lg p-3 mb-3">
                    <p className="text-sm break-words whitespace-pre-wrap">
                      {message.text || "No text content"}
                    </p>

                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {message.attachments.map((attachment, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-base-200 rounded-lg">
                            {attachment.type === "image" && (
                              <img
                                src={attachment.image_url || attachment.thumb_url}
                                alt="attachment"
                                className="w-full h-auto max-h-48 object-cover rounded-lg"
                              />
                            )}
                            {attachment.type === "file" && (
                              <div className="flex items-center gap-2">
                                <MessageSquare size={16} className="text-primary" />
                                <span className="text-xs truncate">
                                  {attachment.title || "File attachment"}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => jumpToMessage(message.id)}
                      className="btn btn-sm btn-ghost flex-1 gap-2"
                    >
                      <MessageSquare size={16} />
                      View in Chat
                    </button>
                    {userRole?.isAdmin && (
                      <button
                        onClick={() => unpinMessage(message)}
                        className="btn btn-sm btn-ghost gap-2 text-error hover:bg-error/10"
                      >
                        <Trash2 size={16} />
                        Unpin
                      </button>
                    )}
                  </div>

                  {message.pinned_by && (
                    <div className="mt-2 pt-2 border-t border-base-300">
                      <p className="text-xs text-base-content/50">
                        Pinned by <span className="font-semibold">{message.pinned_by.name || "Admin"}</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx global>{`
        .highlight-message {
          animation: highlightPulse 2s ease-in-out;
          background-color: hsl(var(--wa) / 0.2) !important;
        }
        @keyframes highlightPulse {
          0%, 100% { background-color: transparent; }
          50% { background-color: hsl(var(--wa) / 0.3); }
        }
      `}</style>
    </div>
  );
};

export default PinnedMessagesPanel;