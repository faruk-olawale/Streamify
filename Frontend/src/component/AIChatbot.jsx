// Frontend/src/components/AIChatbot.jsx
import { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Sparkles, Trash2 } from 'lucide-react';
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

  return (
    <>
      {/* Floating AI Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 btn btn-primary btn-circle btn-lg shadow-lg z-50"
          title="Practice with AI"
        >
          <Bot size={24} />
        </button>
      )}

      {/* AI Chatbot Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-base-100 rounded-2xl shadow-2xl border border-base-300 flex flex-col z-50">
          {/* Header */}
          <div className="p-4 border-b border-base-300 bg-gradient-to-r from-primary/5 to-secondary/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <Bot size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold">AI Practice Partner</h3>
                  <p className="text-xs text-base-content/60">
                    Learning {targetLanguage} • {userLevel}
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={clearChat}
                  className="btn btn-ghost btn-sm btn-circle"
                  title="Clear chat"
                >
                  <Trash2 size={16} />
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="btn btn-ghost btn-sm btn-circle"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-content'
                      : 'bg-base-200 text-base-content'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles size={12} className="text-primary" />
                      <span className="text-xs font-semibold text-primary">AI</span>
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-base-200 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="loading loading-dots loading-sm"></span>
                    <span className="text-xs text-base-content/60">AI is typing...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-base-300">
            <div className="flex gap-2">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="textarea textarea-bordered flex-1 resize-none h-12"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!inputText.trim() || isLoading}
                className="btn btn-primary btn-square"
              >
                <Send size={20} />
              </button>
            </div>
            <p className="text-xs text-center text-base-content/40 mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChatbot;