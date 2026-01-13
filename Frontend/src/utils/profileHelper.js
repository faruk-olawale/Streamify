// Frontend/src/utils/profileHelper.js

/**
 * Calculate overall profile completeness (0-100%)
 */
export function calculateProfileCompleteness(user) {
  if (!user) return 0;

  let score = 0;
  const checks = {
    hasFullName: user.fullName ? 10 : 0,
    hasBio: user.bio ? 10 : 0,
    hasLocation: user.location ? 10 : 0,
    hasProfilePic: user.profilePic ? 10 : 0,
    hasNativeLanguages: user.nativeLanguages?.length > 0 ? 15 : 0,
    hasLearningLanguages: user.learningLanguages?.length > 0 ? 15 : 0,
    hasLearningGoals: user.learningGoals?.length > 0 ? 15 : 0,
    hasAvailability: user.availability?.length > 0 ? 15 : 0,
  };

  score = Object.values(checks).reduce((sum, val) => sum + val, 0);
  
  return {
    score,
    checks,
    missingFields: Object.keys(checks).filter(key => checks[key] === 0)
  };
}

/**
 * Get required fields for matching feature
 * Returns array of missing fields with reasons
 */
export function getRequiredFieldsForMatching(user) {
  const missing = [];
  
  if (!user?.nativeLanguages || user.nativeLanguages.length === 0) {
    missing.push({ 
      field: 'Native Language', 
      reason: 'Required for language matching' 
    });
  }
  
  if (!user?.learningLanguages || user.learningLanguages.length === 0) {
    missing.push({ 
      field: 'Learning Language', 
      reason: 'Required to find practice partners' 
    });
  }
  
  if (!user?.learningGoals || user.learningGoals.length === 0) {
    missing.push({ 
      field: 'Learning Goals', 
      reason: 'Helps match you with compatible partners' 
    });
  }
  
  if (!user?.availability || user.availability.length === 0) {
    missing.push({ 
      field: 'Availability', 
      reason: 'Needed to find partners with similar schedules' 
    });
  }
  
  return missing;
}