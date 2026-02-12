// Backend/routes/ai.route.js
import express from 'express';
import { 
  chat, 
  checkGrammar, 
  getTopicSuggestions, 
  translate,
  assessLevel 
} from '../controllers/ai.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = express.Router();

// All AI routes require authentication
router.use(protectRoute);

// AI Chatbot
router.post('/chat', chat);

// Grammar correction
router.post('/grammar', checkGrammar);

// Topic suggestions
router.post('/topics', getTopicSuggestions);

// Translation
router.post('/translate', translate);

// Level assessment
router.post('/assess-level', assessLevel);

export default router;