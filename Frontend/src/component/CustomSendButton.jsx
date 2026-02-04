// import { Mic, Send } from "lucide-react";
import { useMessageInputContext } from "stream-chat-react";

const CustomSendButton = () => {
  const {
    text,
    handleSubmit,
    disabled,
    audioRecordingEnabled,
    toggleAudioRecording,
  } = useMessageInputContext();

  const hasText = text?.trim().length > 0;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        e.preventDefault();

        if (hasText) {
          handleSubmit(e);
        } else if (audioRecordingEnabled) {
          toggleAudioRecording();
        }
      }}
      className="custom-send-button"
      aria-label={hasText ? "Send message" : "Record voice message"}
    >
      {/* {hasText ? <Send size={20} /> : <Mic size={20} />} */}
    </button>
  );
};

export default CustomSendButton;
