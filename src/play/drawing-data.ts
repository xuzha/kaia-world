export type DrawingPoint = [number, number];
export interface Stroke {
  color: string;
  width: number;
  points: DrawingPoint[];
  fill?: boolean;
}
export interface Drawing {
  version: 1;
  name: string;
  strokes: Stroke[];
}
export const drawingStorageKey = 'kaia-drawing-v1';
export const drawingSize = 384;
export const maxDrawingPoints = 12000;

export function validDrawing(value: unknown): value is Drawing {
  if (!value || typeof value !== 'object') return false;
  const drawing = value as Drawing;
  if (
    drawing.version !== 1 ||
    typeof drawing.name !== 'string' ||
    !drawing.name.trim() ||
    drawing.name.length > 16 ||
    !Array.isArray(drawing.strokes) ||
    !drawing.strokes.length ||
    drawing.strokes.length > 150
  )
    return false;
  let total = 0;
  return drawing.strokes.every((stroke) => {
    if (
      !stroke ||
      !/^#[0-9a-f]{6}$/i.test(stroke.color) ||
      !Number.isFinite(stroke.width) ||
      stroke.width < 1 ||
      stroke.width > 24 ||
      (stroke.fill !== undefined && typeof stroke.fill !== 'boolean') ||
      !Array.isArray(stroke.points) ||
      !stroke.points.length
    )
      return false;
    total += stroke.points.length;
    return (
      total <= maxDrawingPoints &&
      stroke.points.every(
        (point) =>
          Array.isArray(point) &&
          point.length === 2 &&
          point.every((n) => Number.isFinite(n) && n >= 0 && n <= drawingSize),
      )
    );
  });
}

function area(points: DrawingPoint[]) {
  return Math.abs(
    points.reduce((sum, p, i) => {
      const q = points[(i + 1) % points.length];
      return sum + p[0] * q[1] - q[0] * p[1];
    }, 0) / 2,
  );
}

function convexHull(points: DrawingPoint[]) {
  const sorted = points.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (a: DrawingPoint, b: DrawingPoint, c: DrawingPoint) =>
    (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  const half = (values: DrawingPoint[]) => {
    const result: DrawingPoint[] = [];
    for (const p of values) {
      while (
        result.length >= 2 &&
        cross(result[result.length - 2], result[result.length - 1], p) <= 0
      )
        result.pop();
      result.push(p);
    }
    result.pop();
    return result;
  };
  return [...half(sorted), ...half(sorted.reverse())];
}

/** Fill enclosed outlines and trace their real silhouette, including concave ears and star points. */
export function drawingOutline(alpha: Uint8Array, width: number, height: number): DrawingPoint[] {
  const mask = new Uint8Array(width * height);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      if (alpha[y * width + x] < 20) continue;
      for (let dy = -2; dy <= 2; dy++)
        for (let dx = -2; dx <= 2; dx++) {
          const px = x + dx,
            py = y + dy;
          if (dx * dx + dy * dy <= 4 && px >= 0 && px < width && py >= 0 && py < height)
            mask[py * width + px] = 1;
        }
    }
  const exterior = new Uint8Array(mask.length),
    queue: number[] = [];
  const visit = (x: number, y: number) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const index = y * width + x;
    if (!mask[index] && !exterior[index]) {
      exterior[index] = 1;
      queue.push(index);
    }
  };
  for (let x = 0; x < width; x++) {
    visit(x, 0);
    visit(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    visit(0, y);
    visit(width - 1, y);
  }
  for (let i = 0; i < queue.length; i++) {
    const x = queue[i] % width,
      y = Math.floor(queue[i] / width);
    visit(x - 1, y);
    visit(x + 1, y);
    visit(x, y - 1);
    visit(x, y + 1);
  }
  const filled = (x: number, y: number) =>
    x >= 0 && x < width && y >= 0 && y < height && !exterior[y * width + x];
  const edges = new Map<number, number[]>(),
    stride = width + 1;
  const edge = (x: number, y: number, a: number, b: number) => {
    const start = y * stride + x;
    const ends = edges.get(start) ?? [];
    ends.push(b * stride + a);
    edges.set(start, ends);
  };
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      if (!filled(x, y)) continue;
      if (!filled(x, y - 1)) edge(x, y, x + 1, y);
      if (!filled(x + 1, y)) edge(x + 1, y, x + 1, y + 1);
      if (!filled(x, y + 1)) edge(x + 1, y + 1, x, y + 1);
      if (!filled(x - 1, y)) edge(x, y + 1, x, y);
    }
  const contours: DrawingPoint[][] = [];
  while (edges.size) {
    const start = edges.keys().next().value as number;
    let current = start;
    const points: DrawingPoint[] = [];
    do {
      points.push([current % stride, Math.floor(current / stride)]);
      const ends = edges.get(current);
      if (!ends?.length) break;
      const next = ends.pop()!;
      if (!ends.length) edges.delete(current);
      current = next;
    } while (current !== start && points.length < mask.length * 4);
    if (points.length >= 3) contours.push(points);
  }
  if (!contours.length) return [];
  contours.sort((a, b) => area(b) - area(a));
  // Separate marks still belong to the same toy; a cushion joins significant disconnected pieces.
  if (area(contours[0]) < contours.reduce((sum, p) => sum + area(p), 0) * 0.94)
    return convexHull(contours.flat());
  const contour = contours[0];
  return contour.filter((p, i) => {
    const a = contour[(i + contour.length - 1) % contour.length],
      b = contour[(i + 1) % contour.length];
    return (p[0] - a[0]) * (b[1] - p[1]) !== (p[1] - a[1]) * (b[0] - p[0]);
  });
}
