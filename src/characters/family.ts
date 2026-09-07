import * as THREE from 'three';
import type { Navigation, Point } from '../world/navigation';
import { FLOOR_Y } from '../world/room';
import { Character } from './rig';
import { turnToward } from './actions';
import { moveAlongPath } from './director';

type ParentKind = 'mom' | 'dad';
interface Visit {
  character: Character;
  state: 'away' | 'entering' | 'visiting' | 'leaving';
  path: Point[];
  elapsed: number;
  entrance: Point;
}

export class Family {
  visits: Record<ParentKind, Visit>;
  nextVisit = 27;
  auto = true;

  constructor(
    scene: THREE.Scene,
    readonly navigation: Navigation,
    readonly child: Character,
    readonly announce: (kind: ParentKind, text: string) => void,
  ) {
    const createVisit = (kind: ParentKind): Visit => {
      const character = new Character(kind);
      character.root.visible = false;
      scene.add(character.root);
      return {
        character,
        state: 'away',
        path: [],
        elapsed: 0,
        entrance: { x: kind === 'mom' ? 6.85 : 5.95, z: 5.55 },
      };
    };
    this.visits = { mom: createVisit('mom'), dad: createVisit('dad') };
  }

  invite(kind: ParentKind) {
    const visitor = this.visits[kind];
    if (visitor.state !== 'away') {
      this.announce(kind, kind === 'mom' ? '妈妈在这里，慢慢玩呀。' : '爸爸已经加入你的小世界啦。');
      return;
    }
    const position = this.child.root.position;
    const offsets =
      kind === 'mom'
        ? [
            [1.4, 0.9],
            [-1.4, 1.0],
            [0, 1.65],
            [1.7, 0],
          ]
        : [
            [-1.4, 1.0],
            [1.4, 1.1],
            [0, -1.7],
            [-1.7, 0],
          ];
    const targets = offsets.map(([x, z]) => ({ x: position.x + x, z: position.z + z }));
    targets.push({ x: kind === 'mom' ? 1.0 : -1.2, z: 1.1 });
    const reserved = Object.values(this.visits)
      .filter((v) => v !== visitor && v.state !== 'away')
      .map((v) => v.path.at(-1) ?? v.character.root.position);
    const paths = targets
      .filter(
        (p) =>
          this.navigation.isFree(p) &&
          reserved.every((q) => Math.hypot(p.x - q.x, p.z - q.z) > 1.05),
      )
      .map((p) => this.navigation.findPath(visitor.entrance, p));
    const path = paths.find((p) => p.length);
    if (!path) return;
    visitor.character.root.position.set(visitor.entrance.x, FLOOR_Y, visitor.entrance.z);
    visitor.character.root.visible = true;
    visitor.state = 'entering';
    visitor.path = path;
    visitor.elapsed = 0;
    this.announce(
      kind,
      kind === 'mom' ? '妈妈来啦，带着一个大大的拥抱。' : '爸爸来串门：这里还缺一个玩伴吗？',
    );
    this.nextVisit = 46 + Math.random() * 30;
  }

  update(dt: number, time: number) {
    if (this.auto) {
      this.nextVisit -= dt;
      if (this.nextVisit <= 0) {
        const away = (['mom', 'dad'] as const).filter((k) => this.visits[k].state === 'away');
        if (away.length) this.invite(away[Math.floor(Math.random() * away.length)]);
        else this.nextVisit = 15;
      }
    }
    for (const visitor of Object.values(this.visits)) {
      if (visitor.state === 'away') continue;
      visitor.elapsed += dt;
      const c = visitor.character;
      if (visitor.state === 'entering' || visitor.state === 'leaving') {
        const finished = moveAlongPath(c, visitor.path, 0.84, dt, time);
        if (finished) {
          if (visitor.state === 'leaving') {
            visitor.state = 'away';
            c.root.visible = false;
          } else {
            visitor.state = 'visiting';
            visitor.elapsed = 0;
          }
        }
      } else {
        const t = visitor.elapsed,
          dx = this.child.root.position.x - c.root.position.x,
          dz = this.child.root.position.z - c.root.position.z;
        turnToward(c.root, Math.atan2(dx, dz), dt);
        const wave = t < 3.5 || t > 12;
        const kneel = !wave && c.kind === 'mom';
        c.applyPose(
          {
            headX: 0.17,
            headZ: Math.sin(time * 0.85) * 0.04,
            bounce: kneel ? -0.24 : 0,
            legL: kneel ? -0.65 : 0,
            legR: kneel ? -0.65 : 0,
            kneeL: kneel ? 1.06 : 0,
            kneeR: kneel ? 1.06 : 0,
            armR: wave ? -0.6 : -0.5,
            spreadR: wave ? 1.25 + Math.sin(time * 6.5) * 0.16 : 0.1,
            elbowR: wave ? -1.1 : -0.7,
            armL: kneel ? -0.65 : -0.06,
            elbowL: kneel ? -0.8 : -0.12,
          },
          dt,
          time,
        );
        if (t > 15) {
          const path = this.navigation.findPath(c.root.position, visitor.entrance);
          if (path.length) {
            visitor.path = path;
            visitor.state = 'leaving';
            visitor.elapsed = 0;
          }
        }
      }
    }
  }
}
