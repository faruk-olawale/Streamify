import { useState, useEffect } from "react";
import { useChannelActionContext, useMessageInputContext } from "stream-chat-react";
import { Mic, Send } from "lucide-react";
import VoiceMessageRecorder from "./VoiceMessageRecorder";

const CustomSendButton = ({ channel }) => {
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [hasText, setHasText] = useState(false);
  
  // Get Stream's context
  const { sendMessage } = useChannelActionContext();
  const messageInputContext = useMessageInputContext();

  // EXTREME DEBUGGING
  console.log("==========================================");
  console.log("🔄 RENDER - hasText:", hasText);
  console.log("🔄 RENDER - Will show:", hasText ? "SEND ICON ➤" : "MIC ICON 🎤");
  console.log("==========================================");

  // Monitor textarea for text changes
  useEffect(() => {
    console.log("🎬 useEffect running - setting up text monitoring");
    
    const checkForText = () => {
      // Try multiple selectors
      let textarea = document.querySelector('.str-chat__textarea textarea');
      
      if (!textarea) {
        textarea = document.querySelector('textarea[name="message"]');
      }
      
      if (!textarea) {
        textarea = document.querySelector('.str-chat textarea');
      }
      
      if (!textarea) {
        textarea = document.querySelector('textarea');
      }
      
      if (textarea) {
        const text = textarea.value || '';
        const trimmedText = text.trim();
        const hasContent = trimmedText.length > 0;
        
        console.log("📊 CHECK - textarea value:", `"${text}"`);
        console.log("📊 CHECK - trimmed length:", trimmedText.length);
        console.log("📊 CHECK - hasContent:", hasContent);
        console.log("📊 CHECK - current hasText state:", hasText);
        
        if (hasContent !== hasText) {
          console.log("🔥 STATE CHANGE! Setting hasText to:", hasContent);
          setHasText(hasContent);
        }
      } else {
        console.warn("⚠️ NO TEXTAREA FOUND!");
      }
    };

    // Initial check
    console.log("🏁 Initial check...");
    checkForText();

    // Try to find and attach to textarea
    const findAndAttach = () => {
      const textarea = document.querySelector('.str-chat__textarea textarea') ||
                      document.querySelector('textarea[name="message"]') ||
                      document.querySelector('.str-chat textarea') ||
                      document.querySelector('textarea');
      
      if (textarea) {
        console.log("✅ TEXTAREA FOUND!");
        console.log("Textarea element:", textarea);
        console.log("Textarea class:", textarea.className);
        console.log("Textarea placeholder:", textarea.placeholder);
        
        // Remove old listeners first
        textarea.removeEventListener('input', checkForText);
        textarea.removeEventListener('change', checkForText);
        textarea.removeEventListener('keyup', checkForText);
        textarea.removeEventListener('keydown', checkForText);
        
        // Add new listeners
        textarea.addEventListener('input', checkForText);
        textarea.addEventListener('change', checkForText);
        textarea.addEventListener('keyup', checkForText);
        textarea.addEventListener('keydown', checkForText);
        
        console.log("✅ Event listeners attached");
        
        return () => {
          textarea.removeEventListener('input', checkForText);
          textarea.removeEventListener('change', checkForText);
          textarea.removeEventListener('keyup', checkForText);
          textarea.removeEventListener('keydown', checkForText);
        };
      } else {
        console.error("❌ TEXTAREA NOT FOUND!");
        return null;
      }
    };

    // Try to attach immediately
    const cleanup = findAndAttach();
    
    // Also set up interval to keep checking
    const interval = setInterval(() => {
      checkForText();
    }, 200);
    
    return () => {
      clearInterval(interval);
      if (cleanup) cleanup();
    };
  }, []); // Empty deps - only run once on mount

  const handleMicClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("🎤 MIC BUTTON CLICKED");
    setShowVoiceRecorder(true);
  };

  const handleSendClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log("📤 SEND BUTTON CLICKED");
    
    // Try Stream's handleSubmit first
    if (messageInputContext?.handleSubmit) {
      console.log("✅ Using Stream's handleSubmit");
      try {
        messageInputContext.handleSubmit(e);
        return;
      } catch (err) {
        console.error("❌ handleSubmit error:", err);
      }
    }
    
    // Fallback: Simulate Enter key
    console.log("⌨️ Simulating Enter key press");
    const textarea = document.querySelector('.str-chat__textarea textarea') ||
                    document.querySelector('textarea');
    
    if (textarea && textarea.value.trim()) {
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true,
        cancelable: true
      });
      textarea.dispatchEvent(enterEvent);
    }
  };

  return (
    <>
      <div className="custom-send-button-wrapper">
        {!hasText ? (
          <button
            type="button"
            onClick={handleMicClick}
            className="custom-send-button mic-button"
            aria-label="Send voice message"
            style={{ backgroundColor: 'transparent', border: '2px solid red' }}
          >
            <Mic size={20} />
            <span style={{ fontSize: '10px', marginLeft: '2px' }}>MIC</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSendClick}
            className="custom-send-button send-button"
            aria-label="Send message"
            style={{ backgroundColor: 'blue', border: '2px solid green' }}
          >
            <Send size={20} />
            <span style={{ fontSize: '10px', marginLeft: '2px' }}>SEND</span>
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
          min-width: 60px;
          height: 40px;
          border-radius: 20px;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          padding: 0 10px;
        }

        .mic-button {
          color: hsl(var(--bc));
        }

        .mic-button:hover {
          transform: scale(1.05);
        }

        .send-button {
          color: white;
        }

        .send-button:hover {
          transform: scale(1.1);
        }
      `}</style>
    </>
  );
};

export default CustomSendButton;