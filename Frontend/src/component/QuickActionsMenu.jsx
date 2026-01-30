import { X, Video, BarChart3, CheckSquare, Calendar, Bell, Users, Target } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

const QuickActionsMenu = ({ group, onClose }) => {
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [showPollForm, setShowPollForm] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);

  const actions = [
    {
      id: "video",
      icon: Video,
      label: "Schedule Video Session",
      color: "primary",
      action: () => setShowScheduleForm(true),
    },
    {
      id: "stats",
      icon: BarChart3,
      label: "View Group Stats",
      color: "secondary",
      action: () => toast.info("Group stats feature coming soon!"),
    },
    {
      id: "poll",
      icon: CheckSquare,
      label: "Create Poll",
      color: "accent",
      action: () => setShowPollForm(true),
    },
    {
      id: "goal",
      icon: Target,
      label: "Set Practice Goal",
      color: "success",
      action: () => setShowGoalForm(true),
    },
    {
      id: "reminder",
      icon: Bell,
      label: "Send Reminder",
      color: "warning",
      action: () => toast.info("Reminder feature coming soon!"),
    },
    {
      id: "members",
      icon: Users,
      label: "Member Analytics",
      color: "info",
      action: () => toast.info("Member analytics coming soon!"),
    },
  ];

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-fadeIn"
        onClick={onClose}
      >
        <div
          className="absolute bottom-24 right-4 w-72 bg-base-200 rounded-2xl shadow-2xl overflow-hidden animate-slideUp"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-secondary p-4 text-primary-content">
            <div className="flex items-center justify-between">
              <h3 className="font-bold">Quick Actions</h3>
              <button
                onClick={onClose}
                className="btn btn-ghost btn-sm btn-circle text-primary-content"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-xs opacity-80 mt-1">Shortcuts for common tasks</p>
          </div>

          {/* Actions Grid */}
          <div className="p-4 grid grid-cols-2 gap-3">
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={action.action}
                  className={`btn btn-${action.color} flex-col h-auto py-4 gap-2 hover:scale-105 transition-transform`}
                >
                  <Icon size={24} />
                  <span className="text-xs leading-tight text-center">
                    {action.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Schedule Video Session Form */}
      {showScheduleForm && (
        <ScheduleVideoForm
          group={group}
          onClose={() => setShowScheduleForm(false)}
        />
      )}

      {/* Create Poll Form */}
      {showPollForm && (
        <CreatePollForm
          group={group}
          onClose={() => setShowPollForm(false)}
        />
      )}

      {/* Set Goal Form */}
      {showGoalForm && (
        <SetGoalForm
          group={group}
          onClose={() => setShowGoalForm(false)}
        />
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

// Schedule Video Session Form
const ScheduleVideoForm = ({ group, onClose }) => {
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    time: "",
    duration: "60",
    description: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success("Video session scheduled!");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 animate-fadeIn">
      <div className="bg-base-200 rounded-2xl w-full max-w-md shadow-xl animate-slideUp">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">Schedule Video Session</h3>
            <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">
                <span className="label-text">Session Title</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="e.g., Spanish Conversation Practice"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">
                  <span className="label-text">Date</span>
                </label>
                <input
                  type="date"
                  className="input input-bordered w-full"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">
                  <span className="label-text">Time</span>
                </label>
                <input
                  type="time"
                  className="input input-bordered w-full"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">
                <span className="label-text">Duration (minutes)</span>
              </label>
              <select
                className="select select-bordered w-full"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              >
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
                <option value="90">1.5 hours</option>
                <option value="120">2 hours</option>
              </select>
            </div>

            <div>
              <label className="label">
                <span className="label-text">Description (Optional)</span>
              </label>
              <textarea
                className="textarea textarea-bordered w-full"
                placeholder="What will you practice?"
                rows="3"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="btn btn-ghost flex-1">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary flex-1 gap-2">
                <Calendar size={18} />
                Schedule
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Create Poll Form
const CreatePollForm = ({ group, onClose }) => {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);

  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, ""]);
    }
  };

  const removeOption = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success("Poll created!");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 animate-fadeIn">
      <div className="bg-base-200 rounded-2xl w-full max-w-md shadow-xl animate-slideUp max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">Create Poll</h3>
            <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">
                <span className="label-text">Question</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="What do you want to ask?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label">
                <span className="label-text">Options</span>
              </label>
              <div className="space-y-2">
                {options.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      placeholder={`Option ${index + 1}`}
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...options];
                        newOptions[index] = e.target.value;
                        setOptions(newOptions);
                      }}
                      required
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        className="btn btn-ghost btn-square"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {options.length < 6 && (
                <button
                  type="button"
                  onClick={addOption}
                  className="btn btn-ghost btn-sm w-full mt-2"
                >
                  + Add Option
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="btn btn-ghost flex-1">
                Cancel
              </button>
              <button type="submit" className="btn btn-accent flex-1 gap-2">
                <CheckSquare size={18} />
                Create Poll
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Set Goal Form
const SetGoalForm = ({ group, onClose }) => {
  const [goalData, setGoalData] = useState({
    type: "daily",
    target: "",
    metric: "messages",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success("Practice goal set!");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 animate-fadeIn">
      <div className="bg-base-200 rounded-2xl w-full max-w-md shadow-xl animate-slideUp">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">Set Practice Goal</h3>
            <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">
                <span className="label-text">Goal Type</span>
              </label>
              <select
                className="select select-bordered w-full"
                value={goalData.type}
                onChange={(e) => setGoalData({ ...goalData, type: e.target.value })}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div>
              <label className="label">
                <span className="label-text">Metric</span>
              </label>
              <select
                className="select select-bordered w-full"
                value={goalData.metric}
                onChange={(e) => setGoalData({ ...goalData, metric: e.target.value })}
              >
                <option value="messages">Messages sent</option>
                <option value="minutes">Practice minutes</option>
                <option value="sessions">Practice sessions</option>
              </select>
            </div>

            <div>
              <label className="label">
                <span className="label-text">Target</span>
              </label>
              <input
                type="number"
                className="input input-bordered w-full"
                placeholder="Enter target number"
                value={goalData.target}
                onChange={(e) => setGoalData({ ...goalData, target: e.target.value })}
                required
                min="1"
              />
            </div>

            <div className="alert alert-info">
              <Target size={18} />
              <span className="text-sm">
                {goalData.target && `Your goal: ${goalData.target} ${goalData.metric} ${goalData.type}`}
              </span>
            </div>

            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="btn btn-ghost flex-1">
                Cancel
              </button>
              <button type="submit" className="btn btn-success flex-1 gap-2">
                <Target size={18} />
                Set Goal
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default QuickActionsMenu;