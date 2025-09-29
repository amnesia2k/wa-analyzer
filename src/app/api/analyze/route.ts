import { type NextRequest, NextResponse } from "next/server";
// import { GoogleGenAI } from "@google/genai";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const content = await file.text();
    const lines = content.split("\n").filter((line) => line.trim());

    // ----- Parsing logic (same as before) -----
    const messagePattern =
      /^\d{1,2}\/\d{1,2}\/\d{2,4},?\s+\d{1,2}:\d{2}\s*[AP]?M?\s*-\s*([^:]+):\s*(.*)$/;

    const messages: { sender: string; content: string; date: string }[] = [];
    const participants = new Map<string, number>();
    const conversationStarters = new Map<string, number>();
    const emojiRegex =
      /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
    const emojiCount = new Map<string, number>();
    let totalEmojis = 0;
    let firstDate = "";
    let lastSender = "";

    lines.forEach((line) => {
      const match = messagePattern.exec(line);
      if (match) {
        const sender = match[1]?.trim() ?? "";
        const content = match[2]?.trim();
        const dateRegex = /^\d{1,2}\/\d{1,2}\/\d{2,4}/;
        const dateMatch = dateRegex.exec(line);
        const date = dateMatch ? dateMatch[0] : "";

        if (!firstDate) firstDate = date;

        messages.push({ sender, content: content ?? "", date });
        participants.set(sender, (participants.get(sender) ?? 0) + 1);

        // Conversation starter
        if (lastSender && lastSender !== sender) {
          conversationStarters.set(
            sender,
            (conversationStarters.get(sender) ?? 0) + 1,
          );
        }
        lastSender = sender;

        // Emojis
        const emojis = content?.match(emojiRegex) ?? [];
        emojis.forEach((emoji) => {
          emojiCount.set(emoji, (emojiCount.get(emoji) ?? 0) + 1);
          totalEmojis++;
        });
      }
    });

    const totalMessages = messages.length;
    const participantArray = Array.from(participants.entries())
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / totalMessages) * 100),
      }))
      .sort((a, b) => b.count - a.count);

    const starterArray = Array.from(conversationStarters.entries())
      .map(([name, count]) => ({
        name,
        percentage: Math.round(
          (count / Math.max(conversationStarters.size, 1)) * 100,
        ),
      }))
      .sort((a, b) => b.percentage - a.percentage);

    const topEmojis = Array.from(emojiCount.entries())
      .map(([emoji, count]) => ({ emoji, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const allText = messages
      .map((m) => m.content)
      .join(" ")
      .toLowerCase();

    // console.log("ALL TEXT >>>", allText);

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

    const cleanedWords = allText.split(/\s+/).filter(
      (word) =>
        word.length > 1 && // ignore single letters
        !word.startsWith("http") && // remove links
        !word.startsWith("https") &&
        !word.includes("://") && // remove urls without http prefix
        !word.includes(".com") &&
        !word.includes(".net") &&
        !word.includes(".org") &&
        !word.includes(".edu") &&
        !word.includes(".dev") &&
        !word.includes("<media") &&
        !word.includes("omitted>"),
    );

    return NextResponse.json({
      allText,
      totalMessages,
      participants: participantArray,
      startDate: firstDate,
      conversationStarters: starterArray,
      totalEmojis,
      topEmojis,
      wordCloud: Array.from(new Set(cleanedWords)).slice(0, 20),
      // aiInsights,
    });
  } catch (err) {
    console.error("AI generation failed:", err);
    return NextResponse.json(
      { error: "Failed to analyze chat" },
      { status: 500 },
    );
  }
}
