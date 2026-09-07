import { expect, test, type Page } from '@playwright/test';

// The development-only inspector advances the same simulation used by requestAnimationFrame.
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
async function state(page: Page) {
  return page.evaluate(() => (window as any).__KAIA__.state());
}
async function advance(page: Page, seconds: number) {
  await page.evaluate((t) => (window as any).__KAIA__.step(t), seconds);
}
async function reachToy(page: Page, id: string) {
  await page.evaluate((id) => {
    const world = (window as any).__KAIA__;
    world.request(id);
    for (let i = 0; i < 250 && world.state().state !== 'playing'; i++) world.step(0.15);
  }, id);
  expect((await state(page)).state).toBe('playing');
  expect((await state(page)).toy).toBe(id);
}

test('all eight toys can be reached, perform distinct actions, and return to walkable ground', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await prepare(page);
  expect((await state(page)).destinations.every((d: any) => d.free && d.reachable)).toBe(true);
  const poses: any[] = [];
  for (const id of ['books', 'blocks', 'horse', 'music', 'tea', 'castle', 'rainbow', 'ball']) {
    await reachToy(page, id);
    await advance(page, id === 'castle' ? 4 : 3);
    const sample = await state(page);
    expect(sample.position.every(Number.isFinite)).toBe(true);
    expect(Object.values(sample.pose).every((value) => Number.isFinite(value))).toBe(true);
    if (id === 'castle') expect(sample.position[1]).toBeGreaterThan(0.6);
    if (id === 'horse') expect(sample.position[1]).toBeGreaterThan(0.6);
    if (id === 'rainbow') expect(sample.pose.lean).toBeGreaterThan(0.7);
    if (id === 'books') expect(sample.pose.legL).toBeLessThan(-1);
    poses.push([sample.pose.armL, sample.pose.lean, sample.pose.bounce]);
    await page.evaluate(() => {
      const world = (window as any).__KAIA__;
      for (let i = 0; i < 150 && world.state().state === 'playing'; i++) world.step(0.2);
    });
    const end = await state(page);
    expect(end.state).toBe('idle');
    expect(end.position[1]).toBeCloseTo(0.12);
    expect(end.floorIsFree).toBe(true);
    expect(end.visited).toContain(id);
  }
  expect(new Set(poses.map((p) => JSON.stringify(p))).size).toBe(8);
  await expect(page.locator('#visited-count')).toHaveText('8');
  expect(errors).toEqual([]);
});

test('a new invitation waits for a safe exit from the castle', async ({ page }) => {
  await prepare(page);
  await reachToy(page, 'castle');
  await advance(page, 4);
  await page.locator('[data-toy="books"]').click();
  const pending = await state(page);
  expect(pending.toy).toBe('castle');
  expect(pending.queued).toBe('books');
  expect(pending.position[1]).toBeGreaterThan(0.6);
  await page.evaluate(() => {
    const world = (window as any).__KAIA__;
    for (let i = 0; i < 230 && world.state().toy !== 'books'; i++) world.step(0.15);
  });
  const next = await state(page);
  expect(next.toy).toBe('books');
  expect(next.visited).toContain('castle');
  expect(next.position[1]).toBeCloseTo(0.12);
});

test('autonomous play changes toys and parents arrive and leave on their own', async ({ page }) => {
  await prepare(page);
  await page.evaluate(() => {
    const w = (window as any).__KAIA__;
    w.setAuto(true);
    w.setFamilyAuto(true);
  });
  await advance(page, 3);
  expect((await state(page)).state).toBe('walking');
  await advance(page, 30);
  const parentStates = Object.values((await state(page)).family).map((v: any) => v.state);
  expect(parentStates.some((s) => s !== 'away')).toBe(true);
  await page.evaluate(() => (window as any).__KAIA__.setFamilyAuto(false));
  await advance(page, 65);
  expect((await state(page)).visited.length).toBeGreaterThanOrEqual(3);
  expect(
    Object.values((await state(page)).family).every((v: any) => v.state === 'away' && !v.visible),
  ).toBe(true);
});

test('mom and dad reserve separate places when invited together', async ({ page }) => {
  await prepare(page);
  await reachToy(page, 'ball');
  await advance(page, 13);
  await page.locator('#invite-mom').click();
  await page.locator('#invite-dad').click();
  await advance(page, 12);
  const { mom, dad } = (await state(page)).family;
  expect(mom.visible).toBe(true);
  expect(dad.visible).toBe(true);
  expect(mom.state).toBe('visiting');
  expect(dad.state).toBe('visiting');
  expect(
    Math.hypot(mom.position[0] - dad.position[0], mom.position[2] - dad.position[2]),
  ).toBeGreaterThan(1);
  await advance(page, 35);
  expect((await state(page)).family.mom.state).toBe('away');
  expect((await state(page)).family.dad.state).toBe('away');
});

test('camera buttons, drag, wheel, pause, lighting, audio, and photo download work', async ({
  page,
}) => {
  await prepare(page);
  await page.locator('#zoom-in').click();
  await page.waitForTimeout(800);
  expect((await state(page)).camera.zoom).toBeGreaterThan(1);
  const before = (await state(page)).camera.position;
  await page.locator('#rotate').click();
  await page.waitForTimeout(800);
  expect((await state(page)).camera.position).not.toEqual(before);
  await page.locator('#reset-camera').click();
  await page.waitForTimeout(800);
  expect((await state(page)).camera.zoom).toBeCloseTo(1);
  const dragBefore = (await state(page)).camera.position;
  await page.mouse.move(960, 660);
  await page.mouse.down();
  await page.mouse.move(1080, 600, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(350);
  expect((await state(page)).camera.position).not.toEqual(dragBefore);
  await page.mouse.wheel(0, -300);
  await page.waitForTimeout(250);
  expect((await state(page)).camera.zoom).toBeGreaterThan(1);
  await page.locator('#weather').click();
  await expect(page.locator('body')).toHaveClass('night');
  await page.locator('#sound').click();
  await expect(page.locator('#sound')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#sound').click();
  await expect(page.locator('#sound')).toHaveAttribute('aria-pressed', 'false');
  await page.evaluate(() => (window as any).__KAIA__.setManual(false));
  await page.locator('#pause').click();
  const stopped = (await state(page)).time;
  await page.waitForTimeout(350);
  expect((await state(page)).time).toBe(stopped);
  await expect(page.locator('#pause-indicator')).toBeVisible();
  await page.locator('#pause').click();
  await page.waitForTimeout(200);
  expect((await state(page)).time).toBeGreaterThan(stopped);
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#snapshot').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^kaia-little-moment-.*\.png$/);
  expect(await download.failure()).toBeNull();
});

test('the scene is selectable and the toy cabinet is keyboard accessible', async ({ page }) => {
  await prepare(page);
  const p = await page.evaluate(() => (window as any).__KAIA__.screenPoint('horse'));
  await page.mouse.click(p.x, p.y);
  expect((await state(page)).toy).toBe('horse');
  await page.locator('#open-cabinet').click();
  await expect(page.locator('#cabinet')).toBeVisible();
  await expect(page.locator('#cabinet .close-panel')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('[data-invite="rainbow"]')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#cabinet')).toBeHidden();
  await expect(page.locator('#open-cabinet')).toBeFocused();
  await page.locator('#about').click();
  await expect(page.locator('#about-panel')).toBeVisible();
  await page.keyboard.press('Escape');
});

test('phone layout stays usable and the whole toy list can be scrolled', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await prepare(page);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  expect(overflow).toBe(false);
  await expect(page.locator('#world canvas')).toBeVisible();
  await page.locator('[data-toy="rainbow"]').scrollIntoViewIfNeeded();
  await page.locator('[data-toy="rainbow"]').click();
  expect((await state(page)).toy).toBe('rainbow');
  await page.locator('#collection-count').click();
  await expect(page.locator('#cabinet')).toBeVisible();
  await page.locator('[data-invite="books"]').click();
  await expect(page.locator('#cabinet')).toBeHidden();
  expect((await state(page)).toy).toBe('books');
  await page.screenshot({ path: 'artifacts/mobile-verified.png' });
});

test('touch gestures pinch to zoom and drag to rotate without selecting a toy', async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  await prepare(page);
  const cdp = await context.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [
      { x: 145, y: 390, id: 1 },
      { x: 245, y: 390, id: 2 },
    ],
  });
  for (let step = 1; step <= 6; step++) {
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [
        { x: 145 - step * 6, y: 390, id: 1 },
        { x: 245 + step * 6, y: 390, id: 2 },
      ],
    });
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(250);
  const zoomed = await state(page);
  expect(zoomed.camera.zoom).toBeGreaterThan(1.2);
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: 160, y: 420, id: 1 }],
  });
  for (let step = 1; step <= 8; step++) {
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: 160 + step * 10, y: 420 - step * 3, id: 1 }],
    });
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(300);
  const rotated = await state(page);
  expect(rotated.camera.position).not.toEqual(zoomed.camera.position);
  expect(rotated.toy).toBeUndefined();
  await context.close();
});

test('landscape phone layout leaves space to see and control the room', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await prepare(page);
  const bounds = await page.locator('#world canvas').boundingBox();
  expect(bounds!.height).toBeGreaterThan(230);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  await expect(page.locator('.toy-dock')).toBeVisible();
  await page.screenshot({ path: 'artifacts/landscape-verified.png' });
});
