import { expect, test } from '@playwright/test';

test('boarding, sailing, and leaving the hollow boat keep the rendered body clear', async ({
  page,
}) => {
  await page.goto('/?inspect=1');
  await page.waitForFunction(() => (window as any).__KAIA__);
  await page.evaluate(() => {
    const world = (window as any).__KAIA__;
    world.setManual(true);
    world.setAuto(false);
    world.setFamilyAuto(false);
  });
  await page.locator('#open-imagination').click();
  await page.locator('#enter-story').click();
  const result = await page.evaluate(async () => {
    const { Box3, DoubleSide, Mesh, MeshBasicMaterial, Raycaster, Vector3 } =
      await import('/node_modules/three/build/three.module.js');
    const world = (window as any).__KAIA__;
    world.step(15);
    world.request('horse');
    for (
      let i = 0;
      i < 500 && !(world.state().toy === 'horse' && world.state().state === 'playing');
      i++
    )
      world.step(0.1);
    const boat = world.objects.imagination.boat;
    const character = world.objects.kaia;
    const material = new MeshBasicMaterial({ side: DoubleSide });
    const probes = ['boat-hull', 'boat-seat', 'boat-floor'].map((name) => {
      const model = boat.getObjectByName(name);
      model.geometry.computeBoundingBox();
      return { name, model, mesh: new Mesh(model.geometry, material), bounds: new Box3() };
    });
    const raycaster = new Raycaster(),
      up = new Vector3(0, 1, 0),
      down = new Vector3(0, -1, 0);
    const point = new Vector3(),
      source = new Vector3(),
      bounds = new Box3();
    const collisions: any[] = [];
    const recorded = new Set<string>();
    let frames = 0,
      tested = 0,
      floorClearance = Infinity;
    while (world.state().state === 'playing' && frames++ < 180) {
      world.step(1 / 12);
      character.updateWorldMatrix(true, true);
      boat.updateWorldMatrix(true, true);
      for (const p of probes) {
        p.mesh.matrixWorld.copy(p.model.matrixWorld);
        p.bounds.copy(p.model.geometry.boundingBox).applyMatrix4(p.model.matrixWorld);
      }
      character.children[0].traverseVisible((mesh: any) => {
        if (!mesh.isMesh) return;
        const positions = mesh.geometry.attributes.position;
        bounds.setFromObject(mesh, true);
        const nearby = probes.filter((p) => {
          if (p.name === 'boat-floor')
            return (
              bounds.min.y < p.bounds.max.y &&
              bounds.max.x > p.bounds.min.x &&
              bounds.min.x < p.bounds.max.x &&
              bounds.max.z > p.bounds.min.z &&
              bounds.min.z < p.bounds.max.z
            );
          return bounds.intersectsBox(p.bounds);
        });
        for (let i = 0; i < positions.count; i += 2) {
          point.fromBufferAttribute(positions, i).applyMatrix4(mesh.matrixWorld);
          floorClearance = Math.min(floorClearance, point.y - 0.12);
          for (const p of nearby) {
            const key = mesh.uuid + p.name;
            if (recorded.has(key)) continue;
            let inside = false;
            if (p.name === 'boat-floor') {
              source.copy(point);
              source.y += 2;
              raycaster.set(source, down);
              const hit = raycaster.intersectObject(p.mesh, false)[0];
              inside = !!hit && point.y < hit.point.y - 0.01;
            } else if (p.bounds.containsPoint(point)) {
              raycaster.set(point, up);
              const hits = raycaster.intersectObject(p.mesh, false);
              const crossings = hits.filter(
                (hit: any, n: number) =>
                  n === 0 || Math.abs(hit.distance - hits[n - 1].distance) > 0.001,
              );
              inside = crossings.length % 2 === 1 && crossings[0].distance > 0.01;
              tested++;
            }
            if (inside) {
              recorded.add(key);
              let named = mesh;
              while (!named.name && named.parent && named.parent !== character)
                named = named.parent;
              collisions.push({
                elapsed: world.state().elapsed,
                mesh: mesh.name || named.name || mesh.geometry.type,
                barrier: p.name,
                point: point.toArray(),
              });
            }
          }
        }
      });
    }
    material.dispose();
    return { collisions, frames, tested, floorClearance, end: world.state() };
  });
  await test.info().attach('sailboat-clearance', {
    body: JSON.stringify(result, null, 2),
    contentType: 'application/json',
  });
  expect(result.frames).toBeGreaterThan(150);
  expect(result.tested).toBeGreaterThan(100);
  expect(result.collisions).toEqual([]);
  expect(result.floorClearance).toBeGreaterThan(-0.02);
  expect(result.end.state).toBe('idle');
  expect(result.end.floorIsFree).toBe(true);
});
