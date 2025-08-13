import {describe, test, expect, vi} from 'vitest';

vi.stubGlobal('IntersectionObserver', class { observe() {} unobserve() {} disconnect() {} });
vi.stubGlobal('indexedDB', {open: () => ({})});

vi.mock('../components/chat/markupTooltip', () => ({default: {getInstance: () => ({showLinkEditor: () => {}})}}));
vi.mock('../config/font', () => ({FontFamilyName: {}}));
vi.mock('../helpers/array/indexOfAndSplice', () => ({default: () => {}}));
vi.mock('../helpers/dom/cancelEvent', () => ({default: () => {}}));
vi.mock('../helpers/dom/dispatchEvent', () => ({default: () => {}}));
vi.mock('../helpers/dom/getCharAfterRange', () => ({default: () => ''}));
vi.mock('../helpers/dom/getRichElementValue', () => ({MarkdownType: {}}));
vi.mock('../helpers/dom/getMarkupInSelection', () => ({default: () => ({})}));
vi.mock('../helpers/dom/isSelectionEmpty', () => ({default: () => true}));
vi.mock('../helpers/dom/richInputHandler', () => ({default: class {}}));
vi.mock('../helpers/dom/setInnerHTML', () => ({setDirection: () => {}}));

import {createMarkdownCache, pushMarkdownSnapshot, getPreviousMarkdownSnapshot, getNextMarkdownSnapshot, MARKDOWN_HISTORY_LIMIT} from '../helpers/dom/markdown';

describe('markdown history', () => {
  test('undo and redo traverses snapshots', () => {
    const div = document.createElement('div');
    createMarkdownCache(div);

    div.innerHTML = 'a';
    pushMarkdownSnapshot(div);
    div.innerHTML = 'b';
    pushMarkdownSnapshot(div);
    div.innerHTML = 'c';
    pushMarkdownSnapshot(div);

    expect(getPreviousMarkdownSnapshot(div)).toBe('b');
    div.innerHTML = 'b';
    expect(getPreviousMarkdownSnapshot(div)).toBe('a');
    div.innerHTML = 'a';
    expect(getPreviousMarkdownSnapshot(div)).toBeUndefined();

    expect(getNextMarkdownSnapshot(div)).toBe('b');
    div.innerHTML = 'b';
    expect(getNextMarkdownSnapshot(div)).toBe('c');
    div.innerHTML = 'c';
    expect(getNextMarkdownSnapshot(div)).toBeUndefined();
  });

  test('history is capped at limit', () => {
    const div = document.createElement('div');
    const cache = createMarkdownCache(div);

    for(let i = 0; i < MARKDOWN_HISTORY_LIMIT + 10; i++) {
      div.innerHTML = String(i);
      pushMarkdownSnapshot(div);
    }

    expect(cache.executedHistory.length).toBe(MARKDOWN_HISTORY_LIMIT);

    const states: string[] = [];
    let prev: string | undefined;
    while((prev = getPreviousMarkdownSnapshot(div))) {
      states.push(prev);
      div.innerHTML = prev;
    }

    expect(states[states.length - 1]).toBe('10');
  });
});
