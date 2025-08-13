import {describe, it, expect} from 'vitest';
import {createRoot} from 'solid-js';
import {createVirtualizer} from '@tanstack/solid-virtual';

// Regression test to ensure virtualization keeps DOM nodes bounded
// for large chats by only rendering visible items.
describe('chat bubbles virtualization', () => {
  it('limits rendered bubbles to the viewport', () => {
    const scrollEl = document.createElement('div');
    scrollEl.style.height = '200px';
    scrollEl.style.overflow = 'auto';

    const inner = document.createElement('div');
    inner.style.position = 'relative';
    scrollEl.append(inner);
    document.body.append(scrollEl);

    const items = Array.from({length: 1000}, (_, i) => {
      const el = document.createElement('div');
      el.textContent = `msg-${i}`;
      el.style.height = '20px';
      return el;
    });

    createRoot(() => {
      const virtualizer = createVirtualizer({
        count: () => items.length,
        getScrollElement: () => scrollEl,
        estimateSize: () => 20,
        overscan: 5
      });

      const render = () => {
        const virtualItems = virtualizer.getVirtualItems();
        inner.style.height = `${virtualizer.getTotalSize()}px`;
        inner.innerHTML = '';
        virtualItems.forEach((vi) => {
          const el = items[vi.index];
          el.style.position = 'absolute';
          el.style.top = '0';
          el.style.left = '0';
          el.style.transform = `translateY(${vi.start}px)`;
          inner.appendChild(el);
        });
      };

      render();
      expect(inner.childElementCount).toBeLessThan(100);

      virtualizer.scrollToIndex(900);
      render();
      expect(inner.childElementCount).toBeLessThan(100);
    });
  });
});
