import { useState } from "react";
import { X, Clock, Send, Calendar } from "lucide-react";
import toast from "react-hot-toast";

const ScheduleMessageModal = ({ channel, onClose }) => {
  const [message, setMessage] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSchedule = async () => {
    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    if (!scheduleDate || !scheduleTime) {
      toast.error("Please select date and time");
      return;
    }

    const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}`);
    const now = new Date();

    if (scheduledDateTime <= now) {
      toast.error("Please select a future time");
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Calculate delay in milliseconds
      const delay = scheduledDateTime.getTime() - now.getTime();

      // Format the scheduled time for display
      const formattedTime = scheduledDateTime.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });

      // Store the message text
      const messageText = message.trim();

      // Set timeout to send message
      setTimeout(async () => {
        try {
          await channel.sendMessage({
            text: messageText,
            scheduled_message: true,
            original_schedule_time: scheduledDateTime.toISOString(),
          });
          console.log("Scheduled message sent successfully");
        } catch (error) {
          console.error("Failed to send scheduled message:", error);
        }
      }, delay);

      // Show success message
      toast.success(
        `Message scheduled for ${formattedTime}`,
        { duration: 4000 }
      );

      // Send immediate confirmation message to the channel (optional)
      await channel.sendMessage({
        text: `⏰ Scheduled message set for ${formattedTime}`,
        type: 'system',
        silent: true,
      });

      onClose();
    } catch (error) {
      console.error("Schedule error:", error);
      toast.error("Failed to schedule message");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get minimum date (today)
  const today = new Date().toISOString().split("T")[0];
  
  // Get minimum time (current time if today is selected)
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes()
  ).padStart(2, "0")}`;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] animate-fadeIn"
        onClick={onClose}
      ></div>

      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-scaleIn">
        <div className="bg-gradient-to-br from-base-100 to-base-200 rounded-3xl shadow-2xl border-2 border-primary/20 max-w-md w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary/20 via-warning/20 to-primary/20 p-5 border-b border-base-300/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-warning to-primary flex items-center justify-center shadow-lg">
                  <Clock size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Schedule Message</h3>
                  <p className="text-xs text-base-content/60">
                    Send message at a specific time
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
          <div className="p-6 space-y-4">
            {/* Message Input */}
            <div>
              <label className="label">
                <span className="label-text font-semibold">Message</span>
                <span className="label-text-alt text-base-content/60">
                  {message.length}/500
                </span>
              </label>
              <textarea
                className="textarea textarea-bordered w-full h-32 focus:textarea-primary resize-none"
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, 500))}
                maxLength={500}
              />
            </div>

            {/* Date Input */}
            <div>
              <label className="label">
                <span className="label-text font-semibold flex items-center gap-2">
                  <Calendar size={16} />
                  Date
                </span>
              </label>
              <input
                type="date"
                className="input input-bordered w-full focus:input-primary"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                min={today}
              />
            </div>

            {/* Time Input */}
            <div>
              <label className="label">
                <span className="label-text font-semibold flex items-center gap-2">
                  <Clock size={16} />
                  Time
                </span>
              </label>
              <input
                type="time"
                className="input input-bordered w-full focus:input-primary"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                min={scheduleDate === today ? currentTime : undefined}
              />
            </div>

            {/* Preview */}
            {scheduleDate && scheduleTime && (
              <div className="alert alert-info">
                <Clock size={18} />
                <div className="text-sm">
                  <p className="font-semibold">Scheduled for:</p>
                  <p>
                    {new Date(
                      `${scheduleDate}T${scheduleTime}`
                    ).toLocaleString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 pt-0 flex gap-3">
            <button
              onClick={onClose}
              className="btn btn-ghost flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              onClick={handleSchedule}
              className="btn btn-primary flex-1 gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Scheduling...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Schedule
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
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
      `}</style>
    </>
  );
};

export default ScheduleMessageModal;