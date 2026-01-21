const { kafka, TOPICS } = require('./src/config/kafka');
const { logSystem } = require('./src/utils/log');

async function checkStoredEvents() {
  const consumer = kafka.consumer({ groupId: 'event-checker-group' });

  try {
    logSystem('EVENT_CHECK_START', { message: 'Checking stored events in Kafka topics' });

    await consumer.connect();

    await consumer.subscribe({ topic: TOPICS.MESSAGES, fromBeginning: true });
    await consumer.subscribe({ topic: TOPICS.NOTIFICATIONS, fromBeginning: true });

    logSystem('SUBSCRIBED', { topics: `${TOPICS.MESSAGES}, ${TOPICS.NOTIFICATIONS}` });

    let messageCount = 0;
    const events = [];

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        messageCount++;

        const eventData = {
          topic,
          partition,
          offset: message.offset,
          key: message.key?.toString(),
          timestamp: new Date(parseInt(message.timestamp)).toISOString(),
          value: JSON.parse(message.value.toString())
        };

        events.push(eventData);

        console.log(`📦 Event #${messageCount}:`);
        console.log(`   Topic: ${topic}`);
        console.log(`   Key: ${eventData.key}`);
        console.log(`   Offset: ${eventData.offset}`);
        console.log(`   Timestamp: ${eventData.timestamp}`);
        console.log(`   Type: ${eventData.value.type}`);
        console.log(`   Content: ${JSON.stringify(eventData.value, null, 2)}`);
        console.log('   ──────────────────────────────────');
      },
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    await consumer.disconnect();

    logSystem('EVENT_CHECK_COMPLETE', {
      totalEvents: messageCount,
      topics: `${TOPICS.MESSAGES}, ${TOPICS.NOTIFICATIONS}`
    });

    console.log(`\n✅ Total Events Found: ${messageCount}`);
    console.log('📊 Summary by Topic:');

    const topicSummary = events.reduce((acc, event) => {
      acc[event.topic] = (acc[event.topic] || 0) + 1;
      return acc;
    }, {});

    Object.entries(topicSummary).forEach(([topic, count]) => {
      console.log(`   ${topic}: ${count} events`);
    });

  } catch (error) {
    logSystem('EVENT_CHECK_ERROR', { error: error.message });
    console.error('❌ Error checking events:', error.message);
  }
}

if (require.main === module) {
  checkStoredEvents().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = checkStoredEvents;
