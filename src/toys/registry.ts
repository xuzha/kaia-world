import * as THREE from 'three';
import { FLOOR_Y } from '../world/room';
import { colors } from '../world/palette';
import { buildCastle } from './castle';
import { buildBlocks } from './blocks';
import { buildBooks } from './books';
import { buildHorse } from './horse';
import { buildBall, buildMusic, buildRainbow, buildTea } from './small';
import type { Toy, ToyDefinition } from './types';

/** Add a model and an action id here to make a new toy available to both UI and autonomous play. */
export const toyDefinitions: ToyDefinition[] = [
  {
    id: 'castle',
    name: 'Little Castle',
    english: 'A little adventure',
    description: 'Climb a little higher, then slide down with the breeze.',
    activity: 'Exploring the castle',
    thought: 'Look how high I can climb!',
    color: colors.sage,
    action: 'climb',
    duration: 17,
    position: [3.05, -2.43],
    approach: [-0.7, 1.82],
    lookAt: [-0.7, 0.3],
    build: buildCastle,
  },
  {
    id: 'blocks',
    name: 'Color Blocks',
    english: 'Build a little dream',
    description: 'Little hands can build big dreams.',
    activity: 'Building with blocks',
    thought: 'One more block, all the way up!',
    color: colors.peach,
    action: 'stack',
    duration: 13.2,
    position: [-1.5, 3.1],
    approach: [0.8, 0.52],
    lookAt: [0, 0],
    build: buildBlocks,
  },
  {
    id: 'books',
    name: 'Story Corner',
    english: 'Once upon a time',
    description: 'Open a book and let the world grow a little bigger.',
    activity: 'Reading a favorite story',
    thought: 'Does the moon go to sleep too?',
    color: colors.sky,
    action: 'read',
    duration: 17,
    position: [-3.64, -2.27],
    approach: [0.1, 1.04],
    lookAt: [0, 1.7],
    build: buildBooks,
  },
  {
    id: 'ball',
    name: 'Bouncy Ball',
    english: 'Catch a little joy',
    description: 'Wherever you roll, I’ll follow.',
    activity: 'Chasing the ball',
    thought: 'Little ball, wait for me!',
    color: colors.yellow,
    action: 'ball',
    duration: 11,
    position: [0.55, 2.32],
    approach: [-0.15, 0.78],
    lookAt: [0, 0],
    build: buildBall,
  },
  {
    id: 'horse',
    name: 'Rocking Horse',
    english: 'Off to somewhere',
    description: 'Rock gently into an imaginary forest.',
    activity: 'Riding the rocking horse',
    thought: 'Giddy-up! Let’s find the bunnies!',
    color: colors.oat,
    action: 'ride',
    duration: 14,
    position: [-4.14, 0.38],
    approach: [0.85, 0.4],
    lookAt: [0, 0],
    build: buildHorse,
  },
  {
    id: 'music',
    name: 'Little Band',
    english: 'Make a happy sound',
    description: 'A few little notes make a brand-new tune.',
    activity: 'Making a little music',
    thought: 'This song is for Mom!',
    color: colors.lilac,
    action: 'music',
    duration: 13,
    position: [3.37, 3.23],
    approach: [0, 0.98],
    lookAt: [0, 0],
    build: buildMusic,
  },
  {
    id: 'tea',
    name: 'Teddy Tea',
    english: 'Tea for two, or three',
    description: 'Take a seat, Teddy. Today’s tea tastes like strawberries.',
    activity: 'Having tea with Teddy',
    thought: 'Would you like another cup, Teddy?',
    color: colors.coral,
    action: 'tea',
    duration: 16.5,
    position: [-5.62, 3.15],
    approach: [1.12, 0.25],
    lookAt: [0, 0],
    build: buildTea,
  },
  {
    id: 'rainbow',
    name: 'Rainbow Arch',
    english: 'A world to discover',
    description: 'Duck down and discover what’s on the other side.',
    activity: 'Crawling under the rainbow',
    thought: 'Guess where I am!',
    color: colors.mint,
    action: 'crawl',
    duration: 12,
    position: [-0.52, -2.35],
    approach: [0, -1.85],
    lookAt: [0, 0],
    build: buildRainbow,
  },
];

export function createToys(scene: THREE.Scene): Toy[] {
  return toyDefinitions.map((definition) => {
    const model = definition.build();
    model.root.position.set(definition.position[0], FLOOR_Y, definition.position[1]);
    model.root.userData.toyId = definition.id;
    scene.add(model.root);
    return {
      ...definition,
      ...model,
      obstacles: model.obstacles.map((o) => ({
        ...o,
        x: o.x + definition.position[0],
        z: o.z + definition.position[1],
      })),
      destination: {
        x: definition.position[0] + definition.approach[0],
        z: definition.position[1] + definition.approach[1],
      },
      focus: new THREE.Vector3(
        definition.position[0],
        FLOOR_Y + (definition.id === 'castle' ? 1.15 : 0.55),
        definition.position[1],
      ),
    };
  });
}
