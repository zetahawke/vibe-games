import * as THREE from 'three';

function canvasTexture(
  size: number,
  paint: (ctx: CanvasRenderingContext2D, size: number) => void,
  repeat = 1,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No 2d context');
  paint(ctx, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  return tex;
}

export function makeGrassTexture(): THREE.CanvasTexture {
  return canvasTexture(
    128,
    (ctx, size) => {
      ctx.fillStyle = '#3a7a36';
      ctx.fillRect(0, 0, size, size);
      for (let i = 0; i < 900; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const h = 2 + Math.random() * 6;
        ctx.strokeStyle = Math.random() > 0.5 ? '#2f6a2c' : '#4c9a45';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + (Math.random() - 0.5) * 2, y - h);
        ctx.stroke();
      }
      for (let i = 0; i < 40; i++) {
        ctx.fillStyle = 'rgba(90, 140, 50, 0.35)';
        ctx.beginPath();
        ctx.arc(Math.random() * size, Math.random() * size, 3 + Math.random() * 6, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    12,
  );
}

export function makeDirtTexture(): THREE.CanvasTexture {
  return canvasTexture(
    128,
    (ctx, size) => {
      ctx.fillStyle = '#8a6a3d';
      ctx.fillRect(0, 0, size, size);
      for (let i = 0; i < 700; i++) {
        const shade = 90 + Math.floor(Math.random() * 50);
        ctx.fillStyle = `rgb(${shade}, ${shade - 25}, ${shade - 45})`;
        ctx.fillRect(Math.random() * size, Math.random() * size, 2 + Math.random() * 3, 2);
      }
      ctx.strokeStyle = 'rgba(60, 40, 20, 0.25)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 10; i++) {
        const y = (i / 10) * size;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(size, y + Math.sin(i) * 4);
        ctx.stroke();
      }
    },
    4,
  );
}

export function makeWoodTexture(): THREE.CanvasTexture {
  return canvasTexture(
    128,
    (ctx, size) => {
      const grad = ctx.createLinearGradient(0, 0, size, 0);
      grad.addColorStop(0, '#6b3e1f');
      grad.addColorStop(0.5, '#8a5530');
      grad.addColorStop(1, '#5c3418');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);
      for (let i = 0; i < 18; i++) {
        const y = (i / 18) * size + Math.random() * 3;
        ctx.strokeStyle = `rgba(40, 20, 8, ${0.15 + Math.random() * 0.25})`;
        ctx.lineWidth = 1 + Math.random() * 2;
        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let x = 0; x <= size; x += 8) {
          ctx.lineTo(x, y + Math.sin(x * 0.2 + i) * 2);
        }
        ctx.stroke();
      }
      for (let i = 0; i < 8; i++) {
        ctx.fillStyle = 'rgba(30, 15, 5, 0.2)';
        ctx.beginPath();
        ctx.ellipse(
          Math.random() * size,
          Math.random() * size,
          4 + Math.random() * 8,
          2 + Math.random() * 3,
          Math.random(),
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
    },
    2,
  );
}

export function makeClothTexture(base: string, stitch: string): THREE.CanvasTexture {
  return canvasTexture(64, (ctx, size) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, size, size);
    for (let y = 0; y < size; y += 4) {
      for (let x = 0; x < size; x += 4) {
        if ((x + y) % 8 === 0) {
          ctx.fillStyle = stitch;
          ctx.fillRect(x, y, 2, 2);
        }
      }
    }
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(0, 0, size, size / 3);
  });
}

export function makeSkinTexture(): THREE.CanvasTexture {
  return canvasTexture(64, (ctx, size) => {
    ctx.fillStyle = '#e0a878';
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 80; i++) {
      ctx.fillStyle = `rgba(200, 140, 100, ${0.15 + Math.random() * 0.2})`;
      ctx.fillRect(Math.random() * size, Math.random() * size, 2, 2);
    }
  });
}

export function makeZombieTexture(): THREE.CanvasTexture {
  return canvasTexture(64, (ctx, size) => {
    ctx.fillStyle = '#4f7a3a';
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 120; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#3d6230' : '#6a9450';
      ctx.beginPath();
      ctx.arc(Math.random() * size, Math.random() * size, 1 + Math.random() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(80, 40, 40, 0.35)';
    ctx.fillRect(10, 20, 18, 8);
    ctx.fillRect(36, 28, 14, 6);
  });
}

export function makeSkyTexture(): THREE.CanvasTexture {
  return canvasTexture(256, (ctx, size) => {
    const grad = ctx.createLinearGradient(0, 0, 0, size);
    grad.addColorStop(0, '#6eb6e8');
    grad.addColorStop(0.55, '#a8d4f0');
    grad.addColorStop(1, '#e8f2d8');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    for (let i = 0; i < 6; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size * 0.45;
      ctx.beginPath();
      ctx.ellipse(x, y, 28 + Math.random() * 30, 12 + Math.random() * 10, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}
