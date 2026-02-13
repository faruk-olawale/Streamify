// Frontend/src/pages/AIChatPage.jsx
import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, Bot, Send, Trash2, Sparkles, Lightbulb } from 'lucide-react';
import { sendAIMessage } from '../lib/ai-api';
import toast from 'react-hot-toast';
import useAuthUser from '../hooks/useAuthUser';

const AIChatPage = () => {
  const { authUser } = useAuthUser();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const targetLanguage = authUser?.learningLanguages?.[0] || 'English';
  const userLevel = authUser?.languageLevel || 'beginner';

  // Load messages from localStorage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem('ai-chat-messages');
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        setMessages(parsed);
      } catch (error) {
        console.error('Error loading messages:', error);
      }
    } else {
      // Initialize with welcome message
      const welcomeMessage = {
        role: 'assistant',
        content: `Hello! 👋 I'm your AI language practice partner. I'm here to help you practice ${targetLanguage}!

Feel free to:
• Start a conversation on any topic
• Ask me questions about grammar
• Practice what you've learned today
• Make mistakes - that's how we learn! 😊

What would you like to talk about?`,
        timestamp: new Date().toISOString()
      };
      setMessages([welcomeMessage]);
      localStorage.setItem('ai-chat-messages', JSON.stringify([welcomeMessage]));
    }
  }, [targetLanguage]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('ai-chat-messages', JSON.stringify(messages));
    }
  }, [messages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date().toISOString()
    };

    // Add user message
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    // Blur textarea to hide mobile keyboard
    if (textareaRef.current) {
      textareaRef.current.blur();
    }

    try {
      // Send to AI
      const result = await sendAIMessage(
        [...messages, userMessage],
        targetLanguage,
        userLevel
      );

      // Add AI response
      const aiMessage = {
        role: 'assistant',
        content: result.message,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI chat error:', error);
      toast.error('Failed to get AI response');

      // Add error message
      const errorMessage = {
        role: 'assistant',
        content: "I'm sorry, I'm having trouble responding right now. Please try again! 🙏",
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, errorMessage]);
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
    if (!confirm('Clear all messages? This cannot be undone.')) return;

    const welcomeMessage = {
      role: 'assistant',
      content: `Chat cleared! Let's start fresh. What would you like to practice? 😊`,
      timestamp: new Date().toISOString()
    };

    setMessages([welcomeMessage]);
    localStorage.setItem('ai-chat-messages', JSON.stringify([welcomeMessage]));
    toast.success('Chat cleared');
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-base-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 via-secondary/5 to-primary/10 border-b border-primary/20 px-3 sm:px-4 py-3 shadow-sm flex-shrink-0">
        <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <Link to="/messages" className="btn btn-ghost btn-sm btn-circle flex-shrink-0">
              <ArrowLeft className="size-5" />
            </Link>

            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center ring-2 ring-primary/30 flex-shrink-0">
                <Bot size={20} className="sm:size-6 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold flex items-center gap-1 sm:gap-2">
                  <span className="truncate">AI Practice Partner</span>
                  <Sparkles size={12} className="sm:size-3.5 text-primary animate-pulse flex-shrink-0" />
                </h3>
                <p className="text-xs opacity-60 truncate">
                  {targetLanguage} • {userLevel}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={clearChat}
            className="btn btn-ghost btn-sm gap-1 sm:gap-2 flex-shrink-0"
            title="Clear chat"
          >
            <Trash2 size={14} className="sm:size-4" />
            <span className="hidden sm:inline text-xs">Clear</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4">
        <div className="w-full max-w-4xl mx-auto">
          <div className="space-y-3 sm:space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-3 sm:px-4 py-2 sm:py-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-content'
                      : 'bg-base-200 text-base-content'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-1 sm:mb-2">
                      <Bot size={14} className="sm:size-4 text-primary" />
                      <span className="text-xs font-semibold text-primary">AI Assistant</span>
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap leading-relaxed break-words">
                    {message.content}
                  </p>
                  <p className={`text-xs mt-1 sm:mt-2 ${
                    message.role === 'user' 
                      ? 'text-primary-content/60' 
                      : 'text-base-content/50'
                  }`}>
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-base-200 rounded-2xl px-3 sm:px-4 py-2 sm:py-3">
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
      </div>

      {/* Quick Suggestions */}
      {messages.length === 1 && (
        <div className="px-3 sm:px-4 pb-2 flex-shrink-0">
          <div className="w-full max-w-4xl mx-auto">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb size={14} className="text-primary flex-shrink-0" />
              <p className="text-xs font-semibold text-base-content/70">Try asking:</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                "How do I introduce myself?",
                "Help with grammar",
                "Practice ordering food",
                "Common phrases"
              ].map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setInputText(suggestion)}
                  className="btn btn-xs sm:btn-sm btn-outline text-xs"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input Area - FIXED FOR MOBILE */}
      <div className="border-t border-base-300 p-3 sm:p-4 flex-shrink-0 bg-base-100">
        <div className="w-full max-w-4xl mx-auto">
          <div className="flex gap-2 items-end">
            <div className="flex-1 min-w-0">
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="textarea textarea-bordered w-full resize-none text-base"
                style={{ 
                  fontSize: '16px', // Prevents zoom on iOS
                  minHeight: '44px', // Touch-friendly height
                  maxHeight: '120px'
                }}
                disabled={isLoading}
                rows={1}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!inputText.trim() || isLoading}
              className="btn btn-primary btn-square flex-shrink-0"
              style={{ 
                minWidth: '44px', 
                minHeight: '44px' 
              }}
            >
              <Send size={20} />
            </button>
          </div>
          <p className="text-xs text-center text-base-content/40 mt-2 hidden sm:block">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIChatPage;