import express from "express";
import "dotenv/config";
import documentRoutes from "./src/routes/documentRoutes.js";
import { connectPostgres } from "./src/db/postgres.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use("/api/documents", documentRoutes);

await connectPostgres();

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
