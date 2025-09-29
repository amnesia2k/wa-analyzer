import { type NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

// Define types for input and AI output
interface AnalyzeRequestBody {
  allText: string;
  participants: { name: string; count?: number; percentage?: number }[];
}

interface AIInsights {
  connectionAnalysis: string;
  personalityInsights: string[];
  funFacts: string[];
  otherPatterns: string[];
}

export async function POST(req: NextRequest) {
  try {
    // Tell TypeScript what shape the JSON body has
    const { allText, participants } = (await req.json()) as AnalyzeRequestBody;

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const prompt = `
      You are analyzing a WhatsApp conversation between two or more people.

      ⚡ Your job:
      - Write in a natural, friendly, first-person style.
      - Do NOT use labels like "Participant 1" or "Participant 2".
      - Use actual participant names: ${participants.map((p) => p.name).join(", ")}.
      - Keep responses concise but insightful (1–3 sentences each).
      - Always return ONLY valid JSON. No extra text or commentary.

      Format the JSON exactly like this:
      {
        "connectionAnalysis": "string",
        "personalityInsights": ["Name: short, friendly description", "Name: short, friendly description", "..."],
        "funFacts": ["string", "string", "..."],
        "otherPatterns": ["string", "string", "..."]
      }

      Conversation: ${allText}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [prompt],
    });

    const rawText = response.text ?? "";

    console.log("AI response:", rawText);

    // Parse AI output safely with proper type
    const aiInsights: AIInsights = {
      connectionAnalysis: "",
      personalityInsights: [],
      funFacts: [],
      otherPatterns: [],
    };

    try {
      // Remove code fences if present
      const cleaned = rawText.replace(/```(json)?/g, "").trim();
      const parsed = JSON.parse(cleaned) as AIInsights;

      aiInsights.connectionAnalysis = parsed.connectionAnalysis ?? "";
      aiInsights.personalityInsights = parsed.personalityInsights ?? [];
      aiInsights.funFacts = parsed.funFacts ?? [];
      aiInsights.otherPatterns = parsed.otherPatterns ?? [];
    } catch (err) {
      console.error("Failed to parse AI JSON, returning raw text:", err);
      aiInsights.connectionAnalysis =
        "Failed to parse AI JSON. Raw output:\n" + rawText;
    }

    return NextResponse.json(aiInsights);
  } catch (err) {
    console.error("AI generation failed:", err);
    return NextResponse.json(
      { error: "Failed to generate AI insights" },
      { status: 500 },
    );
  }
}
