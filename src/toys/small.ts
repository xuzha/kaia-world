import * as THREE from 'three';
import { box, contactShadow, cylinder, group, mesh, rod, sphere, torus } from '../world/primitives';
import { colors, material } from '../world/palette';
import type { ToyModel } from './types';

export function buildBall(): ToyModel {
  const root = group(),
    ball = group(root, [0, 0.34, 0]);
  const palette = [colors.sage, colors.milk, colors.coral, colors.milk, colors.yellow, colors.milk];
  palette.forEach((color, i) =>
    mesh(
      ball,
      new THREE.SphereGeometry(0.34, 8, 24, (i * Math.PI) / 3, Math.PI / 3),
      material(color, 'fabric'),
    ),
  );
  sphere(ball, [0.075, 0.012, 0.075], [0, 0.339, 0], colors.oat);
  ball.rotation.z = 0.3;
  const shadow = contactShadow(root, 1.1, 1.1, 0, 0, 0.3);
  return {
    root,
    parts: { ball, shadow },
    obstacles: [],
    reset: () => {
      ball.position.set(0, 0.34, 0);
      shadow.position.set(0, 0.016, 0);
    },
  };
}

export function buildMusic(): ToyModel {
  const root = group(),
    parts: ToyModel['parts'] = {};
  const base = group(root);
  base.rotation.y = -0.12;
  box(base, [1.35, 0.22, 0.82], [0, 0.19, 0], material(colors.wood, 'wood'), 0.09);
  const palette = [
    colors.coral,
    colors.peach,
    colors.yellow,
    colors.sage,
    colors.sky,
    colors.blue,
    colors.lilac,
  ];
  palette.forEach((color, i) => {
    const bar = box(
      base,
      [0.144, 0.085, 0.79 - i * 0.065],
      [-0.54 + i * 0.18, 0.35, 0],
      material(color, 'wood'),
      0.025,
    );
    for (const z of [-1, 1]) sphere(bar, 0.019, [0, 0.05, z * (0.285 - i * 0.023)], colors.wood);
    parts['bar' + i] = bar;
  });
  for (const side of [-1, 1]) {
    const mallet = group(root, [side * 0.26, 0.075, 0.64]);
    mallet.rotation.y = side * 0.3;
    rod(mallet, [0, 0, -0.15], [0, 0, 0.19], 0.025, colors.wood);
    sphere(mallet, 0.071, [0, 0, -0.2], side < 0 ? colors.coral : colors.yellow);
    parts[side < 0 ? 'malletLeft' : 'malletRight'] = mallet;
  }
  // Tambourine and little hand drum.
  const tambourine = cylinder(
    root,
    0.24,
    0.24,
    0.12,
    [-0.98, 0.1, -0.16],
    material(colors.oat, 'wood'),
  );
  cylinder(tambourine, 0.215, 0.215, 0.01, [0, 0.065, 0], colors.milk);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    sphere(
      root,
      [0.047, 0.025, 0.047],
      [-0.98 + Math.cos(a) * 0.235, 0.1, -0.16 + Math.sin(a) * 0.235],
      colors.yellow,
    );
  }
  contactShadow(root, 2.4, 1.8, -0.12, 0, 0.2);
  return {
    root,
    parts,
    obstacles: [{ x: -0.17, z: 0, halfX: 0.99, halfZ: 0.4 }],
    reset() {
      parts.malletLeft.visible = parts.malletRight.visible = true;
      for (let i = 0; i < 7; i++) parts['bar' + i].position.y = 0.35;
    },
  };
}

function teaCup(parent: THREE.Object3D, x: number, z: number, color: string) {
  cylinder(parent, 0.17, 0.17, 0.025, [x, 0.68, z], colors.milk);
  cylinder(parent, 0.095, 0.067, 0.13, [x, 0.76, z], color);
  cylinder(parent, 0.078, 0.078, 0.006, [x, 0.828, z], '#a78257');
  torus(parent, 0.046, 0.018, [x + 0.103, 0.765, z], color);
}

export function buildTea(): ToyModel {
  const root = group(),
    pot = group(root, [0.1, 0.69, -0.1]);
  cylinder(root, 1.08, 1.08, 0.025, [0, 0.02, 0], material('#d7bba0', 'fabric'), 64);
  for (const x of [-0.38, 0.38])
    for (const z of [-0.3, 0.3])
      rod(root, [x * 1.1, 0.04, z * 1.1], [x, 0.65, z], 0.04, colors.wood);
  cylinder(root, 0.68, 0.68, 0.11, [0, 0.61, 0], material('#e2c8a0', 'wood'), 64);
  sphere(pot, [0.18, 0.17, 0.16], [0, 0.16, 0], colors.sage);
  cylinder(pot, 0.115, 0.14, 0.05, [0, 0.31, 0], colors.sage);
  sphere(pot, 0.037, [0, 0.355, 0], colors.wood);
  torus(pot, 0.105, 0.025, [-0.18, 0.18, 0], colors.sage);
  const spout = cylinder(pot, 0.042, 0.07, 0.23, [0.21, 0.2, 0], colors.sage);
  spout.rotation.z = -0.9;
  teaCup(root, 0.38, 0.23, colors.coral);
  teaCup(root, -0.34, -0.04, colors.sky);
  cylinder(root, 0.19, 0.19, 0.02, [-0.17, 0.68, 0.36], colors.milk);
  for (let i = 0; i < 3; i++) {
    cylinder(
      root,
      0.068,
      0.071,
      0.027,
      [-0.27 + i * 0.095, 0.72, 0.36 + (i % 2) * 0.035],
      colors.yellow,
      16,
    );
  }
  // A teddy is always invited to tea.
  const bear = group(root, [-0.18, 0.08, -0.98]);
  sphere(bear, [0.24, 0.28, 0.21], [0, 0.25, 0], material('#c5a075', 'fabric'));
  sphere(bear, 0.23, [0, 0.65, 0], material('#c5a075', 'fabric'));
  for (const side of [-1, 1]) {
    sphere(bear, 0.095, [side * 0.18, 0.83, 0], '#c5a075');
    sphere(bear, [0.055, 0.055, 0.018], [side * 0.18, 0.83, 0.08], colors.oat);
    sphere(bear, [0.13, 0.13, 0.18], [side * 0.17, 0.12, 0.15], '#c5a075');
    sphere(bear, [0.1, 0.19, 0.1], [side * 0.26, 0.34, 0.05], '#c5a075').rotation.z = side * 0.4;
    sphere(bear, 0.022, [side * 0.08, 0.69, 0.206], colors.ink);
  }
  sphere(bear, [0.1, 0.065, 0.056], [0, 0.59, 0.208], colors.oat);
  sphere(bear, 0.027, [0, 0.625, 0.256], colors.ink);
  box(bear, [0.28, 0.12, 0.08], [0, 0.45, 0.17], colors.coral);
  contactShadow(root, 2.9, 2.9, 0, -0.13, 0.2);
  const home = pot.position.clone();
  return {
    root,
    parts: { pot, bear },
    obstacles: [{ x: 0, z: -0.15, halfX: 0.7, halfZ: 0.8 }],
    reset: () => {
      pot.position.copy(home);
      pot.rotation.set(0, 0, 0);
    },
  };
}

export function buildRainbow(): ToyModel {
  const root = group();
  const tunnel = group(root, [0, 0.03, 0]);
  tunnel.name = 'tunnel';
  const palette = [colors.coral, colors.yellow, colors.sage];
  for (const z of [-0.47, 0.47]) {
    const shape = new THREE.Shape();
    shape.absarc(0, 0, 1.18, 0, Math.PI, false);
    shape.lineTo(-1.0, 0);
    shape.absarc(0, 0, 1.0, Math.PI, 0, true);
    shape.closePath();
    const frame = mesh(
      tunnel,
      new THREE.ExtrudeGeometry(shape, {
        depth: 0.1,
        bevelEnabled: true,
        bevelThickness: 0.025,
        bevelSize: 0.025,
        bevelSegments: 4,
        curveSegments: 48,
      }),
      material(colors.wood, 'wood'),
      [0, 0, z],
    );
    frame.name = 'frame';
  }
  for (let i = 0; i <= 10; i++) {
    const a = (i / 10) * Math.PI;
    rod(
      tunnel,
      [Math.cos(a) * 1.095, Math.sin(a) * 1.095, -0.48],
      [Math.cos(a) * 1.095, Math.sin(a) * 1.095, 0.57],
      0.052,
      material(palette[i % 3], 'wood'),
    );
  }
  // A small stacking rainbow sits next to the climbing arch.
  for (let i = 0; i < 4; i++)
    torus(
      root,
      0.4 - i * 0.082,
      0.04,
      [1.52, 0.04, 0],
      [colors.coral, colors.yellow, colors.sage, colors.sky][i],
      Math.PI,
    );
  contactShadow(root, 3.05, 2, 0, 0, 0.2);
  return { root, parts: {}, obstacles: [{ x: 0, z: 0.02, halfX: 1.22, halfZ: 0.6 }] };
}
