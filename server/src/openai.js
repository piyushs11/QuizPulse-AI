
import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateQuiz(topic) {
  // Guardrails
  const safeTopic = String(topic || "").slice(0, 120);
  const prompt = `Generate 10 multiple-choice questions about "${safeTopic}". 
Each item MUST be strict JSON with keys: question, options (array of 4 short strings), answerIndex (0-3), explanation.
Return ONLY a JSON array. No prose. Example:
[{"question":"...","options":["A","B","C","D"],"answerIndex":1,"explanation":"..."}]`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are a helpful assistant that returns strictly valid JSON." },
      { role: "user", content: prompt }
    ],
    temperature: 0.7
  });

  const raw = response.choices?.[0]?.message?.content?.trim() || "[]";
  // Attempt to parse JSON, fallback to empty list on error
  try {
    const data = JSON.parse(raw);
    // Validate shape
    const clean = (Array.isArray(data) ? data : []).filter(
      q => q && typeof q.question === "string" && Array.isArray(q.options) && q.options.length === 4 && Number.isInteger(q.answerIndex)
    ).slice(0, 20);
    return clean;
  } catch (e) {
    console.error("OpenAI JSON parse failed:", e);
    return [];
  }
}
