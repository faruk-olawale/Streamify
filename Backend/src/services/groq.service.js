// Backend/services/groq.service.js
import Groq from "groq-sdk";

// ==================== CONFIGURATION ====================

const CONFIG = {
  MODEL: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
  MAX_TOKENS: {
    CHAT: 800,
    GRAMMAR: 1200,
    TOPICS: 1500,
    TRANSLATION: 600,
    ASSESSMENT: 1000
  },
  TEMPERATURE: {
    CHAT: 0.7,
    GRAMMAR: 0.3,
    TOPICS: 0.8,
    TRANSLATION: 0.3,
    ASSESSMENT: 0.4
  },
  RETRY: {
    MAX_ATTEMPTS: 3,
    DELAY_MS: 1000
  }
};

// ==================== GROQ CLIENT ====================

class GroqService {
  constructor() {
    this.client = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });
  }

  // ==================== HELPER METHODS ====================

  /**
   * Clean messages by removing non-standard properties
   */
  cleanMessages(messages) {
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }

  /**
   * Parse JSON response with fallback
   */
  parseJSON(text, fallback = null) {
    try {
      // Remove markdown code blocks
      const cleaned = text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      return JSON.parse(cleaned);
    } catch (error) {
      console.error('❌ JSON parse error:', error);
      return fallback;
    }
  }

  /**
   * Retry logic for API calls
   */
  async retry(fn, attempts = CONFIG.RETRY.MAX_ATTEMPTS) {
    for (let i = 0; i < attempts; i++) {
      try {
        return await fn();
      } catch (error) {
        const isLastAttempt = i === attempts - 1;
        
        if (isLastAttempt) {
          throw error;
        }

        // Exponential backoff
        const delay = CONFIG.RETRY.DELAY_MS * Math.pow(2, i);
        console.log(`⚠️ Retry attempt ${i + 1}/${attempts} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * Make API call with error handling
   */
  async makeCompletion(messages, options = {}) {
    const {
      model = CONFIG.MODEL,
      maxTokens = CONFIG.MAX_TOKENS.CHAT,
      temperature = CONFIG.TEMPERATURE.CHAT
    } = options;

    return await this.retry(async () => {
      const completion = await this.client.chat.completions.create({
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
        stream: false
      });

      return {
        content: completion.choices[0].message.content,
        usage: completion.usage,
        model: completion.model
      };
    });
  }

  // ==================== SYSTEM PROMPTS ====================

  getChatSystemPrompt(targetLanguage, level) {
    return `You are an expert language learning partner specializing in ${targetLanguage}.

ROLE & EXPERTISE:
- Certified language instructor with 10+ years experience
- Expert in ${level}-level pedagogy
- Specializes in conversational fluency and practical communication

TEACHING APPROACH:
- Engage naturally while gently correcting mistakes
- Adapt complexity to ${level} level vocabulary and grammar
- Provide corrections in this format: "Good try! → [correct version]. Why: [brief reason]"
- Build confidence through positive reinforcement
- Introduce new vocabulary contextually (1-2 words per exchange)
- Ask follow-up questions to maintain conversation flow

RESPONSE STYLE:
- Conversational and encouraging (2-4 sentences typical)
- Clear, simple language appropriate for ${level} learners
- Patient and supportive, never condescending
- Focus on practical, real-world communication

Remember: Your goal is to make learning enjoyable and effective!`;
  }

  getGrammarPrompt(text, targetLanguage) {
    return `You are an expert ${targetLanguage} grammar instructor.

TASK: Analyze this text for grammar, spelling, and punctuation errors:
"${text}"

ANALYSIS REQUIREMENTS:
- Identify ALL errors (grammar, spelling, punctuation, word choice)
- Provide clear, beginner-friendly explanations
- Categorize each error accurately
- Give encouraging overall feedback

OUTPUT FORMAT (JSON only, no markdown):
{
  "hasMistakes": boolean,
  "correctedText": "fully corrected version",
  "mistakes": [
    {
      "original": "exact error",
      "correction": "exact fix",
      "explanation": "why this is wrong and how to fix it (1-2 sentences)",
      "type": "grammar|spelling|punctuation|word-choice"
    }
  ],
  "overallFeedback": "encouraging comment (1 sentence)",
  "confidenceScore": 0-100
}

If no mistakes: {"hasMistakes": false, "correctedText": "${text}", "mistakes": [], "overallFeedback": "Perfect! No errors found.", "confidenceScore": 100}`;
  }

  getTopicsPrompt(context) {
    const { 
      level = 'beginner', 
      nativeLanguage = 'English',
      targetLanguage = 'English',
      interests = [],
      recentTopics = []
    } = context;

    return `You are an expert conversation topic curator for language learners.

LEARNER PROFILE:
- Learning: ${targetLanguage}
- Native: ${nativeLanguage}
- Level: ${level}
- Interests: ${interests.join(', ') || 'general'}
${recentTopics.length > 0 ? `- Avoid these (recently used): ${recentTopics.join(', ')}` : ''}

REQUIREMENTS:
- Generate 5 diverse, engaging topics
- Match ${level} complexity (vocabulary, grammar, concepts)
- Include mix of categories: daily-life, culture, hobbies, food, travel, current-events
- Make topics relatable and conversation-friendly
- Provide 3 starter questions per topic (open-ended, thought-provoking)
- Avoid controversial, sensitive, or complex topics

OUTPUT FORMAT (JSON only, no markdown):
{
  "topics": [
    {
      "title": "Catchy title (3-6 words)",
      "description": "What makes this topic interesting (1 sentence)",
      "difficulty": "easy|medium|hard",
      "category": "daily-life|culture|hobbies|food|travel|entertainment|technology|nature|sports",
      "starterQuestions": [
        "Open-ended question 1?",
        "Open-ended question 2?",
        "Open-ended question 3?"
      ],
      "vocabularyPreview": ["word1", "word2", "word3"]
    }
  ]
}`;
  }

  // ==================== PUBLIC METHODS ====================

  /**
   * AI Chat - Conversational language practice
   */
  async chat(messages, options = {}) {
    try {
      const {
        targetLanguage = 'English',
        nativeLanguage = 'English',
        level = 'beginner'
      } = options;

      console.log('🤖 AI Chat:', {
        messageCount: messages.length,
        targetLanguage,
        level
      });

      // Clean and validate messages
      const cleanedMessages = this.cleanMessages(messages);
      
      if (cleanedMessages.length === 0) {
        throw new Error('No messages provided');
      }

      // Build conversation
      const systemPrompt = this.getChatSystemPrompt(targetLanguage, level);
      const conversationMessages = [
        { role: 'system', content: systemPrompt },
        ...cleanedMessages
      ];

      // Make API call
      const response = await this.makeCompletion(conversationMessages, {
        maxTokens: CONFIG.MAX_TOKENS.CHAT,
        temperature: CONFIG.TEMPERATURE.CHAT
      });

      console.log('✅ AI response generated:', {
        length: response.content.length,
        tokens: response.usage.total_tokens
      });

      return {
        success: true,
        message: response.content,
        usage: response.usage,
        metadata: {
          model: response.model,
          language: targetLanguage,
          level
        }
      };

    } catch (error) {
      console.error('❌ Chat error:', error.message);
      throw new Error(`AI chat failed: ${error.message}`);
    }
  }

  /**
   * Grammar Check - Analyze and correct text
   */
  async checkGrammar(text, targetLanguage = 'English') {
    try {
      console.log('✍️ Grammar check:', {
        textLength: text.length,
        language: targetLanguage
      });

      // Validate input
      if (!text || text.trim().length === 0) {
        throw new Error('No text provided');
      }

      if (text.length > 1000) {
        throw new Error('Text too long (max 1000 characters)');
      }

      // Build prompt
      const prompt = this.getGrammarPrompt(text, targetLanguage);

      // Make API call
      const response = await this.makeCompletion(
        [{ role: 'user', content: prompt }],
        {
          maxTokens: CONFIG.MAX_TOKENS.GRAMMAR,
          temperature: CONFIG.TEMPERATURE.GRAMMAR
        }
      );

      // Parse JSON response
      const result = this.parseJSON(response.content, {
        hasMistakes: false,
        correctedText: text,
        mistakes: [],
        overallFeedback: 'Could not analyze text. Please try again.',
        confidenceScore: 0
      });

      console.log('✅ Grammar check complete:', {
        hasMistakes: result.hasMistakes,
        mistakeCount: result.mistakes?.length || 0
      });

      return {
        success: true,
        ...result
      };

    } catch (error) {
      console.error('❌ Grammar check error:', error.message);
      throw new Error(`Grammar check failed: ${error.message}`);
    }
  }

  /**
   * Topic Suggestions - Generate conversation topics
   */
  async generateTopics(context = {}) {
    try {
      console.log('💡 Topic generation:', context);

      // Build prompt
      const prompt = this.getTopicsPrompt(context);

      // Make API call
      const response = await this.makeCompletion(
        [{ role: 'user', content: prompt }],
        {
          maxTokens: CONFIG.MAX_TOKENS.TOPICS,
          temperature: CONFIG.TEMPERATURE.TOPICS
        }
      );

      // Parse JSON response
      const result = this.parseJSON(response.content, { topics: [] });

      console.log('✅ Topics generated:', {
        count: result.topics?.length || 0
      });

      return {
        success: true,
        topics: result.topics || [],
        metadata: {
          level: context.level,
          language: context.targetLanguage
        }
      };

    } catch (error) {
      console.error('❌ Topic generation error:', error.message);
      throw new Error(`Topic generation failed: ${error.message}`);
    }
  }

  /**
   * Translation - Translate text between languages
   */
  async translate(text, fromLang, toLang) {
    try {
      console.log('🌐 Translation:', {
        from: fromLang,
        to: toLang,
        length: text.length
      });

      // Validate input
      if (!text || !fromLang || !toLang) {
        throw new Error('Missing required parameters');
      }

      const prompt = `Translate this ${fromLang} text to ${toLang}. Provide ONLY the translation, no explanations:

"${text}"`;

      // Make API call
      const response = await this.makeCompletion(
        [{ role: 'user', content: prompt }],
        {
          maxTokens: CONFIG.MAX_TOKENS.TRANSLATION,
          temperature: CONFIG.TEMPERATURE.TRANSLATION
        }
      );

      console.log('✅ Translation complete');

      return {
        success: true,
        translation: response.content.trim(),
        metadata: {
          from: fromLang,
          to: toLang,
          originalLength: text.length,
          translatedLength: response.content.length
        }
      };

    } catch (error) {
      console.error('❌ Translation error:', error.message);
      throw new Error(`Translation failed: ${error.message}`);
    }
  }

  /**
   * Level Assessment - Evaluate language proficiency
   */
  async assessLevel(conversationHistory) {
    try {
      console.log('📊 Level assessment:', {
        messageCount: conversationHistory.length
      });

      // Validate input
      if (!conversationHistory || conversationHistory.length < 2) {
        throw new Error('Need at least 2 messages for assessment');
      }

      // Clean messages
      const cleanedHistory = this.cleanMessages(conversationHistory);

      const prompt = `You are a language assessment expert. Analyze this conversation and assess the user's proficiency.

CONVERSATION:
${cleanedHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n\n')}

ASSESSMENT CRITERIA:
- Grammar accuracy and complexity
- Vocabulary range and appropriateness
- Sentence structure variety
- Fluency and coherence
- Error patterns

OUTPUT FORMAT (JSON only):
{
  "level": "beginner|intermediate|advanced",
  "score": 0-100,
  "strengths": ["specific strength 1", "specific strength 2", "specific strength 3"],
  "improvements": ["specific area 1", "specific area 2"],
  "reasoning": "Brief, specific explanation (2-3 sentences)",
  "recommendedFocus": ["grammar point 1", "grammar point 2"]
}`;

      // Make API call
      const response = await this.makeCompletion(
        [{ role: 'user', content: prompt }],
        {
          maxTokens: CONFIG.MAX_TOKENS.ASSESSMENT,
          temperature: CONFIG.TEMPERATURE.ASSESSMENT
        }
      );

      // Parse JSON response
      const result = this.parseJSON(response.content, {
        level: 'beginner',
        score: 0,
        strengths: [],
        improvements: [],
        reasoning: 'Could not assess level',
        recommendedFocus: []
      });

      console.log('✅ Level assessed:', {
        level: result.level,
        score: result.score
      });

      return {
        success: true,
        ...result
      };

    } catch (error) {
      console.error('❌ Assessment error:', error.message);
      throw new Error(`Level assessment failed: ${error.message}`);
    }
  }
}

// ==================== SINGLETON EXPORT ====================

const groqService = new GroqService();

export const chatWithAI = (messages, targetLanguage, nativeLanguage, level) => 
  groqService.chat(messages, { targetLanguage, nativeLanguage, level });

export const correctGrammar = (text, targetLanguage) => 
  groqService.checkGrammar(text, targetLanguage);

export const generateTopicSuggestions = (userContext) => 
  groqService.generateTopics(userContext);

export const translateText = (text, fromLang, toLang) => 
  groqService.translate(text, fromLang, toLang);

export const assessLanguageLevel = (conversationHistory) => 
  groqService.assessLevel(conversationHistory);

export default groqService;