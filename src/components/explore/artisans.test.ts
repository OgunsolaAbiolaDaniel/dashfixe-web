import { describe, expect, it } from 'vitest';
import { AVAILABLE, AVAILABLE_COUNT, MAP_ONLY, MEDIAN_ETA, ON_JOB, TOTAL_ONLINE } from './artisans';
import { SEARCH_RADIUS_KM } from '../../lib/geo';

describe('sample artisans', () => {
  it('derive distance and arrival from coordinates', () => {
    for (const a of AVAILABLE) {
      expect(a.km).toBeGreaterThan(0);
      expect(a.km).toBeLessThanOrEqual(SEARCH_RADIUS_KM);
      expect(a.eta).toBeGreaterThanOrEqual(5);
    }
  });

  it('are listed nearest-first', () => {
    const etas = AVAILABLE.map((a) => a.eta);
    expect(etas).toEqual([...etas].sort((a, b) => a - b));
  });

  it('keep the counts honest', () => {
    expect(AVAILABLE_COUNT).toBe(AVAILABLE.length + MAP_ONLY.length);
    expect(AVAILABLE_COUNT + ON_JOB.length).toBeLessThanOrEqual(TOTAL_ONLINE);
    expect(MEDIAN_ETA).toBeGreaterThan(0);
  });

  it('use unique ids across every marker set', () => {
    const ids = [...AVAILABLE, ...MAP_ONLY, ...ON_JOB].map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
