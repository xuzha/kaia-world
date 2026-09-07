export interface Point {
  x: number;
  z: number;
}
export interface Obstacle extends Point {
  halfX: number;
  halfZ: number;
}

/** Floor-space navigation; interactions own their elevated paths (ladder, slide, saddle). */
export class Navigation {
  readonly cell = 0.28;
  readonly minX = -7.05;
  readonly minZ = -5.65;
  readonly width = 51;
  readonly depth = 42;
  readonly clearance = 0.25;

  constructor(readonly obstacles: Obstacle[]) {}

  isFree(point: Point) {
    if (point.x < this.minX || point.x > 7.05 || point.z < this.minZ || point.z > 5.83)
      return false;
    return !this.obstacles.some(
      (o) =>
        Math.abs(point.x - o.x) < o.halfX + this.clearance &&
        Math.abs(point.z - o.z) < o.halfZ + this.clearance,
    );
  }

  clearLine(a: Point, b: Point) {
    if (!this.isFree(a) || !this.isFree(b)) return false;
    // Intersect the whole segment with each padded footprint; spaced samples miss corners.
    return !this.obstacles.some((obstacle) => {
      let enter = 0,
        exit = 1;
      for (const axis of ['x', 'z'] as const) {
        const half = (axis === 'x' ? obstacle.halfX : obstacle.halfZ) + this.clearance,
          low = obstacle[axis] - half,
          high = obstacle[axis] + half,
          delta = b[axis] - a[axis];
        if (Math.abs(delta) < 1e-12) {
          if (a[axis] <= low || a[axis] >= high) return false;
        } else {
          const first = (low - a[axis]) / delta,
            last = (high - a[axis]) / delta;
          enter = Math.max(enter, Math.min(first, last));
          exit = Math.min(exit, Math.max(first, last));
          if (enter >= exit - 1e-10) return false;
        }
      }
      return true;
    });
  }

  findPath(start: Point, target: Point): Point[] {
    if (!this.isFree(target)) return [];
    if (this.clearLine(start, target)) return [target];
    const point = (id: number): Point => ({
      x: this.minX + (id % this.width) * this.cell,
      z: this.minZ + Math.floor(id / this.width) * this.cell,
    });
    const nearest = (p: Point) => {
      let best = -1,
        distance = Infinity;
      for (let id = 0; id < this.width * this.depth; id++) {
        const q = point(id),
          d = Math.hypot(q.x - p.x, q.z - p.z);
        if (d < distance && this.isFree(q) && this.clearLine(p, q)) {
          best = id;
          distance = d;
        }
      }
      return best;
    };
    const from = nearest(start),
      to = nearest(target);
    if (from < 0 || to < 0) return [];
    const open = new Set([from]),
      cameFrom = new Map<number, number>();
    const score = new Map([[from, 0]]);
    const heuristic = (id: number) => Math.hypot(point(id).x - target.x, point(id).z - target.z);
    while (open.size) {
      let current = -1,
        min = Infinity;
      for (const id of open) {
        const f = score.get(id)! + heuristic(id);
        if (f < min) {
          min = f;
          current = id;
        }
      }
      if (current === to) {
        const route = [target, point(to)];
        while (cameFrom.has(current)) {
          current = cameFrom.get(current)!;
          route.push(point(current));
        }
        route.push(start);
        route.reverse();
        const smooth: Point[] = [];
        let index = 0;
        while (index < route.length - 1) {
          let next = route.length - 1;
          while (next > index + 1 && !this.clearLine(route[index], route[next])) next--;
          smooth.push(route[next]);
          index = next;
        }
        return smooth;
      }
      open.delete(current);
      const cx = current % this.width,
        cz = Math.floor(current / this.width);
      for (let dx = -1; dx <= 1; dx++)
        for (let dz = -1; dz <= 1; dz++) {
          if (!dx && !dz) continue;
          const nx = cx + dx,
            nz = cz + dz;
          if (nx < 0 || nx >= this.width || nz < 0 || nz >= this.depth) continue;
          const next = nz * this.width + nx;
          if (!this.clearLine(point(current), point(next))) continue;
          const cost = score.get(current)! + Math.hypot(dx, dz) * this.cell;
          if (cost < (score.get(next) ?? Infinity)) {
            cameFrom.set(next, current);
            score.set(next, cost);
            open.add(next);
          }
        }
    }
    return [];
  }
}
