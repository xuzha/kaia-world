import { describe, expect, it } from 'vitest';
import { Navigation, type Point } from '../src/world/navigation';

describe('floor navigation', () => {
  it('finds a continuous route around furniture with enough clearance for a child', () => {
    const nav = new Navigation([{ x: 0, z: 0, halfX: 1.1, halfZ: 1.4 }]);
    const start = { x: -3, z: 0 },
      target = { x: 3, z: 0 };
    expect(nav.clearLine(start, target)).toBe(false);
    const route = nav.findPath(start, target);
    expect(route.length).toBeGreaterThan(1);
    expect(route.at(-1)).toEqual(target);
    let previous: Point = start;
    for (const point of route) {
      expect(nav.clearLine(previous, point)).toBe(true);
      previous = point;
    }
  });

  it('refuses to cut diagonally through two touching obstacles', () => {
    const nav = new Navigation([
      { x: -0.55, z: 0.55, halfX: 0.55, halfZ: 0.55 },
      { x: 0.55, z: -0.55, halfX: 0.55, halfZ: 0.55 },
    ]);
    const start = { x: -2, z: -2 },
      end = { x: 2, z: 2 };
    expect(nav.clearLine(start, end)).toBe(false);
    const route = nav.findPath(start, end);
    expect(route.length).toBeGreaterThan(1);
    for (let i = 0; i < route.length; i++)
      expect(nav.clearLine(i ? route[i - 1] : start, route[i])).toBe(true);
  });

  it('detects a short corner crossing between samples while allowing exact tangents', () => {
    const nav = new Navigation([{ x: 0, z: 0, halfX: 1, halfZ: 1 }]);
    expect(nav.clearLine({ x: -2, z: 0.48 }, { x: -0.5, z: 1.98 })).toBe(false);
    expect(nav.clearLine({ x: -2, z: 0.5 }, { x: -0.5, z: 2 })).toBe(true);
    expect(nav.clearLine({ x: -1.25, z: -2 }, { x: -1.25, z: 2 })).toBe(true);
    expect(nav.clearLine({ x: -1.24, z: -2 }, { x: -1.24, z: 2 })).toBe(false);
  });

  it('rejects blocked or out-of-room destinations instead of walking through them', () => {
    const nav = new Navigation([{ x: 0, z: 0, halfX: 0.5, halfZ: 0.5 }]);
    expect(nav.findPath({ x: 3, z: 3 }, { x: 0, z: 0 })).toEqual([]);
    expect(nav.findPath({ x: 3, z: 3 }, { x: 15, z: 0 })).toEqual([]);
  });

  it('returns no route through a wall spanning the room', () => {
    const nav = new Navigation([{ x: 0, z: 0, halfX: 0.4, halfZ: 8 }]);
    expect(nav.findPath({ x: -2, z: 0 }, { x: 2, z: 0 })).toEqual([]);
  });
});
