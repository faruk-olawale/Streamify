import { useState, useEffect, useRef } from "react";
import { StreamChat } from "stream-chat";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

// Global client - ONE instance for entire app
let globalClient = null;
let connectionPromise = null;

export function useStreamClient(authUser, token) {
  const [client, setClient] = useState(globalClient);
  const [isConnecting, setIsConnecting] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!authUser || !token) {
      setClient(null);
      return;
    }

    // Already connected for this user
    if (globalClient && globalClient.userID === authUser._id) {
      setClient(globalClient);
      return;
    }

    // Already connecting
    if (connectionPromise) {
      connectionPromise.then(() => {
        if (mountedRef.current) {
          setClient(globalClient);
        }
      });
      return;
    }

    // Connect new client
    const connectClient = async () => {
      setIsConnecting(true);

      try {
        // Disconnect old client (user changed)
        if (globalClient) {
          await globalClient.disconnectUser();
          globalClient = null;
        }

        // Create and connect new client
        const chatClient = StreamChat.getInstance(STREAM_API_KEY);

        await chatClient.connectUser(
          {
            id: authUser._id,
            name: authUser.fullName,
            image: authUser.profilePic,
          },
          token
        );

        globalClient = chatClient;

        if (mountedRef.current) {
          setClient(chatClient);
        }
      } catch (error) {
        console.error("Failed to connect Stream client:", error);
        globalClient = null;
        if (mountedRef.current) {
          setClient(null);
        }
      } finally {
        connectionPromise = null;
        if (mountedRef.current) {
          setIsConnecting(false);
        }
      }
    };

    connectionPromise = connectClient();
  }, [authUser, token]);

  return { client, isConnecting };
}

// Call on logout
export async function disconnectStreamClient() {
  if (globalClient) {
    await globalClient.disconnectUser();
    globalClient = null;
    connectionPromise = null;
  }
}

export function getStreamClient() {
  return globalClient;
}