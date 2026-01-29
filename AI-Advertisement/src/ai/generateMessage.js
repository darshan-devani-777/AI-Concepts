import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

export async function generateDailyMessage() {
  const prompt = `
You are a digital marketer for an Indian dry fruits shop.
Generate a short WhatsApp message for today:
- Include all main dry fruits: Badam, Kaju, Pista, Akhrot, Khajoor
- Focus on health & energy benefits
- Friendly, readable, mobile-friendly
- Add trust lines like 'Fresh & Pure', 'Trusted Local Shop'
- Max 5 lines
`;

  try {
    const res = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 500,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const message = res.data.choices[0].message.content;
    if (!message) throw new Error("Groq returned empty message");

    return message;
  } catch (err) {
    console.error("Error calling Groq API:", err.message);
    return null;
  }
}
