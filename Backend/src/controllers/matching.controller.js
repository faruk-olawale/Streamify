// Backend/src/controllers/matching.controller.js
import matchingService from "../services/matchingService.js";
import User from "../models/User.js";

/**
 * Get recommended practice partners for the current user
 */
export async function getRecommendedPartners(req, res) {
  try {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit) || 10;

    console.log(`Finding matches for user ${userId}`);

    const matches = await matchingService.findMatches(userId, limit);

    // Populate full user data for matches
    const matchesWithUserData = await Promise.all(
      matches.map(async (match) => {
        const user = await User.findById(match.userId).select(
          "fullName profilePic bio nativeLanguages learningLanguages location learningGoals availability"
        );

        return {
          ...match,
          user: user
        };
      })
    );

    res.status(200).json({
      success: true,
      count: matchesWithUserData.length,
      matches: matchesWithUserData
    });

  } catch (error) {
    console.error("Error in getRecommendedPartners:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to find practice partners" 
    });
  }
}

/**
 * Calculate compatibility with a specific user
 */
export async function calculateCompatibilityWithUser(req, res) {
  try {
    const userId = req.user._id;
    const { targetUserId } = req.params;

    if (userId.toString() === targetUserId) {
      return res.status(400).json({
        success: false,
        message: "Cannot calculate compatibility with yourself"
      });
    }

    const compatibility = await matchingService.calculateCompatibility(
      userId, 
      targetUserId
    );

    res.status(200).json({
      success: true,
      compatibility
    });

  } catch (error) {
    console.error("Error in calculateCompatibilityWithUser:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to calculate compatibility" 
    });
  }
}

/**
 * Get match explanation (why these users are compatible)
 */
export async function getMatchExplanation(req, res) {
  try {
    const userId = req.user._id;
    const { targetUserId } = req.params;

    const compatibility = await matchingService.calculateCompatibility(
      userId, 
      targetUserId
    );

    const targetUser = await User.findById(targetUserId).select(
      "fullName profilePic nativeLanguages learningLanguages"
    );

    res.status(200).json({
      success: true,
      match: {
        user: targetUser,
        score: compatibility.overallScore,
        reasons: compatibility.reasons,
        breakdown: compatibility.scoreBreakdown
      }
    });

  } catch (error) {
    console.error("Error in getMatchExplanation:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to get match explanation" 
    });
  }
}

/**
 * Refresh match recommendations (recalculate)
 */
export async function refreshMatches(req, res) {
  try {
    const userId = req.user._id;
    
    // Find fresh matches
    const matches = await matchingService.findMatches(userId, 20);

    res.status(200).json({
      success: true,
      message: "Matches refreshed successfully",
      count: matches.length
    });

  } catch (error) {
    console.error("Error in refreshMatches:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to refresh matches" 
    });
  }
}