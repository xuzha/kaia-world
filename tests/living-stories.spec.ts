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

test('pets walk, rest and land their jumps while keeping clear of the playground and scenery', async ({
  page,
}) => {
  await prepare(page);
  const result = await page.evaluate(async () => {
    const { Box3 } = await import('/node_modules/three/build/three.module.js');
    const { createZoo } = await import('/src/world/zoo.ts');
    // Sample the actual scene factory without rendering hundreds of extra browser frames.
    const zoo = createZoo();
    zoo.root.visible = true;
    const pets = zoo.root.getObjectByName('zoo-pets').children;
    const samples = pets.map((pet: any) => ({
      kind: pet.name,
      walking: 0,
      resting: 0,
      airborne: 0,
      landed: 0,
      distance: 0,
      previous: pet.position.clone(),
      minY: Infinity,
      maxY: -Infinity,
    }));
    const failures = new Set<string>();
    const playground = new Box3();
    playground.min.set(-7.3, 0.1, -5.9);
    playground.max.set(7.3, 3, 6.08);
    const scenery: { name: string; bounds: any }[] = [];
    zoo.root.updateWorldMatrix(true, true);
    zoo.root.traverse((object: any) => {
      if (!object.isMesh || object === zoo.floor) return;
      for (let p = object; p; p = p.parent) if (p.name === 'zoo-pets') return;
      scenery.push({
        name: object.parent.name || object.geometry.type,
        bounds: new Box3().setFromObject(object, true),
      });
    });
    const bounds = pets.map(() => new Box3());
    try {
      for (let frame = 1; frame <= 1200; frame++) {
        zoo.update(frame * 0.06);
        zoo.root.updateWorldMatrix(true, true);
        pets.forEach((pet: any, i: number) => {
          const sample = samples[i];
          const distance = Math.hypot(
            pet.position.x - sample.previous.x,
            pet.position.z - sample.previous.z,
          );
          sample.distance += distance;
          if (distance > 0.00001) sample.walking++;
          else sample.resting++;
          if (pet.position.y > 0.22) sample.airborne++;
          if (Math.abs(pet.position.y - 0.12) < 0.001) sample.landed++;
          sample.previous.copy(pet.position);
          bounds[i].setFromObject(pet, true);
          sample.minY = Math.min(sample.minY, bounds[i].min.y);
          sample.maxY = Math.max(sample.maxY, bounds[i].min.y);
          if (bounds[i].intersectsBox(playground)) failures.add(`${i} enters playground`);
          for (const obstacle of scenery)
            if (bounds[i].intersectsBox(obstacle.bounds))
              failures.add(`${i} touches ${obstacle.name}`);
        });
        for (let i = 0; i < bounds.length; i++)
          for (let j = i + 1; j < bounds.length; j++)
            if (bounds[i].intersectsBox(bounds[j])) failures.add(`pets ${i} and ${j} touch`);
      }
      return {
        failures: [...failures],
        samples: samples.map(({ previous: _, ...sample }) => sample),
      };
    } finally {
      zoo.dispose();
    }
  });
  expect(result.failures).toEqual([]);
  expect(result.samples.filter((pet: any) => pet.kind === 'zoo-cat')).toHaveLength(1);
  expect(result.samples.filter((pet: any) => pet.kind === 'zoo-dog')).toHaveLength(1);
  expect(result.samples.filter((pet: any) => pet.kind === 'zoo-rabbit')).toHaveLength(4);
  for (const pet of result.samples) {
    expect(pet.walking, pet.kind).toBeGreaterThan(150);
    expect(pet.resting, pet.kind).toBeGreaterThan(150);
    expect(pet.distance, pet.kind).toBeGreaterThan(4);
    expect(pet.minY, pet.kind).toBeGreaterThan(0.112);
    if (pet.kind === 'zoo-rabbit') {
      expect(pet.airborne).toBeGreaterThan(100);
      expect(pet.landed).toBeGreaterThan(150);
      expect(pet.maxY).toBeGreaterThan(0.38);
    }
  }
});

test('the larger opposite-side pond keeps its swimming crocodile inside the water and clear of scenery', async ({
  page,
}) => {
  await prepare(page);
  const result = await page.evaluate(async () => {
    const { Box3, Vector3 } = await import('/node_modules/three/build/three.module.js');
    const { createZoo } = await import('/src/world/zoo.ts');
    const zoo = createZoo();
    zoo.root.visible = true;
    const pond = zoo.root.getObjectByName('zoo-crocodile-pond');
    const crocodile = pond.getObjectByName('zoo-crocodile');
    const water = pond.getObjectByName('crocodile-water');
    const duckPond = zoo.root.getObjectByName('zoo-pond');
    const point = new Vector3();
    const meshes: any[] = [];
    crocodile.traverse((object: any) => {
      if (object.isMesh) meshes.push(object);
    });
    const failures = new Set<string>();
    const shore = new Box3().setFromObject(pond, true);
    zoo.root.traverse((object: any) => {
      if (!object.isMesh || object === zoo.floor) return;
      for (let parent = object; parent; parent = parent.parent) if (parent === pond) return;
      if (shore.intersectsBox(new Box3().setFromObject(object, true)))
        failures.add(`pond touches ${object.parent.name || object.geometry.type}`);
    });
    const previous = crocodile.position.clone();
    let distance = 0,
      radius = 0,
      exposed = 0,
      tailMin = Infinity,
      tailMax = -Infinity;
    try {
      for (let frame = 0; frame <= 400; frame++) {
        zoo.update(frame * 0.21);
        zoo.root.updateWorldMatrix(true, true);
        distance += crocodile.position.distanceTo(previous);
        previous.copy(crocodile.position);
        const tail = crocodile.getObjectByName('crocodile-tail').children[0];
        tailMin = Math.min(tailMin, tail.rotation.y);
        tailMax = Math.max(tailMax, tail.rotation.y);
        for (const object of meshes) {
          const vertices = object.geometry.attributes.position;
          for (let i = 0; i < vertices.count; i += 3) {
            point.fromBufferAttribute(vertices, i).applyMatrix4(object.matrixWorld);
            exposed = Math.max(exposed, point.y - (0.12 + 0.14));
            water.worldToLocal(point);
            radius = Math.max(radius, Math.hypot(point.x, point.y));
          }
        }
      }
      return {
        failures: [...failures],
        radius,
        exposed,
        distance,
        tailMotion: tailMax - tailMin,
        maxX: shore.max.x,
        opposite: pond.position.x * duckPond.position.x < 0,
        areaRatio: (water.scale.x * water.scale.y) / (2.1 * 1.45),
      };
    } finally {
      zoo.dispose();
    }
  });
  expect(result.failures).toEqual([]);
  expect(result.opposite).toBe(true);
  expect(result.areaRatio).toBeGreaterThan(2);
  expect(result.maxX).toBeLessThan(-7.3);
  expect(result.radius).toBeLessThan(0.98);
  expect(result.exposed).toBeGreaterThan(0.3);
  expect(result.distance).toBeGreaterThan(5);
  expect(result.tailMotion).toBeGreaterThan(0.2);
});

for (const story of ['zoo', 'space', 'polar', 'forest']) {
  test(`${story} scenery animates with the simulation and freezes while paused`, async ({
    page,
  }) => {
    await prepare(page);
    await enter(page, story);
    const snapshot = () =>
      page.evaluate((story) => {
        const world = (window as any).__KAIA__;
        const root = world.objects.imagination[story];
        const transforms: number[][] = [];
        root.traverse((object: any) =>
          transforms.push([
            ...object.position.toArray(),
            ...object.rotation.toArray().slice(0, 3),
            ...object.scale.toArray(),
          ]),
        );
        return { time: world.state().time, transforms };
      }, story);
    const before = await snapshot();
    await page.evaluate(() => (window as any).__KAIA__.step(1.5));
    expect((await snapshot()).transforms).not.toEqual(before.transforms);
    await page.locator('#pause').click();
    await page.evaluate(() => (window as any).__KAIA__.setManual(false));
    const paused = await snapshot();
    await page.waitForTimeout(350);
    expect(await snapshot()).toEqual(paused);
  });
}

test('space surrounds the station with stars, preserves its deck, and restores room lighting and text', async ({
  page,
}) => {
  await prepare(page);
  const lighting = () =>
    page.evaluate(() => {
      const scene = (window as any).__KAIA__.objects.room.parent;
      return {
        lights: ['world-ambient', 'world-sun', 'world-fill'].map((name) => {
          const light = scene.getObjectByName(name);
          return {
            color: light.color.getHexString(),
            ground: light.groundColor?.getHexString(),
            intensity: light.intensity,
          };
        }),
        environment: scene.environmentIntensity,
        backdrop: scene.background?.getHexString() ?? null,
        titleColor: getComputedStyle(document.querySelector('.intro h1')!).color,
      };
    });
  const room = await lighting();
  await enter(page, 'space');
  const space = await lighting();
  expect(space.backdrop).toBe('0b132c');
  expect(space.lights).not.toEqual(room.lights);
  expect(space.titleColor).not.toEqual(room.titleColor);
  await page.waitForFunction(() => {
    const root = (window as any).__KAIA__.objects.imagination.space;
    return root.getObjectByName('space-milky-way').material.map.image?.complete;
  });
  const sky = await page.evaluate(async () => {
    const world = (window as any).__KAIA__;
    const root = world.objects.imagination.space;
    const stars = root.getObjectByName('space-stars');
    const deck = root.getObjectByName('space-floor');
    const originalDeck = deck.matrixWorld.toArray();
    const seenMeteors = new Set();
    for (let i = 0; i < 38; i++) {
      world.step(0.5);
      seenMeteors.add(root.getObjectByName('shooting-star').visible);
    }
    return {
      counts: stars.children.map((points: any) => points.geometry.attributes.position.count),
      panorama: {
        width: root.getObjectByName('space-milky-way').material.map.image.naturalWidth,
        height: root.getObjectByName('space-milky-way').material.map.image.naturalHeight,
      },
      depths: stars.children.map((points: any) => points.geometry.attributes.position.array[0]),
      nebula: !!root.getObjectByName('space-milky-way').material.map,
      windows: root.getObjectByName('observatory-windows').children.length,
      atmosphere: !!root.getObjectByName('earth-atmosphere'),
      deckStable: originalDeck.every(
        (value: number, i: number) => value === deck.matrixWorld.elements[i],
      ),
      meteorAppearsAndLeaves: seenMeteors.size === 2,
    };
  });
  expect(sky.counts).toHaveLength(3);
  expect(sky.counts.reduce((a: number, b: number) => a + b, 0)).toBeGreaterThan(1500);
  expect(sky.panorama).toEqual({ width: 4096, height: 2048 });
  expect(new Set(sky.depths).size).toBe(3);
  expect(sky.nebula && sky.atmosphere && sky.deckStable && sky.meteorAppearsAndLeaves).toBe(true);
  expect(sky.windows).toBeGreaterThanOrEqual(8);
  await page.locator('#pause').click();
  await page.locator('#open-imagination').click();
  await page.locator('#leave-story').click();
  await expect.poll(lighting).toEqual(room);
  await expect(page.locator('body')).not.toHaveClass(/space/);
});

test('station hardware leaves walking clearance and both photographic textures load locally', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('requestfailed', (request) => errors.push(request.url()));
  await prepare(page);
  await enter(page, 'space');
  await page.waitForFunction(() => {
    const root = (window as any).__KAIA__.objects.imagination.space;
    return (
      root.getObjectByName('story-earth').material.uniforms.surface.value.image?.complete &&
      root.getObjectByName('space-milky-way').material.map.image?.complete
    );
  });
  const result = await page.evaluate(async () => {
    const { Box3, Raycaster, Scene, Vector3 } =
      await import('/node_modules/three/build/three.module.js');
    const { createRoom } = await import('/src/world/room.ts');
    const { Navigation } = await import('/src/world/navigation.ts');
    const world = (window as any).__KAIA__;
    const station = world.objects.imagination.space.getObjectByName('space-station');
    const navigation = new Navigation(createRoom(new Scene()).obstacles);
    station.updateWorldMatrix(true, true);
    const walkingSpace = new Box3(new Vector3(-7.3, 0.14, -5.9), new Vector3(7.3, 3.1, 6.08));
    const candidates: any[] = [];
    station.traverse((object: any) => {
      if (
        object.isMesh &&
        object.name !== 'space-floor' &&
        new Box3().setFromObject(object, true).intersectsBox(walkingSpace)
      )
        candidates.push(object);
    });
    const ray = new Raycaster(new Vector3(), new Vector3(0, -1, 0), 0, 2.96);
    const failures: string[] = [];
    let samples = 0;
    // Probe a body-sized disk at every free navigation grid cell, not just toy destinations.
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
              (hit.object.parent.name || hit.object.name || hit.object.geometry.type) +
                ' at ' +
                hit.point
                  .toArray()
                  .map((value: number) => value.toFixed(2))
                  .join(','),
            );
        }
      }
    const root = world.objects.imagination.space;
    const textures = [
      root.getObjectByName('space-milky-way').material.map,
      root.getObjectByName('story-earth').material.uniforms.surface.value,
    ];
    return {
      samples,
      failures,
      textures: textures.map((texture) => ({
        local: new URL(texture.image.src).origin === location.origin,
        width: texture.image.naturalWidth,
      })),
    };
  });
  expect(result.samples).toBeGreaterThan(10000);
  expect(result.failures).toEqual([]);
  expect(result.textures).toEqual([
    { local: true, width: 4096 },
    { local: true, width: 1024 },
  ]);
  expect(errors).toEqual([]);
});
