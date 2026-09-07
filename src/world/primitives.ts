import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { canvasTexture, colors, material } from './palette';

type Surface = string | THREE.Material | THREE.Material[];
export function mesh(
  parent: THREE.Object3D,
  geometry: THREE.BufferGeometry,
  surface: Surface,
  pos: number[] = [0, 0, 0],
) {
  const object = new THREE.Mesh(
    geometry,
    typeof surface === 'string' ? material(surface) : surface,
  );
  object.position.set(pos[0], pos[1], pos[2]);
  object.castShadow = object.receiveShadow = true;
  parent.add(object);
  return object;
}

export function group(parent?: THREE.Object3D, pos: number[] = [0, 0, 0]) {
  const result = new THREE.Group();
  result.position.set(pos[0], pos[1], pos[2]);
  parent?.add(result);
  return result;
}

export function box(
  parent: THREE.Object3D,
  size: number[],
  pos: number[],
  surface: Surface,
  radius = 0.05,
) {
  return mesh(
    parent,
    new RoundedBoxGeometry(
      size[0],
      size[1],
      size[2],
      2,
      Math.min(radius, Math.min(...size) * 0.48),
    ),
    surface,
    pos,
  );
}

const sphereGeometry = new THREE.SphereGeometry(1, 24, 16);
export function sphere(
  parent: THREE.Object3D,
  scale: number | number[],
  pos: number[],
  surface: Surface,
) {
  const object = mesh(parent, sphereGeometry, surface, pos);
  Array.isArray(scale)
    ? object.scale.set(scale[0], scale[1], scale[2])
    : object.scale.setScalar(scale);
  return object;
}

export function cylinder(
  parent: THREE.Object3D,
  rTop: number,
  rBottom: number,
  height: number,
  pos: number[],
  surface: Surface,
  segments = 32,
) {
  return mesh(parent, new THREE.CylinderGeometry(rTop, rBottom, height, segments), surface, pos);
}

export function torus(
  parent: THREE.Object3D,
  radius: number,
  tube: number,
  pos: number[],
  surface: Surface,
  arc = Math.PI * 2,
) {
  return mesh(parent, new THREE.TorusGeometry(radius, tube, 8, 40, arc), surface, pos);
}

export function rod(
  parent: THREE.Object3D,
  from: number[],
  to: number[],
  radius: number,
  surface: Surface,
) {
  const a = new THREE.Vector3(...from),
    b = new THREE.Vector3(...to);
  const object = cylinder(
    parent,
    radius,
    radius,
    a.distanceTo(b),
    a.clone().add(b).multiplyScalar(0.5).toArray(),
    surface,
    12,
  );
  object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.sub(a).normalize());
  return object;
}

export function curve(
  parent: THREE.Object3D,
  points: number[][],
  radius: number,
  surface: Surface,
) {
  return mesh(
    parent,
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))),
      32,
      radius,
      6,
      false,
    ),
    surface,
  );
}

export function archShape(width: number, height: number) {
  const r = width / 2,
    shape = new THREE.Shape();
  shape.moveTo(-r, 0);
  shape.lineTo(r, 0);
  shape.lineTo(r, height - r);
  shape.absarc(0, height - r, r, 0, Math.PI, false);
  shape.lineTo(-r, 0);
  return shape;
}

export function arch(
  parent: THREE.Object3D,
  width: number,
  height: number,
  depth: number,
  pos: number[],
  surface: Surface,
) {
  return mesh(
    parent,
    new THREE.ExtrudeGeometry(archShape(width, height), {
      depth,
      bevelEnabled: true,
      bevelSize: 0.035,
      bevelThickness: 0.025,
      bevelSegments: 2,
      steps: 1,
      curveSegments: 24,
    }),
    surface,
    pos,
  );
}

let shadowMap: THREE.CanvasTexture;
export function contactShadow(
  parent: THREE.Object3D,
  width: number,
  depth: number,
  x = 0,
  z = 0,
  opacity = 0.18,
  y = 0.016,
) {
  shadowMap ??= canvasTexture(128, (ctx, s) => {
    const gradient = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    gradient.addColorStop(0, '#554635aa');
    gradient.addColorStop(0.5, '#55463555');
    gradient.addColorStop(1, '#55463500');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, s, s);
  });
  const shadow = mesh(
    parent,
    new THREE.PlaneGeometry(width, depth),
    new THREE.MeshBasicMaterial({ map: shadowMap, transparent: true, opacity, depthWrite: false }),
    [x, y, z],
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.castShadow = shadow.receiveShadow = false;
  return shadow;
}

export function plant(parent: THREE.Object3D, pos: number[], size = 1, potColor = colors.coral) {
  const root = group(parent, pos);
  root.scale.setScalar(size);
  cylinder(root, 0.32, 0.23, 0.5, [0, 0.25, 0], material(potColor, 'plaster'));
  torus(root, 0.302, 0.035, [0, 0.49, 0], potColor).rotation.x = Math.PI / 2;
  cylinder(root, 0.28, 0.28, 0.035, [0, 0.48, 0], '#726248');
  rod(root, [0, 0.5, 0], [0.06, 1.55, 0], 0.026, colors.moss);
  for (let i = 0; i < 8; i++) {
    const a = i * 2.4,
      h = 0.7 + i * 0.11;
    const end = [Math.cos(a) * 0.3, h + 0.2, Math.sin(a) * 0.3];
    rod(root, [0.03, h, 0], end, 0.018, colors.moss);
    const leaf = sphere(root, [0.18, 0.32, 0.065], end, i % 2 ? colors.sage : colors.moss);
    leaf.rotation.set(0.25 * Math.cos(a), -a, -0.8 * Math.cos(a));
  }
  return root;
}

export function book(
  parent: THREE.Object3D,
  pos: number[],
  color: string,
  size = 1,
  title?: string,
) {
  const root = group(parent, pos);
  root.scale.setScalar(size);
  box(root, [0.48, 0.66, 0.14], [0, 0.33, 0], color, 0.025);
  box(root, [0.43, 0.6, 0.115], [0.019, 0.33, 0.017], colors.milk, 0.012);
  box(root, [0.48, 0.66, 0.025], [0, 0.33, 0.08], color, 0.014);
  box(root, [0.03, 0.66, 0.16], [-0.235, 0.33, 0], color, 0.009);
  if (title) {
    const map = canvasTexture(256, (ctx, s) => {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, s, s);
      ctx.fillStyle = colors.milk;
      ctx.textAlign = 'center';
      ctx.font = 'bold 40px Georgia';
      ctx.fillText(title, s / 2, 72, 210);
      ctx.beginPath();
      ctx.arc(128, 155, 44, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = colors.yellow;
      ctx.beginPath();
      ctx.arc(142, 146, 26, 0, Math.PI * 2);
      ctx.fill();
    });
    const cover = mesh(
      root,
      new THREE.PlaneGeometry(0.435, 0.6),
      new THREE.MeshStandardMaterial({ map, roughness: 0.9 }),
      [0, 0.33, 0.094],
    );
    cover.castShadow = false;
  }
  return root;
}
