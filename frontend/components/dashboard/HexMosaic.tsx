'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

/**
 * Breaks the inserted image into a honeycomb of hexagon cells that assemble in
 * from scattered positions, then keep gently drifting — the "Apple Intelligence"
 * processing moment, rendered as movable hexagons. Pure decoration over the
 * real image; no pixels leave the browser.
 */
const COLS = 7; // hexes across; cell size derives from the measured width
const POINTY_HEX = 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)';

// Deterministic pseudo-random so the layout is stable across re-renders
// (Math.random is also fine here, but this keeps entrance/float consistent).
function rand(seed: number) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

interface Cell {
  left: number;
  top: number;
  w: number;
  h: number;
  bgSize: string;
  bgPos: string;
  hx: number;
  hy: number;
  hr: number;
  inDelay: number;
  inDur: number;
  fx: number;
  fy: number;
  fr: number;
  floatDur: number;
  floatDelay: number;
}

export function HexMosaic({ src }: { src: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [boxW, setBoxW] = useState(0);
  const [aspect, setAspect] = useState(4 / 3);

  // Measure the rendered width (and keep it in sync on resize).
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setBoxW(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Learn the image's aspect ratio so the mosaic matches the photo.
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      if (img.naturalWidth && img.naturalHeight) setAspect(img.naturalWidth / img.naturalHeight);
    };
    img.src = src;
  }, [src]);

  const cells = useMemo<Cell[]>(() => {
    if (!boxW) return [];
    const boxH = boxW / aspect;
    const hexW = boxW / (COLS + 0.5); // +0.5 leaves room for odd-row offset
    const hexH = hexW * 1.1547; // pointy-top: height = width * 2/√3
    const rowH = hexH * 0.75; // pointy-top vertical step
    const rows = Math.ceil(boxH / rowH) + 1;

    const out: Cell[] = [];
    let i = 0;
    for (let r = 0; r < rows; r++) {
      const offset = r % 2 ? hexW / 2 : 0;
      for (let c = 0; c < COLS + (r % 2 ? 0 : 1); c++) {
        const left = c * hexW + offset - hexW / 2;
        const top = r * rowH - hexH / 2;
        const s1 = rand(i + 1);
        const s2 = rand(i + 2);
        const s3 = rand(i + 3);
        // entrance scatter, biased outward from centre for a radial assemble
        const cx = left + hexW / 2 - boxW / 2;
        const cy = top + hexH / 2 - boxH / 2;
        const dist = Math.hypot(cx, cy) / Math.max(boxW, boxH);
        out.push({
          left,
          top,
          w: hexW,
          h: hexH,
          bgSize: `${boxW}px ${boxH}px`,
          bgPos: `${-left}px ${-top}px`,
          hx: (s1 * 2 - 1) * 210,
          hy: (s2 * 2 - 1) * 180,
          hr: (s3 * 2 - 1) * 70,
          inDelay: dist * 0.5 + s1 * 0.18,
          inDur: 0.85 + s2 * 0.5,
          fx: (s2 * 2 - 1) * 5,
          fy: (s3 * 2 - 1) * 5,
          fr: (s1 * 2 - 1) * 2.4,
          floatDur: 3 + s3 * 2.4,
          floatDelay: s1 * 1.2,
        });
        i += 3;
      }
    }
    return out;
  }, [boxW, aspect]);

  return (
    <div style={{ position: 'relative', width: 'min(86vw, 460px)' }}>
      {/* animated rainbow glow behind the mosaic */}
      <div
        style={{
          position: 'absolute',
          inset: -22,
          borderRadius: 30,
          background:
            'conic-gradient(from 0deg,#ff5e9c,#c06bff,#5b8cff,#34e0c7,#ffd23f,#ff7a45,#ff5e9c)',
          filter: 'blur(26px)',
          opacity: 0.8,
          animation: 'spin 5.5s linear infinite',
          pointerEvents: 'none',
        }}
      />
      <div
        ref={ref}
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: String(aspect),
          borderRadius: 16,
          overflow: 'hidden',
          background: 'var(--color-surface)',
          boxShadow: '0 30px 70px rgba(0,0,0,.5)',
        }}
      >
        {cells.map((cell, idx) => (
          <div
            key={idx}
            style={{
              position: 'absolute',
              left: cell.left,
              top: cell.top,
              width: cell.w,
              height: cell.h,
              ['--hx' as string]: `${cell.hx}px`,
              ['--hy' as string]: `${cell.hy}px`,
              ['--hr' as string]: `${cell.hr}deg`,
              animation: `hexIn ${cell.inDur}s cubic-bezier(.2,.85,.25,1) ${cell.inDelay}s both`,
              willChange: 'transform, opacity, filter',
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                clipPath: POINTY_HEX,
                backgroundImage: `url(${src})`,
                backgroundSize: cell.bgSize,
                backgroundPosition: cell.bgPos,
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.06)',
                ['--fx' as string]: `${cell.fx}px`,
                ['--fy' as string]: `${cell.fy}px`,
                ['--fr' as string]: `${cell.fr}deg`,
                animation: `hexFloat ${cell.floatDur}s ease-in-out ${cell.floatDelay}s infinite`,
              }}
            />
          </div>
        ))}

        {/* sheen + soft pulse on top, matching the design's processing moment */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(115deg, transparent 32%, rgba(255,255,255,.45) 50%, transparent 68%)',
            backgroundSize: '250% 100%',
            mixBlendMode: 'overlay',
            animation: 'sheen 2.6s ease-in-out infinite',
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  );
}
