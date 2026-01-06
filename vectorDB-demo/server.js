import express from "express";
import "dotenv/config";
import documentRoutes from "./src/routes/documentRoutes.js";
import { initVectorDB } from "./src/models/vectoreStore.js";
import { connectMongo } from "./src/db/mongo.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use("/api/documents", documentRoutes);

await connectMongo();
await initVectorDB();

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
