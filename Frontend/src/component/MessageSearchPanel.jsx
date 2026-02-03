import { useState, useEffect } from "react";
import { Search, X, Calendar, User, MessageSquare, Loader } from "lucide-react";

const MessageSearchPanel = ({ channel, onClose }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const searchMessages = async (query) => {
    if (!query.trim() || !channel) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      // Search in channel messages
      const response = await channel.search({
        text: { $autocomplete: query },
      }, {
        limit: 50,
      });

      setSearchResults(response.results || []);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchMessages(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, channel]);

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

  const highlightText = (text, query) => {
    if (!query.trim() || !text) return text;
    
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={index} className="bg-primary/30 text-primary-content font-semibold">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="absolute top-0 left-0 right-0 bottom-0 bg-base-100 z-30 flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 bg-gradient-to-r from-primary/20 to-primary/10 border-b-2 border-primary/30 p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Search size={20} className="text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Search Messages</h3>
              <p className="text-xs text-base-content/60">
                {searchResults.length > 0
                  ? `${searchResults.length} result${searchResults.length === 1 ? "" : "s"}`
                  : "Type to search"}
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

        {/* Search Input */}
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40"
          />
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input input-bordered w-full pl-10 pr-10 bg-base-100"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 btn btn-ghost btn-xs btn-circle"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="text-center">
              <Loader size={40} className="animate-spin text-primary mx-auto" />
              <p className="mt-4 text-sm text-base-content/60">Searching...</p>
            </div>
          </div>
        ) : !hasSearched ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Search size={40} className="text-primary/50" />
            </div>
            <h4 className="font-bold text-lg mb-2">Search Messages</h4>
            <p className="text-sm text-base-content/60 mb-4">
              Find messages in this conversation
            </p>
            <div className="text-xs text-base-content/50 max-w-sm mx-auto">
              <p className="mb-2">💡 <strong>Tips:</strong></p>
              <ul className="text-left space-y-1">
                <li>• Search for keywords</li>
                <li>• Search for user names</li>
                <li>• Results appear as you type</li>
              </ul>
            </div>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-base-300/50 flex items-center justify-center">
              <MessageSquare size={40} className="text-base-content/30" />
            </div>
            <h4 className="font-bold text-lg mb-2">No results found</h4>
            <p className="text-sm text-base-content/60">
              Try different keywords or check your spelling
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {searchResults.map((result) => {
              const message = result.message;
              return (
                <div
                  key={message.id}
                  onClick={() => jumpToMessage(message.id)}
                  className="card bg-base-200 shadow-md hover:shadow-lg transition-all cursor-pointer border border-primary/20 hover:border-primary/40"
                >
                  <div className="card-body p-4">
                    {/* Message Header */}
                    <div className="flex items-center gap-3 mb-2">
                      <div className="avatar">
                        <div className="w-10 h-10 rounded-full ring-2 ring-primary/30">
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

                    {/* Message Content with Highlighting */}
                    <div className="bg-base-100 rounded-lg p-3">
                      <p className="text-sm break-words whitespace-pre-wrap">
                        {highlightText(message.text || "No text", searchQuery)}
                      </p>

                      {/* Attachments indicator */}
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-base-content/50">
                          <MessageSquare size={12} />
                          <span>{message.attachments.length} attachment(s)</span>
                        </div>
                      )}
                    </div>

                    {/* Click to view */}
                    <div className="mt-2 text-xs text-primary flex items-center gap-1">
                      <MessageSquare size={12} />
                      <span>Click to view in chat</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Custom styles for message highlighting */}
      <style jsx global>{`
        .highlight-message {
          animation: highlightPulse 2s ease-in-out;
          background-color: hsl(var(--p) / 0.2) !important;
        }

        @keyframes highlightPulse {
          0%, 100% {
            background-color: transparent;
          }
          50% {
            background-color: hsl(var(--p) / 0.3);
          }
        }

        mark {
          border-radius: 2px;
          padding: 0 2px;
        }
      `}</style>
    </div>
  );
};

export default MessageSearchPanel;