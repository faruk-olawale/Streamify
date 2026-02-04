import { useMemo } from "react";
import { useMessageContext } from "stream-chat-react";
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
      <div className="custom-message-wrapper">
        <PollMessage 
          pollData={pollData}
          currentUserId={authUser?._id}
          onVote={(selectedOptions) => {
            console.log('Vote submitted:', selectedOptions);
            // Implement vote handling here
          }}
        />
      </div>
    );
  }

  // For non-poll messages, return null to use default Stream Chat rendering
  return null;
};

export default CustomMessage;