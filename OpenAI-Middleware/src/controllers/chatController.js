require("dotenv").config();
const Groq = require("groq-sdk");
const { decrypt } = require("../models/encryptDecrypt");
const { getPrompt } = require("./getPrompts");

console.log("🔍 ENV CHECK:", {
  SC: !!process.env.SC_GROQ_API_KEY_ENCRYPTED,
  TB: !!process.env.TB_GROQ_API_KEY_ENCRYPTED,
});

const algorithm = process.env.CRYPTO_ALGORITHM;

/* ================= STREAM FUNCTION ================= */

async function streamGroqResponse(prompt, apiKey, res) {
  console.log("🚀 Groq Streaming Started");

  const groq = new Groq({ apiKey });

  const stream = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    max_tokens: 500,
    stream: true,
  });

  let tokenCount = 0;
  let fullResponse = "";

  for await (const chunk of stream) {
    const token = chunk.choices[0]?.delta?.content;

    if (token) {
      tokenCount++;
      fullResponse += token;

      console.log(`🧩 Stream Token ${tokenCount}:`, token);
      res.write(`data: ${token}\n\n`);
    }
  }

  console.log("✅ Groq Streaming Finished");
  console.log(`📊 Total Streamed Tokens: ${tokenCount}\n`);

  console.log("🔓 Streamed Response (Final Verify):", {
    response: fullResponse,
  });

  res.write(
    `data: ${JSON.stringify({
      type: "final",
      response: fullResponse,
    })}\n\n`
  );

  res.write("data: [DONE]\n\n");
  res.end();

  return fullResponse;
}

/* ================= CONTROLLER ================= */

const chatController = {
  async handleChatRequest(req, res) {
    try {
      console.log("\n===== NEW CHAT REQUEST =====\n");

      console.log("➡️ Request Body:", {
        type: req.body.type || req.body?.task?.type,
        tokenPreview: req.body.token
          ? req.body.token.slice(0, 30) + "..."
          : "RAW_MODE",
      });

      /* ---------- AUTO TYPE DETECT ---------- */
      const token = req.body.token;
      const type = req.body.type || req.body?.task?.type;

      if (!type) {
        throw new Error("Task type is missing (encrypted or raw)");
      }

      /* ---------- CRYPTO CONFIG ---------- */
      const secretKey = process.env[`${type}_CRYPTO_SECRET_KEY`];
      const ivKey = process.env[`${type}_CRYPTO_IV`];
      const encryptedApiKey = process.env[`${type}_GROQ_API_KEY_ENCRYPTED`];

      console.log("🔑 Crypto Config:", {
        algorithm,
        secretKeyLength: secretKey?.length || "RAW_MODE",
        iv: ivKey || "RAW_MODE",
      });

      /* ---------- API KEY ---------- */
      console.log("🔓 Groq API Key Decryption:", {
        encryptedPreview: encryptedApiKey
          ? encryptedApiKey.slice(0, 25) + "..."
          : "NOT_FOUND",
      });

      const decryptedApiKey = decrypt(
        encryptedApiKey,
        secretKey,
        ivKey,
        algorithm
      );

      console.log("✅ Groq API Key Decrypted:", {
        preview: decryptedApiKey.data.slice(0, 12) + "...",
      });

      /* ---------- TOKEN / RAW AUTO-DETECT ---------- */
      let tokenData;

      // 🔐 Encrypted request
      if (token) {
        console.log("🔓 Token Decryption:", {
          encryptedPreview: token.slice(0, 30) + "...",
        });

        const decryptedToken = decrypt(token, secretKey, ivKey, algorithm);

        console.log("✅ Token Decrypted:", {
          decryptedToken: decryptedToken.data,
        });

        tokenData = JSON.parse(decryptedToken.data);
      }

      // RAW POSTMAN REQUEST
      else {
        console.log("🧪 RAW MODE AUTO-DETECTED (Postman)");

        tokenData = {
          task: req.body.task,
        };

        console.log("✅ Token Decrypted:", {
          decryptedToken: JSON.stringify(tokenData),
        });
      }

      const {
        task: { type: taskType, sub_type, user_input },
      } = tokenData;

      console.log("📦 Parsed Token Data:", {
        taskType,
        sub_type,
        user_input,
      });

      /* ---------- PROMPT ---------- */
      const prompt = await getPrompt(taskType, sub_type, user_input);

      console.log("🧩 Generated Prompt:", {
        prompt,
        length: prompt.length,
      });

      console.log(`📏 Prompt Length: ${prompt.length}\n`);

      /* ---------- SSE ---------- */
      console.log("📡 Initializing SSE Stream");

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();

      /* ---------- GROQ STREAM ---------- */
      const finalResponse = await streamGroqResponse(
        prompt,
        decryptedApiKey.data,
        res
      );

      console.log(
        "🧠 AI Response length:",
        { length: finalResponse.length },
        "\n"
      );

      console.log("===== REQUEST END =====\n");
    } catch (error) {
      console.error("❌ SERVER ERROR:", error.message);
      return res.status(500).json({
        status: false,
        message: error.message,
      });
    }
  },
};

module.exports = chatController;
