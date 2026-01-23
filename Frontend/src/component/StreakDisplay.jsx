import { Flame, Trophy, Target } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getPracticeStats } from "../lib/api";

const StreakDisplay = ({ size = "md" }) => {
  const { data: stats } = useQuery({
    queryKey: ["practiceStats"],
    queryFn: getPracticeStats,
  });

  if (!stats) return null;

  const { currentStreak, longestStreak, todaysPracticeMinutes, dailyGoal } = stats;
  const progress = (todaysPracticeMinutes / dailyGoal) * 100;

  if (size === "compact") {
    return (
      <div className="flex items-center gap-2">
        <Flame className={`${currentStreak > 0 ? 'text-orange-500' : 'text-gray-400'}`} />
        <span className="font-bold">{currentStreak} 🔥</span>
      </div>
    );
  }

  return (
    <div className="card bg-base-200">
      <div className="card-body p-4">
        <h3 className="font-bold flex items-center gap-2 mb-3">
          <Flame className="text-orange-500" />
          Practice Streak
        </h3>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="stat bg-base-100 rounded-lg p-3">
            <div className="stat-title text-xs">Current Streak</div>
            <div className="stat-value text-2xl text-orange-500">
              {currentStreak} 🔥
            </div>
          </div>

          <div className="stat bg-base-100 rounded-lg p-3">
            <div className="stat-title text-xs">Longest Streak</div>
            <div className="stat-value text-2xl flex items-center gap-1">
              {longestStreak} <Trophy className="size-5 text-yellow-500" />
            </div>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span>Today's Goal</span>
            <span>{todaysPracticeMinutes}/{dailyGoal} min</span>
          </div>
          <progress 
            className="progress progress-primary w-full" 
            value={progress} 
            max="100"
          />
        </div>

        {currentStreak >= 7 && (
          <div className="alert alert-success mt-3">
            <span className="text-sm">
              🎉 Amazing! You've practiced {currentStreak} days in a row!
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StreakDisplay;