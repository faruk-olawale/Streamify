/**
 * Calculate user's current streak
 */
export function calculateStreak(practiceHistory) {
  if (!practiceHistory || practiceHistory.length === 0) {
    return 0;
  }

  // Sort by date (newest first)
  const sortedHistory = [...practiceHistory].sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  );

  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0); // Reset to start of day

  for (const record of sortedHistory) {
    const recordDate = new Date(record.date);
    recordDate.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((currentDate - recordDate) / (1000 * 60 * 60 * 24));

    if (diffDays === streak) {
      // Consecutive day found
      streak++;
    } else if (diffDays > streak) {
      // Gap found, streak broken
      break;
    }
  }

  return streak;
}

/**
 * Update streak when user practices
 */
export function updateStreak(user) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastPractice = user.lastPracticeDate 
    ? new Date(user.lastPracticeDate) 
    : null;

  if (lastPractice) {
    lastPractice.setHours(0, 0, 0, 0);
  }

  const daysSinceLastPractice = lastPractice 
    ? Math.floor((today - lastPractice) / (1000 * 60 * 60 * 24))
    : Infinity;

  if (daysSinceLastPractice === 0) {
    // Already practiced today, don't increment
    return user.currentStreak;
  } else if (daysSinceLastPractice === 1) {
    // Consecutive day, increment streak
    user.currentStreak++;
  } else {
    // Streak broken, reset to 1
    user.currentStreak = 1;
  }

  // Update longest streak
  if (user.currentStreak > user.longestStreak) {
    user.longestStreak = user.currentStreak;
  }

  user.lastPracticeDate = new Date();
  return user.currentStreak;
}

/**
 * Record practice activity
 */
export function recordPractice(user, activityType, partnerId, duration) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find or create today's practice record
  let todayRecord = user.practiceHistory.find(record => {
    const recordDate = new Date(record.date);
    recordDate.setHours(0, 0, 0, 0);
    return recordDate.getTime() === today.getTime();
  });

  if (!todayRecord) {
    todayRecord = {
      date: today,
      minutesPracticed: 0,
      activities: []
    };
    user.practiceHistory.push(todayRecord);
  }

  // Add activity
  todayRecord.activities.push({
    type: activityType,
    partnerId,
    duration,
    timestamp: new Date()
  });

  todayRecord.minutesPracticed += duration;
  user.todaysPracticeMinutes = todayRecord.minutesPracticed;

  // Update streak
  updateStreak(user);

  return todayRecord;
}

/**
 * Check if user practiced today
 */
export function hasPracticedToday(user) {
  if (!user.lastPracticeDate) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastPractice = new Date(user.lastPracticeDate);
  lastPractice.setHours(0, 0, 0, 0);

  return today.getTime() === lastPractice.getTime();
}