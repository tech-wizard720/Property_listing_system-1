import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || "rediss://default:AXjlAAIjcDE4MDcwNzAzZTA4Zjk0NTUxOTQ2NzA3NDgxNGYxNGMyMnAxMA@elegant-poodle-30949.upstash.io:6379";

const redisClient = new Redis(REDIS_URL);

redisClient.on('error', (err) => console.error('Redis Client Error:', err));
redisClient.on('connect', () => console.log('Redis Client Connected'));

export default redisClient; 