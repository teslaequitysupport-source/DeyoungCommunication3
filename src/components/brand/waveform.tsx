"use client";

import { useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

/**
 * Waveform canvas bound to real amplitude data.
 *
 * - When `amplitudes` updates (typed stream from real audio), it renders live bars.
 * - Idle state renders a flat, calm baseline. No fake "listening" animation.
 * - prefers-reduced-motion freezes bar animation but still reflects real data.
 */
export function Waveform({
  amplitudes,
  color = "#E10600",
  baselineColor = "#262626",
  height = 56,
  barWidth = 3,
  gap = 2,
  className,
  label,
}: {
  amplitudes: number[];
  color?: string;
  baselineColor?: string;
  height?: number;
  barWidth?: number;
  gap?: number;
  className?: string;
  label?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dataRef = useRef<number[]>(amplitudes);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = height;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const mid = h / 2;
    const data = dataRef.current;
    const step = barWidth + gap;
    const count = Math.max(8, Math.floor(w / step));
    const values = data.length
      ? data.slice(-count)
      : [];

    // Flat baseline first (idle = visibly still).
    ctx.fillStyle = baselineColor;
    ctx.fillRect(0, mid - 0.75, w, 1.5);

    const pad = Math.max(0, (w - values.length * step) / 2);
    for (let i = 0; i < values.length; i++) {
      const v = Math.min(1, Math.max(0.04, values[i]));
      const barH = Math.max(2, v * (h - 6));
      const x = pad + i * step;
      // Center-weighted emphasis like real speech energy.
      const edge = Math.abs(i / Math.max(1, values.length - 1) - 0.5) * 2;
      const amp = barH * (1 - 0.35 * edge);
      ctx.fillStyle = i === values.length - 1 ? color : color;
      ctx.globalAlpha = i === values.length - 1 ? 1 : 0.55 + 0.45 * v;
      ctx.fillRect(x, mid - amp / 2, barWidth, amp);
    }
    ctx.globalAlpha = 1;
  }, [barWidth, gap, height, color, baselineColor]);

  useEffect(() => {
    dataRef.current = amplitudes;
    draw();
    const onResize = () => draw();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [draw, amplitudes]);

  return (
    <span className={cn("block relative", className)} role="img" aria-label={label ?? "Live audio waveform"}>
      <canvas ref={canvasRef} className="dy-wave" style={{ height }} />
    </span>
  );
}

/**
 * Maps a real-time AnalyserNode into amplitude values (0..1).
 * Returns a cleanup fn. Used by Voice Studio practice mode and the
 * Live Call room when a real session exists.
 */
export function attachMicAnalyser(
  stream: MediaStream,
  onData: (amplitudes: number[]) => void,
  history = 64,
): () => void {
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AudioCtx();
  const source = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 512;
  source.connect(analyser);
  const buf = new Uint8Array(analyser.frequencyBinCount);
  const amplitudes: number[] = [];
  let raf = 0;
  const tick = () => {
    analyser.getByteTimeDomainData(buf);
    let sum = 0;
    for (let i = 0; i < buf.length; i++) {
      const v = (buf[i] - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / buf.length);
    amplitudes.push(Math.min(1, rms * 3.2));
    if (amplitudes.length > history) amplitudes.shift();
    onData([...amplitudes]);
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => {
    cancelAnimationFrame(raf);
    source.disconnect();
    ctx.close().catch(() => {});
  };
}
