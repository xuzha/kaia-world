import * as THREE from 'three';
import { arch, box, contactShadow, cylinder, group, mesh } from '../world/primitives';
import { colors, labelTexture, material } from '../world/palette';
import type { ToyModel } from './types';

export function buildBlocks(): ToyModel {
  const root = group(),
    parts: ToyModel['parts'] = {};
  const cubes = [
    [-0.24, 0.16, 0, colors.coral],
    [0.1, 0.16, 0, colors.sky],
    [-0.07, 0.48, 0, colors.yellow],
    [-0.55, 0.13, 0.42, colors.sage],
    [0.32, 0.13, 0.5, colors.peach],
    [0.51, 0.14, -0.3, colors.sky],
  ] as const;
  cubes.forEach(([x, y, z, color], i) => {
    const block = box(root, [0.3, 0.3, 0.3], [x, y, z], material(color, 'wood'), 0.035);
    block.rotation.y = i > 2 ? i * 0.7 : 0;
    if (i < 3)
      mesh(
        block,
        new THREE.PlaneGeometry(0.23, 0.23),
        new THREE.MeshStandardMaterial({
          map: labelTexture(['A', 'B', 'C'][i], color, colors.milk),
        }),
        [0, 0, 0.152],
      );
    if (i === 4) parts.block = block;
  });
  const roof = cylinder(root, 0, 0.27, 0.26, [-0.56, 0.22, -0.84], colors.sage, 4);
  roof.rotation.y = Math.PI / 4;
  arch(root, 0.55, 0.42, 0.25, [-0.68, 0.01, -0.43], colors.peach).rotation.y = -0.2;
  cylinder(root, 0.12, 0.12, 0.27, [0.5, 0.16, -0.59], material(colors.yellow, 'wood'));
  // A little tray keeps the scatter intentional.
  box(root, [1.0, 0.06, 0.7], [-0.23, 0.05, -0.89], material(colors.wood, 'wood'), 0.04);
  for (const x of [-0.73, 0.27]) box(root, [0.06, 0.15, 0.75], [x, 0.1, -0.89], colors.wood);
  for (const z of [-1.25, -0.53]) box(root, [1.0, 0.15, 0.055], [-0.23, 0.1, z], colors.wood);
  contactShadow(root, 2, 2, 0, -0.15, 0.18);
  const home = parts.block.position.clone();
  return {
    root,
    parts,
    obstacles: [{ x: -0.15, z: -0.36, halfX: 0.67, halfZ: 0.77 }],
    reset: () => {
      parts.block.position.copy(home);
      parts.block.rotation.set(0, 2.8, 0);
    },
  };
}
