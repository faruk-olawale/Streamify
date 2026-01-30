import { useState, useRef, useEffect } from "react";
import { Mic, StopCircle, Play, Pause, Send, X, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

const VoiceMessageRecorder = ({ channel, onClose }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast.error("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
  };

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const sendVoiceMessage = async () => {
    if (!audioURL) return;

    try {
      // Convert blob URL to actual blob
      const response = await fetch(audioURL);
      const blob = await response.blob();
      
      // Create a file from the blob
      const file = new File([blob], `voice-message-${Date.now()}.webm`, {
        type: "audio/webm",
      });

      // Send as attachment using Stream Chat
      await channel.sendMessage({
        text: "🎤 Voice message",
        attachments: [
          {
            type: "audio",
            asset_url: audioURL,
            file_size: blob.size,
            mime_type: "audio/webm",
          },
        ],
      });

      toast.success("Voice message sent!");
      onClose();
    } catch (error) {
      console.error("Error sending voice message:", error);
      toast.error("Failed to send voice message");
    }
  };

  const discardRecording = () => {
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
    }
    setAudioURL(null);
    setRecordingTime(0);
    audioChunksRef.current = [];
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-base-300 p-4 border-t border-base-300">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-sm">Voice Message</h4>
        <button onClick={onClose} className="btn btn-ghost btn-xs btn-circle">
          <X size={16} />
        </button>
      </div>

      {/* Recording UI */}
      {!audioURL ? (
        <div className="space-y-4">
          {/* Timer */}
          <div className="text-center">
            <div className="text-3xl font-mono font-bold">
              {formatTime(recordingTime)}
            </div>
            {isRecording && (
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className="w-2 h-2 bg-error rounded-full animate-pulse"></span>
                <span className="text-sm text-base-content/60">
                  {isPaused ? "Paused" : "Recording..."}
                </span>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3">
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="btn btn-primary btn-circle btn-lg"
              >
                <Mic size={24} />
              </button>
            ) : (
              <>
                {isPaused ? (
                  <button
                    onClick={resumeRecording}
                    className="btn btn-success btn-circle btn-lg"
                  >
                    <Play size={24} />
                  </button>
                ) : (
                  <button
                    onClick={pauseRecording}
                    className="btn btn-warning btn-circle btn-lg"
                  >
                    <Pause size={24} />
                  </button>
                )}
                <button
                  onClick={stopRecording}
                  className="btn btn-error btn-circle btn-lg"
                >
                  <StopCircle size={24} />
                </button>
              </>
            )}
          </div>

          <p className="text-xs text-center text-base-content/50">
            {!isRecording
              ? "Tap the microphone to start recording"
              : "Tap pause to pause, or stop to finish"}
          </p>
        </div>
      ) : (
        /* Preview UI */
        <div className="space-y-4">
          {/* Audio player */}
          <audio
            ref={audioRef}
            src={audioURL}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />

          <div className="flex items-center gap-3 p-3 bg-base-100 rounded-lg">
            <button
              onClick={isPlaying ? pauseAudio : playAudio}
              className="btn btn-circle btn-sm"
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>
            
            <div className="flex-1">
              <div className="text-sm font-medium">Voice Message</div>
              <div className="text-xs text-base-content/60">
                {formatTime(recordingTime)}
              </div>
            </div>

            <button
              onClick={discardRecording}
              className="btn btn-ghost btn-sm btn-circle"
              title="Discard"
            >
              <Trash2 size={16} />
            </button>
          </div>

          {/* Send button */}
          <button
            onClick={sendVoiceMessage}
            className="btn btn-primary btn-block gap-2"
          >
            <Send size={18} />
            Send Voice Message
          </button>
        </div>
      )}
    </div>
  );
};

export default VoiceMessageRecorder;