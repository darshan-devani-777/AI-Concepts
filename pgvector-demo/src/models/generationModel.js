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
  console.log("↳ context_chars:", context.length);
  console.log("↳ question_chars:", question.length);

  const start = Date.now();
  const gen = await getGenerator();

  const output = await gen(
    `Context: ${context}\nQuestion: ${question}\nAnswer:`,
    { max_new_tokens: 64 }
  );

  console.log("↳ tokens_generated:", output[0].generated_text.length);
  console.log("↳ time_ms:", Date.now() - start);
  console.log("↳ status: done");

  return output[0].generated_text.trim();
}

