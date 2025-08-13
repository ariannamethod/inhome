/*
 * https://github.com/morethanwords/tweb
 * Copyright (C) 2019-2021 Eduard Kuzmenko
 * https://github.com/morethanwords/tweb/blob/master/LICENSE
 */

import onMediaLoad from '../onMediaLoad';

// import { getHeavyAnimationPromise } from "../../hooks/useHeavyAnimationCheck";

import LRUCache from '../lruCache';

export const loadedURLs = new LRUCache<string, true>(100);
export const purgeLoadedUrl = (url: string) => loadedURLs.delete(url);
const set = (elem: HTMLElement | HTMLImageElement | SVGImageElement | HTMLVideoElement, url: string) => {
  if(elem instanceof HTMLImageElement || elem instanceof HTMLVideoElement) elem.src = url;
  else if(elem instanceof SVGImageElement) elem.setAttributeNS(null, 'href', url);
  else elem.style.backgroundImage = 'url(' + url + ')';
};

// проблема функции в том, что она не подходит для ссылок, пригодна только для blob'ов, потому что обычным ссылкам нужен 'load' каждый раз.
export default function renderImageFromUrl(
  elem: HTMLElement | HTMLImageElement | SVGImageElement | HTMLVideoElement,
  url: string,
  callback?: () => void,
  useCache?: boolean,
  processImageOnLoad?: (image: HTMLImageElement) => void
): MaybePromise<void> {
  if(processImageOnLoad) useCache = false;
  useCache ??= processImageOnLoad === undefined;

  if(!url) {
    console.error('renderImageFromUrl: no url?', elem, url);
    callback?.();
    return;
  }

  const isVideo = elem instanceof HTMLVideoElement;
  if(isVideo) {
    set(elem, url);
    if(callback) {
      return onMediaLoad(elem).then(callback);
    }
    return;
  }

  const prevTransition = elem.style.transition;
  const prevOpacity = elem.style.opacity;
  elem.style.transition = 'opacity .15s';
  elem.style.opacity = '0';

  const cleanup = () => {
    elem.style.transition = prevTransition;
    elem.style.opacity = prevOpacity;
  };

  if(loadedURLs.has(url) && useCache) {
    set(elem, url);
    requestAnimationFrame(() => {
      elem.style.opacity = prevOpacity || '';
      elem.addEventListener('transitionend', cleanup, {once: true});
    });

    callback?.();
    return;
  }

  const loader = new Image();

  const onLoad = () => {
    set(elem, url);

    loadedURLs.set(url, true);
    processImageOnLoad?.(loader);

    requestAnimationFrame(() => {
      elem.style.opacity = prevOpacity || '';
      elem.addEventListener('transitionend', cleanup, {once: true});
    });

    callback?.();
  };

  const onError = (err: DOMException) => {
    if(!err.message.includes('cannot be decoded')) {
      console.error('Render image from url failed:', err, url, loader, err.message, loader.naturalWidth);
    }

    cleanup();
    callback?.();
  };

  loader.decoding = 'async';
  loader.src = url;
  return loader.decode().then(onLoad, onError);
  // const timeout = setTimeout(() => {
  //   console.error('not yet decoded', loader, url);
  //   debugger;
  // }, 1e3);
  // decodePromise.finally(() => {
  //   clearTimeout(timeout);
  // });
}

export function renderImageFromUrlPromise(
  elem: Parameters<typeof renderImageFromUrl>[0],
  url: string,
  useCache?: boolean,
  processImageOnLoad?: (image: HTMLImageElement) => void
) {
  return new Promise<void>((resolve) => {
    renderImageFromUrl(elem, url, resolve, useCache, processImageOnLoad);
  });
}
