import Redis from "ioredis";
import dotenv from "dotenv";
dotenv.config();

let redis = null;

export function getRedis() { 
  if (!redis) {
    redis = new Redis({
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: Number(process.env.REDIS_PORT || 6379),
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        if (times > 3) return null; 
        return delay;
      },
    });

    redis.on("error", (err) => {
      console.error("Redis error:", err.message);
    });
  }
  return redis;
}