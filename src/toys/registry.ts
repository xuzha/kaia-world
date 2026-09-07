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
    name: '小小城堡',
    english: 'A little adventure',
    description: '一步一步爬高，再乘着风滑下来。',
    activity: '在城堡里探险',
    thought: '我爬得好高呀！',
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
    name: '彩色积木',
    english: 'Build a little dream',
    description: '小小的手，也能搭起大大的想象。',
    activity: '认真搭积木',
    thought: '再放一块，就这么高！',
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
    name: '故事角落',
    english: 'Once upon a time',
    description: '翻开一本书，世界又大了一点点。',
    activity: '看最喜欢的绘本',
    thought: '月亮也要睡觉吗？',
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
    name: '滚滚皮球',
    english: 'Catch a little joy',
    description: '你滚到哪里，我就跟到哪里。',
    activity: '和皮球玩追逐',
    thought: '小皮球，等等我！',
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
    name: '森林木马',
    english: 'Off to somewhere',
    description: '摇呀摇，去一片想象中的森林。',
    activity: '骑木马兜风',
    thought: '驾！去找小兔子！',
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
    name: '小小乐队',
    english: 'Make a happy sound',
    description: '叮叮咚咚，是今天新写的小曲子。',
    activity: '敲自己的小曲子',
    thought: '这是送给妈妈的歌～',
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
    name: '泰迪茶会',
    english: 'Tea for two, or three',
    description: '请坐呀，小熊。今天的茶有草莓味。',
    activity: '请小熊喝下午茶',
    thought: '小熊，你还要一杯吗？',
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
    name: '彩虹拱桥',
    english: 'A world to discover',
    description: '低下小脑袋，发现拱桥另一边的秘密。',
    activity: '钻过彩虹小隧道',
    thought: '猜猜我在哪里？',
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
