import * as THREE from 'three';
import type { Obstacle, Point } from '../world/navigation';

export type ToyId = 'castle' | 'blocks' | 'books' | 'ball' | 'horse' | 'music' | 'tea' | 'rainbow';
export type ActionId = 'climb' | 'stack' | 'read' | 'ball' | 'ride' | 'music' | 'tea' | 'crawl';

export interface ToyDefinition {
  id: ToyId;
  name: string;
  english: string;
  description: string;
  activity: string;
  thought: string;
  color: string;
  action: ActionId;
  duration: number;
  position: [number, number];
  approach: [number, number];
  lookAt: [number, number];
  build: () => ToyModel;
}

export interface ToyModel {
  root: THREE.Group;
  parts: Record<string, THREE.Object3D>;
  obstacles: Obstacle[];
  update?: (time: number, active: boolean) => void;
  reset?: () => void;
}

export interface Toy extends ToyDefinition, ToyModel {
  destination: Point;
  focus: THREE.Vector3;
}
