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

async function enter(page: Page, story: string) {
  await page.locator('#open-imagination').click();
  await page.locator(`[data-story="${story}"]`).click();
  await page.locator('#enter-story').click();
  await page.evaluate((story) => {
    const world = (window as any).__KAIA__;
    for (let i = 0; i < 650 && world.state().imagination.state !== story; i++) world.step(0.1);
    world.step(3);
  }, story);
  await expect(page.locator('body')).toHaveClass(new RegExp(story));
}

test('two parrots keep their claws on the curved zoo perch while looking around and preening', async ({
  page,
}) => {
  await prepare(page);
  const result = await page.evaluate(async () => {
    const { createZoo } = await import('/src/world/zoo.ts');
    const { Raycaster, Vector3, Box3 } = await import('/node_modules/three/build/three.module.js');
    const zoo = createZoo();
    zoo.root.visible = true;
    const parrots = zoo.root.getObjectByName('zoo-parrots').children;
    const perch = zoo.root.getObjectByName('parrot-perch');
    const heads = parrots.map(() => new Set<string>());
    const footMatrices: number[][] = [];
    const gaps: number[] = [];
    const ray = new Raycaster(new Vector3(), new Vector3(0, -1, 0));
    let driftingFeet = 0,
      overlappingBirds = 0;
    try {
      for (let frame = 0; frame < 160; frame++) {
        zoo.update(frame * 0.15);
        zoo.root.updateWorldMatrix(true, true);
        const bounds = parrots.map((bird: any, index: number) => {
          const feet = bird.getObjectByName('parrot-feet');
          const matrix = feet.matrixWorld.toArray();
          footMatrices[index] ??= matrix;
          if (matrix.some((value: number, i: number) => value !== footMatrices[index][i]))
            driftingFeet++;
          heads[index].add(bird.getObjectByName('parrot-head').rotation.toArray().join(','));
          if (frame === 0) {
            for (const x of [-0.095, 0.095]) {
              const toe = new Vector3(x, 0.117, 0).applyMatrix4(feet.matrixWorld);
              ray.ray.origin.copy(toe).add(new Vector3(0, 0.5, 0));
              const hit = ray.intersectObject(perch, false)[0];
              gaps.push(hit ? toe.y - hit.point.y : Infinity);
            }
          }
          return new Box3().setFromObject(bird, true);
        });
        if (bounds[0].intersectsBox(bounds[1])) overlappingBirds++;
      }
      return {
        names: parrots.map((bird: any) => bird.name),
        gaps,
        driftingFeet,
        overlappingBirds,
        poses: heads.map((set) => set.size),
      };
    } finally {
      zoo.dispose();
    }
  });
  expect(result.names).toEqual(['zoo-parrot-scarlet', 'zoo-parrot-blue']);
  expect(result.gaps).toHaveLength(4);
  expect(result.gaps.every((gap: number) => Math.abs(gap) < 0.025)).toBe(true);
  expect(result.driftingFeet).toBe(0);
  expect(result.overlappingBirds).toBe(0);
  expect(result.poses.every((count: number) => count > 30)).toBe(true);
});

for (const story of ['polar', 'forest']) {
  test(`${story} scenery keeps body clearance across the full walking area`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    await prepare(page);
    await enter(page, story);
    const result = await page.evaluate(async (story) => {
      const { Box3, Raycaster, Scene, Vector3 } =
        await import('/node_modules/three/build/three.module.js');
      const { createRoom } = await import('/src/world/room.ts');
      const { Navigation } = await import('/src/world/navigation.ts');
      const world = (window as any).__KAIA__;
      const root = world.objects.imagination[story];
      const navigation = new Navigation(createRoom(new Scene()).obstacles);
      root.updateWorldMatrix(true, true);
      const walkingSpace = new Box3(new Vector3(-7.3, 0.14, -5.9), new Vector3(7.3, 3.1, 6.08));
      const candidates: any[] = [];
      root.traverse((object: any) => {
        if (object.isMesh && new Box3().setFromObject(object, true).intersectsBox(walkingSpace))
          candidates.push(object);
      });
      const ray = new Raycaster(new Vector3(), new Vector3(0, -1, 0), 0, 2.96);
      const failures: string[] = [];
      let samples = 0;
      for (let x = navigation.minX; x <= 7.05; x += navigation.cell)
        for (let z = navigation.minZ; z <= 5.83; z += navigation.cell) {
          if (!navigation.isFree({ x, z })) continue;
          for (let i = 0; i < 9; i++) {
            const angle = (i * Math.PI) / 4,
              radius = i === 8 ? 0 : 0.22;
            ray.ray.origin.set(x + Math.cos(angle) * radius, 3.1, z + Math.sin(angle) * radius);
            const hit = ray.intersectObjects(candidates, false)[0];
            samples++;
            if (hit && failures.length < 8)
              failures.push(
                `${hit.object.parent.name || hit.object.geometry.type} at ${hit.point.toArray().map((n: number) => n.toFixed(2))}`,
              );
          }
        }
      return { samples, failures };
    }, story);
    expect(result.samples).toBeGreaterThan(10000);
    expect(result.failures).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test('polar animals remain on the ice and outside the playground throughout their gestures', async ({
  page,
}) => {
  await prepare(page);
  const result = await page.evaluate(async () => {
    const { createPolar } = await import('/src/world/polar.ts');
    const { Box3, Raycaster, Vector3 } = await import('/node_modules/three/build/three.module.js');
    const polar = createPolar();
    polar.root.visible = true;
    const animals = polar.root.getObjectByName('polar-animals').children;
    const playground = new Box3(new Vector3(-7.3, 0.12, -5.9), new Vector3(7.3, 3.1, 6.08));
    const ray = new Raycaster(new Vector3(), new Vector3(0, -1, 0));
    const failures = new Set<string>();
    try {
      for (let frame = 0; frame < 220; frame++) {
        polar.update(frame * 0.15);
        polar.root.updateWorldMatrix(true, true);
        const bounds = animals.map((animal: any, i: number) => {
          const box = new Box3().setFromObject(animal, true);
          if (box.intersectsBox(playground)) failures.add(`${i} enters playground`);
          if (Math.abs(box.min.y - 0.12) > 0.02) failures.add(`${i} loses ground contact`);
          for (const x of [box.min.x, box.max.x])
            for (const z of [box.min.z, box.max.z]) {
              ray.ray.origin.set(x, 4, z);
              if (!ray.intersectObject(polar.floor, false).length) failures.add(`${i} leaves ice`);
            }
          return box;
        });
        for (let i = 0; i < bounds.length; i++)
          for (let j = i + 1; j < bounds.length; j++)
            if (bounds[i].intersectsBox(bounds[j])) failures.add(`${i} touches ${j}`);
      }
      return { count: animals.length, failures: [...failures] };
    } finally {
      polar.dispose();
    }
  });
  expect(result.count).toBeGreaterThan(4);
  expect(result.failures).toEqual([]);
});

test('night effects freeze with the simulation, stop offstage, and restore the room after closing', async ({
  page,
}) => {
  await prepare(page);
  const lighting = () =>
    page.evaluate(() => {
      const scene = (window as any).__KAIA__.objects.room.parent;
      return ['world-ambient', 'world-sun', 'world-fill'].map((name) => {
        const light = scene.getObjectByName(name);
        return [light.intensity, light.color.getHexString(), light.groundColor?.getHexString()];
      });
    });
  const roomLights = await lighting();
  const effects = () =>
    page.evaluate(() => {
      const { polar, forest } = (window as any).__KAIA__.objects.imagination;
      return {
        aurora: polar.getObjectByName('polar-aurora').children[0].material.uniforms.time.value,
        water: forest.getObjectByName('forest-stream').material.uniforms.time.value,
        fireflies: forest.getObjectByName('forest-fireflies').material.uniforms.time.value,
      };
    });
  await enter(page, 'polar');
  const polarTime = (await effects()).aurora;
  await enter(page, 'forest');
  expect((await effects()).aurora).toBeGreaterThanOrEqual(polarTime);
  await expect(page.locator('#weather')).toContainText('Moonlit forest');
  expect(await lighting()).not.toEqual(roomLights);
  const before = await effects();
  await page.evaluate(() => (window as any).__KAIA__.step(2));
  const after = await effects();
  expect(after.water).toBeGreaterThan(before.water);
  expect(after.fireflies).toBeGreaterThan(before.fireflies);
  expect(after.aurora).toBe(before.aurora);
  await page.locator('#pause').click();
  await page.evaluate(() => (window as any).__KAIA__.setManual(false));
  await page.waitForTimeout(350);
  expect(await effects()).toEqual(after);
  await page.locator('#weather').click();
  await expect(page.locator('#weather')).toContainText('Deep night');
  const sky = await page.evaluate(() =>
    (window as any).__KAIA__.objects.room.parent.background.getHexString(),
  );
  expect(sky).not.toBe('eaf0df');
  await page.locator('#weather').click();
  await page.locator('#open-imagination').click();
  await page.locator('#leave-story').click();
  await expect(page.locator('#weather')).toContainText('Afternoon');
  await expect
    .poll(async () =>
      (await lighting()).every(
        (light, i) =>
          Math.abs(Number(light[0]) - Number(roomLights[i][0])) < 0.005 &&
          light[1] === roomLights[i][1] &&
          light[2] === roomLights[i][2],
      ),
    )
    .toBe(true);
  expect(await effects()).toEqual(after);
});
