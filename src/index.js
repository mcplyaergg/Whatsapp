import { makeWASocket, DisconnectReason, useMultiFileAuthState } from 'baileys';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import { handleMessage } from './whatsapp.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logger = pino({ transport: { target: 'pino-pretty' } });

// Determine auth path from environment or use default
const AUTH_PATH = process.env.AUTH_PATH || path.join(__dirname, '..', 'auth');

// Ensure auth directory exists with proper error handling
const ensureAuthDir = () => {
  try {
    if (!fs.existsSync(AUTH_PATH)) {
      fs.mkdirSync(AUTH_PATH, { recursive: true, mode: 0o755 });
      logger.info(`Created auth directory at ${AUTH_PATH}`);
    }
  } catch (err) {
    if (err.code === 'EACCES') {
      logger.warn(`Permission denied for ${AUTH_PATH}, using temp directory`);
      process.env.AUTH_PATH = '/tmp/whatsapp-auth';
      if (!fs.existsSync('/tmp/whatsapp-auth')) {
        fs.mkdirSync('/tmp/whatsapp-auth', { recursive: true });
      }
      return '/tmp/whatsapp-auth';
    }
    throw err;
  }
  return AUTH_PATH;
};

const finalAuthPath = ensureAuthDir();

const connectToWhatsApp = async () => {
  try {
    const { state, saveCreds } = await useMultiFileAuthState(finalAuthPath);

    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: true,
      logger: pino({ level: 'silent' }),
      markOnlineOnConnect: true,
      syncFullHistory: false,
      shouldIgnoreJid: (jid) => false,
    });

    // Handle connection updates
    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr, isOnline } = update;

      if (qr) {
        logger.info('📱 Scan this QR code to login to WhatsApp');
        qrcode.generate(qr, { small: true });
      }

      if (connection === 'open') {
        logger.info('✅ WhatsApp connection established successfully!');
      }

      if (connection === 'close') {
        if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
          logger.warn('❌ Connection lost, reconnecting...');
          setTimeout(() => {
            connectToWhatsApp();
          }, 3000);
        } else {
          logger.error('❌ Device logged out. Please scan QR code again.');
          process.exit(1);
        }
      }

      if (isOnline !== undefined) {
        logger.info(`Connection status: ${isOnline ? 'Online' : 'Offline'}`);
      }
    });

    // Save credentials on update
    sock.ev.on('creds.update', saveCreds);

    // Handle incoming messages
    sock.ev.on('messages.upsert', async (m) => {
      await handleMessage(m, sock, logger);
    });

    // Handle connection errors
    sock.ev.on('connection.error', (error) => {
      logger.error('Connection error:', error);
    });

    logger.info('🤖 WhatsApp AI Bot initialized');
  } catch (err) {
    logger.error('Failed to connect:', err);
    setTimeout(() => {
      connectToWhatsApp();
    }, 5000);
  }
};

// Start the bot
logger.info('🚀 Starting WhatsApp AI Bot...');
connectToWhatsApp();

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Shutting down...');
  process.exit(0);
});
