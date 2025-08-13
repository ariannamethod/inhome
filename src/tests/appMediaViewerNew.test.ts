import {describe, it, expect} from 'vitest';
import {applyResponsiveMedia, calculateFit} from '../components/appMediaViewerNew';

describe('calculateFit', () => {
  it('maintains aspect ratio within viewport', () => {
    const fit = calculateFit(1000, 500, 500, 300);
    expect(fit.width).toBe(500);
    expect(fit.height).toBe(250);
  });
});

describe('applyResponsiveMedia', () => {
  it('scales image on mobile resize', () => {
    const img = document.createElement('img');
    Object.defineProperty(img, 'naturalWidth', {value: 1000});
    Object.defineProperty(img, 'naturalHeight', {value: 500});

    Object.defineProperty(window, 'innerWidth', {value: 375, configurable: true, writable: true});
    Object.defineProperty(window, 'innerHeight', {value: 667, configurable: true, writable: true});

    const controller = applyResponsiveMedia(img);
    expect(img.style.width).toBe('375px');
    expect(img.style.height).toBe('187.5px');

    window.innerWidth = 320;
    window.innerHeight = 480;
    window.dispatchEvent(new Event('resize'));

    expect(img.style.width).toBe('320px');
    expect(img.style.height).toBe('160px');

    controller.destroy();
  });

  it('updates position when overlay heights change', () => {
    const img = document.createElement('img');
    Object.defineProperty(img, 'naturalWidth', {value: 800});
    Object.defineProperty(img, 'naturalHeight', {value: 600});

    Object.defineProperty(window, 'innerWidth', {value: 300, configurable: true, writable: true});
    Object.defineProperty(window, 'innerHeight', {value: 400, configurable: true, writable: true});

    const controller = applyResponsiveMedia(img, {top: 50});
    expect(parseFloat(img.style.top)).toBeCloseTo(112.5, 1);

    controller.updateOverlays({top: 0});
    expect(parseFloat(img.style.top)).toBeCloseTo(87.5, 1);

    controller.destroy();
  });
});

