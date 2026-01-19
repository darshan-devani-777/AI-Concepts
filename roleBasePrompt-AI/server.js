const express = require("express");
const bodyParser = require("body-parser");
require("dotenv").config();
const connectDB = require("./src/config/db");
const aiRoutes = require("./src/routes/ai");
const requestLogger = require("./src/middleware/requestLogger");
const aiPdfAutoConvert = require("./src/routes/aipdfAutoConvert");
const fileToPdfRoutes = require("./src/routes/fileToPdf");
const path = require("path");

const app = express();
app.use(bodyParser.json());

// -------- STATIC FILE PREVIEW ROUTES --------
app.use("/ppt", express.static(path.join(__dirname, "uploads/ppt")));
app.use("/docx", express.static(path.join(__dirname, "uploads/docx")));
app.use("/xlsx", express.static(path.join(__dirname, "uploads/xlsx")));

// PDF PREVIEW
app.use("/pdf-preview", express.static(path.join(__dirname, "uploads/pdf")));

app.use(express.static(path.join(__dirname, "public")));
app.use(requestLogger);

connectDB();

// -------- API ROUTES --------
app.use("/api/ai", aiRoutes);
app.use("/api/ai", aiPdfAutoConvert);
app.use("/api/convert", fileToPdfRoutes);

app.listen(process.env.PORT || 3000, () => {
  console.log(
    `🚀 Server running on http://localhost:${process.env.PORT || 3000}`
  );
});
