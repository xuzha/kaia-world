import { expect, test } from '@playwright/test';

test('the full castle action clears the structure, slide surface, and floor', async ({ page }) => {
  await page.goto('/?inspect=1');
  await page.waitForFunction(() => (window as any).__KAIA__?.objects);
  const result = await page.evaluate(async () => {
    const { Box3, Triangle, Vector3 } = await import('/node_modules/three/build/three.module.js');
    const world = (window as any).__KAIA__;
    world.setManual(true);
    world.setAuto(false);
    world.setFamilyAuto(false);
    world.request('castle');
    for (let i = 0; i < 250 && world.state().state !== 'playing'; i++) world.step(0.15);

    const character = world.objects.kaia;
    const castle = world.objects.toys.castle;
    castle.updateWorldMatrix(true, true);
    const inverse = castle.matrixWorld.clone().invert();
    const surface = castle.getObjectByName('slide-surface').geometry.attributes.position;
    const left = surface.getX(0),
      right = surface.getX(1),
      near = surface.getZ(0),
      far = surface.getZ(surface.count - 2);
    const barriers: any[] = [];
    let postTop = -Infinity,
      roofBottom = Infinity,
      entryHeightGap = Infinity,
      entryDepthGap = Infinity;
    castle.traverse((mesh: any) => {
      if (
        !['castle-post', 'castle-wall', 'castle-platform', 'castle-roof', 'castle-guard'].includes(
          mesh.name,
        )
      )
        return;
      mesh.geometry.computeBoundingBox();
      // Inspect the solid interior, allowing for rounded corners and contact tolerance.
      const bounds = mesh.geometry.boundingBox.clone().expandByScalar(-0.02);
      const matrix = inverse.clone().multiply(mesh.matrixWorld);
      const actual = mesh.geometry.boundingBox.clone().applyMatrix4(matrix);
      if (mesh.name === 'castle-post') postTop = Math.max(postTop, actual.max.y);
      if (mesh.name === 'castle-roof') roofBottom = Math.min(roofBottom, actual.min.y);
      const center = (left + right) / 2;
      if (mesh.name === 'castle-platform' && actual.min.x < center && actual.max.x > center) {
        entryHeightGap = Math.abs(actual.max.y - surface.getY(0));
        entryDepthGap = Math.abs(actual.max.z - near);
      }
      barriers.push({
        name: mesh.name,
        bounds,
        broad: bounds.clone().applyMatrix4(matrix),
        inverse: matrix.clone().invert(),
      });
    });

    const point = new Vector3();
    const triangle = new Triangle();
    const meshBounds = new Box3();
    const collisions = new Map<string, any>();
    let floorClearance = Infinity;
    let slideClearance = Infinity;
    let slideSamples = 0;
    let worst: any;
    let elapsed = 0;
    const inspectSlide = (x: number, y: number, z: number, mesh: any) => {
      if (x < left || x > right || z < near || z > far) return;
      let lo = 0,
        hi = surface.count / 2 - 1;
      while (lo + 1 < hi) {
        const mid = (lo + hi) >> 1;
        if (surface.getZ(mid * 2) <= z) lo = mid;
        else hi = mid;
      }
      const a = lo * 2,
        b = hi * 2;
      const t = (z - surface.getZ(a)) / (surface.getZ(b) - surface.getZ(a));
      const height = surface.getY(a) * (1 - t) + surface.getY(b) * t;
      const gap = y - height;
      slideSamples++;
      if (gap < slideClearance) {
        slideClearance = gap;
        worst = { elapsed, mesh: mesh.name || mesh.geometry.type, x, y, z, height };
      }
    };

    let frames = 0;
    while (world.state().state === 'playing' && frames++ < 540) {
      world.step(1 / 30);
      elapsed = world.state().elapsed;
      character.updateWorldMatrix(true, true);
      character.children[0].traverseVisible((mesh: any) => {
        if (!mesh.isMesh) return;
        const matrix = inverse.clone().multiply(mesh.matrixWorld);
        const vertices = mesh.geometry.attributes.position;
        const transformed = new Float64Array(vertices.count * 3);
        meshBounds.makeEmpty();
        for (let i = 0; i < vertices.count; i++) {
          point.fromBufferAttribute(vertices, i).applyMatrix4(matrix);
          point.toArray(transformed, i * 3);
          meshBounds.expandByPoint(point);
          floorClearance = Math.min(floorClearance, point.y);
          inspectSlide(point.x, point.y, point.z, mesh);
        }
        const nearby = barriers.filter((barrier) => barrier.broad.intersectsBox(meshBounds));
        const hit = new Set();
        const index = mesh.geometry.index;
        const count = index ? index.count : vertices.count;
        for (let i = 0; i < count; i += 3) {
          const indices = [0, 1, 2].map((j) => (index ? index.getX(i + j) : i + j) * 3);
          for (const barrier of nearby) {
            if (hit.has(barrier)) continue;
            triangle.a.fromArray(transformed, indices[0]).applyMatrix4(barrier.inverse);
            triangle.b.fromArray(transformed, indices[1]).applyMatrix4(barrier.inverse);
            triangle.c.fromArray(transformed, indices[2]).applyMatrix4(barrier.inverse);
            if (barrier.bounds.intersectsTriangle(triangle)) {
              hit.add(barrier);
              const key = `${mesh.uuid}-${barriers.indexOf(barrier)}`;
              let parent = mesh;
              while (!parent.name && parent.parent && parent.parent !== character)
                parent = parent.parent;
              const collision = collisions.get(key) || {
                first: elapsed,
                mesh: mesh.name || parent.name || mesh.geometry.type,
                barrier: barrier.name,
                point: triangle.a.toArray(),
                frames: 0,
              };
              collision.last = elapsed;
              collision.frames++;
              collisions.set(key, collision);
            }
          }
          // Include edges crossing the slide's entry, exit, or sides. Vertices alone
          // can miss a shoe or hem that spans a boundary between two vertices.
          for (let edge = 0; edge < 3; edge++) {
            const a = indices[edge],
              b = indices[(edge + 1) % 3];
            for (const [axis, boundary] of [
              [0, left],
              [0, right],
              [2, near],
              [2, far],
            ]) {
              const start = transformed[a + axis],
                end = transformed[b + axis];
              if ((start - boundary) * (end - boundary) >= 0) continue;
              const t = (boundary - start) / (end - start);
              inspectSlide(
                transformed[a] + (transformed[b] - transformed[a]) * t,
                transformed[a + 1] + (transformed[b + 1] - transformed[a + 1]) * t,
                transformed[a + 2] + (transformed[b + 2] - transformed[a + 2]) * t,
                mesh,
              );
            }
          }
        }
      });
    }
    return {
      frames,
      floorClearance,
      slideClearance,
      slideSamples,
      collisions: [...collisions.values()],
      structure: { roofClearance: roofBottom - postTop, entryHeightGap, entryDepthGap },
      worst,
      end: world.state(),
    };
  });
  await test.info().attach('castle-clearance', {
    body: JSON.stringify(result, null, 2),
    contentType: 'application/json',
  });
  expect(result.slideSamples).toBeGreaterThan(10_000);
  expect(result.structure.roofClearance).toBeGreaterThanOrEqual(-0.001);
  expect(result.structure.entryHeightGap).toBeLessThan(0.001);
  expect(result.structure.entryDepthGap).toBeLessThan(0.001);
  expect(result.collisions).toEqual([]);
  // A shoe may rest on the entry lip while walking; contact is valid, penetration is not.
  expect(result.slideClearance, JSON.stringify(result.worst)).toBeGreaterThanOrEqual(-0.001);
  expect(result.floorClearance).toBeGreaterThan(-0.018);
  expect(result.end.state).toBe('idle');
  expect(result.end.floorIsFree).toBe(true);
});
