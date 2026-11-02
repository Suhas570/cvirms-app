/**
 * CVIRMS Dual-Tier Caching Service
 * Tier 1: In-Memory cache via cache-minimal (Default for development)
 * Tier 2: Redis Client (Fallback/Enterprise when REDIS_URL is configured)
 */

const { CacheManager } = require('cache-minimal');
const redis = require('redis');

// Default TTL configurations (in seconds)
const TTL_DEFAULTS = {
  STATS: 60,
  RECENT_VISITORS: 30,
  ACTIVITY: 120,
};

// Tier 1: In-Memory Cache Instance
const memoryCache = new CacheManager();

// Tier 2: Optional Redis Client
let redisClient = null;
let redisConnected = false;

if (process.env.REDIS_URL) {
  try {
    redisClient = redis.createClient({ url: process.env.REDIS_URL });

    redisClient.on('connect', () => {
      console.log('[Cache] Connected to Redis server successfully');
      redisConnected = true;
    });

    redisClient.on('error', (err) => {
      console.warn('[Cache] Redis error, falling back to in-memory cache:', err.message);
      redisConnected = false;
    });

    redisClient.connect().catch((err) => {
      console.warn('[Cache] Redis initial connection failed, using in-memory store:', err.message);
      redisConnected = false;
    });
  } catch (err) {
    console.warn('[Cache] Could not initialize Redis client, using in-memory store:', err.message);
    redisConnected = false;
  }
}

/**
 * Retrieve value from cache
 * @param {string} key 
 * @returns {Promise<any|null>}
 */
async function cacheGet(key) {
  if (redisConnected && redisClient) {
    try {
      const raw = await redisClient.get(key);
      if (raw !== null) {
        return JSON.parse(raw);
      }
    } catch (err) {
      console.warn(`[Cache] Redis get failed for key "${key}", falling back to memory:`, err.message);
    }
  }

  try {
    const val = await memoryCache.get(key);
    return val !== undefined ? val : null;
  } catch (err) {
    console.error(`[Cache] Memory get failed for key "${key}":`, err.message);
    return null;
  }
}

/**
 * Store value in cache with TTL
 * @param {string} key 
 * @param {any} value 
 * @param {number} ttlSeconds 
 * @returns {Promise<void>}
 */
async function cacheSet(key, value, ttlSeconds = TTL_DEFAULTS.STATS) {
  if (redisConnected && redisClient) {
    try {
      await redisClient.set(key, JSON.stringify(value), { EX: ttlSeconds });
    } catch (err) {
      console.warn(`[Cache] Redis set failed for key "${key}":`, err.message);
    }
  }

  try {
    await memoryCache.set(key, value, ttlSeconds);
  } catch (err) {
    console.error(`[Cache] Memory set failed for key "${key}":`, err.message);
  }
}

/**
 * Invalidate/delete key from cache
 * @param {string} key 
 * @returns {Promise<void>}
 */
async function cacheDel(key) {
  if (redisConnected && redisClient) {
    try {
      await redisClient.del(key);
    } catch (err) {
      console.warn(`[Cache] Redis del failed for key "${key}":`, err.message);
    }
  }

  try {
    await memoryCache.delete(key);
  } catch (err) {
    console.error(`[Cache] Memory del failed for key "${key}":`, err.message);
  }
}

module.exports = {
  cacheGet,
  cacheSet,
  cacheDel,
  TTL_DEFAULTS,
  isRedisConnected: () => redisConnected,
};
