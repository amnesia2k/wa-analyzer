// import { GoogleGenAI } from "@google/genai";

// ----- AI Insights with Gemini -----
// const ai = new GoogleGenAI({
//   apiKey: process.env.GEMINI_API_KEY,
// });

//     const prompt = `
// Analyze this WhatsApp conversation and return JSON with exactly these keys:
// {
//   "connectionAnalysis": "string",
//   "personalityInsights": ["string"],
//   "funFacts": ["string"],
//   "otherPatterns": ["string"]
// }

// Conversation:
// ${allText}
// `;

//     const prompt = `
// You are analyzing a WhatsApp conversation between two or more people.

// ⚡ Your job:
// - Write in a natural, friendly, first-person style.
// - Do NOT use labels like "Participant 1" or "Participant 2".
// - Refer to people by their actual names (from the chat) when possible.
// - Keep responses concise but insightful (1–3 sentences each).
// - Always return ONLY valid JSON. No extra text or commentary.

// Format the JSON exactly like this:
// {
//   "connectionAnalysis": "string",
//   "personalityInsights": ["Name: short, friendly description", "Name: short, friendly description", "..."],
//   "funFacts": ["string", "string", "..."],
//   "otherPatterns": ["string", "string", "..."]
// }

// Example of the style I want:
// {
//   "connectionAnalysis": "You and your chat partner have a strong, balanced communication style with playful back-and-forth.",
//   "personalityInsights": [
//     "olatilewadotdev </>: Thoughtful listener",
//     "Darby: Expressive communicator with lots of humor"
//   ],
//   "funFacts": [
//     "You've exchanged enough messages to fill 1 page of a book!"
//   ],
//   "otherPatterns": [
//     "Lots of jokes about sleeping and laziness",
//     "Frequent use of Nigerian slang and emojis"
//   ]
// }

// Conversation:
// ${allText}
// `;

//     console.log("Prompt:", prompt);

//     const response = await ai.models.generateContent({
//       model: "gemini-2.5-flash",
//       contents: [prompt],
//     });

//     // console.log("Response:", response);

//     const rawText = response.text;

//     console.log("Raw Text:", rawText);

//     let aiInsights: {
//       connectionAnalysis: string;
//       personalityInsights: string[];
//       funFacts: string[];
//       otherPatterns: string[];
//     };

//     try {
//       aiInsights = JSON.parse(rawText ?? "{}") as {
//         connectionAnalysis: string;
//         personalityInsights: string[];
//         funFacts: string[];
//         otherPatterns: string[];
//       };
//     } catch {
//       aiInsights = {
//         connectionAnalysis: rawText ?? "No analysis generated",
//         personalityInsights: [],
//         funFacts: [],
//         otherPatterns: [],
//       };
//     }
