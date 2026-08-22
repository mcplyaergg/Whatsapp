import express from "express";
import QRCode from "qrcode";
import { startWhatsApp } from "./whatsapp.js";

const app = express();

const PORT = Number(process.env.PORT) || 10000;
const HOST = "0.0.0.0";

let currentQR = null;
let connected = false;

// Store the latest QR from WhatsApp
export function setQR(qr) {
    currentQR = qr;
    connected = false;
}

export function setConnected(value) {
    connected = value;

    if (value) {
        currentQR = null;
    }
}

// Home page
app.get("/", async (req, res) => {
    if (connected) {
        return res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>WhatsApp AI Bot</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body {
            background: #111;
            color: white;
            font-family: Arial, sans-serif;
            text-align: center;
            padding: 40px 20px;
        }

        .box {
            max-width: 500px;
            margin: auto;
            background: #1b1b1b;
            padding: 30px;
            border-radius: 20px;
        }

        .status {
            color: #00ff88;
            font-size: 22px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="box">
        <h1>🤖 WhatsApp AI Bot</h1>
        <p class="status">🟢 Connected</p>
        <p>Your WhatsApp AI bot is running.</p>
    </div>
</body>
</html>
        `);
    }

    if (!currentQR) {
        return res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>WhatsApp AI Bot</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="refresh" content="3">
    <style>
        body {
            background: #111;
            color: white;
            font-family: Arial, sans-serif;
            text-align: center;
            padding: 50px 20px;
        }

        .box {
            max-width: 500px;
            margin: auto;
            background: #1b1b1b;
            padding: 30px;
            border-radius: 20px;
        }
    </style>
</head>
<body>
    <div class="box">
        <h1>🤖 WhatsApp AI Bot</h1>
        <h2>⏳ Waiting for QR...</h2>
        <p>This page automatically refreshes.</p>
    </div>
</body>
</html>
        `);
    }

    const qrImage = await QRCode.toDataURL(currentQR, {
        width: 400,
        margin: 2,
        errorCorrectionLevel: "M"
    });

    res.send(`
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
            background: #111;
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
            background: #1b1b1b;
            padding: 30px;
            border-radius: 22px;
            text-align: center;
            box-shadow: 0 0 30px rgba(0,255,136,0.15);
        }

        h1 {
            margin-top: 0;
        }

        img {
            width: min(400px, 90vw);
            height: min(400px, 90vw);
            background: white;
            padding: 10px;
            border-radius: 15px;
        }

        .steps {
            text-align: left;
            margin-top: 20px;
            line-height: 1.7;
        }

        .refresh {
            color: #00ff88;
            margin-top: 15px;
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

        <img src="${qrImage}" alt="WhatsApp QR Code">

        <div class="steps">
            <b>How to scan:</b><br>
            1. Open WhatsApp on your phone<br>
            2. Go to <b>Settings → Linked devices</b><br>
            3. Tap <b>Link a device</b><br>
            4. Scan the QR above
        </div>

        <p class="refresh">🔄 QR refreshes automatically</p>
    </div>
</body>
</html>
    `);
});

// Direct PNG QR endpoint
app.get("/qr.png", async (req, res) => {
    if (!currentQR || connected) {
        return res.status(404).send("QR code is not available.");
    }

    try {
        const buffer = await QRCode.toBuffer(currentQR, {
            type: "png",
            width: 600,
            margin: 3,
            errorCorrectionLevel: "M"
        });

        res.setHeader("Content-Type", "image/png");
        res.send(buffer);
    } catch (error) {
        console.error("QR image error:", error);
        res.status(500).send("Failed to generate QR.");
    }
});

// Health check
app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        whatsapp: connected ? "connected" : "waiting"
    });
});

// Start HTTP server FIRST
app.listen(PORT, HOST, () => {
    console.log(`🌐 Web server running on port ${PORT}`);
    console.log(`🔗 Render URL: ${process.env.RENDER_EXTERNAL_URL || "your Render URL"}`);

    startWhatsApp().catch((error) => {
        console.error("❌ WhatsApp startup error:", error);
    });
});
