export default class LRUCache<K, V> {
  private cache = new Map<K, V>();
  constructor(private maxSize = 100) {}

  has(key: K): boolean {
    if(!this.cache.has(key)) {
      return false;
    }
    const value = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, value);
    return true;
  }

  get(key: K): V | undefined {
    if(this.has(key)) {
      return this.cache.get(key);
    }
    return undefined;
  }

  set(key: K, value: V): void {
    if(this.cache.has(key)) {
      this.cache.delete(key);
    }
    this.cache.set(key, value);
    if(this.cache.size > this.maxSize) {
      const oldestKey = this.cache.keys().next().value as K;
      this.cache.delete(oldestKey);
    }
  }

  delete(key: K): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}
