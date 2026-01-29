import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

export async function groqStreamChat(prompt, onData) {
  const response = await axios({
    method: "POST",
    url: "https://api.groq.com/openai/v1/chat/completions",
    responseType: "stream",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    data: {
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 500,
      stream: true,
    },
  });

  const stream = response.data;

  stream.on("data", (chunk) => {
    const str = chunk.toString();
    str.split("\n").forEach((line) => {
      if (!line.trim()) return;
      try {
        const json = JSON.parse(line);
        if (json.type === "response.output_text.delta") {
          onData(json.delta);
        }
      } catch (e) {
      }
    });
  });

  return new Promise((resolve) => {
    stream.on("end", resolve);
  });
}
