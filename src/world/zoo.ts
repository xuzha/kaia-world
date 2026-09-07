import * as THREE from 'three';
import { box, curve, cylinder, group, mesh, rod, sphere } from './primitives';
import { canvasTexture, colors, labelTexture, material, seeded } from './palette';
import { FLOOR_Y } from './room';
import { disposeStory } from './story-resources';
import { createZooPets } from './zoo-pets';
import { createZooParrots } from './zoo-parrots';
import { createCrocodilePond } from './zoo-pond';

function giraffe(parent: THREE.Group, x: number, z: number, scale: number) {
  const root = group(parent, [x, FLOOR_Y, z]);
  root.name = 'zoo-giraffe';
  root.scale.setScalar(scale);
  root.rotation.y = 0.3;
  const gold = '#dfbc77',
    spots = '#b78d57';
  sphere(root, [0.78, 0.55, 0.43], [0, 1.43, 0], gold);
  for (const x of [-0.48, 0.48])
    for (const z of [-0.26, 0.26]) {
      cylinder(root, 0.09, 0.075, 1.18, [x, 0.67, z], gold, 12);
      sphere(root, [0.13, 0.1, 0.14], [x, 0.1, z + 0.035], spots);
    }
  const neck = sphere(root, [0.21, 1.25, 0.23], [0.46, 2.72, 0], gold);
  neck.rotation.z = -0.1;
  for (let i = 0; i < 5; i++)
    sphere(root, [0.11, 0.13, 0.025], [0.38 + i * 0.024, 1.86 + i * 0.4, 0.223], spots);
  for (const [x, y] of [
    [-0.4, 1.44],
    [-0.1, 1.7],
    [0.26, 1.4],
    [-0.34, 1.15],
  ])
    sphere(root, [0.13, 0.12, 0.025], [x, y, 0.413], spots);
  const head = group(root, [0.62, 3.86, 0]);
  sphere(head, [0.34, 0.25, 0.3], [0, 0.04, 0.11], gold);
  sphere(head, [0.25, 0.16, 0.25], [0.12, -0.08, 0.33], '#ecce98');
  for (const side of [-1, 1]) {
    sphere(head, [0.15, 0.09, 0.09], [side * 0.33, 0.19, 0.03], gold).rotation.z = side * 0.4;
    rod(head, [side * 0.12, 0.21, 0], [side * 0.14, 0.47, 0], 0.035, gold);
    sphere(head, 0.066, [side * 0.14, 0.47, 0], spots);
    sphere(head, 0.03, [side * 0.22, 0.09, 0.32], colors.ink);
  }
  curve(
    root,
    [
      [-0.72, 1.47, -0.03],
      [-1, 1.22, -0.07],
      [-0.92, 0.86, -0.07],
    ],
    0.034,
    gold,
  );
  sphere(root, [0.055, 0.1, 0.055], [-0.92, 0.85, -0.07], spots);
  return head;
}

function elephant(parent: THREE.Group) {
  const root = group(parent, [-10.2, FLOOR_Y, 0.6]);
  root.name = 'zoo-elephant';
  root.rotation.y = 0.4;
  const skin = '#abb8bd';
  sphere(root, [1.05, 0.79, 0.73], [0, 1.15, -0.17], skin);
  for (const x of [-0.62, 0.62])
    for (const z of [-0.58, 0.29]) {
      cylinder(root, 0.23, 0.26, 0.86, [x, 0.48, z], skin, 20);
      for (let i = 0; i < 3; i++)
        sphere(root, [0.06, 0.07, 0.034], [x - 0.11 + i * 0.11, 0.12, z + 0.245], '#d5d9d6');
    }
  const head = group(root, [0, 1.55, 0.62]);
  sphere(head, [0.57, 0.64, 0.49], [0, 0, 0], skin);
  const ears: THREE.Group[] = [];
  for (const side of [-1, 1]) {
    const ear = group(head, [side * 0.32, 0.04, -0.06]);
    sphere(ear, [0.46, 0.6, 0.12], [side * 0.25, 0, 0], skin).rotation.z = side * 0.12;
    sphere(ear, [0.31, 0.43, 0.03], [side * 0.28, 0, 0.125], '#c8b6b2');
    ears.push(ear);
    sphere(head, 0.042, [side * 0.28, 0.06, 0.433], colors.ink);
  }
  const trunk = group(head, [0, -0.1, 0.42]);
  curve(
    trunk,
    [
      [0, 0, 0],
      [0, -0.52, 0.18],
      [0.11, -1.02, 0.33],
      [0.37, -1.05, 0.48],
      [0.5, -0.84, 0.49],
    ],
    0.15,
    skin,
  );
  sphere(trunk, 0.15, [0.5, -0.84, 0.49], skin);
  curve(
    root,
    [
      [0.6, 1.28, -0.7],
      [0.69, 0.91, -1.06],
      [0.6, 0.66, -1.1],
    ],
    0.04,
    skin,
  );
  return { trunk, ears, head };
}

function lion(parent: THREE.Group) {
  const root = group(parent, [9.2, FLOOR_Y, 1.4]);
  root.name = 'zoo-lion';
  root.rotation.y = -0.55;
  const fur = '#dbb071';
  sphere(root, [0.7, 0.53, 0.83], [0, 0.95, -0.2], fur);
  for (const x of [-0.42, 0.42])
    for (const z of [-0.66, 0.27]) {
      cylinder(root, 0.14, 0.17, 0.58, [x, 0.38, z], fur, 16);
      sphere(root, [0.22, 0.13, 0.28], [x, 0.15, z + 0.08], fur);
    }
  const head = group(root, [0, 1.4, 0.43]);
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI * 2) / 12;
    sphere(head, [0.27, 0.29, 0.25], [Math.cos(a) * 0.48, Math.sin(a) * 0.48, -0.06], '#b58056');
  }
  sphere(head, [0.47, 0.48, 0.33], [0, 0, 0.09], fur);
  for (const side of [-1, 1]) {
    sphere(head, [0.12, 0.13, 0.07], [side * 0.34, 0.36, 0.17], fur);
    sphere(head, 0.036, [side * 0.18, 0.07, 0.404], colors.ink);
    sphere(head, [0.16, 0.11, 0.1], [side * 0.1, -0.14, 0.36], '#f0d4a7');
  }
  sphere(head, [0.075, 0.048, 0.05], [0, -0.07, 0.46], colors.ink);
  const tail = group(root, [0, 1, -0.94]);
  curve(
    tail,
    [
      [0, 0, 0],
      [0.56, 0.06, -0.18],
      [0.88, 0.45, -0.22],
    ],
    0.04,
    fur,
  );
  sphere(tail, [0.1, 0.14, 0.1], [0.88, 0.45, -0.22], '#b58056');
  return { head, tail };
}

function tree(parent: THREE.Group, x: number, z: number, height: number) {
  const root = group(parent, [x, FLOOR_Y, z]);
  root.name = 'zoo-tree';
  cylinder(root, 0.16, 0.24, height * 0.72, [0, height * 0.36, 0], material('#bc9c74', 'wood'));
  rod(root, [0, height * 0.45, 0], [-0.6, height * 0.72, 0.2], 0.095, '#bc9c74');
  for (const [dx, dy, dz, scale] of [
    [-0.65, 0.73, 0.05, 0.85],
    [0.5, 0.82, 0.02, 0.93],
    [-0.07, 1, -0.08, 1],
  ])
    sphere(
      root,
      [height * 0.34 * scale, height * 0.26 * scale, height * 0.3 * scale],
      [dx, height * dy, dz],
      dy === 1 ? '#9eb688' : '#8fa87d',
    );
}

export function createZoo() {
  const root = group();
  root.name = 'imagination-zoo';
  root.visible = false;
  const grassMap = canvasTexture(1024, (ctx, s) => {
    const rng = seeded(608);
    ctx.fillStyle = '#b9cda0';
    ctx.fillRect(0, 0, s, s);
    ctx.strokeStyle = '#e2d5af';
    ctx.lineWidth = 17;
    ctx.beginPath();
    ctx.ellipse(s / 2, s / 2, (s * 10.4) / 60, (s * 8.4) / 60, 0, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 2100; i++) {
      const x = rng() * s,
        y = rng() * s;
      ctx.strokeStyle = i % 2 ? '#93ac7a45' : '#dde5bd66';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x - 1, y + 2);
      ctx.lineTo(x, y - 2);
      ctx.lineTo(x + 2, y + 1);
      ctx.stroke();
    }
  });
  const grassMaterial = new THREE.MeshStandardMaterial({ map: grassMap, roughness: 1 });
  const floor = mesh(root, new THREE.CircleGeometry(30, 96), grassMaterial, [0, FLOOR_Y, 0]);
  floor.name = 'zoo-floor';
  floor.rotation.x = -Math.PI / 2;
  floor.castShadow = false;

  const animals = group(root);
  animals.name = 'zoo-animals';
  const tallHead = giraffe(animals, -5.9, -7.8, 1.05);
  const littleHead = giraffe(animals, -3.1, -8.1, 0.64);
  const littleElephant = elephant(animals);
  const littleLion = lion(animals);
  const pets = createZooPets(animals);
  const crocodilePond = createCrocodilePond(root);
  for (const [x, z, height] of [
    [-10.2, -6.4, 4.3],
    [1.3, -11.4, 4.6],
    [9.4, -9.3, 4.2],
  ])
    tree(root, x, z, height);
  const planter = group(root, [-6.65, FLOOR_Y, 4.85]);
  cylinder(planter, 0.34, 0.26, 0.4, [0, 0.2, 0], colors.oat);
  for (const x of [-0.16, 0, 0.16]) sphere(planter, [0.22, 0.28, 0.26], [x, 0.6, 0], colors.sage);
  for (let i = 0; i < 12; i++) {
    const x = -8.3 + i * 1.53;
    rod(root, [x, FLOOR_Y, -6.62], [x, 1.09, -6.62], 0.065, colors.wood);
    sphere(root, 0.09, [x, 1.12, -6.62], colors.oat);
  }
  for (const y of [0.52, 0.91]) rod(root, [-8.3, y, -6.62], [8.53, y, -6.62], 0.047, colors.oat);
  const gate = group(root, [0.7, FLOOR_Y, -5.42]);
  gate.name = 'zoo-gate';
  for (const x of [-1.85, 1.85]) {
    cylinder(gate, 0.09, 0.11, 2.7, [x, 1.35, 0], colors.wood);
    sphere(gate, 0.15, [x, 2.73, 0], colors.coral);
  }
  const perchPoints = [
    [-1.85, 2.64, 0],
    [-0.95, 2.99, 0],
    [0, 3.1, 0],
    [0.95, 2.99, 0],
    [1.85, 2.64, 0],
  ];
  const perch = curve(gate, perchPoints, 0.12, colors.wood);
  perch.name = 'parrot-perch';
  const parrots = createZooParrots(
    gate,
    new THREE.CatmullRomCurve3(perchPoints.map((p) => new THREE.Vector3(...p))),
  );
  box(gate, [2.1, 0.52, 0.12], [0, 2.58, 0.02], '#8fa47f', 0.13);
  const signMap = labelTexture('KAIA ZOO', '#8fa47f', '#fff4d8');
  const signMaterial = new THREE.MeshStandardMaterial({ map: signMap });
  mesh(gate, new THREE.PlaneGeometry(1.9, 0.4), signMaterial, [0, 2.58, 0.09]);

  // Garden furniture uses the room's existing obstacle footprints.
  const bench = group(root, [-4.35, FLOOR_Y, -5.13]);
  box(bench, [3.55, 0.19, 0.8], [0, 0.65, 0], material(colors.wood, 'wood'), 0.06);
  for (const x of [-1.25, 1.25]) box(bench, [0.16, 0.55, 0.6], [x, 0.3, 0], colors.wood, 0.025);
  const basket = group(root, [6.33, FLOOR_Y, -1.35]);
  cylinder(basket, 0.48, 0.35, 0.57, [0, 0.285, 0], material(colors.oat, 'fabric'));
  for (let i = 0; i < 4; i++) {
    const carrot = group(basket, [-0.2 + i * 0.13, 0.57, 0]);
    cylinder(carrot, 0.09, 0.03, 0.35, [0, 0, 0], colors.peach, 12).rotation.z = -0.2;
    for (const side of [-1, 1])
      sphere(carrot, [0.035, 0.15, 0.02], [side * 0.04, 0.26, 0], colors.sage).rotation.z =
        side * 0.3;
  }
  const crate = group(root, [6.5, FLOOR_Y, -4.9]);
  box(crate, [0.86, 0.74, 0.86], [0, 0.37, 0], material(colors.wood, 'wood'), 0.06);
  for (const y of [0.18, 0.48]) box(crate, [0.88, 0.035, 0.88], [0, y, 0], colors.oat, 0.01);
  const pond = group(root, [11.7, FLOOR_Y + 0.007, 4.4]);
  pond.name = 'zoo-pond';
  sphere(pond, [2.35, 0.06, 1.7], [0, 0, 0], '#dfd3b5');
  sphere(pond, [2.1, 0.065, 1.45], [0, 0.02, 0], '#91bbb1');
  const ducks: THREE.Group[] = [];
  for (const x of [-0.5, 0.5]) {
    const duck = group(pond, [x, 0.14, x * 0.6]);
    ducks.push(duck);
    sphere(duck, [0.25, 0.18, 0.32], [0, 0.1, 0], '#f7e7b0');
    sphere(duck, 0.16, [0, 0.33, 0.2], '#f7e7b0');
    sphere(duck, [0.095, 0.04, 0.12], [0, 0.29, 0.36], colors.peach);
    for (const side of [-1, 1]) sphere(duck, 0.015, [side * 0.095, 0.35, 0.32], colors.ink);
  }
  const rng = seeded(937);
  for (let i = 0; i < 22; i++) {
    const a = rng() * Math.PI * 2;
    const x = Math.cos(a) * (12.5 + rng() * 2.5),
      z = Math.sin(a) * (9 + rng() * 2);
    if (crocodilePond.contains(x, z)) continue;
    const bush = group(root, [x, FLOOR_Y, z]);
    bush.name = 'zoo-bush';
    sphere(bush, [0.35, 0.32, 0.3], [0, 0.26, 0], i % 2 ? '#9bb488' : '#a6be94');
    if (i % 2) {
      sphere(bush, 0.07, [0, 0.58, 0], colors.yellow);
      for (let j = 0; j < 5; j++) {
        const a = (j * Math.PI * 2) / 5;
        sphere(
          bush,
          [0.07, 0.035, 0.07],
          [Math.cos(a) * 0.1, 0.58, Math.sin(a) * 0.1],
          colors.milk,
        );
      }
    }
  }
  // Short, staggered gestures give the larger animals a rest between activities.
  const gesture = (time: number, period: number, duration: number, offset: number) => {
    const elapsed = (time + offset) % period;
    return elapsed < duration ? Math.sin((elapsed / duration) * Math.PI) ** 2 : 0;
  };
  return {
    root,
    floor,
    animals,
    update(time: number) {
      if (!root.visible) return;
      const tallLook = gesture(time, 12, 4.5, 1),
        littleLook = gesture(time, 9, 3.5, 4),
        flap = gesture(time, 11, 4, 2),
        lionLook = gesture(time, 13, 5, 7);
      tallHead.rotation.set(tallLook * 0.2, tallLook * 0.45, 0);
      littleHead.rotation.set(littleLook * 0.24, -littleLook * 0.35, littleLook * 0.08);
      littleElephant.trunk.rotation.set(-flap * 0.33, 0, Math.sin(time * 2.3) * flap * 0.32);
      littleElephant.head.rotation.z = Math.sin(time * 1.1) * flap * 0.045;
      littleElephant.ears.forEach((ear, i) => {
        ear.rotation.y = (i ? 1 : -1) * Math.sin(time * 3) * flap * 0.42;
      });
      littleLion.head.rotation.set(
        lionLook * 0.15,
        Math.sin(time * 0.8) * lionLook * 0.32,
        lionLook * 0.08,
      );
      littleLion.tail.rotation.z = Math.sin(time * 3.3) * lionLook * 0.6;
      pets.update(time);
      parrots.update(time);
      crocodilePond.update(time);
      ducks.forEach((duck, i) => {
        const a = time * 0.24 + i * Math.PI;
        duck.position.set((i ? 0.7 : -0.7) + Math.cos(a) * 0.26, 0.14, Math.sin(a) * 0.45);
        duck.rotation.y = Math.atan2(-Math.sin(a) * 0.26, Math.cos(a) * 0.45);
      });
    },
    dispose() {
      disposeStory(
        root,
        [grassMaterial, signMaterial, ...crocodilePond.materials],
        [grassMap, signMap],
      );
    },
  };
}
