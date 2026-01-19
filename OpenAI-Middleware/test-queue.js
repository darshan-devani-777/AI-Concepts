require("dotenv").config();
const axios = require("axios");

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:9090";
const API_KEY = process.env.API_GATEWAY_KEY || "your-api-key-here";

/* =======================
   COLOR LOGGER
======================= */

const COLORS = {
  reset: "\x1b[0m",
  step: "\x1b[36m",     // cyan
  api: "\x1b[34m",      // blue
  success: "\x1b[32m",  // green
  error: "\x1b[31m",    // red
  info: "\x1b[33m",     // yellow
};

function stepLog(step, msg) {
  console.log(`\n${COLORS.step}[STEP ${step}] ${msg}${COLORS.reset}`);
}

function apiLog(name, method, url) {
  console.log(`${COLORS.api}  -> API: ${name} | ${method} ${url}${COLORS.reset}`);
}

function successLog(msg) {
  console.log(`${COLORS.success}  ✓ SUCCESS: ${msg}${COLORS.reset}`);
}

function errorLog(msg) {
  console.log(`${COLORS.error}  ✗ ERROR: ${msg}${COLORS.reset}`);
}

function infoLog(msg) {
  console.log(`${COLORS.info}  ℹ INFO: ${msg}${COLORS.reset}`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* =======================
   TEST CASES
======================= */

/** STEP 1: Add Normal Job */
async function testAddJobToQueue() {
  stepLog(1, "Add Job to Queue");

  const url = `${BASE_URL}/api/chatGPT/queue`;
  apiLog("Add Job", "POST", url);

  try {
    const res = await axios.post(
      url,
      {
        type: "SC",
        task: {
          type: "SC",
          sub_type: "summarizer.long",
          user_input: "AI is transforming the world",
        },
        priority: 0,
      },
      { headers: { "x-api-key": API_KEY } }
    );

    successLog(`Job added | jobId=${res.data.data.jobId}`);
    return res.data.data.jobId;
  } catch (err) {
    errorLog("Failed to add job");
    console.log(err.response?.data || err.message);
  }
}

/** STEP 2: Queue Stats */
async function testQueueStats() {
  stepLog(2, "Fetch Queue Stats");

  const url = `${BASE_URL}/api/queue/stats`;
  apiLog("Queue Stats", "GET", url);

  try {
    const res = await axios.get(url, {
      headers: { "x-api-key": API_KEY },
    });

    const q = res.data.data.mainQueue;
    successLog(
      `waiting=${q.waiting}, active=${q.active}, completed=${q.completed}`
    );
  } catch (err) {
    errorLog("Failed to fetch queue stats");
  }
}

/** STEP 3: DLQ Jobs */
async function testDLQJobs() {
  stepLog(3, "Fetch DLQ Jobs");

  const url = `${BASE_URL}/api/dlq/jobs?limit=10`;
  apiLog("DLQ Jobs", "GET", url);

  try {
    const res = await axios.get(url, {
      headers: { "x-api-key": API_KEY },
    });

    const jobs =
      res.data?.data?.jobs ||
      res.data?.data ||
      res.data?.jobs ||
      [];

    successLog(`DLQ jobs count = ${jobs.length}`);
  } catch (err) {
    errorLog("Failed to fetch DLQ jobs");
    console.log(err.response?.data || err.message);
  }
}

/** STEP 4: Add FAILING Job (Worker-level failure) */
async function testAddFailingJob() {
  stepLog(4, "Add FAILING Job (DLQ Test)");

  const url = `${BASE_URL}/api/chatGPT/queue`;
  apiLog("Failing Job", "POST", url);

  try {
    const res = await axios.post(
      url,
      {
        type: "SC", // VALID
        task: {
          type: "SC",
          sub_type: "force_fail", // worker must throw on this
          user_input: "This job should fail inside worker",
        },
      },
      { headers: { "x-api-key": API_KEY } }
    );

    successLog(`Failing job accepted | jobId=${res.data.data.jobId}`);
    infoLog("Expected flow: worker fail → retries → DLQ");
    return res.data.data.jobId;
  } catch (err) {
    errorLog("Failing job API rejected (should not happen)");
    console.log(err.response?.data || err.message);
  }
}

/* =======================
   MAIN RUNNER
======================= */

async function runTests() {
  console.log(
    `${COLORS.step}==== QUEUE SYSTEM TEST STARTED ====${COLORS.reset}`
  );
  console.log(`${COLORS.info}Base URL: ${BASE_URL}${COLORS.reset}`);

  await testAddJobToQueue();
  await sleep(1000);

  await testQueueStats();
  await sleep(1000);

  await testDLQJobs();
  await sleep(1000);

  await testAddFailingJob();
  infoLog("Waiting for retries & DLQ movement...");
  await sleep(10000);

  await testQueueStats();
  await testDLQJobs();

  console.log(
    `\n${COLORS.success}==== TESTS COMPLETED ====${COLORS.reset}`
  );
}

runTests().catch((err) => {
  console.log(`${COLORS.error}TEST SUITE FAILED${COLORS.reset}`);
  console.error(err);
  process.exit(1);
});
