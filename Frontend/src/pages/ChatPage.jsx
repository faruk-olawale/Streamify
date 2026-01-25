import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { useStreamClient } from "../hooks/useStreamClient";
import {
  getStreamToken,
  recordPractice,
  getUserFriends,
} from "../lib/api";
import ChatLoader from "../component/ChatLoader";

function ChatPage() {
  const { id: targetUserId } = useParams();
  const queryClient = useQueryClient();
  const { authUser } = useAuthUser();

  const [channel, setChannel] = useState(null);
  const [messageCount, setMessageCount] = useState(0);
  const [showStreakNotification, setShowStreakNotification] = useState(false);

  const sessionStartTime = useRef(Date.now());
  const practiceRecorded = useRef(false);
  const channelListenerAttached = useRef(false);

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

  // Use the global Stream client
  const { client, isConnecting } = useStreamClient(
    authUser,
    tokenData?.token
  );

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
     CHANNEL SETUP (NOT CLIENT - CLIENT IS GLOBAL)
  -------------------------------------------------- */
  useEffect(() => {
    if (!client || !targetUserId) return;

    let activeChannel = null;
    let isMounted = true;

    const setupChannel = async () => {
      try {
        const channelId = [authUser._id, targetUserId].sort().join("-");

        activeChannel = client.channel("messaging", channelId, {
          members: [authUser._id, targetUserId],
        });

        await activeChannel.watch();

        // Attach message listener only once
        if (!channelListenerAttached.current) {
          activeChannel.on("message.new", (event) => {
            if (event.user?.id === authUser._id && isMounted) {
              setMessageCount((c) => c + 1);
            }
          });
          channelListenerAttached.current = true;
        }

        if (isMounted) {
          setChannel(activeChannel);
        }
      } catch (err) {
        console.error("Failed to setup channel:", err);
        if (isMounted) {
          toast.error("Could not load chat");
        }
      }
    };

    setupChannel();

    return () => {
      isMounted = false;
      channelListenerAttached.current = false;

      // Only stop watching the channel, DON'T disconnect client
      if (activeChannel) {
        activeChannel.stopWatching().catch(console.error);
      }

      setChannel(null);
    };
  }, [client, targetUserId, authUser._id]);

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

    try {
      const callUrl = `${window.location.origin}/call/${channel.id}`;

      await channel.sendMessage({
        text: `📹 I've started a video call. Join me here: ${callUrl}`,
      });

      toast.success("Video call link sent 📹");
    } catch (error) {
      console.error("Failed to send video call message:", error);
      toast.error("Failed to send video call link");
    }
  };

  // Show loader while connecting or setting up
  if (isConnecting || !client || !channel) return <ChatLoader />;

  /* --------------------------------------------------
     RENDER
  -------------------------------------------------- */
  return (
    <div className="fixed inset-0 flex flex-col bg-base-100 z-50">
      {/* Header */}
      <div className="bg-base-200 border-b border-base-300 px-4 py-3 shadow-sm">
        <div className="container mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/messages" className="btn btn-ghost btn-sm btn-circle">
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