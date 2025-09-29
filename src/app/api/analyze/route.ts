import { type NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    let content = await file.text();

    // ----- Normalize iOS invisible characters -----
    content = content.replace(/\u200e/g, "");

    // ----- Split lines and merge multi-line iOS messages -----
    const rawLines = content.split("\n").filter((line) => line.trim());
    const mergedLines: string[] = [];
    const iosDateRegex =
      /^\[\d{1,2}\/\d{1,2}\/\d{2,4},?\s+\d{1,2}:\d{2}(?::\d{2})?\s*[AP]?M?\]/;
    const androidDateRegex = /^\d{1,2}\/\d{1,2}\/\d{2,4}/;

    for (const line of rawLines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // New message line (iOS or Android)
      if (iosDateRegex.test(trimmed) || androidDateRegex.test(trimmed)) {
        mergedLines.push(trimmed);
      } else {
        // Continuation of previous message
        mergedLines[mergedLines.length - 1] += " " + trimmed;
      }
    }

    // ----- Parsing logic -----
    const androidPattern =
      /^\d{1,2}\/\d{1,2}\/\d{2,4},?\s+\d{1,2}:\d{2}\s*[AP]?M?\s*-\s*([^:]+):\s*(.*)$/;

    const iosPattern =
      /^\[(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?\s*[AP]?M?)\]\s*([^:]+):\s*(.*)$/;

    const messages: { sender: string; content: string; date: string }[] = [];
    const participants = new Map<string, number>();
    const conversationStarters = new Map<string, number>();
    const emojiRegex =
      /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
    const emojiCount = new Map<string, number>();
    let totalEmojis = 0;
    let firstDate = "";
    let lastSender = "";

    mergedLines.forEach((line) => {
      let sender = "";
      let content = "";
      let date = "";

      // Try Android
      const androidMatch = androidPattern.exec(line);
      if (androidMatch?.[1]) {
        sender = androidMatch[1].trim();
        content = androidMatch[2]?.trim() ?? "";
        const dateRegex = /^\d{1,2}\/\d{1,2}\/\d{2,4}/;
        date = dateRegex.exec(line)?.[0] ?? "";
      }

      // Try iOS
      const iosMatch = iosPattern.exec(line);
      if (iosMatch) {
        date = iosMatch[1] ?? "";
        sender = iosMatch[3]?.trim() ?? "";
        content = iosMatch[4]?.trim() ?? "";
      }

      if (sender && content !== undefined) {
        if (!firstDate) firstDate = date;

        messages.push({ sender, content, date });
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
        const emojis = content.match(emojiRegex) ?? [];
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

    // Clean words for word cloud
    const cleanedWords = allText
      .split(/\s+/)
      .filter(
        (word) =>
          word.length > 1 &&
          !word.startsWith("http") &&
          !word.startsWith("https") &&
          !word.includes("://") &&
          !word.includes(".com") &&
          !word.includes(".net") &&
          !word.includes(".org") &&
          !word.includes(".edu") &&
          !word.includes(".dev") &&
          !word.includes("<media") &&
          !word.includes("omitted>") &&
          !word.includes("omitted") &&
          !word.includes("call,") &&
          !word.includes("call") &&
          !word.includes("missed"),
      );

    // ----- Word Cloud (top 20 most frequent words) -----
    const wordCount = new Map<string, number>();
    for (const word of cleanedWords) {
      wordCount.set(word, (wordCount.get(word) ?? 0) + 1);
    }

    const sortedWords = Array.from(wordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word]) => word);

    return NextResponse.json({
      allText,
      totalMessages,
      participants: participantArray,
      startDate: firstDate,
      conversationStarters: starterArray,
      totalEmojis,
      topEmojis,
      wordCloud: sortedWords,
      // aiInsights,
    });
  } catch (err) {
    console.error("Analyzing chat failed:", err);
    return NextResponse.json(
      { error: "Failed to analyze chat" },
      { status: 500 },
    );
  }
}
