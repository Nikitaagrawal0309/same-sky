import { useEffect, useRef } from "react";

import { cx } from "../../utils/helpers";

/**
 * Rain and snow, drawn on a canvas.
 *
 * Rain is made of a few hundred drops in three depth layers. Near drops are
 * longer, faster and brighter, far ones are faint. All of them fall at the
 * same slight wind angle, and each one bursts into a tiny splash where it
 * hits the ground. Snow uses the same loop with soft, drifting flakes.
 *
 * Only mounted when motion is allowed. The caller renders a still wash
 * otherwise.
 */

export interface PrecipitationCanvasProps {
  kind: "rain" | "snow";

  /** 0–1. Scales how many particles are in the air at once. */
  intensity?: number;

  /**
   * Fraction of the height (0–1) below which the ground starts. Drops land
   * anywhere between this line and the bottom edge.
   */
  groundFrom?: number;

  className?: string;
}

interface Drop {
  x: number;
  y: number;
  length: number;
  speed: number;
  opacity: number;
  width: number;
  /** Where on screen this drop meets the ground. */
  landY: number;
  /** Snow only: sway phase and amplitude. */
  phase: number;
  sway: number;
}

interface Splash {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

interface Ring {
  x: number;
  y: number;
  age: number;
}

const WIND = 0.22; // horizontal pixels per vertical pixel

export function PrecipitationCanvas({
  kind,
  intensity = 1,
  groundFrom = 0.68,
  className,
}: PrecipitationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) return;

    let width = 0;
    let height = 0;
    let drops: Drop[] = [];
    let splashes: Splash[] = [];
    let rings: Ring[] = [];
    let frame = 0;
    let last = performance.now();

    const makeDrop = (fresh: boolean): Drop => {
      // depth: 0 = far, 1 = near
      const depth = Math.random();
      const landY = height * (groundFrom + Math.random() * (1 - groundFrom));

      if (kind === "snow") {
        return {
          x: Math.random() * width * 1.2 - width * 0.1,
          y: fresh ? Math.random() * height : -10,
          length: 1 + depth * 2.6,
          speed: 18 + depth * 38,
          opacity: 0.45 + depth * 0.5,
          width: 0,
          landY,
          phase: Math.random() * Math.PI * 2,
          sway: 8 + Math.random() * 18,
        };
      }

      return {
        x: Math.random() * (width + height * WIND) - height * WIND,
        y: fresh ? Math.random() * height : -40 - Math.random() * 100,
        length: 10 + depth * 22,
        speed: 520 + depth * 680,
        opacity: 0.12 + depth * 0.38,
        width: 0.6 + depth * 0.9,
        landY,
        phase: 0,
        sway: 0,
      };
    };

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);

      const base = kind === "snow" ? 0.12 : 0.38;
      const count = Math.round((width * height * base * intensity) / 1000);
      drops = Array.from({ length: Math.min(count, 900) }, () => makeDrop(true));
    };

    resize();

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      context.clearRect(0, 0, width, height);

      if (kind === "rain") {
        context.lineCap = "round";

        for (const drop of drops) {
          const dy = drop.speed * dt;
          drop.y += dy;
          drop.x += dy * WIND;

          if (drop.y >= drop.landY) {
            // Near drops make a visible splash; far ones just vanish.
            if (drop.width > 1) {
              const pieces = 2 + Math.floor(Math.random() * 3);

              for (let index = 0; index < pieces; index += 1) {
                splashes.push({
                  x: drop.x,
                  y: drop.landY,
                  vx: (Math.random() - 0.5) * 70,
                  vy: -40 - Math.random() * 70,
                  life: 1,
                });
              }

              if (Math.random() < 0.35) rings.push({ x: drop.x, y: drop.landY, age: 0 });
            }

            Object.assign(drop, makeDrop(false));
            continue;
          }

          const tailX = drop.x - drop.length * WIND;
          const tailY = drop.y - drop.length;
          const gradient = context.createLinearGradient(tailX, tailY, drop.x, drop.y);
          gradient.addColorStop(0, "rgba(210, 225, 240, 0)");
          gradient.addColorStop(1, `rgba(220, 232, 245, ${drop.opacity})`);

          context.strokeStyle = gradient;
          context.lineWidth = drop.width;
          context.beginPath();
          context.moveTo(tailX, tailY);
          context.lineTo(drop.x, drop.y);
          context.stroke();
        }

        // Splash droplets: tiny arcs flung up and pulled back down.
        context.fillStyle = "rgba(225, 236, 248, 0.7)";
        splashes = splashes.filter((splash) => {
          splash.life -= dt * 2.6;
          splash.vy += 260 * dt;
          splash.x += splash.vx * dt;
          splash.y += splash.vy * dt;

          if (splash.life <= 0) return false;

          context.globalAlpha = splash.life;
          context.beginPath();
          context.arc(splash.x, splash.y, 0.9, 0, Math.PI * 2);
          context.fill();
          return true;
        });

        // Small flattened rings where drops hit wet ground.
        context.strokeStyle = "rgba(220, 232, 245, 0.55)";
        context.lineWidth = 0.6;
        rings = rings.filter((ring) => {
          ring.age += dt * 2.2;

          if (ring.age >= 1) return false;

          context.globalAlpha = 1 - ring.age;
          context.beginPath();
          context.ellipse(ring.x, ring.y, 1 + ring.age * 7, 0.4 + ring.age * 2, 0, 0, Math.PI * 2);
          context.stroke();
          return true;
        });

        context.globalAlpha = 1;
      } else {
        for (const flake of drops) {
          flake.y += flake.speed * dt;
          flake.phase += dt * 1.2;
          const x = flake.x + Math.sin(flake.phase) * flake.sway;

          if (flake.y > height + 6) {
            Object.assign(flake, makeDrop(false));
            continue;
          }

          const glow = context.createRadialGradient(x, flake.y, 0, x, flake.y, flake.length * 1.8);
          glow.addColorStop(0, `rgba(255, 255, 255, ${flake.opacity})`);
          glow.addColorStop(1, "rgba(255, 255, 255, 0)");
          context.fillStyle = glow;
          context.beginPath();
          context.arc(x, flake.y, flake.length * 1.8, 0, Math.PI * 2);
          context.fill();
        }
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [kind, intensity, groundFrom]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={cx("pointer-events-none absolute inset-0 size-full", className)}
    />
  );
}
