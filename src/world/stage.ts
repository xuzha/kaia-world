import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { contactShadow, group, mesh } from './primitives';
import { stories, type StoryId } from '../play/stories';

export function createStage(container: HTMLElement) {
  const scene = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setClearColor('#f3f0e7', 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.97;
  renderer.domElement.setAttribute('aria-label', 'Kaia 在温暖的游戏室里玩耍');
  renderer.domElement.setAttribute('role', 'img');
  container.prepend(renderer.domElement);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = new RoomEnvironment();
  const environmentTarget = pmrem.fromScene(environment, 0.04);
  scene.environment = environmentTarget.texture;
  scene.environmentIntensity = 0.3;
  environment.dispose();
  pmrem.dispose();

  const camera = new THREE.OrthographicCamera(-12, 12, 9, -9, 0.1, 100);
  const homePosition = new THREE.Vector3(12.8, 13.8, 18.5),
    homeTarget = new THREE.Vector3(0, 1.42, 0);
  camera.position.copy(homePosition);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(homeTarget);
  controls.enableDamping = true;
  controls.dampingFactor = 0.075;
  controls.enablePan = false;
  controls.rotateSpeed = 0.48;
  controls.zoomSpeed = 0.8;
  controls.minZoom = 0.7;
  controls.maxZoom = 2.65;
  controls.minPolarAngle = 0.34;
  controls.maxPolarAngle = 1.19;
  controls.minAzimuthAngle = 0.08;
  controls.maxAzimuthAngle = 1.49;
  controls.update();
  const hemi = new THREE.HemisphereLight('#fff3d6', '#b3bca2', 1.45);
  hemi.name = 'world-ambient';
  scene.add(hemi);
  const sun = new THREE.DirectionalLight('#ffebc6', 2.5);
  sun.name = 'world-sun';
  sun.position.set(-3.5, 10.5, 7.5);
  sun.castShadow = true;
  sun.shadow.mapSize.setScalar(window.innerWidth < 700 ? 1024 : 2048);
  sun.shadow.camera.left = -13;
  sun.shadow.camera.right = 13;
  sun.shadow.camera.top = 12;
  sun.shadow.camera.bottom = -11;
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 40;
  sun.shadow.normalBias = 0.035;
  sun.shadow.bias = -0.00012;
  sun.shadow.radius = 4;
  sun.target.position.set(0, 0, 0);
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight('#eff3dd', 0.65);
  fill.name = 'world-fill';
  fill.position.set(5, 8, -5);
  scene.add(fill);
  const lamp = new THREE.PointLight('#ffc879', 0, 14, 1.5);
  lamp.position.set(-4.4, 3, -3.9);
  scene.add(lamp);
  const roomGround = group(scene);
  roomGround.name = 'room-ground-shadows';
  const ground = mesh(
    roomGround,
    new THREE.PlaneGeometry(200, 200),
    new THREE.ShadowMaterial({ opacity: 0.07 }),
    [0, -0.47, 0],
  );
  ground.rotation.x = -Math.PI / 2;
  ground.castShadow = false;
  contactShadow(roomGround, 21, 19, 0, 0, 0.24, -0.445);
  let story: StoryId | undefined;
  const storySky = new THREE.Color();
  const storyFog = new THREE.Fog(storySky, 34, 80);
  const skyDay = new THREE.Color(),
    skyNight = new THREE.Color();

  const resize = () => {
    const width = container.clientWidth,
      height = container.clientHeight,
      aspect = width / height;
    const viewWidth = width < 600 ? 20.8 : 22.1;
    const viewHeight = Math.max(16.0, viewWidth / aspect);
    camera.left = (-viewHeight * aspect) / 2;
    camera.right = (viewHeight * aspect) / 2;
    camera.top = viewHeight / 2;
    camera.bottom = -viewHeight / 2;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  };
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();
  let tween:
    | {
        from: THREE.Vector3;
        to: THREE.Vector3;
        fromTarget: THREE.Vector3;
        toTarget: THREE.Vector3;
        fromZoom: number;
        toZoom: number;
        t: number;
      }
    | undefined;
  const travel = (position: THREE.Vector3, target: THREE.Vector3, zoom: number) => {
    tween = {
      from: camera.position.clone(),
      to: position,
      fromTarget: controls.target.clone(),
      toTarget: target,
      fromZoom: camera.zoom,
      toZoom: zoom,
      t: 0,
    };
  };
  controls.addEventListener('start', () => {
    tween = undefined;
  });
  let nightTarget = 0,
    night = 0;
  return {
    scene,
    camera,
    renderer,
    controls,
    roomGround,
    home() {
      const storyHeight =
        story === 'zoo' ? 2.95 : story === 'forest' ? 1.6 : story === 'polar' ? 2.65 : 3;
      const target = story
        ? new THREE.Vector3(
            story === 'ocean' ? 0.9 : story === 'forest' ? 1.3 : 0,
            story === 'ocean' ? 1.8 : storyHeight,
            0,
          )
        : homeTarget.clone();
      travel(
        homePosition.clone().sub(homeTarget).add(target),
        target,
        story ? stories[story].zoom : 1,
      );
    },
    setStory(next?: StoryId) {
      if (story === next) return;
      story = next;
      roomGround.visible = !story;
      if (story) {
        skyDay.set(stories[story].day);
        skyNight.set(stories[story].night);
        storySky.lerpColors(skyDay, skyNight, night);
        storyFog.color.copy(storySky);
      }
      scene.background = story ? storySky : null;
      scene.fog = story && story !== 'space' ? storyFog : null;
      renderer.domElement.setAttribute(
        'aria-label',
        story ? stories[story].canvasLabel : 'Kaia 在温暖的游戏室里玩耍',
      );
      this.home();
    },
    zoom(direction: number) {
      travel(
        camera.position.clone(),
        controls.target.clone(),
        THREE.MathUtils.clamp(
          camera.zoom * (direction > 0 ? 1.22 : 0.82),
          controls.minZoom,
          controls.maxZoom,
        ),
      );
    },
    rotate(direction = 1) {
      const offset = camera.position.clone().sub(controls.target),
        spherical = new THREE.Spherical().setFromVector3(offset);
      spherical.theta += 0.31 * direction;
      if (spherical.theta > 1.46) spherical.theta = 0.15;
      if (spherical.theta < 0.1) spherical.theta = 1.43;
      travel(
        new THREE.Vector3().setFromSpherical(spherical).add(controls.target),
        controls.target.clone(),
        camera.zoom,
      );
    },
    focus(target: THREE.Vector3, zoom = 1.8) {
      travel(
        target.clone().add(camera.position.clone().sub(controls.target)),
        target.clone(),
        zoom,
      );
    },
    setNight(enabled: boolean) {
      nightTarget = enabled ? 1 : 0;
    },
    update(dt: number) {
      if (tween) {
        tween.t = Math.min(1, tween.t + dt * 1.8);
        const a = tween.t * tween.t * (3 - 2 * tween.t);
        camera.position.lerpVectors(tween.from, tween.to, a);
        controls.target.lerpVectors(tween.fromTarget, tween.toTarget, a);
        camera.zoom = THREE.MathUtils.lerp(tween.fromZoom, tween.toZoom, a);
        camera.updateProjectionMatrix();
        if (tween.t >= 1) tween = undefined;
      }
      night += (nightTarget - night) * Math.min(1, dt * 2);
      storySky.lerpColors(skyDay, skyNight, night);
      storyFog.color.copy(storySky);
      lamp.intensity = story ? 0 : night * 18;
      if (story === 'space') {
        sun.intensity = THREE.MathUtils.lerp(2.6, 1.65, night);
        hemi.intensity = THREE.MathUtils.lerp(1.6, 1.1, night);
        fill.intensity = THREE.MathUtils.lerp(0.95, 0.75, night);
        sun.color.set('#e4eeff');
        hemi.color.set('#c5d8f5');
        hemi.groundColor.set('#626d8d');
        fill.color.set('#c4b5e5');
        scene.environmentIntensity = 0.27;
      } else if (story === 'forest') {
        sun.intensity = THREE.MathUtils.lerp(1.6, 0.95, night);
        hemi.intensity = THREE.MathUtils.lerp(1.25, 0.95, night);
        fill.intensity = THREE.MathUtils.lerp(0.8, 0.6, night);
        sun.color.set('#c6e0e2');
        hemi.color.set('#bfd7de');
        hemi.groundColor.set('#304d3c');
        fill.color.set('#85b5a9');
        scene.environmentIntensity = 0.23;
      } else if (story === 'polar') {
        sun.intensity = THREE.MathUtils.lerp(2.25, 1.65, night);
        hemi.intensity = THREE.MathUtils.lerp(1.6, 1.25, night);
        fill.intensity = THREE.MathUtils.lerp(0.95, 0.7, night);
        sun.color.set('#d0e9f1');
        hemi.color.set('#c6e3ef');
        hemi.groundColor.set('#728da1');
        fill.color.set('#8bd3bb');
        scene.environmentIntensity = 0.28;
      } else {
        sun.intensity = THREE.MathUtils.lerp(2.5, 0.5, night);
        hemi.intensity = THREE.MathUtils.lerp(1.45, 0.82, night);
        fill.intensity = THREE.MathUtils.lerp(0.65, 0.5, night);
        sun.color.setRGB(
          1,
          THREE.MathUtils.lerp(0.831, 0.63, night),
          THREE.MathUtils.lerp(0.565, 0.34, night),
        );
        hemi.color.set('#fff3d6');
        hemi.groundColor.set('#b3bca2');
        fill.color.set('#eff3dd');
        scene.environmentIntensity = 0.3;
      }
      controls.update();
      return night;
    },
    dispose() {
      observer.disconnect();
      controls.dispose();
      environmentTarget.dispose();
      renderer.dispose();
    },
  };
}
