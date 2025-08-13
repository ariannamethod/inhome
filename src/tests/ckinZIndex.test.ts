import {describe, it, expect} from 'vitest';
import * as sass from 'sass';

describe('ckin player z-index', () => {
  it('overlays interface elements', () => {
    const css = sass.compile('src/scss/style.scss').css;
    const start = css.indexOf('.ckin__player.ckin__fullscreen');
    expect(start).toBeGreaterThan(-1);
    const end = css.indexOf('}', start);
    const block = css.slice(start, end);
    const match = block.match(/z-index:\s*calc\(var\(--passcode-lock-screen-z-index,\s*100000\)\s*\+\s*(\d+)\)/);
    expect(match).toBeTruthy();
    const offset = Number(match![1]);
    const base = 100000;
    expect(base + offset).toBeGreaterThan(base);
  });
});
