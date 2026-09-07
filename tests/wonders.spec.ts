import { expect, test, type Page } from '@playwright/test';

const errors = new WeakMap<Page, string[]>();
test.beforeEach(({ page }) => {
  const messages: string[] = [];
  errors.set(page, messages);
  page.on('pageerror', (error) => messages.push(error.message));
});
test.afterEach(({ page }) => {
  expect(errors.get(page)).toEqual([]);
});

async function prepare(page: Page) {
  await page.goto('/?inspect=1');
  await page.waitForFunction(() => (window as any).__KAIA__?.state().together);
  await page.evaluate(() => {
    const world = (window as any).__KAIA__;
    world.setManual(true);
    world.setAuto(false);
    world.setFamilyAuto(false);
  });
}
async function state(page: Page) {
  return page.evaluate(() => (window as any).__KAIA__.state());
}
async function step(page: Page, seconds: number) {
  await page.evaluate((s) => (window as any).__KAIA__.step(s), seconds);
}
async function reach(page: Page, mode: string, phase: string) {
  const result = await page.evaluate(
    ({ mode, phase }) => {
      const world = (window as any).__KAIA__;
      for (let i = 0; i < 650; i++) {
        if (world.state().together.mode === mode && world.state().together.phase === phase) break;
        world.step(0.1);
      }
      return world.state();
    },
    { mode, phase },
  );
  expect(result.together.mode).toBe(mode);
  expect(result.together.phase).toBe(phase);
  return result;
}
async function start(page: Page, mode: string) {
  await page.locator('#open-together').click();
  await page.locator(`[data-together="${mode}"]`).click();
  return reach(page, mode, mode === 'hide' ? 'choosing' : 'ready');
}
async function reachCastle(page: Page) {
  await page.evaluate(() => {
    const world = (window as any).__KAIA__;
    world.request('castle');
    for (let i = 0; i < 250 && world.state().state !== 'playing'; i++) world.step(0.1);
    world.step(4);
  });
  expect((await state(page)).position[1]).toBeGreaterThan(0.6);
}

test('the ocean book waits for a safe castle exit, replaces the room with a ship, and restores it', async ({
  page,
}) => {
  await prepare(page);
  await reachCastle(page);
  await page.locator('#open-imagination').click();
  await page.locator('#enter-story').click();
  const waiting = await state(page);
  expect(waiting.toy).toBe('castle');
  expect(waiting.queued).toBe('books');
  expect(waiting.imagination.state).toBe('opening');
  await page.evaluate(() => {
    const world = (window as any).__KAIA__;
    for (let i = 0; i < 600 && world.state().imagination.state !== 'ocean'; i++) world.step(0.1);
    world.step(2);
  });
  expect((await state(page)).imagination.amount).toBeGreaterThan(0.99);
  const transformed = await page.evaluate(() => {
    const { imagination, toys, room, roomGround } = (window as any).__KAIA__.objects;
    return {
      sea: imagination.ocean.visible,
      ship: imagination.ship.visible,
      room: room.visible,
      roomGround: roomGround.visible,
      boat: imagination.boat.visible,
      lanterns: imagination.lighthouse.visible,
      roof: toys.castle.getObjectByName('castle-roof').visible,
      horse: toys.horse.children[0].visible,
    };
  });
  expect(transformed).toEqual({
    sea: true,
    ship: true,
    room: false,
    roomGround: false,
    boat: true,
    lanterns: true,
    roof: false,
    horse: false,
  });
  await expect(page.locator('#world-name')).toHaveText('Kaia 的海上小船');
  await page.locator('#open-imagination').click();
  await page.locator('#leave-story').click();
  await step(page, 3);
  expect((await state(page)).imagination.state).toBe('room');
  expect(
    await page.evaluate(() => {
      const { room, roomGround } = (window as any).__KAIA__.objects;
      return room.visible && roomGround.visible;
    }),
  ).toBe(true);
  expect(
    await page.evaluate(() => (window as any).__KAIA__.objects.imagination.ocean.visible),
  ).toBe(false);
  expect(
    await page.evaluate(
      () => (window as any).__KAIA__.objects.toys.castle.getObjectByName('castle-roof').visible,
    ),
  ).toBe(true);
  await page.locator('#open-imagination').click();
  await page.locator('#enter-story').click();
  await step(page, 3);
  await page.locator('#pause').click();
  await page.locator('#open-imagination').click();
  await page.locator('#leave-story').click();
  expect((await state(page)).paused).toBe(true);
  expect(await page.evaluate(() => (window as any).__KAIA__.objects.room.visible)).toBe(true);
  expect(
    await page.evaluate(() => (window as any).__KAIA__.objects.imagination.ocean.visible),
  ).toBe(false);
});

test('a different invitation cancels an unopened ocean story', async ({ page }) => {
  await prepare(page);
  await page.locator('#open-imagination').click();
  await page.locator('#enter-story').click();
  await page.locator('[data-toy="blocks"]').click();
  expect((await state(page)).imagination.state).toBe('room');
  await step(page, 25);
  expect((await state(page)).imagination.amount).toBe(0);
});

test('a drawing becomes a textured 3D plush, is hugged safely, and survives a reload', async ({
  page,
}) => {
  await prepare(page);
  await page.locator('#open-drawing').click();
  await expect(page.locator('#create-plush')).toBeDisabled();
  await page.locator('[data-drawing-starter="bunny"]').click();
  const bounds = (await page.locator('#drawing-canvas').boundingBox())!;
  await page.locator('[data-crayon="#88aaa9"]').click();
  await page.mouse.move(bounds.x + bounds.width * 0.35, bounds.y + bounds.height * 0.73);
  await page.mouse.down();
  await page.mouse.move(bounds.x + bounds.width * 0.65, bounds.y + bounds.height * 0.73, {
    steps: 10,
  });
  await page.mouse.up();
  await page.locator('#plush-name').fill('团团');
  await page.locator('#create-plush').click();
  await reach(page, 'plush', 'hugging');
  await step(page, 2);
  const hugging = await state(page);
  expect(hugging.plush.held).toBe(true);
  expect(hugging.plush.name).toBe('团团');
  expect(hugging.floorIsFree).toBe(true);
  const artwork = await page.evaluate(() => {
    const plush = (window as any).__KAIA__.objects.plush;
    const body = plush.getObjectByName('drawing-cushion');
    body.geometry.computeBoundingBox();
    const b = body.geometry.boundingBox;
    return {
      depth: b.max.z - b.min.z,
      vertices: body.geometry.attributes.position.count,
      texture: body.material[0].map.image.width,
      strokes: JSON.parse(localStorage.getItem('kaia-drawing-v1')!).strokes.length,
    };
  });
  expect(artwork.depth).toBeGreaterThan(0.3);
  expect(artwork.vertices).toBeGreaterThan(100);
  expect(artwork.texture).toBe(512);
  expect(artwork.strokes).toBeGreaterThan(7);
  await reach(page, 'plush', 'ready');
  expect((await state(page)).plush.held).toBe(false);
  await page.locator('#end-together').click();
  await prepare(page);
  expect((await state(page)).plush).toMatchObject({ name: '团团', visible: true, held: false });
  await page.locator('#open-drawing').click();
  await expect(page.locator('#plush-name')).toHaveValue('团团');
  await page.locator('#clear-drawing').click();
  await expect(page.locator('#create-plush')).toBeDisabled();
  await page.locator('#undo-drawing').click();
  await expect(page.locator('#create-plush')).toBeEnabled();
  await page.locator('#play-with-plush').click();
  await reach(page, 'plush', 'hugging');
});

test('shared ball play waits for the slide and completes repeatable round trips', async ({
  page,
}) => {
  await prepare(page);
  await reachCastle(page);
  await page.locator('#open-together').click();
  await page.locator('[data-together="roll"]').click();
  expect((await state(page)).together.pending).toBe('roll');
  expect((await state(page)).toy).toBe('castle');
  await reach(page, 'roll', 'ready');
  expect((await state(page)).visited).toContain('castle');
  for (let i = 1; i <= 2; i++) {
    await page.locator('#roll-ball').click();
    await expect(page.locator('#roll-ball')).toBeDisabled();
    await step(page, 1.75);
    expect((await state(page)).together.phase).toBe('catching');
    await reach(page, 'roll', 'ready');
    expect((await state(page)).together.rounds).toBe(i);
    expect((await state(page)).floorIsFree).toBe(true);
  }
  await page.locator('#end-together').click();
  await expect(page.locator('#together-card')).toBeHidden();
  const ball = await page.evaluate(() =>
    (window as any).__KAIA__.objects.toys.ball.children[0].position.toArray(),
  );
  expect(ball).toEqual([0, 0.34, 0]);
  expect((await state(page)).auto).toBe(false);
});

test('Kaia searches every hiding place using clear paths and returns the teddy afterward', async ({
  page,
}) => {
  await prepare(page);
  const before = await page.evaluate(() => {
    const tea = (window as any).__KAIA__.objects.toys.tea;
    return tea.children.map((o: any) => o.uuid);
  });
  const ready = await start(page, 'hide');
  expect(ready.together.destinations.every((p: any) => p.free)).toBe(true);
  for (let choice = 0; choice < 3; choice++) {
    await page.locator(`[data-hide="${choice}"]`).click();
    const route = await page.evaluate(() => {
      const world = (window as any).__KAIA__;
      let free = true;
      for (let i = 0; i < 650 && world.state().together.phase !== 'found'; i++) {
        world.step(0.1);
        free &&= world.state().floorIsFree;
      }
      return { state: world.state(), free };
    });
    expect(route.state.together.phase).toBe('found');
    expect(route.state.together.hiddenAt).toBe(choice);
    expect(route.free).toBe(true);
    if (choice < 2) await page.locator('#hide-again').click();
  }
  await page.locator('[data-toy="tea"]').click();
  const restored = await page.evaluate(() => {
    const objects = (window as any).__KAIA__.objects;
    return {
      children: objects.toys.tea.children.map((o: any) => o.uuid),
      covers: objects.covers.visible,
    };
  });
  expect(restored.children.sort()).toEqual(before.sort());
  expect(restored.covers).toBe(false);
  await step(page, 25);
  expect((await state(page)).visited).toContain('tea');
});

test('bubbles respond to clicks, can be popped in the scene, and remain bounded', async ({
  page,
}) => {
  await prepare(page);
  await start(page, 'bubbles');
  await page.locator('#blow-bubbles').click();
  expect((await state(page)).together.bubbles).toBe(8);
  await step(page, 4);
  await page.waitForTimeout(700);
  const bubbles = await page.evaluate(() => {
    const { objects } = (window as any).__KAIA__;
    const rect = document.querySelector('#world canvas')!.getBoundingClientRect();
    return objects.bubbles.children
      .filter((b: any) => b.visible)
      .map((b: any) => {
        const p = b.getWorldPosition(b.position.clone()).project(objects.camera);
        return {
          x: rect.left + (p.x * 0.5 + 0.5) * rect.width,
          y: rect.top + (-p.y * 0.5 + 0.5) * rect.height,
        };
      });
  });
  for (const p of bubbles) {
    await page.mouse.click(p.x, p.y);
    if ((await state(page)).together.popped > 0) break;
  }
  expect((await state(page)).together.popped).toBeGreaterThan(0);
  for (let i = 0; i < 9; i++) await page.locator('#blow-bubbles').click();
  expect((await state(page)).together.bubbles).toBeLessThanOrEqual(48);
  await step(page, 12);
  expect((await state(page)).together.bubbles).toBe(0);
  await page.locator('#end-together').click();
  expect(await page.evaluate(() => (window as any).__KAIA__.objects.bubbles.visible)).toBe(false);
});

test('microphone denial leaves click play available without requesting access on entry', async ({
  page,
}) => {
  await page.addInitScript(() => {
    (window as any).__micRequests = 0;
    navigator.mediaDevices.getUserMedia = async () => {
      (window as any).__micRequests++;
      throw new DOMException('Denied', 'NotAllowedError');
    };
  });
  await prepare(page);
  await start(page, 'bubbles');
  expect(await page.evaluate(() => (window as any).__micRequests)).toBe(0);
  await page.locator('#bubble-mic').click();
  await expect(page.locator('#mic-status')).toContainText('没能打开麦克风');
  expect(await page.evaluate(() => (window as any).__micRequests)).toBe(1);
  expect((await state(page)).microphone.state).toBe('off');
  await page.locator('#blow-bubbles').click();
  expect((await state(page)).together.bubbles).toBe(8);
});

test('microphone handles late permission and stops live audio on pause and exit', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const pending: ((stream: MediaStream) => void)[] = [];
    (window as any).__testAudio = { pending, streams: [], contexts: [] };
    navigator.mediaDevices.getUserMedia = () => new Promise((resolve) => pending.push(resolve));
    (window as any).__grantAudio = async () => {
      const ctx = new AudioContext();
      const destination = ctx.createMediaStreamDestination(),
        oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      gain.gain.value = 0.18;
      oscillator.connect(gain).connect(destination);
      oscillator.start();
      await ctx.resume();
      (window as any).__testAudio.streams.push(destination.stream);
      (window as any).__testAudio.contexts.push(ctx);
      pending.shift()!(destination.stream);
    };
  });
  await prepare(page);
  await start(page, 'bubbles');
  await page.locator('#bubble-mic').click();
  expect((await state(page)).microphone.state).toBe('requesting');
  await page.locator('#end-together').click();
  await page.evaluate(() => (window as any).__grantAudio());
  await expect
    .poll(() =>
      page.evaluate(() => (window as any).__testAudio.streams[0].getTracks()[0].readyState),
    )
    .toBe('ended');
  expect((await state(page)).microphone.state).toBe('off');
  await start(page, 'bubbles');
  await page.locator('#bubble-mic').click();
  await page.evaluate(() => (window as any).__grantAudio());
  await expect.poll(async () => (await state(page)).microphone.state).toBe('on');
  // AudioContext startup runs on the browser's clock, independently of manual simulation time.
  await expect
    .poll(async () => {
      await step(page, 0.1);
      return (await state(page)).together.bubbles;
    })
    .toBeGreaterThan(0);
  await page.locator('#pause').click();
  expect((await state(page)).microphone.state).toBe('off');
  expect(
    await page.evaluate(() => (window as any).__testAudio.streams[1].getTracks()[0].readyState),
  ).toBe('ended');
  await page.locator('#pause').click();
  await page.locator('#bubble-mic').click();
  await page.evaluate(() => (window as any).__grantAudio());
  await expect.poll(async () => (await state(page)).microphone.state).toBe('on');
  await page.locator('#open-drawing').click();
  expect((await state(page)).microphone.state).toBe('off');
  expect(
    await page.evaluate(() => (window as any).__testAudio.streams[2].getTracks()[0].readyState),
  ).toBe('ended');
  await page.evaluate(() =>
    Promise.all((window as any).__testAudio.contexts.map((c: AudioContext) => c.close())),
  );
});

test('phone controls, drawing, and keyboard focus fit without horizontal overflow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await prepare(page);
  await expect(page.locator('.wonder-bar')).toBeVisible();
  const headline = (await page.locator('.english-line').boundingBox())!;
  const launcher = (await page.locator('.wonder-bar').boundingBox())!;
  expect(launcher.y).toBeGreaterThan(headline.y + headline.height);
  await page.locator('#open-drawing').click();
  await expect(page.locator('#drawing-panel .close-panel')).toBeFocused();
  await page.locator('[data-drawing-starter="star"]').click();
  await page.locator('#plush-name').fill('星星');
  await page.locator('#create-plush').scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.locator('#open-drawing')).toBeFocused();
  await start(page, 'bubbles');
  await page.locator('#blow-bubbles').click();
  await step(page, 3);
  await page.screenshot({ path: 'artifacts/wonders-mobile.jpg', type: 'jpeg', quality: 65 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.setViewportSize({ width: 844, height: 390 });
  const card = (await page.locator('#together-card').boundingBox())!;
  expect(card.y).toBeGreaterThan(40);
  expect(card.y + card.height).toBeLessThan(302);
  await page.locator('#end-together').click();
});
