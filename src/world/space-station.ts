import * as THREE from 'three';
import { box, cylinder, group, mesh, rod, sphere, torus } from './primitives';
import { canvasTexture } from './palette';
import { FLOOR_Y } from './room';
import { disposeStory } from './story-resources';

function clippedPanel(width: number, height: number, corner: number) {
  const x = width / 2,
    y = height / 2;
  return new THREE.Shape([
    new THREE.Vector2(-x + corner, -y),
    new THREE.Vector2(x - corner, -y),
    new THREE.Vector2(x, -y + corner),
    new THREE.Vector2(x, y - corner),
    new THREE.Vector2(x - corner, y),
    new THREE.Vector2(-x + corner, y),
    new THREE.Vector2(-x, y - corner),
    new THREE.Vector2(-x, -y + corner),
  ]);
}

export function createSpaceStation(parent: THREE.Group) {
  const root = group(parent);
  root.name = 'space-station';
  const shell = new THREE.MeshStandardMaterial({
    color: '#c9cfd4',
    roughness: 0.48,
    metalness: 0.38,
  });
  const metal = new THREE.MeshStandardMaterial({
    color: '#76838e',
    roughness: 0.43,
    metalness: 0.62,
  });
  const dark = new THREE.MeshStandardMaterial({
    color: '#293846',
    roughness: 0.6,
    metalness: 0.36,
  });
  const gold = new THREE.MeshStandardMaterial({
    color: '#aa8c52',
    roughness: 0.55,
    metalness: 0.6,
  });
  const glow = new THREE.MeshStandardMaterial({
    color: '#e0eff5',
    emissive: '#9dd1e1',
    emissiveIntensity: 0.55,
    roughness: 0.45,
  });
  const hull = cylinder(root, 1, 0.965, 0.85, [0, FLOOR_Y - 0.535, 0], metal, 96);
  hull.scale.set(10.6, 1, 8.5);
  hull.name = 'station-pressure-hull';
  const deckMap = canvasTexture(1024, (ctx, s) => {
    ctx.fillStyle = '#75838f';
    ctx.fillRect(0, 0, s, s);
    for (let x = 0; x < 8; x++)
      for (let y = 0; y < 8; y++) {
        ctx.fillStyle = (x + y) % 3 ? '#bdc5cc' : '#b5bec6';
        ctx.fillRect(x * 128 + 2, y * 128 + 2, 124, 124);
        ctx.fillStyle = '#80909d';
        for (const a of [9, 118])
          for (const b of [9, 118]) ctx.fillRect(x * 128 + a, y * 128 + b, 2, 2);
      }
    ctx.strokeStyle = '#e1e7e9';
    ctx.lineWidth = 3;
    for (const radius of [0.42, 0.43]) {
      ctx.beginPath();
      ctx.arc(s / 2, s / 2, s * radius, 0, Math.PI * 2);
      ctx.stroke();
    }
  });
  const deckMaterial = new THREE.MeshStandardMaterial({
    map: deckMap,
    roughness: 0.74,
    metalness: 0.18,
  });
  const floor = cylinder(root, 1, 1, 0.12, [0, FLOOR_Y - 0.06, 0], deckMaterial, 96);
  floor.name = 'space-floor';
  floor.scale.set(10.6, 1, 8.5);
  for (const y of [FLOOR_Y - 0.78, FLOOR_Y - 0.16]) {
    const rim = torus(root, 1, 0.011, [0, y, 0], dark);
    rim.rotation.x = -Math.PI / 2;
    rim.scale.set(10.55, 8.45, 1);
  }
  for (let i = 0; i < 24; i++) {
    const a = (i * Math.PI * 2) / 24;
    const panel = group(root, [Math.cos(a) * 10.46, -0.43, Math.sin(a) * 8.38]);
    panel.rotation.y = -a + Math.PI / 2;
    box(panel, [1.12, 0.38, 0.06], [0, 0, 0], shell, 0.025);
    box(panel, [0.55, 0.045, 0.025], [0, 0.045, 0.05], i % 3 ? dark : glow, 0.006);
  }

  const observatory = group(root);
  observatory.name = 'observatory-windows';
  const glass = new THREE.MeshStandardMaterial({
    color: '#54819b',
    transparent: true,
    opacity: 0.12,
    depthWrite: false,
    side: THREE.DoubleSide,
    roughness: 0.25,
    metalness: 0.18,
  });
  const labelMap = canvasTexture(512, (ctx, s) => {
    ctx.fillStyle = '#344654';
    ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = '#dde5e8';
    ctx.textAlign = 'center';
    ctx.font = '500 95px sans-serif';
    ctx.fillText('KAIA', s / 2, 265);
    ctx.font = '27px monospace';
    ctx.fillText('ORBITAL HABITAT / 01', s / 2, 325);
    ctx.fillStyle = '#c3a675';
    ctx.fillRect(72, 157, 368, 5);
  });
  const labelMaterial = new THREE.MeshStandardMaterial({ map: labelMap, roughness: 0.7 });
  for (let i = 0; i < 8; i++) {
    const a = Math.PI + 0.12 + (i * (Math.PI - 0.24)) / 8;
    const b = a + (Math.PI - 0.24) / 8;
    const left = new THREE.Vector3(Math.cos(a) * 10.6, FLOOR_Y, Math.sin(a) * 8.6);
    const right = new THREE.Vector3(Math.cos(b) * 10.6, FLOOR_Y, Math.sin(b) * 8.6);
    const width = left.distanceTo(right);
    const bay = group(observatory, left.clone().add(right).multiplyScalar(0.5).toArray());
    bay.rotation.y = Math.atan2(left.z - right.z, right.x - left.x);
    box(bay, [width + 0.12, 0.95, 0.42], [0, 0.475, 0], shell, 0.035);
    box(bay, [width - 0.3, 0.1, 0.025], [0, 0.24, 0.225], dark, 0.012);
    box(bay, [width - 0.5, 0.035, 0.025], [0, 0.78, 0.23], glow, 0.008);
    const frame = clippedPanel(width + 0.04, 2.75, 0.32);
    const opening = clippedPanel(width - 0.46, 2.18, 0.24);
    frame.holes.push(new THREE.Path(opening.getPoints()));
    mesh(
      bay,
      new THREE.ExtrudeGeometry(frame, {
        depth: 0.24,
        bevelEnabled: false,
        steps: 1,
      }),
      shell,
      [0, 2.05, -0.15],
    );
    const pane = mesh(bay, new THREE.ShapeGeometry(opening), glass, [0, 2.05, -0.02]);
    pane.castShadow = pane.receiveShadow = false;
    box(bay, [width + 0.13, 0.36, 0.5], [0, 3.52, -0.025], metal, 0.03);
    box(bay, [width + 0.16, 0.3, 1.85], [0, 3.84, 0.4], shell, 0.035);
    box(bay, [width - 0.3, 0.035, 0.055], [0, 3.68, 1.22], glow, 0.008);
    for (const x of [-width / 2, width / 2])
      box(bay, [0.18, 3.67, 0.5], [x, 1.84, -0.005], metal, 0.025);
    if (i === 3) mesh(bay, new THREE.PlaneGeometry(1.4, 0.7), labelMaterial, [0, 0.48, 0.24]);
  }

  // Cylindrical pressure vessels and their collars continue outside the cutaway.
  const habitat = group(root, [-0.4, 3.15, -10.05]);
  habitat.name = 'station-habitat-module';
  habitat.rotation.z = -Math.PI / 2;
  cylinder(habitat, 1.22, 1.22, 7.4, [0, 0, 0], shell, 48);
  for (const y of [-3.6, -2.55, 0, 2.55, 3.6]) {
    const band = torus(habitat, 1.225, y === 0 ? 0.09 : 0.045, [0, y, 0], metal);
    band.rotation.x = Math.PI / 2;
  }
  for (const side of [-1, 1]) {
    sphere(habitat, [1.19, 0.38, 1.19], [0, side * 3.72, 0], metal);
    cylinder(habitat, 0.78, 0.78, 0.34, [0, side * 4.07, 0], gold);
    for (const x of [-0.5, 0.5])
      rod(habitat, [x, side * 0.45, 1.2], [x, side * 2.05, 1.2], 0.035, gold);
  }
  const tunnel = cylinder(root, 1.04, 1.04, 2.45, [-4.35, 1.52, -6.74], shell, 48);
  tunnel.rotation.x = Math.PI / 2;
  tunnel.name = 'station-docking-tunnel';
  const airlock = group(root, [-4.35, FLOOR_Y, -5.13]);
  airlock.name = 'station-airlock';
  mesh(
    airlock,
    new THREE.ExtrudeGeometry(clippedPanel(3.75, 2.85, 0.36), {
      depth: 0.65,
      bevelEnabled: false,
    }),
    shell,
    [0, 1.425, -0.325],
  );
  const collar = cylinder(airlock, 1.03, 1.03, 0.16, [0, 1.43, 0.36], dark, 48);
  collar.rotation.x = Math.PI / 2;
  const door = cylinder(airlock, 0.86, 0.86, 0.06, [0, 1.43, 0.455], metal, 48);
  door.rotation.x = Math.PI / 2;
  torus(airlock, 0.92, 0.055, [0, 1.43, 0.45], gold);
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    sphere(airlock, 0.044, [Math.cos(a) * 0.94, 1.43 + Math.sin(a) * 0.94, 0.5], shell);
  }
  box(airlock, [0.46, 0.32, 0.025], [0, 1.79, 0.499], dark, 0.06);
  rod(airlock, [-0.15, 1.12, 0.525], [0.15, 1.12, 0.525], 0.034, shell);
  box(airlock, [0.7, 0.06, 0.025], [0, 2.64, 0.35], glow, 0.008);

  const solarMap = canvasTexture(512, (ctx, s) => {
    ctx.fillStyle = '#142637';
    ctx.fillRect(0, 0, s, s);
    for (let x = 5; x < s; x += 42)
      for (let y = 5; y < s; y += 62) {
        ctx.fillStyle = (x + y) % 3 ? '#244c71' : '#294461';
        ctx.fillRect(x, y, 37, 57);
        ctx.fillStyle = '#688299';
        for (let k = 1; k < 4; k++) ctx.fillRect(x, y + k * 14, 37, 0.8);
      }
  });
  const solarMaterial = new THREE.MeshStandardMaterial({
    map: solarMap,
    roughness: 0.5,
    metalness: 0.42,
  });
  const wings = group(root);
  wings.name = 'station-solar-wings';
  for (const side of [-1, 1]) {
    const truss = group(wings);
    truss.name = 'station-array-truss';
    for (const z of [-1.53, -0.97]) {
      rod(truss, [side * 9.7, -0.61, z], [side * 12.35, -0.61, z], 0.046, metal);
      rod(truss, [side * 9.7, -1.02, z], [side * 12.35, -1.02, z], 0.046, metal);
      for (let i = 0; i < 4; i++) {
        const a = side * (9.7 + i * 0.66),
          b = side * (10.36 + i * 0.66);
        rod(truss, [a, -1.02, z], [b, -0.61, z], 0.029, shell);
      }
    }
    for (const z of [-3.42, 1.05]) {
      const panel = group(wings, [side * 11.9, -0.73, z]);
      panel.name = 'station-solar-array';
      panel.rotation.z = side * 0.09;
      box(panel, [3.2, 0.09, 3.95], [0, 0, 0], gold, 0.015);
      box(panel, [3.08, 0.025, 3.82], [0, 0.059, 0], solarMaterial, 0.006);
      for (const x of [-0.53, 0.53]) box(panel, [0.032, 0.024, 3.82], [x, 0.078, 0], metal, 0.002);
    }
  }
  const service = group(root, [9.72, -0.12, 2.1]);
  service.name = 'station-service-module';
  cylinder(service, 0.8, 0.8, 2.7, [0, 0, 0], shell, 32).rotation.x = Math.PI / 2;
  torus(service, 0.81, 0.06, [0, 0, 1.31], metal);
  cylinder(service, 0.58, 0.58, 0.14, [0, 0, 1.42], gold).rotation.x = Math.PI / 2;
  for (const x of [-0.35, 0.35])
    cylinder(service, 0.12, 0.19, 0.24, [x, -0.4, 1.65], dark, 16).rotation.x = Math.PI / 2;
  const arm = group(root, [9.85, 0.22, 1.2]);
  arm.name = 'station-robotic-arm';
  const joints = [
    [0, 0, 0],
    [0.35, 1.85, 0.1],
    [1.5, 3.05, 0.8],
    [1.95, 2.45, 1.1],
  ];
  for (let i = 0; i < joints.length; i++) {
    sphere(arm, 0.16, joints[i], metal);
    if (i) rod(arm, joints[i - 1], joints[i], 0.11, shell);
  }
  box(arm, [0.48, 0.17, 0.31], joints[3], dark, 0.03);

  const desk = group(root, [0.7, FLOOR_Y, -5.42]);
  desk.name = 'station-flight-console';
  box(desk, [4.25, 0.82, 0.86], [0, 0.41, 0], shell, 0.08);
  box(desk, [4.3, 0.18, 0.92], [0, 0.88, 0], dark, 0.04);
  const screenMap = canvasTexture(512, (ctx, s) => {
    ctx.fillStyle = '#0b1e29';
    ctx.fillRect(0, 0, s, s);
    ctx.strokeStyle = '#6eabb3';
    ctx.lineWidth = 3;
    for (const radius of [60, 98, 140]) {
      ctx.beginPath();
      ctx.ellipse(256, 250, radius, radius * 0.56, -0.35, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = '#d8b875';
    ctx.beginPath();
    ctx.arc(268, 212, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#89b6c0';
    for (let i = 0; i < 5; i++) ctx.fillRect(55, 390 + i * 13, 140 + (i % 3) * 32, 3);
  });
  const screenMaterial = new THREE.MeshStandardMaterial({
    map: screenMap,
    emissiveMap: screenMap,
    emissive: '#a8d1e1',
    emissiveIntensity: 0.5,
    roughness: 0.45,
  });
  for (const x of [-1.38, 0, 1.38]) {
    const screen = group(desk, [x, 1.35, -0.12]);
    screen.rotation.x = -0.15;
    box(screen, [1.1, 0.71, 0.1], [0, 0, 0], dark, 0.05);
    mesh(screen, new THREE.PlaneGeometry(0.96, 0.59), screenMaterial, [0, 0, 0.056]);
    for (let i = 0; i < 3; i++)
      box(
        desk,
        [0.12, 0.02, 0.07],
        [x - 0.22 + i * 0.22, 0.99, 0.25],
        i === 0 ? gold : glow,
        0.005,
      );
  }
  const antenna = group(root, [6.5, FLOOR_Y, -4.9]);
  cylinder(antenna, 0.1, 0.32, 1.42, [0, 0.71, 0], metal);
  const dish = group(antenna, [0, 1.62, 0]);
  dish.rotation.set(0.5, 0, -0.3);
  sphere(dish, [0.53, 0.11, 0.53], [0, 0, 0], shell);
  rod(dish, [0, 0, 0], [0, 0.58, 0], 0.026, metal);
  sphere(dish, 0.07, [0, 0.58, 0], gold);
  for (const [x, z] of [
    [6.33, -1.35],
    [-6.65, 4.85],
  ]) {
    const locker = group(root, [x, FLOOR_Y, z]);
    locker.name = 'station-storage-locker';
    box(locker, [0.74, 0.62, 0.7], [0, 0.31, 0], shell, 0.055);
    box(locker, [0.54, 0.4, 0.018], [0, 0.31, 0.356], metal, 0.018);
    box(locker, [0.24, 0.045, 0.035], [0, 0.36, 0.38], dark, 0.008);
  }
  return {
    root,
    floor,
    solarMaterial,
    update(time: number) {
      dish.rotation.y = Math.sin(time * 0.13) * 0.25;
    },
    dispose() {
      disposeStory(
        root,
        [
          shell,
          metal,
          dark,
          gold,
          glow,
          deckMaterial,
          glass,
          labelMaterial,
          solarMaterial,
          screenMaterial,
        ],
        [deckMap, labelMap, solarMap, screenMap],
      );
    },
  };
}
