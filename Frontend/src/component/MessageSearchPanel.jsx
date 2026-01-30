import { useState, useEffect } from "react";
import { Search, X, Calendar, User, ArrowRight } from "lucide-react";

const MessageSearchPanel = ({ channel, onClose }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    sender: "",
    dateFrom: "",
    dateTo: "",
  });

  useEffect(() => {
    if (searchQuery.trim()) {
      const delayDebounceFn = setTimeout(() => {
        performSearch();
      }, 300);

      return () => clearTimeout(delayDebounceFn);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, filters]);

  const performSearch = async () => {
    try {
      setLoading(true);
      
      // Mock search results
      const mockResults = [
        {
          id: "1",
          text: `How do you say "hello" in Spanish?`,
          user: { name: "John Doe", image: "https://via.placeholder.com/40" },
          created_at: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: "2",
          text: "You say 'Hola' - it's one of the first words you learn!",
          user: { name: "Maria Garcia", image: "https://via.placeholder.com/40" },
          created_at: new Date(Date.now() - 3500000).toISOString(),
        },
        {
          id: "3",
          text: "Can someone help me with pronunciation? I'm struggling with the 'r' sound.",
          user: { name: "Mike Smith", image: "https://via.placeholder.com/40" },
          created_at: new Date(Date.now() - 86400000).toISOString(),
        },
      ].filter((msg) =>
        msg.text.toLowerCase().includes(searchQuery.toLowerCase())
      );

      setSearchResults(mockResults);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  const jumpToMessage = (messageId) => {
    // Implement jump to message functionality
    console.log("Jumping to message:", messageId);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const highlightText = (text, query) => {
    if (!query.trim()) return text;
    
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={index} className="bg-warning/30 text-warning-content px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Search size={18} className="text-primary" />
          <h4 className="font-semibold">Search Messages</h4>
        </div>
        <button onClick={onClose} className="btn btn-ghost btn-xs btn-circle">
          <X size={16} />
        </button>
      </div>

      {/* Search Input */}
      <div className="mb-3">
        <input
          type="text"
          placeholder="Search messages..."
          className="input input-bordered w-full"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoFocus
        />
      </div>

      {/* Filters */}
      <div className="collapse collapse-arrow bg-base-100 mb-3">
        <input type="checkbox" />
        <div className="collapse-title text-sm font-medium">Advanced Filters</div>
        <div className="collapse-content space-y-2">
          <div>
            <label className="label">
              <span className="label-text text-xs">Sender</span>
            </label>
            <input
              type="text"
              placeholder="Filter by sender name"
              className="input input-bordered input-sm w-full"
              value={filters.sender}
              onChange={(e) =>
                setFilters({ ...filters, sender: e.target.value })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">
                <span className="label-text text-xs">From Date</span>
              </label>
              <input
                type="date"
                className="input input-bordered input-sm w-full"
                value={filters.dateFrom}
                onChange={(e) =>
                  setFilters({ ...filters, dateFrom: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label">
                <span className="label-text text-xs">To Date</span>
              </label>
              <input
                type="date"
                className="input input-bordered input-sm w-full"
                value={filters.dateTo}
                onChange={(e) =>
                  setFilters({ ...filters, dateTo: e.target.value })
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* Search Results */}
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <span className="loading loading-spinner loading-md"></span>
          </div>
        ) : searchQuery.trim() && searchResults.length === 0 ? (
          <div className="text-center py-8">
            <Search size={32} className="mx-auto text-base-content/30 mb-2" />
            <p className="text-sm text-base-content/60">No messages found</p>
          </div>
        ) : searchResults.length > 0 ? (
          <div className="space-y-2">
            <div className="text-xs text-base-content/60 mb-2">
              Found {searchResults.length} {searchResults.length === 1 ? "result" : "results"}
            </div>
            {searchResults.map((result) => (
              <div
                key={result.id}
                onClick={() => jumpToMessage(result.id)}
                className="p-3 bg-base-100 rounded-lg hover:bg-base-200 transition-colors cursor-pointer group"
              >
                <div className="flex items-start gap-2">
                  <img
                    src={result.user.image}
                    alt={result.user.name}
                    className="w-8 h-8 rounded-full flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">
                        {result.user.name}
                      </span>
                      <span className="text-xs text-base-content/50">
                        {formatDate(result.created_at)}
                      </span>
                    </div>
                    <p className="text-sm">
                      {highlightText(result.text, searchQuery)}
                    </p>
                  </div>
                  <ArrowRight
                    size={16}
                    className="text-base-content/30 group-hover:text-primary transition-colors flex-shrink-0"
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-base-content/50 text-sm">
            Enter a search term to find messages
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageSearchPanel;