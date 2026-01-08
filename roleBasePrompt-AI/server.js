const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();
const connectDB = require('./src/config/db');
const aiRoutes = require('./src/routes/ai');
const requestLogger = require('./src/middleware/requestLogger');

const app = express();
app.use(bodyParser.json());
app.use(requestLogger);

connectDB();

app.use('/api/ai', aiRoutes);

app.listen(process.env.PORT || 3000, () => {
  console.log(`🚀 Server running on port http://localhost:${process.env.PORT || 3000}`);
});
