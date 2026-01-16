require("dotenv").config();
const axios = require("axios");

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:9090";
const API_KEY = process.env.API_GATEWAY_KEY || "your-api-key-here";

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Test 1: Add job to queue
 */
async function testAddJobToQueue() {
  log("\n📥 TEST 1: Adding job to queue", "cyan");
  log("=" .repeat(50), "bright");

  try {
    const response = await axios.post(
      `${BASE_URL}/api/chatGPT/queue`,
      {
        type: "SC",
        task: {
          type: "SC",
          sub_type: "summarizer.long",
          user_input: "Artificial intelligence is transforming the world in many ways.",
        },
        priority: 0,
        delay: 0,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
        },
      }
    );

    log("✅ Job added successfully!", "green");
    console.log(JSON.stringify(response.data, null, 2));
    return response.data.data.jobId;
  } catch (error) {
    log("❌ Failed to add job", "red");
    console.error(error.response?.data || error.message);
    return null;
  }
}

/**
 * Test 2: Get queue statistics
 */
async function testQueueStats() {
  log("\n📊 TEST 2: Getting queue statistics", "cyan");
  log("=" .repeat(50), "bright");

  try {
    const response = await axios.get(`${BASE_URL}/api/queue/stats`, {
      headers: {
        "x-api-key": API_KEY,
      },
    });

    log("✅ Queue stats retrieved!", "green");
    console.log(JSON.stringify(response.data, null, 2));
    return response.data.data;
  } catch (error) {
    log("❌ Failed to get queue stats", "red");
    console.error(error.response?.data || error.message);
    return null;
  }
}

/**
 * Test 3: Get DLQ statistics
 */
async function testDLQStats() {
  log("\n💀 TEST 3: Getting DLQ statistics", "cyan");
  log("=" .repeat(50), "bright");

  try {
    const response = await axios.get(`${BASE_URL}/api/dlq/stats`, {
      headers: {
        "x-api-key": API_KEY,
      },
    });

    log("✅ DLQ stats retrieved!", "green");
    console.log(JSON.stringify(response.data, null, 2));
    return response.data.data;
  } catch (error) {
    log("❌ Failed to get DLQ stats", "red");
    console.error(error.response?.data || error.message);
    return null;
  }
}

/**
 * Test 4: Get DLQ jobs
 */
async function testDLQJobs() {
  log("\n📋 TEST 4: Getting DLQ jobs", "cyan");
  log("=" .repeat(50), "bright");

  try {
    const response = await axios.get(`${BASE_URL}/api/dlq/jobs?limit=10`, {
      headers: {
        "x-api-key": API_KEY,
      },
    });

    log("✅ DLQ jobs retrieved!", "green");
    console.log(JSON.stringify(response.data, null, 2));
    return response.data.data;
  } catch (error) {
    log("❌ Failed to get DLQ jobs", "red");
    console.error(error.response?.data || error.message);
    return null;
  }
}

/**
 * Test 5: Add multiple jobs
 */
async function testAddMultipleJobs(count = 5) {
  log(`\n📦 TEST 5: Adding ${count} jobs to queue`, "cyan");
  log("=" .repeat(50), "bright");

  const jobIds = [];

  for (let i = 1; i <= count; i++) {
    try {
      const response = await axios.post(
        `${BASE_URL}/api/chatGPT/queue`,
        {
          type: "SC",
          task: {
            type: "SC",
            sub_type: "summarizer.long",
            user_input: `Test job ${i}: This is a test message for queue processing.`,
          },
          priority: 0,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "x-api-key": API_KEY,
          },
        }
      );

      jobIds.push(response.data.data.jobId);
      log(`  ✅ Job ${i} added: ${response.data.data.jobId}`, "green");
      await sleep(100); // Small delay between requests
    } catch (error) {
      log(`  ❌ Failed to add job ${i}`, "red");
      console.error(error.response?.data || error.message);
    }
  }

  log(`\n✅ Added ${jobIds.length}/${count} jobs`, "green");
  return jobIds;
}

/**
 * Test 6: Monitor queue processing
 */
async function testMonitorQueue(durationSeconds = 10) {
  log(`\n👀 TEST 6: Monitoring queue for ${durationSeconds} seconds`, "cyan");
  log("=" .repeat(50), "bright");

  const startTime = Date.now();
  const endTime = startTime + durationSeconds * 1000;

  while (Date.now() < endTime) {
    const stats = await testQueueStats();
    if (stats) {
      log(
        `  📊 Main Queue: ${stats.mainQueue.active} active, ${stats.mainQueue.waiting} waiting, ${stats.mainQueue.completed} completed`,
        "yellow"
      );
      log(
        `  💀 DLQ: ${stats.dlq.waiting} waiting, ${stats.dlq.active} active`,
        "yellow"
      );
    }
    await sleep(2000); // Check every 2 seconds
  }
}

/**
 * Test 7: Add job that will fail (for DLQ testing)
 */
async function testAddFailingJob() {
  log("\n💥 TEST 7: Adding job that will fail (for DLQ testing)", "cyan");
  log("=" .repeat(50), "bright");

  try {
    // Use invalid type to trigger failure
    const response = await axios.post(
      `${BASE_URL}/api/chatGPT/queue`,
      {
        type: "INVALID_TYPE",
        task: {
          type: "INVALID_TYPE",
          sub_type: "test",
          user_input: "This job will fail and go to DLQ",
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
        },
      }
    );

    log("✅ Failing job added!", "yellow");
    log(`   Job ID: ${response.data.data.jobId}`, "yellow");
    log("   This job will fail after retries and move to DLQ", "yellow");
    return response.data.data.jobId;
  } catch (error) {
    log("❌ Failed to add failing job", "red");
    console.error(error.response?.data || error.message);
    return null;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  log("\n🚀 Starting Queue System Tests", "bright");
  log("=" .repeat(50), "bright");
  log(`Base URL: ${BASE_URL}`, "blue");
  log(`API Key: ${API_KEY.slice(0, 20)}...`, "blue");

  // Test 1: Add a job
  const jobId = await testAddJobToQueue();
  await sleep(1000);

  // Test 2: Check queue stats
  await testQueueStats();
  await sleep(1000);

  // Test 3: Check DLQ stats
  await testDLQStats();
  await sleep(1000);

  // Test 4: Check DLQ jobs
  await testDLQJobs();
  await sleep(2000);

  // Test 5: Add multiple jobs
  await testAddMultipleJobs(3);
  await sleep(2000);

  // Test 6: Monitor queue
  log("\n⏳ Waiting for jobs to process...", "yellow");
  await testMonitorQueue(15);

  // Test 7: Add failing job for DLQ
  await testAddFailingJob();
  log("\n⏳ Waiting for failing job to process and move to DLQ...", "yellow");
  await sleep(10000); // Wait for retries

  // Final stats
  log("\n📊 FINAL STATISTICS", "bright");
  log("=" .repeat(50), "bright");
  await testQueueStats();
  await testDLQStats();
  await testDLQJobs();

  log("\n✅ All tests completed!", "green");
}

// Run tests
runTests().catch((error) => {
  log("\n❌ Test suite failed", "red");
  console.error(error);
  process.exit(1);
});

