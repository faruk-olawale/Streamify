import { useState } from "react";
import {
  MessageInput,
  useChannelActionContext,
} from "stream-chat-react";
import { Mic, Send } from "lucide-react";

const WhatsAppStyleMessageInput = ({ onVoiceClick, showVoiceRecorder }) => {
  const { sendMessage } = useChannelActionContext();
  const [text, setText] = useState("");

  const hasText = text.trim().length > 0;

  const handleSend = () => {
    if (!hasText) return;
    sendMessage({ text });
    setText(""); // reset → mic comes back
  };

  return (
    <div className="relative bg-base-100 border-t border-base-300 px-3 py-2">
      <MessageInput
        grow
        value={text}
        onChange={(e) => setText(e.target.value)}
        overrideSubmitHandler={(message) => {
          if (!message.text?.trim()) return;
          sendMessage({ text: message.text });
          setText("");
        }}
        additionalTextareaProps={{
          placeholder: "Type a message",
        }}
      />

      {/* SINGLE action button (WhatsApp logic) */}
      <div className="absolute right-3 bottom-3 z-20">
        {!hasText ? (
          /* 🎤 MIC (default) */
          <button
            type="button"
            onClick={onVoiceClick}
            className={`btn btn-circle ${
              showVoiceRecorder
                ? "btn-error animate-pulse"
                : "btn-ghost hover:bg-primary/10 hover:text-primary"
            }`}
            title="Voice message"
          >
            <Mic size={20} />
          </button>
        ) : (
          /* ➤ SEND (only when typing) */
          <button
            type="button"
            onClick={handleSend}
            className="btn btn-circle btn-primary shadow-md"
            title="Send message"
          >
            <Send size={20} />
          </button>
        )}
      </div>

      {/* 🚨 HARD OVERRIDE Stream UI */}
      <style jsx>{`
        /* Kill Stream send button COMPLETELY */
        :global(.str-chat__send-button),
        :global(.str-chat__input-footer),
        :global(.str-chat__send-button-container) {
          display: none !important;
        }

        /* Space for our button */
        :global(.str-chat__textarea textarea) {
          padding-right: 64px !important;
        }
      `}</style>
    </div>
  );
};

export default WhatsAppStyleMessageInput;
