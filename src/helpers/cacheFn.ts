/*
 * https://github.com/morethanwords/tweb
 * Copyright (C) 2019-2021 Eduard Kuzmenko
 * https://github.com/morethanwords/tweb/blob/master/LICENSE
 */

import ctx from '../environment/ctx';

type CacheFunction = (...args: any[]) => any;
const cache: Map<CacheFunction, {result: any, timeout: number}> = new Map();

export default function cacheFn<T, A extends any[], R>(fn: (this: T, ...args: A) => R, thisArg?: T, ...args: A): R {
  let cached = cache.get(fn);
  if(cached) {
    return cached.result;
  }

  const result = fn.apply(thisArg as any, args as any);

  cache.set(fn, cached = {
    result,
    timeout: ctx.setTimeout(() => {
      cache.delete(fn);
    }, 60000)
  });

  return result;
}
