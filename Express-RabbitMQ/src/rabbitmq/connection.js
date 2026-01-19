const amqp = require("amqplib");
const config = require("../config/rabbitmq");

let channel;

async function connectRabbitMQ() {
  if (channel) return channel;

  const connection = await amqp.connect(config.url);
  channel = await connection.createChannel();

  await channel.assertQueue(config.dlq, { durable: true });

  await channel.assertQueue(config.queue, {
    durable: true,
    deadLetterExchange: "",
    deadLetterRoutingKey: config.dlq,
  });

  console.log(
    `[RabbitMQ] Connected
     ├─ Main Queue : ${config.queue}
     └─ DLQ        : ${config.dlq}`
  );

  return channel;
}

module.exports = connectRabbitMQ;
