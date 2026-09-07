import { expect, test, type Page } from '@playwright/test';

async function prepare(page: Page) {
  await page.goto('/?inspect=1');
  await page.waitForFunction(() => (window as any).__KAIA__);
  await page.evaluate(() => {
    const world = (window as any).__KAIA__;
    world.setManual(true);
    world.setAuto(false);
    world.setFamilyAuto(false);
  });
}

async function choose(page: Page, story: string) {
  await page.locator('#open-imagination').click();
  await page.locator(`[data-story="${story}"]`).click();
  await expect(page.locator('.story-card[aria-pressed="true"]')).toHaveCount(1);
  await expect(page.locator(`[data-story="${story}"]`)).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#enter-story').click();
}

async function arrive(page: Page, story: string) {
  await page.evaluate((story) => {
    const world = (window as any).__KAIA__;
    for (let i = 0; i < 650 && world.state().imagination.state !== story; i++) world.step(0.1);
    world.step(3);
  }, story);
  await expect(page.locator('body')).toHaveClass(new RegExp(story));
}

test('the five books replace the entire environment, use their own pages, and restore the room', async ({
  page,
}) => {
  await prepare(page);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const originalToys = await page.evaluate(() =>
    Object.values((window as any).__KAIA__.objects.toys).map((toy: any) => toy.position.toArray()),
  );
  const pages: string[] = [];
  for (const story of ['ocean', 'space', 'zoo', 'polar', 'forest', 'ocean']) {
    await choose(page, story);
    await arrive(page, story);
    const view = await page.evaluate(() => {
      const { imagination, room, roomGround, toys } = (window as any).__KAIA__.objects;
      let bookPage = '';
      toys.books.getObjectByName('page').parent.traverse((object: any) => {
        if (
          object.isMesh &&
          object.geometry.type === 'PlaneGeometry' &&
          object.material.map?.image?.toDataURL
        )
          bookPage = object.material.map.image.toDataURL();
      });
      return {
        room: room.visible,
        ground: roomGround.visible,
        visible: ['ocean', 'space', 'zoo', 'polar', 'forest'].filter(
          (id) => imagination[id].visible,
        ),
        sailing: imagination.boat.visible,
        roof: toys.castle.getObjectByName('castle-roof').visible,
        toys: Object.values(toys).map((toy: any) => toy.position.toArray()),
        bookPage,
      };
    });
    expect(view.room).toBe(false);
    expect(view.ground).toBe(false);
    expect(view.visible).toEqual([story]);
    expect(view.sailing).toBe(story === 'ocean');
    expect(view.roof).toBe(story !== 'ocean');
    expect(view.toys).toEqual(originalToys);
    expect(view.bookPage).not.toBe('');
    pages.push(view.bookPage);
  }
  expect(new Set(pages).size).toBe(5);
  await page.locator('#pause').click();
  await page.locator('#open-imagination').click();
  await page.locator('#leave-story').click();
  const restored = await page.evaluate(() => {
    const world = (window as any).__KAIA__;
    return {
      room: world.objects.room.visible,
      ground: world.objects.roomGround.visible,
      stories: ['ocean', 'space', 'zoo', 'polar', 'forest'].filter(
        (id) => world.objects.imagination[id].visible,
      ),
      paused: world.state().paused,
    };
  });
  expect(restored).toEqual({ room: true, ground: true, stories: [], paused: true });
  expect(errors).toEqual([]);
});

for (const story of ['space', 'zoo', 'polar', 'forest']) {
  test(`${story} waits for the slide, supports the real walking area, and keeps shared play working`, async ({
    page,
  }) => {
    await prepare(page);
    await page.evaluate(() => {
      const world = (window as any).__KAIA__;
      world.request('castle');
      for (let i = 0; i < 500 && world.state().state !== 'playing'; i++) world.step(0.1);
      world.step(4);
    });
    await choose(page, story);
    const waiting = await page.evaluate(() => (window as any).__KAIA__.state());
    expect(waiting.imagination.state).toBe('opening');
    expect(waiting.imagination.story).toBe(story);
    expect(waiting.position[1]).toBeGreaterThan(0.6);
    expect(waiting.queued).toBe('books');
    await arrive(page, story);
    const support = await page.evaluate(async (story) => {
      const { Raycaster, Vector3 } = await import('/node_modules/three/build/three.module.js');
      const world = (window as any).__KAIA__;
      const floor = world.objects.imagination[story].getObjectByName(`${story}-floor`);
      floor.updateWorldMatrix(true, true);
      const ray = new Raycaster(),
        down = new Vector3(0, -1, 0);
      let missing = 0,
        samples = 0;
      for (let x = -7.05; x <= 7.05; x += 0.47)
        for (let z = -5.65; z <= 5.83; z += 0.41) {
          ray.set(new Vector3(x, 10, z), down);
          const hit = ray.intersectObject(floor, false)[0];
          samples++;
          if (!hit || Math.abs(hit.point.y - 0.12) > 0.001) missing++;
        }
      return { missing, samples, destinations: world.state().destinations };
    }, story);
    expect(support.samples).toBeGreaterThan(800);
    expect(support.missing).toBe(0);
    expect(support.destinations.every((d: any) => d.free && d.reachable)).toBe(true);
    await page.locator('#open-together').click();
    await page.locator('[data-together="roll"]').click();
    await page.evaluate(() => {
      const world = (window as any).__KAIA__;
      for (let i = 0; i < 600 && world.state().together.phase !== 'ready'; i++) world.step(0.1);
    });
    await page.locator('#roll-ball').click();
    await page.evaluate(() => (window as any).__KAIA__.step(8));
    const together = await page.evaluate(() => (window as any).__KAIA__.state());
    expect(together.together.rounds).toBe(1);
    expect(together.imagination.state).toBe(story);
    expect(together.floorIsFree).toBe(true);
  });
}

test('pending choices can be replaced or cancelled without leaving a stray environment', async ({
  page,
}) => {
  await prepare(page);
  await choose(page, 'space');
  await choose(page, 'zoo');
  await arrive(page, 'zoo');
  await page.locator('#open-imagination').click();
  await page.locator('#leave-story').click();
  await page.evaluate(() => (window as any).__KAIA__.step(22));
  await choose(page, 'space');
  await page.locator('[data-toy="blocks"]').click();
  await page.evaluate(() => (window as any).__KAIA__.step(25));
  const cancelled = await page.evaluate(() => {
    const world = (window as any).__KAIA__;
    return {
      state: world.state().imagination.state,
      room: world.objects.room.visible,
      visible: ['ocean', 'space', 'zoo', 'polar', 'forest'].filter(
        (id) => world.objects.imagination[id].visible,
      ),
    };
  });
  expect(cancelled).toEqual({ state: 'room', room: true, visible: [] });
});

test('a new book preserves the sailing scene until Kaia disembarks and starts reading', async ({
  page,
}) => {
  await prepare(page);
  await choose(page, 'ocean');
  await arrive(page, 'ocean');
  await page.evaluate(() => {
    const world = (window as any).__KAIA__;
    world.request('horse');
    for (
      let i = 0;
      i < 650 && !(world.state().toy === 'horse' && world.state().state === 'playing');
      i++
    )
      world.step(0.1);
    world.step(4);
  });
  await choose(page, 'space');
  const handoff = await page.evaluate(() => {
    const world = (window as any).__KAIA__;
    let ridingFrames = 0,
      lostBoat = 0;
    while (
      world.state().toy === 'horse' &&
      world.state().state === 'playing' &&
      ridingFrames++ < 200
    ) {
      if (
        !world.objects.imagination.boat.visible ||
        !world.objects.imagination.ocean.visible ||
        world.objects.room.visible
      )
        lostBoat++;
      world.step(0.1);
    }
    return { ridingFrames, lostBoat, state: world.state().imagination.state };
  });
  expect(handoff.ridingFrames).toBeGreaterThan(60);
  expect(handoff.lostBoat).toBe(0);
  expect(handoff.state).toBe('opening');
  await arrive(page, 'space');
  await choose(page, 'zoo');
  await page.locator('[data-toy="blocks"]').click();
  await page.evaluate(() => (window as any).__KAIA__.step(3));
  const cancelled = await page.evaluate(() => {
    const world = (window as any).__KAIA__;
    return {
      state: world.state().imagination.state,
      space: world.objects.imagination.space.visible,
      room: world.objects.room.visible,
    };
  });
  expect(cancelled).toEqual({ state: 'space', space: true, room: false });
});

test('the zoo giraffe stays below the desktop book controls', async ({ page }) => {
  await prepare(page);
  await choose(page, 'zoo');
  await arrive(page, 'zoo');
  await expect
    .poll(() => page.evaluate(() => (window as any).__KAIA__.state().camera.target[1]))
    .toBeCloseTo(2.95);
  const framing = await page.evaluate(async () => {
    const { Vector3 } = await import('/node_modules/three/build/three.module.js');
    const { imagination, camera } = (window as any).__KAIA__.objects;
    const giraffe = imagination.zoo.getObjectByName('zoo-giraffe');
    giraffe.updateWorldMatrix(true, true);
    const point = new Vector3(),
      canvas = document.querySelector('#world canvas')!.getBoundingClientRect();
    let top = Infinity;
    giraffe.traverseVisible((mesh: any) => {
      if (!mesh.isMesh) return;
      const positions = mesh.geometry.attributes.position;
      for (let i = 0; i < positions.count; i += 3) {
        point.fromBufferAttribute(positions, i).applyMatrix4(mesh.matrixWorld).project(camera);
        top = Math.min(top, canvas.top + ((1 - point.y) * canvas.height) / 2);
      }
    });
    return {
      top,
      controlsBottom: document.querySelector('.wonder-bar')!.getBoundingClientRect().bottom,
    };
  });
  expect(framing.top).toBeGreaterThan(framing.controlsBottom + 5);
});

test('phone readers can choose every book and see the planets and animals within the scene', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await prepare(page);
  for (const story of ['space', 'zoo', 'polar', 'forest']) {
    await choose(page, story);
    await arrive(page, story);
    await expect
      .poll(() => page.evaluate(() => (window as any).__KAIA__.state().camera.zoom))
      .toBeCloseTo({ space: 0.77, zoo: 0.82, polar: 0.78, forest: 0.74 }[story]);
    const features = await page.evaluate(async (story) => {
      const { Vector3 } = await import('/node_modules/three/build/three.module.js');
      const { imagination, camera } = (window as any).__KAIA__.objects;
      const world = imagination[story];
      world.updateWorldMatrix(true, true);
      const names =
        story === 'space'
          ? ['story-earth', 'ringed-planet']
          : story === 'zoo'
            ? ['zoo-giraffe', 'zoo-elephant', 'zoo-lion', 'zoo-crocodile-pond']
            : story === 'polar'
              ? ['polar-igloo', 'polar-penguin', 'polar-seal']
              : ['forest-treehouse', 'forest-bridge', 'forest-squirrel'];
      const point = new Vector3();
      return names.map((name) => {
        const model = world.getObjectByName(name);
        const bounds = { name, minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
        model.traverseVisible((mesh: any) => {
          if (!mesh.isMesh) return;
          const positions = mesh.geometry.attributes.position;
          for (let i = 0; i < positions.count; i += 3) {
            point.fromBufferAttribute(positions, i).applyMatrix4(mesh.matrixWorld).project(camera);
            bounds.minX = Math.min(bounds.minX, point.x);
            bounds.maxX = Math.max(bounds.maxX, point.x);
            bounds.minY = Math.min(bounds.minY, point.y);
            bounds.maxY = Math.max(bounds.maxY, point.y);
          }
        });
        return bounds;
      });
    }, story);
    for (const bounds of features) {
      expect(bounds.minX, bounds.name).toBeGreaterThan(-0.97);
      expect(bounds.maxX, bounds.name).toBeLessThan(0.97);
      expect(bounds.minY, bounds.name).toBeGreaterThan(-0.9);
      expect(bounds.maxY, bounds.name).toBeLessThan(0.8);
    }
    if (story === 'space') {
      await expect(page.locator('.space-credit')).toBeVisible();
      const creditClear = await page.evaluate(() => {
        const credit = document.querySelector('.space-credit')!.getBoundingClientRect();
        return ['.world-tag', '.view-hint', '.kaia-status', '.family-actions'].every((selector) => {
          const other = document.querySelector(selector)!.getBoundingClientRect();
          return (
            credit.right <= other.left ||
            credit.left >= other.right ||
            credit.bottom <= other.top ||
            credit.top >= other.bottom
          );
        });
      });
      expect(creditClear).toBe(true);
    }
    await page.screenshot({
      path: `artifacts/story-${story}-mobile.jpg`,
      type: 'jpeg',
      quality: 65,
      animations: 'disabled',
    });
  }
  await page.locator('#open-imagination').click();
  await expect(page.locator('.story-card')).toHaveCount(5);
  await expect(page.locator('#imagination-panel')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  await page.screenshot({
    path: 'artifacts/story-picker-mobile.jpg',
    type: 'jpeg',
    quality: 65,
    animations: 'disabled',
  });
});
