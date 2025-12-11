const IORedis = require('ioredis');

const connection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost', 
  port: process.env.REDIS_PORT || 6379,
  maxRetriesPerRequest: null, // Critical for BullMQ
});

connection.on('connect', () => console.log('✅ Connected to Redis'));
connection.on('error', (err) => console.error('❌ Redis Error:', err));

module.exports = connection;