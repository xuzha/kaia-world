import { expect, test, type Page } from '@playwright/test';

async function board(page: Page) {
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
  await page.evaluate(() => (window as any).__KAIA__.step(15));
  await expect(page.locator('body')).toHaveClass(/ocean/);
}

test('the real ship deck supports the full play area, every toy, and visiting parents', async ({
  page,
}) => {
  await board(page);
  const result = await page.evaluate(async () => {
    const { Raycaster, Vector3 } = await import('/node_modules/three/build/three.module.js');
    const world = (window as any).__KAIA__;
    const deck = world.objects.imagination.ship.getObjectByName('ship-deck');
    deck.updateWorldMatrix(true, true);
    const ray = new Raycaster(),
      down = new Vector3(0, -1, 0);
    const unsupported: number[][] = [];
    let checked = 0;
    function support(x: number, z: number) {
      ray.set(new Vector3(x, 12, z), down);
      const hit = ray.intersectObject(deck, false)[0];
      checked++;
      if (!hit || Math.abs(hit.point.y - 0.12) > 0.001) unsupported.push([x, z]);
    }
    for (let x = -7.05; x <= 7.05; x += 0.47)
      for (let z = -5.65; z <= 5.83; z += 0.41) support(x, z);
    const visits: string[] = [];
    for (const id of ['books', 'blocks', 'horse', 'music', 'tea', 'castle', 'rainbow', 'ball']) {
      world.request(id);
      for (let i = 0; i < 700; i++) {
        world.step(0.1);
        const state = world.state();
        support(state.position[0], state.position[2]);
        if (state.state === 'idle' && state.visited.includes(id)) break;
      }
      if (world.state().state === 'idle' && world.state().visited.includes(id)) visits.push(id);
    }
    world.invite('mom');
    world.invite('dad');
    let parentSamples = 0;
    for (let i = 0; i < 300; i++) {
      world.step(0.1);
      for (const parent of Object.values(world.state().family) as any[]) {
        if (!parent.visible) continue;
        support(parent.position[0], parent.position[2]);
        parentSamples++;
      }
    }
    return {
      unsupported,
      checked,
      visits,
      parentSamples,
      destinations: world.state().destinations,
    };
  });
  expect(result.unsupported).toEqual([]);
  expect(result.checked).toBeGreaterThan(1000);
  expect(result.visits).toHaveLength(8);
  expect(result.parentSamples).toBeGreaterThan(200);
  expect(result.destinations.every((d: any) => d.free && d.reachable)).toBe(true);
});

test('sailing scenery moves around a stable deck and freezes when paused', async ({ page }) => {
  await board(page);
  const snapshot = () =>
    page.evaluate(() => {
      const { ocean, ship } = (window as any).__KAIA__.objects.imagination;
      const sail = ship.getObjectByName('ship-sail');
      return {
        time: (window as any).__KAIA__.state().time,
        deck: ship.getObjectByName('ship-deck').matrixWorld.toArray(),
        wave: ocean.getObjectByName('passing-waves').children[0].position.x,
        gull: ocean.getObjectByName('sea-gull').position.toArray(),
        cloth: Array.from(sail.geometry.attributes.position.array),
      };
    });
  const before = await snapshot();
  await page.evaluate(() => (window as any).__KAIA__.step(2));
  const sailing = await snapshot();
  expect(sailing.deck).toEqual(before.deck);
  expect(sailing.wave).not.toBe(before.wave);
  expect(sailing.gull).not.toEqual(before.gull);
  expect(sailing.cloth).not.toEqual(before.cloth);
  await page.locator('#pause').click();
  await page.evaluate(() => (window as any).__KAIA__.setManual(false));
  const paused = await snapshot();
  await page.waitForTimeout(200);
  expect(await snapshot()).toEqual(paused);
});

test('the whole ship fits on a phone and room mode returns to its original camera', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await board(page);
  await expect
    .poll(() => page.evaluate(() => (window as any).__KAIA__.state().camera.zoom))
    .toBeCloseTo(0.86);
  const bounds = await page.evaluate(async () => {
    const { Vector3 } = await import('/node_modules/three/build/three.module.js');
    const { imagination, camera } = (window as any).__KAIA__.objects;
    imagination.ship.updateWorldMatrix(true, true);
    const point = new Vector3();
    const min = [Infinity, Infinity],
      max = [-Infinity, -Infinity];
    imagination.ship.traverseVisible((object: any) => {
      if (!object.isMesh) return;
      const vertices = object.geometry.attributes.position;
      for (let i = 0; i < vertices.count; i += 3) {
        point.fromBufferAttribute(vertices, i).applyMatrix4(object.matrixWorld).project(camera);
        min[0] = Math.min(min[0], point.x);
        min[1] = Math.min(min[1], point.y);
        max[0] = Math.max(max[0], point.x);
        max[1] = Math.max(max[1], point.y);
      }
    });
    return { min, max, overflow: document.documentElement.scrollWidth > innerWidth };
  });
  expect(bounds.overflow).toBe(false);
  expect(Math.max(...bounds.max)).toBeLessThan(0.97);
  expect(Math.min(...bounds.min)).toBeGreaterThan(-0.97);
  await expect(page.locator('#world canvas')).toHaveAttribute('aria-label', /deck of a ship/);
  await page.screenshot({ path: 'artifacts/voyage-mobile.jpg', type: 'jpeg', quality: 65 });
  await page.locator('#open-imagination').click();
  await page.locator('#leave-story').click();
  await page.evaluate(() => (window as any).__KAIA__.step(3));
  await expect
    .poll(() => page.evaluate(() => (window as any).__KAIA__.state().camera.zoom))
    .toBeCloseTo(1);
  await expect(page.locator('#world canvas')).toHaveAttribute('aria-label', /cozy playroom/);
  await expect(page.locator('#world-name')).toHaveText('Kaia’s playroom');
});
