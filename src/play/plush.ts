import * as THREE from 'three';
import { FLOOR_Y } from '../world/room';
import { drawingOutline } from './drawing-data';

export class DrawnPlush {
  readonly root = new THREE.Group();
  readonly home = new THREE.Vector3(1.35, FLOOR_Y + 0.5, 0.75);
  name = '';
  private geometry?: THREE.ExtrudeGeometry;
  private face?: THREE.MeshStandardMaterial;
  private side?: THREE.MeshStandardMaterial;
  private texture?: THREE.CanvasTexture;
  private seam?: THREE.LineLoop;

  constructor(private scene: THREE.Scene) {
    this.root.name = 'drawn-plush';
    this.root.userData.drawnPlush = true;
    this.root.visible = false;
    scene.add(this.root);
  }

  create(canvas: HTMLCanvasElement, name: string) {
    const small = document.createElement('canvas');
    small.width = small.height = 128;
    const ctx = small.getContext('2d')!;
    ctx.drawImage(canvas, 0, 0, 128, 128);
    const rgba = ctx.getImageData(0, 0, 128, 128).data;
    const alpha = Uint8Array.from({ length: 128 * 128 }, (_, i) => rgba[i * 4 + 3]);
    const outline = drawingOutline(alpha, 128, 128);
    if (outline.length < 3) return false;
    const minX = Math.min(...outline.map((p) => p[0])),
      maxX = Math.max(...outline.map((p) => p[0]));
    const minY = Math.min(...outline.map((p) => p[1])),
      maxY = Math.max(...outline.map((p) => p[1]));
    const centerX = (minX + maxX) / 2,
      centerY = (minY + maxY) / 2;
    const unit = 0.86 / Math.max(maxX - minX, maxY - minY);
    const points = outline.map(
      ([x, y]) => new THREE.Vector2((x - centerX) * unit, (centerY - y) * unit),
    );
    const shape = new THREE.Shape(points);
    shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: 0.18,
      steps: 1,
      bevelEnabled: true,
      bevelSize: Math.min(0.018, unit * 0.8),
      bevelThickness: 0.075,
      bevelSegments: 5,
    });
    geometry.translate(0, 0, -0.09);
    const positions = geometry.attributes.position,
      uv = geometry.attributes.uv;
    for (let i = 0; i < positions.count; i++)
      uv.setXY(
        i,
        (positions.getX(i) / unit + centerX) / 128,
        1 - (centerY - positions.getY(i) / unit) / 128,
      );
    const fabric = document.createElement('canvas');
    fabric.width = fabric.height = 512;
    const paint = fabric.getContext('2d')!;
    paint.fillStyle = '#fff5df';
    paint.fillRect(0, 0, 512, 512);
    paint.drawImage(canvas, 0, 0, 512, 512);
    paint.fillStyle = '#8268450b';
    for (let y = 0; y < 512; y += 3) paint.fillRect(0, y, 512, 0.7);
    this.releaseArtwork();
    this.root.clear();
    this.geometry = geometry;
    this.texture = new THREE.CanvasTexture(fabric);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.anisotropy = 4;
    this.face = new THREE.MeshStandardMaterial({ map: this.texture, roughness: 1 });
    this.side = new THREE.MeshStandardMaterial({ color: '#e6d5b4', roughness: 1 });
    const body = new THREE.Mesh(geometry, [this.face, this.side]);
    body.name = 'drawing-cushion';
    body.castShadow = body.receiveShadow = true;
    this.root.add(body);
    const seamGeometry = new THREE.BufferGeometry().setFromPoints(
      points.map((p) => new THREE.Vector3(p.x, p.y, 0)),
    );
    this.seam = new THREE.LineLoop(
      seamGeometry,
      new THREE.LineDashedMaterial({ color: '#b7a482', dashSize: 0.018, gapSize: 0.016 }),
    );
    this.seam.computeLineDistances();
    this.root.add(this.seam);
    this.name = name;
    this.home.y = FLOOR_Y + ((maxY - minY) * unit) / 2 + 0.04;
    this.root.visible = true;
    this.putHome();
    return true;
  }

  putHome() {
    this.scene.add(this.root);
    this.root.position.copy(this.home);
    this.root.rotation.set(-0.12, 0.38, 0.05);
    this.root.scale.setScalar(1);
  }
  private releaseArtwork() {
    this.geometry?.dispose();
    this.texture?.dispose();
    this.face?.dispose();
    this.side?.dispose();
    this.seam?.geometry.dispose();
    (this.seam?.material as THREE.Material | undefined)?.dispose();
  }
  dispose() {
    this.releaseArtwork();
    this.root.removeFromParent();
  }
}
