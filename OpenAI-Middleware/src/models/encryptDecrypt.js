const crypto = require("crypto");

function encrypt(data, tokenKey, tokenIV, algorithm) {
  try {
    const key = crypto.createSecretKey(Buffer.from(tokenKey, "utf8"));
    const iv = Buffer.from(tokenIV, "utf8");
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(data, "utf8", "base64");
    encrypted += cipher.final("base64");
    return { status: true, data: encrypted };
  } catch (error) {
    return { status: false, message: error.message };
  }
}

function decrypt(token, tokenKey, tokenIV, algorithm) {
  try {
    const key = crypto.createSecretKey(Buffer.from(tokenKey, "utf8"));
    const iv = Buffer.from(tokenIV, "utf8");
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(token, "base64", "utf8");
    decrypted += decipher.final("utf8");
    return { status: true, data: decrypted };
  } catch (error) {
    return { status: false, message: error.message };
  }
}

module.exports = { encrypt, decrypt };
