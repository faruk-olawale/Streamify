import { useState, useEffect, useMemo } from "react";
import { CheckCircle2, Users, Clock, BarChart3, TrendingUp } from "lucide-react";
import toast from "react-hot-toast";

const PollMessage = ({ pollData, messageId, currentUserId, channel }) => {
  const [selectedOptions, setSelectedOptions] = useState(new Set());
  const [hasVoted, setHasVoted] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [pollState, setPollState] = useState(null);

  // Parse and memoize poll data to prevent infinite loops
  const parsedPoll = useMemo(() => {
    if (!pollData) return null;
    return typeof pollData === 'string' ? JSON.parse(pollData) : pollData;
  }, [pollData]);

  // Initialize poll state only once
  useEffect(() => {
    if (!parsedPoll) return;
    
    setPollState(parsedPoll);
    
    // Check if current user has already voted
    const voteKey = `poll_${messageId}_${currentUserId}`;
    const existingVote = localStorage.getItem(voteKey);
    if (existingVote) {
      try {
        const voted = JSON.parse(existingVote);
        setSelectedOptions(new Set(voted));
        setHasVoted(true);
      } catch (error) {
        console.error('Error loading vote:', error);
      }
    }
  }, [parsedPoll, messageId, currentUserId]);

  if (!pollState) return null;

  const { question, options, settings, createdAt } = pollState;
  const { allowMultiple, isAnonymous } = settings || {};

  // Calculate total votes and percentages
  const actualTotalVotes = options.reduce((sum, opt) => sum + (opt.votes || 0), 0);
  
  const getPercentage = (votes) => {
    if (actualTotalVotes === 0) return 0;
    return Math.round((votes / actualTotalVotes) * 100);
  };

  // Get max voted option for highlighting
  const maxVotes = Math.max(...options.map(opt => opt.votes || 0));

  // Handle option selection
  const handleOptionClick = (optionId) => {
    if (hasVoted) return;
    
    if (allowMultiple) {
      const newSelected = new Set(selectedOptions);
      if (newSelected.has(optionId)) {
        newSelected.delete(optionId);
      } else {
        newSelected.add(optionId);
      }
      setSelectedOptions(newSelected);
    } else {
      setSelectedOptions(new Set([optionId]));
    }
  };

  // Submit vote
  const handleVote = async () => {
    if (selectedOptions.size === 0) {
      toast.error("Please select at least one option");
      return;
    }

    setIsVoting(true);
    try {
      // Update local state
      const updatedOptions = options.map(opt => {
        if (selectedOptions.has(opt.id)) {
          return {
            ...opt,
            votes: (opt.votes || 0) + 1,
            voters: [...(opt.voters || []), currentUserId]
          };
        }
        return opt;
      });

      setPollState({
        ...pollState,
        options: updatedOptions
      });

      // Save vote locally
      const voteKey = `poll_${messageId}_${currentUserId}`;
      localStorage.setItem(voteKey, JSON.stringify(Array.from(selectedOptions)));

      setHasVoted(true);
      toast.success("Vote submitted! 🎉");
    } catch (error) {
      console.error("Vote error:", error);
      toast.error("Failed to submit vote");
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <>
      <div className="poll-message-container max-w-md w-full my-3">
        <div className="poll-card bg-gradient-to-br from-base-100 via-base-100 to-base-200/50 rounded-3xl shadow-xl border-2 border-primary/10 overflow-hidden backdrop-blur-sm">
          {/* Poll Header */}
          <div className="poll-header bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 p-5 border-b border-base-300/30">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary via-primary to-secondary flex items-center justify-center flex-shrink-0 shadow-lg ring-2 ring-primary/20 ring-offset-2 ring-offset-base-100">
                <BarChart3 size={22} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base leading-snug mb-2.5 text-base-content">
                  {question}
                </h3>
                <div className="flex items-center gap-3 text-xs text-base-content/60">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Users size={13} />
                    <span>{actualTotalVotes} {actualTotalVotes === 1 ? 'vote' : 'votes'}</span>
                  </span>
                  <span className="w-1 h-1 rounded-full bg-base-content/30"></span>
                  <span className="flex items-center gap-1.5">
                    <Clock size={13} />
                    {new Date(createdAt).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Settings Badges */}
            {(allowMultiple || isAnonymous) && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-base-300/30">
                {allowMultiple && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-info/10 text-info rounded-lg text-xs font-semibold border border-info/20">
                    <CheckCircle2 size={11} />
                    Multiple choice
                  </span>
                )}
                {isAnonymous && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-secondary/10 text-secondary rounded-lg text-xs font-semibold border border-secondary/20">
                    🔒 Anonymous
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Poll Options */}
          <div className="poll-options p-5 space-y-2.5">
            {options.map((option) => {
              const isSelected = selectedOptions.has(option.id);
              const percentage = getPercentage(option.votes || 0);
              const showResults = hasVoted;
              const isWinning = hasVoted && option.votes === maxVotes && maxVotes > 0;

              return (
                <button
                  key={option.id}
                  onClick={() => handleOptionClick(option.id)}
                  disabled={hasVoted || isVoting}
                  className={`poll-option-btn relative w-full text-left transition-all duration-300 group ${
                    hasVoted ? 'cursor-default' : 'cursor-pointer active:scale-[0.98]'
                  }`}
                >
                  <div
                    className={`poll-option-content relative rounded-2xl border-2 transition-all duration-300 overflow-hidden ${
                      isSelected && !hasVoted
                        ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10 scale-[1.01]'
                        : hasVoted
                        ? isWinning 
                          ? 'border-success/30 bg-base-100 shadow-md'
                          : 'border-base-300/40 bg-base-100'
                        : 'border-base-300/40 bg-base-100 hover:border-primary/40 hover:bg-base-50 hover:shadow-md hover:scale-[1.01]'
                    }`}
                  >
                    {/* Progress Bar Background */}
                    {showResults && (
                      <div
                        className={`poll-progress absolute inset-0 transition-all duration-700 ease-out ${
                          isWinning 
                            ? 'bg-gradient-to-r from-success/20 via-success/15 to-success/5'
                            : 'bg-gradient-to-r from-primary/10 via-primary/5 to-transparent'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    )}

                    {/* Option Content */}
                    <div className="relative z-10 p-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Radio/Checkbox */}
                        <div
                          className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                            isSelected && !hasVoted
                              ? 'border-primary bg-primary shadow-sm shadow-primary/30'
                              : hasVoted && selectedOptions.has(option.id)
                              ? 'border-primary bg-primary'
                              : 'border-base-300 bg-base-100 group-hover:border-primary/50'
                          }`}
                        >
                          {(isSelected || (hasVoted && selectedOptions.has(option.id))) && (
                            <div className="w-2 h-2 rounded-full bg-white"></div>
                          )}
                        </div>

                        {/* Option Text */}
                        <span className={`font-medium text-sm flex-1 truncate transition-colors ${
                          showResults && isWinning ? 'text-success font-semibold' : 'text-base-content'
                        }`}>
                          {option.text}
                        </span>
                      </div>

                      {/* Vote Count/Percentage */}
                      {showResults && (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {isWinning && (
                            <TrendingUp size={14} className="text-success" />
                          )}
                          <span className={`text-sm font-bold ${
                            isWinning ? 'text-success' : 'text-primary'
                          }`}>
                            {percentage}%
                          </span>
                          {!isAnonymous && option.votes > 0 && (
                            <span className="text-xs text-base-content/60 font-medium">
                              ({option.votes})
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Vote Button or Results Footer */}
          <div className="poll-footer px-5 pb-5">
            {!hasVoted ? (
              <button
                onClick={handleVote}
                disabled={selectedOptions.size === 0 || isVoting}
                className={`btn w-full shadow-lg hover:shadow-xl transition-all gap-2 ${
                  selectedOptions.size > 0 
                    ? 'btn-primary' 
                    : 'btn-disabled opacity-50'
                }`}
              >
                {isVoting ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Submitting vote...
                  </>
                ) : selectedOptions.size > 0 ? (
                  <>
                    <CheckCircle2 size={18} />
                    Submit vote ({selectedOptions.size} selected)
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    Select an option to vote
                  </>
                )}
              </button>
            ) : (
              <div className="text-center p-4 bg-gradient-to-r from-success/10 via-success/5 to-success/10 border-2 border-success/20 rounded-2xl">
                <div className="flex items-center justify-center gap-2 text-success">
                  <CheckCircle2 size={18} />
                  <span className="font-semibold text-sm">
                    Your vote: {" "}
                    <span className="text-base-content">
                      {options
                        .filter(opt => selectedOptions.has(opt.id))
                        .map(opt => opt.text)
                        .join(", ")}
                    </span>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Regular CSS instead of styled-jsx */}
      <style>{`
        .poll-message-container {
          animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .poll-progress {
          animation: fillProgress 0.7s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fillProgress {
          from {
            width: 0;
          }
        }

        .poll-option-btn:not(:disabled):active {
          transform: scale(0.98);
        }
      `}</style>
    </>
  );
};

export default PollMessage;