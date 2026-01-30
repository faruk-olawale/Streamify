import { useState, useRef, useEffect } from "react";
import { Mic, Square, Play, Pause, Send, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";

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
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  /* =====================
     Upload to Cloudinary
  ===================== */
  const sendVoiceMessage = async () => {
    if (!audioBlob) return;
    setSending(true);

    try {
      const form = new FormData();
      form.append("file", audioBlob);
      form.append("upload_preset", "YOUR_UPLOAD_PRESET"); // Create a preset in Cloudinary
      form.append("resource_type", "video"); // Required for audio in Cloudinary

      const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME}/video/upload`, {
        method: "POST",
        body: form,
      });

      const data = await res.json();
      const audioUrl = data.secure_url;

      await channel.sendMessage({
        text: "",
        attachments: [
          {
            type: "audio",
            asset_url: audioUrl,
            mime_type: audioBlob.type,
          },
        ],
      });

      toast.success("Voice message sent!");
      onClose();
    } catch (err) {
      console.error("Cloudinary upload error:", err);
      toast.error("Upload failed");
      setSending(false);
    }
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  /* =====================
     UI
  ===================== */
  return (
    <div className="p-4 bg-base-200 border-t shadow-lg">
      {/* Header */}
      <div className="flex justify-between mb-3">
        <span className="font-semibold">Voice Message</span>
        <button onClick={onClose}><X /></button>
      </div>

      {/* Recording UI */}
      {!audioURL ? (
        <div className="text-center space-y-3">
          <div className="text-3xl font-mono">{formatTime(time)}</div>
          {!isRecording ? (
            <button className="btn btn-circle btn-primary" onClick={startRecording}>
              <Mic size={28} />
            </button>
          ) : (
            <button className="btn btn-circle btn-error" onClick={stopRecording}>
              <Square size={24} />
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Audio playback */}
          <audio ref={audioRef} onEnded={() => setIsPlaying(false)}>
            <source src={audioURL} type={audioBlob.type} />
          </audio>

          <div className="flex items-center gap-3 mt-3">
            <button className="btn btn-circle btn-primary" onClick={togglePlayback}>
              {isPlaying ? <Pause /> : <Play />}
            </button>
            <span>{formatTime(time)}</span>
            <button className="btn btn-ghost" onClick={() => {
              setAudioURL(null);
              setAudioBlob(null);
              setTime(0);
            }}>
              <Trash2 />
            </button>
          </div>

          <button
            className="btn btn-primary w-full mt-3"
            onClick={sendVoiceMessage}
            disabled={sending}
          >
            {sending ? "Sending..." : <><Send size={18} /> Send</>}
          </button>
        </>
      )}
    </div>
  );
};

export default VoiceMessageRecorder;
