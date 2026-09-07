import * as THREE from 'three';
import { box, curve, cylinder, group, mesh, rod, sphere, torus } from './primitives';
import { canvasTexture, colors, labelTexture, material, seeded } from './palette';
import { FLOOR_Y } from './room';
import { disposeStory } from './story-resources';

const SEA_Y = -1.48;

/** The deck encloses the existing navigation bounds; play stays at the same floor height. */
export function createVoyage() {
  const root = group();
  root.name = 'imagination-ocean';
  root.visible = false;
  const ship = group(root);
  ship.name = 'voyage-ship';
  const outline = new THREE.Shape();
  outline.moveTo(-7.3, -6.7);
  outline.lineTo(6.6, -6.7);
  outline.bezierCurveTo(8.9, -6.7, 10.5, -2.8, 11, 0);
  outline.bezierCurveTo(10.5, 2.8, 8.9, 6.7, 6.6, 6.7);
  outline.lineTo(-7.3, 6.7);
  outline.quadraticCurveTo(-8.55, 6.7, -8.55, 5.2);
  outline.lineTo(-8.55, -5.2);
  outline.quadraticCurveTo(-8.55, -6.7, -7.3, -6.7);
  const perimeter = outline.getPoints(18);
  const hull = mesh(
    ship,
    new THREE.ExtrudeGeometry(outline, {
      depth: 1.5,
      bevelEnabled: true,
      bevelSize: 0.08,
      bevelThickness: 0.08,
      bevelSegments: 2,
      curveSegments: 18,
    }),
    material('#709c99', 'wood'),
    [0, FLOOR_Y - 0.16, 0],
  );
  hull.name = 'ship-hull';
  hull.rotation.x = Math.PI / 2;
  const deckMap = canvasTexture(1024, (ctx, s) => {
    const rng = seeded(419);
    ctx.fillStyle = '#e7cfa5';
    ctx.fillRect(0, 0, s, s);
    for (let row = 0; row < 24; row++) {
      const y = (row * s) / 24;
      ctx.fillStyle = ['#e9d1a9', '#e2c69d', '#ecd6b1'][row % 3];
      ctx.fillRect(0, y, s, s / 24 - 2);
      ctx.strokeStyle = '#c4a37c';
      ctx.lineWidth = 1.5;
      for (let x = (row % 3) * 110; x < s; x += 330) {
        ctx.beginPath();
        ctx.moveTo(x, y + 1);
        ctx.lineTo(x, y + s / 24 - 2);
        ctx.stroke();
      }
      for (let i = 0; i < 7; i++) {
        ctx.strokeStyle = '#ba98631a';
        const start = rng() * s,
          lineY = y + 4 + rng() * (s / 24 - 8);
        ctx.beginPath();
        ctx.moveTo(start, lineY);
        ctx.quadraticCurveTo(start + 70, lineY + 2, start + 150, lineY);
        ctx.stroke();
      }
    }
  });
  const deckMaterial = new THREE.MeshStandardMaterial({ map: deckMap, roughness: 0.84 });
  const deckGeometry = new THREE.ShapeGeometry(outline, 24);
  const deckVertices = deckGeometry.attributes.position,
    deckUv = deckGeometry.attributes.uv;
  for (let i = 0; i < deckVertices.count; i++)
    deckUv.setXY(i, (deckVertices.getX(i) + 8.55) / 19.55, (deckVertices.getY(i) + 6.7) / 13.4);
  const deck = mesh(ship, deckGeometry, deckMaterial, [0, FLOOR_Y, 0]);
  deck.name = 'ship-deck';
  deck.rotation.x = -Math.PI / 2;

  // Thin ropes keep the open deck readable from every supported camera angle.
  for (const [y, radius, color] of [
    [0.06, 0.085, colors.wood],
    [-0.39, 0.06, colors.cream],
    [0.84, 0.035, colors.cream],
    [0.48, 0.022, colors.oat],
  ] as const)
    curve(
      ship,
      perimeter.map((p) => [p.x, y, p.y]),
      radius,
      color,
    );
  const railPath = new THREE.CurvePath<THREE.Vector2>();
  for (let i = 1; i < perimeter.length; i++)
    railPath.add(new THREE.LineCurve(perimeter[i - 1], perimeter[i]));
  for (const p of railPath.getSpacedPoints(36).slice(0, -1)) {
    rod(ship, [p.x, FLOOR_Y, p.y], [p.x, 0.92, p.y], 0.046, colors.wood);
    sphere(ship, 0.064, [p.x, 0.94, p.y], colors.cream);
  }
  for (const x of [-5.7, -2.6, 0.5, 3.6]) {
    cylinder(ship, 0.22, 0.22, 0.04, [x, -0.81, 6.76], '#476e72').rotation.x = Math.PI / 2;
    torus(ship, 0.225, 0.045, [x, -0.81, 6.8], colors.oat);
  }
  for (const [x, z] of [
    [-6.7, 6.76],
    [4.8, 6.76],
    [-5.7, -6.76],
  ]) {
    const ring = group(ship, [x, 0.41, z]);
    torus(ring, 0.34, 0.095, [0, 0, 0], colors.milk);
    for (let i = 0; i < 4; i++) {
      const stripe = torus(ring, 0.34, 0.098, [0, 0, 0], colors.coral, Math.PI / 5);
      stripe.rotation.z = (i * Math.PI) / 2;
    }
    curve(
      ring,
      [
        [-0.26, 0.22, 0],
        [0, 0.57, 0],
        [0.26, 0.22, 0],
      ],
      0.016,
      colors.oat,
    );
  }
  const nameMap = labelTexture('KAIA', '#709c99', '#fff5d9');
  const nameMaterial = new THREE.MeshStandardMaterial({ map: nameMap, roughness: 0.9 });
  mesh(ship, new THREE.PlaneGeometry(1.9, 0.34), nameMaterial, [2.2, -0.85, 6.79]);

  const mast = group(ship, [0.7, FLOOR_Y, -5.42]);
  mast.name = 'ship-mast';
  cylinder(mast, 0.1, 0.14, 6.75, [0, 3.375, 0], material(colors.wood, 'wood'));
  cylinder(mast, 0.28, 0.31, 0.18, [0, 0.09, 0], colors.oat);
  rod(mast, [-4.5, 2.54, 0], [4.85, 2.54, 0], 0.052, colors.wood);
  const sailMaterial = material('#fff1ce', 'fabric').clone();
  sailMaterial.side = THREE.DoubleSide;
  const sails: { mesh: THREE.Mesh; base: Float32Array }[] = [];
  for (const [direction, width, height] of [
    [-1, 4.5, 3.95],
    [1, 4.7, 3.35],
  ]) {
    const geometry = new THREE.PlaneGeometry(1, 1, 18, 16);
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const u = positions.getX(i) + 0.5,
        v = positions.getY(i) + 0.5;
      positions.setXYZ(i, direction * (0.13 + u * width * (1 - v)), 2.61 + v * height, 0);
    }
    const sail = mesh(mast, geometry, sailMaterial);
    sail.name = 'ship-sail';
    sails.push({ mesh: sail, base: new Float32Array(positions.array) });
    curve(
      mast,
      [
        [direction * width, 2.54, 0],
        [direction * width * 0.44, 2.54 + height * 0.54, 0],
        [0, 2.54 + height, 0],
      ],
      0.021,
      colors.oat,
    );
  }
  const pennant = mesh(
    mast,
    new THREE.ShapeGeometry(
      new THREE.Shape([
        new THREE.Vector2(0, 0),
        new THREE.Vector2(1.2, -0.18),
        new THREE.Vector2(0, -0.5),
      ]),
    ),
    new THREE.MeshStandardMaterial({ color: colors.coral, side: THREE.DoubleSide }),
    [0, 6.7, 0],
  );
  for (const x of [-7.5, 7.5])
    curve(
      ship,
      [
        [x, 0.83, -6.4],
        [x * 0.55, 3.2, -5.9],
        [0.7, 6.3, -5.42],
      ],
      0.023,
      colors.oat,
    );

  // Cargo occupies the former furniture footprints, preserving all established paths.
  const chest = group(ship, [-4.35, FLOOR_Y, -5.13]);
  box(chest, [3.5, 0.8, 0.9], [0, 0.4, 0], material('#a2b5aa', 'wood'), 0.09);
  box(chest, [3.64, 0.16, 0.99], [0, 0.88, 0], material(colors.wood, 'wood'), 0.06);
  for (const x of [-1.1, 1.1]) box(chest, [0.12, 0.75, 0.93], [x, 0.45, 0], colors.oat, 0.014);
  box(chest, [0.17, 0.2, 0.035], [0, 0.68, 0.48], colors.yellow, 0.018);
  for (const x of [-0.65, 2]) {
    box(ship, [0.85, 0.7, 0.78], [x, FLOOR_Y + 0.35, -5.42], material(colors.oat, 'wood'), 0.035);
    for (const offset of [-0.27, 0.27])
      box(ship, [0.07, 0.72, 0.8], [x + offset, FLOOR_Y + 0.35, -5.42], colors.wood, 0.015);
  }
  const wheel = group(ship, [6.5, FLOOR_Y, -4.9]);
  wheel.name = 'ship-wheel';
  cylinder(wheel, 0.13, 0.24, 1.1, [0, 0.55, 0], colors.wood);
  const helm = group(wheel, [0, 1.2, 0.12]);
  helm.rotation.y = 0.28;
  torus(helm, 0.41, 0.055, [0, 0, 0], colors.wood);
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    rod(helm, [0, 0, 0], [Math.cos(a) * 0.56, Math.sin(a) * 0.56, 0], 0.032, colors.wood);
    sphere(helm, 0.05, [Math.cos(a) * 0.56, Math.sin(a) * 0.56, 0], colors.oat);
  }
  sphere(helm, [0.11, 0.11, 0.07], [0, 0, 0.03], colors.yellow);
  const barrel = group(ship, [6.33, FLOOR_Y, -1.35]);
  cylinder(barrel, 0.44, 0.43, 0.83, [0, 0.415, 0], material(colors.wood, 'wood'));
  for (const y of [0.13, 0.7])
    torus(barrel, 0.45, 0.04, [0, y, 0], '#749995').rotation.x = Math.PI / 2;
  const rope = group(ship, [-6.65, FLOOR_Y, 4.85]);
  cylinder(rope, 0.13, 0.16, 0.55, [0, 0.275, 0], colors.wood);
  for (let i = 0; i < 5; i++)
    torus(rope, 0.2 + i * 0.033, 0.026, [0, 0.06 + i * 0.023, 0], colors.oat).rotation.x =
      Math.PI / 2;

  const compassMap = canvasTexture(512, (ctx) => {
    ctx.strokeStyle = '#8c9c89';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(256, 256, 208, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 8; i++) {
      ctx.save();
      ctx.translate(256, 256);
      ctx.rotate((i * Math.PI) / 4);
      ctx.fillStyle = i % 2 ? '#cab184' : '#8a9f94';
      ctx.beginPath();
      ctx.moveTo(0, -185);
      ctx.lineTo(28, 0);
      ctx.lineTo(0, 43);
      ctx.lineTo(-28, 0);
      ctx.fill();
      ctx.restore();
    }
  });
  const compassMaterial = new THREE.MeshStandardMaterial({
    map: compassMap,
    transparent: true,
    depthWrite: false,
  });
  const compass = mesh(ship, new THREE.PlaneGeometry(2.5, 2.5), compassMaterial, [
    8.3,
    FLOOR_Y + 0.008,
    0,
  ]);
  compass.rotation.x = -Math.PI / 2;
  compass.castShadow = false;

  const waterMaterial = new THREE.MeshStandardMaterial({
    color: '#81b5b4',
    roughness: 0.52,
    metalness: 0.04,
  });
  const water = mesh(root, new THREE.PlaneGeometry(180, 180, 64, 64), waterMaterial, [0, SEA_Y, 0]);
  water.name = 'open-sea';
  water.rotation.x = -Math.PI / 2;
  water.castShadow = false;
  const foamMaterial = new THREE.MeshBasicMaterial({
    color: '#ecf5e5',
    transparent: true,
    opacity: 0.66,
    depthWrite: false,
  });
  const waves = group(root);
  waves.name = 'passing-waves';
  const rng = seeded(602);
  const ripples: THREE.Mesh[] = [];
  for (let i = 0; i < 95; i++) {
    const x = rng() * 66 - 33,
      z = rng() * 48 - 24;
    const wave = curve(
      waves,
      Array.from({ length: 7 }, (_, j) => [j * 0.17, 0, Math.sin((j * Math.PI) / 3) * 0.075]),
      0.018,
      foamMaterial,
    );
    wave.position.set(x, SEA_Y + 0.11, z);
    wave.castShadow = wave.receiveShadow = false;
    ripples.push(wave);
  }
  const wake = group(root);
  wake.name = 'sailing-wake';
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const line = curve(
        wake,
        [
          [10.9, SEA_Y + 0.12, side * 0.35],
          [8.2, SEA_Y + 0.12, side * (5.8 + i * 0.2)],
          [3, SEA_Y + 0.12, side * (7.25 + i * 0.24)],
          [-6.5, SEA_Y + 0.12, side * (7.5 + i * 0.3)],
          [-14 - i, SEA_Y + 0.12, side * (8.4 + i * 0.5)],
        ],
        0.025 + i * 0.007,
        foamMaterial,
      );
      line.castShadow = line.receiveShadow = false;
    }
  }
  const islands = group(root);
  islands.name = 'distant-islands';
  for (const [x, z, scale] of [
    [-12, -12.5, 1],
    [2.6, -17.5, 1.25],
    [16.5, -10.5, 0.85],
  ]) {
    const island = group(islands, [x, SEA_Y, z]);
    island.scale.setScalar(scale);
    sphere(island, [2.7, 0.34, 1.5], [0, 0.12, 0], '#e7d6ae');
    sphere(island, [1.85, 0.66, 1.03], [-0.2, 0.34, -0.1], '#a6b798');
    const palm = group(island, [-0.45, 0.5, 0]);
    curve(
      palm,
      [
        [0, 0, 0],
        [0.18, 1.1, 0],
        [0.46, 2.25, 0],
      ],
      0.085,
      colors.wood,
    );
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      const leaf = sphere(
        palm,
        [0.72, 0.07, 0.22],
        [0.46 + Math.cos(a) * 0.47, 2.23, Math.sin(a) * 0.47],
        i % 2 ? '#92ad8c' : '#7c9c82',
      );
      leaf.rotation.set(0, -a, -0.22 * Math.cos(a));
    }
  }
  const gulls: THREE.Group[] = [];
  for (let i = 0; i < 5; i++) {
    const gull = group(root);
    gull.name = 'sea-gull';
    for (const side of [-1, 1]) {
      const wing = curve(
        gull,
        [
          [0, 0, 0],
          [side * 0.2, 0.16, -0.015],
          [side * 0.43, 0.02, 0.04],
        ],
        0.029,
        colors.milk,
      );
      wing.castShadow = false;
    }
    gulls.push(gull);
  }
  const fish: THREE.Group[] = [];
  for (let i = 0; i < 5; i++) {
    const animal = group(root);
    animal.name = 'sea-fish';
    const color = [colors.coral, colors.yellow, colors.sky][i % 3];
    sphere(animal, [0.24, 0.08, 0.1], [0, 0, 0], color);
    sphere(animal, [0.12, 0.025, 0.13], [-0.24, 0, 0], color);
    sphere(animal, 0.017, [0.14, 0.065, 0.055], colors.ink);
    fish.push(animal);
  }

  return {
    root,
    ship,
    deck,
    water,
    update(time: number) {
      if (!root.visible) return;
      const vertices = water.geometry.attributes.position;
      for (let i = 0; i < vertices.count; i++)
        vertices.setZ(
          i,
          Math.sin(vertices.getX(i) * 0.72 + time * 1.1) *
            Math.cos(vertices.getY(i) * 0.56 + time * 0.7) *
            0.07,
        );
      vertices.needsUpdate = true;
      for (const { mesh: sail, base } of sails) {
        const positions = sail.geometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
          const u = sail.geometry.attributes.uv.getX(i),
            v = sail.geometry.attributes.uv.getY(i);
          positions.setZ(
            i,
            Math.sin(u * Math.PI) *
              Math.sin(v * Math.PI) *
              (0.44 + Math.sin(time * 1.6 + base[i * 3] * 1.4) * 0.1),
          );
        }
        positions.needsUpdate = true;
        sail.geometry.computeVertexNormals();
      }
      pennant.rotation.y = Math.sin(time * 2.1) * 0.15;
      ripples.forEach((wave, i) => {
        // Absolute time keeps manual stepping and pause consistent.
        wave.position.x = ((((i * 13.73 - time * 0.62) % 66) + 66) % 66) - 33;
      });
      islands.position.x = Math.sin(time * 0.018) * -2;
      wake.scale.z = 1 + Math.sin(time * 1.25) * 0.014;
      gulls.forEach((gull, i) => {
        const a = time * 0.14 + i * 0.9;
        gull.position.set(
          -5 + Math.cos(a) * 12,
          4.4 + Math.sin(a * 1.4 + i) * 0.5,
          -9 + Math.sin(a) * 3,
        );
        gull.rotation.y = -a;
        gull.children.forEach((wing, side) => {
          wing.rotation.z = Math.sin(time * 2.7 + i) * (side ? -0.2 : 0.2);
        });
      });
      fish.forEach((animal, i) => {
        const a = time * 0.32 + i * 0.8;
        animal.position.set(-2 + Math.cos(a) * 4, SEA_Y + 0.08, 9 + i * 0.26 + Math.sin(a) * 0.32);
        animal.rotation.y = Math.atan2(-Math.cos(a) * 0.32, -Math.sin(a) * 4);
      });
    },
    dispose() {
      disposeStory(
        root,
        [
          deckMaterial,
          waterMaterial,
          foamMaterial,
          sailMaterial,
          compassMaterial,
          nameMaterial,
          pennant.material as THREE.Material,
        ],
        [deckMap, compassMap, nameMap],
      );
    },
  };
}
