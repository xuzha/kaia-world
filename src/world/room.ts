import * as THREE from 'three';
import {
  arch,
  book,
  box,
  contactShadow,
  curve,
  cylinder,
  group,
  mesh,
  plant,
  rod,
  sphere,
  torus,
} from './primitives';
import { canvasTexture, colors, floorMaterial, labelTexture, material, seeded } from './palette';
import type { Obstacle } from './navigation';

export const FLOOR_Y = 0.12;
export const MAT_AREA = 8.6 * 7;

function windowScene(parent: THREE.Object3D) {
  const root = group(parent, [-4.35, 1.32, -5.96]);
  arch(root, 3.35, 2.9, 0.12, [0, 0, 0], material(colors.wood, 'wood'));
  const sky = new THREE.MeshBasicMaterial({ color: '#d6e6da' });
  const farHills = new THREE.MeshBasicMaterial({ color: '#b7c6a1' });
  const nearHills = new THREE.MeshBasicMaterial({ color: '#91ad90' });
  const cloudMaterial = new THREE.MeshBasicMaterial({ color: '#fff8e9', transparent: true });
  arch(root, 3.05, 2.66, 0.02, [0, 0.12, 0.15], sky);
  sphere(root, [1.35, 0.65, 0.025], [-0.6, 0.48, 0.2], farHills);
  sphere(root, [1.08, 0.53, 0.025], [0.72, 0.42, 0.23], nearHills);
  sphere(
    root,
    [0.25, 0.25, 0.012],
    [0.68, 1.9, 0.2],
    new THREE.MeshBasicMaterial({ color: '#fff4cb' }),
  );
  const moonMask = new THREE.MeshBasicMaterial({
    color: '#d6e6da',
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  sphere(root, [0.23, 0.23, 0.012], [0.78, 1.97, 0.236], moonMask);
  for (const [x, y, s] of [
    [-0.85, 2, 0.4],
    [0.2, 2.25, 0.3],
  ]) {
    sphere(root, [s, 0.1, 0.02], [x, y, 0.23], cloudMaterial);
    sphere(root, [s * 0.44, 0.17, 0.02], [x - 0.05, y + 0.04, 0.23], cloudMaterial);
  }
  for (const x of [-0.51, 0.51])
    box(root, [0.065, 2.48, 0.12], [x, 1.34, 0.27], colors.cream, 0.013);
  box(root, [2.99, 0.07, 0.12], [0, 1.42, 0.27], colors.cream, 0.013);
  box(root, [3.65, 0.14, 0.54], [0, 0, 0.2], material(colors.wood, 'wood'));
  rod(root, [-2, 2.76, 0.23], [2, 2.76, 0.23], 0.035, colors.wood);
  for (const side of [-1, 1]) {
    sphere(root, 0.075, [side * 2, 2.76, 0.23], colors.wood);
    for (let i = 0; i < 4; i++) {
      const panel = box(
        root,
        [0.22, 2.62 - i * 0.04, 0.18],
        [side * (1.57 + i * 0.12), 1.25 + i * 0.02, 0.32 + Math.sin(i) * 0.06],
        material(i % 2 ? '#e8d7b6' : '#eee1c8', 'fabric'),
        0.085,
      );
      panel.rotation.z = side * 0.035;
    }
    box(root, [0.48, 0.1, 0.24], [side * 1.78, 0.92, 0.35], colors.oat);
  }
  const bench = group(parent, [-4.35, 0, -5.14]);
  box(bench, [3.86, 0.55, 1.0], [0, 0.34, 0], material(colors.cream, 'wood'), 0.1);
  box(bench, [3.83, 0.24, 1.01], [0, 0.73, 0], material(colors.sage, 'fabric'), 0.12);
  for (const x of [-1.32, 0, 1.32]) {
    box(bench, [1.15, 0.38, 0.04], [x, 0.34, 0.515], material(colors.oat, 'wood'), 0.045);
    box(bench, [0.28, 0.055, 0.04], [x, 0.4, 0.551], colors.wood, 0.02);
  }
  const cushion = box(
    bench,
    [0.8, 0.58, 0.3],
    [-1.17, 1.08, -0.24],
    material(colors.peach, 'fabric'),
    0.14,
  );
  cushion.rotation.z = 0.15;
  const pillow = box(
    bench,
    [0.78, 0.57, 0.3],
    [1.15, 1.08, -0.24],
    material(colors.milk, 'fabric'),
    0.14,
  );
  pillow.rotation.z = -0.12;
  book(bench, [0.25, 0.88, 0.05], colors.yellow, 0.72, 'SUN').rotation.set(-Math.PI / 2, 0, 0.3);
  plant(parent, [-6.48, 0, -5.0], 0.7, colors.cream);
  const daySky = new THREE.Color('#d6e6da'),
    nightSky = new THREE.Color('#6e8291');
  const dayFar = new THREE.Color('#b7c6a1'),
    nightFar = new THREE.Color('#698777');
  const dayNear = new THREE.Color('#91ad90'),
    nightNear = new THREE.Color('#526b63');
  return (night: number) => {
    sky.color.lerpColors(daySky, nightSky, night);
    farHills.color.lerpColors(dayFar, nightFar, night);
    nearHills.color.lerpColors(dayNear, nightNear, night);
    cloudMaterial.opacity = 1 - night;
    moonMask.color.copy(sky.color);
    moonMask.opacity = night;
  };
}

function bookshelf(parent: THREE.Object3D) {
  const root = group(parent, [0.7, 0.08, -5.42]);
  const wood = material('#d4b88e', 'wood');
  box(root, [4.5, 1.93, 0.11], [0, 1.01, -0.37], '#bc9e77');
  for (const x of [-2.25, -0.75, 0.75, 2.25]) box(root, [0.11, 2.08, 0.83], [x, 1.04, 0], wood);
  for (const y of [0.09, 1.01, 2.03]) box(root, [4.64, 0.12, 0.85], [0, y, 0], wood);
  const rng = seeded(172);
  const palette = [
    colors.coral,
    colors.sage,
    colors.sky,
    colors.yellow,
    colors.peach,
    colors.lilac,
  ];
  for (const [x, y, n] of [
    [-1.96, 1.07, 5],
    [0.99, 0.15, 5],
    [-0.42, 1.07, 3],
  ]) {
    for (let i = 0; i < n; i++) {
      const item = book(
        root,
        [x + i * 0.18, y, 0.1],
        palette[Math.floor(rng() * palette.length)],
        0.77 + rng() * 0.2,
      );
      item.rotation.y = -Math.PI / 2;
      if (i === n - 1) item.rotation.z = -0.12;
    }
  }
  for (const x of [-1.48, 0]) {
    box(root, [1.07, 0.55, 0.64], [x, 0.42, 0.03], material('#c4aa83', 'fabric'), 0.1);
    for (let i = 0; i < 5; i++)
      box(root, [1.065, 0.018, 0.018], [x, 0.2 + i * 0.1, 0.355], '#b59c77', 0.004);
    box(root, [0.25, 0.075, 0.018], [x, 0.56, 0.368], '#786f56', 0.025);
  }
  const bunny = group(root, [1.46, 1.07, 0.05]);
  sphere(bunny, [0.24, 0.29, 0.2], [0, 0.25, 0], colors.milk);
  sphere(bunny, [0.23, 0.21, 0.2], [0, 0.61, 0], colors.milk);
  for (const x of [-0.105, 0.105]) {
    sphere(bunny, [0.066, 0.2, 0.06], [x, 0.85, 0], colors.milk).rotation.z = -x;
    sphere(bunny, [0.029, 0.13, 0.01], [x, 0.86, 0.057], colors.peach);
    sphere(bunny, 0.017, [x * 0.8, 0.63, 0.19], colors.ink);
  }
  sphere(bunny, [0.025, 0.018, 0.015], [0, 0.57, 0.207], colors.coral);
  box(bunny, [0.24, 0.12, 0.06], [0, 0.44, 0.19], colors.sage);
  plant(root, [1.82, 2.1, 0], 0.43, colors.coral);
  book(root, [-1.75, 2.1, 0], colors.coral, 0.82, 'ABC');
  book(root, [-1.13, 2.1, -0.07], colors.sky, 0.65, 'MOON').rotation.z = -0.1;
  const sign = box(root, [1.28, 0.3, 0.07], [0.18, 2.3, 0.1], colors.cream);
  const label = labelTexture('little things', colors.cream, colors.ink);
  mesh(
    sign,
    new THREE.PlaneGeometry(1.22, 0.25),
    new THREE.MeshStandardMaterial({ map: label }),
    [0, 0, 0.041],
  );
}

function wallDecor(parent: THREE.Object3D) {
  const picture = group(parent, [-7.48, 2.85, -1.7]);
  picture.rotation.y = Math.PI / 2;
  box(picture, [1.68, 2, 0.09], [0, 0, 0], material(colors.wood, 'wood'));
  const art = canvasTexture(512, (ctx, s) => {
    ctx.fillStyle = '#f4eddb';
    ctx.fillRect(0, 0, s, s);
    const rainbow = ['#c5795f', '#d5a36b', '#cbb98b', '#97a283'];
    rainbow.forEach((color, i) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 30;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(256, 265, 150 - i * 35, Math.PI, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(106 + i * 35, 265);
      ctx.lineTo(106 + i * 35, 345);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(406 - i * 35, 265);
      ctx.lineTo(406 - i * 35, 345);
      ctx.stroke();
    });
    ctx.fillStyle = '#796e58';
    ctx.font = '24px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('you are my sunshine', 256, 418);
  });
  mesh(
    picture,
    new THREE.PlaneGeometry(1.5, 1.82),
    new THREE.MeshStandardMaterial({ map: art }),
    [0, 0, 0.055],
  );
  const peg = group(parent, [-7.43, 1.73, 2.1]);
  peg.rotation.y = Math.PI / 2;
  box(peg, [2.6, 0.15, 0.1], [0, 0, 0], material(colors.wood, 'wood'));
  for (const x of [-0.9, 0, 0.9]) sphere(peg, 0.072, [x, 0, 0.13], colors.wood);
  // A tiny linen tote hangs from a peg.
  torus(peg, 0.19, 0.028, [-0.9, -0.15, 0.16], colors.oat);
  box(peg, [0.58, 0.56, 0.16], [-0.9, -0.59, 0.15], material(colors.milk, 'fabric'), 0.14);
  sphere(peg, [0.13, 0.13, 0.014], [-0.9, -0.59, 0.244], colors.yellow);
  const clockRoot = group(parent, [4.58, 3.32, -5.89]);
  cylinder(clockRoot, 0.44, 0.44, 0.12, [0, 0, 0], material(colors.wood, 'wood')).rotation.x =
    Math.PI / 2;
  cylinder(clockRoot, 0.38, 0.38, 0.13, [0, 0, 0.025], colors.milk).rotation.x = Math.PI / 2;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    sphere(clockRoot, 0.018, [Math.sin(a) * 0.32, Math.cos(a) * 0.32, 0.099], colors.wood);
  }
  rod(clockRoot, [0, 0, 0.11], [0.15, 0.15, 0.11], 0.018, colors.ink);
  rod(clockRoot, [0, 0, 0.11], [-0.21, 0.1, 0.11], 0.014, colors.ink);
  sphere(clockRoot, 0.035, [0, 0, 0.12], colors.coral);
  const bunting = group(parent, [1.5, 3.88, -5.72]);
  curve(
    bunting,
    [
      [-3, 0, 0],
      [-1.5, -0.32, 0],
      [0, -0.43, 0],
      [1.5, -0.32, 0],
      [3, 0, 0],
    ],
    0.012,
    colors.oat,
  );
  for (let i = 0; i < 9; i++) {
    const x = -2.5 + i * 0.63,
      y = -0.44 + 0.046 * x * x;
    const shape = new THREE.Shape();
    shape.moveTo(-0.19, 0);
    shape.lineTo(0.19, 0);
    shape.lineTo(0, -0.32);
    shape.closePath();
    mesh(
      bunting,
      new THREE.ShapeGeometry(shape),
      new THREE.MeshStandardMaterial({
        color: [colors.coral, colors.yellow, colors.sage, colors.sky][i % 4],
        side: THREE.DoubleSide,
      }),
      [x, y, 0],
    );
  }
}

function foamMat(parent: THREE.Object3D) {
  const root = group(parent, [0, 0, 0.65]);
  box(root, [8.7, 0.15, 7.1], [0, 0.01, 0], material('#ddd0b1', 'fabric'), 0.075);
  const shades = ['#e8e5cf', '#dbe0bf', '#e5e0c5', '#d3d8b9'];
  for (let x = 0; x < 8; x++) {
    for (let z = 0; z < 7; z++) {
      box(
        root,
        [1.067, 0.13, 0.993],
        [(x - 3.5) * 1.075, 0.045, z - 3],
        material(shades[(x + z * 3) % 4], 'fabric'),
        0.035,
      );
    }
  }
  const print = canvasTexture(512, (ctx, s) => {
    ctx.clearRect(0, 0, s, s);
    ctx.strokeStyle = '#aeb393';
    ctx.lineWidth = 2;
    ctx.setLineDash([7, 8]);
    ctx.beginPath();
    ctx.arc(s / 2, s / 2, 190, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#dfc997';
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      ctx.save();
      ctx.translate(256 + Math.cos(a) * 74, 256 + Math.sin(a) * 74);
      ctx.rotate(a);
      ctx.beginPath();
      ctx.ellipse(0, 0, 26, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#e1cea2';
    ctx.beginPath();
    ctx.arc(256, 256, 55, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#a7a589';
    ctx.beginPath();
    ctx.arc(240, 250, 4, 0, Math.PI * 2);
    ctx.arc(272, 250, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#a7a589';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(256, 263, 13, 0.15, Math.PI - 0.15);
    ctx.stroke();
  });
  const decal = mesh(
    root,
    new THREE.PlaneGeometry(3.55, 3.55),
    new THREE.MeshStandardMaterial({
      map: print,
      transparent: true,
      opacity: 0.48,
      depthWrite: false,
    }),
    [0, 0.116, 0.2],
  );
  decal.rotation.x = -Math.PI / 2;
  decal.castShadow = false;
  // Cloth tabs make the scale of the padded tiles legible.
  box(root, [0.34, 0.017, 0.14], [3.74, 0.09, 3.56], colors.milk, 0.008);
  for (let i = 0; i < 3; i++)
    box(
      root,
      [0.035, 0.02, 0.08],
      [3.65 + i * 0.07, 0.094, 3.57],
      [colors.sage, colors.yellow, colors.coral][i],
      0.005,
    );
}

export function createRoom(scene: THREE.Scene) {
  const root = group(scene);
  box(root, [15.8, 0.42, 12.8], [0, -0.24, 0], material('#d5ba94', 'wood'), 0.2);
  box(root, [15.7, 0.12, 12.7], [0, -0.045, 0], floorMaterial(), 0.065);
  const walls = group(root);
  box(walls, [15.7, 4.6, 0.24], [0, 2.26, -6.25], material('#eee2c9', 'plaster'), 0.08);
  box(walls, [0.24, 4.6, 12.45], [-7.72, 2.26, -0.09], material('#e9ddc4', 'plaster'), 0.08);
  box(walls, [15.45, 1.05, 0.035], [0, 0.51, -6.11], material('#b6bea0', 'wood'), 0.01);
  box(walls, [0.035, 1.05, 12.32], [-7.58, 0.51, 0], material('#b6bea0', 'wood'), 0.01);
  for (let x = -7.2; x < 7.6; x += 0.42)
    box(walls, [0.013, 1, 0.022], [x, 0.51, -6.083], '#9eaa89', 0.003);
  for (let z = -5.85; z < 6.2; z += 0.42)
    box(walls, [0.022, 1, 0.013], [-7.56, 0.51, z], '#9eaa89', 0.003);
  for (const y of [0.075, 1.08]) {
    box(walls, [15.5, 0.09, 0.09], [0, y, -6.05], '#cad0b4', 0.016);
    box(walls, [0.09, 0.09, 12.35], [-7.54, y, 0], '#cad0b4', 0.016);
  }
  box(walls, [15.72, 0.08, 0.31], [0, 4.57, -6.25], colors.milk, 0.03);
  box(walls, [0.31, 0.08, 12.49], [-7.72, 4.57, -0.09], colors.milk, 0.03);
  const updateWindowLighting = windowScene(root);
  bookshelf(root);
  wallDecor(root);
  foamMat(root);
  plant(root, [6.5, 0, -4.9], 1.55, colors.cream);
  plant(root, [-6.65, 0, 4.85], 0.97, colors.coral);
  // Low storage on the open side of the room.
  const basket = group(root, [6.33, 0, -1.35]);
  cylinder(basket, 0.58, 0.46, 0.76, [0, 0.39, 0], material('#c5a580', 'fabric'));
  for (let i = 0; i < 7; i++)
    torus(basket, 0.48 + i * 0.014, 0.022, [0, 0.1 + i * 0.1, 0], '#b69670').rotation.x =
      Math.PI / 2;
  sphere(basket, 0.26, [-0.2, 0.77, 0], colors.sage);
  sphere(basket, [0.28, 0.2, 0.31], [0.2, 0.83, 0.1], colors.milk);
  const bunnyEar = sphere(basket, [0.085, 0.29, 0.08], [0.24, 1.14, 0.06], colors.milk);
  bunnyEar.rotation.z = -0.2;
  sphere(basket, [0.07, 0.26, 0.08], [0.05, 1.1, 0.06], colors.milk).rotation.z = 0.2;
  contactShadow(root, 2, 1.6, 6.33, -1.35);
  // A sun puddle and window mullions, softened at the edges by the texture.
  const sunlight = canvasTexture(256, (ctx, s) => {
    const g = ctx.createLinearGradient(0, 0, 0, s);
    g.addColorStop(0, '#fff2c470');
    g.addColorStop(1, '#fff2c400');
    ctx.fillStyle = g;
    ctx.fillRect(8, 8, 240, 240);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillRect(83, 0, 5, s);
    ctx.fillRect(166, 0, 5, s);
    ctx.fillRect(0, 96, s, 5);
  });
  const sunlightMaterial = new THREE.MeshBasicMaterial({
    map: sunlight,
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
  });
  const patch = mesh(root, new THREE.PlaneGeometry(4.1, 6), sunlightMaterial, [-3.25, 0.143, -1.4]);
  patch.rotation.set(-Math.PI / 2, 0, -0.25);
  patch.castShadow = patch.receiveShadow = false;
  const plaque = box(root, [1.66, 0.22, 0.025], [5.94, -0.21, 6.39], '#b59670', 0.014);
  mesh(
    plaque,
    new THREE.PlaneGeometry(1.56, 0.18),
    new THREE.MeshStandardMaterial({
      map: labelTexture('made of little moments', '#b59670', '#f7efdb'),
    }),
    [0, 0, 0.014],
  );

  const obstacles: Obstacle[] = [
    { x: -4.35, z: -5.13, halfX: 2.0, halfZ: 0.58 },
    { x: 0.7, z: -5.42, halfX: 2.4, halfZ: 0.5 },
    { x: 6.5, z: -4.9, halfX: 0.6, halfZ: 0.6 },
    { x: -6.65, z: 4.85, halfX: 0.45, halfZ: 0.45 },
    { x: 6.33, z: -1.35, halfX: 0.65, halfZ: 0.65 },
  ];
  return {
    root,
    walls,
    obstacles,
    updateLighting(night: number) {
      updateWindowLighting(night);
      sunlightMaterial.opacity = 0.6 * (1 - night);
    },
  };
}
