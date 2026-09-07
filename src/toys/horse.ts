import {
  box,
  contactShadow,
  curve,
  cylinder,
  group,
  rod,
  sphere,
  torus,
} from '../world/primitives';
import { colors, material } from '../world/palette';
import type { ToyModel } from './types';

export function buildHorse(): ToyModel {
  const root = group(),
    horse = group(root, [0, 0.15, 0]);
  const wood = material('#c39a69', 'wood');
  for (const x of [-0.37, 0.37]) {
    curve(
      horse,
      [
        [x, 0.26, -0.85],
        [x, 0.035, -0.48],
        [x, 0, 0],
        [x, 0.035, 0.48],
        [x, 0.26, 0.85],
      ],
      0.075,
      wood,
    );
    for (const z of [-0.39, 0.36]) rod(horse, [x, 0.07, z], [x * 0.6, 0.62, z * 0.85], 0.06, wood);
  }
  sphere(horse, [0.31, 0.35, 0.66], [0, 0.64, 0], wood);
  sphere(horse, [0.2, 0.51, 0.24], [0, 1.05, 0.43], wood).rotation.x = 0.3;
  sphere(horse, [0.23, 0.25, 0.36], [0, 1.43, 0.54], wood);
  sphere(horse, [0.225, 0.16, 0.21], [0, 1.33, 0.8], colors.oat);
  for (const side of [-1, 1]) {
    sphere(horse, [0.065, 0.18, 0.09], [side * 0.13, 1.7, 0.44], wood).rotation.z = side * -0.18;
    sphere(horse, 0.032, [side * 0.214, 1.46, 0.61], colors.ink);
    sphere(horse, 0.013, [side * 0.229, 1.475, 0.622], colors.milk);
    sphere(horse, [0.011, 0.022, 0.022], [side * 0.207, 1.37, 0.88], '#9b7853');
  }
  for (let i = 0; i < 6; i++)
    sphere(horse, [0.09, 0.13, 0.14], [0, 0.94 + i * 0.12, 0.12 + i * 0.043], colors.cream);
  rod(horse, [-0.45, 1.19, 0.42], [0.45, 1.19, 0.42], 0.039, colors.moss);
  for (const x of [-0.47, 0.47]) sphere(horse, 0.06, [x, 1.19, 0.42], colors.sage);
  box(horse, [0.52, 0.14, 0.62], [0, 0.98, -0.1], material(colors.sage, 'fabric'), 0.065);
  for (const x of [-0.29, 0.29]) {
    box(horse, [0.045, 0.35, 0.41], [x, 0.75, -0.1], material(colors.sage, 'fabric'));
    sphere(horse, [0.025, 0.067, 0.067], [x * 1.05, 0.75, -0.1], colors.yellow);
    torus(horse, 0.1, 0.018, [x * 1.3, 0.51, -0.1], colors.wood).rotation.y = Math.PI / 2;
  }
  for (let i = 0; i < 3; i++)
    curve(
      horse,
      [
        [(i - 1) * 0.055, 0.87, -0.53],
        [(i - 1) * 0.065, 0.81, -0.8],
        [(i - 1) * 0.07, 0.51, -0.83],
      ],
      0.035,
      colors.cream,
    );
  cylinder(horse, 0.08, 0.08, 0.82, [0, 0.25, 0], wood).rotation.z = Math.PI / 2;
  contactShadow(root, 1.8, 2.7, 0, 0, 0.28);
  return {
    root,
    parts: { horse },
    obstacles: [{ x: 0, z: 0, halfX: 0.49, halfZ: 0.85 }],
    reset: () => {
      horse.rotation.x = 0;
    },
  };
}
