import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    throw new Error(
        "❌ GEMINI_API_KEY is not set in Render Environment Variables."
    );
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Current Gemini model
const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash"
});

export async function askAI(userMessage) {
    try {
        if (
            !userMessage ||
            typeof userMessage !== "string" ||
            !userMessage.trim()
        ) {
            return "❌ Please send a valid message.";
        }

        // Keep requests reasonably small
        const cleanMessage = userMessage
            .trim()
            .substring(0, 4000);

        const result = await model.generateContent(cleanMessage);

        const response = result?.response?.text?.();

        if (!response || !response.trim()) {
            return "❌ I couldn't generate a response. Please try again.";
        }

        // WhatsApp message safety limit
        return response.trim().substring(0, 4096);

    } catch (error) {
        console.error("❌ Gemini error:", error);

        const errorMessage =
            error?.message?.toLowerCase() || "";

        if (
            errorMessage.includes("api key") ||
            errorMessage.includes("api_key") ||
            errorMessage.includes("unauthorized")
        ) {
            return "❌ Gemini API key is invalid. Check GEMINI_API_KEY in Render.";
        }

        if (
            errorMessage.includes("429") ||
            errorMessage.includes("quota") ||
            errorMessage.includes("rate limit")
        ) {
            return "⏳ Gemini rate limit reached. Please try again later.";
        }

        if (
            errorMessage.includes("blocked") ||
            errorMessage.includes("safety")
        ) {
            return "⚠️ I can't process that request.";
        }

        return "❌ AI temporarily unavailable. Please try again.";
    }
    }
