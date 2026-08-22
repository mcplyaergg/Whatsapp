import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error('❌ GEMINI_API_KEY environment variable is not set. Please configure it.');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

const generateAIResponse = async (userMessage) => {
  try {
    // Validate input
    if (!userMessage || typeof userMessage !== 'string' || userMessage.trim().length === 0) {
      return 'Please send a valid message.';
    }

    // Truncate very long messages
    const cleanMessage = userMessage.trim().substring(0, 2000);

    // Generate response using Gemini
    const result = await model.generateContent(cleanMessage);
    const response = result.response.text();

    // Validate response
    if (!response || response.trim().length === 0) {
      return 'I could not generate a response. Please try again.';
    }

    // Truncate response if too long for WhatsApp (4096 chars)
    return response.substring(0, 4096);
  } catch (error) {
    // Handle specific API errors
    if (error.message.includes('API key')) {
      throw new Error('Invalid or expired API key. Please check your GEMINI_API_KEY.');
    }
    if (error.message.includes('429') || error.message.includes('rate limit')) {
      throw new Error('API rate limit exceeded. Please wait a moment and try again.');
    }
    if (error.message.includes('blocked')) {
      return 'I cannot process that request. Please try a different message.';
    }

    // Generic error handling
    throw new Error(`AI Error: ${error.message}`);
  }
};

export { generateAIResponse };
