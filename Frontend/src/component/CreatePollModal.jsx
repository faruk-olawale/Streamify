import { useState } from "react";
import { X, Plus, Trash2, MessageSquarePlus, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import { createPollInDB } from "../lib/api";

const CreatePollModal = ({ channel, onClose, group, authUser }) => {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, ""]);
    } else {
      toast.error("Maximum 10 options allowed");
    }
  };

  const removeOption = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    } else {
      toast.error("Minimum 2 options required");
    }
  };

  const updateOption = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value.slice(0, 100);
    setOptions(newOptions);
  };

  const handleCreatePoll = async () => {
    // Validation
    if (!question.trim()) {
      toast.error("Please enter a question");
      return;
    }

    const filledOptions = options.filter((opt) => opt.trim());
    if (filledOptions.length < 2) {
      toast.error("Please provide at least 2 options");
      return;
    }

    try {
      setIsSubmitting(true);

      // Create poll data structure
      const pollData = {
        question: question.trim(),
        options: filledOptions.map((opt, idx) => ({
          id: idx + 1,
          text: opt.trim(),
          votes: 0,
          voters: [],
        })),
        settings: {
          allowMultiple,
          isAnonymous,
        },
        createdAt: new Date().toISOString(),
        totalVotes: 0,
      };

      // Create poll display text
      let pollText = `📊 **POLL:** ${question}\n\n`;
      filledOptions.forEach((opt, idx) => {
        pollText += `${idx + 1}️⃣ ${opt}\n`;
      });
      
      pollText += `\n${allowMultiple ? "✅ Multiple choice" : "⭕ Single choice"}`;
      pollText += ` • ${isAnonymous ? "🔒 Anonymous" : "👥 Public"}`;

      console.log('🎯 Step 1: Sending poll to Stream Chat...');

      // 1. Send poll message to Stream Chat
      const streamResponse = await channel.sendMessage({
        text: pollText,
        attachments: [
          {
            type: 'poll',
            title: question.trim(),
            text: pollText,
            poll_data: JSON.stringify(pollData),
          },
        ],
      });

      const messageId = streamResponse.message.id;
      console.log('✅ Stream Chat message sent. MessageId:', messageId);

      // 2. CRITICAL: Save poll to YOUR backend database
      console.log('🎯 Step 2: Saving poll to database...');
      console.log('Poll data being sent:', {
        messageId,
        channelId: channel.id,
        question: question.trim(),
        optionsCount: pollData.options.length
      });

      try {
        const backendResponse = await createPollInDB({
          messageId: messageId,
          channelId: channel.id,
          question: question.trim(),
          options: pollData.options,
          settings: pollData.settings
        });

        if (backendResponse.success) {
          console.log('✅ Poll saved to database successfully!', backendResponse.poll);
          toast.success("Poll created successfully! 🎉");
          onClose();
        } else {
          throw new Error(backendResponse.error || 'Failed to save poll');
        }
      } catch (backendError) {
        console.error('❌ Backend save error:', backendError);
        console.error('Error details:', backendError.response?.data);
        
        // Show specific error to user
        const errorMessage = backendError.response?.data?.error || backendError.message || 'Unknown error';
        toast.error(`Poll NOT saved to database: ${errorMessage}`);
        
        // Don't close modal so user can try again
        setIsSubmitting(false);
        return;
      }
    } catch (error) {
      console.error("❌ Poll creation error:", error);
      
      if (error.message?.includes("StreamChat error")) {
        toast.error("Failed to send poll to chat. Please try again.");
      } else {
        toast.error("Failed to create poll. Check your connection.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] animate-fadeIn"
        onClick={onClose}
      ></div>

      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-gradient-to-br from-base-100 to-base-200 rounded-3xl shadow-2xl border-2 border-primary/20 max-w-lg w-full my-8 animate-scaleIn">
          {/* Header */}
          <div className="bg-gradient-to-r from-secondary/20 via-primary/20 to-secondary/20 p-5 border-b border-base-300/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center shadow-lg">
                  <MessageSquarePlus size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Create Poll</h3>
                  <p className="text-xs text-base-content/60">
                    Get opinions from group members
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="btn btn-ghost btn-sm btn-circle hover:bg-error/10 hover:text-error"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
            {/* Question */}
            <div>
              <label className="label">
                <span className="label-text font-semibold">
                  Poll Question <span className="text-error">*</span>
                </span>
                <span className="label-text-alt text-base-content/60">
                  {question.length}/200
                </span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full focus:input-primary"
                placeholder="What's your question?"
                value={question}
                onChange={(e) => setQuestion(e.target.value.slice(0, 200))}
                maxLength={200}
              />
            </div>

            {/* Options */}
            <div>
              <label className="label">
                <span className="label-text font-semibold">
                  Options <span className="text-error">*</span>
                </span>
                <button
                  onClick={addOption}
                  className="btn btn-ghost btn-xs gap-1"
                  disabled={options.length >= 10}
                >
                  <Plus size={14} />
                  Add Option
                </button>
              </label>
              <div className="space-y-2">
                {options.map((option, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <div className="badge badge-neutral badge-sm w-8 flex-shrink-0">
                      {index + 1}
                    </div>
                    <input
                      type="text"
                      className="input input-bordered input-sm flex-1 focus:input-primary"
                      placeholder={`Option ${index + 1}`}
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      maxLength={100}
                    />
                    {options.length > 2 && (
                      <button
                        onClick={() => removeOption(index)}
                        className="btn btn-ghost btn-sm btn-circle text-error hover:bg-error/10"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-base-content/60 mt-2">
                {options.filter((opt) => opt.trim()).length} of {options.length}{" "}
                options filled • Max 10 options
              </p>
            </div>

            {/* Settings */}
            <div className="space-y-3">
              <label className="label">
                <span className="label-text font-semibold">Poll Settings</span>
              </label>

              <div className="card bg-base-200/50 border border-base-300/50">
                <div className="card-body p-4 space-y-3">
                  {/* Allow Multiple */}
                  <label className="flex items-center justify-between cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center group-hover:bg-info/20 transition-colors">
                        <CheckCircle size={18} className="text-info" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Multiple Choice</p>
                        <p className="text-xs text-base-content/60">
                          Allow selecting multiple options
                        </p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      className="toggle toggle-info"
                      checked={allowMultiple}
                      onChange={(e) => setAllowMultiple(e.target.checked)}
                    />
                  </label>

                  {/* Anonymous */}
                  <label className="flex items-center justify-between cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
                        <MessageSquarePlus size={18} className="text-secondary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Anonymous Voting</p>
                        <p className="text-xs text-base-content/60">
                          Hide who voted for what
                        </p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      className="toggle toggle-secondary"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Preview */}
            {question && options.filter((opt) => opt.trim()).length >= 2 && (
              <div className="alert alert-success">
                <MessageSquarePlus size={18} />
                <div className="text-sm">
                  <p className="font-semibold">Ready to create!</p>
                  <p>
                    {options.filter((opt) => opt.trim()).length} options •{" "}
                    {allowMultiple ? "Multiple choice" : "Single choice"} •{" "}
                    {isAnonymous ? "Anonymous" : "Public"}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 pt-0 flex gap-3 border-t border-base-300/50">
            <button
              onClick={onClose}
              className="btn btn-ghost flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              onClick={handleCreatePoll}
              className="btn btn-primary flex-1 gap-2"
              disabled={
                isSubmitting ||
                !question.trim() ||
                options.filter((opt) => opt.trim()).length < 2
              }
            >
              {isSubmitting ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Creating...
                </>
              ) : (
                <>
                  <MessageSquarePlus size={18} />
                  Create Poll
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(var(--p) / 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--p) / 0.5);
        }
      `}</style>
    </>
  );
};

export default CreatePollModal;