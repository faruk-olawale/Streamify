import { useEffect, useState, useRef } from "react"
import { useParams } from "react-router"
import useAuthUser from "../hooks/useAuthUser";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getStreamToken, recordPractice, getUserFriends } from "../lib/api";

import {
  Channel,
  Chat,
  MessageInput,
  MessageList,
  Thread,
  Window,
} from "stream-chat-react"

import { StreamChat } from "stream-chat";
import toast from "react-hot-toast";
import ChatLoader from "../component/ChatLoader";
import { Flame, ArrowLeft, Info, Video } from "lucide-react";
import { Link } from "react-router";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

function ChatPage() {
  const { id: targetUserId } = useParams();
  const queryClient = useQueryClient();

  const [chatClient, setChatClient] = useState(null);
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messageCount, setMessageCount] = useState(0);
  const [sessionStartTime] = useState(Date.now());
  const [showStreakNotification, setShowStreakNotification] = useState(false);
  const hasRecordedPractice = useRef(false);

  const { authUser } = useAuthUser();

  const { data: tokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser
  });

  const { data: friends = [] } = useQuery({
    queryKey: ["friends"],
    queryFn: getUserFriends,
  });

  const currentFriend = friends.find(f => f._id === targetUserId);

  const { mutate: recordPracticeMutation } = useMutation({
    mutationFn: recordPractice,
    onSuccess: (data) => {
      console.log("✅ Practice recorded:", data);
      queryClient.invalidateQueries({ queryKey: ["practiceStats"] });
      
      if (data.currentStreak > 0) {
        setShowStreakNotification(true);
        setTimeout(() => setShowStreakNotification(false), 5000);
        
        if (data.currentStreak % 7 === 0) {
          toast.success(`🔥 ${data.currentStreak} day streak! Amazing!`, {
            duration: 4000,
            icon: '🏆'
          });
        }
      }
    },
    onError: (error) => {
      console.error("❌ Failed to record practice:", error);
    }
  });

  useEffect(() => {
    const initChat = async () => {
      if (!tokenData?.token || !authUser) return;
      try {
        console.log("initializing stream chat client .....");

        const client = StreamChat.getInstance(STREAM_API_KEY);
        await client.connectUser({
          id: authUser._id,
          name: authUser.fullName,
          image: authUser.profilePic,
        }, tokenData.token);

        const channelId = [authUser._id, targetUserId].sort().join("-");

        const currentChannel = client.channel("messaging", channelId, {
          members: [authUser._id, targetUserId],
        });

        await currentChannel.watch();

        setChatClient(client);
        setChannel(currentChannel);

        currentChannel.on('message.new', (event) => {
          if (event.user?.id === authUser._id) {
            setMessageCount(prev => prev + 1);
          }
        });

      } catch (error) {
        console.error("Error initializing chat:", error);
        toast.error("Could not connect chat. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    initChat()
  }, [tokenData, authUser, targetUserId]);

  useEffect(() => {
    if (messageCount >= 3 && !hasRecordedPractice.current) {
      hasRecordedPractice.current = true;
      
      const sessionDuration = Math.max(1, Math.round((Date.now() - sessionStartTime) / 60000));
      
      recordPracticeMutation({
        activityType: "chat",
        partnerId: targetUserId,
        duration: sessionDuration
      });

      toast.success("Practice session recorded! 🎉", { 
        duration: 3000,
        icon: '✅'
      });
    }
  }, [messageCount, targetUserId, recordPracticeMutation, sessionStartTime]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (messageCount > 0 && !hasRecordedPractice.current) {
        const sessionDuration = Math.max(1, Math.round((Date.now() - sessionStartTime) / 60000));
        
        const data = JSON.stringify({
          activityType: "chat",
          partnerId: targetUserId,
          duration: sessionDuration
        });
        
        navigator.sendBeacon('/api/practice/record', data);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [messageCount, targetUserId, sessionStartTime]);

  const handleVideoCall = async () => {
    if (channel) {
      const callUrl = `${window.location.origin}/call/${channel.id}`;
      await channel.sendMessage({
        text: `📹 I've started a video call. Join me here: ${callUrl}`,
      });

      toast.success("Video call link sent!", {
        icon: '📹'
      });
    }
  }

  if (loading || !chatClient || !channel) return <ChatLoader />;

  return (
    <div className="fixed inset-0 flex flex-col bg-base-100 z-50">
      {/* Single Custom Header */}
      <div className="bg-base-200 border-b border-base-300 px-4 py-3 flex-shrink-0 shadow-sm">
        <div className="container mx-auto flex items-center justify-between gap-4">
          {/* Left: Back Button + Friend Info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Link to="/" className="btn btn-ghost btn-sm btn-circle flex-shrink-0">
              <ArrowLeft className="size-5" />
            </Link>
            
            {currentFriend && (
              <div className="flex items-center gap-3 min-w-0">
                <div className="avatar online flex-shrink-0">
                  <div className="w-10 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                    <img src={currentFriend.profilePic} alt={currentFriend.fullName} />
                  </div>
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm truncate">{currentFriend.fullName}</h3>
                  <p className="text-xs text-base-content/60 truncate">
                    {currentFriend.nativeLanguages?.[0] || 'Language learner'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right: Stats & Actions */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Message Counter */}
            {messageCount > 0 && (
              <div className="badge badge-success gap-1 hidden sm:flex">
                <Flame className="size-3" />
                {messageCount}
              </div>
            )}
            
            {/* Video Call Button */}
            <button
              onClick={handleVideoCall}
              className="btn btn-primary btn-sm gap-2"
              title="Start video call"
            >
              <Video className="size-4" />
              <span className="hidden sm:inline">Call</span>
            </button>
            
            {/* Info Button */}
            <div className="tooltip tooltip-bottom hidden sm:block" data-tip="Messages tracked for practice streaks">
              <button className="btn btn-ghost btn-sm btn-circle">
                <Info className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Streak Notification */}
      {showStreakNotification && (
        <div className="alert alert-success shadow-lg mx-4 mt-4 animate-in slide-in-from-top flex-shrink-0">
          <Flame className="size-5" />
          <div>
            <h3 className="font-bold">Practice Recorded! 🎉</h3>
            <div className="text-xs">Your streak is growing. Keep it up!</div>
          </div>
          <button 
            onClick={() => setShowStreakNotification(false)}
            className="btn btn-ghost btn-sm btn-circle"
          >
            ✕
          </button>
        </div>
      )}

      {/* Chat Container */}
      <div className="flex-1 overflow-hidden min-h-0">
        <Chat client={chatClient} theme="str-chat__theme-light">
          <Channel channel={channel}>
            <Window>
              {/* No ChannelHeader - using custom header above */}
              <MessageList />
              <MessageInput focus />
            </Window>
            <Thread />
          </Channel>
        </Chat>
      </div>
    </div>
  )
}

export default ChatPage