import makeWASocket, {
    useMultiFileAuthState,
    DisconnectReason
} from "@whiskeysockets/baileys";

import P from "pino";
import fs from "fs";
import path from "path";

import { askAI } from "./ai.js";
import {
    setQR,
    setConnected
} from "./index.js";

let AUTH_PATH = process.env.AUTH_PATH || "/var/data/auth";

function ensureAuthDirectory() {
    try {
        if (!fs.existsSync(AUTH_PATH)) {
            fs.mkdirSync(AUTH_PATH, {
                recursive: true
            });
            console.log(`✅ Auth directory created: ${AUTH_PATH}`);
        }
    } catch (error) {
        if (error.code === "EACCES") {
            console.warn(`⚠️  Permission denied for ${AUTH_PATH}`);
            console.warn("📁 Using /tmp/whatsapp-auth instead");
            
            AUTH_PATH = "/tmp/whatsapp-auth";
            
            try {
                if (!fs.existsSync(AUTH_PATH)) {
                    fs.mkdirSync(AUTH_PATH, { recursive: true });
                }
                console.log(`✅ Using fallback auth path: ${AUTH_PATH}`);
            } catch (fallbackError) {
                console.error("❌ Cannot create fallback auth directory");
                console.error(fallbackError);
                process.exit(1);
            }
        } else {
            console.error(`❌ Cannot create auth directory: ${AUTH_PATH}`);
            console.error(error);
            process.exit(1);
        }
    }
}

export async function startWhatsApp() {
    ensureAuthDirectory();

    console.log("🔄 Starting WhatsApp...");

    const {
        state,
        saveCreds
    } = await useMultiFileAuthState(AUTH_PATH);

    const sock = makeWASocket({
        auth: state,

        logger: P({
            level: "silent"
        }),

        markOnlineOnConnect: false
    });

    // Save WhatsApp authentication data
    sock.ev.on(
        "creds.update",
        saveCreds
    );

    // Connection updates
    sock.ev.on(
        "connection.update",
        async (update) => {
            const {
                connection,
                lastDisconnect,
                qr
            } = update;

            // New QR received
            if (qr) {
                console.log(
                    "📱 New WhatsApp QR generated."
                );

                setQR(qr);

                console.log(
                    "🌐 Open your Render URL to scan it."
                );
            }

            // Successfully connected
            if (connection === "open") {
                console.log(
                    "✅ WhatsApp connected successfully!"
                );

                setConnected(true);
            }

            // Connection closed
            if (connection === "close") {
                setConnected(false);

                const statusCode =
                    lastDisconnect?.error?.output?.statusCode;

                const shouldReconnect =
                    statusCode !== DisconnectReason.loggedOut;

                console.log(
                    `❌ WhatsApp disconnected. Code: ${statusCode}`
                );

                if (shouldReconnect) {
                    console.log(
                        "🔄 Reconnecting in 5 seconds..."
                    );

                    setTimeout(() => {
                        startWhatsApp().catch(
                            console.error
                        );
                    }, 5000);
                } else {
                    console.log(
                        "🚪 WhatsApp logged out."
                    );

                    console.log(
                        "Delete the auth folder and scan a new QR."
                    );
                }
            }
        }
    );

    // Incoming messages
    sock.ev.on(
        "messages.upsert",
        async ({ messages, type }) => {
            if (type !== "notify") {
                return;
            }

            for (const message of messages) {
                try {
                    // Ignore invalid messages
                    if (!message?.message) {
                        continue;
                    }

                    // Ignore our own messages
                    if (message.key.fromMe) {
                        continue;
                    }

                    const jid =
                        message.key.remoteJid;

                    // Ignore WhatsApp status
                    if (
                        jid ===
                        "status@broadcast"
                    ) {
                        continue;
                    }

                    // Get text
                    const text =
                        message.message.conversation ||
                        message.message.extendedTextMessage?.text;

                    if (!text?.trim()) {
                        continue;
                    }

                    console.log(
                        `📩 Message from ${jid}: ${text}`
                    );

                    // Ask Gemini
                    const reply =
                        await askAI(text);

                    // Send AI response
                    await sock.sendMessage(
                        jid,
                        {
                            text: reply
                        }
                    );

                    console.log(
                        "🤖 AI response sent."
                    );

                } catch (error) {
                    console.error(
                        "❌ Message handling error:",
                        error
                    );
                }
            }
        }
    );
                    }
                    
