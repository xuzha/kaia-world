import * as THREE from 'three';
import './style.css';
import './ui/wonders.css';
import { renderShell } from './ui/shell';
import { icon } from './ui/icons';
import { createStage } from './world/stage';
import { createRoom } from './world/room';
import { Navigation } from './world/navigation';
import { createToys } from './toys/registry';
import type { Toy, ToyId } from './toys/types';
import { Character } from './characters/rig';
import { PlayDirector, type PlayEvent } from './characters/director';
import { Family } from './characters/family';
import { Atmosphere } from './world/atmosphere';
import { Soundscape } from './world/audio';
import { Imagination } from './play/imagination';
import { stories, storyIds, type StoryId } from './play/stories';
import { DrawnPlush } from './play/plush';
import { Together, type TogetherMode } from './play/together';
import { MicrophoneBlower } from './play/microphone';
import { drawingStorageKey, validDrawing } from './play/drawing-data';
import { DrawingPad } from './ui/drawing-pad';

renderShell();
const el = (id: string) => document.getElementById(id)!;
const container = el('world');
let stage: ReturnType<typeof createStage>;
try {
  stage = createStage(container);
} catch (error) {
  el('loading').innerHTML =
    '<p>This little world needs a browser with WebGL 2 support.</p><p>Try updating Chrome, Edge, or Safari, then come back to play with Kaia.</p><button onclick="location.reload()">Try again</button>';
  throw error;
}
const { scene, camera, renderer, controls } = stage;
const room = createRoom(scene),
  toys = createToys(scene);
const navigation = new Navigation([...room.obstacles, ...toys.flatMap((toy) => toy.obstacles)]);
const kaia = new Character();
scene.add(kaia.root);
const atmosphere = new Atmosphere(scene),
  sound = new Soundscape();
let time = 0,
  paused = matchMedia('(prefers-reduced-motion: reduce)').matches,
  manual = false,
  speechUntil = 7;
let toastTimer: ReturnType<typeof setTimeout>;

function toast(text: string) {
  clearTimeout(toastTimer);
  el('toast').textContent = text;
  el('toast').classList.add('visible');
  toastTimer = setTimeout(() => el('toast').classList.remove('visible'), 4600);
}
function say(text: string, duration = 6) {
  const star = document.createElement('span');
  star.textContent = '✦';
  el('speech').replaceChildren(document.createTextNode(text), star);
  speechUntil = time + duration;
}
function activity(text: string) {
  el('activity').textContent = text;
}
function selectToy(toy?: Toy) {
  document.querySelectorAll<HTMLButtonElement>('[data-toy]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.toy === toy?.id));
  });
}
function playEvent(event: PlayEvent) {
  const toy = event.toy;
  if (!toy) return;
  if (event.type === 'walk') {
    selectToy(toy);
    activity(`Heading to ${toy.name}`);
    say(`Time for ${toy.name}!`, 4);
  }
  if (event.type === 'pace') {
    activity(`${event.running ? 'Running to' : 'Heading to'} ${toy.name}`);
    if (event.running) say('Let’s run over and play!', 2.5);
  }
  if (event.type === 'play') {
    if (imagination.state === 'ocean' && toy.id === 'horse') {
      activity('Sailing out to sea');
      say('Sails up! Let’s find a starfish!');
    } else if (imagination.state === 'ocean' && toy.id === 'castle') {
      activity('Climbing the lighthouse');
      say('The lighthouse is on! This way, little boats!');
    } else {
      activity(toy.activity);
      say(toy.thought);
    }
  }
  if (event.type === 'queue') {
    toast(`Yes! ${toy.name} is next, once Kaia finishes playing here.`);
  }
  if (event.type === 'finish') {
    activity('Found another little joy');
    say('What shall we play next?', 3.5);
    document.querySelector(`[data-toy="${toy.id}"]`)?.classList.add('visited');
    el('visited-count').textContent = String(director.visited.size);
    atmosphere.hearts(kaia.root.position, 3);
  }
}
const director = new PlayDirector(kaia, toys, navigation, playEvent);
const family = new Family(scene, navigation, kaia, (_kind, message) => {
  toast(message);
  atmosphere.hearts(kaia.root.position, 2);
});
const drawingPad = new DrawingPad();
const plush = new DrawnPlush(scene);
const together = new Together(scene, director, plush, refreshTogether, (message, hearts) => {
  say(message);
  if (hearts) atmosphere.hearts(kaia.root.position, 3);
});
const microphone = new MicrophoneBlower(refreshMicrophone, (strength) =>
  together.blow(1 + Math.ceil(strength * 4)),
);
let selectedStory: StoryId = 'ocean';
const imagination = new Imagination(scene, room.root, toys, kaia.book, refreshImagination);

function refreshMicrophone() {
  const button = el('bubble-mic');
  button.setAttribute('aria-pressed', String(microphone.state !== 'off'));
  button.innerHTML = `${icon('mic', 16)} ${microphone.state === 'off' ? 'Use microphone' : 'Turn off mic'}`;
  el('mic-status').textContent = microphone.message;
  el('mic-level').hidden = microphone.state !== 'on';
  (el('mic-level') as HTMLMeterElement).value = microphone.level;
}
function refreshTogether() {
  const mode = together.mode ?? together.pending;
  el('together-card').hidden = !mode;
  document.body.classList.toggle('together-active', !!mode);
  refreshModeLabel();
  if (!mode) return;
  const titles = {
    roll: 'Roll the ball',
    hide: 'Find Teddy',
    bubbles: 'Bubble time',
    plush: `Hello, ${plush.name}`,
  };
  el('together-title').textContent = titles[mode];
  el('together-status').textContent = together.status;
  activity(titles[mode]);
  for (const name of ['roll', 'hide', 'bubble', 'plush'])
    el(`${name}-controls`).hidden = (name === 'bubble' ? 'bubbles' : name) !== mode;
  (el('roll-ball') as HTMLButtonElement).disabled =
    together.mode !== 'roll' || together.phase !== 'ready';
  el('roll-count').textContent = together.rounds ? `Passes: ${together.rounds}` : '';
  document.querySelectorAll<HTMLButtonElement>('[data-hide]').forEach((button) => {
    button.disabled = together.mode !== 'hide' || together.phase !== 'choosing';
    button.setAttribute('aria-pressed', String(Number(button.dataset.hide) === together.hiddenAt));
  });
  el('hide-again').hidden = together.phase !== 'found';
  (el('blow-bubbles') as HTMLButtonElement).disabled = together.mode !== 'bubbles';
  (el('bubble-mic') as HTMLButtonElement).disabled = together.mode !== 'bubbles';
  (el('hug-again') as HTMLButtonElement).disabled =
    together.mode !== 'plush' || together.phase !== 'ready';
}
function refreshModeLabel() {
  let label = director.auto ? 'Exploring freely' : 'Waiting for you';
  if (together.busy) label = 'Playing together';
  el('mode-label').textContent = label;
}
function refreshStoryChoice() {
  document.querySelectorAll<HTMLButtonElement>('[data-story]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.story === selectedStory));
  });
  el('story-description').textContent = stories[selectedStory].description;
  const waiting = imagination.state === 'opening' && imagination.story === selectedStory;
  (el('enter-story') as HTMLButtonElement).disabled = waiting;
  const label = waiting
    ? 'Kaia is opening the book…'
    : imagination.activeStory === selectedStory
      ? `Continue the ${stories[selectedStory].name} adventure`
      : `Open the ${stories[selectedStory].name} story`;
  el('enter-story').innerHTML = `${label} ${icon('arrow', 17)}`;
}
function refreshImagination() {
  const story = imagination.activeStory;
  for (const id of storyIds) document.body.classList.toggle(id, story === id);
  document.body.classList.toggle('imagining', !!story);
  stage.setStory(story);
  el('open-imagination').setAttribute('aria-pressed', String(imagination.state !== 'room'));
  el('world-name').textContent = story ? stories[story].worldName : 'Kaia’s playroom';
  el('leave-story').hidden = imagination.state === 'room';
  refreshStoryChoice();
  refreshWeather();
  if (story && imagination.state === story) {
    say(stories[story].thought, 8);
    toast(stories[story].arrival);
  }
}

function stopTogether() {
  if (microphone.state !== 'off') microphone.stop();
  together.stop();
}
function startTogether(mode: TogetherMode) {
  if (paused) setPaused(false);
  if (imagination.state === 'opening') imagination.cancelOpening();
  if (mode !== 'bubbles' && microphone.state !== 'off') microphone.stop();
  together.request(mode);
  selectToy();
  stage.focus(
    mode === 'plush' ? plush.home.clone().setY(0.85) : new THREE.Vector3(0.5, 1.1, 1.6),
    mode === 'hide' ? 1.25 : 1.65,
  );
}
try {
  const saved = localStorage.getItem(drawingStorageKey);
  const drawing: unknown = saved && saved.length < 1_000_000 ? JSON.parse(saved) : undefined;
  if (validDrawing(drawing)) {
    drawingPad.load(drawing);
    if (plush.create(drawingPad.canvas, drawing.name)) el('play-with-plush').hidden = false;
  }
} catch {
  el('drawing-message').textContent =
    'You can still draw, but your work may not be saved on this device.';
}
let lastTime = performance.now();
const speechPosition = new THREE.Vector3();

function updateSimulation(dt: number) {
  time += dt;
  if (!together.update(dt, time)) director.update(dt, time);
  family.update(dt, time);
  for (const toy of toys)
    toy.update?.(time, director.current?.id === toy.id && director.state === 'playing');
  imagination.update(
    dt,
    time,
    director.state === 'playing' && director.current?.id === 'books',
    director.elapsed,
  );
  microphone.update(dt);
  if (microphone.state === 'on') (el('mic-level') as HTMLMeterElement).value = microphone.level;
  atmosphere.update(dt, time);
  sound.update(dt, director.state === 'playing' && director.current?.id === 'music');
}
function updateSpeech() {
  kaia.head.getWorldPosition(speechPosition);
  speechPosition.y += 0.63;
  speechPosition.project(camera);
  const x = (speechPosition.x * 0.5 + 0.5) * container.clientWidth,
    y = (-speechPosition.y * 0.5 + 0.5) * container.clientHeight;
  const shown =
    time < speechUntil &&
    x > 0 &&
    x < container.clientWidth - 70 &&
    y > 0 &&
    y < container.clientHeight;
  el('speech').style.opacity = shown ? '1' : '0';
  const bubbleX = Math.max(
    8,
    Math.min(x + 13, container.clientWidth - el('speech').offsetWidth - 8),
  );
  el('speech').style.left = `${bubbleX}px`;
  el('speech').style.top = `${y - 21}px`;
}
renderer.setAnimationLoop(() => {
  const now = performance.now(),
    elapsed = (now - lastTime) / 1000,
    dt = Math.min(elapsed, 0.05);
  lastTime = now;
  if (!paused && !manual && !document.hidden) updateSimulation(dt);
  // Visual transitions follow wall time while simulation steps stay bounded.
  room.updateLighting(stage.update(elapsed));
  updateSpeech();
  renderer.render(scene, camera);
});
renderer.render(scene, camera);
requestAnimationFrame(() => {
  el('loading').classList.add('loaded');
  document.body.dataset.sceneReady = 'true';
  setTimeout(() => el('loading').remove(), 700);
});

function setPaused(value: boolean) {
  paused = value;
  if (paused && microphone.state !== 'off')
    microphone.stop('Play is paused and the microphone is off.');
  sound.setPaused(paused);
  el('pause').innerHTML = icon(paused ? 'play' : 'pause', 17);
  el('pause').setAttribute(
    'aria-label',
    paused ? 'Resume this little world' : 'Pause this little world',
  );
  el('pause').setAttribute('aria-pressed', String(paused));
  el('pause-indicator').hidden = !paused;
  el('pause').dataset.tip = paused ? 'Let’s keep playing' : 'Pause for a moment';
}
function invite(id: ToyId) {
  stopTogether();
  if (id !== 'books' && imagination.state === 'opening') imagination.cancelOpening();
  if (paused) setPaused(false);
  director.request(id);
}
setPaused(paused);
document
  .querySelectorAll<HTMLButtonElement>('[data-toy]')
  .forEach((button) => button.addEventListener('click', () => invite(button.dataset.toy as ToyId)));
document.querySelectorAll<HTMLButtonElement>('[data-invite]').forEach((button) =>
  button.addEventListener('click', () => {
    closePanel();
    invite(button.dataset.invite as ToyId);
  }),
);
el('pause').addEventListener('click', () => setPaused(!paused));
el('shuffle').addEventListener('click', () => {
  stopTogether();
  if (imagination.state === 'opening') imagination.cancelOpening();
  if (paused) setPaused(false);
  director.wander();
});
el('zoom-in').addEventListener('click', () => stage.zoom(1));
el('zoom-out').addEventListener('click', () => stage.zoom(-1));
el('rotate').addEventListener('click', () => stage.rotate());
el('reset-camera').addEventListener('click', () => stage.home());
el('invite-mom').addEventListener('click', () => {
  if (paused) setPaused(false);
  family.invite('mom');
});
el('invite-dad').addEventListener('click', () => {
  if (paused) setPaused(false);
  family.invite('dad');
});
el('autoplay').addEventListener('click', () => {
  director.auto = !director.auto;
  el('autoplay').setAttribute('aria-pressed', String(director.auto));
  el('autoplay').setAttribute(
    'aria-label',
    director.auto ? 'Turn off free exploration' : 'Turn on free exploration',
  );
  refreshModeLabel();
  toast(
    director.auto
      ? 'Let curiosity lead. Kaia will choose her own toys.'
      : 'Kaia will finish playing, then wait for your invitation.',
  );
});
el('sound').addEventListener('click', async () => {
  try {
    const enabled = await sound.toggle();
    el('sound').innerHTML = icon(enabled ? 'volume' : 'muted');
    el('sound').setAttribute('aria-pressed', String(enabled));
    el('sound').setAttribute(
      'aria-label',
      enabled ? 'Turn off gentle music' : 'Turn on gentle music',
    );
    toast(enabled ? 'A little music for a little world.' : 'Quiet playtime is lovely too.');
  } catch {
    toast('The music couldn’t start. Tap again to try.');
  }
});
let night = false;
function refreshWeather() {
  const story = imagination.activeStory;
  const moonlit = story === 'forest' || story === 'polar';
  const label =
    story === 'forest'
      ? night
        ? 'Deep night'
        : 'Moonlit forest'
      : story === 'polar'
        ? night
          ? 'Polar night'
          : 'Aurora glow'
        : night
          ? 'Goodnight'
          : 'Afternoon';
  el('weather').innerHTML =
    `${icon(moonlit || night ? 'moon' : 'sun', 18)}<span>${label}</span><i>${moonlit ? '✦' : `${night ? '22' : '24'}°`}</i>`;
  el('weather').setAttribute('aria-pressed', String(night));
  el('weather').setAttribute(
    'aria-label',
    moonlit
      ? night
        ? 'Brighten the night'
        : 'Dim the lights'
      : night
        ? 'Switch to afternoon light'
        : 'Switch to bedtime',
  );
}
el('weather').addEventListener('click', () => {
  night = !night;
  stage.setNight(night);
  document.body.classList.toggle('night', night);
  refreshWeather();
  say(
    imagination.activeStory === 'forest'
      ? 'Warm lights, a little treehouse, and fireflies!'
      : imagination.activeStory === 'polar'
        ? 'Look! The northern lights are dancing!'
        : night
          ? 'The stars are here. Just a little more playtime!'
          : 'The sunshine feels so warm.',
  );
});
el('snapshot').addEventListener('click', () => {
  renderer.render(scene, camera);
  const photo = document.createElement('canvas');
  photo.width = renderer.domElement.width;
  photo.height = renderer.domElement.height;
  const ctx = photo.getContext('2d')!;
  ctx.fillStyle = getComputedStyle(document.body).backgroundColor;
  ctx.fillRect(0, 0, photo.width, photo.height);
  ctx.drawImage(renderer.domElement, 0, 0);
  if (imagination.space.visible) {
    const fontSize = Math.max(12, Math.round(photo.width / 100));
    ctx.font = `${fontSize}px sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillStyle = '#bac5d4';
    ctx.shadowColor = '#020712';
    ctx.shadowBlur = 4;
    ctx.fillText(
      'Milky Way: ESO/S. Brunier · CC BY 4.0 (adapted)',
      photo.width - 16,
      photo.height - 16,
    );
  }
  const link = document.createElement('a');
  link.href = photo.toDataURL('image/png');
  link.download = `kaia-little-moment-${new Date().toISOString().slice(0, 10)}.png`;
  link.click();
  toast('A little moment of joy, saved as a photo.');
});

let openDialog: HTMLElement | undefined,
  previousFocus: HTMLElement | null = null;
function openPanel(id: string) {
  if (microphone.state !== 'off') microphone.stop();
  previousFocus = document.activeElement as HTMLElement;
  if (openDialog) openDialog.hidden = true;
  openDialog = el(id);
  openDialog.hidden = false;
  el('modal-backdrop').hidden = false;
  document.querySelector('main')!.inert = true;
  document.querySelector('header')!.inert = true;
  openDialog.querySelector<HTMLButtonElement>('.close-panel')!.focus();
}
function closePanel() {
  if (!openDialog) return;
  openDialog.hidden = true;
  openDialog = undefined;
  el('modal-backdrop').hidden = true;
  document.querySelector('main')!.inert = false;
  document.querySelector('header')!.inert = false;
  previousFocus?.focus();
}
el('open-cabinet').addEventListener('click', () => openPanel('cabinet'));
el('collection-count').addEventListener('click', () => openPanel('cabinet'));
el('about').addEventListener('click', () => openPanel('about-panel'));
el('open-imagination').addEventListener('click', () => {
  if (imagination.state !== 'room') selectedStory = imagination.story;
  refreshStoryChoice();
  openPanel('imagination-panel');
});
document.querySelectorAll<HTMLButtonElement>('[data-story]').forEach((button) => {
  button.addEventListener('click', () => {
    selectedStory = button.dataset.story as StoryId;
    refreshStoryChoice();
  });
});
el('open-drawing').addEventListener('click', () => openPanel('drawing-panel'));
el('open-together').addEventListener('click', () => openPanel('together-panel'));
el('enter-story').addEventListener('click', () => {
  closePanel();
  if (imagination.activeStory === selectedStory && imagination.state !== 'opening') return;
  imagination.open(selectedStory);
  if (imagination.state === 'opening') {
    invite('books');
    toast(`Our adventure begins when Kaia opens the ${stories[selectedStory].name} story.`);
  }
});
el('leave-story').addEventListener('click', () => {
  imagination.close(paused);
  closePanel();
  say('The book is closed. Our toys are still here!');
});
document.querySelectorAll<HTMLButtonElement>('[data-together]').forEach((button) => {
  button.addEventListener('click', () => {
    closePanel();
    startTogether(button.dataset.together as TogetherMode);
  });
});
el('end-together').addEventListener('click', () => {
  stopTogether();
  activity('Thanks for playing with me');
  say('Let’s play together again soon.');
  stage.home();
  el('open-together').focus();
});
el('roll-ball').addEventListener('click', () => {
  if (paused) setPaused(false);
  together.roll();
});
document.querySelectorAll<HTMLButtonElement>('[data-hide]').forEach((button) => {
  button.addEventListener('click', () => {
    if (paused) setPaused(false);
    together.hide(Number(button.dataset.hide));
  });
});
el('hide-again').addEventListener('click', () => {
  if (paused) setPaused(false);
  together.hideAgain();
});
el('blow-bubbles').addEventListener('click', () => {
  if (paused) setPaused(false);
  together.blow();
});
el('bubble-mic').addEventListener('click', () => {
  if (microphone.state !== 'off') microphone.stop();
  else {
    if (paused) setPaused(false);
    void microphone.start();
  }
});
el('hug-again').addEventListener('click', () => {
  if (paused) setPaused(false);
  together.hugAgain();
});
el('play-with-plush').addEventListener('click', () => {
  closePanel();
  startTogether('plush');
});
el('create-plush').addEventListener('click', () => {
  const drawing = drawingPad.drawing();
  if (!validDrawing(drawing)) return;
  stopTogether();
  if (!plush.create(drawingPad.canvas, drawing.name)) {
    el('drawing-message').textContent = 'Add a few more lines to give your friend an outline.';
    return;
  }
  let saved = true;
  try {
    localStorage.setItem(drawingStorageKey, JSON.stringify(drawing));
  } catch {
    saved = false;
  }
  el('play-with-plush').hidden = false;
  el('drawing-message').textContent = saved
    ? 'Your friend is saved on this device and will be here next time.'
    : 'Your plush is ready, but couldn’t be saved. You’ll need to draw it again after reloading.';
  closePanel();
  startTogether('plush');
  toast(
    saved
      ? `Welcome, ${drawing.name}! Kaia is coming over for a hug.`
      : 'Your plush is ready, but couldn’t be saved. You’ll need to draw it again after reloading.',
  );
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden && microphone.state !== 'off')
    microphone.stop('The microphone turned off when you left the page.');
});
window.addEventListener('pagehide', () => {
  if (microphone.state !== 'off') microphone.stop();
});
el('modal-backdrop').addEventListener('click', closePanel);
document
  .querySelectorAll('.close-panel')
  .forEach((button) => button.addEventListener('click', closePanel));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closePanel();
  if (event.key === 'Tab' && openDialog) {
    const focusable = [
      ...openDialog.querySelectorAll<HTMLElement>(
        'button:not(:disabled), a, input, [tabindex="0"]',
      ),
    ].filter((element) => element.getClientRects().length > 0);
    const first = focusable[0],
      last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
});
container.addEventListener('keydown', (event) => {
  if (event.code === 'Space') {
    event.preventDefault();
    setPaused(!paused);
  }
  if (event.key === '+' || event.key === '=') stage.zoom(1);
  if (event.key === '-') stage.zoom(-1);
  if (event.key === 'Home') stage.home();
  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
    event.preventDefault();
    stage.rotate(event.key === 'ArrowLeft' ? -1 : 1);
  }
  if (/^[1-8]$/.test(event.key)) invite(toys[Number(event.key) - 1].id);
});

const raycaster = new THREE.Raycaster(),
  pointer = new THREE.Vector2();
type ScenePick =
  | { kind: 'toy'; toy: Toy }
  | { kind: 'plush' }
  | { kind: 'hide'; index: number }
  | { kind: 'bubble'; index: number };
function pickScene(event: PointerEvent | MouseEvent): ScenePick | undefined {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.set(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    (-(event.clientY - rect.top) / rect.height) * 2 + 1,
  );
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(
    [...toys.map((t) => t.root), plush.root, together.covers, together.bubbles],
    true,
  );
  for (const hit of hits) {
    let object: THREE.Object3D | null = hit.object,
      id: ToyId | undefined,
      special: ScenePick | undefined,
      visible = true;
    while (object) {
      if (!object.visible) visible = false;
      if (object.userData.toyId) id = object.userData.toyId;
      if (object.userData.drawnPlush) special = { kind: 'plush' };
      if (object.userData.hidingSpot !== undefined)
        special = { kind: 'hide', index: object.userData.hidingSpot };
      if (object.userData.bubble !== undefined)
        special = { kind: 'bubble', index: object.userData.bubble };
      object = object.parent;
    }
    if (!visible) continue;
    if (special) return special;
    if (id) return { kind: 'toy', toy: toys.find((t) => t.id === id)! };
  }
}
let pointerDown: { x: number; y: number } | undefined,
  dragging = false;
renderer.domElement.addEventListener('pointerdown', (e) => {
  pointerDown = { x: e.clientX, y: e.clientY };
  dragging = false;
  el('toy-tooltip').hidden = true;
});
renderer.domElement.addEventListener('pointermove', (e) => {
  if (pointerDown && Math.hypot(e.clientX - pointerDown.x, e.clientY - pointerDown.y) > 5)
    dragging = true;
  if (dragging || e.pointerType !== 'mouse') {
    el('toy-tooltip').hidden = true;
    return;
  }
  const pick = pickScene(e);
  renderer.domElement.style.cursor = pick ? 'pointer' : 'grab';
  el('toy-tooltip').hidden = !pick;
  if (pick) {
    const labels = {
      plush: `${plush.name} · Give a hug`,
      hide: 'Hide Teddy here',
      bubble: 'Pop this bubble!',
    };
    el('toy-tooltip').textContent =
      pick.kind === 'toy' ? pick.toy.name + ' · Let’s play' : labels[pick.kind];
    const rect = container.getBoundingClientRect();
    el('toy-tooltip').style.left = `${Math.min(e.clientX - rect.left + 15, rect.width - 154)}px`;
    el('toy-tooltip').style.top = `${e.clientY - rect.top - 38}px`;
  }
});
renderer.domElement.addEventListener('pointerup', (e) => {
  if (pointerDown && !dragging) {
    const pick = pickScene(e);
    if (pick) {
      if (paused) setPaused(false);
      if (pick.kind === 'plush') startTogether('plush');
      else if (pick.kind === 'hide') together.hide(pick.index);
      else if (pick.kind === 'bubble') together.pop(pick.index);
      else if (pick.toy.id === 'ball' && together.mode === 'roll') together.roll();
      else invite(pick.toy.id);
    }
  }
  pointerDown = undefined;
  dragging = false;
});
renderer.domElement.addEventListener('pointercancel', () => {
  pointerDown = undefined;
  dragging = false;
});
renderer.domElement.addEventListener('pointerleave', () => {
  el('toy-tooltip').hidden = true;
});
renderer.domElement.addEventListener('dblclick', (e) => {
  const pick = pickScene(e);
  if (pick?.kind === 'toy') stage.focus(pick.toy.focus);
  if (pick?.kind === 'plush') stage.focus(plush.home);
});

// Opt-in development inspection for deterministic animation and navigation checks. Absent from production.
if (import.meta.env.DEV && new URLSearchParams(location.search).has('inspect')) {
  const inspect = {
    objects: {
      kaia: kaia.root,
      room: room.root,
      roomGround: stage.roomGround,
      toys: Object.fromEntries(toys.map((toy) => [toy.id, toy.root])),
      camera,
      controls,
      imagination: {
        ocean: imagination.ocean,
        ship: imagination.ship,
        space: imagination.space,
        zoo: imagination.zoo,
        polar: imagination.polar,
        forest: imagination.forest,
        boat: imagination.boat,
        lighthouse: imagination.lighthouse,
      },
      plush: plush.root,
      bubbles: together.bubbles,
      covers: together.covers,
    },
    state: () => ({
      time,
      paused,
      auto: director.auto,
      state: director.state,
      toy: director.current?.id,
      queued: director.queued?.id,
      elapsed: director.elapsed,
      locomotion: {
        running: director.running,
        speed: director.state === 'walking' ? director.speed : 0,
      },
      position: kaia.root.position.toArray(),
      pose: { ...kaia.pose },
      visited: [...director.visited],
      floorIsFree: navigation.isFree(kaia.root.position),
      imagination: {
        state: imagination.state,
        story: imagination.story,
        amount: imagination.amount,
      },
      together: together.inspection(),
      plush: {
        name: plush.name,
        visible: plush.root.visible,
        held: plush.root.parent === kaia.body,
        position: plush.root.getWorldPosition(new THREE.Vector3()).toArray(),
      },
      microphone: { state: microphone.state, level: microphone.level },
      family: Object.fromEntries(
        Object.entries(family.visits).map(([kind, visit]) => [
          kind,
          {
            state: visit.state,
            position: visit.character.root.position.toArray(),
            visible: visit.character.root.visible,
          },
        ]),
      ),
      camera: {
        position: camera.position.toArray(),
        zoom: camera.zoom,
        target: controls.target.toArray(),
      },
      destinations: toys.map((toy) => ({
        id: toy.id,
        free: navigation.isFree(toy.destination),
        reachable: navigation.findPath({ x: 0, z: 0.65 }, toy.destination).length > 0,
      })),
      rendering: { calls: renderer.info.render.calls, triangles: renderer.info.render.triangles },
    }),
    setManual(value: boolean) {
      manual = value;
    },
    setAuto(value: boolean) {
      director.auto = value;
    },
    setFamilyAuto(value: boolean) {
      family.auto = value;
    },
    request: (id: ToyId) => director.request(id),
    invite: (kind: 'mom' | 'dad') => family.invite(kind),
    step(seconds: number) {
      for (let t = 0; t < Math.min(seconds, 300); t += 1 / 60)
        updateSimulation(Math.min(1 / 60, seconds - t));
      stage.update(1 / 60);
      // Keep geometry queries current; the animation loop paints after a batch of manual steps.
      scene.updateMatrixWorld(true);
      camera.updateMatrixWorld(true);
      updateSpeech();
    },
    screenPoint(id: ToyId) {
      const toy = toys.find((t) => t.id === id)!;
      const p = toy.focus.clone().project(camera),
        rect = renderer.domElement.getBoundingClientRect();
      return {
        x: rect.left + (p.x * 0.5 + 0.5) * rect.width,
        y: rect.top + (-p.y * 0.5 + 0.5) * rect.height,
      };
    },
    focus: (id: ToyId) => stage.focus(toys.find((t) => t.id === id)!.focus),
  };
  (window as unknown as { __KAIA__: typeof inspect }).__KAIA__ = inspect;
}

if (import.meta.hot)
  import.meta.hot.dispose(() => {
    renderer.setAnimationLoop(null);
    microphone.stop();
    together.dispose();
    plush.dispose();
    imagination.dispose();
    stage.dispose();
    sound.dispose();
    clearTimeout(toastTimer);
  });
