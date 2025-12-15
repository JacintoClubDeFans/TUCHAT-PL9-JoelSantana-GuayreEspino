const Redis = require("ioredis");

let redis = null;

function getRedis() {
  if (!redis) {
    redis = new Redis({
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: Number(process.env.REDIS_PORT || 6379),
      maxRetriesPerRequest: 3,
    });

    redis.on("error", (err) => {
      console.error("Redis error:", err.message);
    });
  }
  return redis;
}

module.exports = { getRedis };
