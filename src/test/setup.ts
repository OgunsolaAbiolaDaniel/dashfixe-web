import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { resetChatStore } from '../components/explore/chatStore';

afterEach(() => {
  cleanup();
  // Per-browser state (the saved place, jobs, language, places) and the chat
  // threads must not leak between tests.
  localStorage.clear();
  resetChatStore();
});

// jsdom has no layout engine; the map and scroll code both touch these.
Object.defineProperty(window, 'scrollTo', { value: vi.fn(), writable: true });
if (!('scrollTo' in Element.prototype)) {
  Object.defineProperty(Element.prototype, 'scrollTo', { value: vi.fn(), writable: true });
}
if (!('scrollIntoView' in Element.prototype)) {
  Object.defineProperty(Element.prototype, 'scrollIntoView', { value: vi.fn(), writable: true });
}
if (!('ResizeObserver' in window)) {
  class RO {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  Object.defineProperty(window, 'ResizeObserver', { value: RO, writable: true });
}
if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
}
