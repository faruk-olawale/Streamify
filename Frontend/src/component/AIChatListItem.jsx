// Frontend/src/component/AIChatListItem.jsx
import { Bot, Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router';

const AIChatListItem = ({ authUser }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/ai-chat');
  };

  return (
    <div
      className="card bg-gradient-to-r from-primary/10 via-secondary/5 to-primary/10 hover:from-primary/20 hover:via-secondary/10 hover:to-primary/20 border-2 border-primary/20 transition-all cursor-pointer group"
      onClick={handleClick}
    >
      <div className="card-body p-4">
        <div className="flex items-start gap-3">
          {/* AI Avatar */}
          <div className="flex-shrink-0">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center ring-4 ring-primary/20 ring-offset-2 ring-offset-base-100">
              <Bot className="size-8 text-white" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg">AI Practice Partner</h3>
                <Sparkles className="size-4 text-primary animate-pulse" />
              </div>
              <ArrowRight className="size-5 text-primary/60 group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>

            <p className="text-sm text-base-content/70 mb-2">
              Practice {authUser?.learningLanguages?.[0] || 'any language'} anytime with AI
            </p>

            {/* Features */}
            {/* <div className="flex flex-wrap gap-2">
              <span className="badge badge-sm badge-outline gap-1">
                <Sparkles className="size-3" />
                Grammar Help
              </span>
              <span className="badge badge-sm badge-outline gap-1">
                💬 Conversation
              </span>
              <span className="badge badge-sm badge-outline gap-1">
                📚 Learn 24/7
              </span>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChatListItem;