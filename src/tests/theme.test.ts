import {describe, it, expect} from 'vitest';
import sass from 'sass';

const css = sass.compile('src/scss/style.scss').css.toString();

describe('theme variables', () => {
  it('includes light theme variables', () => {
    expect(css).toMatch(/:root\s*{[\s\S]*--body-background-color: #fff;[\s\S]*}/);
  });

  it('includes dark theme variables with prefers-color-scheme', () => {
    expect(css).toMatch(/@media \(prefers-color-scheme: dark\)\s*{\s*:root\s*{[\s\S]*--body-background-color: #181818;[\s\S]*}\s*}/);
  });
});
