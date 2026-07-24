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
