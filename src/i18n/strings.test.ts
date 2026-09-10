import { describe, expect, it } from 'vitest';
import { en, pt } from './strings';
import { translate } from './translate';

describe('dictionaries', () => {
  it('have the same keys in both languages', () => {
    expect(Object.keys(pt).sort()).toEqual(Object.keys(en).sort());
  });

  it('never leave a string empty', () => {
    for (const [k, v] of Object.entries(pt)) expect(v, k).not.toBe('');
  });

  it('keep the same placeholders in both languages', () => {
    for (const key of Object.keys(en) as Array<keyof typeof en>) {
      const holes = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort();
      expect(holes(pt[key]), key).toEqual(holes(en[key]));
    }
  });
});

describe('translate', () => {
  it('substitutes placeholders', () => {
    expect(translate('EN', 'search.available', { n: 4, total: 9 })).toBe('Available · 4 of 9');
    expect(translate('PT', 'search.chatWith', { name: 'Tiago' })).toBe('Falar com Tiago');
  });

  it('leaves unknown placeholders visible rather than blank', () => {
    expect(translate('EN', 'nearby.from', {})).toBe('From {time}');
  });
});
