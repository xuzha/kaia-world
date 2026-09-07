import * as THREE from 'three';
import type { Toy } from '../toys/types';
import { box, cylinder, group, mesh, rod, sphere, torus } from '../world/primitives';
import { canvasTexture, colors, material } from '../world/palette';
import { createVoyage } from '../world/voyage';
import { createSpace } from '../world/space';
import { createZoo } from '../world/zoo';
import { createPolar } from '../world/polar';
import { createForest } from '../world/forest';
import { storyIds, type StoryId } from './stories';

export class Imagination {
  private worlds = {
    ocean: createVoyage(),
    space: createSpace(),
    zoo: createZoo(),
    polar: createPolar(),
    forest: createForest(),
  };
  readonly ocean = this.worlds.ocean.root;
  readonly ship = this.worlds.ocean.ship;
  readonly space = this.worlds.space.root;
  readonly zoo = this.worlds.zoo.root;
  readonly polar = this.worlds.polar.root;
  readonly forest = this.worlds.forest.root;
  readonly lighthouse = group();
  readonly boat = group();
  state: 'room' | 'opening' | StoryId = 'room';
  story: StoryId = 'ocean';
  private currentStory?: StoryId;
  private displayedStory: StoryId = 'ocean';
  private illustrations = {
    ocean: storyPage('ocean'),
    space: storyPage('space'),
    zoo: storyPage('zoo'),
    polar: storyPage('polar'),
    forest: storyPage('forest'),
  };
  amount = 0;
  private beams: THREE.Group[] = [];
  private roofs: THREE.Object3D[] = [];
  private horse: THREE.Object3D;
  private pages: {
    material: THREE.MeshStandardMaterial;
    original: THREE.Texture | null;
  }[] = [];

  constructor(
    scene: THREE.Scene,
    private room: THREE.Group,
    toys: Toy[],
    heldBook: THREE.Group,
    private onChange: () => void,
  ) {
    const castle = toys.find((t) => t.id === 'castle')!,
      horse = toys.find((t) => t.id === 'horse')!;
    this.horse = horse.parts.horse;
    for (const world of Object.values(this.worlds)) scene.add(world.root);
    // Lanterns replace only the roofs; the established climbing clearance stays intact.
    castle.root.traverse((object) => {
      if (object.name === 'castle-roof') this.roofs.push(object);
    });
    castle.root.add(this.lighthouse);
    this.lighthouse.name = 'lighthouse-lanterns';
    this.lighthouse.visible = false;
    for (const x of [-0.74, 0.74]) {
      const lantern = group(this.lighthouse, [x, 3.2, -0.05]);
      cylinder(lantern, 0.66, 0.7, 0.09, [0, 0, 0], colors.cream);
      const glass = new THREE.MeshStandardMaterial({
        color: '#f9dda1',
        transparent: true,
        opacity: 0.38,
        emissive: '#edc071',
        emissiveIntensity: 0.4,
        depthWrite: false,
      });
      cylinder(lantern, 0.46, 0.46, 0.49, [0, 0.29, 0], glass, 24);
      sphere(lantern, 0.16, [0, 0.3, 0], new THREE.MeshBasicMaterial({ color: '#fff3b8' }));
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        rod(
          lantern,
          [Math.cos(a) * 0.49, 0.04, Math.sin(a) * 0.49],
          [Math.cos(a) * 0.49, 0.56, Math.sin(a) * 0.49],
          0.023,
          colors.wood,
        );
      }
      cylinder(lantern, 0.05, 0.73, 0.43, [0, 0.76, 0], x < 0 ? colors.moss : colors.coral, 32);
      const swivel = group(lantern, [0, 0.3, 0]);
      const beam = mesh(
        swivel,
        new THREE.CylinderGeometry(0.025, 1.1, 5.5, 24, 1, true),
        new THREE.MeshBasicMaterial({
          color: '#ffebae',
          transparent: true,
          opacity: 0.075,
          depthWrite: false,
          side: THREE.DoubleSide,
        }),
        [0, 0, 2.75],
      );
      beam.rotation.x = -Math.PI / 2;
      beam.castShadow = beam.receiveShadow = false;
      this.beams.push(swivel);
    }
    horse.root.add(this.boat);
    horse.parts.boat = this.boat;
    this.boat.name = 'imagination-sailboat';
    this.boat.visible = false;
    this.boat.position.y = 0.15;
    const hull = new THREE.Shape();
    hull.moveTo(-0.45, -0.85);
    hull.quadraticCurveTo(-0.65, 0.3, 0, 1.02);
    hull.quadraticCurveTo(0.65, 0.3, 0.45, -0.85);
    hull.quadraticCurveTo(0, -0.98, -0.45, -0.85);
    const floorShape = new THREE.Shape(hull.getPoints(32));
    const inner = new THREE.Path(hull.getPoints(32).map((p) => p.multiplyScalar(0.78)));
    hull.holes.push(inner);
    const wood = material('#d4b38a', 'wood');
    const shell = mesh(
      this.boat,
      new THREE.ExtrudeGeometry(hull, {
        depth: 0.36,
        bevelEnabled: true,
        bevelSize: 0.025,
        bevelThickness: 0.035,
        bevelSegments: 3,
        curveSegments: 20,
      }),
      wood,
      [0, 0.67, 0],
    );
    shell.name = 'boat-hull';
    shell.rotation.x = Math.PI / 2;
    const deck = mesh(
      this.boat,
      new THREE.ShapeGeometry(floorShape, 20),
      new THREE.MeshStandardMaterial({ color: colors.cream, side: THREE.DoubleSide }),
      [0, 0.33, 0],
    );
    deck.name = 'boat-floor';
    deck.rotation.x = Math.PI / 2;
    box(
      this.boat,
      [0.51, 0.13, 0.3],
      [0, 0.78, -0.24],
      material(colors.sage, 'fabric'),
      0.06,
    ).name = 'boat-seat';
    rod(this.boat, [-0.3, 1.2, 0.2], [0.3, 1.2, 0.2], 0.028, colors.wood);
    rod(this.boat, [-0.44, 0.73, 0.49], [-0.44, 2.55, 0.49], 0.028, colors.wood);
    const sail = new THREE.Shape([
      new THREE.Vector2(0.02, 0),
      new THREE.Vector2(0.02, 1.31),
      new THREE.Vector2(0.78, 0),
    ]);
    mesh(
      this.boat,
      new THREE.ShapeGeometry(sail),
      new THREE.MeshStandardMaterial({ color: '#fff2d5', side: THREE.DoubleSide, roughness: 1 }),
      [-0.44, 1.14, 0.49],
    );
    rod(this.boat, [-0.49, 1.12, 0.49], [0.39, 1.12, 0.49], 0.025, colors.wood);
    for (const x of [-0.46, 0.46]) {
      const ring = torus(this.boat, 0.14, 0.044, [x, 0.52, -0.24], colors.coral);
      ring.rotation.y = Math.PI / 2;
    }
    for (const book of [heldBook, toys.find((t) => t.id === 'books')!.parts.book]) {
      book.traverse((object) => {
        if (!(object instanceof THREE.Mesh) || !(object.geometry instanceof THREE.PlaneGeometry))
          return;
        const mat = object.material as THREE.MeshStandardMaterial;
        this.pages.push({ material: mat, original: mat.map });
      });
    }
  }

  get activeStory(): StoryId | undefined {
    return this.currentStory;
  }

  open(story: StoryId = 'ocean') {
    this.story = story;
    this.state = this.currentStory === story ? story : 'opening';
    for (const page of this.pages) page.material.map = this.illustrations[story];
    this.onChange();
  }
  close(immediate = false) {
    this.state = 'room';
    this.currentStory = undefined;
    for (const page of this.pages) page.material.map = page.original;
    if (immediate) {
      this.amount = 0;
      this.update(0, 0, false, 0);
    }
    this.onChange();
  }
  cancelOpening() {
    if (this.state !== 'opening') return;
    if (this.currentStory) this.open(this.currentStory);
    else this.close();
  }
  update(dt: number, time: number, reading: boolean, elapsed: number) {
    if (this.state === 'opening' && reading && elapsed >= 2.2) {
      this.state = this.story;
      this.currentStory = this.story;
      this.displayedStory = this.story;
      this.onChange();
    }
    const target = this.activeStory ? 1 : 0;
    this.amount = THREE.MathUtils.damp(this.amount, target, 2.8, dt);
    const transformed = this.amount > 0.45;
    for (const story of storyIds)
      this.worlds[story].root.visible = transformed && story === this.displayedStory;
    this.room.visible = !transformed;
    const sailing = transformed && this.displayedStory === 'ocean';
    this.lighthouse.visible = this.boat.visible = sailing;
    this.horse.visible = !sailing;
    for (const roof of this.roofs) roof.visible = !sailing;
    if (!transformed) return;
    this.worlds[this.displayedStory].update(time);
    this.beams.forEach((beam, i) => {
      beam.rotation.y = time * 0.3 + i * Math.PI;
    });
    this.boat.rotation.x = this.horse.rotation.x;
  }

  dispose() {
    this.close(true);
    for (const picture of Object.values(this.illustrations)) picture.dispose();
    // Shared primitive geometries and palette materials belong to the scene, not this feature.
    for (const world of Object.values(this.worlds)) world.dispose();
    this.lighthouse.removeFromParent();
    this.boat.removeFromParent();
  }
}

function storyPage(story: StoryId) {
  return canvasTexture(256, (ctx, s) => {
    ctx.fillStyle = '#fff3d7';
    ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = {
      ocean: '#a6c5b4',
      space: '#b6b8d1',
      zoo: '#b4c59b',
      polar: '#284e68',
      forest: '#294b48',
    }[story];
    ctx.fillRect(16, 18, s - 32, s - 36);
    if (story === 'ocean') {
      ctx.strokeStyle = '#eff4d9';
      ctx.lineWidth = 5;
      for (let y = 165; y < 220; y += 24) {
        ctx.beginPath();
        for (let x = 23; x < 235; x++) ctx.lineTo(x, y + Math.sin(x / 16) * 4);
        ctx.stroke();
      }
      ctx.fillStyle = '#d5947b';
      ctx.beginPath();
      ctx.moveTo(55, 153);
      ctx.lineTo(205, 153);
      ctx.lineTo(178, 182);
      ctx.lineTo(76, 182);
      ctx.fill();
      ctx.fillStyle = '#fff3d7';
      ctx.beginPath();
      ctx.moveTo(126, 43);
      ctx.lineTo(126, 143);
      ctx.lineTo(53, 143);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(137, 71);
      ctx.lineTo(201, 143);
      ctx.lineTo(137, 143);
      ctx.fill();
    } else if (story === 'space') {
      ctx.fillStyle = '#eed8a7';
      ctx.beginPath();
      ctx.arc(170, 75, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f7ecd0';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.ellipse(170, 75, 48, 13, -0.3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#fff3d7';
      ctx.beginPath();
      ctx.ellipse(95, 148, 25, 50, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#d5947b';
      ctx.beginPath();
      ctx.moveTo(103, 90);
      ctx.lineTo(72, 132);
      ctx.lineTo(119, 132);
      ctx.fill();
      ctx.fillStyle = '#8faabb';
      ctx.beginPath();
      ctx.arc(95, 146, 12, 0, Math.PI * 2);
      ctx.fill();
      for (const [x, y] of [
        [45, 59],
        [210, 151],
        [163, 199],
      ]) {
        ctx.fillStyle = '#fff3d7';
        ctx.fillRect(x - 2, y - 8, 4, 16);
        ctx.fillRect(x - 8, y - 2, 16, 4);
      }
    } else if (story === 'polar') {
      ctx.strokeStyle = '#71c5b0';
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.moveTo(30, 74);
      ctx.bezierCurveTo(90, 17, 126, 124, 221, 43);
      ctx.stroke();
      ctx.fillStyle = '#b5d6d9';
      ctx.beginPath();
      ctx.ellipse(128, 215, 106, 39, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e4eee7';
      ctx.beginPath();
      ctx.arc(93, 181, 51, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#58798a';
      ctx.beginPath();
      ctx.ellipse(104, 171, 15, 20, 0, Math.PI, Math.PI * 2);
      ctx.lineTo(119, 181);
      ctx.lineTo(89, 181);
      ctx.fill();
      ctx.fillStyle = '#274757';
      ctx.beginPath();
      ctx.ellipse(183, 177, 23, 37, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f5ecce';
      ctx.beginPath();
      ctx.ellipse(183, 183, 15, 25, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#d8a369';
      ctx.fillRect(178, 156, 10, 5);
      ctx.fillRect(165, 210, 14, 5);
      ctx.fillRect(186, 210, 14, 5);
    } else if (story === 'forest') {
      ctx.fillStyle = '#e6dcae';
      ctx.beginPath();
      ctx.arc(187, 62, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#8d7753';
      ctx.fillRect(48, 46, 18, 183);
      ctx.fillRect(185, 99, 12, 130);
      ctx.fillStyle = '#577755';
      ctx.beginPath();
      ctx.ellipse(59, 52, 38, 25, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#b59b68';
      ctx.fillRect(63, 138, 90, 56);
      ctx.fillRect(40, 192, 143, 10);
      ctx.fillStyle = '#719071';
      ctx.beginPath();
      ctx.moveTo(51, 139);
      ctx.lineTo(110, 93);
      ctx.lineTo(166, 139);
      ctx.fill();
      ctx.fillStyle = '#f1ce80';
      ctx.fillRect(80, 149, 27, 28);
      for (const [x, y] of [
        [37, 149],
        [202, 143],
        [168, 91],
        [212, 200],
        [118, 220],
      ]) {
        ctx.beginPath();
        ctx.arc(x, y, 2.6, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      ctx.fillStyle = '#e5bd73';
      ctx.fillRect(129, 70, 22, 106);
      ctx.beginPath();
      ctx.ellipse(123, 174, 47, 26, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(93, 180, 12, 40);
      ctx.fillRect(144, 180, 12, 40);
      ctx.beginPath();
      ctx.ellipse(151, 66, 29, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#a67d53';
      for (const [x, y] of [
        [137, 101],
        [139, 137],
        [110, 176],
        [141, 179],
      ]) {
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#5f604c';
      ctx.beginPath();
      ctx.arc(162, 63, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#92ac83';
      ctx.beginPath();
      ctx.arc(60, 81, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#bfa278';
      ctx.fillRect(55, 96, 10, 82);
    }
  });
}
