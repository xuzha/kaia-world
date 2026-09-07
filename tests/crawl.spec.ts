import { expect, test } from '@playwright/test';

test('the entire crawl keeps the rendered body inside the arch opening and above the mat', async ({
  page,
}) => {
  await page.goto('/?inspect=1');
  await page.waitForFunction(() => (window as any).__KAIA__?.objects);
  const result = await page.evaluate(() => {
    const world = (window as any).__KAIA__;
    world.setManual(true);
    world.setAuto(false);
    world.setFamilyAuto(false);
    world.request('rainbow');
    for (let i = 0; i < 250 && world.state().state !== 'playing'; i++) world.step(0.15);

    const character = world.objects.kaia;
    const tunnel = world.objects.toys.rainbow.getObjectByName('tunnel');
    tunnel.updateWorldMatrix(true, true);
    const inverse = tunnel.matrixWorld.clone().invert();
    const point = tunnel.position.clone();
    const floor = character.position.y;
    const floorOffset = tunnel.getWorldPosition(point).y - floor;
    let radius = Infinity;
    let near = Infinity;
    let far = -Infinity;
    // Infer a conservative free cylinder from the actual beveled frames and rungs.
    tunnel.traverse((mesh: any) => {
      if (!mesh.isMesh) return;
      const matrix = inverse.clone().multiply(mesh.matrixWorld);
      const vertices = mesh.geometry.attributes.position;
      for (let i = 0; i < vertices.count; i++) {
        point.fromBufferAttribute(vertices, i).applyMatrix4(matrix);
        radius = Math.min(radius, Math.hypot(point.x, point.y));
        near = Math.min(near, point.z);
        far = Math.max(far, point.z);
      }
    });

    let clearance = Infinity;
    let floorClearance = Infinity;
    let insideSamples = 0;
    let worst: any;
    const inspect = (x: number, y: number, z: number, mesh: any) => {
      if (z < near - 1e-6 || z > far + 1e-6) return;
      insideSamples++;
      const gap = radius - Math.hypot(x, y);
      if (gap < clearance) {
        clearance = gap;
        worst = { elapsed: world.state().elapsed, mesh: mesh.name || mesh.geometry.type, x, y, z };
      }
    };
    let frames = 0;
    while (world.state().state === 'playing' && frames++ < 450) {
      world.step(1 / 30);
      character.updateWorldMatrix(true, true);
      character.children[0].traverseVisible((mesh: any) => {
        if (!mesh.isMesh) return;
        const matrix = inverse.clone().multiply(mesh.matrixWorld);
        const vertices = mesh.geometry.attributes.position;
        const transformed = new Float64Array(vertices.count * 3);
        for (let i = 0; i < vertices.count; i++) {
          point.fromBufferAttribute(vertices, i).applyMatrix4(matrix);
          point.toArray(transformed, i * 3);
          floorClearance = Math.min(floorClearance, point.y + floorOffset);
          inspect(point.x, point.y, point.z, mesh);
        }
        // Clip triangle edges at both entrances as well: vertices alone can miss a
        // forehead or sleeve crossing a bar between two sampled vertices.
        const index = mesh.geometry.index;
        const count = index ? index.count : vertices.count;
        for (let i = 0; i < count; i += 3) {
          for (let edge = 0; edge < 3; edge++) {
            const a = (index ? index.getX(i + edge) : i + edge) * 3;
            const b = (index ? index.getX(i + ((edge + 1) % 3)) : i + ((edge + 1) % 3)) * 3;
            const za = transformed[a + 2];
            const zb = transformed[b + 2];
            for (const z of [near, far]) {
              if ((za - z) * (zb - z) >= 0) continue;
              const t = (z - za) / (zb - za);
              inspect(
                transformed[a] + (transformed[b] - transformed[a]) * t,
                transformed[a + 1] + (transformed[b + 1] - transformed[a + 1]) * t,
                z,
                mesh,
              );
            }
          }
        }
      });
    }
    return { clearance, floorClearance, insideSamples, worst, frames, end: world.state() };
  });
  await test.info().attach('crawl-clearance', {
    body: JSON.stringify(result, null, 2),
    contentType: 'application/json',
  });
  expect(result.insideSamples).toBeGreaterThan(10_000);
  expect(result.clearance, JSON.stringify(result.worst)).toBeGreaterThan(0.015);
  expect(result.floorClearance).toBeGreaterThan(-0.018);
  expect(result.end.state).toBe('idle');
  expect(result.end.floorIsFree).toBe(true);
});
