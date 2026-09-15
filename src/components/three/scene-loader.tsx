"use client";

/**
 * 3D scene loader with honest degradation:
 * WebGL available → live r3f scene.
 * WebGL missing     → 2D canvas bar field.
 * Reduced motion    → static frame (single draw, no animation loop).
 * Uses useSyncExternalStore so SSR/hydration stay consistent.
 */

import dynamic from "next/dynamic";
import { useEffect, useRef, useSyncExternalStore } from "react";

const HeroScene = dynamic(() => import("./hero-scene"), { ssr: false });

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

const noopSubscribe = () => () => {};

/** "ssr" server / "webgl" / "2d" client: resolved once, before first paint. */
const glSupport = () => (typeof window === "undefined" ? "ssr" : hasWebGL() ? "webgl" : "2d");

function subscribeReducedMotion(cb: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

/** 2D fallback: calm bar field, drawn once (static) or gently animated. */
function BarField2D({ reduced }: { reduced: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
    };
    resize();
    const bars = 72;
    const draw = (t: number) => {
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      const bw = w / bars;
      for (let i = 0; i < bars; i++) {
        const phase = reduced ? 0.5 : 0.5 + 0.4 * Math.sin(t * 0.0012 + i * 0.35);
        const bh = h * 0.08 + phase * h * 0.34;
        const hot = phase > 0.82;
        ctx.fillStyle = hot ? "#4a90e2" : "#232323";
        ctx.fillRect(i * bw + bw * 0.22, h - bh, bw * 0.56, bh);
      }
    };
    draw(0);
    let raf = 0;
    if (!reduced) {
      const loop = (t: number) => {
        draw(t);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }
    const onResize = () => {
      resize();
      draw(0);
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [reduced]);
  return <canvas ref={ref} className="h-full w-full" aria-hidden="true" />;
}

export function HeroScene3D({ className, fallbackClassName }: { className?: string; fallbackClassName?: string }) {
  const support = useSyncExternalStore(noopSubscribe, glSupport, () => "ssr" as const);
  const reduced = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );

  if (support === "ssr") {
    return <div className={fallbackClassName ?? className} aria-hidden="true" />;
  }
  if (support === "2d" || reduced) {
    return (
      <div className={fallbackClassName ?? className} aria-hidden="true">
        <BarField2D reduced={reduced} />
      </div>
    );
  }
  return <HeroScene className={className} />;
}
