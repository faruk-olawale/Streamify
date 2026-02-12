// Frontend/src/lib/ai-api.js
import { axiosInstance } from './axios'; // Fixed import - using named export

// AI Chatbot
export const sendAIMessage = async (messages, targetLanguage = 'English', level = 'beginner') => {
  const response = await axiosInstance.post('/ai/chat', {
    messages,
    targetLanguage,
    level
  });
  return response.data;
};

// Grammar Check
export const checkGrammar = async (text, targetLanguage = 'English') => {
  const response = await axiosInstance.post('/ai/grammar', {
    text,
    targetLanguage
  });
  return response.data;
};

// Get Topic Suggestions
export const getTopicSuggestions = async (recentTopics = []) => {
  const response = await axiosInstance.post('/ai/topics', {
    recentTopics
  });
  return response.data;
};

// Translate Text
export const translateText = async (text, fromLang, toLang) => {
  const response = await axiosInstance.post('/ai/translate', {
    text,
    fromLang,
    toLang
  });
  return response.data;
};

// Assess Language Level
export const assessLevel = async (conversationHistory) => {
  const response = await axiosInstance.post('/ai/assess-level', {
    conversationHistory
  });
  return response.data;
};

export default {
  sendAIMessage,
  checkGrammar,
  getTopicSuggestions,
  translateText,
  assessLevel
};