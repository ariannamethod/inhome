import {expect, test, vi} from 'vitest';
import cacheCallback from '../helpers/cacheCallback';

test('evicts least recently used value when max size exceeded', () => {
  const spy = vi.fn((x: number) => x * 2);
  const cached = cacheCallback(spy, {maxSize: 2});

  cached(1);
  cached(2);
  cached(1); // 1 becomes most recently used
  cached(3); // evicts key 2

  expect(spy).toHaveBeenCalledTimes(3);

  cached(2); // key 2 was evicted, so callback runs again
  expect(spy).toHaveBeenCalledTimes(4);
});

test('evicts value after ttl expires', () => {
  vi.useFakeTimers();
  const spy = vi.fn((x: number) => x + 1);
  const cached = cacheCallback(spy, {ttl: 100});

  cached(1);
  expect(spy).toHaveBeenCalledTimes(1);

  vi.advanceTimersByTime(50);
  cached(1);
  expect(spy).toHaveBeenCalledTimes(1);

  vi.advanceTimersByTime(51);
  cached(1);
  expect(spy).toHaveBeenCalledTimes(2);
  vi.useRealTimers();
});

test('clear method removes stored values', () => {
  const spy = vi.fn((x: number) => x);
  const cached = cacheCallback(spy);

  cached(1);
  expect(spy).toHaveBeenCalledTimes(1);

  cached.clear();
  cached(1);
  expect(spy).toHaveBeenCalledTimes(2);
});

