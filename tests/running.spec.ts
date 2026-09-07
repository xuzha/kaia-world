import { expect, test } from '@playwright/test';

test('Kaia sometimes runs with a distinct grounded gait and walks into toys and corners', async ({
  page,
}, testInfo) => {
  await page.goto('/?inspect=1');
  await page.waitForFunction(() => (window as any).__KAIA__);
  await page.evaluate(() => (window as any).__KAIA__.setManual(true));
  const result = await page.evaluate(async () => {
    const { Box3, Scene, Vector3 } = await import('/node_modules/three/build/three.module.js');
    const { Character } = await import('/src/characters/rig.ts');
    const { PlayDirector, moveAlongPath } = await import('/src/characters/director.ts');
    const { Navigation } = await import('/src/world/navigation.ts');
    const { createRoom } = await import('/src/world/room.ts');
    const { createToys } = await import('/src/toys/registry.ts');
    const scene = new Scene(),
      room = createRoom(scene),
      toys = createToys(scene);
    const navigation = new Navigation([
      ...room.obstacles,
      ...toys.flatMap((toy: any) => toy.obstacles),
    ]);
    const character = new Character();
    const events: any[] = [];
    const director = new PlayDirector(character, toys, navigation, (event: any) =>
      events.push(event),
    );
    director.auto = false;
    character.root.position.set(-5.2, 0.12, 5.1);
    character.root.rotation.y = Math.PI / 2;
    const soles = ['left-sole', 'right-sole'].map((name) => character.root.getObjectByName(name));
    const box = new Box3(),
      previous = new Vector3();
    let time = 0,
      maxSpeed = 0,
      minFoot = Infinity,
      maxFoot = -Infinity,
      flights = 0,
      landings = 0,
      bentArms = 0,
      corners = 0;
    let maxAcceleration = 0,
      maxDeceleration = 0,
      arrivalGap = 0;
    const failures = new Set<string>(),
      runningByTrip: number[] = [];
    const ids = ['music', 'tea', 'rainbow', 'castle', 'horse', 'books', 'music'];
    for (const id of ids) {
      director.request(id);
      let runningFrames = 0;
      for (let frame = 0; frame < 1800 && director.state === 'walking'; frame++) {
        const dt = [1 / 60, 1 / 30, 1 / 20][frame % 3];
        const beforeSpeed = director.speed;
        const waypoint = director.path[0];
        previous.copy(character.root.position);
        director.update(dt, (time += dt));
        maxAcceleration = Math.max(maxAcceleration, (director.speed - beforeSpeed) / dt);
        maxDeceleration = Math.max(maxDeceleration, (beforeSpeed - director.speed) / dt);
        maxSpeed = Math.max(maxSpeed, director.speed);
        if (!navigation.clearLine(previous, character.root.position) && failures.size < 8)
          failures.add(
            `blocked route to ${id}: ${JSON.stringify({ from: previous.toArray(), to: character.root.position.toArray(), waypoint, next: director.path[0], speed: director.speed, dt, free: navigation.isFree(character.root.position) })}`,
          );
        if (director.path[0] !== waypoint && director.path.length) {
          corners++;
          if (director.speed > 1.05) failures.add(`runs around corner to ${id}`);
        }
        character.root.updateWorldMatrix(true, true);
        const bottom = Math.min(...soles.map((sole: any) => box.setFromObject(sole, true).min.y));
        minFoot = Math.min(minFoot, bottom);
        maxFoot = Math.max(maxFoot, bottom);
        if (director.running) {
          runningFrames++;
          if (bottom > 0.15) flights++;
          if (bottom < 0.123) landings++;
          if (character.pose.elbowL < -0.75 && character.pose.elbowR < -0.75) bentArms++;
        }
      }
      runningByTrip.push(runningFrames);
      if (director.state !== 'playing') failures.add(`never arrived at ${id}`);
      if (director.speed > 1.05) failures.add(`runs into ${id}`);
      const toy = toys.find((toy: any) => toy.id === id);
      arrivalGap = Math.max(
        arrivalGap,
        Math.hypot(
          character.root.position.x - toy.destination.x,
          character.root.position.z - toy.destination.z,
        ),
      );
      for (let frame = 0; frame < 1200 && director.state === 'playing'; frame++)
        director.update(1 / 30, (time += 1 / 30));
    }
    // The shared helper still uses the ordinary gait for parents and together-time approaches.
    const ordinary = new Character('mom');
    const path = [{ x: 3, z: 0 }];
    for (let frame = 0; frame < 30; frame++)
      moveAlongPath(ordinary, path, 0.84, 1 / 30, frame / 30);
    return {
      failures: [...failures],
      maxSpeed,
      minFoot,
      maxFoot,
      flights,
      landings,
      bentArms,
      corners,
      maxAcceleration,
      maxDeceleration,
      arrivalGap,
      runningByTrip,
      paceEvents: events.filter((event) => event.type === 'pace' && event.running).length,
      parentElbow: ordinary.pose.elbowL,
      parentDistance: ordinary.root.position.x,
    };
  });
  await testInfo.attach('running-samples', {
    body: JSON.stringify(result, null, 2),
    contentType: 'application/json',
  });
  expect(result.failures).toEqual([]);
  expect(result.maxSpeed).toBeGreaterThan(1.5);
  expect(result.maxSpeed).toBeLessThan(1.9);
  expect(result.runningByTrip[0]).toBeGreaterThan(30);
  expect(result.runningByTrip[1]).toBe(0);
  expect(result.paceEvents).toBeGreaterThan(0);
  expect(result.corners).toBeGreaterThan(0);
  expect(result.flights).toBeGreaterThan(10);
  expect(result.landings).toBeGreaterThan(10);
  expect(result.bentArms).toBeGreaterThan(20);
  expect(result.minFoot).toBeGreaterThan(0.115);
  expect(result.maxFoot).toBeLessThan(0.22);
  expect(result.maxAcceleration).toBeLessThan(1.3);
  expect(result.maxDeceleration).toBeLessThan(3);
  expect(result.arrivalGap).toBeLessThan(0.001);
  expect(result.parentElbow).toBeGreaterThan(-0.25);
  expect(result.parentDistance).toBeCloseTo(0.84, 4);
});

test('a running trip pauses exactly and can safely hand off to shared play', async ({ page }) => {
  await page.goto('/?inspect=1');
  await page.waitForFunction(() => (window as any).__KAIA__);
  await page.evaluate(() => {
    const world = (window as any).__KAIA__;
    world.setManual(true);
    world.setAuto(false);
    world.setFamilyAuto(false);
    world.objects.kaia.position.set(-5.2, 0.12, 5.1);
    world.objects.kaia.rotation.y = Math.PI / 2;
    world.request('music');
    for (let i = 0; i < 100 && !world.state().locomotion.running; i++) world.step(0.05);
  });
  const state = () => page.evaluate(() => (window as any).__KAIA__.state());
  expect((await state()).locomotion.running).toBe(true);
  await page.locator('#pause').click();
  await page.evaluate(() => (window as any).__KAIA__.setManual(false));
  const paused = await state();
  await page.waitForTimeout(300);
  const still = await state();
  expect(still.time).toBe(paused.time);
  expect(still.position).toEqual(paused.position);
  expect(still.pose).toEqual(paused.pose);
  await page.evaluate(() => (window as any).__KAIA__.setManual(true));
  await page.locator('#pause').click();
  await page.locator('#open-together').click();
  await page.locator('[data-together="roll"]').click();
  await page.evaluate(() => {
    const world = (window as any).__KAIA__;
    for (let i = 0; i < 400 && world.state().together.phase !== 'ready'; i++) world.step(0.1);
  });
  const shared = await state();
  expect(shared.together.mode).toBe('roll');
  expect(shared.together.phase).toBe('ready');
  expect(shared.locomotion.running).toBe(false);
  expect(shared.floorIsFree).toBe(true);
});
