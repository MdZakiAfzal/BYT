const IORedis = require('ioredis');

// Prioritize REDIS_URL if it exists (Render), otherwise fall back to localhost (Development)
const connection = process.env.REDIS_URL 
  ? new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null }) 
  : new IORedis({
      host: process.env.REDIS_HOST || 'localhost', 
      port: process.env.REDIS_PORT || 6379,
      maxRetriesPerRequest: null, 
    });

connection.on('connect', () => console.log('✅ Connected to Redis'));
connection.on('error', (err) => console.error('❌ Redis Error:', err));

module.exports = connection;