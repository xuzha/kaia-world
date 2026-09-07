import * as THREE from 'three';
import { box, group, mesh, rod, sphere } from './primitives';
import { canvasTexture, seeded } from './palette';
import { disposeStory } from './story-resources';
import { createSpaceSky } from './space-sky';
import { createSpaceStation } from './space-station';

const sunlight = new THREE.Vector3(-0.65, 0.5, 0.57).normalize();

function planetMaterial(map: THREE.Texture) {
  // Distant worlds share one sun and a dark night side, independent of the
  // habitat's soft interior lighting.
  return new THREE.ShaderMaterial({
    uniforms: { surface: { value: map }, sunlight: { value: sunlight } },
    vertexShader: `varying vec2 texcoord; varying vec3 worldNormal;
      void main() {
        texcoord = uv;
        worldNormal = normalize((vec4(normalMatrix * normal, 0.0) * viewMatrix).xyz);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `uniform sampler2D surface; uniform vec3 sunlight;
      varying vec2 texcoord; varying vec3 worldNormal;
      void main() {
        float light = max(dot(normalize(worldNormal), sunlight), 0.0);
        vec3 albedo = texture2D(surface, texcoord).rgb;
        gl_FragColor = vec4(albedo * (0.025 + light * 1.2), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
}

export function createSpace() {
  const root = group();
  root.name = 'imagination-space';
  root.visible = false;
  const sky = createSpaceSky(root);
  const habitat = createSpaceStation(root);
  const planetGeometry = new THREE.SphereGeometry(1, 64, 40);
  const earthMap = new THREE.TextureLoader().load(
    import.meta.env.BASE_URL + 'assets/space/earth.jpg',
  );
  earthMap.colorSpace = THREE.SRGBColorSpace;
  earthMap.anisotropy = 4;
  const earthMaterial = planetMaterial(earthMap);
  // Orthographic projection does not shrink distant objects: both the radii
  // and the positions are composed explicitly to keep planets in the background.
  const earth = mesh(root, planetGeometry, earthMaterial, [-17.23, 0.7, -10.48]);
  earth.scale.setScalar(1.35);
  earth.name = 'story-earth';
  earth.rotation.z = 0.12;
  const atmosphereMaterial = new THREE.ShaderMaterial({
    uniforms: { sunlight: { value: sunlight } },
    vertexShader: `varying vec3 normalView; varying vec3 worldNormal;
      void main() {
        normalView = normalize(normalMatrix * normal);
        worldNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `uniform vec3 sunlight;
      varying vec3 normalView; varying vec3 worldNormal;
      void main() {
        float rim = pow(1.0 - max(normalize(normalView).z, 0.0), 4.0);
        float day = smoothstep(-0.15, 0.65, dot(normalize(worldNormal), sunlight));
        gl_FragColor = vec4(0.2, 0.48, 0.8, rim * day * 0.23);
        #include <colorspace_fragment>
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const atmosphere = mesh(earth, planetGeometry, atmosphereMaterial);
  atmosphere.scale.setScalar(1.018);
  atmosphere.name = 'earth-atmosphere';

  const saturn = group(root, [-9.33, -1.3, -22.78]);
  saturn.name = 'ringed-planet';
  saturn.rotation.set(0.12, 0, -0.34);
  const saturnMap = canvasTexture(512, (ctx, s) => {
    const rng = seeded(395);
    const stripes = Float32Array.from({ length: s }, () => rng() - 0.5);
    const pixels = ctx.createImageData(s, s);
    for (let y = 0; y < s; y++)
      for (let x = 0; x < s; x++) {
        const latitude = y + Math.sin((x * Math.PI * 8) / s + y * 0.06) * 1.4;
        const band =
          Math.sin(latitude * 0.067) * 7 +
          Math.sin(latitude * 0.19) * 3 +
          Math.sin(latitude * 0.51) * 1.2;
        const cloud = Math.sin((x * Math.PI * 24) / s + Math.sin(y * 0.13) * 2) * 0.9;
        const shade = band + cloud + stripes[y] * 2;
        const p = (y * s + x) * 4;
        pixels.data[p] = 191 + shade;
        pixels.data[p + 1] = 176 + shade;
        pixels.data[p + 2] = 147 + shade * 0.75;
        pixels.data[p + 3] = 255;
      }
    ctx.putImageData(pixels, 0, 0);
  });
  const saturnMaterial = planetMaterial(saturnMap);
  const globe = mesh(saturn, planetGeometry, saturnMaterial);
  globe.scale.set(0.83, 0.76, 0.83);
  globe.name = 'saturn-globe';
  const ringMap = canvasTexture(512, (ctx, s) => {
    const rng = seeded(183);
    for (let x = 0; x < s; x++) {
      const radius = 1.04 + (x / s) * 0.85;
      const density = 0.65 + Math.sin(x * 0.53) * 0.1 + (rng() - 0.5) * 0.15;
      const gap = radius > 1.56 && radius < 1.615;
      const edge = Math.min(x / 18, (s - x) / 12, 1);
      const opacity = (gap ? 0.035 : radius < 1.2 ? density * 0.35 : density) * edge;
      ctx.fillStyle = 'rgba(190,179,157,' + opacity + ')';
      ctx.fillRect(x, 0, 1, s);
    }
  });
  const ringMaterial = new THREE.ShaderMaterial({
    uniforms: {
      surface: { value: ringMap },
      sunlight: { value: sunlight },
      center: { value: saturn.position },
      radius: { value: 0.82 },
    },
    vertexShader: `varying vec2 texcoord; varying vec3 worldPosition;
      void main() {
        texcoord = uv;
        vec4 p = modelMatrix * vec4(position, 1.0);
        worldPosition = p.xyz;
        gl_Position = projectionMatrix * viewMatrix * p;
      }`,
    fragmentShader: `uniform sampler2D surface; uniform vec3 sunlight;
      uniform vec3 center; uniform float radius;
      varying vec2 texcoord; varying vec3 worldPosition;
      void main() {
        vec4 color = texture2D(surface, texcoord);
        vec3 toCenter = center - worldPosition;
        float along = dot(toCenter, sunlight);
        float distance = length(toCenter - sunlight * along);
        float shadow = along > 0.0 ? 1.0 - smoothstep(radius - 0.025, radius + 0.025, distance) : 0.0;
        gl_FragColor = vec4(color.rgb * mix(0.82, 0.12, shadow), color.a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    side: THREE.DoubleSide,
    transparent: true,
    depthWrite: false,
  });
  const ringGeometry = new THREE.RingGeometry(1.04, 1.89, 128);
  const positions = ringGeometry.attributes.position;
  const uv = ringGeometry.attributes.uv;
  for (let i = 0; i < positions.count; i++)
    uv.setXY(i, (Math.hypot(positions.getX(i), positions.getY(i)) - 1.04) / 0.85, 0.5);
  const rings = mesh(saturn, ringGeometry, ringMaterial);
  rings.name = 'saturn-rings';
  rings.rotation.x = Math.PI / 2;

  const moon = group(root, [-14, -0.8, -12.5]);
  moon.name = 'story-moon';
  sphere(moon, 0.28, [0, 0, 0], '#8d9298');
  for (const [x, y, size] of [
    [-0.1, 0.08, 0.045],
    [0.085, 0.01, 0.04],
    [-0.025, -0.105, 0.03],
  ]) {
    const z = Math.sqrt(0.28 ** 2 - x * x - y * y);
    sphere(moon, [size, size * 0.8, 0.006], [x, y, z], '#747c86');
  }
  for (const object of [earth, saturn, moon])
    object.traverse((child) => {
      child.castShadow = child.receiveShadow = false;
    });

  const satellite = group(root);
  satellite.name = 'passing-satellite';
  const satelliteBody = new THREE.MeshStandardMaterial({
    color: '#afa386',
    roughness: 0.55,
    metalness: 0.5,
  });
  box(satellite, [0.36, 0.36, 0.42], [0, 0, 0], satelliteBody, 0.025);
  for (const side of [-1, 1]) {
    rod(satellite, [0, 0, 0], [side * 0.5, 0, 0], 0.02, '#7b8a99');
    box(satellite, [0.64, 0.035, 0.59], [side * 0.72, 0, 0], habitat.solarMaterial, 0.005);
  }
  rod(satellite, [0, 0.15, 0], [0.18, 0.6, 0], 0.018, '#a5b1b9');
  return {
    root,
    station: habitat.root,
    floor: habitat.floor,
    update(time: number) {
      if (!root.visible) return;
      sky.update(time);
      habitat.update(time);
      earth.rotation.y = 2.8 + time * 0.012;
      const a = time * 0.07;
      satellite.position.set(
        Math.cos(a) * 13,
        3.2 + Math.sin(a * 1.4) * 0.3,
        -9 + Math.sin(a) * 3.2,
      );
      satellite.rotation.set(0.13, -a, Math.sin(a) * 0.16);
    },
    dispose() {
      sky.dispose();
      habitat.dispose();
      planetGeometry.dispose();
      disposeStory(
        root,
        [earthMaterial, atmosphereMaterial, saturnMaterial, ringMaterial, satelliteBody],
        [earthMap, saturnMap, ringMap],
      );
    },
  };
}
