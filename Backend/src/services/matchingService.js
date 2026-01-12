// Backend/src/services/matchingService.js
import User from "../models/User.js";
import LearnerProfile from "../models/LearnerProfile.js";
import LanguageProgress from "../models/LanguageProgress.js";

/**
 * Core Matching Algorithm
 * Finds the best language exchange partners based on multiple criteria
 */

class MatchingService {
  
  /**
   * Calculate compatibility score between two users
   * Returns score 0-100 and reasons for match
   */
  async calculateCompatibility(userId, candidateId) {
    try {
      const [user, candidate] = await Promise.all([
        this.getUserMatchingData(userId),
        this.getUserMatchingData(candidateId)
      ]);

      if (!user || !candidate) {
        return { score: 0, reasons: [] };
      }

      const scores = {
        languageCompatibility: this.calculateLanguageCompatibility(user, candidate),
        availabilityMatch: this.calculateAvailabilityMatch(user, candidate),
        goalsAlignment: this.calculateGoalsAlignment(user, candidate),
        experienceLevel: this.calculateExperienceLevelMatch(user, candidate),
        activityLevel: this.calculateActivityLevel(user, candidate),
        locationBonus: this.calculateLocationBonus(user, candidate)
      };

      // Weighted average
      const weights = {
        languageCompatibility: 0.40, // Most important
        availabilityMatch: 0.25,
        goalsAlignment: 0.15,
        experienceLevel: 0.10,
        activityLevel: 0.05,
        locationBonus: 0.05
      };

      const overallScore = Object.keys(scores).reduce((total, key) => {
        return total + (scores[key] * weights[key]);
      }, 0);

      const reasons = this.generateMatchReasons(user, candidate, scores);

      return {
        overallScore: Math.round(overallScore),
        scoreBreakdown: scores,
        reasons,
        user1Data: {
          id: user._id,
          name: user.fullName,
          native: user.nativeLanguages,
          learning: user.learningLanguages
        },
        user2Data: {
          id: candidate._id,
          name: candidate.fullName,
          native: candidate.nativeLanguages,
          learning: candidate.learningLanguages
        }
      };
    } catch (error) {
      console.error("Error calculating compatibility:", error);
      return { score: 0, reasons: [] };
    }
  }

  /**
   * Get all matching data for a user
   */
  async getUserMatchingData(userId) {
    const user = await User.findById(userId).select(
      "fullName nativeLanguages learningLanguages location availability learningGoals"
    );

    if (!user) return null;

    // Get learner profile if exists
    const learnerProfile = await LearnerProfile.findOne({ userId });
    
    // Get progress data
    const progress = await LanguageProgress.find({ userId });

    return {
      ...user.toObject(),
      learnerProfile,
      progress
    };
  }

  /**
   * 1. Language Compatibility (40% weight)
   * Perfect match: User A learns what User B speaks natively, and vice versa
   */
  calculateLanguageCompatibility(user1, user2) {
    let score = 0;

    // Check if they can help each other (reciprocal exchange)
    const user1Native = user1.nativeLanguages || [];
    const user1Learning = user1.learningLanguages || [];
    const user2Native = user2.nativeLanguages || [];
    const user2Learning = user2.learningLanguages || [];

    // Perfect reciprocal match (both can teach each other)
    const user1TeachesUser2 = user1Native.some(lang => 
      user2Learning.includes(lang)
    );
    const user2TeachesUser1 = user2Native.some(lang => 
      user1Learning.includes(lang)
    );

    if (user1TeachesUser2 && user2TeachesUser1) {
      score = 100; // Perfect match
    } else if (user1TeachesUser2 || user2TeachesUser1) {
      score = 70; // One-way match
    } else {
      // Learning the same language (can practice together)
      const commonLearning = user1Learning.filter(lang => 
        user2Learning.includes(lang)
      );
      if (commonLearning.length > 0) {
        score = 50;
      } else {
        score = 0;
      }
    }

    return score;
  }

  /**
   * 2. Availability Match (25% weight)
   * Do their schedules overlap?
   */
  calculateAvailabilityMatch(user1, user2) {
    const avail1 = user1.availability || [];
    const avail2 = user2.availability || [];

    if (avail1.length === 0 || avail2.length === 0) {
      return 50; // Neutral if no data
    }

    // Check for common availability
    const commonSlots = avail1.filter(slot => avail2.includes(slot));

    if (commonSlots.length === 0) return 0;
    if (commonSlots.length >= 3) return 100;
    if (commonSlots.length === 2) return 75;
    if (commonSlots.length === 1) return 50;

    return 50;
  }

  /**
   * 3. Goals Alignment (15% weight)
   * Do they want to practice the same things?
   */
  calculateGoalsAlignment(user1, user2) {
    const goals1 = user1.learningGoals || [];
    const goals2 = user2.learningGoals || [];

    if (goals1.length === 0 || goals2.length === 0) {
      return 50; // Neutral
    }

    const commonGoals = goals1.filter(goal => goals2.includes(goal));
    const totalGoals = new Set([...goals1, ...goals2]).size;

    const overlapPercentage = (commonGoals.length / totalGoals) * 100;
    
    return Math.min(100, overlapPercentage * 1.5); // Boost overlap
  }

  /**
   * 4. Experience Level Match (10% weight)
   * Similar proficiency levels work better
   */
  calculateExperienceLevelMatch(user1, user2) {
    // Use language progress data if available
    const user1Progress = user1.progress || [];
    const user2Progress = user2.progress || [];

    if (user1Progress.length === 0 || user2Progress.length === 0) {
      return 70; // Neutral-positive if no data
    }

    // Find common language they're both learning
    const commonLanguages = user1Progress.filter(p1 => 
      user2Progress.some(p2 => p2.language === p1.language)
    );

    if (commonLanguages.length === 0) return 70;

    // Compare proficiency levels
    const levelMap = {
      'A1': 1, 'A2': 2, 'B1': 3, 'B2': 4, 'C1': 5, 'C2': 6
    };

    let totalDiff = 0;
    commonLanguages.forEach(lang1 => {
      const lang2 = user2Progress.find(p => p.language === lang1.language);
      if (lang2) {
        const level1 = levelMap[lang1.currentLevel] || 3;
        const level2 = levelMap[lang2.currentLevel] || 3;
        totalDiff += Math.abs(level1 - level2);
      }
    });

    const avgDiff = totalDiff / commonLanguages.length;
    
    // Score decreases with level difference
    if (avgDiff === 0) return 100;
    if (avgDiff === 1) return 85;
    if (avgDiff === 2) return 70;
    if (avgDiff === 3) return 50;
    return 30;
  }

  /**
   * 5. Activity Level (5% weight)
   * Active users are better matches
   */
  calculateActivityLevel(user1, user2) {
    const user1Sessions = user1.progress?.reduce((sum, p) => 
      sum + (p.stats?.totalSessionsCompleted || 0), 0
    ) || 0;
    
    const user2Sessions = user2.progress?.reduce((sum, p) => 
      sum + (p.stats?.totalSessionsCompleted || 0), 0
    ) || 0;

    const avgSessions = (user1Sessions + user2Sessions) / 2;

    if (avgSessions >= 20) return 100;
    if (avgSessions >= 10) return 80;
    if (avgSessions >= 5) return 60;
    if (avgSessions >= 1) return 40;
    return 20; // New users
  }

  /**
   * 6. Location Bonus (5% weight)
   * Same city/country can meet in person
   */
  calculateLocationBonus(user1, user2) {
    const loc1 = user1.location || "";
    const loc2 = user2.location || "";

    if (!loc1 || !loc2) return 50;

    // Exact match
    if (loc1.toLowerCase() === loc2.toLowerCase()) {
      return 100;
    }

    // Same country (rough check)
    const country1 = loc1.split(',').pop().trim().toLowerCase();
    const country2 = loc2.split(',').pop().trim().toLowerCase();

    if (country1 === country2) {
      return 75;
    }

    return 50; // Different locations
  }

  /**
   * Generate human-readable reasons for the match
   */
  generateMatchReasons(user1, user2, scores) {
    const reasons = [];

    // Language reasons
    if (scores.languageCompatibility >= 90) {
      const native1 = user1.nativeLanguages?.[0];
      const learning1 = user1.learningLanguages?.[0];
      const native2 = user2.nativeLanguages?.[0];
      const learning2 = user2.learningLanguages?.[0];

      if (native1 && learning2 && native1 === learning2) {
        reasons.push(`You speak ${native1} natively, which ${user2.fullName} is learning`);
      }
      if (native2 && learning1 && native2 === learning1) {
        reasons.push(`${user2.fullName} speaks ${native2} natively, which you're learning`);
      }
    } else if (scores.languageCompatibility >= 40) {
      const commonLearning = (user1.learningLanguages || []).filter(lang => 
        (user2.learningLanguages || []).includes(lang)
      );
      if (commonLearning.length > 0) {
        reasons.push(`Both learning ${commonLearning.join(", ")}`);
      }
    }

    // Availability reasons
    if (scores.availabilityMatch >= 75) {
      const common = (user1.availability || []).filter(slot => 
        (user2.availability || []).includes(slot)
      );
      if (common.length > 0) {
        reasons.push(`Both available: ${common.slice(0, 2).join(", ")}`);
      }
    }

    // Goals reasons
    if (scores.goalsAlignment >= 60) {
      const commonGoals = (user1.learningGoals || []).filter(goal => 
        (user2.learningGoals || []).includes(goal)
      );
      if (commonGoals.length > 0) {
        reasons.push(`Similar goals: ${commonGoals.slice(0, 2).join(", ")}`);
      }
    }

    // Location reasons
    if (scores.locationBonus >= 75) {
      reasons.push("Located in the same area");
    }

    // Activity reasons
    if (scores.activityLevel >= 80) {
      reasons.push("Both active learners");
    }

    return reasons.slice(0, 4); // Max 4 reasons
  }

  /**
   * Find top matches for a user
   */
  async findMatches(userId, limit = 10) {
    try {
      // Get all potential candidates (exclude self and existing friends)
      const currentUser = await User.findById(userId).select("friends");
      
      if (!currentUser) {
        throw new Error("User not found");
      }

      const excludeIds = [userId, ...(currentUser.friends || [])];

      // Get all users who have completed learning profile
      const candidates = await User.find({
        _id: { $nin: excludeIds },
        isOnboarded: true,
        $or: [
          { learningLanguages: { $exists: true, $ne: [] } },
          { nativeLanguages: { $exists: true, $ne: [] } }
        ]
      }).select("_id").limit(100); // Pre-filter to reduce computation

      // Calculate compatibility with each candidate
      const matches = await Promise.all(
        candidates.map(async (candidate) => {
          const compatibility = await this.calculateCompatibility(userId, candidate._id);
          return {
            userId: candidate._id,
            ...compatibility
          };
        })
      );

      // Sort by score and return top matches
      return matches
        .filter(match => match.overallScore > 30) // Minimum threshold
        .sort((a, b) => b.overallScore - a.overallScore)
        .slice(0, limit);

    } catch (error) {
      console.error("Error finding matches:", error);
      throw error;
    }
  }
}

export default new MatchingService();