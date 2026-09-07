import * as THREE from 'three';
import { PlayDirector, moveAlongPath } from '../characters/director';
import { ease, turnToward } from '../characters/actions';
import type { Pose } from '../characters/rig';
import type { Obstacle, Point } from '../world/navigation';
import { FLOOR_Y } from '../world/room';
import { box, group, sphere } from '../world/primitives';
import { colors, material } from '../world/palette';
import type { Toy } from '../toys/types';
import { DrawnPlush } from './plush';

export type TogetherMode = 'roll' | 'hide' | 'bubbles' | 'plush';
const rollSeat = { x: 0.55, z: 0.7 };
const ballNear = 1.44,
  ballFar = 3.55;
const hidingPlaces = [
  { x: -2.15, z: 0.05, name: '靠枕后面', color: colors.sage },
  { x: 3.05, z: 1.5, name: '小篮子里', color: colors.oat },
  { x: 0.0, z: 4.75, name: '野餐毯下', color: colors.coral },
];
interface Bubble {
  mesh: THREE.Mesh;
  life: number;
  velocity: THREE.Vector3;
}

export class Together {
  mode?: TogetherMode;
  pending?: TogetherMode;
  phase = 'idle';
  status = '';
  elapsed = 0;
  rounds = 0;
  popped = 0;
  hiddenAt = -1;
  readonly covers = group();
  readonly bubbles = group();
  private lids: THREE.Object3D[] = [];
  private spots: THREE.Group[] = [];
  private particles: Bubble[] = [];
  private bubbleGeometry = new THREE.SphereGeometry(1, 20, 14);
  private bubbleMaterial = new THREE.MeshPhysicalMaterial({
    color: '#a5c8c3',
    roughness: 0.06,
    metalness: 0.05,
    transparent: true,
    opacity: 0.48,
    depthWrite: false,
    iridescence: 1,
    iridescenceIOR: 1.33,
    clearcoat: 1,
  });
  private ball: Toy;
  private bear: THREE.Object3D;
  private bearHome: {
    parent: THREE.Object3D;
    position: THREE.Vector3;
    rotation: THREE.Euler;
    scale: THREE.Vector3;
  };
  private path: Point[] = [];
  private searchOrder: number[] = [];
  private searchIndex = 0;
  private hidingObstacles: Obstacle[] = hidingPlaces.map((p) => ({
    x: p.x,
    z: p.z,
    halfX: 0.45,
    halfZ: 0.41,
  }));
  private plushRelease = new THREE.Vector3();
  private target = new THREE.Vector3();

  constructor(
    private scene: THREE.Scene,
    private director: PlayDirector,
    private plush: DrawnPlush,
    private onChange: () => void,
    private react: (text: string, hearts?: boolean) => void,
  ) {
    this.ball = director.toys.find((t) => t.id === 'ball')!;
    this.bear = director.toys.find((t) => t.id === 'tea')!.parts.bear;
    this.bearHome = {
      parent: this.bear.parent!,
      position: this.bear.position.clone(),
      rotation: this.bear.rotation.clone(),
      scale: this.bear.scale.clone(),
    };
    scene.add(this.covers, this.bubbles);
    this.covers.visible = this.bubbles.visible = false;
    this.covers.name = 'hiding-places';
    this.bubbles.name = 'shared-bubbles';
    hidingPlaces.forEach((spot, i) => {
      const root = group(this.covers, [spot.x, FLOOR_Y, spot.z]);
      root.userData.hidingSpot = i;
      const lid = box(root, [0.86, 0.68, 0.78], [0, 0.35, 0], material(spot.color, 'fabric'), 0.18);
      box(lid, [0.25, 0.045, 0.08], [0, 0.36, 0], colors.cream, 0.02);
      this.spots.push(root);
      this.lids.push(lid);
    });
    for (let i = 0; i < 48; i++) {
      const bubble = new THREE.Mesh(this.bubbleGeometry, this.bubbleMaterial);
      bubble.visible = false;
      bubble.userData.bubble = i;
      this.bubbles.add(bubble);
      const glint = sphere(
        bubble,
        [0.13, 0.24, 0.04],
        [-0.37, 0.48, 0.75],
        new THREE.MeshBasicMaterial({
          color: '#fffcf1',
          transparent: true,
          opacity: 0.75,
          depthWrite: false,
        }),
      );
      glint.rotation.z = -0.4;
      glint.castShadow = false;
      this.particles.push({ mesh: bubble, life: 0, velocity: new THREE.Vector3() });
    }
  }

  get busy() {
    return !!(this.mode || this.pending);
  }
  get bubbleCount() {
    return this.particles.filter((p) => p.life > 0).length;
  }

  request(mode: TogetherMode) {
    if (
      this.mode === mode ||
      this.pending === mode ||
      (mode === 'plush' && !this.plush.root.visible)
    )
      return;
    this.stop(false);
    this.director.queued = undefined;
    this.rounds = 0;
    this.hiddenAt = -1;
    this.pending = mode;
    this.phase = 'waiting';
    this.setStatus(
      this.director.state === 'playing'
        ? '等 Kaia 玩好手上的玩具，安全下来就来找你。'
        : 'Kaia 这就来陪你玩。',
    );
  }

  stop(notify = true) {
    if (this.mode === 'roll') this.ball.reset?.();
    if (this.mode === 'hide') {
      this.bearHome.parent.add(this.bear);
      this.bear.position.copy(this.bearHome.position);
      this.bear.rotation.copy(this.bearHome.rotation);
      this.bear.scale.copy(this.bearHome.scale);
      this.bear.visible = true;
    }
    if (this.mode === 'plush') this.plush.putHome();
    this.covers.visible = this.bubbles.visible = false;
    for (const obstacle of this.hidingObstacles) {
      const index = this.director.navigation.obstacles.indexOf(obstacle);
      if (index >= 0) this.director.navigation.obstacles.splice(index, 1);
    }
    for (const bubble of this.particles) {
      bubble.life = 0;
      bubble.mesh.visible = false;
    }
    if (this.mode) {
      this.director.character.clearProps();
      this.director.idleTime = 2.2;
    }
    this.mode = this.pending = undefined;
    this.path = [];
    this.phase = 'idle';
    if (notify) this.onChange();
  }

  private setStatus(text: string) {
    this.status = text;
    this.onChange();
  }
  private walkTo(destination: Point, message: string) {
    this.path = this.director.navigation.findPath(
      this.director.character.root.position,
      destination,
    );
    if (!this.path.length) {
      this.stop();
      this.react('这里有点挤，先陪我回到软垫上吧。');
      return;
    }
    this.phase = 'walking';
    this.elapsed = 0;
    this.setStatus(message);
  }

  private start(mode: TogetherMode) {
    this.mode = mode;
    this.pending = undefined;
    this.director.state = 'idle';
    this.director.current = undefined;
    this.director.path = [];
    this.director.character.clearProps();
    this.elapsed = 0;
    this.rounds = 0;
    if (mode === 'roll') {
      this.positionBall(ballFar);
      this.walkTo(rollSeat, '等她坐好，就可以把小球滚过去啦。');
    } else if (mode === 'hide') {
      this.hiddenAt = -1;
      this.walkTo(rollSeat, '等她站好，再把小熊藏起来。');
    } else if (mode === 'bubbles') {
      this.bubbles.visible = true;
      this.popped = 0;
      this.walkTo(rollSeat, 'Kaia 过来啦，先吹几个泡泡迎接她。');
    } else {
      this.walkTo(
        { x: this.plush.home.x, z: this.plush.home.z + 0.83 },
        `去认识你画的「${this.plush.name}」。`,
      );
    }
  }

  update(dt: number, time: number) {
    if (this.pending) {
      if (this.director.state === 'playing') return false;
      this.start(this.pending);
    }
    if (!this.mode) return false;
    this.elapsed += dt;
    const kaia = this.director.character;
    if (this.mode === 'bubbles') this.updateBubbles(dt, time);
    if (this.path.length) {
      if (moveAlongPath(kaia, this.path, 1.02, dt, time)) {
        this.elapsed = 0;
        if (this.mode === 'hide') {
          if (this.hiddenAt < 0) this.hideAgain();
          else {
            this.phase = 'checking';
            this.setStatus(`她在${hidingPlaces[this.searchOrder[this.searchIndex]].name}找一找…`);
          }
        } else if (this.mode === 'plush') {
          this.phase = 'hugging';
          this.setStatus(`「${this.plush.name}」，可以抱抱你吗？`);
          this.react('这是你画给我的呀！');
        } else {
          this.phase = 'ready';
          this.setStatus(
            this.mode === 'roll'
              ? '她坐好啦。点小球，或按下面的按钮传球。'
              : '吹几个泡泡，看她伸手去够。点泡泡还可以戳破。',
          );
        }
      }
      return true;
    }
    if (this.mode === 'roll') this.updateRoll(dt, time);
    else if (this.mode === 'hide') this.updateHide(dt, time);
    else if (this.mode === 'plush') this.updatePlush(dt, time);
    else {
      const floating = this.particles.find((p) => p.life > 0 && p.mesh.position.y > 1.1);
      const yaw = floating
        ? Math.atan2(
            floating.mesh.position.x - kaia.root.position.x,
            floating.mesh.position.z - kaia.root.position.z,
          )
        : 0.3;
      turnToward(kaia.root, yaw, dt);
      kaia.applyPose(
        {
          grounded: 1,
          headX: floating ? -0.3 : -0.06,
          armR: floating ? -2.1 + Math.sin(time * 2) * 0.2 : -0.4,
          elbowR: -0.3,
          spreadR: 0.25,
          bounce: floating ? Math.max(0, Math.sin(time * 2.5)) * 0.045 : 0,
        },
        dt,
        time,
      );
    }
    return true;
  }

  roll() {
    if (this.mode !== 'roll' || this.phase !== 'ready') return;
    this.phase = 'outgoing';
    this.elapsed = 0;
    this.setStatus('小球滚过去啦…她伸手接住了！');
  }
  private positionBall(z: number) {
    const ball = this.ball.parts.ball,
      oldZ = ball.position.z;
    ball.position.set(rollSeat.x - this.ball.position[0], 0.34, z - this.ball.position[1]);
    ball.rotation.x += (ball.position.z - oldZ) / 0.34;
    this.ball.parts.shadow.position.set(ball.position.x, 0.016, ball.position.z);
    this.ball.parts.shadow.scale.setScalar(1);
  }
  private updateRoll(dt: number, time: number) {
    if (this.phase === 'outgoing') {
      this.positionBall(THREE.MathUtils.lerp(ballFar, ballNear, ease(this.elapsed / 1.65)));
      if (this.elapsed >= 1.65) {
        this.phase = 'catching';
        this.elapsed = 0;
        this.react('接住啦！轮到我～');
      }
    } else if (this.phase === 'catching' && this.elapsed >= 0.75) {
      this.phase = 'returning';
      this.elapsed = 0;
      this.setStatus('轮到 Kaia。她把小球滚回你这边。');
    } else if (this.phase === 'returning') {
      this.positionBall(THREE.MathUtils.lerp(ballNear, ballFar, ease(this.elapsed / 1.8)));
      if (this.elapsed >= 1.8) {
        this.phase = 'ready';
        this.elapsed = 0;
        this.rounds++;
        this.setStatus('到你啦！她还想再来一次。');
        this.react('还要，还要！', true);
      }
    }
    turnToward(this.director.character.root, 0, dt);
    this.director.character.applyPose(
      {
        grounded: 1,
        bounce: -0.26,
        legL: -1.2,
        legR: -1.2,
        kneeL: 1.25,
        kneeR: 1.25,
        headX: 0.16,
        lean: 0.08,
        armL: this.phase === 'ready' ? -0.7 : -1.1,
        armR: this.phase === 'ready' ? -0.7 : -1.1,
        elbowL: -0.45,
        elbowR: -0.45,
        spreadL: -0.18,
        spreadR: 0.18,
      },
      dt,
      time,
    );
  }

  hide(index: number) {
    if (
      this.mode !== 'hide' ||
      this.phase !== 'choosing' ||
      !Number.isInteger(index) ||
      !this.spots[index]
    )
      return;
    this.hiddenAt = index;
    this.spots[index].add(this.bear);
    this.bear.position.set(0, 0.045, 0);
    this.bear.rotation.set(0, 0, 0);
    this.bear.scale.setScalar(0.63);
    this.bear.visible = true;
    this.searchOrder = [(index + 1 + Math.floor(Math.random() * 2)) % 3, index];
    this.searchIndex = 0;
    this.searchNext();
    this.react('藏好了吗？我来找你啦！');
  }
  hideAgain() {
    if (this.mode !== 'hide') return;
    this.covers.visible = true;
    for (const obstacle of this.hidingObstacles)
      if (!this.director.navigation.obstacles.includes(obstacle))
        this.director.navigation.obstacles.push(obstacle);
    this.hiddenAt = -1;
    this.bear.visible = false;
    this.lids.forEach((lid) => {
      lid.position.set(0, 0.35, 0);
      lid.rotation.z = 0;
    });
    this.phase = 'choosing';
    this.elapsed = 0;
    this.setStatus('她捂住眼睛啦。点一个藏身处，把小熊藏起来。');
  }
  private searchNext() {
    const spot = hidingPlaces[this.searchOrder[this.searchIndex]];
    this.walkTo({ x: spot.x, z: spot.z + 0.94 }, `她去${spot.name}看看，跟上小脚步…`);
  }
  private updateHide(dt: number, time: number) {
    const kaia = this.director.character;
    let pose: Partial<Pose>;
    if (this.phase === 'choosing') {
      turnToward(kaia.root, 0.3, dt);
      pose = {
        armL: -2.2,
        armR: -2.2,
        elbowL: -1.65,
        elbowR: -1.65,
        spreadL: 0.36,
        spreadR: -0.36,
        headX: 0.08,
      };
    } else {
      turnToward(kaia.root, Math.PI, dt);
      const index = this.searchOrder[this.searchIndex],
        reveal = ease((this.elapsed - 0.3) / 0.7);
      this.lids[index].position.set(reveal * 0.62, 0.35 + reveal * 0.28, 0);
      this.lids[index].rotation.z = -reveal * 0.3;
      pose = {
        bounce: -0.17,
        legL: -0.75,
        legR: -0.75,
        kneeL: 1.1,
        kneeR: 1.1,
        lean: 0.12,
        headX: 0.24,
        armR: -0.9,
        elbowR: -0.3,
      };
      if (this.phase === 'checking' && this.elapsed >= 1.6) {
        if (index === this.hiddenAt) {
          this.phase = 'found';
          this.rounds++;
          this.setStatus('找到小熊啦！再藏一次，还是陪它坐一会儿？');
          this.react('原来你在这里！', true);
        } else {
          this.searchIndex++;
          this.react('咦，不在这里。再找找！');
          this.searchNext();
        }
      }
      if (this.phase === 'found') {
        pose = { grounded: 1, armR: -0.65, spreadR: 1.1, elbowR: -0.85, headZ: 0.08, headX: 0.2 };
        this.bear.position.y = 0.045 + Math.max(0, Math.sin(time * 3)) * 0.065;
      }
    }
    kaia.applyPose({ ...pose, grounded: 1 }, dt, time);
  }

  blow(count = 8) {
    if (this.mode !== 'bubbles') return;
    const available = this.particles.filter((p) => p.life <= 0).slice(0, Math.min(12, count));
    for (const p of available) {
      p.life = 8 + Math.random() * 2;
      p.mesh.visible = true;
      p.mesh.position.set(
        0.55 + (Math.random() - 0.5) * 1.5,
        FLOOR_Y + 0.45 + Math.random() * 0.2,
        3.0 + Math.random() * 0.3,
      );
      p.mesh.scale.setScalar(0.13 + Math.random() * 0.2);
      p.velocity.set(
        (Math.random() - 0.5) * 0.22,
        0.24 + Math.random() * 0.22,
        -0.25 - Math.random() * 0.12,
      );
    }
    if (available.length) this.react('好多圆圆的小彩虹！');
    this.onChange();
  }
  pop(index: number) {
    const bubble = this.particles[index];
    if (this.mode !== 'bubbles' || !bubble || bubble.life <= 0) return;
    bubble.life = 0;
    bubble.mesh.visible = false;
    this.popped++;
    this.react('啵！再吹一个吧。', true);
    this.setStatus(`啵！已经戳破 ${this.popped} 个小泡泡。`);
  }
  private updateBubbles(dt: number, time: number) {
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (p.life <= 0) continue;
      p.life -= dt;
      p.mesh.position.addScaledVector(p.velocity, dt);
      p.mesh.position.x += Math.sin(time * 1.5 + i) * dt * 0.08;
      if (p.life < 0.45) p.mesh.scale.multiplyScalar(Math.exp(-dt * 4));
      p.mesh.visible = p.life > 0;
    }
  }

  hugAgain() {
    if (this.mode !== 'plush' || this.phase !== 'ready') return;
    this.phase = 'hugging';
    this.elapsed = 0;
    this.setStatus(`再给「${this.plush.name}」一个软软的拥抱。`);
  }
  private updatePlush(dt: number, time: number) {
    const kaia = this.director.character,
      t = this.elapsed;
    const hugging = this.phase === 'hugging';
    const holding = hugging && t >= 1.2 && t < 6.5;
    turnToward(kaia.root, holding && t > 2 ? 0.35 : Math.PI, dt);
    kaia.applyPose(
      {
        grounded: 1,
        armL: hugging ? -1.15 : -0.1,
        armR: hugging ? -1.15 : -0.1,
        elbowL: hugging ? -0.72 : -0.12,
        elbowR: hugging ? -0.72 : -0.12,
        spreadL: hugging ? 0.1 : -0.13,
        spreadR: hugging ? -0.1 : 0.13,
        headX: hugging ? 0.14 : 0.04,
        sway: holding ? Math.sin(time * 2.6) * 0.06 : 0,
        headZ: holding ? Math.sin(time * 1.3) * 0.09 : 0,
      },
      dt,
      time,
    );
    if (!hugging) return;
    kaia.body.updateWorldMatrix(true, true);
    if (t < 1.2) {
      const lift = ease(t / 1.2);
      this.target.set(0, 0.7, 0.49);
      kaia.body.localToWorld(this.target);
      this.plush.root.position.lerpVectors(this.plush.home, this.target, lift);
      this.plush.root.scale.setScalar(THREE.MathUtils.lerp(1, 0.72, lift));
    } else if (holding) {
      if (this.plush.root.parent !== kaia.body) {
        kaia.body.add(this.plush.root);
        this.setStatus(`把「${this.plush.name}」抱进怀里，轻轻摇一摇。`);
        this.react('软软的，喜欢你！', true);
      }
      this.plush.root.position.set(0, 0.7, 0.49);
      this.plush.root.rotation.set(0, 0, Math.sin(time * 2.6) * 0.025);
      this.plush.root.scale.setScalar(0.72);
    } else {
      if (this.plush.root.parent !== this.scene) {
        this.scene.attach(this.plush.root);
        this.plushRelease.copy(this.plush.root.position);
      }
      const lower = ease((t - 6.5) / 1.5);
      this.plush.root.position.lerpVectors(this.plushRelease, this.plush.home, lower);
      this.plush.root.scale.setScalar(THREE.MathUtils.lerp(0.72, 1, lower));
      if (t >= 8) {
        this.plush.putHome();
        this.phase = 'ready';
        this.setStatus(`「${this.plush.name}」有了第一个好朋友。想再抱抱它吗？`);
      }
    }
  }

  inspection() {
    return {
      mode: this.mode,
      pending: this.pending,
      phase: this.phase,
      elapsed: this.elapsed,
      rounds: this.rounds,
      hiddenAt: this.hiddenAt,
      bubbles: this.bubbleCount,
      popped: this.popped,
      destinations: hidingPlaces.map((p) => ({
        x: p.x,
        z: p.z + 0.94,
        free: this.director.navigation.isFree({ x: p.x, z: p.z + 0.94 }),
      })),
    };
  }
  dispose() {
    this.stop(false);
    this.bubbleGeometry.dispose();
    this.bubbleMaterial.dispose();
    this.covers.removeFromParent();
    this.bubbles.removeFromParent();
  }
}
