import * as THREE from 'three';
import { book, box, contactShadow, group, mesh, sphere } from '../world/primitives';
import { canvasTexture, colors, material } from '../world/palette';
import type { ToyModel } from './types';

export const bookRestPosition = new THREE.Vector3(0.15, 0.055, 1.4);

export function openBook() {
  const root = group();
  for (const side of [-1, 1]) {
    const half = group(root, [side * 0.13, 0, 0]);
    half.rotation.z = side * 0.08;
    box(half, [0.27, 0.035, 0.35], [0, 0, 0], colors.coral, 0.008);
    const page = canvasTexture(256, (ctx, s) => {
      ctx.fillStyle = '#fff4d9';
      ctx.fillRect(0, 0, s, s);
      ctx.fillStyle = side < 0 ? '#a4b68a' : '#e4b16b';
      ctx.beginPath();
      ctx.arc(128, 99, 53, 0, Math.PI * 2);
      ctx.fill();
      if (side < 0) {
        ctx.fillStyle = '#866c4e';
        ctx.fillRect(117, 102, 20, 64);
      } else {
        ctx.fillStyle = '#6e604c';
        ctx.beginPath();
        ctx.arc(112, 94, 4, 0, 6.3);
        ctx.arc(144, 94, 4, 0, 6.3);
        ctx.fill();
      }
      ctx.fillStyle = '#c7b798';
      ctx.fillRect(42, 192, 168, 4);
      ctx.fillRect(42, 208, 140, 4);
      ctx.fillRect(42, 224, 158, 4);
    });
    const face = mesh(
      half,
      new THREE.PlaneGeometry(0.246, 0.321),
      new THREE.MeshStandardMaterial({ map: page, side: THREE.DoubleSide }),
      [0, 0.022, 0],
    );
    face.rotation.x = -Math.PI / 2;
  }
  const pivot = group(root);
  const leaf = box(pivot, [0.26, 0.003, 0.32], [0.133, 0.025, 0], colors.milk, 0.001);
  leaf.castShadow = false;
  pivot.name = 'page';
  return root;
}

export function buildBooks(): ToyModel {
  const root = group();
  sphere(root, [0.88, 0.24, 0.76], [0, 0.24, -0.28], material(colors.sage, 'fabric'));
  sphere(root, [0.73, 0.53, 0.29], [0, 0.55, -0.65], material('#b5c3a1', 'fabric')).rotation.x =
    -0.17;
  const pillow = box(
    root,
    [0.58, 0.43, 0.23],
    [-0.36, 0.57, -0.43],
    material(colors.milk, 'fabric'),
    0.12,
  );
  pillow.rotation.z = 0.18;
  const pile = group(root, [-0.94, 0.01, 0.37]);
  pile.rotation.y = -0.3;
  book(pile, [0, 0.05, 0], colors.sky, 0.75, 'MOON').rotation.x = -Math.PI / 2;
  book(pile, [0.08, 0.17, 0.07], colors.yellow, 0.73, 'SUN').rotation.set(-Math.PI / 2, 0, 0.2);
  const opened = openBook();
  root.add(opened);
  opened.position.copy(bookRestPosition);
  opened.rotation.y = -0.2;
  opened.scale.setScalar(1.3);
  // Felt mushroom reading lamp.
  sphere(root, [0.38, 0.21, 0.38], [-1.12, 0.86, -0.77], colors.coral);
  box(root, [0.15, 0.61, 0.15], [-1.12, 0.39, -0.77], colors.oat, 0.065);
  sphere(root, [0.27, 0.07, 0.27], [-1.12, 0.07, -0.77], colors.cream);
  for (const [x, y, z] of [
    [-1.24, 1.04, -0.67],
    [-0.95, 0.98, -0.77],
    [-1.23, 0.96, -1],
  ])
    sphere(root, 0.045, [x, y, z], colors.milk);
  contactShadow(root, 3, 2.7, -0.2, -0.15, 0.29);
  return {
    root,
    parts: { book: opened },
    obstacles: [{ x: -0.16, z: -0.37, halfX: 1.02, halfZ: 0.75 }],
    reset: () => {
      opened.visible = true;
      opened.position.copy(bookRestPosition);
      opened.rotation.set(0, -0.2, 0);
      opened.scale.setScalar(1.3);
    },
  };
}
