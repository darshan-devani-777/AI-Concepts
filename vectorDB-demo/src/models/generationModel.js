import { pipeline } from "@xenova/transformers";

let generator;

async function getGenerator() {
  if (!generator) {
    generator = await pipeline("text2text-generation", "Xenova/flan-t5-small");
    console.log("🤖 Generator model ready");
  }
  return generator;
}

export async function generateAnswer(context, question) {
  console.log("\n🤖 GENERATION");

  const gen = await getGenerator();
  console.log("  ↳ model: flan-t5-small");

  const output = await gen(
    `Context: ${context}\nQuestion: ${question}\nAnswer:`,
    { max_new_tokens: 64 }
  );

  console.log("  ↳ status: done");

  return output[0].generated_text.trim();
}
