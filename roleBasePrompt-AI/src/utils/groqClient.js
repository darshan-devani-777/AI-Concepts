require("dotenv").config();

const API_KEY = process.env.GROQ_API_KEY;
const BASE_URL = process.env.GROQ_BASE_URL;
const MODEL = process.env.MODEL;

async function queryGroq(messages) {
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.3,
      max_tokens: 200,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Groq API error: ${res.status} ${text}`);
  }

  const data = await res.json();

  return {
    choices: data.choices,
    usage: data.usage || {},
  };
}

module.exports = { queryGroq };
