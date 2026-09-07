import * as THREE from 'three';
import { canvasTexture, colors, material } from '../world/palette';
import { curve, group, mesh, sphere, torus } from '../world/primitives';
import type { CharacterKind } from './rig';

/** A continuous cheek and hair silhouette, shared by the family of little dolls. */
export function createHead(parent: THREE.Group, kind: CharacterKind) {
  const adult = kind !== 'kaia';
  const rx = adult ? 0.295 : 0.35;
  const ry = adult ? 0.32 : 0.345;
  const rz = adult ? 0.272 : 0.298;
  const cheekWidth = (y: number) => rx * (1 + 0.09 * Math.exp(-(((y / ry + 0.35) / 0.38) ** 2)));
  const front = (x: number, y: number, offset = 0.006) => [
    x,
    y,
    rz * Math.sqrt(Math.max(0, 1 - (x / cheekWidth(y)) ** 2 - (y / ry) ** 2)) + offset,
  ];
  const headGeometry = new THREE.SphereGeometry(1, 48, 32);
  const vertices = headGeometry.attributes.position;
  for (let i = 0; i < vertices.count; i++) {
    const y = vertices.getY(i) * ry;
    vertices.setXYZ(i, vertices.getX(i) * cheekWidth(y), y, vertices.getZ(i) * rz);
  }
  headGeometry.computeVertexNormals();
  const face = mesh(parent, headGeometry, material(colors.skin));
  face.name = 'cheeks';
  // Keep the face clean at close range; small hair shadows otherwise alias into dark flecks.
  face.receiveShadow = false;

  const hair = material(colors.hair).clone();
  hair.roughness = 0.78;
  const hairPoint = (phi: number, theta: number, padding = 1.045) => {
    const y = Math.cos(theta) * ry;
    return [
      Math.sin(phi) * Math.sin(theta) * cheekWidth(y) * padding,
      y * padding + 0.007,
      Math.cos(phi) * Math.sin(theta) * rz * padding - 0.008,
    ];
  };
  const fringe = (phi: number) => {
    const frontWeight = 1 - THREE.MathUtils.smoothstep(Math.abs(phi), 0.8, 1.9);
    const bangs = 1.2 + Math.cos(phi * 9 + 0.4) * 0.065 + Math.sin(phi * 2) * 0.05;
    return THREE.MathUtils.lerp(kind === 'dad' ? 1.8 : 2.14, bangs, frontWeight);
  };
  const positions: number[] = [];
  const indices: number[] = [];
  const columns = 80;
  const rows = 28;
  for (let row = 0; row <= rows + 1; row++) {
    for (let col = 0; col <= columns; col++) {
      const phi = (col / columns) * Math.PI * 2 - Math.PI;
      const theta = (Math.min(row, rows) / rows) * fringe(phi);
      positions.push(...hairPoint(phi, theta, row > rows ? 0.997 : 1.045));
      if (row <= rows && col < columns) {
        const a = row * (columns + 1) + col;
        const b = a + columns + 1;
        indices.push(a, b, a + 1, a + 1, b, b + 1);
      }
    }
  }
  const hairGeometry = new THREE.BufferGeometry();
  hairGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  hairGeometry.setIndex(indices);
  hairGeometry.computeVertexNormals();
  mesh(parent, hairGeometry, hair).name = 'sculpted-hair';
  for (const phi of [-0.57, 0.26, 0.73, 2.5]) {
    const strand = curve(
      parent,
      [0.35, 0.55, 0.78, 0.96].map((t) => hairPoint(phi + (1 - t) * 0.2, fringe(phi) * t, 1.052)),
      0.0015,
      '#473a30',
    );
    strand.castShadow = false;
  }

  const blush = canvasTexture(128, (ctx, size) => {
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, '#e29c8790');
    gradient.addColorStop(0.5, '#e29c8750');
    gradient.addColorStop(1, '#e29c8700');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  });
  const blushMaterial = new THREE.MeshBasicMaterial({
    map: blush,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
  });
  const eyes: THREE.Group[] = [];
  const pigtails: THREE.Object3D[] = [];
  for (const side of [-1, 1]) {
    sphere(parent, [0.057, 0.071, 0.05], [side * (rx + 0.001), -0.056, 0], colors.skin);
    sphere(parent, [0.023, 0.034, 0.012], [side * (rx + 0.022), -0.057, 0.043], '#dda788');

    const x = side * (adult ? 0.113 : 0.123);
    const eye = group(parent, front(x, -0.03, 0.011));
    eye.rotation.y = side * 0.32;
    const eyeSize = adult ? 0.84 : 1;
    const iris = sphere(eye, [0.039, 0.051, 0.014], [0, 0, 0], '#392b24');
    iris.receiveShadow = false;
    sphere(eye, [0.027, 0.021, 0.003], [0, -0.021, 0.013], '#624a35').castShadow = false;
    sphere(eye, [0.012, 0.014, 0.004], [-0.01, 0.018, 0.014], colors.milk).castShadow = false;
    sphere(eye, 0.0045, [0.015, -0.01, 0.014], colors.oat).castShadow = false;
    eye.scale.setScalar(eyeSize);
    eye.userData.openScale = eyeSize;
    eyes.push(eye);
    const eyebrow = curve(
      parent,
      [front(x - 0.035, 0.065), front(x, 0.074), front(x + 0.032, 0.067)],
      0.0065,
      colors.hair,
    );
    eyebrow.castShadow = eyebrow.receiveShadow = false;

    const cheek = new THREE.PlaneGeometry(adult ? 0.115 : 0.16, 0.094, 12, 8);
    const points = cheek.attributes.position;
    for (let i = 0; i < points.count; i++) {
      const [px, py, pz] = front(
        points.getX(i) + side * (adult ? 0.19 : 0.222),
        points.getY(i) - 0.102,
        0.003,
      );
      points.setXYZ(i, px, py, pz);
    }
    cheek.computeVertexNormals();
    const blushMesh = mesh(parent, cheek, blushMaterial);
    blushMesh.castShadow = blushMesh.receiveShadow = false;

    if (!adult) {
      const tail = group(parent, [side * 0.346, -0.005, -0.125]);
      const profile = [
        [0, -0.15],
        [0.047, -0.132],
        [0.087, -0.08],
        [0.088, -0.02],
        [0.067, 0.035],
        [0, 0.084],
      ].map(([radius, y]) => new THREE.Vector2(radius, y));
      const tuft = mesh(
        tail,
        new THREE.LatheGeometry(new THREE.SplineCurve(profile).getPoints(24), 32),
        hair,
        [side * 0.04, -0.022, 0],
      );
      tuft.scale.z = 0.83;
      tuft.rotation.z = side * 0.55;
      pigtails.push(tail);
      sphere(tail, [0.045, 0.019, 0.043], [side * 0.006, 0.028, 0.025], colors.coral);
    }
  }
  const nose = sphere(parent, [0.022, 0.024, 0.022], front(0, -0.087, 0.002), colors.skin);
  nose.receiveShadow = false;
  const smile = curve(
    parent,
    [front(-0.044, -0.146), front(-0.023, -0.168), front(0.013, -0.171), front(0.044, -0.146)],
    0.008,
    '#9f6650',
  );
  smile.castShadow = smile.receiveShadow = false;

  if (kind === 'dad') {
    for (const side of [-1, 1]) {
      torus(parent, 0.074, 0.008, [side * 0.113, -0.027, 0.281], '#78674b');
      curve(
        parent,
        [
          [side * 0.19, -0.025, 0.275],
          [side * 0.28, 0, 0.19],
          [side * 0.29, 0, 0.07],
        ],
        0.008,
        '#78674b',
      );
    }
    curve(
      parent,
      [
        [-0.044, -0.025, 0.289],
        [0, -0.012, 0.297],
        [0.044, -0.025, 0.289],
      ],
      0.008,
      '#78674b',
    );
  } else if (kind === 'mom') {
    sphere(parent, [0.15, 0.16, 0.15], [0, 0.22, -0.26], hair);
    torus(parent, 0.087, 0.014, [0, 0.27, -0.19], colors.wood).rotation.x = Math.PI / 3;
  } else {
    const bow = group(parent, [-0.267, 0.195, 0.218]);
    bow.rotation.z = 0.32;
    for (const side of [-1, 1]) {
      const ribbon = sphere(bow, [0.053, 0.034, 0.017], [side * 0.041, 0, 0], colors.coral);
      ribbon.rotation.z = side * 0.3;
    }
    sphere(bow, [0.022, 0.022, 0.02], [0, 0, 0.009], colors.peach);
  }
  return { eyes, pigtails };
}
