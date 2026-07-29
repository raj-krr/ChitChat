/**
 * Groq API Client Helper
 * Uses Groq's high-speed inference endpoint with Llama 3.3 70B model.
 */

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function callGroq(messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not defined in environment variables");
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages,
      temperature: 0.7,
      max_tokens: 300,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API Error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || "🙂";
}

/**
 * Generate 3 context-aware smart reply chips for recent chat history
 */
export async function generateSmartReplies(
  recentMessages: { sender: string; text: string }[]
): Promise<string[]> {
  try {
    if (!process.env.GROQ_API_KEY) {
      return ["Sounds good! 👍", "What time works for you?", "Let me check!"];
    }

    const formattedHistory = recentMessages
      .map((m) => `${m.sender}: ${m.text}`)
      .join("\n");

    const promptMessages: ChatMessage[] = [
      {
        role: "system",
        content:
          'You are a smart quick-reply generator for a chat app. Based on the conversation history provided, generate EXACTLY 3 short, natural, context-aware quick response suggestions (each 2-5 words). Return ONLY a JSON array of 3 strings like ["Response 1", "Response 2", "Response 3"] with no extra commentary or markdown formatting.',
      },
      {
        role: "user",
        content: `Conversation:\n${formattedHistory}\n\nGenerate 3 quick replies:`,
      },
    ];

    const rawResponse = await callGroq(promptMessages);
    const cleaned = rawResponse.replace(/```json|```/g, "").trim();

    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed) && parsed.length >= 3) {
      return parsed.slice(0, 3).map(String);
    }
  } catch (err) {
    console.error("Smart replies error (falling back):", err);
  }

  return ["Sounds good! 👍", "What time works for you?", "Let me check!"];
}

