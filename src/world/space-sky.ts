import * as THREE from 'three';
import { cylinder, group, mesh, sphere } from './primitives';
import { canvasTexture, seeded } from './palette';
import { disposeStory } from './story-resources';

export function createSpaceSky(parent: THREE.Group) {
  const root = group(parent);
  root.name = 'space-sky';
  const panoramaMap = new THREE.TextureLoader().load(
    import.meta.env.BASE_URL + 'assets/space/milky-way.jpg',
  );
  panoramaMap.colorSpace = THREE.SRGBColorSpace;
  const panoramaMaterial = new THREE.MeshBasicMaterial({
    map: panoramaMap,
    color: '#a7b2c4',
    side: THREE.BackSide,
    depthWrite: false,
    toneMapped: false,
  });
  const panoramaGeometry = new THREE.SphereGeometry(26, 64, 32);
  const panorama = mesh(root, panoramaGeometry, panoramaMaterial);
  panorama.name = 'space-milky-way';
  panorama.castShadow = panorama.receiveShadow = false;
  panorama.renderOrder = -10;
  // Orient the photographic galactic plane diagonally above the cutaway habitat.
  // Keeping it on a sphere gives every camera angle a continuous star field.
  const center = new THREE.Vector3(-0.568, -0.264, -0.819).normalize();
  const along = new THREE.Vector3(0.64, 0.36, -0.68);
  along.addScaledVector(center, -along.dot(center)).normalize().negate();
  const up = new THREE.Vector3().crossVectors(along, center).normalize();
  panorama.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(center, up, along));

  const starMap = canvasTexture(32, (ctx, s) => {
    const gradient = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.2, '#ffffff');
    gradient.addColorStop(0.5, '#e1ebfa66');
    gradient.addColorStop(1, '#e1ebfa00');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, s, s);
  });
  const stars = group(root);
  stars.name = 'space-stars';
  const rng = seeded(781);
  // The panorama supplies the dense, irregular galactic stars; these sparse
  // pixel-sized points preserve a little sparkle on small orthographic views.
  const layers = [
    { count: 2400, radius: 48, size: 1.1 },
    { count: 650, radius: 41, size: 1.8 },
    { count: 120, radius: 33, size: 2.8 },
  ].map(({ count, radius, size }, layer) => {
    const positions: number[] = [],
      tints: number[] = [];
    const color = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const a = rng() * Math.PI * 2,
        y = rng() * 2 - 1,
        r = radius + rng() * 4;
      const ring = Math.sqrt(1 - y * y) * r;
      positions.push(Math.cos(a) * ring, y * r, Math.sin(a) * ring);
      color.set(['#dce7f8', '#bfd3ee', '#e8dfd0', '#d8dce7'][i % 4]);
      color.multiplyScalar(0.5 + rng() * 0.5);
      tints.push(color.r, color.g, color.b);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(tints, 3));
    const material = new THREE.PointsMaterial({
      map: starMap,
      size,
      sizeAttenuation: false,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    const points = new THREE.Points(geometry, material);
    points.name = 'star-layer-' + layer;
    stars.add(points);
    return points;
  });
  const meteor = group(root);
  meteor.name = 'shooting-star';
  const meteorMaterial = new THREE.MeshBasicMaterial({
    color: '#d9e7f6',
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
  cylinder(meteor, 0.002, 0.035, 2.6, [0, 1.3, 0], meteorMaterial, 8);
  sphere(meteor, 0.045, [0, 0, 0], meteorMaterial);
  meteor.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(-12, 5, -1).normalize(),
  );
  meteor.traverse((object) => {
    object.castShadow = object.receiveShadow = false;
  });
  return {
    update(time: number) {
      root.rotation.y = time * 0.0005;
      layers.forEach((layer, i) => {
        layer.material.opacity = 0.72 + Math.sin(time * 0.45 + i * 2.1) * 0.045;
      });
      const flight = ((time + 4) % 18) / 1.7;
      meteor.visible = flight < 1;
      if (meteor.visible) {
        meteor.position.set(-8 + flight * 12, 10 - flight * 5, -17 + flight);
        meteorMaterial.opacity = Math.sin(flight * Math.PI) * 0.7;
      }
    },
    dispose() {
      panoramaGeometry.dispose();
      disposeStory(
        root,
        [panoramaMaterial, meteorMaterial, ...layers.map((layer) => layer.material)],
        [panoramaMap, starMap],
      );
    },
  };
}
