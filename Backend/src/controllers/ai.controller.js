// Backend/controllers/ai.controller.js
import {
  chatWithAI,
  correctGrammar,
  generateTopicSuggestions,
  translateText,
  assessLanguageLevel
} from '../services/groq.service.js';

// AI Chatbot endpoint
export const chat = async (req, res) => {
  try {
    const { messages, targetLanguage, level } = req.body;
    const userId = req.user._id;

    console.log('🤖 AI Chat request:', { userId, messageCount: messages?.length });

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Messages array is required' 
      });
    }

    const result = await chatWithAI(
      messages, 
      'English', // Can be dynamic based on user profile
      targetLanguage || 'English',
      level || 'beginner'
    );

    console.log('✅ AI response generated');

    res.json({ 
      success: true, 
      message: result.message,
      usage: result.usage 
    });
  } catch (error) {
    console.error('❌ AI chat error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to get AI response' 
    });
  }
};

// Grammar correction endpoint
export const checkGrammar = async (req, res) => {
  try {
    const { text, targetLanguage } = req.body;
    const userId = req.user._id;

    console.log('✍️ Grammar check request:', { userId, textLength: text?.length });

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Text is required' 
      });
    }

    if (text.length > 1000) {
      return res.status(400).json({ 
        success: false, 
        error: 'Text too long (max 1000 characters)' 
      });
    }

    const result = await correctGrammar(text, targetLanguage || 'English');

    console.log('✅ Grammar check complete:', { 
      hasMistakes: result.hasMistakes,
      mistakeCount: result.mistakes?.length 
    });

    res.json({ 
      success: true, 
      ...result 
    });
  } catch (error) {
    console.error('❌ Grammar check error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to check grammar' 
    });
  }
};

// Topic suggestions endpoint
export const getTopicSuggestions = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = req.user; // Assuming user is attached from auth middleware

    console.log('💡 Topic suggestions request:', { userId });

    const userContext = {
      interests: user.interests || [],
      level: user.languageLevel || 'beginner',
      nativeLanguage: user.nativeLanguages?.[0] || 'English',
      targetLanguage: user.learningLanguages?.[0] || 'English',
      recentTopics: req.body.recentTopics || []
    };

    const topics = await generateTopicSuggestions(userContext);

    console.log('✅ Generated topics:', topics.length);

    res.json({ 
      success: true, 
      topics 
    });
  } catch (error) {
    console.error('❌ Topic generation error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to generate topics' 
    });
  }
};

// Translation endpoint
export const translate = async (req, res) => {
  try {
    const { text, fromLang, toLang } = req.body;
    const userId = req.user._id;

    console.log('🌐 Translation request:', { userId, fromLang, toLang });

    if (!text || !fromLang || !toLang) {
      return res.status(400).json({ 
        success: false, 
        error: 'Text, fromLang, and toLang are required' 
      });
    }

    const result = await translateText(text, fromLang, toLang);

    console.log('✅ Translation complete');

    res.json({ 
      success: true, 
      ...result 
    });
  } catch (error) {
    console.error('❌ Translation error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to translate' 
    });
  }
};

// Level assessment endpoint
export const assessLevel = async (req, res) => {
  try {
    const { conversationHistory } = req.body;
    const userId = req.user._id;

    console.log('📊 Level assessment request:', { 
      userId, 
      messageCount: conversationHistory?.length 
    });

    if (!conversationHistory || !Array.isArray(conversationHistory)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Conversation history is required' 
      });
    }

    const assessment = await assessLanguageLevel(conversationHistory);

    console.log('✅ Level assessed:', assessment.level);

    res.json({ 
      success: true, 
      ...assessment 
    });
  } catch (error) {
    console.error('❌ Level assessment error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to assess level' 
    });
  }
};

export default {
  chat,
  checkGrammar,
  getTopicSuggestions,
  translate,
  assessLevel
};