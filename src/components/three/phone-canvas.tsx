"use client";

/**
 * DEYOUNG 3D Phone · the hero product shot.
 * A real WebGL phone floating in space: physical titanium body, red rim light,
 * and a screen that IS a live canvas texture (console UI redrawn every frame:
 * animated waveform, ticking call timer, live counters from the database).
 * Fallback (no WebGL / reduced motion) is the DOM phone in phone-scene.tsx.
 */

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";

export type PhoneStats = { users: number; employees: number; calls: number; messages: number } | null;

/* ---------------- console screen drawn as a live texture ---------------- */

const W = 480;
const H = 1040;

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawConsole(ctx: CanvasRenderingContext2D, t: number, stats: PhoneStats) {
  // Base
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, W, H);

  // Faint cerulean atmosphere at top
  const grad = ctx.createRadialGradient(W / 2, 90, 20, W / 2, 90, 420);
  grad.addColorStop(0, "rgba(10,91,196,0.12)");
  grad.addColorStop(1, "rgba(10,91,196,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, 420);

  // Notch
  ctx.fillStyle = "#000";
  rr(ctx, W / 2 - 62, 14, 124, 26, 13);
  ctx.fill();

  // Status bar
  ctx.fillStyle = "#e5e5e5";
  ctx.font = "600 24px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.textAlign = "left";
  ctx.fillText("9:41", 34, 48);
  // signal bars
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = i < 3 ? "#e5e5e5" : "#4a4a4a";
    ctx.fillRect(W - 130 + i * 11, 40 - (6 + i * 5), 7, 6 + i * 5);
  }
  // battery
  ctx.strokeStyle = "#e5e5e5";
  ctx.lineWidth = 2;
  rr(ctx, W - 78, 28, 44, 18, 4);
  ctx.stroke();
  ctx.fillStyle = "#4a90e2";
  ctx.fillRect(W - 74, 32, 28, 10);
  ctx.fillRect(W - 32, 33, 4, 8);

  // Header: LIVE CALL + ticking duration
  const dot = ctx.createRadialGradient(46, 104, 2, 46, 104, 14);
  dot.addColorStop(0, "rgba(74,144,226,1)");
  dot.addColorStop(1, "rgba(74,144,226,0)");
  ctx.fillStyle = dot;
  ctx.fillRect(30, 88, 34, 34);
  ctx.fillStyle = "#4a90e2";
  ctx.beginPath();
  ctx.arc(46, 104, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#6fd6ff";
  ctx.font = "500 22px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillText("LIVE CALL", 68, 112);
  const secs = Math.floor(t) % 90;
  ctx.fillStyle = "#8a8a8a";
  ctx.textAlign = "right";
  ctx.fillText(`0:${String(Math.floor(secs / 60)).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`, W - 34, 112);
  ctx.textAlign = "left";

  ctx.strokeStyle = "rgba(255,255,255,0.09)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(24, 136);
  ctx.lineTo(W - 24, 136);
  ctx.stroke();

  // Bubble 1: caller
  ctx.fillStyle = "#0B1628";
  rr(ctx, 26, 168, 300, 96, 10);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.09)";
  ctx.stroke();
  ctx.fillStyle = "#d4d4d4";
  ctx.font = "400 27px Inter, system-ui, -apple-system, sans-serif";
  ctx.fillText("Hi, do you take bookings", 46, 208);
  ctx.fillText("on Sundays?", 46, 244);

  // Bubble 2: ADA with cue chip + latency
  const bx = 152;
  const by = 290;
  ctx.fillStyle = "rgba(10,91,196,0.10)";
  rr(ctx, bx, by, 302, 150, 10);
  ctx.fill();
  ctx.strokeStyle = "rgba(74,144,226,0.4)";
  ctx.stroke();
  ctx.fillStyle = "#6fcbff";
  ctx.font = "500 20px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillText("ADA · 412MS", bx + 20, by + 34);
  // breathes chip
  ctx.fillStyle = "rgba(47,212,255,0.10)";
  rr(ctx, bx + 148, by + 16, 120, 30, 5);
  ctx.fill();
  ctx.strokeStyle = "rgba(47,212,255,0.45)";
  ctx.stroke();
  ctx.fillStyle = "#6fd6ff";
  ctx.font = "500 18px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillText("BREATHES", bx + 160, by + 37);
  ctx.fillStyle = "#e8e8e8";
  ctx.font = "400 27px Inter, system-ui, -apple-system, sans-serif";
  ctx.fillText("We do. Sundays run", bx + 20, by + 78);
  ctx.fillText("nine to two.", bx + 20, by + 114);

  // Bubble 3: barge-in
  ctx.fillStyle = "#0B1628";
  rr(ctx, 26, 468, 260, 84, 10);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.09)";
  ctx.stroke();
  ctx.fillStyle = "#4a90e2";
  ctx.font = "500 18px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillText("INTERRUPTED · BARGE-IN", 46, 500);
  ctx.fillStyle = "#d4d4d4";
  ctx.font = "400 25px Inter, system-ui, -apple-system, sans-serif";
  ctx.fillText("Wait, afternoon instead", 46, 534);

  // Waveform box
  ctx.fillStyle = "rgba(255,255,255,0.02)";
  rr(ctx, 26, 588, W - 52, 118, 10);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.stroke();
  const bars = 36;
  const bw = (W - 52 - 60) / bars;
  for (let i = 0; i < bars; i++) {
    const amp = Math.abs(Math.sin(t * 2.6 + i * 0.55) * 0.7 + Math.sin(t * 1.1 + i * 0.21) * 0.3);
    const bh = 12 + amp * 78;
    ctx.fillStyle = amp > 0.72 ? "#2fd4ff" : "rgba(74,144,226,0.8)";
    ctx.fillRect(56 + i * bw, 588 + 59 - bh / 2, bw - 5, bh);
  }

  // Live counters row
  const cells = [
    { label: "USERS", v: stats ? String(stats.users) : "0" },
    { label: "EMPLOYEES", v: stats ? String(stats.employees) : "0" },
    { label: "CALLS", v: stats ? String(stats.calls) : "0" },
    { label: "MSGS", v: stats ? String(stats.messages) : "0" },
  ];
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.beginPath();
  ctx.moveTo(24, 738);
  ctx.lineTo(W - 24, 738);
  ctx.stroke();
  cells.forEach((c, i) => {
    const cx = 34 + i * 106;
    ctx.fillStyle = "#f5f5f3";
    ctx.font = "700 34px Inter, system-ui, -apple-system, sans-serif";
    ctx.fillText(c.v, cx, 792);
    ctx.fillStyle = "#737373";
    ctx.font = "500 15px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillText(c.label, cx, 818);
  });

  // End-call button
  const ex = W / 2;
  const ey = 926;
  ctx.fillStyle = "#4a90e2";
  ctx.beginPath();
  ctx.arc(ex, ey, 46, 0, Math.PI * 2);
  ctx.fill();
  // handset glyph
  ctx.save();
  ctx.translate(ex, ey);
  ctx.rotate(-Math.PI / 4);
  ctx.fillStyle = "#ffffff";
  rr(ctx, -18, -7, 36, 14, 7);
  ctx.fill();
  ctx.restore();
  // slash
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(ex - 20, ey + 20);
  ctx.lineTo(ex + 20, ey - 20);
  ctx.stroke();

  // Home indicator
  ctx.fillStyle = "#737373";
  rr(ctx, W / 2 - 70, H - 26, 140, 8, 4);
  ctx.fill();

  // Screen caption (part of the product shot, honest label)
  ctx.fillStyle = "#565656";
  ctx.font = "500 16px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.textAlign = "center";
  ctx.fillText("PRODUCT PREVIEW · COUNTERS READ THE LIVE DATABASE", W / 2, 1004);
  ctx.textAlign = "left";
}

/* ---------------- shadow blob texture ---------------- */

function makeShadowTexture(): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(64, 64, 6, 64, 64, 62);
  g.addColorStop(0, "rgba(0,0,0,0.55)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

/* ---------------- the phone ---------------- */

function Phone({ stats, reduced }: { stats: PhoneStats; reduced: boolean }) {
  const group = useRef<THREE.Group>(null!);
  const frameCount = useRef(0);
  const shadowTex = useMemo(() => makeShadowTexture(), []);

  // The screen IS a canvas texture, created once; the frame loop redraws it.
  const screen = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;
    drawConsole(ctx, 0, stats);
    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 4;
    texture.colorSpace = THREE.SRGBColorSpace;
    return { canvas, texture };
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // Live screen redraw, throttled to ~30fps via frame counter
    frameCount.current++;
    if (!reduced && frameCount.current % 2 === 0) {
      const ctx = screen.canvas.getContext("2d");
      if (ctx) {
        drawConsole(ctx, t, stats);
        // three.js canvas textures are imperative by design: flag the GPU upload.
        // eslint-disable-next-line react-hooks/immutability
        screen.texture.needsUpdate = true;
      }
    }
    if (reduced) return;
    const g = group.current;
    if (!g) return;
    g.rotation.y = Math.sin(t * 0.32) * 0.16 + state.pointer.x * 0.2;
    g.rotation.x = Math.sin(t * 0.47) * 0.045 - state.pointer.y * 0.12;
    g.position.y = Math.sin(t * 0.85) * 0.075;
  });

  return (
    <group ref={group} rotation={[0.03, -0.12, 0]}>
      {/* titanium body */}
      <RoundedBox args={[2.04, 4.14, 0.2]} radius={0.12} smoothness={10} castShadow={false}>
        <meshPhysicalMaterial
          color="#141414"
          metalness={0.65}
          roughness={0.32}
          clearcoat={1}
          clearcoatRoughness={0.22}
        />
      </RoundedBox>
      {/* the live screen */}
      <mesh position={[0, 0, 0.101]}>
        <planeGeometry args={[1.8, 3.9]} />
        <meshBasicMaterial map={screen.texture} toneMapped={false} />
      </mesh>
      {/* signal red edge light on the right rail */}
      <mesh position={[1.02, 0, 0.0]}>
        <boxGeometry args={[0.02, 3.1, 0.05]} />
        <meshBasicMaterial color="#4a90e2" toneMapped={false} />
      </mesh>
      {/* contact shadow */}
      <mesh position={[0, -2.5, -0.4]} rotation={[-Math.PI / 2.06, 0, 0]}>
        <planeGeometry args={[4.4, 2.2]} />
        <meshBasicMaterial map={shadowTex} transparent opacity={0.7} depthWrite={false} />
      </mesh>
    </group>
  );
}

export default function PhoneCanvas({ stats, reduced }: { stats: PhoneStats; reduced: boolean }) {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0, 8.6], fov: 32 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ background: "transparent" }}
    >
      <fog attach="fog" args={["#070E1A", 10, 18]} />
      <ambientLight intensity={0.85} />
      <directionalLight position={[5, 7, 6]} intensity={1.5} />
      {/* signal red rim light */}
      <pointLight position={[-4.4, -0.6, 3.4]} intensity={26} distance={14} decay={2} color="#4a90e2" />
      <pointLight position={[4.4, 2.4, 3]} intensity={10} distance={12} decay={2} color="#ffffff" />
      <Phone stats={stats} reduced={reduced} />
    </Canvas>
  );
}
