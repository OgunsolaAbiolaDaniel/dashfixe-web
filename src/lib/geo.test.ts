import { describe, expect, it } from 'vitest';
import { HOME, bounds, circlePolygon, distanceKm, etaMinutes, midpoint } from './geo';

describe('distanceKm', () => {
  it('is zero for the same point', () => {
    expect(distanceKm(HOME, HOME)).toBe(0);
  });

  it('measures Amora to Seixal at roughly 2 km', () => {
    const seixal: [number, number] = [-9.101, 38.6405];
    const km = distanceKm(HOME, seixal);
    expect(km).toBeGreaterThan(1.5);
    expect(km).toBeLessThan(2.5);
  });

  it('is symmetric', () => {
    const b: [number, number] = [-9.15, 38.6];
    expect(distanceKm(HOME, b)).toBeCloseTo(distanceKm(b, HOME), 10);
  });
});

describe('etaMinutes', () => {
  it('never goes under five minutes', () => {
    expect(etaMinutes(0)).toBe(5);
    expect(etaMinutes(0.2)).toBe(5);
  });

  it('grows with distance', () => {
    expect(etaMinutes(1.4)).toBeLessThan(etaMinutes(3.1));
    expect(etaMinutes(4)).toBe(14);
  });
});

describe('midpoint and bounds', () => {
  it('finds the middle', () => {
    expect(midpoint([0, 0], [2, 4])).toEqual([1, 2]);
  });

  it('wraps every point', () => {
    const [[w, s], [e, n]] = bounds([
      [-9.2, 38.6],
      [-9.1, 38.7],
      [-9.15, 38.55],
    ]);
    expect(w).toBe(-9.2);
    expect(e).toBe(-9.1);
    expect(s).toBe(38.55);
    expect(n).toBe(38.7);
  });
});

describe('circlePolygon', () => {
  it('closes the ring and stays the requested distance from the centre', () => {
    const poly = circlePolygon(HOME, 5, 32);
    const ring = poly.geometry.coordinates[0]!;
    expect(ring).toHaveLength(33);
    expect(ring[0]).toEqual(ring[ring.length - 1]);
    for (const p of ring) {
      expect(distanceKm(HOME, p as [number, number])).toBeCloseTo(5, 0);
    }
  });
});
