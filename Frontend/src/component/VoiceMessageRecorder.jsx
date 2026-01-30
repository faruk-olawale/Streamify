import { useState, useRef, useEffect } from "react";
import { Mic, Square, Play, Pause, Send, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";

/* =====================
   Pick supported audio format
===================== */
const getMimeType = () => {
  const types = ["audio/webm;codecs=opus", "audio/webm", "audio/mp3"];
  return types.find((t) => MediaRecorder.isTypeSupported(t));
};

const VoiceMessageRecorder = ({ channel, onClose }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioURL, setAudioURL] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [sending, setSending] = useState(false);

  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const audioRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioURL) URL.revokeObjectURL(audioURL);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [audioURL]);

  /* =====================
     Recording
  ===================== */
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = getMimeType();
      if (!mimeType) {
        toast.error("Audio format not supported");
        return;
      }

      const recorder = new MediaRecorder(stream, { mimeType });
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        setAudioURL(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start();
      setIsRecording(true);
      setTime(0);

      timerRef.current = setInterval(() => setTime((t) => t + 1), 1000);
    } catch (err) {
      console.error("Microphone error:", err);
      toast.error("Microphone permission denied");
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    clearInterval(timerRef.current);
    setIsRecording(false);
  };

  /* =====================
     Playback
  ===================== */
  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  /* =====================
     Upload to Backend & Send
  ===================== */
  const sendVoiceMessage = async () => {
    if (!audioBlob) return;
    setSending(true);

    try {
      // Upload to your backend
      const formData = new FormData();
      formData.append("file", audioBlob, "voice-message.webm");

      const uploadRes = await axiosInstance.post("/upload/audio", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const { fileUrl, mimeType } = uploadRes.data;

      // Send to Stream Chat with the uploaded URL
      await channel.sendMessage({
        text: `🎤 Voice message (${formatTime(time)})`,
        attachments: [
          {
            type: "audio",
            asset_url: fileUrl,
            mime_type: mimeType || audioBlob.type,
            file_size: audioBlob.size,
            title: "Voice Message",
          },
        ],
      });

      toast.success("Voice message sent!");
      onClose();
    } catch (err) {
      console.error("Voice upload error:", err);
      toast.error(err.response?.data?.message || "Upload failed");
      setSending(false);
    }
  };

  const discardRecording = () => {
    if (audioURL) URL.revokeObjectURL(audioURL);
    setAudioURL(null);
    setAudioBlob(null);
    setTime(0);
    setIsPlaying(false);
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  /* =====================
     UI
  ===================== */
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-base-300 to-base-200 border-t-2 border-primary/20 shadow-2xl backdrop-blur-sm z-50 animate-slide-up">
      <div className="max-w-3xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <span className="text-sm font-semibold text-base-content">Voice Message</span>
          </div>
          <button 
            onClick={onClose} 
            className="btn btn-ghost btn-xs btn-circle hover:bg-error/10 hover:text-error transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Recording UI */}
        {!audioURL ? (
          <div className="space-y-6">
            {/* Timer */}
            <div className="text-center">
              <div className="text-5xl font-bold font-mono tabular-nums text-primary tracking-wider">
                {formatTime(time)}
              </div>
              {isRecording && (
                <div className="flex items-center justify-center gap-2 mt-3">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-error"></span>
                  </span>
                  <span className="text-sm text-base-content/70 font-medium">Recording...</span>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="btn btn-circle btn-lg bg-gradient-to-br from-primary to-secondary border-none shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300"
                >
                  <Mic size={28} className="text-primary-content" />
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="btn btn-circle btn-lg bg-gradient-to-br from-error to-error/80 border-none shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300"
                >
                  <Square size={24} className="text-error-content fill-current" />
                </button>
              )}
            </div>

            <p className="text-center text-xs text-base-content/50">
              {!isRecording
                ? "Tap the microphone to start recording"
                : "Tap the square to stop recording"}
            </p>
          </div>
        ) : (
          /* Preview UI */
          <div className="space-y-4">
            {/* Audio player */}
            <audio
              ref={audioRef}
              src={audioURL}
              onEnded={handleAudioEnded}
              className="hidden"
            />

            {/* Preview Controls */}
            <div className="flex items-center gap-4 p-4 bg-base-100/50 rounded-xl border border-base-300 backdrop-blur-sm">
              <button
                onClick={togglePlayback}
                className="btn btn-circle btn-md bg-gradient-to-br from-primary to-secondary border-none shadow-md hover:shadow-lg transition-all"
                disabled={sending}
              >
                {isPlaying ? (
                  <Pause size={20} className="text-primary-content" />
                ) : (
                  <Play size={20} className="text-primary-content ml-0.5" />
                )}
              </button>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-base-content">Voice Message</span>
                  <span className="text-sm text-base-content/60 font-mono">{formatTime(time)}</span>
                </div>
                {/* Waveform visualization */}
                <div className="flex items-center gap-0.5 h-8">
                  {[...Array(40)].map((_, i) => (
                    <div
                      key={i}
                      className={`flex-1 rounded-full transition-all duration-300 ${
                        isPlaying ? 'bg-primary' : 'bg-base-content/20'
                      }`}
                      style={{
                        height: `${Math.random() * 100}%`,
                        minHeight: '20%',
                        animationDelay: isPlaying ? `${i * 0.05}s` : '0s',
                      }}
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={discardRecording}
                className="btn btn-ghost btn-sm btn-circle hover:bg-error/10 hover:text-error transition-colors"
                title="Discard"
                disabled={sending}
              >
                <Trash2 size={18} />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={discardRecording}
                className="btn btn-outline btn-error flex-1 gap-2"
                disabled={sending}
              >
                <Trash2 size={18} />
                Discard
              </button>
              <button
                onClick={sendVoiceMessage}
                className="btn btn-primary flex-1 gap-2 shadow-lg hover:shadow-xl transition-all"
                disabled={sending}
              >
                {sending ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Send
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default VoiceMessageRecorder;