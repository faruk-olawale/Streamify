// Backend/controllers/poll.controller.js
import Poll from "../models/Poll.model.js";

// Create Poll
export const createPoll = async (req, res) => {
  try {
    const { messageId, channelId, question, options, settings } = req.body;
    const userId = req.user._id;

    console.log('📊 Creating poll:', {
      messageId,
      channelId,
      question,
      optionsCount: options?.length,
      userId: userId.toString()
    });

    // Validate required fields
    if (!messageId || !channelId || !question || !options) {
      console.error('❌ Missing required fields');
      return res.status(400).json({ 
        success: false,
        error: "Missing required fields: messageId, channelId, question, options" 
      });
    }

    if (!Array.isArray(options) || options.length < 2) {
      console.error('❌ Invalid options array');
      return res.status(400).json({ 
        success: false,
        error: "At least 2 options are required" 
      });
    }

    // Create poll
    const poll = new Poll({
      messageId,
      channelId,
      question,
      createdBy: userId.toString(),
      options: options.map(opt => ({
        ...opt,
        votes: 0,
        voters: []
      })),
      settings: settings || { allowMultiple: false, isAnonymous: false }
    });

    await poll.save();

    console.log('✅ Poll created successfully:', poll._id);

    res.status(201).json({ 
      success: true,
      poll: poll.toObject({ virtuals: true })
    });
  } catch (error) {
    console.error("❌ Create poll error:", error);
    console.error("Error details:", error.message);
    
    // Handle duplicate messageId
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false,
        error: "A poll with this messageId already exists" 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Get Poll
export const getPoll = async (req, res) => {
  try {
    const { messageId } = req.params;

    console.log('📊 Getting poll:', messageId);

    const poll = await Poll.findOne({ messageId }).lean();

    if (!poll) {
      console.log('❌ Poll not found:', messageId);
      return res.status(404).json({ 
        success: false,
        error: "Poll not found" 
      });
    }

    // Calculate total votes
    const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);

    console.log('✅ Poll found:', { 
      id: poll._id, 
      question: poll.question,
      totalVotes 
    });

    res.json({ 
      success: true,
      poll: {
        ...poll,
        totalVotes
      }
    });
  } catch (error) {
    console.error("❌ Get poll error:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Submit Vote
export const submitVote = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { optionIds } = req.body;
    const userId = req.user._id.toString();
    const userName = req.user.fullName || req.user.name || 'User';
    const userImage = req.user.profilePic || req.user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=random`;

    console.log('📊 Vote request:', {
      messageId,
      userId,
      userName,
      optionIds
    });

    // Validate
    if (!optionIds || !Array.isArray(optionIds) || optionIds.length === 0) {
      console.error('❌ Invalid optionIds');
      return res.status(400).json({ 
        success: false,
        error: "optionIds must be a non-empty array" 
      });
    }

    // Find poll
    const poll = await Poll.findOne({ messageId });
    
    if (!poll) {
      console.log('❌ Poll not found in database for messageId:', messageId);
      return res.status(404).json({ 
        success: false,
        error: "Poll not found" 
      });
    }

    console.log('Poll found:', poll.question);

    // Check if poll is active
    if (!poll.isActive) {
      console.log('❌ Poll is closed');
      return res.status(400).json({ 
        success: false,
        error: "This poll is closed" 
      });
    }

    // Check if user already voted
    if (poll.hasUserVoted(userId)) {
      console.log('❌ User already voted');
      return res.status(400).json({ 
        success: false,
        error: "You have already voted on this poll" 
      });
    }

    // Validate option IDs
    const validOptionIds = poll.options.map(opt => opt.id);
    const invalidOptions = optionIds.filter(id => !validOptionIds.includes(id));
    if (invalidOptions.length > 0) {
      console.error('❌ Invalid option IDs:', invalidOptions);
      return res.status(400).json({ 
        success: false,
        error: "Invalid option ID(s): " + invalidOptions.join(', ') 
      });
    }

    // Check multiple choice setting
    if (!poll.settings.allowMultiple && optionIds.length > 1) {
      console.error('❌ Multiple options not allowed');
      return res.status(400).json({ 
        success: false,
        error: "This poll only allows single choice" 
      });
    }

    // Add votes
    poll.options.forEach(opt => {
      if (optionIds.includes(opt.id)) {
        opt.votes += 1;
        opt.voters.push({
          userId,
          userName,
          userImage,
          votedAt: new Date()
        });
      }
    });

    await poll.save();

    console.log('✅ Vote saved successfully');

    res.json({ 
      success: true,
      poll: poll.toObject({ virtuals: true })
    });
  } catch (error) {
    console.error("❌ Submit vote error:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Get Poll Results
export const getPollResults = async (req, res) => {
  try {
    const { messageId } = req.params;

    const poll = await Poll.findOne({ messageId }).lean();
    
    if (!poll) {
      return res.status(404).json({ 
        success: false,
        error: "Poll not found" 
      });
    }

    const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);

    const results = {
      question: poll.question,
      totalVotes,
      options: poll.options.map(opt => ({
        id: opt.id,
        text: opt.text,
        votes: opt.votes,
        percentage: totalVotes > 0 
          ? Math.round((opt.votes / totalVotes) * 100) 
          : 0,
        voters: poll.settings.isAnonymous ? [] : opt.voters
      })),
      isAnonymous: poll.settings.isAnonymous,
      allowMultiple: poll.settings.allowMultiple,
      createdAt: poll.createdAt
    };

    res.json({ 
      success: true,
      results 
    });
  } catch (error) {
    console.error("❌ Get poll results error:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Close Poll
export const closePoll = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id.toString();

    const poll = await Poll.findOne({ messageId });
    
    if (!poll) {
      return res.status(404).json({ 
        success: false,
        error: "Poll not found" 
      });
    }

    // Check if user is poll creator
    if (poll.createdBy !== userId) {
      return res.status(403).json({ 
        success: false,
        error: "Only the poll creator can close this poll" 
      });
    }

    poll.isActive = false;
    await poll.save();

    console.log('✅ Poll closed:', messageId);

    res.json({ 
      success: true,
      message: "Poll closed successfully",
      poll: poll.toObject({ virtuals: true })
    });
  } catch (error) {
    console.error("❌ Close poll error:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Get Channel Polls
export const getGroupPolls = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Note: We're using channelId since we don't have groupId reference
    const polls = await Poll.find({ channelId: groupId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await Poll.countDocuments({ channelId: groupId });

    const pollsWithVotes = polls.map(poll => ({
      ...poll,
      totalVotes: poll.options.reduce((sum, opt) => sum + opt.votes, 0)
    }));

    res.json({
      success: true,
      polls: pollsWithVotes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("❌ Get group polls error:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};