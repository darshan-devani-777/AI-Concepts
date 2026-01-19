const express = require('express');
const reportRoute = require('./routes/report.route');

const app = express();
app.use(express.json());

app.use('/api', reportRoute);

app.listen(7000, () => {
  console.log('[API] Server start at http://localhost:7000');
});
