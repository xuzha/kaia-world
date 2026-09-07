import { describe, expect, it } from 'vitest';
import { drawingOutline, maxDrawingPoints, validDrawing } from '../src/play/drawing-data';

describe('saved drawings', () => {
  const drawing = {
    version: 1,
    name: '小棉兔',
    strokes: [
      {
        color: '#c98770',
        width: 9,
        points: [
          [20, 30],
          [360, 350],
        ],
      },
    ],
  };
  it('accepts drawings and rejects corrupt or unsupported saved data', () => {
    expect(validDrawing(drawing)).toBe(true);
    for (const invalid of [
      null,
      {},
      { ...drawing, version: 2 },
      { ...drawing, name: '' },
      { ...drawing, strokes: [] },
      { ...drawing, strokes: [null] },
    ])
      expect(validDrawing(invalid)).toBe(false);
  });
  it('rejects non-finite coordinates, oversized drawings, and invalid pen values', () => {
    for (const stroke of [
      { ...drawing.strokes[0], points: [[NaN, 10]] },
      { ...drawing.strokes[0], points: [[Infinity, 10]] },
      { ...drawing.strokes[0], points: [[385, 10]] },
      { ...drawing.strokes[0], points: [[-1, 10]] },
      {
        ...drawing.strokes[0],
        points: Array.from({ length: maxDrawingPoints + 1 }, () => [10, 10]),
      },
      { ...drawing.strokes[0], width: 0 },
      { ...drawing.strokes[0], color: 'url(example)' },
      { ...drawing.strokes[0], fill: 'true' },
    ])
      expect(validDrawing({ ...drawing, strokes: [stroke] })).toBe(false);
  });
});

describe('drawing silhouettes', () => {
  it('leaves an empty drawing empty', () => {
    expect(drawingOutline(new Uint8Array(64 * 64), 64, 64)).toEqual([]);
  });
  it('turns a closed line into one filled body, retaining the full outline', () => {
    const pixels = new Uint8Array(64 * 64);
    for (let i = 12; i <= 50; i++) {
      pixels[12 * 64 + i] = pixels[50 * 64 + i] = 255;
      pixels[i * 64 + 12] = pixels[i * 64 + 50] = 255;
    }
    const outline = drawingOutline(pixels, 64, 64);
    expect(outline.length).toBeGreaterThanOrEqual(4);
    expect(Math.min(...outline.map((p) => p[0]))).toBeLessThanOrEqual(12);
    expect(Math.max(...outline.map((p) => p[0]))).toBeGreaterThanOrEqual(50);
    expect(outline.every((p) => p[0] < 16 || p[0] > 46 || p[1] < 16 || p[1] > 46)).toBe(true);
  });
  it('preserves the gap between two ears instead of making every toy a rectangle', () => {
    const pixels = new Uint8Array(64 * 64);
    for (let y = 7; y < 54; y++)
      for (let x = 10; x < 53; x++) if (y >= 32 || x < 23 || x > 40) pixels[y * 64 + x] = 255;
    const outline = drawingOutline(pixels, 64, 64);
    expect(outline.some(([x, y]) => x > 23 && x < 41 && y >= 29)).toBe(true);
    expect(outline.every((p) => p.every(Number.isFinite))).toBe(true);
  });
  it('keeps significant disconnected marks in a shared cushion silhouette', () => {
    const pixels = new Uint8Array(64 * 64);
    for (let y = 12; y < 27; y++)
      for (let x = 5; x < 20; x++) {
        pixels[y * 64 + x] = 255;
        pixels[(y + 22) * 64 + x + 34] = 255;
      }
    const outline = drawingOutline(pixels, 64, 64);
    expect(Math.min(...outline.map((p) => p[0]))).toBeLessThanOrEqual(5);
    expect(Math.max(...outline.map((p) => p[0]))).toBeGreaterThanOrEqual(53);
    expect(Math.max(...outline.map((p) => p[1]))).toBeGreaterThanOrEqual(48);
  });
});
