import * as THREE from 'three';
import { curve, group, rod, sphere } from './primitives';

export function createZooParrots(gate: THREE.Group, perch: THREE.CatmullRomCurve3) {
  const root = group(gate);
  root.name = 'zoo-parrots';
  const birds = [
    { t: 0.3, body: '#ca574d', wing: '#3d8999', chest: '#e8b85f', yaw: 0.35 },
    { t: 0.7, body: '#458d9b', wing: '#346c88', chest: '#eac75b', yaw: -0.35 },
  ].map((palette, index) => {
    const bird = group(root, perch.getPoint(palette.t).toArray());
    bird.name = index ? 'zoo-parrot-blue' : 'zoo-parrot-scarlet';
    // The feet follow the tangent of the curved rail; only the upper body gestures.
    bird.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), perch.getTangent(palette.t));
    const feet = group(bird);
    feet.name = 'parrot-feet';
    for (const x of [-0.095, 0.095]) {
      rod(feet, [x, 0.13, 0], [x, 0.29, 0.015], 0.026, '#77715e');
      for (const dx of [-0.029, 0.025])
        curve(
          feet,
          [
            [x + dx, 0.09, -0.1],
            [x + dx, 0.132, -0.025],
            [x + dx, 0.127, 0.04],
            [x + dx, 0.065, 0.115],
          ],
          0.015,
          '#77715e',
        );
    }
    const body = group(bird, [0, 0.27, 0]);
    body.rotation.y = palette.yaw;
    sphere(body, [0.255, 0.4, 0.22], [0, 0.33, 0], palette.body);
    sphere(body, [0.193, 0.27, 0.075], [0, 0.26, 0.177], palette.chest);
    const tail = group(body, [0, 0.09, -0.2]);
    tail.name = 'parrot-tail';
    for (const x of [-0.075, 0, 0.075]) {
      const feather = sphere(
        tail,
        [0.055, 0.39 - Math.abs(x), 0.032],
        [x, -0.24, -0.14],
        palette.wing,
      );
      feather.rotation.x = 0.42;
    }
    const wings = [-1, 1].map((side) => {
      const wing = group(body, [side * 0.17, 0.46, -0.01]);
      sphere(wing, [0.105, 0.3, 0.155], [side * 0.06, -0.17, -0.035], palette.wing).rotation.x =
        0.25;
      for (let i = 0; i < 3; i++)
        sphere(
          wing,
          [0.035, 0.18, 0.042],
          [side * 0.145, -0.19 - i * 0.027, -0.1 + i * 0.07],
          index ? '#589d9b' : '#d7b65e',
        ).rotation.x = 0.28;
      return wing;
    });
    const head = group(body, [0, 0.62, 0.02]);
    head.name = 'parrot-head';
    sphere(head, [0.235, 0.24, 0.22], [0, 0.1, 0.015], palette.body);
    sphere(head, [0.15, 0.07, 0.16], [0, 0.29, 0.005], index ? '#5c9b7d' : '#d7745c');
    const eyes = [-1, 1].map((side) => {
      sphere(head, [0.045, 0.119, 0.12], [side * 0.2, 0.11, 0.095], '#f6ecd7');
      const eye = sphere(head, [0.023, 0.039, 0.035], [side * 0.239, 0.13, 0.139], '#283b42');
      sphere(head, 0.011, [side * 0.254, 0.143, 0.156], '#fff8e8');
      return eye;
    });
    sphere(head, [0.115, 0.136, 0.13], [0, 0.07, 0.235], '#e7d1a4');
    sphere(head, [0.072, 0.095, 0.065], [0, -0.028, 0.3], '#424a46').rotation.x = -0.25;
    sphere(head, [0.071, 0.04, 0.075], [0, -0.048, 0.205], '#424a46');
    return { head, body, wings, tail, eyes, yaw: palette.yaw };
  });
  return {
    root,
    update(time: number) {
      birds.forEach((bird, index) => {
        const cycle = (time + index * 7.3) % 18;
        const look = cycle < 4.2 ? Math.sin((cycle / 4.2) * Math.PI) ** 2 : 0;
        const preen = cycle > 9 && cycle < 12.6 ? Math.sin(((cycle - 9) / 3.6) * Math.PI) ** 2 : 0;
        const side = index ? -1 : 1;
        bird.head.rotation.set(
          preen * 0.82 + look * 0.07,
          side * (look * 0.48 + preen * 0.75),
          side * preen * 0.18,
        );
        bird.body.rotation.y = bird.yaw + side * look * 0.055;
        bird.wings[index].rotation.z = side * preen * 0.2;
        bird.tail.rotation.x = Math.sin(time * 1.1 + index) * (0.025 + preen * 0.04);
        const blink = (time + index * 2.8) % 5.7 < 0.14;
        bird.eyes.forEach((eye) => {
          eye.scale.y = blink ? 0.008 : 0.039;
        });
      });
    },
  };
}
