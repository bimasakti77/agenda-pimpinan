/**
 * Simple in-memory cache middleware
 * Following modern web development standards
 */

class CacheManager {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes
  }

  set(key, value, ttl = this.defaultTTL) {
    const expiry = Date.now() + ttl;
    this.cache.set(key, { value, expiry });
  }

  get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  delete(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  // Get cache statistics
  getStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        expiredEntries++;
      } else {
        validEntries++;
      }
    }
    
    return {
      total: this.cache.size,
      valid: validEntries,
      expired: expiredEntries
    };
  }
}

const cacheManager = new CacheManager();

// Cache middleware for Express
const cache = (ttl = 5 * 60 * 1000) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = `${req.originalUrl}:${JSON.stringify(req.query)}`;
    const cached = cacheManager.get(key);

    if (cached) {
      return res.json(cached);
    }

    // Store original res.json
    const originalJson = res.json.bind(res);
    
    // Override res.json to cache the response
    res.json = function(data) {
      cacheManager.set(key, data, ttl);
      return originalJson(data);
    };

    next();
  };
};

// Cache invalidation helper
const invalidateCache = (pattern) => {
  const keys = Array.from(cacheManager.cache.keys());
  const regex = new RegExp(pattern);
  
  keys.forEach(key => {
    if (regex.test(key)) {
      cacheManager.delete(key);
      console.log(`[CACHE] INVALIDATED ${key}`);
    }
  });
};

module.exports = {
  cache,
  cacheManager,
  invalidateCache
};
