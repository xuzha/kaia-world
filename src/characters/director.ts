import * as THREE from 'three';
import { Navigation, type Point } from '../world/navigation';
import { FLOOR_Y } from '../world/room';
import type { Toy, ToyId } from '../toys/types';
import { Character, runningPose, walkingPose, type Pose } from './rig';
import { actionFrame, ease, turnToward } from './actions';

export interface PlayEvent {
  type: 'walk' | 'pace' | 'play' | 'finish' | 'queue' | 'idle';
  toy?: Toy;
  running?: boolean;
}

export class PlayDirector {
  state: 'idle' | 'walking' | 'playing' = 'idle';
  current?: Toy;
  queued?: Toy;
  visited = new Set<ToyId>();
  auto = true;
  elapsed = 0;
  idleTime = 2.2;
  path: Point[] = [];
  speed = 0.94;
  private journey = 0;
  private runRemaining = 0;
  private travelTime = 0;
  private strideTime = 0;
  private wasRunning = false;
  private entry = new THREE.Vector3();
  private recent: ToyId[] = [];

  constructor(
    readonly character: Character,
    readonly toys: Toy[],
    readonly navigation: Navigation,
    readonly onEvent: (event: PlayEvent) => void,
  ) {
    character.root.position.set(-0.05, FLOOR_Y, 0.65);
    character.root.rotation.y = 0.42;
  }

  get running() {
    return this.state === 'walking' && this.speed > 1.18;
  }

  request(id: ToyId) {
    const toy = this.toys.find((t) => t.id === id);
    if (!toy) return;
    if (this.state === 'playing') {
      if (this.current?.id === id) return;
      this.queued = toy;
      this.onEvent({ type: 'queue', toy });
    } else this.goTo(toy);
  }

  private goTo(toy: Toy) {
    const path = this.navigation.findPath(this.character.root.position, toy.destination);
    if (!path.length) return false;
    this.current = toy;
    this.path = path;
    this.elapsed = 0;
    this.runRemaining = this.journey++ % 2 === 0 ? 2.8 : 0;
    this.travelTime = 0;
    this.wasRunning = false;
    if (this.state !== 'walking') {
      this.speed = 0.94;
      this.strideTime = 0;
    }
    this.state = 'walking';
    this.character.clearProps();
    this.onEvent({ type: 'walk', toy });
    return true;
  }

  randomToy() {
    const candidates = this.toys.filter(
      (t) => !this.recent.includes(t.id) && t.id !== this.current?.id,
    );
    const unvisited = candidates.filter((t) => !this.visited.has(t.id));
    const pool = unvisited.length ? unvisited : candidates;
    return pool[Math.floor(Math.random() * pool.length)] ?? this.toys[0];
  }

  wander() {
    this.request(this.randomToy().id);
  }

  update(dt: number, time: number) {
    if (this.state === 'idle') {
      this.idleTime -= dt;
      const wave = time < 3;
      this.character.applyPose(
        {
          headY: Math.sin(time * 0.7) * 0.16,
          headZ: Math.sin(time * 0.5) * 0.055,
          armR: wave ? -0.6 : 0.03,
          spreadR: wave ? 1.5 + Math.sin(time * 8) * 0.15 : 0.13,
          elbowR: wave ? -0.9 : -0.12,
        },
        dt,
        time,
      );
      if (this.idleTime <= 0 && (this.auto || this.queued)) {
        const next = this.queued ?? this.randomToy();
        this.queued = undefined;
        if (!this.goTo(next)) this.idleTime = 2;
      }
      return;
    }
    if (this.state === 'walking') {
      this.travelTime += dt;
      const canRun = this.runRemaining > 0 && this.travelTime > 0.65 && this.hasRunningRoom();
      const targetSpeed = canRun ? 1.7 : 0.94;
      this.speed += THREE.MathUtils.clamp(targetSpeed - this.speed, -2.8 * dt, 1.2 * dt);
      const amount = THREE.MathUtils.smoothstep(this.speed, 0.94, 1.7);
      if (this.running) this.runRemaining -= dt;
      this.strideTime += dt * (1 + amount * 0.35);
      const arrived = moveAlongPath(
        this.character,
        this.path,
        this.speed,
        dt,
        time,
        runningPose(this.strideTime, amount),
      );
      // Fit the smoothed feet first, then add the brief flight between alternating footfalls.
      this.character.supportGround(Math.max(0, Math.cos(this.strideTime * 17.4)) * 0.085 * amount);
      if (this.running !== this.wasRunning) {
        this.wasRunning = this.running;
        this.onEvent({ type: 'pace', toy: this.current, running: this.running });
      }
      if (arrived) {
        this.state = 'playing';
        this.elapsed = 0;
        this.entry.copy(this.character.root.position);
        this.onEvent({ type: 'play', toy: this.current });
      }
      return;
    }
    this.elapsed = Math.min(this.elapsed + dt, this.current!.duration);
    const toy = this.current!,
      frame = actionFrame({ character: this.character, toy, elapsed: this.elapsed, time });
    const target = new THREE.Vector3(
      toy.position[0] + frame.position[0],
      FLOOR_Y + frame.position[1],
      toy.position[1] + frame.position[2],
    );
    this.character.root.position.lerpVectors(this.entry, target, ease(this.elapsed / 1.15));
    turnToward(this.character.root, frame.yaw, dt);
    this.character.applyPose(frame.pose, dt, time);
    const supportHeight = frame.supportHeight;
    if (supportHeight)
      this.character.supportOn(
        (x, z) => FLOOR_Y + supportHeight(x - toy.position[0], z - toy.position[1]),
      );
    if (this.elapsed >= toy.duration) {
      toy.reset?.();
      this.character.clearProps();
      this.character.root.position.y = FLOOR_Y;
      this.visited.add(toy.id);
      this.recent.push(toy.id);
      if (this.recent.length > 2) this.recent.shift();
      this.state = 'idle';
      this.idleTime = this.queued ? 0.4 : 2.2 + Math.random() * 2.2;
      this.onEvent({ type: 'finish', toy });
    }
  }

  private hasRunningRoom() {
    const position = this.character.root.position,
      next = this.path[0];
    if (!next) return false;
    const dx = next.x - position.x,
      dz = next.z - position.z,
      distance = Math.hypot(dx, dz);
    // Leave enough space to brake and finish at walking pace before any turn or toy.
    if (distance < 1.65) return false;
    const yaw = Math.atan2(dx, dz) - this.character.root.rotation.y;
    if (Math.abs(Math.atan2(Math.sin(yaw), Math.cos(yaw))) > 0.3) return false;
    const ux = dx / distance,
      uz = dz / distance;
    for (const side of [-0.22, 0, 0.22]) {
      const from = { x: position.x - uz * side, z: position.z + ux * side };
      if (!this.navigation.clearLine(from, { x: from.x + ux * 1.5, z: from.z + uz * 1.5 }))
        return false;
    }
    return true;
  }
}

export function moveAlongPath(
  character: Character,
  path: Point[],
  speed: number,
  dt: number,
  time: number,
  pose: Partial<Pose> = walkingPose(time, speed / 0.94),
) {
  let distance = speed * dt;
  while (path.length && distance > 0) {
    const next = path[0],
      dx = next.x - character.root.position.x,
      dz = next.z - character.root.position.z;
    const remaining = Math.hypot(dx, dz);
    if (remaining < 1e-8) {
      path.shift();
      continue;
    }
    const step = Math.min(distance, remaining);
    character.root.position.x += (dx / remaining) * step;
    character.root.position.z += (dz / remaining) * step;
    turnToward(character.root, Math.atan2(dx, dz), dt);
    distance -= step;
    if (step === remaining) path.shift();
  }
  character.root.position.y = FLOOR_Y;
  character.applyPose(pose, dt, time);
  return path.length === 0;
}
