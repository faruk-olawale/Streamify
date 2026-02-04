import { useMemo } from "react";
import { 
  MessageSimple,
  useMessageContext 
} from "stream-chat-react";
import PollMessage from "./PollMessage";

const CustomMessage = ({ authUser }) => {
  const { message } = useMessageContext();

  // Check if this is a poll message
  const pollData = useMemo(() => {
    if (message.attachments && message.attachments.length > 0) {
      const pollAttachment = message.attachments.find(
        att => att.type === 'poll' || att.poll_data
      );
      if (pollAttachment && pollAttachment.poll_data) {
        return pollAttachment.poll_data;
      }
    }
    return null;
  }, [message]);

  // If it's a poll, render the custom poll component
  if (pollData) {
    return (
      <div className="str-chat__message-simple-wrapper">
        <PollMessage 
          pollData={pollData}
          messageId={message.id}
          currentUserId={authUser?._id}
          channel={message.channel}
        />
      </div>
    );
  }

  // For non-poll messages, use default Stream Chat rendering
  return <MessageSimple />;
};

export default CustomMessage;
