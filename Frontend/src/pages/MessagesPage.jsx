import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { getStreamToken, getUserFriends } from "../lib/api";
import useAuthUser from "../hooks/useAuthUser";
import { useStreamClient } from "../hooks/useStreamClient";
import { 
  Search, Filter, MessageCircle, Pin, Archive, Trash2, 
  MoreVertical, Check, Star, Clock, Video, Phone,
  ArrowLeft, Plus, Loader
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// AI Components - NEW
import AIChatListItem from '../component/AIChatListItem';
import AIChatbot from '../component/AIChatbot';

const MessagesPage = () => {
  const navigate = useNavigate();
  const { authUser } = useAuthUser();
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [selectedChannels, setSelectedChannels] = useState(new Set());
  const [showActions, setShowActions] = useState(false);
  
  const { data: tokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser
  });

  const { data: friends = [] } = useQuery({
    queryKey: ["friends"],
    queryFn: getUserFriends,
  });

  const { client: chatClient, isConnecting } = useStreamClient(
    authUser,
    tokenData?.token
  );

  useEffect(() => {
    if (!chatClient || !authUser) return;

    let isMounted = true;

    const loadChannels = async () => {
      try {
        const filters = { 
          type: 'messaging',
          members: { $in: [authUser._id] }
        };
        const sort = [{ last_message_at: -1 }];
        
        const channelList = await chatClient.queryChannels(filters, sort, {
          watch: true,
          state: true,
        });

        if (isMounted) {
          setChannels(channelList);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error loading channels:", error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadChannels();

    const handleNewMessage = (event) => {
      if (event.channel_id && isMounted) {
        loadChannels();
      }
    };

    chatClient.on('message.new', handleNewMessage);

    return () => {
      isMounted = false;
      chatClient.off('message.new', handleNewMessage);
    };
  }, [chatClient, authUser]);

  const reloadChannels = async () => {
    if (!chatClient || !authUser) return;

    const filters = { 
      type: 'messaging',
      members: { $in: [authUser._id] }
    };
    const sort = [{ last_message_at: -1 }];
    
    const channelList = await chatClient.queryChannels(filters, sort, {
      watch: true,
      state: true,
    });

    setChannels(channelList);
  };

  const getFriendFromChannel = (channel) => {
    const members = Object.values(channel.state.members || {});
    const friend = members.find(m => m.user?.id !== authUser._id);
    return friend?.user || null;
  };

  const getLastMessage = (channel) => {
    const messages = channel.state.messages || [];
    return messages[messages.length - 1];
  };

  const getUnreadCount = (channel) => {
    return channel.countUnread() || 0;
  };

  const filteredChannels = channels.filter(channel => {
    const friend = getFriendFromChannel(channel);
    const lastMessage = getLastMessage(channel);
    
    if (searchQuery) {
      const nameMatch = friend?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const messageMatch = lastMessage?.text?.toLowerCase().includes(searchQuery.toLowerCase());
      if (!nameMatch && !messageMatch) return false;
    }

    if (filterType === "unread") {
      return getUnreadCount(channel) > 0;
    }

    return true;
  });

  const handleChannelClick = (channel) => {
    const members = Object.keys(channel.state.members || {});
    const friendId = members.find(id => id !== authUser._id);
    
    if (friendId) {
      navigate(`/chat/${friendId}`);
    }
  };

  const toggleChannelSelection = (channelId) => {
    const newSelected = new Set(selectedChannels);
    if (newSelected.has(channelId)) {
      newSelected.delete(channelId);
    } else {
      newSelected.add(channelId);
    }
    setSelectedChannels(newSelected);
    setShowActions(newSelected.size > 0);
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedChannels.size} conversation(s)?`)) return;
    
    try {
      for (const channelId of selectedChannels) {
        const channel = channels.find(c => c.id === channelId);
        if (channel) {
          await channel.delete();
        }
      }
      
      setSelectedChannels(new Set());
      setShowActions(false);
      await reloadChannels();
    } catch (error) {
      console.error("Error deleting channels:", error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      for (const channelId of selectedChannels) {
        const channel = channels.find(c => c.id === channelId);
        if (channel) {
          await channel.markRead();
        }
      }
      
      setSelectedChannels(new Set());
      setShowActions(false);
      await reloadChannels();
    } catch (error) {
      console.error("Error marking channels as read:", error);
    }
  };

  if (isConnecting || loading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-base-100">
        <Loader className="size-12 animate-spin text-primary mb-4" />
        <p className="text-base-content/60">Loading conversations...</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-base-100 z-40">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 border-b border-base-300 flex-shrink-0">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Link to="/" className="btn btn-ghost btn-circle">
                <ArrowLeft className="size-5" />
              </Link>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Messages</h1>
                <p className="text-sm text-base-content/70">
                  {filteredChannels.length} conversation{filteredChannels.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <button className="btn btn-primary btn-sm gap-2">
              <Plus className="size-4" />
              <span className="hidden sm:inline">New Chat</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-base-content/40" />
              <input
                type="text"
                placeholder="Search messages or people..."
                className="input input-bordered w-full pl-10 pr-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 btn btn-ghost btn-xs btn-circle"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setFilterType("all")}
                className={`btn btn-sm ${filterType === "all" ? "btn-primary" : "btn-outline"}`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType("unread")}
                className={`btn btn-sm ${filterType === "unread" ? "btn-primary" : "btn-outline"}`}
              >
                Unread
              </button>
            </div>
          </div>
        </div>
      </div>

      {showActions && (
        <div className="bg-primary text-primary-content px-4 py-3 flex items-center justify-between animate-in slide-in-from-top">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setSelectedChannels(new Set());
                setShowActions(false);
              }}
              className="btn btn-ghost btn-sm btn-circle"
            >
              ✕
            </button>
            <span className="font-semibold">{selectedChannels.size} selected</span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleMarkAllRead}
              className="btn btn-ghost btn-sm gap-2"
              title="Mark as read"
            >
              <Check className="size-4" />
              <span className="hidden sm:inline">Mark Read</span>
            </button>
            <button
              onClick={handleBulkDelete}
              className="btn btn-error btn-sm gap-2"
              title="Delete"
            >
              <Trash2 className="size-4" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          </div>
        </div>
      )}

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="space-y-2">
            {/* AI Chat Item - Always at the top - NEW */}
            {!searchQuery && <AIChatListItem authUser={authUser} />}

            {/* Regular Conversations */}
            {filteredChannels.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <MessageCircle className="size-16 text-base-content/30 mb-4" />
                <h3 className="text-xl font-bold mb-2">
                  {searchQuery ? 'No conversations found' : 'No messages yet'}
                </h3>
                <p className="text-base-content/70 text-center mb-4 max-w-md">
                  {searchQuery 
                    ? 'Try a different search term'
                    : 'Start a conversation with your language partners'
                  }
                </p>
                {searchQuery ? (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="btn btn-primary btn-sm"
                  >
                    Clear Search
                  </button>
                ) : (
                  <Link to="/find-partners" className="btn btn-primary">
                    Find Language Partners
                  </Link>
                )}
              </div>
            ) : (
              filteredChannels.map((channel) => {
                const friend = getFriendFromChannel(channel);
                const lastMessage = getLastMessage(channel);
                const unreadCount = getUnreadCount(channel);
                const isSelected = selectedChannels.has(channel.id);

                return (
                  <ConversationCard
                    key={channel.id}
                    channel={channel}
                    friend={friend}
                    lastMessage={lastMessage}
                    unreadCount={unreadCount}
                    isSelected={isSelected}
                    onSelect={() => toggleChannelSelection(channel.id)}
                    onClick={() => !isSelected && handleChannelClick(channel)}
                    onReload={reloadChannels}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* AI Chatbot - Floating Button (WhatsApp style) - NEW */}
      <AIChatbot
        targetLanguage={authUser?.learningLanguages?.[0] || 'English'}
        userLevel={authUser?.languageLevel || 'beginner'}
      />
    </div>
  );
};

// Conversation Card Component
const ConversationCard = ({ 
  channel, 
  friend, 
  lastMessage, 
  unreadCount, 
  isSelected,
  onSelect,
  onClick,
  onReload
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const getAvatarUrl = () => {
    if (friend?.image) return friend.image;
    const name = encodeURIComponent(friend?.name || 'User');
    return `https://ui-avatars.com/api/?name=${name}&background=random&size=128`;
  };

  const getTimeAgo = () => {
    if (!lastMessage?.created_at) return '';
    try {
      return formatDistanceToNow(new Date(lastMessage.created_at), { addSuffix: true });
    } catch {
      return '';
    }
  };

  const truncateMessage = (text, maxLength = 60) => {
    if (!text) return 'No messages yet';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const handleMarkRead = async (e) => {
    e.stopPropagation();
    try {
      await channel.markRead();
      setShowMenu(false);
      onReload();
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!confirm('Delete this conversation?')) return;
    
    try {
      await channel.delete();
      setShowMenu(false);
      onReload();
    } catch (error) {
      console.error("Error deleting channel:", error);
    }
  };

  return (
    <div
      className={`card bg-base-200 hover:bg-base-300 transition-all cursor-pointer ${
        isSelected ? 'ring-2 ring-primary' : ''
      } ${unreadCount > 0 ? 'bg-primary/5' : ''}`}
      onClick={onClick}
    >
      <div className="card-body p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <input
              type="checkbox"
              className="checkbox checkbox-primary"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                onSelect();
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className="avatar online flex-shrink-0">
            <div className="w-14 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
              <img 
                src={getAvatarUrl()} 
                alt={friend?.name}
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(friend?.name || 'User')}&background=random&size=128`;
                }}
              />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className={`font-semibold truncate ${unreadCount > 0 ? 'text-primary' : ''}`}>
                {friend?.name || 'Unknown User'}
              </h3>
              <span className="text-xs text-base-content/60 flex-shrink-0">
                {getTimeAgo()}
              </span>
            </div>

            <p className={`text-sm truncate ${unreadCount > 0 ? 'font-semibold' : 'text-base-content/70'}`}>
              {lastMessage?.user?.id === channel.data?.created_by?.id ? 'You: ' : ''}
              {truncateMessage(lastMessage?.text)}
            </p>

            <div className="flex items-center gap-2 mt-2">
              {unreadCount > 0 && (
                <span className="badge badge-primary badge-sm">
                  {unreadCount} new
                </span>
              )}
            </div>
          </div>

          <div className="dropdown dropdown-end flex-shrink-0">
            <button
              tabIndex={0}
              className="btn btn-ghost btn-sm btn-circle"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
            >
              <MoreVertical className="size-4" />
            </button>
            {showMenu && (
              <ul
                tabIndex={0}
                className="dropdown-content z-[1] menu p-2 shadow-lg bg-base-100 rounded-box w-52"
                onClick={(e) => e.stopPropagation()}
              >
                <li>
                  <button onClick={handleMarkRead}>
                    <Check className="size-4" />
                    Mark as read
                  </button>
                </li>
                <li>
                  <button onClick={handleDelete} className="text-error">
                    <Trash2 className="size-4" />
                    Delete conversation
                  </button>
                </li>
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;