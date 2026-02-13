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
    <div className="fixed inset-0 flex flex-col bg-base-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 via-secondary/5 to-primary/10 border-b border-primary/20 px-4 py-3 shadow-sm flex-shrink-0">
        <div className="container mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/messages" className="btn btn-ghost btn-sm btn-circle">
              <ArrowLeft className="size-5" />
            </Link>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center ring-2 ring-primary/30">
                <Bot size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  AI Practice Partner
                  <Sparkles size={14} className="text-primary animate-pulse" />
                </h3>
                <p className="text-xs opacity-60">
                  Learning {targetLanguage} • {userLevel}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
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
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="container mx-auto max-w-4xl">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-content'
                      : 'bg-base-200 text-base-content'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-2">
                      <Bot size={16} className="text-primary" />
                      <span className="text-xs font-semibold text-primary">AI Assistant</span>
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {message.content}
                  </p>
                  <p className={`text-xs mt-2 ${
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
        </div>
      </div>

      {/* Quick Suggestions */}
      {messages.length === 1 && (
        <div className="px-4 pb-2">
          <div className="container mx-auto max-w-4xl">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb size={16} className="text-primary" />
              <p className="text-xs font-semibold text-base-content/70">Try asking:</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                "How do I introduce myself?",
                "Can you help me with grammar?",
                "Let's practice ordering food",
                "Teach me common phrases"
              ].map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setInputText(suggestion)}
                  className="btn btn-sm btn-outline"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-base-300 p-4 flex-shrink-0">
        <div className="container mx-auto max-w-4xl">
          <div className="flex gap-2">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="textarea textarea-bordered flex-1 resize-none min-h-[60px] max-h-[120px]"
              disabled={isLoading}
              rows={2}
            />
            <button
              onClick={handleSend}
              disabled={!inputText.trim() || isLoading}
              className="btn btn-primary btn-square self-end"
            >
              <Send size={20} />
            </button>
          </div>
          <p className="text-xs text-center text-base-content/40 mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIChatPage;