// Backend/services/groq.service.js
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});



// AI Chatbot - Practice conversation partner
export const chatWithAI = async (messages, userLanguage = 'English', targetLanguage = 'English', level = 'beginner') => {
  try {
    const systemPrompt = `You are a friendly and patient language learning partner helping someone learn ${targetLanguage}. 
    
Your role:
- Have natural, engaging conversations at a ${level} level
- Gently correct mistakes in a supportive, encouraging way
- Ask follow-up questions to keep the conversation flowing
- Adapt your vocabulary and grammar to match the learner's level
- Be enthusiastic and motivating
- When correcting, use this format: "Great try! Small correction: [correct version]. [Brief explanation]"
- Use simple, clear language
- Occasionally introduce new vocabulary in context
- Make learning fun and stress-free

Keep responses conversational and friendly, around 2-3 sentences unless explaining something. Always be encouraging!`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile", // Fast and capable
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    return {
      message: completion.choices[0].message.content,
      usage: completion.usage
    };
  } catch (error) {
    console.error('❌ Groq chat error:', error);
    throw new Error('Failed to get AI response: ' + error.message);
  }
};

// Grammar Correction
export const correctGrammar = async (text, targetLanguage = 'English') => {
  try {
    const prompt = `You are a helpful grammar assistant for ${targetLanguage} learners.

Analyze this text and provide corrections:
"${text}"

Respond ONLY with valid JSON in this EXACT format (no markdown, no backticks):
{
  "hasMistakes": true,
  "correctedText": "The corrected version here",
  "mistakes": [
    {
      "original": "incorrect phrase",
      "correction": "correct phrase",
      "explanation": "brief friendly explanation",
      "type": "grammar"
    }
  ],
  "overallFeedback": "Brief encouraging feedback (1 sentence)"
}

If there are no mistakes, respond with:
{
  "hasMistakes": false,
  "correctedText": "${text}",
  "mistakes": [],
  "overallFeedback": "Perfect! No errors found."
}

Remember: Respond ONLY with JSON, no other text.`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: 'user', content: prompt }
      ],
      max_tokens: 1000,
      temperature: 0.3, // Lower for consistency
    });

    const responseText = completion.choices[0].message.content.trim();
    
    // Remove markdown code blocks if present
    const cleanedResponse = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    const result = JSON.parse(cleanedResponse);
    return result;
  } catch (error) {
    console.error('❌ Grammar correction error:', error);
    throw new Error('Failed to check grammar: ' + error.message);
  }
};

// Conversation Topic Suggestions
export const generateTopicSuggestions = async (userContext = {}) => {
  try {
    const { 
      interests = [], 
      level = 'beginner', 
      nativeLanguage = 'English',
      targetLanguage = 'English',
      recentTopics = [] 
    } = userContext;

    const prompt = `Generate 5 engaging conversation topics for someone learning ${targetLanguage}.

User context:
- Learning level: ${level}
- Native language: ${nativeLanguage}
- Interests: ${interests.join(', ') || 'general conversation'}
${recentTopics.length > 0 ? `- Topics to avoid (already discussed): ${recentTopics.join(', ')}` : ''}

Requirements:
- Topics should match ${level} level (simple vocabulary and grammar)
- Make topics fun, relatable, and engaging
- Include a mix of: daily life, culture, hobbies, and fun questions
- Each topic should be easy to start a conversation about
- Avoid sensitive/controversial topics

Respond ONLY with valid JSON in this EXACT format (no markdown, no backticks):
{
  "topics": [
    {
      "title": "Short catchy title (3-5 words)",
      "description": "One sentence about this topic",
      "difficulty": "easy",
      "category": "daily-life",
      "starterQuestions": [
        "Question 1?",
        "Question 2?",
        "Question 3?"
      ]
    }
  ]
}

Categories: daily-life, hobbies, culture, food, travel, entertainment, technology
Difficulty: easy, medium, hard (match to ${level})`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: 'user', content: prompt }
      ],
      max_tokens: 1500,
      temperature: 0.8, // Higher for creativity
    });

    const responseText = completion.choices[0].message.content.trim();
    
    // Remove markdown code blocks if present
    const cleanedResponse = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    const result = JSON.parse(cleanedResponse);
    return result.topics;
  } catch (error) {
    console.error('❌ Topic generation error:', error);
    throw new Error('Failed to generate topics: ' + error.message);
  }
};

// Translate Text
export const translateText = async (text, fromLang, toLang) => {
  try {
    const prompt = `Translate this text from ${fromLang} to ${toLang}:

"${text}"

Provide ONLY the translation, no explanations or extra text.`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: 'user', content: prompt }
      ],
      max_tokens: 500,
      temperature: 0.3,
    });

    return {
      translation: completion.choices[0].message.content.trim()
    };
  } catch (error) {
    console.error('❌ Translation error:', error);
    throw new Error('Failed to translate: ' + error.message);
  }
};

// Assess Language Level (for onboarding)
export const assessLanguageLevel = async (conversationHistory) => {
  try {
    const prompt = `You are a language assessment expert. Based on this conversation, assess the user's language level.

Conversation:
${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

Analyze their:
- Grammar accuracy
- Vocabulary range
- Sentence complexity
- Fluency

Respond ONLY with valid JSON (no markdown, no backticks):
{
  "level": "beginner|intermediate|advanced",
  "score": 0-100,
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["area 1", "area 2"],
  "reasoning": "Brief explanation (2 sentences)"
}`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: 'user', content: prompt }
      ],
      max_tokens: 800,
      temperature: 0.4,
    });

    const responseText = completion.choices[0].message.content.trim();
    const cleanedResponse = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    return JSON.parse(cleanedResponse);
  } catch (error) {
    console.error('❌ Level assessment error:', error);
    throw new Error('Failed to assess level: ' + error.message);
  }
};

export default {
  chatWithAI,
  correctGrammar,
  generateTopicSuggestions,
  translateText,
  assessLanguageLevel
};