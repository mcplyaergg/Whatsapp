import { generateAIResponse } from './ai.js';

const handleMessage = async (m, sock, logger) => {
  try {
    // Skip if no messages
    if (!m.messages || m.messages.length === 0) return;

    const msg = m.messages[0];

    // Skip if message is from bot or status updates
    if (msg.key.fromMe || msg.key.remoteJid === 'status@broadcast') {
      return;
    }

    // Extract message text
    const text = msg.message?.conversation ||
                 msg.message?.extendedTextMessage?.text ||
                 msg.message?.imageMessage?.caption ||
                 msg.message?.videoMessage?.caption;

    // Skip if no text content
    if (!text) {
      return;
    }

    const chatId = msg.key.remoteJid;
    const senderId = msg.key.participant || msg.key.remoteJid;
    const displayName = msg.pushName || 'User';

    logger.info(`📨 Message from ${displayName}: "${text.substring(0, 50)}..."`);

    // Show typing indicator
    await sock.sendPresenceUpdate('typing', chatId).catch((err) => {
      logger.warn('Failed to send typing indicator:', err.message);
    });

    try {
      // Generate AI response
      const response = await generateAIResponse(text);

      // Send response
      await sock.sendMessage(chatId, { text: response }).catch((err) => {
        logger.error('Failed to send message:', err.message);
      });

      logger.info(`✉️  Response sent to ${displayName}`);
    } catch (aiError) {
      logger.error('AI Error:', aiError.message);
      const errorMessage = 'Sorry, I encountered an error processing your message. Please try again.';
      await sock.sendMessage(chatId, { text: errorMessage }).catch((err) => {
        logger.error('Failed to send error message:', err.message);
      });
    }
  } catch (err) {
    logger.error('Error handling message:', err.message);
  }
};

export { handleMessage };
