import { useState, useRef, useEffect } from "react";
import { Mic, Square, Play, Pause, Send, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";

const getSupportedMime = () => {
  const types = ["audio/webm;codecs=opus", "audio/webm", "audio/mp3", "audio/wav"];
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
      clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      audioURL && URL.revokeObjectURL(audioURL);
    };
  }, [audioURL]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = getSupportedMime();
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
      console.error(err);
      toast.error("Microphone access denied");
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    clearInterval(timerRef.current);
    setIsRecording(false);
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const discardRecording = () => {
    audioBlob && URL.revokeObjectURL(audioURL);
    setAudioBlob(null);
    setAudioURL(null);
    setIsPlaying(false);
    setTime(0);
    chunksRef.current = [];
  };

  const sendVoiceMessage = async () => {
    if (!audioBlob) return;
    setSending(true);

    try {
      const form = new FormData();
      form.append("file", audioBlob, "voice.webm");

      // Replace with your server IP / domain
      const res = await fetch("http://<YOUR_SERVER_IP>:5001/api/upload/file", {
        method: "POST",
        body: form,
      });

      const data = await res.json();
      if (!data.success) throw new Error("Upload failed");

      await channel.sendMessage({
        text: "",
        attachments: [
          {
            type: "audio",
            asset_url: data.fileUrl,
            mime_type: audioBlob.type,
          },
        ],
      });

      toast.success("Voice message sent!");
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Upload failed");
      setSending(false);
    }
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="p-4 bg-base-200 border-t shadow-lg">
      <div className="flex justify-between mb-3">
        <span className="font-semibold">Voice Message</span>
        <button onClick={onClose}>
          <X />
        </button>
      </div>

      {!audioURL ? (
        <div className="text-center space-y-3">
          <div className="text-3xl font-mono">{formatTime(time)}</div>
          {!isRecording ? (
            <button className="btn btn-circle btn-primary" onClick={startRecording}>
              <Mic size={28} />
            </button>
          ) : (
            <button className="btn btn-circle btn-error" onClick={stopRecording}>
              <Square size={28} />
            </button>
          )}
        </div>
      ) : (
        <>
          <audio ref={audioRef} onEnded={() => setIsPlaying(false)}>
            <source src={audioURL} type={audioBlob.type} />
          </audio>

          <div className="flex items-center gap-3 mt-3">
            <button className="btn btn-circle btn-primary" onClick={togglePlayback}>
              {isPlaying ? <Pause /> : <Play />}
            </button>
            <span className="font-mono">{formatTime(time)}</span>
            <button className="btn btn-ghost" onClick={discardRecording}>
              <Trash2 />
            </button>
          </div>

          <button
            className="btn btn-primary w-full mt-3 flex items-center justify-center gap-2"
            onClick={sendVoiceMessage}
            disabled={sending}
          >
            {sending ? "Sending..." : <Send size={20} />}
            {!sending && "Send"}
          </button>
        </>
      )}
    </div>
  );
};

export default VoiceMessageRecorder;
