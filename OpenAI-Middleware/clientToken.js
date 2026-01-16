require("dotenv").config();
const crypto = require("crypto");

const secretKey = process.env.SC_CRYPTO_SECRET_KEY;
const ivKey = process.env.SC_CRYPTO_IV;
const algorithm = process.env.CRYPTO_ALGORITHM;

function encrypt(data, secretKey, ivKey, algorithm) {
  try {
    const key = crypto.createSecretKey(Buffer.from(secretKey, "utf8"));
    const iv = Buffer.from(ivKey, "utf8");
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(data, "utf8", "base64");
    encrypted += cipher.final("base64");
    return encrypted;
  } catch (error) {
    console.error("Encryption error:", error);
    return null;
  }
}

const data = {
  secret_key: secretKey,
  iv_key: ivKey,
  task: {
    type: "SC",
    sub_type: "summarizer.short",
    user_input: "Technology is changing the world.",
  },
};

const token = encrypt(JSON.stringify(data), secretKey, ivKey, algorithm);

console.log("Encrypted Token:", token);
