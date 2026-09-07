import * as THREE from 'three';
import { box, contactShadow, curve, cylinder, group, mesh, rod, sphere, torus } from './primitives';
import { canvasTexture, floorMaterial, material, seeded } from './palette';
import { FLOOR_Y } from './room';
import { disposeStory } from './story-resources';
import { createNightStars, createNightWater } from './night-effects';

const groundY = -5.8;
const timber = '#a88760',
  bark = '#665846',
  rope = '#bdba8a';

function forestTree(parent: THREE.Group, x: number, z: number, height: number, radius: number) {
  const root = group(parent, [x, groundY, z]);
  root.name = 'forest-tree';
  cylinder(root, radius * 0.65, radius, height, [0, height / 2, 0], material(bark, 'wood'), 12);
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2 + 0.2;
    rod(
      root,
      [0, 1.5, 0],
      [Math.cos(angle) * radius * 2, 0.1, Math.sin(angle) * radius * 2],
      radius * 0.25,
      bark,
    );
    const dx = Math.cos(angle) * 1.4,
      dz = Math.sin(angle) * 1.4;
    rod(root, [0, height * 0.67, 0], [dx, height * 0.94, dz], radius * 0.2, bark);
    sphere(
      root,
      [2.2, 1.35, 1.9],
      [dx, height * 0.95 + (i % 2) * 0.5, dz],
      ['#385c4c', '#2d554a', '#476952', '#3c6252'][i],
    );
  }
  sphere(root, [2.5, 1.65, 2.15], [0, height + 0.9, 0], '#3c6151');
  return root;
}

function suspensionBridge(parent: THREE.Group) {
  const root = group(parent);
  root.name = 'forest-bridge';
  const start = new THREE.Vector3(0.3, FLOOR_Y, -6.65);
  const end = new THREE.Vector3(4.3, FLOOR_Y + 0.35, -10.4);
  const direction = end.clone().sub(start).setY(0).normalize();
  const across = new THREE.Vector3(-direction.z, 0, direction.x);
  const point = (t: number, side = 0, height = 0) =>
    start
      .clone()
      .lerp(end, t)
      .addScaledVector(across, side)
      .add(new THREE.Vector3(0, height - Math.sin(t * Math.PI) * 0.6, 0));
  for (let i = 0; i < 22; i++) {
    const t = (i + 0.5) / 22;
    const plank = box(
      root,
      [1.25, 0.105, start.distanceTo(end) / 22 - 0.025],
      point(t).toArray(),
      material(timber, 'wood'),
      0.025,
    );
    plank.rotation.y = Math.atan2(direction.x, direction.z);
    plank.rotation.x = Math.atan(
      (end.y - start.y - Math.PI * 0.6 * Math.cos(t * Math.PI)) / start.distanceTo(end),
    );
  }
  for (const side of [-0.67, 0.67]) {
    for (const t of [0, 1]) {
      const p = point(t, side);
      rod(
        root,
        p.toArray(),
        p
          .clone()
          .add(new THREE.Vector3(0, 1.25, 0))
          .toArray(),
        0.055,
        timber,
      );
    }
    for (const height of [0.14, 1.1])
      curve(
        root,
        Array.from({ length: 13 }, (_, i) => point(i / 12, side, height).toArray()),
        0.032,
        rope,
      );
    for (let i = 1; i < 12; i++)
      rod(
        root,
        point(i / 12, side, 0.13).toArray(),
        point(i / 12, side, 1.1).toArray(),
        0.016,
        rope,
      );
  }
  const landing = cylinder(
    root,
    1.5,
    1.5,
    0.27,
    [end.x, end.y - 0.18, end.z],
    material(timber, 'wood'),
    18,
  );
  landing.name = 'forest-bridge-landing';
  return root;
}

function treehouse(parent: THREE.Group, windowMaterial: THREE.Material) {
  const root = group(parent, [-3.9, FLOOR_Y, -7.65]);
  root.name = 'forest-treehouse';
  const wood = material('#ab895e', 'wood');
  // The front is open, like a dollhouse, so the play area remains visible.
  for (let i = 0; i < 12; i++)
    box(root, [0.48, 3.05, 0.16], [-2.68 + i * 0.49, 1.55, -0.9], wood, 0.025);
  for (const x of [-2.95, 2.95]) {
    box(root, [0.17, 3.23, 2.5], [x, 1.65, 0.2], wood, 0.025);
    rod(root, [x, 0, 1.48], [x, 3.45, 1.48], 0.075, timber);
  }
  const gable = new THREE.Shape([
    new THREE.Vector2(-3.03, 3.05),
    new THREE.Vector2(3.03, 3.05),
    new THREE.Vector2(0, 5.15),
  ]);
  mesh(
    root,
    new THREE.ExtrudeGeometry(gable, { depth: 0.18, bevelEnabled: false }),
    wood,
    [0, 0, -0.99],
  );
  mesh(root, new THREE.ShapeGeometry(gable), wood, [0, 0, 1.94]);
  const roofColor = material('#426658', 'wood');
  for (const side of [-1, 1]) {
    const roof = box(root, [3.8, 0.18, 3.7], [side * 1.6, 4.14, 0.15], roofColor, 0.06);
    roof.rotation.z = -side * 0.59;
    // Overlapping shingle seams give the roof a readable wooden texture.
    for (let row = 0; row < 5; row++) {
      const x = side * (0.2 + row * 0.69);
      box(
        root,
        [0.74, 0.09, 3.73],
        [x, 5.16 - Math.abs(x) * 0.67, 0.15],
        roofColor,
        0.025,
      ).rotation.z = -side * 0.59;
    }
  }
  cylinder(root, 0.065, 0.065, 3.82, [0, 5.22, 0.15], '#8e9571', 12).rotation.x = Math.PI / 2;
  const window = group(root, [-0.45, 1.85, -0.795]);
  window.name = 'treehouse-window';
  box(window, [1.7, 1.65, 0.12], [0, 0, 0], '#605f49', 0.13);
  box(window, [1.44, 1.4, 0.05], [0, 0, 0.079], windowMaterial, 0.1);
  box(window, [0.06, 1.43, 0.06], [0, 0, 0.12], '#d0b682', 0.015);
  box(window, [1.46, 0.07, 0.06], [0, 0, 0.12], '#d0b682', 0.015);
  box(window, [1.94, 0.13, 0.36], [0, -0.91, 0.15], timber, 0.03);
  // A round attic window sits in the front gable trim.
  cylinder(root, 0.36, 0.36, 0.04, [0, 3.82, 1.92], windowMaterial, 32).rotation.x = Math.PI / 2;
  torus(root, 0.38, 0.065, [0, 3.82, 1.95], '#b89c68');
  for (const side of [-1, 1])
    rod(root, [side * 3.12, 3.11, 1.99], [0, 5.25, 1.99], 0.075, '#af9970');
  return root;
}

function squirrel(parent: THREE.Group, pos: number[], yaw: number, color: string) {
  const root = group(parent, pos);
  root.name = 'forest-squirrel';
  root.rotation.y = yaw;
  for (const side of [-1, 1]) sphere(root, [0.1, 0.045, 0.15], [side * 0.13, 0.047, 0.1], color);
  sphere(root, [0.23, 0.31, 0.23], [0, 0.33, 0], color);
  sphere(root, [0.13, 0.23, 0.056], [0, 0.33, 0.204], '#d6bc8f');
  const tail = group(root, [0, 0.2, -0.2]);
  tail.name = 'squirrel-tail';
  sphere(tail, [0.2, 0.53, 0.22], [0, 0.36, -0.24], color).rotation.x = -0.3;
  sphere(tail, [0.22, 0.26, 0.23], [0, 0.78, -0.12], color);
  sphere(tail, [0.115, 0.28, 0.035], [0, 0.51, -0.035], '#c9a778').rotation.x = -0.3;
  const head = group(root, [0, 0.61, 0.08]);
  head.name = 'squirrel-head';
  sphere(head, [0.23, 0.22, 0.215], [0, 0, 0], color);
  for (const side of [-1, 1]) {
    sphere(head, [0.09, 0.16, 0.066], [side * 0.145, 0.22, -0.03], color).rotation.z = side * 0.12;
    sphere(head, [0.043, 0.1, 0.02], [side * 0.146, 0.23, 0.032], '#caa384');
    sphere(head, 0.032, [side * 0.16, 0.034, 0.17], '#263b38');
    sphere(head, 0.01, [side * 0.163, 0.045, 0.193], '#eee6c2');
  }
  sphere(head, [0.125, 0.077, 0.1], [0, -0.07, 0.203], '#dfc49c');
  sphere(head, 0.036, [0, -0.035, 0.291], '#37443c');
  const paws = group(root, [0, 0.41, 0.24]);
  sphere(paws, [0.087, 0.105, 0.073], [0, 0, 0.07], '#a07647');
  sphere(paws, [0.099, 0.045, 0.077], [0, 0.085, 0.07], '#74634b');
  for (const side of [-1, 1])
    sphere(paws, [0.075, 0.1, 0.072], [side * 0.085, -0.02, 0.025], color).rotation.z = side * 0.4;
  return { root, head, paws, tail };
}

function createFireflies(parent: THREE.Group) {
  const rng = seeded(813),
    positions: number[] = [],
    phases: number[] = [];
  for (let i = 0; i < 88; i++) {
    const angle = rng() * Math.PI * 2,
      radius = 7.7 + rng() * 6;
    positions.push(
      Math.cos(angle) * radius,
      i < 50 ? -3.8 + rng() * 4.4 : 1.4 + rng() * 2.8,
      Math.sin(angle) * radius * 0.85,
    );
    phases.push(rng() * Math.PI * 2);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('phase', new THREE.Float32BufferAttribute(phases, 1));
  const material = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 } },
    vertexShader: `
      attribute float phase;
      uniform float time;
      varying float glow;
      void main() {
        vec3 p = position;
        p.x += sin(time * 0.4 + phase) * 0.4;
        p.y += sin(time * 0.6 + phase * 3.0) * 0.24;
        p.z += cos(time * 0.3 + phase) * 0.35;
        glow = 0.2 + 0.8 * pow(0.5 + 0.5 * sin(time * 1.3 + phase), 2.0);
        gl_PointSize = 9.0 + glow * 5.0;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: `
      varying float glow;
      void main() {
        float r = length(gl_PointCoord - 0.5) * 2.0;
        float halo = exp(-r * 5.0) * 0.4 + (1.0 - smoothstep(0.04, 0.2, r));
        gl_FragColor = vec4(0.72, 0.94, 0.35, halo * glow * (1.0 - smoothstep(0.75, 1.0, r)));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const fireflies = new THREE.Points(geometry, material);
  fireflies.name = 'forest-fireflies';
  parent.add(fireflies);
  return {
    material,
    update(time: number) {
      material.uniforms.time.value = time;
    },
  };
}

export function createForest() {
  const root = group();
  root.name = 'imagination-forest';
  root.visible = false;
  const stars = createNightStars(root, 571, 400);
  const fireflies = createFireflies(root);
  const moonMaterial = new THREE.MeshBasicMaterial({ color: '#c8d6be' });
  const moon = sphere(root, 0.5, [-2.6, 2.7, -16.5], moonMaterial);
  moon.name = 'forest-moon';
  moon.castShadow = false;
  const ground = mesh(root, new THREE.CircleGeometry(55, 80), '#233e36', [0, groundY - 0.08, 0]);
  ground.name = 'forest-ground';
  ground.rotation.x = -Math.PI / 2;
  ground.castShadow = false;
  ground.receiveShadow = false;
  const deckShadow = contactShadow(root, 22, 18, 0, 0, 0.24, groundY - 0.06);
  const stream = new THREE.Shape();
  stream.moveTo(12, 23);
  stream.bezierCurveTo(6, 11, 16, 4, 7, -7);
  stream.bezierCurveTo(3, -13, -7, -12, -18, -19);
  stream.lineTo(-17, -22);
  stream.bezierCurveTo(-6, -15, 5, -16, 10, -8);
  stream.bezierCurveTo(19, 3, 9, 11, 15, 23);
  stream.closePath();
  const water = createNightWater('#285858', '#a7cfb6');
  const creek = mesh(root, new THREE.ShapeGeometry(stream, 64), water.material, [
    0,
    groundY + 0.015,
    0,
  ]);
  creek.name = 'forest-stream';
  creek.rotation.x = -Math.PI / 2;
  creek.castShadow = false;

  const deckShape = new THREE.Shape();
  deckShape.moveTo(-7, -6.6);
  deckShape.lineTo(7, -6.6);
  deckShape.quadraticCurveTo(8, -6.6, 8, -5.6);
  deckShape.lineTo(8, 5.6);
  deckShape.quadraticCurveTo(8, 6.6, 7, 6.6);
  deckShape.lineTo(-7, 6.6);
  deckShape.quadraticCurveTo(-8, 6.6, -8, 5.6);
  deckShape.lineTo(-8, -5.6);
  deckShape.quadraticCurveTo(-8, -6.6, -7, -6.6);
  const deck = group(root);
  deck.name = 'forest-deck';
  const fascia = mesh(
    deck,
    new THREE.ExtrudeGeometry(deckShape, { depth: 0.398, bevelEnabled: false }),
    material('#876e4e', 'wood'),
    [0, FLOOR_Y - 0.4, 0],
  );
  fascia.rotation.x = -Math.PI / 2;
  const woodFloor = floorMaterial();
  woodFloor.color.set('#cfb588');
  const floorGeometry = new THREE.ShapeGeometry(deckShape, 32);
  const uv = floorGeometry.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) + 8) / 16, (uv.getY(i) + 6.6) / 13.2);
  const floor = mesh(deck, floorGeometry, woodFloor, [0, FLOOR_Y, 0]);
  floor.name = 'forest-floor';
  floor.rotation.x = -Math.PI / 2;
  floor.castShadow = false;
  for (const z of [-4.2, 0, 4.2])
    box(deck, [15.7, 0.28, 0.38], [0, FLOOR_Y - 0.51, z], timber, 0.04);
  forestTree(root, -9, -2.7, 11.9, 1.2);
  forestTree(root, 4.4, -11.1, 11.2, 0.85);
  forestTree(root, -3.9, -8.6, 10.6, 0.8);
  for (const [x, z, h, r] of [
    [-13, -13, 10.7, 0.7],
    [-6.5, -18, 12.3, 0.65],
    [3, -20, 11.2, 0.6],
    [14.3, -18, 11.7, 0.7],
    [12.3, 1, 8.6, 0.6],
  ])
    forestTree(root, x, z, h, r);
  const supports = group(root);
  supports.name = 'forest-supports';
  cylinder(supports, 0.64, 0.95, 5.2, [-1.7, groundY + 2.6, 2.5], material(bark, 'wood'), 14);
  for (const [x, z] of [
    [-5.8, 4.8],
    [4.7, 4.6],
    [2.3, -2.7],
  ])
    rod(supports, [-1.7, -3.5, 2.5], [x, -0.72, z], 0.31, material(bark, 'wood'));
  for (const [a, b, radius] of [
    [[-9, -3.7, -2.7], [-2, -0.72, 2], 0.42],
    [[-9, -2.4, -2.7], [-3, -0.72, -4.5], 0.33],
    [[-3.9, -4.4, -8.6], [4.8, -0.72, -2.8], 0.38],
    [[-3.9, -3.8, -8.6], [0, -0.72, 4.3], 0.34],
  ] as [number[], number[], number][])
    rod(supports, a, b, radius, material(bark, 'wood'));

  const windowMaterial = new THREE.MeshBasicMaterial({ color: '#f7c780' });
  treehouse(root, windowMaterial);
  suspensionBridge(root);
  const railing = group(root);
  railing.name = 'forest-railing';
  const rail = (from: number[], to: number[], posts: number) => {
    for (let i = 0; i <= posts; i++) {
      const x = THREE.MathUtils.lerp(from[0], to[0], i / posts),
        z = THREE.MathUtils.lerp(from[1], to[1], i / posts);
      rod(railing, [x, FLOOR_Y, z], [x, FLOOR_Y + 0.93, z], 0.052, timber);
    }
    rod(railing, [from[0], FLOOR_Y + 0.95, from[1]], [to[0], FLOOR_Y + 0.95, to[1]], 0.065, timber);
    curve(
      railing,
      [
        [from[0], FLOOR_Y + 0.54, from[1]],
        [(from[0] + to[0]) / 2, FLOOR_Y + 0.43, (from[1] + to[1]) / 2],
        [to[0], FLOOR_Y + 0.54, to[1]],
      ],
      0.021,
      rope,
    );
  };
  rail([-7.8, -5.7], [-7.8, 5.5], 7);
  rail([-7.1, 6.42], [4.9, 6.42], 8);
  rail([7.8, -5.4], [7.8, 4.8], 6);
  rail([1.1, -6.45], [7.1, -6.45], 4);
  // The front-right gate stays open where family members enter.
  const bench = group(root, [-4.35, FLOOR_Y, -5.13]);
  box(bench, [3.45, 0.2, 0.78], [0, 0.53, 0], material(timber, 'wood'), 0.045);
  for (const x of [-1.25, 1.25]) box(bench, [0.17, 0.47, 0.65], [x, 0.24, 0], timber, 0.02);
  for (const x of [-0.9, 0.8])
    box(
      bench,
      [0.78, 0.13, 0.62],
      [x, 0.69, 0],
      material(x < 0 ? '#b4b482' : '#c0a07a', 'fabric'),
      0.06,
    );
  const basket = group(root, [6.33, FLOOR_Y, -1.35]);
  cylinder(basket, 0.41, 0.3, 0.47, [0, 0.24, 0], material('#c2ab78', 'fabric'), 24);
  for (let i = 0; i < 6; i++)
    sphere(
      basket,
      0.075,
      [Math.cos(i * 2.4) * 0.2, 0.48, Math.sin(i * 2.4) * 0.2],
      i % 2 ? '#94734d' : '#d1af68',
    );
  const chest = group(root, [6.5, FLOOR_Y, -4.9]);
  box(chest, [0.87, 0.64, 0.85], [0, 0.33, 0], material(timber, 'wood'), 0.05);
  box(chest, [0.9, 0.11, 0.88], [0, 0.7, 0], '#7e8460', 0.03);

  const cablePoints = [
    [-7, 3.9, -6.65],
    [-3, 3.1, -6.65],
    [2, 3.05, -6.65],
    [7, 3.75, -6.65],
  ];
  curve(root, cablePoints, 0.019, '#82917b');
  const cable = new THREE.CatmullRomCurve3(cablePoints.map((p) => new THREE.Vector3(...p)));
  for (let i = 0; i < 13; i++) {
    const p = cable.getPoint(i / 12);
    rod(root, p.toArray(), [p.x, p.y - 0.12, p.z], 0.012, '#82917b');
    sphere(root, 0.065, [p.x, p.y - 0.18, p.z], windowMaterial);
  }
  const glowMap = canvasTexture(64, (ctx, s) => {
    const gradient = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    gradient.addColorStop(0, '#ffe6acb0');
    gradient.addColorStop(0.24, '#ffd38344');
    gradient.addColorStop(1, '#ffce6c00');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, s, s);
  });
  const glowMaterial = new THREE.SpriteMaterial({
    map: glowMap,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  for (const [x, y, z] of [
    [-6.6, 2.65, -6.12],
    [-1, 2.65, -6.12],
    [6.5, 2.15, -6.45],
  ]) {
    const lantern = group(root, [x, y, z]);
    lantern.name = 'forest-lantern';
    rod(root, [x, y + 0.39, z], [x, 3.6, z - 0.15], 0.013, '#8e906c');
    torus(lantern, 0.08, 0.017, [0, 0.32, 0], '#8e906c');
    cylinder(lantern, 0.13, 0.2, 0.11, [0, 0.19, 0], '#748363', 12);
    sphere(lantern, [0.15, 0.22, 0.15], [0, -0.02, 0], windowMaterial);
    cylinder(lantern, 0.17, 0.13, 0.07, [0, -0.25, 0], '#748363', 12);
    const glow = new THREE.Sprite(glowMaterial);
    glow.scale.setScalar(1.45);
    lantern.add(glow);
    const light = new THREE.PointLight('#ffc978', 13, 13, 2);
    light.position.set(0, -0.1, 0.6);
    lantern.add(light);
  }
  const animals = group(root);
  animals.name = 'forest-animals';
  const squirrels = [
    squirrel(animals, [-7.8, FLOOR_Y + 1.015, 1.1], 1.05, '#b19066'),
    squirrel(animals, [2.6, FLOOR_Y + 1.015, -6.45], -0.4, '#a98860'),
    squirrel(animals, [10.7, groundY, 4.4], -0.8, '#bd9a6b'),
  ];
  const rng = seeded(796);
  for (let i = 0; i < 26; i++) {
    const angle = rng() * Math.PI * 2,
      distance = 11 + rng() * 9;
    const x = Math.cos(angle) * distance,
      z = Math.sin(angle) * distance;
    const bush = group(root, [x, groundY, z]);
    sphere(bush, [0.5, 0.45, 0.43], [0, 0.3, 0], i % 2 ? '#3f6350' : '#54715a');
    if (i % 3 === 0) {
      cylinder(bush, 0.05, 0.075, 0.27, [0.5, 0.135, 0.2], '#a6b18a', 10);
      sphere(bush, [0.22, 0.11, 0.2], [0.5, 0.29, 0.2], '#c1aa7b');
    }
  }
  return {
    root,
    floor,
    update(time: number) {
      if (!root.visible) return;
      stars.update(time);
      water.update(time);
      fireflies.update(time);
      squirrels.forEach((animal, index) => {
        const phase = (time + index * 4.3) % 12;
        const nibble = phase < 3.5 ? Math.sin((phase / 3.5) * Math.PI) ** 2 : 0;
        const look = phase > 6 && phase < 10 ? Math.sin(((phase - 6) / 4) * Math.PI) ** 2 : 0;
        animal.head.rotation.set(
          nibble * (0.12 + Math.sin(time * 9) * 0.045),
          Math.sin(time * 0.8 + index) * look * 0.5,
          0,
        );
        animal.paws.position.y = 0.41 + Math.sin(time * 9) * nibble * 0.022;
        animal.tail.rotation.set(
          Math.sin(time * 1.3 + index) * 0.035,
          Math.sin(time * 0.7 + index) * look * 0.14,
          0,
        );
      });
    },
    dispose() {
      disposeStory(
        root,
        [
          woodFloor,
          deckShadow.material as THREE.Material,
          windowMaterial,
          moonMaterial,
          glowMaterial,
          stars.material,
          fireflies.material,
          water.material,
        ],
        [woodFloor.map!, glowMap],
      );
    },
  };
}
