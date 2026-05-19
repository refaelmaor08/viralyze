'use client';

import { useEffect, useRef } from 'react';

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  r: number; opacity: number;
  phase: number; speed: number;
}

interface ChartLine {
  pts: Array<{ x: number; y: number }>;
  color: string;
  opacity: number;
  lw: number;
  dotT: number;
  dotSpeed: number;
}

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function getPoint(pts: Array<{ x: number; y: number }>, t: number, w: number, h: number) {
  const s = Math.max(0, Math.min(t, 0.9999)) * (pts.length - 1);
  const i = Math.floor(s);
  const f = s - i;
  const a = pts[i], b = pts[Math.min(i + 1, pts.length - 1)];
  return { x: (a.x + (b.x - a.x) * f) * w, y: (a.y + (b.y - a.y) * f) * h };
}

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf: number;
    let frame = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const charts: ChartLine[] = [
      {
        pts: [
          { x: -0.02, y: 0.84 }, { x: 0.12, y: 0.77 }, { x: 0.25, y: 0.67 },
          { x: 0.38, y: 0.55 }, { x: 0.52, y: 0.43 }, { x: 0.67, y: 0.31 },
          { x: 0.82, y: 0.21 }, { x: 1.02, y: 0.16 },
        ],
        color: '#D4A843', opacity: 0.09, lw: 1.6,
        dotT: 0.12, dotSpeed: 0.00055,
      },
      {
        pts: [
          { x: -0.02, y: 0.93 }, { x: 0.15, y: 0.87 }, { x: 0.3, y: 0.81 },
          { x: 0.45, y: 0.72 }, { x: 0.6, y: 0.62 }, { x: 0.75, y: 0.54 },
          { x: 1.02, y: 0.46 },
        ],
        color: '#F0C060', opacity: 0.05, lw: 1,
        dotT: 0.58, dotSpeed: 0.00045,
      },
      {
        pts: [
          { x: -0.02, y: 0.74 }, { x: 0.13, y: 0.68 }, { x: 0.27, y: 0.61 },
          { x: 0.42, y: 0.51 }, { x: 0.57, y: 0.4 }, { x: 0.72, y: 0.3 },
          { x: 0.87, y: 0.23 }, { x: 1.02, y: 0.19 },
        ],
        color: '#D4A843', opacity: 0.045, lw: 1,
        dotT: 0.78, dotSpeed: 0.0006,
      },
      {
        pts: [
          { x: 0.1, y: 0.98 }, { x: 0.25, y: 0.94 }, { x: 0.4, y: 0.88 },
          { x: 0.55, y: 0.82 }, { x: 0.7, y: 0.76 }, { x: 0.85, y: 0.7 },
          { x: 1.02, y: 0.65 },
        ],
        color: '#D4A843', opacity: 0.03, lw: 0.8,
        dotT: 0.35, dotSpeed: 0.0004,
      },
    ];

    const particles: Particle[] = Array.from({ length: 28 }, () => ({
      x: Math.random(), y: Math.random(),
      vx: (Math.random() - 0.5) * 0.00011,
      vy: -(Math.random() * 0.00007 + 0.000025),
      r: Math.random() * 1.8 + 0.35,
      opacity: Math.random() * 0.055 + 0.012,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.022 + 0.009,
    }));

    const drawChart = (c: ChartLine, w: number, h: number) => {
      const { pts, color, opacity, lw } = c;

      // Smooth line via quadratic bezier (midpoint approach)
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = lw;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.globalAlpha = opacity;
      ctx.moveTo(pts[0].x * w, pts[0].y * h);
      for (let i = 1; i < pts.length - 1; i++) {
        const mx = ((pts[i].x + pts[i + 1].x) / 2) * w;
        const my = ((pts[i].y + pts[i + 1].y) / 2) * h;
        ctx.quadraticCurveTo(pts[i].x * w, pts[i].y * h, mx, my);
      }
      ctx.lineTo(pts[pts.length - 1].x * w, pts[pts.length - 1].y * h);
      ctx.stroke();

      // Gradient fill below line
      ctx.beginPath();
      ctx.moveTo(pts[0].x * w, pts[0].y * h);
      for (let i = 1; i < pts.length - 1; i++) {
        const mx = ((pts[i].x + pts[i + 1].x) / 2) * w;
        const my = ((pts[i].y + pts[i + 1].y) / 2) * h;
        ctx.quadraticCurveTo(pts[i].x * w, pts[i].y * h, mx, my);
      }
      ctx.lineTo(pts[pts.length - 1].x * w, pts[pts.length - 1].y * h);
      ctx.lineTo(w + 20, h + 10);
      ctx.lineTo(-20, h + 10);
      ctx.closePath();
      const fillGrad = ctx.createLinearGradient(0, pts[0].y * h * 0.7, 0, h);
      fillGrad.addColorStop(0, hexToRgba(color, opacity * 0.55));
      fillGrad.addColorStop(0.55, hexToRgba(color, opacity * 0.12));
      fillGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = fillGrad;
      ctx.globalAlpha = 1;
      ctx.fill();

      // Glow line on top (brighter copy)
      if (opacity > 0.06) {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = lw * 2.5;
        ctx.globalAlpha = opacity * 0.18;
        ctx.shadowBlur = 8;
        ctx.shadowColor = color;
        ctx.moveTo(pts[0].x * w, pts[0].y * h);
        for (let i = 1; i < pts.length - 1; i++) {
          const mx = ((pts[i].x + pts[i + 1].x) / 2) * w;
          const my = ((pts[i].y + pts[i + 1].y) / 2) * h;
          ctx.quadraticCurveTo(pts[i].x * w, pts[i].y * h, mx, my);
        }
        ctx.lineTo(pts[pts.length - 1].x * w, pts[pts.length - 1].y * h);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Traveling dot
      const dp = getPoint(pts, c.dotT, w, h);
      const glowR = 14 + Math.sin(frame * 0.035) * 3;

      const dGrad = ctx.createRadialGradient(dp.x, dp.y, 0, dp.x, dp.y, glowR);
      dGrad.addColorStop(0, hexToRgba(color, 0.3));
      dGrad.addColorStop(1, 'transparent');
      ctx.globalAlpha = 1;
      ctx.fillStyle = dGrad;
      ctx.beginPath();
      ctx.arc(dp.x, dp.y, glowR, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 0.75;
      ctx.fillStyle = color;
      ctx.shadowBlur = 6;
      ctx.shadowColor = color;
      ctx.beginPath();
      ctx.arc(dp.x, dp.y, 2.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      c.dotT = (c.dotT + c.dotSpeed) % 1;
    };

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Large ambient glow orbs
      const orbs = [
        { x: 0.5,  y: 0.28, r: 0.42, a: 0.055, phase: 0 },
        { x: 0.08, y: 0.62, r: 0.22, a: 0.032, phase: 2.1 },
        { x: 0.9,  y: 0.52, r: 0.24, a: 0.032, phase: 4.3 },
        { x: 0.22, y: 0.88, r: 0.18, a: 0.02,  phase: 1.5 },
      ];
      orbs.forEach((orb) => {
        const pulse = Math.sin(frame * 0.005 + orb.phase) * 0.025;
        const rr = (orb.r + pulse) * Math.max(w, h) * 0.75;
        const grd = ctx.createRadialGradient(orb.x * w, orb.y * h, 0, orb.x * w, orb.y * h, rr);
        grd.addColorStop(0, `rgba(212,168,67,${orb.a})`);
        grd.addColorStop(0.45, `rgba(212,168,67,${orb.a * 0.35})`);
        grd.addColorStop(1, 'transparent');
        ctx.globalAlpha = 1;
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, w, h);
      });

      // Chart lines
      charts.forEach(c => drawChart(c, w, h));

      // Data point dots on the chart (static accent dots along the primary line)
      const accentPositions = [0.08, 0.25, 0.45, 0.65, 0.82, 0.95];
      accentPositions.forEach((t, idx) => {
        const dp = getPoint(charts[0].pts, t, w, h);
        const pulse = Math.sin(frame * 0.018 + idx * 1.1) * 0.5 + 0.5;
        const r = 1.8 + pulse * 1.2;
        ctx.globalAlpha = 0.12 + pulse * 0.1;
        ctx.fillStyle = '#D4A843';
        ctx.beginPath();
        ctx.arc(dp.x, dp.y, r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Floating particles
      particles.forEach(p => {
        const px = ((p.x + frame * p.vx) % 1 + 1) % 1;
        const py = ((p.y + frame * p.vy) % 1 + 1) % 1;
        const ox = px * w + Math.sin(frame * p.speed * 0.6 + p.phase) * 8;
        const oy = py * h;
        const alpha = p.opacity * (0.65 + Math.sin(frame * p.speed + p.phase) * 0.35);

        const pGrad = ctx.createRadialGradient(ox, oy, 0, ox, oy, p.r * 5);
        pGrad.addColorStop(0, `rgba(212,168,67,${alpha * 2.8})`);
        pGrad.addColorStop(1, 'transparent');
        ctx.globalAlpha = 1;
        ctx.fillStyle = pGrad;
        ctx.beginPath();
        ctx.arc(ox, oy, p.r * 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = alpha * 1.6;
        ctx.fillStyle = '#D4A843';
        ctx.beginPath();
        ctx.arc(ox, oy, p.r, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.globalAlpha = 1;
      frame++;
      raf = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
}
