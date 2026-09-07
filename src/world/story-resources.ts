import * as THREE from 'three';

export function disposeStory(
  root: THREE.Group,
  materials: THREE.Material[],
  textures: THREE.Texture[] = [],
) {
  root.removeFromParent();
  const geometries = new Set<THREE.BufferGeometry>();
  root.traverse((object) => {
    if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
      // Sphere primitives and palette materials are shared with the room and toys.
      if (!(object.geometry instanceof THREE.SphereGeometry)) geometries.add(object.geometry);
    }
  });
  for (const geometry of geometries) geometry.dispose();
  for (const texture of textures) texture.dispose();
  for (const material of materials) material.dispose();
}
