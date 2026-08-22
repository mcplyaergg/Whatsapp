import makeWASocket, {
    useMultiFileAuthState,
    DisconnectReason
} from "@whiskeysockets/baileys";

import P from "pino";
import fs from "fs";

import { askAI } from "./ai.js";

import {
    setQR,
    setConnected
} from "./index.js";

// ======================================
// AUTH PATH
// ======================================

const AUTH_PATH =
    process.env.AUTH_PATH ||
    "/var/data/auth";

function ensureAuthDirectory() {
    try {
        if (!fs.existsSync(AUTH_PATH)) {
            fs.mkdirSync(
                AUTH_PATH,
                {
                    recursive: true
                }
            );

            console.log(
                `✅ Auth directory created: ${AUTH_PATH}`
            );
        }

        console.log(
            `📁 WhatsApp auth path: ${AUTH_PATH}`
        );

    } catch (error) {
        console.error(
            "❌ Cannot create auth directory."
        );

        console.error(error);

        throw error;
    }
}

// ======================================
// START WHATSAPP
// ======================================

export async function startWhatsApp() {

    ensureAuthDirectory();

    console.log(
        "🔄 Starting WhatsApp..."
    );

    try {

        const {
            state,
            saveCreds
        } = await useMultiFileAuthState(
            AUTH_PATH
        );

        const sock = makeWASocket({

            auth: state,

            logger: P({
                level: "silent"
            }),

            markOnlineOnConnect: false,

            syncFullHistory: false,

            generateHighQualityLinkPreview: false
        });

        // ==================================
        // SAVE CREDENTIALS
        // ==================================

        sock.ev.on(
            "creds.update",
            saveCreds
        );

        // ==================================
        // CONNECTION UPDATE
        // ==================================

        sock.ev.on(
            "connection.update",
            async (update) => {

                const {
                    connection,
                    lastDisconnect,
                    qr
                } = update;

                // ------------------------------
                // QR
                // ------------------------------

                if (qr) {

                    console.log(
                        "📱 New WhatsApp QR generated."
                    );

                    setQR(qr);

                    console.log(
                        "🌐 Open your Render URL and scan the QR."
                    );
                }

                // ------------------------------
                // CONNECTED
                // ------------------------------

                if (
                    connection === "open"
                ) {

                    console.log(
                        "===================================="
                    );

                    console.log(
                        "✅ WHATSAPP CONNECTED!"
                    );

                    console.log(
                        "🤖 AI BOT IS READY!"
                    );

                    console.log(
                        "🎯 Trigger: ai"
                    );

                    console.log(
                        "===================================="
                    );

                    setConnected(true);
                }

                // ------------------------------
                // CLOSED
                // ------------------------------

                if (
                    connection === "close"
                ) {

                    setConnected(false);

                    const statusCode =
                        lastDisconnect
                            ?.error
                            ?.output
                            ?.statusCode;

                    const loggedOut =
                        statusCode ===
                        DisconnectReason.loggedOut;

                    console.log(
                        `❌ WhatsApp disconnected. Code: ${statusCode}`
                    );

                    // --------------------------
                    // LOGGED OUT
                    // --------------------------

                    if (loggedOut) {

                        console.log(
                            "🚪 WhatsApp logged out."
                        );

                        console.log(
                            "🗑️ Delete the auth folder and scan a new QR."
                        );

                        return;
                    }

                    // --------------------------
                    // RECONNECT
                    // --------------------------

                    console.log(
                        "🔄 Reconnecting in 5 seconds..."
                    );

                    setTimeout(
                        () => {

                            startWhatsApp()
                                .catch(
                                    (error) => {
                                        console.error(
                                            "❌ Reconnect error:",
                                            error
                                        );
                                    }
                                );

                        },
                        5000
                    );
                }
            }
        );

        // ==================================
        // INCOMING MESSAGES
        // ==================================

        sock.ev.on(
            "messages.upsert",
            async ({
                messages,
                type
            }) => {

                // Only process new messages
                if (
                    type !== "notify"
                ) {
                    return;
                }

                for (
                    const message
                    of messages
                ) {

                    try {

                        // ----------------------
                        // BASIC VALIDATION
                        // ----------------------

                        if (
                            !message ||
                            !message.message
                        ) {
                            continue;
                        }

                        // Ignore bot's own messages
                        if (
                            message.key
                                ?.fromMe
                        ) {
                            continue;
                        }

                        const jid =
                            message.key
                                ?.remoteJid;

                        if (!jid) {
                            continue;
                        }

                        // Ignore status
                        if (
                            jid ===
                            "status@broadcast"
                        ) {
                            continue;
                        }

                        // Ignore newsletters/channels
                        if (
                            jid.endsWith(
                                "@newsletter"
                            )
                        ) {
                            continue;
                        }

                        // ----------------------
                        // GET MESSAGE TEXT
                        // ----------------------

                        const text =
                            getMessageText(
                                message
                            );

                        if (
                            !text ||
                            !text.trim()
                        ) {
                            continue;
                        }

                        const cleanText =
                            text.trim();

                        console.log(
                            `📩 Incoming message from ${jid}: ${cleanText}`
                        );

                        // ==================================
                        // ONLY RESPOND TO "AI"
                        // ==================================

                        const lower =
                            cleanText.toLowerCase();

                        // Exact "ai"
                        if (
                            lower === "ai"
                        ) {

                            console.log(
                                `🤖 AI trigger from ${jid}`
                            );

                            await sock.sendMessage(
                                jid,
                                {
                                    text:
                                        "👋 Hello! I'm your AI assistant.\n\n" +
                                        "Ask me something like:\n" +
                                        "ai what is Minecraft?"
                                }
                            );

                            console.log(
                                "✅ AI help message sent."
                            );

                            continue;
                        }

                        // Must start with "ai "
                        if (
                            !lower.startsWith(
                                "ai "
                            )
                        ) {

                            console.log(
                                "⏭️ Ignored — no AI trigger."
                            );

                            continue;
                        }

                        // ----------------------
                        // REMOVE AI PREFIX
                        // ----------------------

                        const question =
                            cleanText
                                .substring(3)
                                .trim();

                        if (!question) {
                            continue;
                        }

                        console.log(
                            `🧠 Asking Gemini: ${question}`
                        );

                        // ----------------------
                        // GEMINI
                        // ----------------------

                        const reply =
                            await askAI(
                                question
                            );

                        // ----------------------
                        // SEND RESPONSE
                        // ----------------------

                        await sock.sendMessage(
                            jid,
                            {
                                text: reply
                            }
                        );

                        console.log(
                            `✅ AI response sent to ${jid}`
                        );

                    } catch (error) {

                        console.error(
                            "❌ Message handling error:"
                        );

                        console.error(error);

                        // Try to tell user something went wrong
                        try {

                            const jid =
                                message.key
                                    ?.remoteJid;

                            if (jid) {

                                await sock.sendMessage(
                                    jid,
                                    {
                                        text:
                                            "❌ Sorry, I couldn't process that request right now."
                                    }
                                );
                            }

                        } catch {}
                    }
                }
            }
        );

        console.log(
            "✅ WhatsApp event handlers loaded."
        );

        return sock;

    } catch (error) {

        console.error(
            "❌ Failed to start WhatsApp:"
        );

        console.error(error);

        setConnected(false);

        throw error;
    }
}

// ======================================
// EXTRACT MESSAGE TEXT
// ======================================

function getMessageText(message) {

    const msg =
        message?.message;

    if (!msg) {
        return null;
    }

    // Normal text
    if (
        typeof msg.conversation ===
        "string"
    ) {
        return msg.conversation;
    }

    // Extended text
    if (
        typeof
        msg.extendedTextMessage
            ?.text ===
        "string"
    ) {
        return msg
            .extendedTextMessage
            .text;
    }

    // Image caption
    if (
        typeof
        msg.imageMessage
            ?.caption ===
        "string"
    ) {
        return msg
            .imageMessage
            .caption;
    }

    // Video caption
    if (
        typeof
        msg.videoMessage
            ?.caption ===
        "string"
    ) {
        return msg
            .videoMessage
            .caption;
    }

    // Document caption
    if (
        typeof
        msg.documentMessage
            ?.caption ===
        "string"
    ) {
        return msg
            .documentMessage
            .caption;
    }

    return null;
            }
