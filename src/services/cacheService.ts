import redisClient from '../config/redis';

const CACHE_TTL = 3600; // 1 hour in seconds

export class CacheService {
  /**
   * Get data from cache
   * @param key Cache key
   * @returns Cached data or null
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set data in cache
   * @param key Cache key
   * @param value Data to cache
   * @param ttl Time to live in seconds (optional)
   */
  static async set(key: string, value: any, ttl: number = CACHE_TTL): Promise<void> {
    try {
      const stringValue = JSON.stringify(value);
      await redisClient.set(key, stringValue, 'EX', ttl);
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  /**
   * Delete data from cache
   * @param key Cache key
   */
  static async del(key: string): Promise<void> {
    try {
      await redisClient.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  /**
   * Delete multiple keys from cache
   * @param pattern Key pattern to match
   */
  static async delByPattern(pattern: string): Promise<void> {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
    } catch (error) {
      console.error('Cache delete pattern error:', error);
    }
  }
} 