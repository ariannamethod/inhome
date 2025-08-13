import {describe, it, expect, vi} from 'vitest';

vi.mock('../environment/webpSupport', () => ({default: false}));
vi.mock('../environment/canvasFilterSupport', () => ({default: false}));
vi.mock('../environment/imageMimeTypesSupport', () => ({default: new Set()}));
vi.mock('../lib/rootScope', () => ({default: {addEventListener: () => {}, dispatchEvent: () => {}, managers: {}}}));
vi.mock('../lib/langPack', () => ({default: {}}));
vi.mock('../environment/userAgent', async() => {
  const actual = await vi.importActual('../environment/userAgent');
  return {...actual, IS_APPLE: false, IS_SAFARI: false, IS_CHROMIUM: false, IS_FIREFOX: false};
});
vi.mock('../environment/touchSupport', () => ({default: false}));
vi.mock('../environment/appleMx', () => ({default: false}));
vi.mock('../helpers/onMediaLoad', () => ({default: () => Promise.resolve()}));
vi.mock('../lib/appManagers/appDownloadManager', () => ({default: {downloadMediaURL: () => {}}}));
vi.mock('../helpers/searchListLoader', () => ({default: class {}}));
vi.mock('../helpers/listenerSetter', () => ({default: class {}}));
vi.mock('../components/animationIntersector', () => ({default: {toggleMediaPause: () => {}}}));
vi.mock('../lib/mtproto/mtprotoworker', () => ({default: {getCacheContext: () => ({})}}));

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(global as any).ResizeObserver = ResizeObserverMock;

class IntersectionObserverMock {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
}
(global as any).IntersectionObserver = IntersectionObserverMock;

// This test reproduces the sequence described in TODO comments
// ensuring that the last chunk is buffered and progress resets after track end.
describe('AppMediaPlaybackController safari stream handling', () => {
  it('buffers last chunk and resets progress after end', async() => {
    const {AppMediaPlaybackController} = await import('../components/appMediaPlaybackController');
    const controller = new AppMediaPlaybackController();
    const media = document.createElement('audio');
    Object.defineProperty(media, 'duration', {value: 100, writable: true});
    media.currentTime = 0;

    // @ts-ignore access to private method for testing
    controller.handleSafariStreamable(media);

    media.dispatchEvent(new Event('ended'));
    expect(media.currentTime).toBe(99);

    media.dispatchEvent(new Event('progress'));
    expect(media.currentTime).toBe(0);
  });
});
