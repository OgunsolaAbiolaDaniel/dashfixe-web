import { describe, expect, it } from 'vitest';
import { classifyNeed } from './classify';

const trade = (s: string) => classifyNeed(s)?.trade ?? null;

describe('classifyNeed', () => {
  it('recognises everyday English descriptions', () => {
    expect(trade('Kitchen tap dripping since Tuesday')).toBe('plumbing');
    expect(trade('the toilet keeps running')).toBe('plumbing');
    expect(trade('a socket is sparking in the bedroom')).toBe('electrical');
    expect(trade('breaker trips every time I use the oven')).toBe('electrical');
    expect(trade('mould on the bathroom ceiling')).toBe('painting');
    expect(trade('wardrobe door hinge came off')).toBe('carpentry');
    expect(trade('deep clean before we move out')).toBe('cleaning');
  });

  it('recognises Portuguese, with or without accents', () => {
    expect(trade('A torneira da cozinha está a pingar')).toBe('plumbing');
    expect(trade('lava-loiça entupido')).toBe('plumbing');
    expect(trade('o disjuntor dispara sempre')).toBe('electrical');
    expect(trade('Humidade e bolor na parede')).toBe('painting');
    expect(trade('a porta do roupeiro não fecha')).toBe('carpentry');
    expect(trade('limpeza profunda da casa')).toBe('cleaning');
  });

  it('matches whole words only, and says which word it used', () => {
    expect(trade('my laptop screen')).toBeNull(); // "tap" is not in "laptop"
    expect(classifyNeed('Leaking tap')).toEqual({ trade: 'plumbing', keyword: 'tap' });
    expect(classifyNeed('pipes entupidos')?.keyword).toBe('pipes');
  });

  it('returns null when nothing is recognisable', () => {
    expect(trade('')).toBeNull();
    expect(trade('help')).toBeNull();
    expect(trade('the thing is broken')).toBeNull();
  });
});
