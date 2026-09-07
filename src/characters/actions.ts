import * as THREE from 'three';
import type { Toy, ActionId } from '../toys/types';
import { castleDeckHeight, slideCurve, slideHeightAt } from '../toys/castle';
import { bookRestPosition } from '../toys/books';
import { Character, restPose, walkingPose, type Pose } from './rig';

export const ease = (value: number) => {
  const t = THREE.MathUtils.clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
};
const lerp = THREE.MathUtils.lerp;

export interface ActionContext {
  character: Character;
  toy: Toy;
  elapsed: number;
  time: number;
}
interface ActionFrame {
  position: [number, number, number];
  yaw: number;
  pose: Partial<Pose>;
  supportHeight?: (x: number, z: number) => number;
}
type Action = (context: ActionContext) => ActionFrame;
const sitting: Partial<Pose> = {
  bounce: -0.29,
  legL: -1.3,
  legR: -1.3,
  kneeL: 1.19,
  kneeR: 1.19,
  armL: -0.6,
  armR: -0.6,
  elbowL: -0.65,
  elbowR: -0.65,
};
const squat: Partial<Pose> = {
  bounce: -0.2,
  legL: -0.8,
  legR: -0.8,
  kneeL: 1.31,
  kneeR: 1.31,
  lean: 0.1,
};
const towardToy = (toy: Toy) =>
  Math.atan2(toy.lookAt[0] - toy.approach[0], toy.lookAt[1] - toy.approach[1]);

function slideFrame(progress: number, seated = 1): ActionFrame {
  const point = slideCurve.getPoint(progress);
  const tangent = slideCurve.getTangent(progress);
  const slope = Math.max(0, Math.atan2(-tangent.y, tangent.z));
  const lean = -0.12 * seated;
  const leg = (-Math.PI / 2 + slope) * seated - lean;
  return {
    position: [point.x, point.y, point.z],
    yaw: 0,
    supportHeight: (_x, z) => slideHeightAt(z),
    pose: {
      bounce: -0.345 * (1 - Math.cos((Math.PI / 2) * seated)),
      lean,
      legL: leg,
      legR: leg,
      kneeL: 0,
      kneeR: 0,
      armL: -1.2,
      armR: -1.4,
      elbowL: -0.2,
      elbowR: -0.2,
      spreadL: -0.15,
      spreadR: 0.15,
      headX: -0.08,
    },
  };
}

/** Each action owns its pose and prop motion; the director handles travel and transitions. */
export const actions: Record<ActionId, Action> = {
  read({ character, toy, elapsed: t, time }) {
    character.book.position.set(0, 0.74, 0.41);
    character.book.rotation.x = 0.18;
    const pickup = ease(t / 1.2),
      putDown = ease((t - toy.duration + 1.2) / 1.2);
    const transfer = pickup * (1 - putDown);
    const heldPosition = toy.root.worldToLocal(
      character.book.getWorldPosition(new THREE.Vector3()),
    );
    toy.parts.book.position.lerpVectors(bookRestPosition, heldPosition, transfer);
    toy.parts.book.rotation.set(
      0.18 * transfer,
      lerp(-0.2, character.root.rotation.y, transfer),
      0,
    );
    toy.parts.book.scale.setScalar(lerp(1.3, 1, transfer));
    character.book.visible = t >= 1.2 && t <= toy.duration - 1.2;
    toy.parts.book.visible = !character.book.visible;
    const page = character.book.getObjectByName('page')!;
    const turn = (t % 5) / 1.6;
    page.rotation.z = turn < 1 ? Math.sin((turn * Math.PI) / 2) * Math.PI : 0;
    return {
      position: [0.1, 0, 1.04],
      yaw: 0.2,
      pose: {
        ...sitting,
        headX: 0.28 + Math.sin(time * 0.85) * 0.04 + putDown * 0.18,
        headY: Math.sin(time * 0.55) * 0.12,
        armR: turn < 1 ? -0.7 - Math.sin(turn * Math.PI) * 0.22 : -0.6,
        elbowR: -0.8,
      },
    };
  },
  stack({ toy, elapsed: t }) {
    const cycle = t % 4.4;
    const rise = ease((cycle - 0.55) / 1.2),
      place = ease((cycle - 2.45) / 0.75);
    const returnToFloor = ease((cycle - 3.25) / 1.15);
    const lift = rise * (1 - returnToFloor);
    toy.parts.block.position.set(
      lerp(0.32, -0.07, lift),
      lerp(lerp(0.14, 1.03, rise) - place * 0.24, 0.14, returnToFloor),
      lerp(0.5, 0, lift),
    );
    toy.parts.block.rotation.y = lerp(2.8, 0, lift);
    const crouch = 1 - ease((cycle - 1.1) / 0.9) * 0.72 * (1 - returnToFloor);
    return {
      position: [0.8, 0, 0.52],
      yaw: towardToy(toy),
      pose: {
        ...squat,
        bounce: -0.22 * crouch,
        legL: -0.8 * crouch,
        legR: -0.8 * crouch,
        kneeL: 1.3 * crouch,
        kneeR: 1.3 * crouch,
        lean: 0.12 + (1 - lift) * 0.14,
        armL: -0.48 - lift * 0.58,
        armR: -0.64 - lift * 0.77,
        elbowL: -0.23,
        elbowR: -0.38,
        headX: 0.3 * (1 - lift),
        headZ: Math.sin(t) * 0.065,
      },
    };
  },
  ball({ toy, elapsed: t, time }) {
    const phase = (t % 5.5) / 5.5;
    const travel = (1 - Math.cos(phase * Math.PI * 2)) / 2;
    const x = travel * 1.12,
      z = -travel * 1.42;
    const bounce = Math.max(0, Math.sin(phase * Math.PI * 6)) * 0.32 * Math.sin(phase * Math.PI);
    toy.parts.ball.position.set(x, 0.34 + bounce, z);
    toy.parts.ball.rotation.set(-travel * 5.2, 0.2, -travel * 4);
    toy.parts.shadow.position.set(x, 0.016, z);
    toy.parts.shadow.scale.setScalar(1 - bounce * 0.6);
    const walk = walkingPose(time, Math.abs(Math.sin(phase * Math.PI * 2)) * 0.7);
    return {
      position: [x - 0.15, 0, z + 0.76],
      yaw: Math.PI - 0.15,
      pose: {
        ...walk,
        headX: 0.23,
        headZ: Math.sin(time) * 0.05,
        legR: phase < 0.11 ? -Math.sin((phase / 0.11) * Math.PI) * 1.0 : walk.legR,
        spreadL: -0.3,
        spreadR: 0.3,
      },
    };
  },
  ride({ toy, elapsed: t, time }) {
    if (toy.parts.boat?.visible) {
      // Lift across the rim before settling into the cabin; cross it again before stepping down.
      const enter = ease((t - 0.55) / 0.85);
      const settle = ease((t - 1.2) / 0.5);
      const leave = ease((t - toy.duration + 1.8) / 1.45);
      const lower = ease((leave - 0.82) / 0.18);
      const rocking = Math.sin(time * 3.0) * 0.065 * settle * (1 - leave);
      toy.parts.horse.rotation.x = rocking;
      const boardingHeight = lerp(0.92, 0.62, settle);
      return {
        position: [
          lerp(0.85 * (1 - enter), 1.0, leave),
          boardingHeight * (1 - lower) + Math.sin(leave * Math.PI) * 0.28,
          lerp(0.4, -0.12 + rocking * 0.7, enter * (1 - leave)),
        ],
        yaw: leave > 0.3 ? 1.1 : 0,
        pose: {
          legL: -1.42 * (1 - lower),
          legR: -1.42 * (1 - lower),
          kneeL: 1.42 * (1 - lower),
          kneeR: 1.42 * (1 - lower),
          lean: rocking,
          armL: -0.87,
          armR: -0.87,
          elbowL: -0.6,
          elbowR: -0.6,
          spreadL: -0.11,
          spreadR: 0.11,
          headZ: Math.sin(time * 1.3) * 0.06,
        },
      };
    }
    const mount = ease(t / 1.3),
      dismount = ease((t - toy.duration + 1.5) / 1.5);
    const rocking = Math.sin(time * 3.9) * 0.12 * mount * (1 - dismount);
    toy.parts.horse.rotation.x = rocking;
    return {
      position: [
        lerp(0, 0.86, dismount),
        0.62 * (1 - dismount) + Math.sin(time * 7.8) * 0.007,
        lerp(-0.12 + rocking * 0.7, 0.4, dismount),
      ],
      yaw: dismount > 0.3 ? 1.1 : 0,
      pose: {
        legL: -0.63,
        legR: -0.63,
        kneeL: 1.12,
        kneeR: 1.12,
        lean: rocking,
        armL: -0.87,
        armR: -0.87,
        elbowL: -0.6,
        elbowR: -0.6,
        spreadL: -0.11,
        spreadR: 0.11,
        headZ: Math.sin(time * 1.3) * 0.06,
      },
    };
  },
  music({ character, toy, elapsed: t, time }) {
    character.mallets.forEach((m) => {
      m.visible = true;
    });
    toy.parts.malletLeft.visible = toy.parts.malletRight.visible = false;
    const beat = t * 5.2;
    for (let i = 0; i < 7; i++) {
      const hit = Math.max(0, Math.sin(beat - i * 1.3)) ** 12;
      toy.parts['bar' + i].position.y = 0.35 - hit * 0.025;
    }
    return {
      position: [0, 0, 0.98],
      yaw: Math.PI,
      pose: {
        ...squat,
        headX: 0.26,
        headZ: Math.sin(time * 2.6) * 0.06,
        sway: Math.sin(time * 2.6) * 0.023,
        armL: -0.88 + Math.sin(beat) * 0.28,
        armR: -0.88 + Math.sin(beat + Math.PI) * 0.28,
        elbowL: -0.4 + Math.sin(beat) * 0.16,
        elbowR: -0.4 + Math.sin(beat + Math.PI) * 0.16,
      },
    };
  },
  tea({ toy, elapsed: t, time }) {
    const cycle = t % 5.5,
      lift = ease((cycle - 0.5) / 1),
      pour = ease((cycle - 2) / 0.7),
      lower = ease((cycle - 3.6) / 1.1);
    const held = lift * (1 - lower);
    toy.parts.pot.position.set(0.1 + 0.25 * held, 0.69 + 0.3 * held, -0.1 + 0.29 * held);
    toy.parts.pot.rotation.z = -0.55 * pour * (1 - lower);
    return {
      position: [1.12, 0, 0.25],
      yaw: towardToy(toy),
      pose: {
        headX: 0.16 + 0.09 * Math.sin(time),
        lean: 0.1,
        armL: -0.43 - held * 0.15,
        armR: -0.55 - held * 0.48,
        elbowR: -0.46,
        headZ: Math.sin(time * 0.6) * 0.1,
      },
    };
  },
  climb({ elapsed: t, time }) {
    if (t < 2)
      return {
        position: [-0.74, 0, lerp(1.82, 1.58, ease(t / 2))],
        yaw: Math.PI,
        pose: { ...walkingPose(time, 0.4), grounded: 1 },
      };
    if (t < 5.6) {
      const progress = (t - 2) / 3.6,
        step = Math.sin(time * 5);
      return {
        position: [-0.74, castleDeckHeight * progress, lerp(1.58, 1.02, progress)],
        yaw: Math.PI,
        pose: {
          lean: 0.11,
          armL: -2.2 + step * 0.34,
          armR: -2.2 - step * 0.34,
          elbowL: -0.25,
          elbowR: -0.25,
          legL: -0.45 - Math.max(0, step) * 0.8,
          legR: -0.45 - Math.max(0, -step) * 0.8,
          kneeL: 0.7 + Math.max(0, step) * 0.7,
          kneeR: 0.7 + Math.max(0, -step) * 0.7,
          headX: -0.15,
        },
      };
    }
    if (t < 6.5)
      return {
        position: [-0.74, castleDeckHeight, lerp(1.02, -0.05, ease((t - 5.6) / 0.9))],
        yaw: Math.PI,
        pose: { ...walkingPose(time, 0.4), grounded: 1 },
      };
    if (t < 8.2)
      return {
        position: [lerp(-0.74, 0.74, ease((t - 6.5) / 1.7)), castleDeckHeight, -0.05],
        yaw: Math.PI / 2,
        pose: { ...walkingPose(time, 0.5), grounded: 1 },
      };
    if (t < 9)
      return {
        position: [
          0.74,
          castleDeckHeight,
          lerp(-0.05, slideCurve.getPoint(0).z, ease((t - 8.2) / 0.8)),
        ],
        yaw: 0,
        pose: { ...walkingPose(time, 0.4), grounded: 1 },
      };
    if (t < 10.2) return slideFrame(0, ease((t - 9) / 1.2));
    if (t < 13.4) return slideFrame(ease((t - 10.2) / 3.2));
    if (t < 14.3) {
      const end = slideFrame(1),
        leave = ease((t - 13.4) / 0.9);
      return {
        ...end,
        position: [0.74, lerp(end.position[1], 0, leave), lerp(2.53, 3.25, leave)],
      };
    }
    const getUp = ease((t - 14.3) / 1.2);
    const leg = (-Math.PI / 2) * (1 - getUp);
    return {
      position: [0.74, 0, 3.25],
      yaw: 0.3,
      pose: {
        grounded: 1,
        bounce: -0.345 * (1 - Math.cos(leg)),
        legL: leg,
        legR: leg,
        kneeL: 0,
        kneeR: 0,
        armL: -0.4,
        armR: -0.8,
        spreadR: 0.75,
        headZ: 0.12,
      },
    };
  },
  crawl({ elapsed: t }) {
    const lower = ease((t - 0.5) / 1.65);
    const rise = ease((t - 9.1) / 1.55);
    const crouched = lower * (1 - rise);
    const travel = ease((t - 2.4) / 6.3);
    const moving = t > 2.4 && t < 8.7;
    const stride = moving ? Math.sin((t - 2.4) * 4.6) * Math.sin(travel * Math.PI) : 0;
    // Lower completely outside the arch; the rear shoe must clear it before standing.
    return {
      position: [0, 0, lerp(-1.85, 1.3, travel)],
      yaw: 0,
      pose: {
        grounded: 1,
        bounce: -0.188 * crouched,
        lean: 1.25 * crouched,
        headX: -0.9 * crouched,
        headZ: rise * -0.08,
        armL: (-1.25 + stride * 0.22) * crouched,
        armR: (-1.25 - stride * 0.22) * crouched - rise * 0.6,
        spreadL: -0.09,
        spreadR: lerp(0.09, 1.25, rise),
        elbowL: (-0.08 - Math.max(0, stride) * 0.42) * crouched,
        elbowR: (-0.08 - Math.max(0, -stride) * 0.42) * crouched - rise * 0.8,
        legL: (-1.25 - stride * 0.16) * crouched,
        legR: (-1.25 + stride * 0.16) * crouched,
        kneeL: 1.65 * crouched,
        kneeR: 1.65 * crouched,
        ankleL: 1.45 * crouched,
        ankleR: 1.45 * crouched,
        sway: stride * 0.018,
      },
    };
  },
};

export function actionFrame(context: ActionContext): ActionFrame {
  const frame = actions[context.toy.action](context);
  const amount =
    ease(context.elapsed / 0.7) *
    (1 - ease((context.elapsed - context.toy.duration + 0.85) / 0.85));
  for (const key of Object.keys(frame.pose) as (keyof Pose)[])
    frame.pose[key] = lerp(restPose[key], frame.pose[key]!, amount);
  return frame;
}

export function turnToward(object: THREE.Object3D, yaw: number, dt: number) {
  const difference = Math.atan2(
    Math.sin(yaw - object.rotation.y),
    Math.cos(yaw - object.rotation.y),
  );
  object.rotation.y += difference * (1 - Math.exp(-dt * 9));
}
