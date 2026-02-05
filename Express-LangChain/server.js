const express = require('express');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const chatRoutes = require('./src/routes/chatRoutes');

dotenv.config();

const app = express();
app.use(cookieParser());

app.use(express.json());

app.use('/api/chat', chatRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
