import User from "../models/User.js";
import { recordPractice, hasPracticedToday } from "../utils/streakHelper.js";

/**
 * Record a practice session
 */
export const recordPracticeSession = async (req, res) => {
  try {
    const userId = req.user._id;
    const { activityType, partnerId, duration } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Record practice
    recordPractice(user, activityType, partnerId, duration);
    await user.save();

    res.status(200).json({
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      todaysPracticeMinutes: user.todaysPracticeMinutes,
      dailyGoalProgress: (user.todaysPracticeMinutes / user.dailyGoal) * 100
    });
  } catch (error) {
    console.error("Record practice error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * Get user's practice stats
 */
export const getPracticeStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      currentStreak: user.currentStreak || 0,
      longestStreak: user.longestStreak || 0,
      todaysPracticeMinutes: user.todaysPracticeMinutes || 0,
      dailyGoal: user.dailyGoal || 30,
      hasPracticedToday: hasPracticedToday(user),
      practiceHistory: user.practiceHistory || []
    });
  } catch (error) {
    console.error("Get practice stats error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};