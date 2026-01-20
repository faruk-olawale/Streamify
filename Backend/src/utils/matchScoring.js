/**
 * Match Scoring System for Streamify
 * Calculates compatibility between language learners
 */

/**
 * Calculate match score between current user and a potential match
 * @param {Object} currentUser - The logged-in user
 * @param {Object} potentialMatch - A potential language partner
 * @returns {Object} { score, reasons, details }
 */
export function calculateMatchScore(currentUser, potentialMatch) {
  let score = 0;
  const reasons = [];
  const details = {};

  // ========================================
  // 1. LANGUAGE COMPATIBILITY (0-60 points)
  // ========================================
  
  // Perfect Match: They teach what you learn AND you teach what they learn (50 points)
  const mutualLanguageMatch = currentUser.learningLanguages?.some(lang =>
    potentialMatch.nativeLanguages?.includes(lang)
  ) && currentUser.nativeLanguages?.some(lang =>
    potentialMatch.learningLanguages?.includes(lang)
  );

  if (mutualLanguageMatch) {
    score += 50;
    reasons.push("Perfect language exchange match");
    details.mutualExchange = true;
  } else {
    // One-way match: They can teach you (30 points)
    const teacherMatch = currentUser.learningLanguages?.some(lang =>
      potentialMatch.nativeLanguages?.includes(lang)
    );
    
    if (teacherMatch) {
      score += 30;
      const matchedLang = currentUser.learningLanguages.find(lang =>
        potentialMatch.nativeLanguages.includes(lang)
      );
      reasons.push(`Native ${matchedLang} speaker`);
      details.canTeach = matchedLang;
    }

    // One-way match: You can teach them (20 points)
    const studentMatch = currentUser.nativeLanguages?.some(lang =>
      potentialMatch.learningLanguages?.includes(lang)
    );
    
    if (studentMatch) {
      score += 20;
      const matchedLang = currentUser.nativeLanguages.find(lang =>
        potentialMatch.learningLanguages.includes(lang)
      );
      reasons.push(`Learning ${matchedLang}`);
      details.wantsToLearn = matchedLang;
    }
  }

  // Learning same language (10 points) - can practice together
  const sameLearningLanguage = currentUser.learningLanguages?.some(lang =>
    potentialMatch.learningLanguages?.includes(lang)
  );
  
  if (sameLearningLanguage) {
    score += 10;
    const matchedLang = currentUser.learningLanguages.find(lang =>
      potentialMatch.learningLanguages.includes(lang)
    );
    reasons.push(`Both learning ${matchedLang}`);
    details.learningTogether = matchedLang;
  }

  // ========================================
  // 2. PROFICIENCY LEVEL MATCH (0-20 points)
  // ========================================
  
  if (currentUser.proficiencyLevels && potentialMatch.proficiencyLevels) {
    const levelCompatibility = calculateLevelCompatibility(
      currentUser.proficiencyLevels,
      potentialMatch.proficiencyLevels,
      currentUser.learningLanguages
    );
    
    score += levelCompatibility.score;
    if (levelCompatibility.reason) {
      reasons.push(levelCompatibility.reason);
      details.levelMatch = levelCompatibility.details;
    }
  }

  // ========================================
  // 3. LEARNING GOALS ALIGNMENT (0-15 points)
  // ========================================
  
  if (currentUser.learningGoals && potentialMatch.learningGoals) {
    const goalAlignment = calculateGoalAlignment(
      currentUser.learningGoals,
      potentialMatch.learningGoals
    );
    
    score += goalAlignment.score;
    if (goalAlignment.sharedGoals.length > 0) {
      reasons.push(`${goalAlignment.sharedGoals.length} shared learning goal(s)`);
      details.sharedGoals = goalAlignment.sharedGoals;
    }
  }

  // ========================================
  // 4. ACTIVITY & AVAILABILITY (0-5 points)
  // ========================================
  
  // Recently active users (within 7 days)
  if (potentialMatch.lastActive) {
    const daysSinceActive = Math.floor(
      (Date.now() - new Date(potentialMatch.lastActive)) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceActive <= 7) {
      score += 5;
      details.recentlyActive = true;
    } else if (daysSinceActive <= 30) {
      score += 2;
    }
  }

  // ========================================
  // FINAL SCORE CALCULATION
  // ========================================
  
  // Cap at 100
  score = Math.min(score, 100);
  
  // Calculate percentage
  const percentage = Math.round(score);

  return {
    score: percentage,
    reasons: reasons.slice(0, 3), // Top 3 reasons
    details,
    tier: getMatchTier(percentage)
  };
}

/**
 * Calculate proficiency level compatibility
 */
function calculateLevelCompatibility(userLevels, matchLevels, learningLanguages) {
  const levelScores = {
    'beginner': 1,
    'intermediate': 2,
    'advanced': 3,
    'native': 4
  };

  let totalScore = 0;
  let matchCount = 0;
  let details = [];

  // Convert Map to Object if needed
  const userLevelsObj = userLevels instanceof Map ? Object.fromEntries(userLevels) : userLevels;
  const matchLevelsObj = matchLevels instanceof Map ? Object.fromEntries(matchLevels) : matchLevels;

  learningLanguages?.forEach(lang => {
    if (userLevelsObj[lang] && matchLevelsObj[lang]) {
      const userLevel = levelScores[userLevelsObj[lang].level || userLevelsObj[lang]];
      const matchLevel = levelScores[matchLevelsObj[lang].level || matchLevelsObj[lang]];
      
      // Perfect match: same level (10 points)
      if (userLevel === matchLevel) {
        totalScore += 10;
        details.push({ language: lang, match: 'same' });
      }
      // Good match: ±1 level (5 points)
      else if (Math.abs(userLevel - matchLevel) === 1) {
        totalScore += 5;
        details.push({ language: lang, match: 'similar' });
      }
      
      matchCount++;
    }
  });

  const avgScore = matchCount > 0 ? Math.round(totalScore / matchCount) : 0;
  
  return {
    score: Math.min(avgScore, 20),
    reason: matchCount > 0 ? `Similar proficiency level` : null,
    details
  };
}

/**
 * Calculate learning goals alignment
 */
function calculateGoalAlignment(userGoals, matchGoals) {
  const sharedGoals = [];
  let score = 0;

  userGoals?.forEach(userGoal => {
    matchGoals?.forEach(matchGoal => {
      // Same language
      if (userGoal.language === matchGoal.language) {
        // Find shared goals
        const shared = userGoal.goals?.filter(g => 
          matchGoal.goals?.includes(g)
        ) || [];
        
        if (shared.length > 0) {
          sharedGoals.push({
            language: userGoal.language,
            goals: shared
          });
          score += shared.length * 5; // 5 points per shared goal
        }
      }
    });
  });

  return {
    score: Math.min(score, 15), // Cap at 15 points
    sharedGoals
  };
}

/**
 * Determine match tier based on score
 */
function getMatchTier(score) {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'great';
  if (score >= 40) return 'good';
  return 'fair';
}

/**
 * Sort users by match score
 */
export function sortByMatchScore(users, currentUser) {
  return users.map(user => {
    const matchData = calculateMatchScore(currentUser, user);
    return {
      ...user.toObject ? user.toObject() : user,
      matchScore: matchData.score,
      matchReasons: matchData.reasons,
      matchDetails: matchData.details,
      matchTier: matchData.tier
    };
  }).sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Filter users based on preferences
 */
export function filterByPreferences(users, currentUser) {
  if (!currentUser.matchPreferences) return users;

  return users.filter(user => {
    // Filter by active users only
    if (currentUser.matchPreferences.activeUsersOnly) {
      const daysSinceActive = Math.floor(
        (Date.now() - new Date(user.lastActive)) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceActive > 7) return false;
    }

    return true;
  });
}