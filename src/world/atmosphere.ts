import * as THREE from 'three';
import { canvasTexture, seeded } from './palette';

export class Atmosphere {
  readonly motes: THREE.Points;
  private particles: { sprite: THREE.Sprite; life: number; velocity: THREE.Vector3 }[] = [];
  private heart: THREE.CanvasTexture;
  constructor(scene: THREE.Scene) {
    const rng = seeded(551),
      positions = new Float32Array(65 * 3);
    for (let i = 0; i < 65; i++) {
      positions[i * 3] = rng() * 13 - 6.5;
      positions[i * 3 + 1] = rng() * 3.8 + 0.2;
      positions[i * 3 + 2] = rng() * 10 - 5;
    }
    const dust = canvasTexture(64, (ctx, s) => {
      const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, '#fff9e6');
      g.addColorStop(0.2, '#fff9e6ae');
      g.addColorStop(1, '#fff9e600');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, s, s);
    });
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.motes = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        map: dust,
        color: '#fff0c2',
        size: 0.047,
        transparent: true,
        opacity: 0.62,
        depthWrite: false,
        sizeAttenuation: true,
      }),
    );
    scene.add(this.motes);
    this.heart = canvasTexture(64, (ctx) => {
      ctx.fillStyle = '#d39277';
      ctx.beginPath();
      ctx.moveTo(32, 53);
      ctx.bezierCurveTo(27, 48, 8, 34, 8, 22);
      ctx.bezierCurveTo(8, 6, 28, 6, 32, 19);
      ctx.bezierCurveTo(36, 6, 56, 6, 56, 22);
      ctx.bezierCurveTo(56, 34, 37, 48, 32, 53);
      ctx.fill();
    });
    for (let i = 0; i < 12; i++) {
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: this.heart, transparent: true, depthWrite: false }),
      );
      sprite.visible = false;
      scene.add(sprite);
      this.particles.push({ sprite, life: 0, velocity: new THREE.Vector3() });
    }
  }
  hearts(position: THREE.Vector3, count = 4) {
    for (const p of this.particles.filter((p) => p.life <= 0).slice(0, count)) {
      p.life = 2.5;
      p.sprite.visible = true;
      p.sprite.position
        .copy(position)
        .add(new THREE.Vector3((Math.random() - 0.5) * 0.6, 1.6, (Math.random() - 0.5) * 0.3));
      p.velocity.set((Math.random() - 0.5) * 0.2, 0.35 + Math.random() * 0.13, 0);
      p.sprite.scale.setScalar(0.16 + Math.random() * 0.1);
    }
  }
  update(dt: number, time: number) {
    this.motes.rotation.y = Math.sin(time * 0.04) * 0.05;
    this.motes.position.y = Math.sin(time * 0.2) * 0.08;
    for (const p of this.particles) {
      if (p.life <= 0) continue;
      p.life -= dt;
      p.sprite.position.addScaledVector(p.velocity, dt);
      (p.sprite.material as THREE.SpriteMaterial).opacity = Math.min(1, p.life);
      p.sprite.visible = p.life > 0;
    }
  }
}
