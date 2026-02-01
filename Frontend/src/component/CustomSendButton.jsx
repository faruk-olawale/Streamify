import { useState, useEffect } from "react";
import { useChannelActionContext } from "stream-chat-react";
import { Mic, Send } from "lucide-react";
import VoiceMessageRecorder from "./VoiceMessageRecorder";

const CustomSendButton = ({ channel }) => {
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [hasText, setHasText] = useState(false);
  
  // Get sendMessage from Stream's context
  const { sendMessage } = useChannelActionContext();

  useEffect(() => {
    // Monitor textarea for text changes
    const checkForText = () => {
      const textarea = document.querySelector('.str-chat__textarea textarea');
      if (textarea) {
        const text = textarea.value || '';
        setHasText(text.trim().length > 0);
      }
    };

    // Initial check
    checkForText();

    // Listen to textarea events
    const textarea = document.querySelector('.str-chat__textarea textarea');
    if (textarea) {
      textarea.addEventListener('input', checkForText);
      textarea.addEventListener('change', checkForText);
      textarea.addEventListener('keyup', checkForText);
      
      return () => {
        textarea.removeEventListener('input', checkForText);
        textarea.removeEventListener('change', checkForText);
        textarea.removeEventListener('keyup', checkForText);
      };
    }

    // Fallback: check every 100ms
    const interval = setInterval(checkForText, 100);
    return () => clearInterval(interval);
  }, []);

  const handleMicClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("🎤 Mic clicked");
    console.log("sendMessage available:", !!sendMessage);
    console.log("channel available:", !!channel);
    setShowVoiceRecorder(true);
  };

  return (
    <>
      <div className="custom-send-button-wrapper">
        {!hasText ? (
          // Mic Button
          <button
            type="button"
            onClick={handleMicClick}
            className="custom-send-button mic-button"
            aria-label="Send voice message"
          >
            <Mic size={20} />
          </button>
        ) : (
          // Send Button
          <button
            type="submit"
            className="custom-send-button send-button"
            aria-label="Send message"
          >
            <Send size={20} />
          </button>
        )}
      </div>

      {showVoiceRecorder && (
        <VoiceMessageRecorder
          channel={channel}
          sendMessage={sendMessage}
          onClose={() => setShowVoiceRecorder(false)}
        />
      )}

      <style jsx>{`
        .custom-send-button-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .custom-send-button {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .mic-button {
          background: transparent;
          color: hsl(var(--bc));
        }

        .mic-button:hover {
          background: hsl(var(--p) / 0.1);
          transform: scale(1.05);
        }

        .send-button {
          background: hsl(var(--p));
          color: white;
        }

        .send-button:hover {
          background: hsl(var(--p) / 0.9);
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .custom-send-button:active {
          transform: scale(0.95);
        }
      `}</style>
    </>
  );
};

export default CustomSendButton;