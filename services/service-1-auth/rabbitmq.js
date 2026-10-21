const amqp = require('amqplib');

let channel = null;
const EXCHANGE_NAME = 'parksmart_events';

async function initRabbitMQ() {
  const amqpUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
  try {
    const connection = await amqp.connect(amqpUrl);
    channel = await connection.createChannel();
    await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
    console.log(`[Service 1 - Auth] Connected to RabbitMQ at ${amqpUrl}`);
  } catch (err) {
    console.warn(`[Service 1 - Auth] RabbitMQ not reachable (${err.message}). Using in-memory fallback.`);
  }
}

async function publishEvent(routingKey, data) {
  const payload = Buffer.from(JSON.stringify({ ...data, timestamp: new Date().toISOString() }));
  if (channel) {
    channel.publish(EXCHANGE_NAME, routingKey, payload);
    console.log(`[Service 1 - Auth] Published event '${routingKey}'`);
  } else {
    console.log(`[Service 1 - Auth] In-Memory event simulated: '${routingKey}'`);
  }
}

module.exports = { initRabbitMQ, publishEvent };
