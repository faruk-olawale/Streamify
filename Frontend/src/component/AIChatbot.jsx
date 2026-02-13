// Frontend/src/component/AIChatbot.jsx
import { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Sparkles, Trash2, ArrowLeft } from 'lucide-react';
import { sendAIMessage } from '../lib/ai-api';
import toast from 'react-hot-toast';

const AIChatbot = ({ targetLanguage = 'English', userLevel = 'beginner' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: `Hello! 👋 I'm your AI language practice partner. I'm here to help you practice ${targetLanguage}! 

Feel free to:
• Start a conversation on any topic
• Ask me questions about grammar
• Practice what you've learned today
• Make mistakes - that's how we learn! 😊

What would you like to talk about?`
        }
      ]);
    }
  }, [isOpen, targetLanguage]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      role: 'user',
      content: inputText.trim()
    };

    // Add user message
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Send to AI
      const result = await sendAIMessage(
        [...messages, userMessage],
        targetLanguage,
        userLevel
      );

      // Add AI response
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: result.message
      }]);
    } catch (error) {
      console.error('AI chat error:', error);
      toast.error('Failed to get AI response');
      
      // Add error message
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm sorry, I'm having trouble responding right now. Please try again! 🙏"
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: `Chat cleared! Let's start fresh. What would you like to practice? 😊`
    }]);
  };

  // Close chat
  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating AI Button - Only show when NOT open */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 btn btn-primary btn-circle btn-lg shadow-lg z-50 group hover:scale-110 transition-all"
          title="Practice with AI"
        >
          <Bot size={28} className="group-hover:rotate-12 transition-transform" />
        </button>
      )}

      {/* Full Page AI Chat - Like WhatsApp */}
      {isOpen && (
        <div className="fixed inset-0 flex flex-col bg-base-100 z-50">
          {/* Header - Like WhatsApp Chat Header */}
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-base-300 px-4 py-3 shadow-sm flex-shrink-0">
            <div className="container mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                {/* Back Button */}
                <button
                  onClick={handleClose}
                  className="btn btn-ghost btn-sm btn-circle"
                >
                  <ArrowLeft className="size-5" />
                </button>

                {/* AI Avatar & Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center ring-2 ring-primary/20">
                    <Bot size={20} className="text-white" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold truncate">AI Practice Partner</h3>
                    <p className="text-xs opacity-60 truncate">
                      Learning {targetLanguage} • {userLevel}
                    </p>
                  </div>
                </div>
              </div>

              {/* Clear Chat Button */}
              <button
                onClick={clearChat}
                className="btn btn-ghost btn-sm gap-2"
                title="Clear chat"
              >
                <Trash2 size={16} />
                <span className="hidden sm:inline">Clear</span>
              </button>
            </div>
          </div>

          {/* Messages Area - Like WhatsApp */}
          <div className="flex-1 overflow-y-auto bg-gradient-to-b from-base-100 to-base-200/30">
            <div className="container mx-auto max-w-4xl px-4 py-6 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] sm:max-w-[65%] rounded-2xl px-4 py-3 shadow-sm ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-content rounded-br-none'
                        : 'bg-base-200 text-base-content rounded-bl-none'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-1">
                        <Sparkles size={12} className="text-primary" />
                        <span className="text-xs font-semibold text-primary">AI Assistant</span>
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-base-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-2">
                      <span className="loading loading-dots loading-sm"></span>
                      <span className="text-xs text-base-content/60">AI is typing...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area - Like WhatsApp */}
          <div className="border-t border-base-300 bg-base-100 px-4 py-3 flex-shrink-0">
            <div className="container mx-auto max-w-4xl">
              <div className="flex gap-2 items-end">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="textarea textarea-bordered flex-1 resize-none min-h-[44px] max-h-32"
                  rows={1}
                  disabled={isLoading}
                  style={{
                    height: 'auto',
                    minHeight: '44px'
                  }}
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={!inputText.trim() || isLoading}
                  className="btn btn-primary btn-square h-11 w-11"
                >
                  <Send size={20} />
                </button>
              </div>
              <p className="text-xs text-center text-base-content/40 mt-2">
                Press Enter to send • Shift+Enter for new line
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChatbot;