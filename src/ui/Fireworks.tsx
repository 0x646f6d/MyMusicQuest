import { useEffect, useRef } from 'react';

const COLORS = ['#ff4d6d', '#ffd166', '#06d6a0', '#4cc9f0', '#c77dff', '#ffffff'];
/** How long new rockets are launched (ms); running bursts fade out afterwards. */
const DURATION = 8000;
const GRAVITY = 0.12;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  /** Rockets explode into sparks once they stop rising. */
  rocket: boolean;
}

/** Full-screen fireworks overlay; ignores taps and is skipped with reduced motion. */
export function Fireworks() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles: Particle[] = [];
    const pick = () => COLORS[Math.floor(Math.random() * COLORS.length)];
    const launch = () => {
      const h = canvas.height;
      particles.push({
        x: canvas.width * (0.15 + Math.random() * 0.7),
        y: h,
        vx: (Math.random() - 0.5) * 2,
        vy: -Math.sqrt(2 * GRAVITY * h * (0.45 + Math.random() * 0.35)),
        life: 1,
        color: pick(),
        rocket: true,
      });
    };
    const explode = (p: Particle) => {
      const n = 50 + Math.floor(Math.random() * 30);
      const speed = 3 + Math.random() * 3;
      for (let i = 0; i < n; i++) {
        const angle = (i / n) * Math.PI * 2;
        const v = speed * (0.6 + Math.random() * 0.4);
        particles.push({
          x: p.x,
          y: p.y,
          vx: Math.cos(angle) * v,
          vy: Math.sin(angle) * v,
          life: 1,
          color: Math.random() < 0.2 ? pick() : p.color,
          rocket: false,
        });
      }
    };

    const start = performance.now();
    let lastLaunch = 0;
    let frame = 0;
    const tick = (now: number) => {
      const elapsed = now - start;
      if (elapsed < DURATION && now - lastLaunch > 350 + Math.random() * 400) {
        lastLaunch = now;
        launch();
      }
      // fade the previous frame instead of clearing it, so sparks leave trails
      ctx.globalCompositeOperation = 'destination-out';
      ctx.globalAlpha = 0.3;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'source-over';
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += GRAVITY;
        if (p.rocket) {
          if (p.vy >= 0) {
            particles.splice(i, 1);
            explode(p);
            continue;
          }
        } else {
          p.vx *= 0.98;
          p.vy *= 0.98;
          p.life -= 0.014;
          if (p.life <= 0) {
            particles.splice(i, 1);
            continue;
          }
        }
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.rocket ? 3 : 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      if (elapsed < DURATION || particles.length > 0) frame = requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={ref} className="fireworks" aria-hidden="true" />;
}
