import * as THREE from 'three';
import { box, curve, cylinder, group, mesh, rod, sphere } from './primitives';
import { colors } from './palette';
import { FLOOR_Y } from './room';
import { createNightWater } from './night-effects';

function createCrocodile(parent: THREE.Group) {
  const root = group(parent);
  root.name = 'zoo-crocodile';
  root.scale.setScalar(0.88);
  const skin = '#789260',
    ridge = '#56794f',
    snout = '#94a672';
  sphere(root, [0.43, 0.24, 0.84], [0, 0.025, -0.2], skin);
  sphere(root, [0.37, 0.13, 0.78], [0, -0.1, -0.13], '#c8ca96');
  for (let i = 0; i < 6; i++)
    for (const side of [-1, 1])
      sphere(root, [0.065, 0.09, 0.11], [side * 0.13, 0.24, -0.79 + i * 0.2], ridge);

  const head = group(root, [0, 0.07, 0.58]);
  head.name = 'crocodile-head';
  sphere(head, [0.36, 0.19, 0.36], [0, 0.025, 0.1], skin);
  box(head, [0.56, 0.13, 0.88], [0, -0.12, 0.54], '#c8ca96', 0.06);
  box(head, [0.61, 0.21, 0.9], [0, -0.005, 0.52], snout, 0.095);
  const eyes: THREE.Mesh[] = [];
  for (const side of [-1, 1]) {
    sphere(head, [0.12, 0.14, 0.14], [side * 0.235, 0.16, 0.19], skin);
    const eye = group(head, [side * 0.265, 0.205, 0.282]);
    sphere(eye, [0.071, 0.066, 0.035], [0, 0, 0], '#f4e7b2');
    eyes.push(sphere(eye, [0.024, 0.041, 0.013], [0, 0, 0.032], '#384c37'));
    sphere(eye, 0.009, [-0.012, 0.018, 0.044], colors.milk);
    sphere(head, [0.125, 0.033, 0.105], [side * 0.235, 0.278, 0.21], ridge);
    sphere(head, [0.037, 0.018, 0.047], [side * 0.18, 0.1, 0.84], ridge);
    curve(
      head,
      [
        [side * 0.299, -0.061, 0.26],
        [side * 0.302, -0.068, 0.62],
        [side * 0.252, -0.068, 0.92],
      ],
      0.011,
      ridge,
    );
    for (let i = 0; i < 3; i++)
      cylinder(head, 0.025, 0.006, 0.055, [side * 0.292, -0.086, 0.37 + i * 0.2], colors.milk, 8);
  }

  const legs: THREE.Group[] = [];
  for (const side of [-1, 1])
    for (const z of [-0.65, 0.36]) {
      const leg = group(root, [side * 0.32, -0.035, z]);
      sphere(leg, [0.25, 0.095, 0.14], [side * 0.13, 0, -0.06], skin).rotation.y = side * 0.4;
      sphere(leg, [0.16, 0.065, 0.21], [side * 0.28, -0.025, -0.12], skin);
      for (let i = 0; i < 3; i++)
        sphere(leg, [0.028, 0.025, 0.055], [side * (0.18 + i * 0.085), -0.03, 0.055], '#b7bd87');
      legs.push(leg);
    }
  const tail = group(root, [0, 0.015, -0.88]);
  tail.name = 'crocodile-tail';
  const joints: THREE.Group[] = [];
  let parentJoint = tail;
  for (const [length, base, tip] of [
    [0.52, 0.29, 0.2],
    [0.48, 0.2, 0.1],
    [0.43, 0.1, 0.012],
  ]) {
    const joint = group(parentJoint);
    joints.push(joint);
    const segment = cylinder(joint, tip, base, length, [0, 0, -length / 2], skin, 16);
    segment.rotation.x = -Math.PI / 2;
    segment.scale.z = 0.57;
    sphere(joint, [base, base * 0.57, base * 0.45], [0, 0, 0], skin);
    for (let i = 0; i < 2; i++)
      sphere(
        joint,
        [base * 0.22, base * 0.25, 0.09],
        [0, base * 0.51, -length * (0.2 + i * 0.45)],
        ridge,
      );
    parentJoint = group(joint, [0, 0, -length]);
  }
  return {
    root,
    update(time: number) {
      const angle = time * 0.15;
      root.position.set(
        Math.cos(angle) * 0.64,
        0.14 + Math.sin(time * 1.4) * 0.012,
        Math.sin(angle) * 0.26,
      );
      root.rotation.y = Math.atan2(-Math.sin(angle) * 0.64, Math.cos(angle) * 0.26);
      head.rotation.y = Math.sin(time * 0.55) * 0.075;
      joints.forEach((joint, i) => {
        joint.rotation.y = Math.sin(time * 2.1 - i * 0.7) * (0.12 + i * 0.025);
      });
      legs.forEach((leg, i) => {
        leg.rotation.y = Math.sin(time * 1.7 + i * Math.PI) * 0.14;
      });
      for (const eye of eyes) eye.scale.y = time % 5.9 > 5.74 ? 0.008 : 0.041;
    },
  };
}

export function createCrocodilePond(parent: THREE.Group) {
  // Across from the duck pond, beyond the walking area and behind the elephant.
  const root = group(parent, [-10.85, FLOOR_Y, -3.45]);
  root.name = 'zoo-crocodile-pond';
  sphere(root, [3.26, 0.1, 2.5], [0, 0.015, 0], '#d3cfaa');
  const bank = mesh(root, new THREE.TorusGeometry(1, 0.065, 10, 80), '#ded5b5', [0, 0.09, 0]);
  bank.rotation.x = -Math.PI / 2;
  bank.scale.set(3.06, 2.28, 1.3);
  const water = createNightWater('#6faaa2', '#c3dbb3');
  const surface = mesh(root, new THREE.CircleGeometry(1, 80), water.material, [0, 0.14, 0]);
  surface.name = 'crocodile-water';
  surface.rotation.x = -Math.PI / 2;
  surface.scale.set(3.03, 2.25, 1);
  surface.castShadow = false;
  for (let i = 0; i < 15; i++) {
    const angle = (i * Math.PI * 2) / 15;
    const stone = sphere(
      root,
      [0.18 + (i % 3) * 0.055, 0.11, 0.17],
      [Math.cos(angle) * 3.12, 0.13, Math.sin(angle) * 2.34],
      i % 2 ? '#b5b7a2' : '#c4c2a7',
    );
    stone.rotation.y = angle;
  }
  for (const [x, z] of [
    [-2.5, -1.48],
    [1.83, -1.93],
  ]) {
    const reeds = group(root, [x, 0.12, z]);
    for (let i = 0; i < 4; i++) {
      const dx = (i - 1.5) * 0.1,
        height = 0.5 + (i % 3) * 0.13;
      rod(reeds, [dx, 0, 0], [dx + 0.06, height, i * 0.035], 0.014, '#6d8858');
      cylinder(reeds, 0.035, 0.036, 0.17, [dx + 0.06, height, i * 0.035], '#a79066', 10);
      sphere(reeds, [0.035, 0.26, 0.02], [dx - 0.06, 0.24, 0.02], '#89a26c').rotation.z = -0.3;
    }
  }
  for (const [x, z] of [
    [-2.15, -1.18],
    [2.25, 1.02],
  ]) {
    const lily = group(root, [x, 0.154, z]);
    lily.name = 'pond-lily';
    const pad = mesh(lily, new THREE.CircleGeometry(0.22, 32, 0.17, Math.PI * 2 - 0.34), '#91ad73');
    pad.rotation.x = -Math.PI / 2;
    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5;
      sphere(
        lily,
        [0.055, 0.045, 0.085],
        [Math.sin(angle) * 0.045, 0.035, Math.cos(angle) * 0.045],
        '#f3dbc5',
      ).rotation.y = angle;
    }
    sphere(lily, 0.035, [0, 0.075, 0], '#dfbc76');
  }
  const crocodile = createCrocodile(root);
  const wakes: THREE.Mesh[] = [];
  const wakeMaterial = new THREE.MeshBasicMaterial({
    color: '#c4e2ce',
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
  });
  for (const side of [-1, 1]) {
    const wake = mesh(
      root,
      new THREE.TorusGeometry(0.55, 0.012, 5, 30, Math.PI * 0.82),
      wakeMaterial,
    );
    wake.rotation.x = -Math.PI / 2;
    wake.rotation.z = side < 0 ? Math.PI : 0;
    wake.castShadow = wake.receiveShadow = false;
    wakes.push(wake);
  }
  function update(time: number) {
    water.update(time);
    crocodile.update(time);
    wakes.forEach((wake, i) => {
      const phase = (time * 0.38 + i * 0.5) % 1;
      wake.position.set(crocodile.root.position.x, 0.148, crocodile.root.position.z);
      wake.scale.setScalar(0.95 + phase * 0.45);
    });
  }
  update(0);
  return {
    root,
    materials: [water.material, wakeMaterial],
    contains(x: number, z: number) {
      return ((x - root.position.x) / 3.85) ** 2 + ((z - root.position.z) / 3.05) ** 2 < 1;
    },
    update,
  };
}
