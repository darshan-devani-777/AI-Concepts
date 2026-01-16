require("dotenv").config();
const { encrypt } = require("./src/models/encryptDecrypt");

const secretKey = process.env.SC_CRYPTO_SECRET_KEY;
const ivKey = process.env.SC_CRYPTO_IV;
const algorithm = process.env.CRYPTO_ALGORITHM;

const GROQ_API_KEY = process.env.GROQ_API_KEY;

const encrypted = encrypt(
  GROQ_API_KEY,
  secretKey,
  ivKey,
  algorithm
);

if (!encrypted.status) {
  console.error("Encryption failed:", encrypted.message);
  process.exit(1);
}

console.log("ENCRYPTED_GROQ_API_KEY:\n", encrypted.data);
