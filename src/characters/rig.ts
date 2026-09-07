import * as THREE from 'three';
import { box, contactShadow, curve, cylinder, group, mesh, sphere } from '../world/primitives';
import { colors, material } from '../world/palette';
import { openBook } from '../toys/books';
import { createHead } from './appearance';

export type CharacterKind = 'kaia' | 'mom' | 'dad';
const wardrobe = {
  kaia: { shirt: '#f7efd8', outfit: '#d8a754', shoes: '#b97156', blinkOffset: 0 },
  mom: { shirt: '#a6b194', outfit: '#eee1c6', shoes: '#c29370', blinkOffset: 1.6 },
  dad: { shirt: '#b97960', outfit: '#777f6a', shoes: '#8d7053', blinkOffset: 2.5 },
};
export interface Pose {
  bounce: number;
  grounded: number;
  lean: number;
  sway: number;
  headX: number;
  headY: number;
  headZ: number;
  armL: number;
  armR: number;
  spreadL: number;
  spreadR: number;
  elbowL: number;
  elbowR: number;
  legL: number;
  legR: number;
  kneeL: number;
  kneeR: number;
  ankleL: number;
  ankleR: number;
}
export const restPose: Pose = {
  bounce: 0,
  grounded: 0,
  lean: 0,
  sway: 0,
  headX: 0,
  headY: 0,
  headZ: 0,
  armL: 0.03,
  armR: -0.03,
  spreadL: -0.13,
  spreadR: 0.13,
  elbowL: -0.12,
  elbowR: -0.12,
  legL: 0,
  legR: 0,
  kneeL: 0,
  kneeR: 0,
  ankleL: 0,
  ankleR: 0,
};

export class Character {
  root = group();
  body = group(this.root);
  head: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftElbow: THREE.Group;
  rightElbow: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftKnee: THREE.Group;
  rightKnee: THREE.Group;
  leftFoot: THREE.Group;
  rightFoot: THREE.Group;
  leftHand: THREE.Group;
  rightHand: THREE.Group;
  eyes: THREE.Group[] = [];
  pigtails: THREE.Object3D[] = [];
  book: THREE.Group;
  mallets: THREE.Group[] = [];
  pose: Pose = { ...restPose };
  shadow: THREE.Mesh;
  readonly adult: boolean;
  private readonly hip: number;
  private readonly groundContacts: THREE.Mesh[] = [];
  private readonly surfaceContacts: THREE.Mesh[] = [];
  private readonly contactBounds = new THREE.Box3();
  private readonly pivotOffset = new THREE.Vector3();
  private readonly supportPoint = new THREE.Vector3();

  constructor(readonly kind: CharacterKind = 'kaia') {
    this.adult = kind !== 'kaia';
    const dad = kind === 'dad',
      adult = this.adult;
    const skin = material(colors.skin);
    const { shirt: shirtColor, outfit } = wardrobe[kind];
    const shirt = material(shirtColor, 'fabric');
    const hip = adult ? 0.93 : 0.475,
      shoulder = adult ? 1.53 : 0.91;
    this.hip = hip;
    const legLength = adult ? 0.4 : 0.21,
      shinLength = adult ? 0.38 : 0.22;
    this.head = group(this.body, [0, adult ? 1.83 : 1.17, 0]);
    this.head.name = 'head';
    if (adult) {
      box(this.body, [dad ? 0.59 : 0.49, 0.59, 0.31], [0, 1.27, 0], shirt, 0.14);
      if (!dad) {
        cylinder(this.body, 0.23, 0.32, 0.53, [0, 0.95, 0], material(outfit, 'fabric'));
        for (const x of [-0.13, 0.13])
          box(this.body, [0.13, 0.16, 0.026], [x, 1.14, 0.165], shirtColor, 0.015);
        for (let i = 0; i < 3; i++)
          sphere(this.body, 0.018, [0, 1.2 + i * 0.1, 0.165], colors.wood);
      }
      cylinder(this.body, 0.1, 0.12, 0.08, [0, 1.57, 0], colors.cream);
    } else {
      const fabric = material(outfit, 'fabric');
      sphere(this.body, [0.24, 0.215, 0.173], [0, 0.745, 0], shirt);
      const profile = [
        [0, 0.445],
        [0.217, 0.445],
        [0.27, 0.462],
        [0.287, 0.492],
        [0.281, 0.54],
        [0.25, 0.65],
        [0.218, 0.77],
        [0.192, 0.875],
        [0.167, 0.897],
        [0, 0.897],
      ].map(([radius, y]) => new THREE.Vector2(radius, y));
      const dress = mesh(this.body, new THREE.LatheGeometry(profile, 48), fabric);
      dress.scale.z = 0.9;
      dress.name = 'pinafore';
      this.surfaceContacts.push(dress);
      for (const x of [-0.108, 0.108]) {
        box(this.body, [0.055, 0.21, 0.035], [x, 0.89, 0.158], fabric, 0.016);
        sphere(this.body, [0.018, 0.018, 0.012], [x, 0.874, 0.184], colors.wood);
      }
      box(this.body, [0.13, 0.108, 0.032], [0.065, 0.649, 0.238], '#e7bc72', 0.016);
      for (let i = 0; i < 5; i++) {
        const angle = (i * Math.PI * 2) / 5;
        sphere(
          this.body,
          [0.012, 0.012, 0.003],
          [0.065 + Math.sin(angle) * 0.017, 0.65 + Math.cos(angle) * 0.017, 0.256],
          colors.milk,
        );
      }
      sphere(this.body, [0.008, 0.008, 0.004], [0.065, 0.65, 0.26], colors.yellow);
      curve(
        this.body,
        Array.from({ length: 33 }, (_, i) => {
          const angle = (i * Math.PI) / 16;
          return [Math.sin(angle) * 0.274, 0.473, Math.cos(angle) * 0.247];
        }),
        0.004,
        '#e7bc72',
      );
      for (const x of [-0.08, 0.08])
        sphere(this.body, [0.087, 0.037, 0.067], [x, 0.923, 0.147], colors.milk);
    }
    cylinder(this.body, 0.075, 0.087, 0.15, [0, adult ? 1.64 : 0.989, 0], skin);
    const features = createHead(this.head, kind);
    this.eyes = features.eyes;
    this.pigtails = features.pigtails;
    const arm = (side: number) => {
      const pivot = group(this.body, [side * (adult ? 0.29 : 0.246), shoulder, 0]);
      const length = adult ? 0.29 : 0.175;
      mesh(pivot, new THREE.CapsuleGeometry(adult ? 0.085 : 0.078, length * 0.57, 6, 16), shirt, [
        0,
        -length * 0.44,
        0,
      ]);
      const elbow = group(pivot, [0, -length, 0]);
      mesh(
        elbow,
        new THREE.CapsuleGeometry(adult ? 0.07 : 0.061, length * 0.65, 6, 16),
        adult ? shirt : skin,
        [0, -length * 0.46, 0],
      );
      const hand = group(elbow, [0, -length * 0.97, 0]);
      const palm = sphere(hand, [0.065, 0.073, 0.064], [0, 0, 0], skin);
      palm.name = side < 0 ? 'left-palm' : 'right-palm';
      this.groundContacts.push(palm);
      sphere(hand, 0.032, [-side * 0.047, 0.012, 0.031], skin);
      return { pivot, elbow, hand };
    };
    const left = arm(-1),
      right = arm(1);
    this.leftArm = left.pivot;
    this.leftElbow = left.elbow;
    this.leftHand = left.hand;
    this.rightArm = right.pivot;
    this.rightElbow = right.elbow;
    this.rightHand = right.hand;
    const leg = (side: number) => {
      const pivot = group(this.body, [side * (adult ? 0.145 : 0.122), hip, 0]);
      const legMaterial = dad ? material(outfit, 'fabric') : skin;
      const thigh = mesh(
        pivot,
        new THREE.CapsuleGeometry(adult ? 0.093 : 0.082, legLength * 0.64, 6, 16),
        legMaterial,
        [0, -legLength / 2, 0],
      );
      const knee = group(pivot, [0, -legLength, 0]);
      const calf = mesh(
        knee,
        new THREE.CapsuleGeometry(adult ? 0.086 : 0.071, shinLength * 0.66, 6, 16),
        legMaterial,
        [0, -shinLength * 0.43, 0],
      );
      cylinder(
        knee,
        adult ? 0.088 : 0.071,
        adult ? 0.088 : 0.071,
        0.09,
        [0, -shinLength * 0.7, 0],
        material(colors.milk, 'fabric'),
      );
      const ankle = group(knee, [0, -shinLength, 0]);
      const shoe = sphere(
        ankle,
        [adult ? 0.12 : 0.099, 0.065, adult ? 0.19 : 0.15],
        [0, 0.017, 0.055],
        material(wardrobe[kind].shoes, 'fabric'),
      );
      const sole = sphere(
        ankle,
        [adult ? 0.12 : 0.101, 0.022, adult ? 0.19 : 0.15],
        [0, -0.019, 0.055],
        colors.oat,
      );
      if (!adult)
        curve(
          ankle,
          [
            [-0.081, 0.062, 0.079],
            [-0.04, 0.083, 0.079],
            [0, 0.087, 0.079],
            [0.04, 0.083, 0.079],
            [0.081, 0.062, 0.079],
          ],
          0.009,
          colors.peach,
        );
      sole.name = side < 0 ? 'left-sole' : 'right-sole';
      this.groundContacts.push(thigh, calf, shoe, sole);
      return { pivot, knee, ankle };
    };
    const ll = leg(-1),
      rl = leg(1);
    this.leftLeg = ll.pivot;
    this.leftKnee = ll.knee;
    this.rightLeg = rl.pivot;
    this.rightKnee = rl.knee;
    this.leftFoot = ll.ankle;
    this.rightFoot = rl.ankle;
    this.book = openBook();
    this.body.add(this.book);
    this.book.position.set(0, 0.58, 0.43);
    this.book.visible = false;
    for (const hand of [this.leftHand, this.rightHand]) {
      const mallet = group(hand);
      mallet.visible = false;
      cylinder(mallet, 0.014, 0.014, 0.23, [0, 0.01, 0.085], colors.wood).rotation.x = Math.PI / 2;
      sphere(mallet, 0.043, [0, 0.01, 0.22], colors.yellow);
      this.mallets.push(mallet);
    }
    this.shadow = contactShadow(this.root, adult ? 1.1 : 0.88, adult ? 0.8 : 0.7, 0, 0, 0.34);
    this.surfaceContacts.push(...this.groundContacts);
  }

  applyPose(target: Partial<Pose>, dt: number, time: number, immediate = false) {
    const a = immediate ? 1 : 1 - Math.exp(-dt * 13);
    for (const key of Object.keys(restPose) as (keyof Pose)[])
      this.pose[key] += ((target[key] ?? restPose[key]) - this.pose[key]) * a;
    const p = this.pose;
    this.body.rotation.set(p.lean, 0, p.sway);
    // Rotate around the hips, so lowering the torso does not sweep the whole doll around her toes.
    this.pivotOffset.set(0, this.hip, 0).applyQuaternion(this.body.quaternion);
    this.body.position.set(
      -this.pivotOffset.x,
      this.hip - this.pivotOffset.y + p.bounce + Math.sin(time * 2.3) * 0.009,
      -this.pivotOffset.z,
    );
    this.head.rotation.set(p.headX, p.headY, p.headZ);
    this.leftArm.rotation.set(p.armL, 0, p.spreadL);
    this.rightArm.rotation.set(p.armR, 0, p.spreadR);
    this.leftElbow.rotation.x = p.elbowL;
    this.rightElbow.rotation.x = p.elbowR;
    this.leftLeg.rotation.x = p.legL;
    this.rightLeg.rotation.x = p.legR;
    this.leftKnee.rotation.x = p.kneeL;
    this.rightKnee.rotation.x = p.kneeR;
    this.leftFoot.rotation.x = p.ankleL;
    this.rightFoot.rotation.x = p.ankleR;
    if (p.grounded > 0.001) this.supportGround(0, p.grounded);
    const blinkPhase = (time + wardrobe[this.kind].blinkOffset) % 4.7;
    const blink = blinkPhase < 0.14 ? 0.09 + (0.91 * Math.abs(blinkPhase - 0.07)) / 0.07 : 1;
    this.eyes.forEach((eye) => {
      eye.scale.y = blink * eye.userData.openScale;
    });
    this.pigtails.forEach((tail, i) => {
      tail.rotation.z = Math.sin(time * 3.2 + i) * 0.03 + p.sway * 0.9;
    });
  }

  supportGround(lift = 0, weight = 1) {
    this.body.updateWorldMatrix(true, true);
    let bottom = Infinity;
    for (const contact of this.groundContacts) {
      this.contactBounds.setFromObject(contact, true);
      bottom = Math.min(bottom, this.contactBounds.min.y);
    }
    this.body.position.y += (this.root.position.y + lift - bottom) * weight;
  }

  supportOn(heightAt: (x: number, z: number) => number) {
    this.body.updateWorldMatrix(true, true);
    let correction = -Infinity;
    // Fit the rendered clothing and limbs after pose smoothing and breathing.
    // A curve tangent at the hips alone misses the hem and shoes on either bend.
    for (const contact of this.surfaceContacts) {
      const vertices = contact.geometry.attributes.position;
      for (let i = 0; i < vertices.count; i++) {
        this.supportPoint.fromBufferAttribute(vertices, i).applyMatrix4(contact.matrixWorld);
        const height = heightAt(this.supportPoint.x, this.supportPoint.z);
        correction = Math.max(correction, height - this.supportPoint.y);
      }
    }
    if (Number.isFinite(correction)) this.body.position.y += correction + 0.025;
  }

  clearProps() {
    this.book.visible = false;
    this.mallets.forEach((m) => {
      m.visible = false;
    });
  }
}

export function walkingPose(time: number, speed = 1): Partial<Pose> {
  const phase = time * 8.7,
    step = Math.sin(phase) * speed;
  return {
    bounce: Math.abs(Math.sin(phase)) * 0.038 * speed,
    sway: Math.cos(phase) * 0.039 * speed,
    lean: 0.035,
    headZ: -Math.cos(phase) * 0.025,
    headY: Math.sin(time * 0.9) * 0.05,
    legL: step * 0.44,
    legR: -step * 0.44,
    kneeL: Math.max(0, -step) * 0.58,
    kneeR: Math.max(0, step) * 0.58,
    armL: -step * 0.37,
    armR: step * 0.37,
    elbowL: -0.2,
    elbowR: -0.2,
  };
}

export function runningPose(time: number, amount: number): Partial<Pose> {
  const phase = time * 8.7,
    step = Math.sin(phase);
  const running: Partial<Pose> = {
    bounce: 0,
    sway: Math.cos(phase) * 0.025,
    lean: 0.15,
    headX: -0.1,
    headZ: -Math.cos(phase) * 0.025,
    legL: step * 0.68,
    legR: -step * 0.68,
    kneeL: 0.1 + Math.max(0, step) * 1.05,
    kneeR: 0.1 + Math.max(0, -step) * 1.05,
    ankleL: -0.12 - Math.max(0, step) * 0.25,
    ankleR: -0.12 - Math.max(0, -step) * 0.25,
    armL: -step * 0.76,
    armR: step * 0.76,
    elbowL: -1.05,
    elbowR: -1.05,
    spreadL: -0.2,
    spreadR: 0.2,
  };
  const pose = walkingPose(time);
  for (const key of Object.keys(running) as (keyof Pose)[])
    pose[key] = THREE.MathUtils.lerp(pose[key] ?? restPose[key], running[key]!, amount);
  return pose;
}
