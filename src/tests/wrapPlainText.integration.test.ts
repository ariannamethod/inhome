import {describe, expect, test} from 'vitest';
import wrapPlainText from '../lib/richTextProcessor/wrapPlainText';

describe('wrapPlainText', () => {
  test('escapes HTML so it is rendered as text', () => {
    const input = '<img src=x onerror="alert(1)">&';
    const escaped = wrapPlainText(input);
    const div = document.createElement('div');
    div.innerHTML = escaped;

    expect(div.textContent).toBe(input);
    expect(div.querySelector('img')).toBeNull();
  });
});

