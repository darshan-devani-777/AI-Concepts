import express from "express";
import dotenv from "dotenv";
import { generateDailyMessage } from "./src/ai/generateMessage.js";
import { generateWhatsAppLink } from "./src/links/generateLink.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

async function streamDailyMessage(message, res) {
  console.log("🚀 Streaming Started...");
  let tokenCount = 0;
  let fullResponse = "";

  const tokens = message.split(/(\s+)/);

  for (const token of tokens) {
    tokenCount++;
    fullResponse += token;

    console.log(`🧩 Stream Token ${tokenCount}:`, token);

    if (res) {
      res.write(`data: ${token}\n\n`);
    }
  }

  console.log("✅ Streaming Finished.");
  console.log(`📊 Total Streamed Tokens: ${tokenCount}`);
  console.log("🔓 Streamed Response (Final Verify):", { response: fullResponse });

  if (res) {
    res.write(
      `data: ${JSON.stringify({ type: "final", response: fullResponse })}\n\n`
    );
    res.write("data: [DONE]\n\n");
    res.end();
  }

  return fullResponse;
}

app.get("/api/daily-message", async (req, res) => {
  try {
    console.log("🌟 API Hit: Generating daily message...");

    const message = await generateDailyMessage();
    if (!message) throw new Error("No message generated");

    const streamedMessage = await streamDailyMessage(message, res);

    const waLink = generateWhatsAppLink(streamedMessage);

    const finalResponse = {
      dailyMessage: streamedMessage,
      whatsappLink: waLink,
      timestamp: new Date().toISOString(),
      htmlButton: `<a href="${waLink}" target="_blank" style="text-decoration:none; background-color:#25D366; color:white; padding:12px 20px; border-radius:8px; font-weight:bold; display:inline-block;">Order on WhatsApp 🟢</a>`
    };

    console.log("\n📦 JSON Output:", finalResponse);

  } catch (err) {
    console.error("❌ Error in API:", err.message);
    if (!res.headersSent) res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
