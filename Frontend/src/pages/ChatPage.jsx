import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { StreamChat } from "stream-chat";
import {
  Chat,
  Channel,
  Window,
  MessageList,
  MessageInput,
  Thread,
} from "stream-chat-react";
import toast from "react-hot-toast";
import { ArrowLeft, Flame, Info, Video } from "lucide-react";

import useAuthUser from "../hooks/useAuthUser";
import {
  getStreamToken,
  recordPractice,
  getUserFriends,
} from "../lib/api";
import ChatLoader from "../component/ChatLoader";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

function ChatPage() {
  const { id: targetUserId } = useParams();
  const queryClient = useQueryClient();
  const { authUser } = useAuthUser();

  const [client, setClient] = useState(null);
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messageCount, setMessageCount] = useState(0);
  const [showStreakNotification, setShowStreakNotification] = useState(false);

  const sessionStartTime = useRef(Date.now());
  const practiceRecorded = useRef(false);

  /* --------------------------------------------------
     DATA
  -------------------------------------------------- */
  const { data: tokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser,
  });

  const { data: friends = [] } = useQuery({
    queryKey: ["friends"],
    queryFn: getUserFriends,
  });

  const currentFriend = friends.find(f => f._id === targetUserId);

  /* --------------------------------------------------
     PRACTICE MUTATION
  -------------------------------------------------- */
  const { mutate: recordPracticeMutation } = useMutation({
    mutationFn: recordPractice,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["practiceStats"] });

      if (data.currentStreak > 0) {
        setShowStreakNotification(true);
        setTimeout(() => setShowStreakNotification(false), 5000);

        if (data.currentStreak % 7 === 0) {
          toast.success(`🔥 ${data.currentStreak} day streak!`, {
            icon: "🏆",
          });
        }
      }
    },
    onError: () => {
      toast.error("Failed to record practice");
    },
  });

  /* --------------------------------------------------
     STREAM INIT
  -------------------------------------------------- */
  useEffect(() => {
    if (!authUser || !tokenData?.token) return;

    let chatClient;
    let activeChannel;

    const init = async () => {
      try {
        chatClient = StreamChat.getInstance(STREAM_API_KEY);

        await chatClient.connectUser(
          {
            id: authUser._id,
            name: authUser.fullName,
            image: authUser.profilePic,
          },
          tokenData.token
        );

        const channelId = [authUser._id, targetUserId].sort().join("-");

        activeChannel = chatClient.channel("messaging", channelId, {
          members: [authUser._id, targetUserId],
        });

        await activeChannel.watch();

        activeChannel.on("message.new", (event) => {
          if (event.user?.id === authUser._id) {
            setMessageCount((c) => c + 1);
          }
        });

        setClient(chatClient);
        setChannel(activeChannel);
      } catch (err) {
        console.error(err);
        toast.error("Could not connect to chat");
      } finally {
        setLoading(false);
      }
    };

    init();

    return () => {
      chatClient?.disconnectUser();
    };
  }, [authUser, tokenData, targetUserId]);

  /* --------------------------------------------------
     PRACTICE TRACKING
  -------------------------------------------------- */
  useEffect(() => {
    if (messageCount < 3 || practiceRecorded.current) return;

    practiceRecorded.current = true;

    const duration = Math.max(
      1,
      Math.round((Date.now() - sessionStartTime.current) / 60000)
    );

    recordPracticeMutation({
      activityType: "chat",
      partnerId: targetUserId,
      duration,
    });

    toast.success("Practice session recorded 🎉");
  }, [messageCount, targetUserId, recordPracticeMutation]);

  /* --------------------------------------------------
     SAFETY: PAGE CLOSE
  -------------------------------------------------- */
  useEffect(() => {
    const handleUnload = () => {
      if (!practiceRecorded.current && messageCount > 0) {
        const duration = Math.max(
          1,
          Math.round((Date.now() - sessionStartTime.current) / 60000)
        );

        navigator.sendBeacon(
          "/api/practice/record",
          JSON.stringify({
            activityType: "chat",
            partnerId: targetUserId,
            duration,
          })
        );
      }
    };

    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [messageCount, targetUserId]);

  /* --------------------------------------------------
     ACTIONS
  -------------------------------------------------- */
  const handleVideoCall = async () => {
    if (!channel) return;

    const callUrl = `${window.location.origin}/call/${channel.id}`;

    await channel.sendMessage({
      text: `📹 I've started a video call. Join me here: ${callUrl}`,
    });

    toast.success("Video call link sent 📹");
  };

  if (loading || !client || !channel) return <ChatLoader />;

  /* --------------------------------------------------
     RENDER
  -------------------------------------------------- */
  return (
    <div className="fixed inset-0 flex flex-col bg-base-100 z-50">
      {/* Header */}
      <div className="bg-base-200 border-b border-base-300 px-4 py-3 shadow-sm">
        <div className="container mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/" className="btn btn-ghost btn-sm btn-circle">
              <ArrowLeft className="size-5" />
            </Link>

            {currentFriend && (
              <div className="flex items-center gap-3 min-w-0">
                <div className="avatar online">
                  <div className="w-10 rounded-full ring ring-primary ring-offset-2">
                    <img src={currentFriend.profilePic} alt="" />
                  </div>
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold truncate">
                    {currentFriend.fullName}
                  </h3>
                  <p className="text-xs opacity-60 truncate">
                    {currentFriend.nativeLanguages?.[0] || "Language learner"}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {messageCount > 0 && (
              <div className="badge badge-success hidden sm:flex gap-1">
                <Flame className="size-3" />
                {messageCount}
              </div>
            )}

            <button
              onClick={handleVideoCall}
              className="btn btn-primary btn-sm gap-2"
            >
              <Video className="size-4" />
              <span className="hidden sm:inline">Call</span>
            </button>

            <div className="tooltip tooltip-bottom hidden sm:block" data-tip="Messages tracked for streaks">
              <button className="btn btn-ghost btn-sm btn-circle">
                <Info className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {showStreakNotification && (
        <div className="alert alert-success mx-4 mt-4 shadow-lg">
          <Flame className="size-5" />
          <div>
            <h3 className="font-bold">Practice Recorded 🎉</h3>
            <p className="text-xs">Your streak is growing!</p>
          </div>
          <button
            onClick={() => setShowStreakNotification(false)}
            className="btn btn-ghost btn-sm btn-circle"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        <Chat client={client} theme="str-chat__theme-light">
          <Channel channel={channel}>
            <Window>
              <MessageList />
              <MessageInput focus />
            </Window>
            <Thread />
          </Channel>
        </Chat>
      </div>
    </div>
  );
}

export default ChatPage;
