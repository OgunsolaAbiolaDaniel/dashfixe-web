import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { resetChatStore } from '../components/explore/chatStore';

// Cheap password hashing for the console's suites (server/passwords.ts honours this
// only under NODE_ENV=test), so they don't starve parallel workers of CPU.
process.env.DFX_SCRYPT_N = '1024';

// The location card (LocationPrompt) would float over every map page in every
// test; mark it answered. The tests about it clear this first.
beforeEach(() => localStorage.setItem('dfx.loc', 'asked'));

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
