import express from "express";
import QRCode from "qrcode";
import { startWhatsApp } from "./whatsapp.js";

const app = express();

const PORT = Number(process.env.PORT) || 10000;
const HOST = "0.0.0.0";

let currentQR = null;
let connected = false;
let starting = false;

// ================================
// WhatsApp status functions
// ================================

export function setQR(qr) {
    currentQR = qr;
    connected = false;
}

export function setConnected(value) {
    connected = Boolean(value);

    if (connected) {
        currentQR = null;
    }
}

// ================================
// Home page
// ================================

app.get("/", async (req, res) => {
    try {
        // CONNECTED
        if (connected) {
            return res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>WhatsApp AI Bot</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <style>
        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            min-height: 100vh;
            background: #0b0b0b;
            color: white;
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }

        .box {
            width: 100%;
            max-width: 500px;
            background: #151515;
            padding: 35px 25px;
            border-radius: 22px;
            text-align: center;
            box-shadow: 0 0 40px rgba(0, 255, 136, 0.08);
        }

        .icon {
            font-size: 60px;
        }

        h1 {
            margin: 10px 0;
        }

        .status {
            color: #00ff88;
            font-size: 22px;
            font-weight: bold;
        }

        .info {
            color: #aaa;
            line-height: 1.6;
        }

        .trigger {
            display: inline-block;
            margin-top: 15px;
            padding: 10px 18px;
            background: #222;
            border-radius: 10px;
            color: #00ff88;
            font-weight: bold;
        }
    </style>
</head>

<body>
    <div class="box">
        <div class="icon">🤖</div>

        <h1>WhatsApp AI Bot</h1>

        <p class="status">🟢 Connected</p>

        <p class="info">
            Your WhatsApp AI bot is online and ready.
        </p>

        <div class="trigger">
            Trigger: ai
        </div>

        <p class="info">
            Example: <b>ai what is Minecraft?</b>
        </p>
    </div>
</body>
</html>
            `);
        }

        // WAITING FOR QR
        if (!currentQR) {
            return res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>WhatsApp AI Bot</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <meta http-equiv="refresh" content="5">

    <style>
        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            min-height: 100vh;
            background: #0b0b0b;
            color: white;
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }

        .box {
            width: 100%;
            max-width: 500px;
            background: #151515;
            padding: 35px 25px;
            border-radius: 22px;
            text-align: center;
        }

        .icon {
            font-size: 60px;
        }

        h1 {
            margin: 10px 0;
        }

        .loading {
            color: #ffaa00;
            font-size: 20px;
            font-weight: bold;
        }

        p {
            color: #aaa;
        }
    </style>
</head>

<body>
    <div class="box">
        <div class="icon">📱</div>

        <h1>WhatsApp AI Bot</h1>

        <p class="loading">⏳ Waiting for WhatsApp...</p>

        <p>
            The page will automatically refresh.
        </p>
    </div>
</body>
</html>
            `);
        }

        // QR CODE
        const qrImage = await QRCode.toDataURL(currentQR, {
            width: 500,
            margin: 2,
            errorCorrectionLevel: "M"
        });

        return res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Scan WhatsApp QR</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <style>
        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            min-height: 100vh;
            background: #0b0b0b;
            color: white;
            font-family: Arial, sans-serif;

            display: flex;
            justify-content: center;
            align-items: center;

            padding: 20px;
        }

        .box {
            width: 100%;
            max-width: 520px;

            background: #151515;

            padding: 30px 20px;

            border-radius: 22px;

            text-align: center;

            box-shadow:
                0 0 40px rgba(0, 255, 136, 0.08);
        }

        h1 {
            margin-top: 0;
        }

        .subtitle {
            color: #aaa;
        }

        img {
            display: block;

            width: min(430px, 90vw);
            height: min(430px, 90vw);

            margin: 20px auto;

            background: white;

            padding: 10px;

            border-radius: 15px;
        }

        .steps {
            text-align: left;

            background: #202020;

            padding: 18px;

            border-radius: 15px;

            line-height: 1.8;
        }

        .refresh {
            color: #00ff88;
            margin-top: 20px;
        }

        .warning {
            color: #ffaa00;
            font-size: 13px;
        }
    </style>

    <script>
        setTimeout(() => {
            location.reload();
        }, 15000);
    </script>
</head>

<body>
    <div class="box">

        <h1>📱 WhatsApp Login</h1>

        <p class="subtitle">
            Scan this QR code with WhatsApp
        </p>

        <img
            src="${qrImage}"
            alt="WhatsApp QR Code"
        >

        <div class="steps">
            <b>How to connect:</b><br>

            1. Open WhatsApp on your phone<br>

            2. Go to
            <b>Settings → Linked devices</b><br>

            3. Tap
            <b>Link a device</b><br>

            4. Scan this QR code
        </div>

        <p class="refresh">
            🔄 QR automatically refreshes
        </p>

        <p class="warning">
            Keep this page open while scanning.
        </p>

    </div>
</body>
</html>
        `);

    } catch (error) {
        console.error("❌ Home page error:", error);

        res.status(500).send("Internal server error.");
    }
});

// ================================
// QR PNG
// ================================

app.get("/qr.png", async (req, res) => {
    if (!currentQR || connected) {
        return res
            .status(404)
            .send("QR code is not available.");
    }

    try {
        const buffer = await QRCode.toBuffer(
            currentQR,
            {
                type: "png",
                width: 600,
                margin: 3,
                errorCorrectionLevel: "M"
            }
        );

        res.setHeader(
            "Content-Type",
            "image/png"
        );

        res.send(buffer);

    } catch (error) {
        console.error(
            "❌ QR generation error:",
            error
        );

        res.status(500).send(
            "Failed to generate QR."
        );
    }
});

// ================================
// Health check
// ================================

app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        whatsapp: connected
            ? "connected"
            : "waiting",
        timestamp: new Date().toISOString()
    });
});

// ================================
// Status API
// ================================

app.get("/status", (req, res) => {
    res.json({
        connected,
        qrAvailable: Boolean(currentQR),
        status: connected
            ? "connected"
            : currentQR
                ? "qr_ready"
                : "starting"
    });
});

// ================================
// Start server
// ================================

app.listen(PORT, HOST, () => {
    console.log("====================================");
    console.log("🌐 Render web server started");
    console.log(`🚀 Port: ${PORT}`);
    console.log(`🌍 Host: ${HOST}`);
    console.log("====================================");

    if (!starting) {
        starting = true;

        startWhatsApp()
            .catch((error) => {
                console.error(
                    "❌ WhatsApp startup error:",
                    error
                );

                starting = false;
            });
    }
});

// ================================
// Process errors
// ================================

process.on(
    "unhandledRejection",
    (error) => {
        console.error(
            "❌ Unhandled rejection:",
            error
        );
    }
);

process.on(
    "uncaughtException",
    (error) => {
        console.error(
            "❌ Uncaught exception:",
            error
        );
    }
);

// ================================
// Graceful shutdown
// ================================

process.on(
    "SIGTERM",
    () => {
        console.log(
            "🛑 SIGTERM received."
        );

        process.exit(0);
    }
);

process.on(
    "SIGINT",
    () => {
        console.log(
            "🛑 SIGINT received."
        );

        process.exit(0);
    }
);
