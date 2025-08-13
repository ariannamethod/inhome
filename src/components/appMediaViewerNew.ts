/*
 * https://github.com/morethanwords/tweb
 * Copyright (C) 2019-2021 Eduard Kuzmenko
 * https://github.com/morethanwords/tweb/blob/master/LICENSE
 */

export interface OverlayHeights {
  top?: number;
  bottom?: number;
}

export interface ResponsiveController {
  destroy(): void;
  updateOverlays(overlays: OverlayHeights): void;
  resize(): void;
}

export function calculateFit(
  naturalWidth: number,
  naturalHeight: number,
  viewportWidth: number,
  viewportHeight: number
) {
  const aspect = naturalWidth / naturalHeight;
  let width = viewportWidth;
  let height = width / aspect;

  if(height > viewportHeight) {
    height = viewportHeight;
    width = height * aspect;
  }

  const left = (viewportWidth - width) / 2;
  const top = (viewportHeight - height) / 2;

  return {width, height, left, top};
}

export function applyResponsiveMedia(
  element: HTMLImageElement | HTMLVideoElement,
  overlays: OverlayHeights = {}
): ResponsiveController {
  let overlayHeights = {...overlays};

  const resize = () => {
    const naturalWidth =
      (element as HTMLImageElement).naturalWidth ||
      (element as HTMLVideoElement).videoWidth ||
      element.clientWidth;
    const naturalHeight =
      (element as HTMLImageElement).naturalHeight ||
      (element as HTMLVideoElement).videoHeight ||
      element.clientHeight;

    const availableHeight =
      window.innerHeight - (overlayHeights.top ?? 0) - (overlayHeights.bottom ?? 0);

    const fit = calculateFit(naturalWidth, naturalHeight, window.innerWidth, availableHeight);

    element.style.position = 'absolute';
    element.style.width = `${fit.width}px`;
    element.style.height = `${fit.height}px`;
    element.style.left = `${fit.left}px`;
    element.style.top = `${fit.top + (overlayHeights.top ?? 0)}px`;
  };

  window.addEventListener('resize', resize);
  resize();

  return {
    destroy() {
      window.removeEventListener('resize', resize);
    },
    updateOverlays(newOverlays: OverlayHeights) {
      overlayHeights = {...newOverlays};
      resize();
    },
    resize
  };
}

