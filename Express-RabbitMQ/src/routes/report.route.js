const express = require('express');
const publishReport = require('../rabbitmq/producer');

const router = express.Router();

router.post('/reports', async (req, res) => {
  await publishReport(req.body.type || 'SALES');

  res.status(202).json({
    message:"Message Queue successfully",
    status: 'QUEUED'
  });
});

module.exports = router;
