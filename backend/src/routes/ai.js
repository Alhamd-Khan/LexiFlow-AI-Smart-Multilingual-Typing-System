// "use strict";
// var __importDefault = (this && this.__importDefault) || function (mod) {
//     return (mod && mod.__esModule) ? mod : { "default": mod };
// };
// Object.defineProperty(exports, "__esModule", { value: true });
// const express_1 = __importDefault(require("express"));
// const genai_1 = require("@google/genai");
// const router = express_1.default.Router();
// const ai = new genai_1.GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }); // Requires GEMINI_API_KEY in .env
// router.post('/suggest', async (req, res) => {
//     try {
//         const { text, context } = req.body;
//         const prompt = `You are a multilingual typing assistant. The user is currently typing: "${text}". 
//     Based on the context, provide 3 short autocomplete suggestions or continuations for what they might type next. 
//     Ensure the suggestions match the language being typed.
//     Return ONLY a JSON array of strings, no markdown formatting.`;
//         const response = await ai.models.generateContent({
//             model: 'gemini-3-flash-preview',
//             contents: prompt,
//         });
//         let responseText = response.text || "[]";
//         // Strip possible markdown block
//         if (responseText.startsWith('```json')) {
//             responseText = responseText.replace(/```json\n?/, '').replace(/```\n?$/, '').trim();
//         }
//         let suggestions = [];
//         try {
//             suggestions = JSON.parse(responseText);
//         }
//         catch (e) {
//             suggestions = [responseText]; // Fallback if it didn't return strict JSON
//         }
//         res.json({ suggestions });
//     }
//     catch (error) {
//         console.error('AI Suggestion Error:', error);
//         res.status(500).json({ error: 'AI suggestion failed' });
//     }
// });
// router.post('/translate', async (req, res) => {
//     try {
//         const { text, to } = req.body;
//         const prompt = `Translate the following text to ${to}. Provide ONLY the translated text, nothing else.\n\nText: ${text}`;
//         const response = await ai.models.generateContent({
//             model: 'gemini-3-flash-preview',
//             contents: prompt,
//         });
//         res.json({ translatedText: response.text?.trim() || '' });
//     }
//     catch (error) {
//         console.error('AI Translation Error:', error);
//         res.status(500).json({ error: 'Translation failed' });
//     }
// });
// exports.default = router;

const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// helper retry function (fixes 429 rate limit)
async function generateWithRetry(model, prompt, retries = 3) {
    try {
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (err) {
        if (err.status === 429 && retries > 0) {
            console.log("Rate limit hit. Retrying...");
            await new Promise(r => setTimeout(r, 2000));
            return generateWithRetry(model, prompt, retries - 1);
        }
        throw err;
    }
}

// ---------- AUTOCOMPLETE ----------
router.post("/suggest", async (req, res) => {
    try {
        const { text, context } = req.body;

        if (!text) {
            return res.json({ suggestions: [] });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.json({ suggestions: ["Please configure GEMINI_API_KEY"] });
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-3.1-flash-lite-preview"
        });

        const prompt = `
You are a multilingual typing assistant.

User is typing: "${text}"
Context: "${context || ""}"

Provide 3 short autocomplete suggestions.

Return ONLY valid JSON like:
["suggestion1","suggestion2","suggestion3"]
`;

        let responseText = await generateWithRetry(model, prompt);

        // clean markdown if model returns it
        responseText = responseText
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        let suggestions = [];

        try {
            suggestions = JSON.parse(responseText);
        } catch (e) {
            suggestions = responseText
                .split("\n")
                .filter(s => s.trim().length > 0)
                .slice(0, 3);
        }

        res.json({ suggestions });

    } catch (error) {
        console.error("AI Suggest Error:", error);
        res.status(500).json({ error: "AI suggestion failed" });
    }
});

// ---------- TRANSLATION ----------
router.post("/translate", async (req, res) => {
    try {
        const { text, from, to } = req.body;

        if (!text || !to) {
            return res.status(400).json({
                error: "Text and target language required"
            });
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-3.1-flash-lite-preview"
        });

        const prompt = `
Translate the following text ${from ? `from ${from}` : ""} to ${to}.

Return ONLY the translated text.

Text: "${text}"
`;

        const translated = await generateWithRetry(model, prompt);

        res.json({
            translatedText: translated.trim()
        });

    } catch (error) {
        console.error("AI Translation Error:", error);
        res.status(500).json({ error: "Translation failed" });
    }
});

router.post("/summarize", async (req, res) => {
    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ error: "Text is required" });
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-3.1-flash-lite-preview"
        });

        const prompt = `
Summarize the following text into 3 to 5 concise bullet points.

Return ONLY the summary text.

Text: "${text}"
`;

        const summary = await generateWithRetry(model, prompt);

        res.json({ summary: summary.trim() });
    } catch (error) {
        console.error("AI Summarize Error:", error);
        res.status(500).json({ error: "Summarization failed" });
    }
});

// ---------- IMPROVE TEXT ----------
router.post("/improve", async (req, res) => {
    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ error: "Text is required" });
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash"
        });

        const prompt = `
Analyze the following text. Provide grammar improvements and a few alternative ways to write the same thing as a list.

Return ONLY the improvements and alternatives as plain text without any markdown symbols (like #, **, or *). Just use plain text with simple hyphens (-) for lists where needed. Do not use any bolding or heading hash marks.

Text: "${text}"
`;

        let improvement = await generateWithRetry(model, prompt);
        
        // Final cleanup to ensure no Markdown leaks through
        improvement = improvement
            .replace(/#/g, "")
            .replace(/\*\*/g, "")
            .replace(/\*/g, "-")
            .replace(/```/g, "")
            .trim();

        res.json({ improvement });
    } catch (error) {
        console.error("AI Improve Error:", error);
        res.status(500).json({ error: "Improvement failed" });
    }
});

module.exports = router;
