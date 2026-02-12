// Frontend/src/components/TopicSuggestions.jsx
import { useState } from 'react';
import { Lightbulb, RefreshCw, X, Send } from 'lucide-react';
import { getTopicSuggestions } from '../lib/ai-api';
import toast from 'react-hot-toast';

const TopicSuggestions = ({ onSelectTopic }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [topics, setTopics] = useState([]);

  const loadTopics = async () => {
    setIsLoading(true);
    try {
      const result = await getTopicSuggestions();
      setTopics(result.topics || []);
    } catch (error) {
      console.error('Topic generation error:', error);
      toast.error('Failed to generate topics');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    if (topics.length === 0) {
      loadTopics();
    }
  };

  const handleSelectTopic = (topic) => {
    if (onSelectTopic) {
      // Format topic message
      const topicMessage = `💡 ${topic.title}\n\n${topic.description}\n\n❓ Questions to discuss:\n${topic.starterQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`;
      onSelectTopic(topicMessage);
      setIsOpen(false);
      toast.success('Topic sent to chat!');
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'badge-success';
      case 'medium': return 'badge-warning';
      case 'hard': return 'badge-error';
      default: return 'badge-ghost';
    }
  };

  const getCategoryEmoji = (category) => {
    const emojiMap = {
      'daily-life': '🏠',
      'hobbies': '🎨',
      'culture': '🌍',
      'food': '🍕',
      'travel': '✈️',
      'entertainment': '🎬',
      'technology': '💻',
      'sports': '⚽',
      'nature': '🌳'
    };
    return emojiMap[category?.toLowerCase()] || '💬';
  };

  return (
    <>
      {/* Topic Suggestion Button */}
      <button
        onClick={handleOpen}
        className="btn btn-ghost btn-sm gap-2"
        title="Get conversation topic ideas"
      >
        <Lightbulb size={16} />
        Topic Ideas
      </button>

      {/* Topics Modal */}
      {isOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-3xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Lightbulb className="text-warning" size={20} />
                Conversation Topic Ideas
              </h3>
              <div className="flex gap-2">
                <button 
                  onClick={loadTopics}
                  disabled={isLoading}
                  className="btn btn-ghost btn-sm btn-circle"
                  title="Refresh topics"
                >
                  <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="btn btn-ghost btn-sm btn-circle"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <span className="loading loading-spinner loading-lg text-primary"></span>
                <p className="mt-4 text-base-content/60">Generating fresh topics...</p>
              </div>
            ) : topics.length > 0 ? (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {topics.map((topic, index) => (
                  <div 
                    key={index}
                    className="card bg-base-200 border border-base-300 hover:shadow-lg transition-all"
                  >
                    <div className="card-body p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">
                              {getCategoryEmoji(topic.category)}
                            </span>
                            <h4 className="font-bold text-base">
                              {topic.title}
                            </h4>
                            <span className={`badge badge-sm ${getDifficultyColor(topic.difficulty)}`}>
                              {topic.difficulty}
                            </span>
                          </div>
                          
                          <p className="text-sm text-base-content/70 mb-3">
                            {topic.description}
                          </p>

                          {/* Starter Questions */}
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-base-content/60 mb-1">
                              Questions to discuss:
                            </p>
                            {topic.starterQuestions.map((question, qIndex) => (
                              <div key={qIndex} className="flex items-start gap-2">
                                <span className="text-xs text-primary mt-0.5">❓</span>
                                <p className="text-xs text-base-content/70">
                                  {question}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {onSelectTopic && (
                          <button
                            onClick={() => handleSelectTopic(topic)}
                            className="btn btn-primary btn-sm gap-2 flex-shrink-0"
                          >
                            <Send size={14} />
                            Use
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Lightbulb size={48} className="mx-auto text-base-content/30 mb-4" />
                <p className="text-base-content/60">
                  Click the refresh button to generate topics!
                </p>
              </div>
            )}

            <div className="mt-4 text-center">
              <p className="text-xs text-base-content/40">
                💡 Tip: Topics are personalized based on your language level and interests
              </p>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setIsOpen(false)}></div>
        </div>
      )}
    </>
  );
};

export default TopicSuggestions;