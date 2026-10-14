const { cacheGet, cacheSet, TTL_DEFAULTS } = require('../config/cache');

/**
 * Cache middleware generator
 * @param {string} prefix - Key namespace prefix (e.g., 'dashboard:stats')
 * @param {number} [ttl] - Time-to-live in seconds
 */
function cacheMiddleware(prefix = 'cache', ttl = TTL_DEFAULTS.STATS) {
  return async (req, res, next) => {
    // Caching is only applied to GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = `${prefix}:${req.originalUrl || req.url}`;

    try {
      const cached = await cacheGet(key);
      if (cached !== null && cached !== undefined) {
        res.setHeader('X-Cache', 'HIT');
        return res.status(200).json(cached);
      }
    } catch (err) {
      console.warn(`[CacheMiddleware] Cache lookup error for ${key}:`, err.message);
    }

    // On cache miss, mark MISS header and hook res.json to capture response
    res.setHeader('X-Cache', 'MISS');

    const originalJson = res.json.bind(res);
    res.json = (data) => {
      // Only cache successful 200 responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cacheSet(key, data, ttl).catch((err) => {
          console.warn(`[CacheMiddleware] Cache set error for ${key}:`, err.message);
        });
      }
      return originalJson(data);
    };

    next();
  };
}

module.exports = cacheMiddleware;
