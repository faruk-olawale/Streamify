import { useState, useRef, useEffect } from "react";
import { Mic, Square, Play, Pause, Send, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";

/* =====================
   Pick supported format
===================== */
const getMimeType = () => {
  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
  ];
  return types.find(t => MediaRecorder.isTypeSupported(t));
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
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [audioURL]);

  /* =====================
     Record
  ===================== */
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = getMimeType();
      if (!mimeType) {
        toast.error("Audio not supported");
        return;
      }

      const recorder = new MediaRecorder(stream, { mimeType });
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = e => e.data.size && chunksRef.current.push(e.data);

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        setAudioURL(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };

      recorder.start();
      setIsRecording(true);
      setTime(0);

      timerRef.current = setInterval(() => setTime(t => t + 1), 1000);
    } catch {
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
    isPlaying ? audioRef.current.pause() : audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  /* =====================
     Upload + Send
  ===================== */
  const sendVoiceMessage = async () => {
    if (!audioBlob) return;
    setSending(true);

    try {
      const form = new FormData();
      form.append("audio", audioBlob, "voice.webm");

      const res = await fetch("http://localhost:5001/api/upload/audio", {
        method: "POST",
        body: form,
        credentials: "include",
      });


      const { audioUrl } = await res.json();

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

      toast.success("Voice message sent");
      onClose();
    } catch {
      toast.error("Upload failed");
      setSending(false);
    }
  };

  const format = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  /* =====================
     UI
  ===================== */
  return (
    <div className="p-4 bg-base-200 border-t">
      <div className="flex justify-between mb-3">
        <span>Voice Message</span>
        <button onClick={onClose}><X /></button>
      </div>

      {!audioURL ? (
        <div className="text-center space-y-3">
          <div className="text-3xl font-mono">{format(time)}</div>
          {!isRecording ? (
            <button className="btn btn-circle btn-primary" onClick={startRecording}>
              <Mic />
            </button>
          ) : (
            <button className="btn btn-circle btn-error" onClick={stopRecording}>
              <Square />
            </button>
          )}
        </div>
      ) : (
        <>
          <audio ref={audioRef} onEnded={() => setIsPlaying(false)}>
            <source src={audioURL} type={audioBlob.type} />
          </audio>

          <div className="flex items-center gap-3">
            <button className="btn btn-circle btn-primary" onClick={togglePlayback}>
              {isPlaying ? <Pause /> : <Play />}
            </button>
            <span>{format(time)}</span>
            <button className="btn btn-ghost" onClick={() => setAudioURL(null)}>
              <Trash2 />
            </button>
          </div>

          <button
            className="btn btn-primary w-full mt-3"
            onClick={sendVoiceMessage}
            disabled={sending}
          >
            {sending ? "Sending..." : <><Send /> Send</>}
          </button>
        </>
      )}
    </div>
  );
};

export default VoiceMessageRecorder;
