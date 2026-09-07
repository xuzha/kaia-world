import * as THREE from 'three';
import {
  arch,
  box,
  contactShadow,
  cylinder,
  group,
  mesh,
  rod,
  sphere,
  torus,
} from '../world/primitives';
import { colors, material } from '../world/palette';
import type { ToyModel } from './types';

export const castleDeckHeight = 1.52;
export const slideCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0.74, castleDeckHeight, 0.65),
  new THREE.Vector3(0.74, 1.35, 1.05),
  new THREE.Vector3(0.74, 0.51, 1.76),
  new THREE.Vector3(0.74, 0.17, 2.25),
  new THREE.Vector3(0.74, 0.16, 2.53),
]);
const slidePoints = slideCurve.getPoints(40);

/** The same piecewise surface used by the slide mesh, including its entry and landing. */
export function slideHeightAt(z: number) {
  if (z <= slidePoints[0].z) return castleDeckHeight;
  for (let i = 1; i < slidePoints.length; i++) {
    const a = slidePoints[i - 1],
      b = slidePoints[i];
    if (z <= b.z) return THREE.MathUtils.lerp(a.y, b.y, (z - a.z) / (b.z - a.z));
  }
  return 0;
}

export function buildCastle(): ToyModel {
  const root = group(),
    parts: ToyModel['parts'] = {};
  const wood = material('#d5b386', 'wood');
  for (const [x, color] of [
    [-0.74, colors.sage],
    [0.74, colors.peach],
  ] as const) {
    const tower = group(root, [x, 0, -0.05]);
    box(tower, [1.36, 0.16, 1.45], [0, 0.1, 0], wood);
    for (const a of [-0.58, 0.58])
      for (const b of [-0.58, 0.58]) {
        box(tower, [0.115, 3.11, 0.115], [a, 1.605, b], wood).name = 'castle-post';
      }
    box(tower, [1.32, 0.14, 1.4], [0, castleDeckHeight - 0.07, 0], wood, 0.025).name =
      'castle-platform';
    // The inner sides open onto the bridge; a full panel here cuts across the walking route.
    const outerSide = Math.sign(x);
    box(tower, [0.12, 0.66, 1.29], [outerSide * 0.62, 1.84, 0], material(color, 'wood')).name =
      'castle-wall';
    box(tower, [1.24, 0.67, 0.1], [0, 1.84, -0.62], material(color, 'wood')).name = 'castle-wall';
    for (let i = 0; i < 3; i++) {
      box(tower, [0.22, 0.25, 0.13], [-0.5 + i * 0.5, 2.3, -0.62], color, 0.035);
      box(tower, [0.15, 0.25, 0.22], [outerSide * 0.62, 2.3, -0.5 + i * 0.5], color, 0.035);
    }
    const roof = cylinder(
      tower,
      0.035,
      0.91,
      0.92,
      [0, 3.62, 0],
      material(x < 0 ? colors.moss : colors.coral, 'fabric'),
      4,
    );
    roof.name = 'castle-roof';
    roof.rotation.y = Math.PI / 4;
    sphere(tower, 0.07, [0, 4.12, 0], colors.wood);
    rod(tower, [0, 4.09, 0], [0, 4.5, 0], 0.021, colors.wood);
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(0.42, -0.1);
    shape.lineTo(0, -0.23);
    shape.closePath();
    parts[x < 0 ? 'flagLeft' : 'flagRight'] = mesh(
      tower,
      new THREE.ShapeGeometry(shape),
      new THREE.MeshStandardMaterial({
        color: x < 0 ? colors.yellow : colors.milk,
        side: THREE.DoubleSide,
      }),
      [0, 4.47, 0],
    );
    // Rounded lower doors and peepholes; the inside remains open for the climb.
    arch(tower, 0.54, 0.74, 0.015, [0, 0.17, -0.585], '#ae9574');
    torus(tower, 0.14, 0.025, [0, 1.87, -0.555], colors.milk);
  }
  box(root, [0.16, 0.14, 1.11], [0, castleDeckHeight - 0.07, -0.05], wood, 0.02).name =
    'castle-platform';
  rod(root, [-0.16, 2.04, -0.63], [0.16, 2.04, -0.63], 0.04, wood).name = 'castle-guard';
  rod(root, [-0.16, 2.04, 0.53], [0.16, 2.04, 0.53], 0.04, wood).name = 'castle-guard';
  for (const x of [-0.74 - 0.36, -0.74 + 0.36])
    rod(root, [x, 0.12, 1.27], [x, castleDeckHeight - 0.02, 0.69], 0.052, wood);
  for (let i = 0; i < 6; i++) {
    const t = i / 5;
    rod(
      root,
      [-1.1, 0.14 + t * 1.29, 1.26 - t * 0.56],
      [-0.38, 0.14 + t * 1.29, 1.26 - t * 0.56],
      0.048,
      colors.cream,
    );
  }
  // A smooth curved slide made from a continuous surface, with raised rails.
  const slidePath = slideCurve;
  const positions: number[] = [],
    indices: number[] = [];
  for (let i = 0; i <= 40; i++) {
    const p = slidePoints[i];
    positions.push(p.x - 0.39, p.y, p.z, p.x + 0.39, p.y, p.z);
    if (i < 40) {
      const a = i * 2;
      indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  mesh(
    root,
    geometry,
    new THREE.MeshStandardMaterial({ color: '#dcb979', roughness: 0.48, side: THREE.DoubleSide }),
  ).name = 'slide-surface';
  for (const x of [-0.4, 0.4]) {
    const path = new THREE.CatmullRomCurve3(
      slidePath.getPoints(32).map((p) => p.add(new THREE.Vector3(x, 0.075, 0))),
    );
    mesh(root, new THREE.TubeGeometry(path, 40, 0.065, 8, false), colors.coral).name = 'slide-rail';
  }
  for (const z of [0.9, 1.7])
    rod(root, [0.74, 0.08, z], [0.74, slideHeightAt(z + 0.05), z], 0.05, wood);
  contactShadow(root, 3.9, 4, 0, 0.55, 0.38);
  return {
    root,
    parts,
    obstacles: [
      { x: -0.74, z: -0.05, halfX: 0.72, halfZ: 0.75 },
      { x: 0.74, z: 0.94, halfX: 0.72, halfZ: 1.71 },
      { x: -0.74, z: 0.72, halfX: 0.4, halfZ: 0.57 },
    ],
    update(time) {
      parts.flagLeft.rotation.y = Math.sin(time * 1.8) * 0.1;
      parts.flagRight.rotation.y = Math.sin(time * 1.8 + 1) * 0.12;
    },
  };
}
