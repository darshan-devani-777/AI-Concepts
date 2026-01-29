import dotenv from "dotenv";
dotenv.config();

export function generateWhatsAppLink(message) {
  const number = process.env.WHATSAPP_NUMBER;
  if (!number) throw new Error("WHATSAPP_NUMBER not defined");
  if (!message) throw new Error("Message is empty");

  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
