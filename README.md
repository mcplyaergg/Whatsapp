# WhatsApp AI Chatbot

A production-ready WhatsApp AI chatbot powered by Google Gemini and built with Baileys.

## Features

✅ **AI-Powered Responses** - Automatic replies using Google Gemini AI
✅ **WhatsApp Integration** - Connects via Baileys (no official API needed)
✅ **Auto-Reconnect** - Automatically reconnects if disconnected
✅ **Persistent Authentication** - Stores session data for seamless restarts
✅ **QR Code Login** - Scan QR code from logs to authenticate
✅ **Error Handling** - Safe handling of invalid messages and API errors
✅ **Environment Variables** - Never hardcodes sensitive data
✅ **Render Ready** - Configured for deployment on Render with persistent storage

## Prerequisites

- Node.js 18+
- npm or yarn
- Google Gemini API key (get it from [Google AI Studio](https://makersuite.google.com/app/apikey))

## Installation

### Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/mcplyaergg/Whatsapp.git
   cd Whatsapp
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create `.env` file:**
   ```bash
   echo "GEMINI_API_KEY=your_api_key_here" > .env
   ```

4. **Start the bot:**
   ```bash
   npm start
   ```

5. **Scan QR Code:**
   - A QR code will appear in the terminal
   - Scan it with your WhatsApp phone camera (Settings → Linked Devices → Link a Device)
   - The bot will start running after successful authentication

## Deployment on Render

### Setup Instructions

1. **Push code to GitHub:**
   ```bash
   git add .
   git commit -m "Initial WhatsApp AI Bot"
   git push origin main
   ```

2. **Create Render Web Service:**
   - Go to [render.com](https://render.com)
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Select the branch (main)

3. **Configure Build & Start Commands:**
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`

4. **Add Environment Variables:**
   - `GEMINI_API_KEY`: Your Google Gemini API key
   - `AUTH_PATH`: `/var/data/auth`

5. **Add Persistent Disk:**
   - Mount path: `/var/data`
   - Size: 1 GB (minimum)

6. **Deploy:**
   - Click "Create Web Service"
   - Watch the logs for the QR code
   - Scan the QR code to authenticate WhatsApp

### View Logs on Render

After deployment:
1. Go to your Render dashboard
2. Click on your service
3. Click "Logs"
4. Scroll for the QR code display
5. Scan with WhatsApp to authenticate

## Project Structure

```
.
├── src/
│   ├── index.js          # Main entry point, WhatsApp connection handler
│   ├── ai.js             # Google Gemini AI integration
│   └── whatsapp.js       # Message handling and routing
├── auth/                 # WhatsApp session storage (gitignored)
├── .gitignore            # Git ignore rules
├── package.json          # Project dependencies
├── package-lock.json     # Dependency lock file
└── README.md             # This file
```

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GEMINI_API_KEY` | ✅ Yes | - | Google Gemini API key |
| `AUTH_PATH` | ❌ No | `./auth` | Path to store WhatsApp authentication |

## How It Works

1. **Connection** - Baileys creates a WhatsApp Web session
2. **QR Code** - Scan QR code displayed in logs to authenticate
3. **Message Received** - Bot listens to incoming messages
4. **AI Processing** - Google Gemini generates a response
5. **Send Reply** - Bot sends AI response back to sender
6. **Error Handling** - Gracefully handles API/connection errors

## Troubleshooting

### No QR Code Appearing
- Check the logs carefully - QR code is printed as ASCII art
- Ensure terminal supports QR code display
- Restart the bot: `npm start`

### "Device logged out" Error
- Delete the `auth/` folder
- Restart the bot and scan QR code again
- On Render, delete the persistent disk and redeploy

### API Key Error
- Verify `GEMINI_API_KEY` is set in environment variables
- Check API key is valid at [Google AI Studio](https://makersuite.google.com/app/apikey)
- Make sure the key hasn't been revoked

### Rate Limit Errors
- Google Gemini API has rate limits on free tier
- Wait a few moments before sending another message
- Consider upgrading to paid plan for higher limits

### Connection Drops Frequently
- Network stability issue - bot auto-reconnects
- Ensure Render service has good internet connection
- Check WhatsApp app isn't active on another device

## API Rate Limits

Google Gemini API free tier limitations:
- Requests per minute: 60
- Requests per day: 1,500

For production use, consider upgrading to a paid plan.

## Security Notes

⚠️ **Never:**
- Commit `.env` file to Git
- Share `GEMINI_API_KEY` publicly
- Hardcode API keys in source code

✅ **Always:**
- Use environment variables for sensitive data
- Keep dependencies updated
- Monitor API usage and costs
- Review WhatsApp Terms of Service

## Performance Tips

1. **Response Time** - Gemini API typically responds in 1-2 seconds
2. **Message Queuing** - Bot handles one message at a time
3. **Storage** - Authentication data is <10MB

## Dependencies

- **@baileys/core** - WhatsApp Web automation
- **@google/generative-ai** - Google Gemini AI API
- **pino** - Lightweight logging
- **pino-pretty** - Pretty console logs
- **qrcode-terminal** - QR code display in terminal

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

For issues or questions:
1. Check the Troubleshooting section
2. Review Render logs for detailed error messages
3. Check Google Gemini API documentation
4. Open an issue on GitHub

## Disclaimer

This project is for educational purposes. WhatsApp's Terms of Service prohibit automation via unofficial methods. Use responsibly and at your own risk.
