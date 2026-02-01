import { useState } from "react";
import { useMessageInputContext } from "stream-chat-react";
import { Mic, Send } from "lucide-react";
import VoiceMessageRecorder from "./VoiceMessageRecorder";

const CustomSendButton = ({ sendMessage, channel }) => {
  const messageInputContext = useMessageInputContext();
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);

  // Get text from Stream's input context
  const text = messageInputContext?.text || "";
  const hasText = text.trim().length > 0;

  return (
    <>
      {!hasText ? (
        // Show Mic when no text
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowVoiceRecorder(true);
          }}
          className="str-chat__send-button"
          aria-label="Send voice message"
          style={{
            background: showVoiceRecorder ? 'hsl(var(--er))' : 'transparent',
            color: showVoiceRecorder ? 'white' : 'hsl(var(--bc))',
          }}
        >
          <Mic size={20} />
        </button>
      ) : (
        // Show Send when there's text
        <button
          type="submit"
          className="str-chat__send-button"
          aria-label="Send message"
          style={{
            background: 'hsl(var(--p))',
            color: 'white',
          }}
        >
          <Send size={20} />
        </button>
      )}

      {showVoiceRecorder && (
        <VoiceMessageRecorder
          sendMessage={sendMessage}
          channel={channel}
          onClose={() => setShowVoiceRecorder(false)}
        />
      )}
    </>
  );
};

export default CustomSendButton;