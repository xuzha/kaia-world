import * as THREE from 'three';
import { archShape, box, cylinder, group, mesh, rod, sphere, torus } from './primitives';
import { material, seeded } from './palette';
import { FLOOR_Y } from './room';
import { disposeStory } from './story-resources';
import { createNightStars, createNightWater } from './night-effects';

function createAurora(parent: THREE.Group) {
  const root = group(parent);
  root.name = 'polar-aurora';
  const material = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 } },
    vertexShader: `
      uniform float time;
      varying vec2 curtain;
      void main() {
        curtain = uv;
        vec3 p = position;
        p.y += sin(uv.x * 16.0 + time * 0.12) * 0.65;
        p.z += sin(uv.x * 23.0 - time * 0.08) * (0.6 + uv.y);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      varying vec2 curtain;
      void main() {
        float u = curtain.x, v = curtain.y;
        float folds = 0.52 + 0.25 * sin(u * 41.0 + sin(u * 14.0 + time * 0.09) * 3.0);
        float rays = 0.65 + 0.16 * sin(u * 370.0 + time * 0.11) + 0.1 * sin(u * 719.0);
        float edge = smoothstep(0.0, 0.025, v) * exp(-v * 4.2) * (1.0 - smoothstep(0.65, 1.0, v));
        float ends = smoothstep(0.0, 0.12, u) * (1.0 - smoothstep(0.82, 1.0, u));
        vec3 color = mix(vec3(0.015, 0.8, 0.19), vec3(0.12, 0.18, 0.65), smoothstep(0.15, 0.9, v));
        color = mix(color, vec3(0.5, 0.1, 0.42), smoothstep(0.54, 1.0, v) * 0.65);
        gl_FragColor = vec4(color, edge * folds * rays * ends * 1.15);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  for (let layer = 0; layer < 3; layer++) {
    const geometry = new THREE.PlaneGeometry(1, 1, 180, 16);
    const positions = geometry.attributes.position,
      uv = geometry.attributes.uv;
    for (let i = 0; i < positions.count; i++) {
      const u = uv.getX(i),
        v = uv.getY(i);
      const across = (u - 0.5) * 51;
      const depth = 26 + layer * 3 + Math.sin(u * 18 + layer) * 1.1;
      positions.setXYZ(
        i,
        -depth * 0.569 + across * 0.822,
        -5.4 + layer * 0.8 + Math.sin(u * 10 + layer) * 1.1 + v * 7,
        -depth * 0.822 - across * 0.569,
      );
    }
    geometry.computeBoundingSphere();
    const ribbon = mesh(root, geometry, material);
    ribbon.castShadow = ribbon.receiveShadow = false;
    ribbon.frustumCulled = false;
  }
  return {
    material,
    update(time: number) {
      material.uniforms.time.value = time;
    },
  };
}

function igloo(parent: THREE.Group) {
  const root = group(parent, [-4.6, FLOOR_Y, -9.4]);
  root.name = 'polar-igloo';
  const snow = ['#deedf0', '#e9f1ed', '#d4e6e9'];
  const radius = 2.5;
  for (let row = 0; row < 7; row++) {
    const latitude = ((row + 0.5) * Math.PI) / 14;
    const ringRadius = radius * Math.cos(latitude);
    const count = Math.max(5, Math.round((ringRadius * Math.PI * 2) / 0.63));
    for (let i = 0; i < count; i++) {
      const angle = ((i + (row % 2) * 0.5) * Math.PI * 2) / count;
      const frontAngle = Math.atan2(Math.sin(angle), Math.cos(angle));
      if (row < 3 && Math.abs(frontAngle) < 0.32) continue;
      const brick = box(
        root,
        [(ringRadius * Math.PI * 2) / count - 0.035, 0.54, 0.34],
        [Math.sin(angle) * ringRadius, Math.sin(latitude) * radius, Math.cos(angle) * ringRadius],
        snow[(i + row) % 3],
        0.055,
      );
      brick.rotation.set(-latitude, angle, 0, 'YXZ');
    }
  }
  sphere(root, [0.38, 0.16, 0.38], [0, 2.47, 0], '#e9f1ed');
  const tunnel = group(root, [0, 0, 2.48]);
  tunnel.name = 'igloo-entry';
  for (const z of [-0.38, 0.12, 0.62]) {
    for (const x of [-0.75, 0.75])
      for (const y of [0.22, 0.65]) box(tunnel, [0.32, 0.42, 0.49], [x, y, z], '#e2edf0', 0.055);
    for (let i = 0; i < 7; i++) {
      const angle = ((i + 0.5) * Math.PI) / 7;
      box(
        tunnel,
        [0.34, 0.34, 0.49],
        [Math.cos(angle) * 0.73, 0.83 + Math.sin(angle) * 0.73, z],
        snow[i % 3],
        0.045,
      ).rotation.z = angle - Math.PI / 2;
    }
  }
  box(root, [1.12, 0.06, 1.4], [0, 0.035, 2.5], '#d1e1dc', 0.02);
  mesh(root, new THREE.ShapeGeometry(archShape(1.17, 1.38)), '#23475a', [0, 0.02, 2.54]).name =
    'igloo-inner-shadow';
  const lamp = new THREE.PointLight('#ffbf69', 5, 5, 2);
  lamp.position.set(0, 1, 1.6);
  root.add(lamp);
  return root;
}

function penguin(parent: THREE.Group, pos: number[], size: number, baby = false) {
  const root = group(parent, pos);
  root.name = 'polar-penguin';
  root.scale.setScalar(size);
  const dark = baby ? '#798c96' : '#2a4459';
  for (const side of [-1, 1])
    sphere(root, [0.12, 0.045, 0.19], [side * 0.14, 0.047, 0.08], '#dba16b');
  const body = group(root, [0, 0.12, 0]);
  sphere(body, [0.34, 0.5, 0.28], [0, 0.47, 0], dark);
  sphere(body, [0.265, 0.405, 0.075], [0, 0.47, 0.234], '#edf0df');
  const head = group(body, [0, 0.94, 0.015]);
  head.name = 'penguin-head';
  sphere(head, [0.27, 0.26, 0.25], [0, 0, 0], '#2a4459');
  for (const side of [-1, 1]) {
    sphere(head, [0.105, 0.15, 0.066], [side * 0.12, -0.015, 0.2], '#f1edda');
    sphere(head, 0.029, [side * 0.13, 0.035, 0.263], '#253843');
  }
  const beak = mesh(head, new THREE.ConeGeometry(0.075, 0.2, 12), '#dba16b', [0, -0.035, 0.29]);
  beak.rotation.x = Math.PI / 2;
  const flippers = [-1, 1].map((side) => {
    const flipper = group(body, [side * 0.28, 0.7, 0]);
    sphere(flipper, [0.087, 0.33, 0.13], [side * 0.04, -0.24, 0], dark);
    flipper.rotation.z = side * 0.25;
    return flipper;
  });
  return { root, body, head, flippers, x: pos[0], z: pos[2] };
}

function seal(parent: THREE.Group, pos: number[], yaw: number, size: number) {
  const root = group(parent, pos);
  root.name = 'polar-seal';
  root.rotation.y = yaw;
  root.scale.setScalar(size);
  const fur = '#b9ccd0';
  sphere(root, [0.47, 0.34, 0.86], [0, 0.355, -0.18], fur);
  sphere(root, [0.38, 0.09, 0.67], [0, 0.09, -0.05], '#d8e2df');
  for (const side of [-1, 1])
    sphere(root, [0.34, 0.075, 0.2], [side * 0.43, 0.08, 0.05], fur).rotation.y = -side * 0.4;
  const tail = group(root, [0, 0.11, -0.93]);
  for (const side of [-1, 1])
    sphere(tail, [0.19, 0.07, 0.28], [side * 0.15, 0, -0.12], fur).rotation.y = -side * 0.4;
  const head = group(root, [0, 0.48, 0.5]);
  head.name = 'seal-head';
  sphere(head, [0.34, 0.3, 0.33], [0, 0, 0], fur);
  for (const side of [-1, 1]) {
    sphere(head, 0.035, [side * 0.16, 0.07, 0.281], '#324955');
    sphere(head, [0.12, 0.078, 0.076], [side * 0.09, -0.06, 0.3], '#e7e8dc');
    for (let i = 0; i < 3; i++) {
      rod(
        head,
        [side * 0.08, -0.035 - i * 0.025, 0.374],
        [side * 0.38, -0.015 - i * 0.06, 0.32],
        0.006,
        '#5d7d86',
      );
    }
  }
  sphere(head, [0.063, 0.042, 0.04], [0, -0.015, 0.356], '#354c58');
  return { root, head, tail };
}

export function createPolar() {
  const root = group();
  root.name = 'imagination-polar';
  root.visible = false;
  const stars = createNightStars(root, 409, 620);
  const aurora = createAurora(root);
  const water = createNightWater('#183c52', '#67a5a4', 29);
  const sea = mesh(root, new THREE.CircleGeometry(80, 80), water.material, [0, -1.05, 0]);
  sea.name = 'polar-sea';
  sea.rotation.x = -Math.PI / 2;
  sea.castShadow = sea.receiveShadow = false;
  const outline = [
    [-10.5, -11.4],
    [-7.8, -13],
    [-2.7, -12.7],
    [2.5, -12.9],
    [7.5, -11.5],
    [10.4, -8.2],
    [10.3, -3.8],
    [11, 0.5],
    [9.7, 4.5],
    [8.1, 7.7],
    [3.7, 8.4],
    [-1.8, 8.1],
    [-6.4, 8.9],
    [-9.3, 6.8],
    [-10.8, 2],
    [-10.4, -4.8],
  ];
  const island = new THREE.Shape(outline.map(([x, z]) => new THREE.Vector2(x, -z)));
  const ice = mesh(
    root,
    new THREE.ExtrudeGeometry(island, { depth: 1.03, bevelEnabled: false }),
    '#8cbdce',
    [0, FLOOR_Y - 1.28, 0],
  );
  ice.name = 'polar-ice-shelf';
  ice.rotation.x = -Math.PI / 2;
  const cap = mesh(
    root,
    new THREE.ExtrudeGeometry(island, { depth: 0.248, bevelEnabled: false }),
    '#dce9e9',
    [0, FLOOR_Y - 0.25, 0],
  );
  cap.rotation.x = -Math.PI / 2;
  const floor = mesh(root, new THREE.ShapeGeometry(island), '#e8f0eb', [0, FLOOR_Y, 0]);
  floor.name = 'polar-floor';
  floor.rotation.x = -Math.PI / 2;
  floor.castShadow = false;
  igloo(root);
  const animals = group(root);
  animals.name = 'polar-animals';
  const penguins = [
    penguin(animals, [4.3, FLOOR_Y, -7.7], 1.02),
    penguin(animals, [5.75, FLOOR_Y, -8.3], 0.69, true),
    penguin(animals, [8.85, FLOOR_Y, 0.4], 0.92),
    penguin(animals, [-4.7, FLOOR_Y, 7.55], 0.85),
  ];
  const seals = [
    seal(animals, [-8.8, FLOOR_Y, 0.9], 0.9, 1.02),
    seal(animals, [8.35, FLOOR_Y, -5.25], -0.45, 0.85),
  ];
  // Furniture keeps the same occupied footprints as the room.
  const bench = group(root, [-4.35, FLOOR_Y, -5.13]);
  box(bench, [3.45, 0.48, 0.73], [0, 0.24, 0], '#c6dfdf', 0.12);
  box(bench, [3.37, 0.13, 0.69], [0, 0.55, 0], material('#abc2c1', 'fabric'), 0.05);
  const supplies = group(root, [6.5, FLOOR_Y, -4.9]);
  box(supplies, [0.83, 0.63, 0.76], [0, 0.32, 0], '#8baeb5', 0.075);
  box(supplies, [0.87, 0.11, 0.8], [0, 0.66, 0], '#e0e9da', 0.025);
  for (const x of [-0.27, 0.27]) box(supplies, [0.09, 0.69, 0.79], [x, 0.37, 0], '#d2dfd8', 0.025);
  const lanternGlass = new THREE.MeshBasicMaterial({ color: '#ffe3a5' });
  for (const [x, z] of [
    [-6.65, 4.85],
    [6.33, -1.35],
  ]) {
    const lantern = group(root, [x, FLOOR_Y, z]);
    cylinder(lantern, 0.22, 0.25, 0.1, [0, 0.06, 0], '#698b9a');
    cylinder(lantern, 0.16, 0.17, 0.35, [0, 0.28, 0], lanternGlass, 16);
    cylinder(lantern, 0.08, 0.25, 0.11, [0, 0.5, 0], '#698b9a');
    torus(lantern, 0.11, 0.018, [0, 0.64, 0], '#698b9a');
    const light = new THREE.PointLight('#ffd08a', 1.8, 4, 2);
    light.position.y = 0.42;
    lantern.add(light);
  }
  const rng = seeded(622);
  const floes: { root: THREE.Group; y: number; phase: number }[] = [];
  for (let i = 0; i < 15; i++) {
    const angle = (i / 15) * Math.PI * 2;
    const floe = group(root, [
      Math.cos(angle) * (14 + rng() * 3),
      -0.66,
      Math.sin(angle) * (13 + rng() * 2),
    ]);
    floe.name = 'polar-floe';
    const radius = 0.45 + rng() * 0.85;
    cylinder(floe, radius, radius * 0.92, 0.42, [0, -0.14, 0], '#89bac9', 6);
    cylinder(floe, radius, radius, 0.09, [0, 0.12, 0], '#e3eeee', 6);
    floes.push({ root: floe, y: floe.position.y, phase: rng() * 6 });
  }
  const mountains = group(root);
  mountains.name = 'polar-icebergs';
  for (let i = 0; i < 7; i++) {
    const x = -21 + i * 6.5,
      height = 2 + rng() * 2.5;
    const iceberg = mesh(
      mountains,
      new THREE.ConeGeometry(1.5 + rng(), height, 5),
      i % 2 ? '#85aaba' : '#a2c4cb',
      [x, height / 2 - 1.2, -18 - rng() * 4],
    );
    iceberg.rotation.y = rng() * 3;
    iceberg.scale.z = 0.75;
  }
  return {
    root,
    floor,
    update(time: number) {
      if (!root.visible) return;
      stars.update(time);
      aurora.update(time);
      water.update(time);
      penguins.forEach((bird, index) => {
        const elapsed = time + index * 3.7;
        const progress = Math.min(1, (elapsed % 16) / 6);
        const smooth = progress * progress * (3 - 2 * progress);
        const angle = (Math.floor(elapsed / 16) + smooth) * Math.PI * 2 + index;
        const walking = progress < 1 ? Math.sin(progress * Math.PI) : 0;
        bird.root.position.x = bird.x + Math.cos(angle) * 0.3;
        bird.root.position.z = bird.z + Math.sin(angle) * 0.45;
        const heading = Math.atan2(-Math.sin(angle) * 0.3, Math.cos(angle) * 0.45);
        bird.root.rotation.y =
          0.5 + Math.atan2(Math.sin(heading - 0.5), Math.cos(heading - 0.5)) * walking;
        bird.body.rotation.z = Math.sin(elapsed * 7) * walking * 0.1;
        bird.head.rotation.y = Math.sin(elapsed * 0.7) * (1 - walking) * 0.2;
        bird.flippers.forEach((flipper, side) => {
          flipper.rotation.z =
            (side ? 1 : -1) * (0.22 + walking * 0.2 + Math.sin(elapsed * 2) * 0.06);
        });
      });
      seals.forEach((animal, index) => {
        const phase = (time + index * 5) % 13;
        const gesture = phase < 4.5 ? Math.sin((phase / 4.5) * Math.PI) ** 2 : 0;
        animal.head.rotation.set(-gesture * 0.2, Math.sin(time * 0.8) * gesture * 0.32, 0);
        animal.tail.rotation.x = Math.sin(time * 2.4) * gesture * 0.2;
      });
      floes.forEach((floe) => {
        floe.root.position.y = floe.y + Math.sin(time * 0.45 + floe.phase) * 0.055;
      });
    },
    dispose() {
      disposeStory(root, [stars.material, aurora.material, water.material, lanternGlass]);
    },
  };
}
