import * as THREE from 'three';
import { curve, cylinder, group, rod, sphere } from './primitives';
import { colors } from './palette';
import { FLOOR_Y } from './room';

type PetKind = 'cat' | 'dog' | 'rabbit';

function createPet(parent: THREE.Group, kind: PetKind, coat: string, patch: string) {
  const root = group(parent);
  root.name = `zoo-${kind}`;
  const rabbit = kind === 'rabbit',
    dog = kind === 'dog';
  const body = group(root);
  const hip = rabbit ? 0.2 : 0.38;
  sphere(body, rabbit ? [0.27, 0.28, 0.36] : [0.27, 0.25, 0.43], [0, hip + 0.18, -0.08], coat);
  sphere(body, [0.2, 0.19, 0.14], [0, hip + 0.2, 0.21], patch);
  const legs: THREE.Group[] = [];
  for (const x of [-0.18, 0.18])
    for (const z of [-0.29, 0.23]) {
      const leg = group(body, [x, hip, z]);
      leg.name = 'pet-leg';
      sphere(leg, [0.085, hip * 0.48, 0.095], [0, -hip * 0.43, 0], coat);
      sphere(
        leg,
        [rabbit && z < 0 ? 0.13 : 0.105, 0.07, rabbit ? 0.19 : 0.13],
        [0, 0.07 - hip, 0.045],
        patch,
      );
      legs.push(leg);
    }
  const head = group(body, [0, hip + 0.43, 0.33]);
  head.name = 'pet-head';
  sphere(head, [0.28, 0.26, 0.26], [0, 0, 0], coat);
  for (const side of [-1, 1])
    sphere(head, [0.115, 0.09, dog ? 0.16 : 0.075], [side * 0.073, -0.1, 0.225], patch);
  sphere(head, [0.04, 0.028, 0.03], [0, -0.06, dog ? 0.377 : 0.303], dog ? colors.ink : '#c99493');
  const eyes: THREE.Mesh[] = [];
  const ears: THREE.Group[] = [];
  for (const side of [-1, 1]) {
    const eye = sphere(head, [0.031, 0.041, 0.027], [side * 0.135, 0.04, 0.225], '#45464d');
    eyes.push(eye);
    sphere(head, 0.009, [side * 0.13 - 0.006, 0.054, 0.248], '#fffdf1');
    const ear = group(head, [side * 0.2, 0.16, -0.01]);
    ear.name = 'pet-ear';
    ears.push(ear);
    if (rabbit) {
      sphere(ear, [0.077, 0.28, 0.068], [0, 0.23, 0], coat);
      sphere(ear, [0.037, 0.21, 0.022], [0, 0.25, 0.052], '#dfb5b5');
    } else if (dog) {
      sphere(ear, [0.13, 0.25, 0.09], [side * 0.055, -0.12, 0.025], patch);
    } else {
      cylinder(ear, 0, 0.125, 0.28, [0, 0.1, 0], coat, 3).rotation.y = Math.PI / 3;
      cylinder(ear, 0, 0.072, 0.18, [0, 0.11, 0.045], '#d9adab', 3).rotation.y = Math.PI / 3;
      for (const tilt of [-1, 1])
        rod(
          head,
          [side * 0.16, -0.095, 0.263],
          [side * 0.34, -0.095 + tilt * 0.038, 0.245],
          0.006,
          '#b8a99c',
        );
    }
  }
  if (kind === 'cat') {
    for (const side of [-1, 1])
      sphere(head, [0.04, 0.09, 0.021], [side * 0.078, 0.15, 0.213], patch).rotation.z =
        side * 0.18;
  }
  const tail = group(body, [0, hip + 0.18, -0.42]);
  if (rabbit) sphere(tail, 0.115, [0, 0.035, -0.05], '#fff8e9');
  else
    curve(
      tail,
      [
        [0, 0, 0],
        [0.04, 0.22, -0.18],
        [0.13, dog ? 0.34 : 0.55, -0.24],
        [0.25, dog ? 0.36 : 0.59, -0.2],
      ],
      0.053,
      coat,
    );
  return { root, body, head, legs, tail, ears, eyes };
}

export function createZooPets(parent: THREE.Group) {
  const root = group(parent);
  root.name = 'zoo-pets';
  // Each small loop occupies a separate patch beyond the playground and family entrance.
  const homes: [PetKind, string, string, number, number, number, number, number, number][] = [
    ['cat', '#efe5d2', '#b49b87', 4.55, 7.55, 0.7, 0.24, 4.8, 0.94],
    ['dog', '#c69a72', '#f6e7ce', -1.75, 7.5, 0.8, 0.3, 1.1, 1.02],
    ['rabbit', '#fff5e7', '#f5e0d4', -5.25, 7.25, 0.32, 0.28, 0.6, 0.91],
    ['rabbit', '#d7c9bb', '#f7eddf', 1.45, 7.35, 0.5, 0.2, 2.1, 0.88],
    ['rabbit', '#fff8ef', '#f3e0d7', 6.4, -7.6, 0.32, 0.22, 3.2, 0.96],
    ['rabbit', '#c4c6d0', '#f3e8df', 4.15, -8.4, 0.6, 0.3, 4.7, 0.9],
  ];
  const pets = homes.map(([kind, coat, patch, x, z, rx, rz, offset, scale]) => {
    const rig = createPet(root, kind, coat, patch);
    rig.root.scale.setScalar(scale);
    return { ...rig, kind, x, z, rx, rz, offset };
  });
  const ease = (t: number) => t * t * (3 - 2 * t);

  function update(time: number) {
    for (const pet of pets) {
      const rabbit = pet.kind === 'rabbit';
      const movingTime = rabbit ? 2.4 : 3.8;
      const restingTime = 2.6 + pet.offset * 0.21;
      const cycle = movingTime + restingTime;
      const clock = time + pet.offset;
      const segment = Math.floor(clock / cycle);
      const elapsed = clock % cycle;
      const moving = elapsed < movingTime;
      const travel = Math.min(elapsed / movingTime, 1);
      let distance = ease(travel);
      let hop = 0;
      let stride = 0;
      if (rabbit && moving) {
        // Three distinct jumps: paws rest on the grass between parabolic flights.
        const jump = travel * 3;
        const fraction = jump % 1;
        const flight = THREE.MathUtils.clamp((fraction - 0.18) / 0.7, 0, 1);
        distance = (Math.floor(jump) + ease(flight)) / 3;
        hop = 4 * flight * (1 - flight);
        stride = Math.sin(flight * Math.PI * 2) * hop;
      } else if (moving) {
        stride = Math.sin(travel * Math.PI * 10) * Math.sin(travel * Math.PI);
      }
      const angle = ((segment + distance) * Math.PI) / 2 + pet.offset;
      pet.root.position.set(
        pet.x + Math.cos(angle) * pet.rx,
        FLOOR_Y + hop * 0.37,
        pet.z + Math.sin(angle) * pet.rz,
      );
      pet.root.rotation.y = Math.atan2(-Math.sin(angle) * pet.rx, Math.cos(angle) * pet.rz);
      const look = moving ? 0 : Math.sin(((elapsed - movingTime) / restingTime) * Math.PI) ** 2;
      pet.head.rotation.set(
        look * 0.25 - hop * 0.08,
        Math.sin(clock * 1.5) * look * 0.5,
        Math.sin(clock * 1.7) * look * 0.07,
      );
      // A little foot lift prevents the lower paw from swinging through the ground.
      pet.body.position.y = rabbit ? 0 : Math.abs(stride) * 0.024;
      pet.body.rotation.x = rabbit ? stride * 0.08 : 0;
      pet.legs.forEach((limb, i) => {
        const direction = i === 0 || i === 3 ? 1 : -1;
        limb.rotation.x = rabbit ? (i % 2 ? -1 : 1) * hop * 0.42 : stride * direction * 0.46;
        limb.position.y = (rabbit ? 0.2 : 0.38) + (rabbit ? hop * 0.025 : Math.abs(stride) * 0.035);
      });
      pet.tail.rotation.z =
        Math.sin(clock * (pet.kind === 'dog' ? 8 : 2.3)) * (moving ? 0.3 : look * 0.55);
      pet.ears.forEach((ear, i) => {
        ear.rotation.z = (i ? 1 : -1) * (rabbit ? 0.15 + hop * 0.18 : 0.08);
        ear.rotation.x = rabbit ? -hop * 0.23 + look * Math.sin(clock * 4) * 0.09 : stride * 0.12;
      });
      const blink = clock % 4.7 > 4.52 ? 0.005 : 0.041;
      for (const eye of pet.eyes) eye.scale.y = blink;
    }
  }
  update(0);
  return { root, update };
}
