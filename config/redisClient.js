// redisClient.js
const { createClient } = require('redis');

const redisClient = createClient({
  url: process.env.REDIS_URL, // e.g., Upstash Redis URL
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

(async () => {
  await redisClient.connect();
})();

module.exports = redisClient;