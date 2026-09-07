import * as THREE from 'three';

export const colors = {
  cream: '#f4ead8',
  milk: '#fff8e9',
  oat: '#e2cdac',
  wood: '#cda779',
  sage: '#9cab83',
  moss: '#687b5a',
  mint: '#b8c5aa',
  peach: '#e7ad8c',
  coral: '#c97961',
  yellow: '#e8bc63',
  sky: '#9ebfc2',
  blue: '#6e969e',
  lilac: '#b4a3b4',
  ink: '#554b3d',
  skin: '#f0c298',
  hair: '#40332b',
};

export function seeded(seed: number) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
    return (seed >>> 0) / 4294967296;
  };
}

export function canvasTexture(
  size: number,
  draw: (ctx: CanvasRenderingContext2D, size: number) => void,
) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  draw(canvas.getContext('2d')!, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

const materials = new Map<string, THREE.MeshStandardMaterial>();

export function material(color: string, texture?: 'wood' | 'fabric' | 'plaster') {
  const key = color + (texture ?? '');
  if (materials.has(key)) return materials.get(key)!;
  const mat = new THREE.MeshStandardMaterial({ color, roughness: texture === 'wood' ? 0.7 : 0.92 });
  if (texture) {
    const rng = seeded(93);
    mat.map = canvasTexture(256, (ctx, s) => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, s, s);
      if (texture === 'wood') {
        for (let i = 0; i < 180; i++) {
          const y = rng() * s;
          ctx.strokeStyle = `rgba(101,70,40,${rng() * 0.1})`;
          ctx.lineWidth = rng() * 1.4 + 0.3;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.bezierCurveTo(70, y - 9 * rng(), 170, y + 8 * rng(), s, y);
          ctx.stroke();
        }
        ctx.strokeStyle = 'rgba(123,85,52,0.09)';
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.ellipse(110, 120, 17 + i * 12, 2 + i * 2, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else {
        for (let i = 0; i < 10000; i++) {
          ctx.fillStyle = `rgba(102,82,60,${rng() * 0.1})`;
          ctx.fillRect(rng() * s, rng() * s, 1, texture === 'fabric' ? 2 : 1);
        }
        if (texture === 'fabric') {
          ctx.strokeStyle = 'rgba(110,90,60,0.025)';
          ctx.lineWidth = 1;
          for (let y = 0; y < s; y += 3) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(s, y);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(y, 0);
            ctx.lineTo(y, s);
            ctx.stroke();
          }
        }
      }
    });
    mat.map.wrapS = mat.map.wrapT = THREE.RepeatWrapping;
  }
  materials.set(key, mat);
  return mat;
}

export function floorMaterial() {
  const rng = seeded(31);
  const map = canvasTexture(1024, (ctx, s) => {
    ctx.fillStyle = '#d9ba91';
    ctx.fillRect(0, 0, s, s);
    const rowHeight = 85.33;
    for (let row = 0; row < 12; row++) {
      for (let col = -1; col < 4; col++) {
        const x = col * 342 + (row % 3) * 113,
          y = row * rowHeight;
        ctx.fillStyle = ['#dcc09c', '#dec39f', '#dfc5a3', '#d9bb94', '#e3c9a7'][
          Math.floor(rng() * 5)
        ];
        ctx.fillRect(x + 1, y + 1, 340, rowHeight - 2);
        for (let i = 0; i < 26; i++) {
          const sy = y + rng() * rowHeight;
          ctx.strokeStyle = `rgba(133,94,53,${0.025 + rng() * 0.09})`;
          ctx.lineWidth = rng() + 0.25;
          ctx.beginPath();
          ctx.moveTo(x + 8, sy);
          ctx.bezierCurveTo(x + 80, sy + rng() * 6, x + 260, sy - rng() * 7, x + 328, sy);
          ctx.stroke();
        }
        ctx.strokeStyle = '#f0dabb70';
        ctx.beginPath();
        ctx.moveTo(x + 2, y + 2);
        ctx.lineTo(x + 339, y + 2);
        ctx.stroke();
      }
    }
  });
  return new THREE.MeshStandardMaterial({ map, roughness: 0.8 });
}

export function labelTexture(
  text: string,
  background = colors.cream,
  foreground = colors.ink,
  subtext?: string,
) {
  return canvasTexture(512, (ctx, s) => {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, s, s);
    ctx.strokeStyle = foreground + '30';
    ctx.lineWidth = 3;
    ctx.strokeRect(22, 22, s - 44, s - 44);
    ctx.fillStyle = foreground;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '500 74px Georgia, serif';
    ctx.fillText(text, s / 2, s * (subtext ? 0.43 : 0.5), s - 65);
    if (subtext) {
      ctx.font = '20px sans-serif';
      ctx.fillText(subtext, s / 2, s * 0.69, s - 70);
    }
  });
}
