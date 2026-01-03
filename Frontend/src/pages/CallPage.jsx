import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import useAuthUser from '../hooks/useAuthUser';
import { useQuery } from '@tanstack/react-query';
import { getStreamToken } from '../lib/api';

import { 
  StreamVideo,
  StreamVideoClient,
  StreamCall,
  CallControls,
  SpeakerLayout,
  StreamTheme,
  CallingState,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";

import "@stream-io/video-react-sdk/dist/css/styles.css";
import toast from 'react-hot-toast';
import PageLoader from '../component/PageLoader';

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

function CallPage() {
  const { id: callId } = useParams();
  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null); // FIXED: Added missing call state
  const [isConnecting, setIsConnecting] = useState(true);
  
  // FIXED: useAuthUser returns an object, not an array
  const { authUser, isLoading } = useAuthUser();

  const { data: tokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser,
  });

  useEffect(() => {
    const initCall = async () => {
      console.log("initCall triggered", { 
        hasToken: !!tokenData?.token, 
        hasAuthUser: !!authUser, 
        callId 
      });

      if (!tokenData?.token || !authUser || !callId) {
        console.log("Missing required data, skipping initialization");
        setIsConnecting(false);
        return;
      }
      
      try {
        console.log("Initializing Stream video client...");
        console.log("API Key:", STREAM_API_KEY);
        
        const user = {
          id: authUser._id,
          name: authUser.fullName,
          image: authUser.profilePic,
        };
        
        console.log("Creating client for user:", user);
        
        const videoClient = new StreamVideoClient({
          apiKey: STREAM_API_KEY,
          user,
          token: tokenData.token,
        });

        console.log("Client created, creating call instance...");
        const callInstance = videoClient.call("default", callId);

        console.log("Joining call...");
        await callInstance.join({ create: true });

        console.log("Joined call successfully");

        setClient(videoClient);
        setCall(callInstance);
        
      } catch (error) {
        console.error("Error joining call:", error);
        toast.error("Could not join the call. Please try again.");
      } finally {
        setIsConnecting(false);
      }
    };

    initCall();
    
    // Cleanup function to leave call when component unmounts
    return () => {
      if (call) {
        console.log("Leaving call...");
        call.leave().catch(console.error);
      }
      if (client) {
        console.log("Disconnecting client...");
        client.disconnectUser().catch(console.error);
      }
    };
  }, [tokenData, authUser, callId]);

  if (isLoading || isConnecting) {
    console.log("Loading state:", { isLoading, isConnecting });
    return <PageLoader />;
  }

  console.log("Render state:", { hasClient: !!client, hasCall: !!call });

  return (
    <div className='h-screen flex flex-col items-center justify-center'>
       <div className='relative'>
        {client && call ? (
          <StreamVideo client={client}>
            <StreamCall call={call}>
              <CallContent />
            </StreamCall>
          </StreamVideo>
            
        ) : (
          <div className="flex items-center justify-center h-full">
            <p>Could not initialize call. Please refresh or try again later.</p>
          </div>
        )}
       </div>
    </div>
  );
}

const CallContent = () => {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState(); // FIXED: Changed to lowercase
  const navigate = useNavigate(); 

  // FIXED: Moved navigation logic to useEffect to prevent rendering issues
  useEffect(() => {
    if (callingState === CallingState.LEFT) {
      navigate("/");
    }
  }, [callingState, navigate]);

  return (
    <StreamTheme>
      <SpeakerLayout />
      <CallControls />
    </StreamTheme>
  );
};

export default CallPage;