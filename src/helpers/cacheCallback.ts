type CacheOptions = {
  maxSize?: number;
  ttl?: number;
};

/**
 * Creates a memoized version of the given callback using an LRU cache.
 * Cached values are stored in a Map with optional TTL and size limit.
 * Returned function includes a `clear` method to empty the cache manually.
 */
function cacheCallback<A, T>(callback: (value: A) => T, options: CacheOptions = {}) {
  const {maxSize = 100, ttl} = options;
  const cache = new Map<A, {value: T; expires?: number}>();

  const memoized = ((value: A): T => {
    const now = Date.now();
    const cached = cache.get(value);
    if(cached) {
      if(!cached.expires || cached.expires > now) {
        cache.delete(value);
        cache.set(value, cached);
        return cached.value;
      }
      cache.delete(value);
    }

    const result = callback(value);
    const expires = ttl ? now + ttl : undefined;
    cache.set(value, {value: result, expires});
    if(cache.size > maxSize) {
      const oldestKey = cache.keys().next().value;
      cache.delete(oldestKey);
    }
    return result;
  }) as ((value: A) => T) & {clear: () => void};

  memoized.clear = () => cache.clear();

  return memoized;
}

export default cacheCallback;

