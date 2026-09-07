import * as THREE from 'three';
import { seeded } from './palette';

export function createNightStars(parent: THREE.Group, seed: number, count: number) {
  const rng = seeded(seed);
  const positions: number[] = [],
    phases: number[] = [];
  for (let i = 0; i < count; i++) {
    // A distant backdrop behind the landscape, aligned with the home viewing direction.
    const across = (rng() - 0.5) * 80,
      up = 6 + rng() * 28,
      depth = 43 + rng() * 8;
    positions.push(
      -0.499 * depth + 0.822 * across - 0.274 * up,
      2 - 0.482 * depth + 0.876 * up,
      -0.721 * depth - 0.569 * across - 0.396 * up,
    );
    phases.push(rng() * Math.PI * 2);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('phase', new THREE.Float32BufferAttribute(phases, 1));
  const material = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 } },
    vertexShader: `
      attribute float phase;
      uniform float time;
      varying float brightness;
      void main() {
        brightness = 0.5 + 0.25 * sin(phase + time * 0.45);
        gl_PointSize = 1.4 + mod(phase, 1.7);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying float brightness;
      void main() {
        float r = length(gl_PointCoord - 0.5) * 2.0;
        float alpha = (1.0 - smoothstep(0.1, 1.0, r)) * brightness;
        gl_FragColor = vec4(0.66, 0.81, 0.95, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    depthWrite: false,
  });
  const stars = new THREE.Points(geometry, material);
  stars.name = 'night-stars';
  stars.frustumCulled = false;
  parent.add(stars);
  return {
    material,
    update(time: number) {
      material.uniforms.time.value = time;
    },
  };
}

export function createNightWater(deep: string, light: string, fadeRadius = 0) {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      deep: { value: new THREE.Color(deep) },
      light: { value: new THREE.Color(light) },
      fadeRadius: { value: fadeRadius },
      ...THREE.UniformsLib.fog,
    },
    vertexShader: `
      varying vec2 surface;
      #include <fog_pars_vertex>
      void main() {
        surface = (modelMatrix * vec4(position, 1.0)).xz;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform vec3 deep;
      uniform vec3 light;
      uniform float fadeRadius;
      varying vec2 surface;
      #include <fog_pars_fragment>
      void main() {
        float wave = sin(surface.y * 2.6 + sin(surface.x * 1.2 + time * 0.25) * 0.8 - time * 0.7);
        float ripple = pow(max(0.0, wave), 16.0);
        float spread = 0.5 + 0.5 * sin(surface.x * 0.6 + surface.y * 0.35 + time * 0.1);
        float alpha = fadeRadius > 0.0 ? 1.0 - smoothstep(fadeRadius * 0.7, fadeRadius, length(surface)) : 1.0;
        gl_FragColor = vec4(mix(deep, light, spread * 0.16 + ripple * 0.075), alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }
    `,
    fog: true,
    transparent: fadeRadius > 0,
    depthWrite: fadeRadius === 0,
  });
  return {
    material,
    update(time: number) {
      material.uniforms.time.value = time;
    },
  };
}
