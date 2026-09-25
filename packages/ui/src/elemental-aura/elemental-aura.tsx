/**
 * Аура стихии на canvas — атмосфера вокруг активного наставника (task.md §9).
 *
 * Правила (agent.md, «Известные ловушки»): без анимационных библиотек, при
 * prefers-reduced-motion статичный кадр, rAF останавливается на скрытой вкладке,
 * на слабых планшетах частиц меньше и прозрачность не выше 0.6. В React состояние
 * не участвует — работаем через ref, чтобы не перерисовывать дерево 60 раз в секунду.
 */
import { useEffect, useRef } from "react";
import { cn } from "../cn/cn";
import styles from "./elemental-aura.module.css";

export type ElementalAuraProps = {
  readonly element: "pyro" | "hydro" | "anemo" | "geo" | "electro" | "dendro" | "cryo";
  /** Больше частиц — на живом экране, меньше — в списках. */
  readonly density?: "full" | "lite";
  readonly className?: string;
};

type Particle = { x: number; y: number; vx: number; vy: number; r: number; a: number };

const COLORS: Record<ElementalAuraProps["element"], string> = {
  pyro: "255, 123, 74",
  hydro: "61, 166, 255",
  anemo: "115, 224, 201",
  geo: "230, 193, 90",
  electro: "192, 140, 255",
  dendro: "165, 224, 90",
  cryo: "159, 231, 255",
};

const FULL_PARTICLES = 42;
const LITE_PARTICLES = 16;
const MAX_ALPHA = 0.6;

export const ElementalAura = ({ element, density = "full", className }: ElementalAuraProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const count = density === "lite" ? LITE_PARTICLES : FULL_PARTICLES;
    const color = COLORS[element];
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const particles: Particle[] = Array.from({ length: count }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.0006,
      vy: -0.0004 - Math.random() * 0.0006,
      r: 1 + Math.random() * 2.4,
      a: 0.15 + Math.random() * (MAX_ALPHA - 0.15),
    }));

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = (time: number) => {
      const rect = canvas.getBoundingClientRect();
      context.clearRect(0, 0, rect.width, rect.height);
      for (const particle of particles) {
        if (!reduceMotion) {
          particle.x = (particle.x + particle.vx * 16 + 1) % 1;
          particle.y = (particle.y + particle.vy * 16 + 1) % 1;
        }
        const shimmer = reduceMotion ? 1 : 0.75 + 0.25 * Math.sin(time / 900 + particle.r);
        context.beginPath();
        context.fillStyle = `rgba(${color}, ${(particle.a * shimmer).toFixed(3)})`;
        context.arc(particle.x * rect.width, particle.y * rect.height, particle.r, 0, Math.PI * 2);
        context.fill();
      }
    };

    if (reduceMotion) {
      draw(0);
      return () => {
        window.removeEventListener("resize", resize);
      };
    }

    let frame = 0;
    const loop = (time: number) => {
      draw(time);
      frame = window.requestAnimationFrame(loop);
    };
    frame = window.requestAnimationFrame(loop);

    const onVisibility = () => {
      if (document.hidden) {
        window.cancelAnimationFrame(frame);
        return;
      }
      frame = window.requestAnimationFrame(loop);
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", resize);
    };
  }, [density, element]);

  return <canvas ref={canvasRef} className={cn(styles.aura, className)} />;
};
