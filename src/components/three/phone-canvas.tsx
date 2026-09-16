"use client";

/**
 * DEYOUNG 3D Phone · the hero product shot, built like a studio photograph.
 * Physically-based titanium body, layered front glass, a Lightformer studio
 * environment (rendered locally, no external HDR fetch), soft contact shadows,
 * and a screen that IS a live canvas texture: an honest iOS-style call UI
 * whose counters read the live database.
 * Fallback (no WebGL / reduced motion) is the DOM phone in phone-scene.tsx.
 */

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { RoundedBox, Environment, Lightformer, ContactShadows } from "@react-three/drei";
import * as THREE from "three";

export type PhoneStats = { users: number; employees: number; calls: number; messages: number } | null;

/* ---------------- console screen drawn as a live texture ---------------- */

const W = 512;
const H = 1108;

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Soft two-stop vertical fill helper for glassy panels. */
function panelFill(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, a: string, b: string) {
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, a);
  g.addColorStop(1, b);
  ctx.fillStyle = g;
  rr(ctx, x, y, w, h, r);
  ctx.fill();
}

function drawConsole(ctx: CanvasRenderingContext2D, t: number, stats: PhoneStats) {
  // Wallpaper: deep ink with a cerulean aurora, like a real lock screen.
  ctx.fillStyle = "#05070D";
  ctx.fillRect(0, 0, W, H);
  const aurora = ctx.createRadialGradient(W * 0.72, H * 0.18, 30, W * 0.72, H * 0.18, 640);
  aurora.addColorStop(0, "rgba(46,124,222,0.34)");
  aurora.addColorStop(0.5, "rgba(46,124,222,0.10)");
  aurora.addColorStop(1, "rgba(46,124,222,0)");
  ctx.fillStyle = aurora;
  ctx.fillRect(0, 0, W, H);
  const aurora2 = ctx.createRadialGradient(W * 0.18, H * 0.55, 20, W * 0.18, H * 0.55, 520);
  aurora2.addColorStop(0, "rgba(47,212,255,0.12)");
  aurora2.addColorStop(1, "rgba(47,212,255,0)");
  ctx.fillStyle = aurora2;
  ctx.fillRect(0, 0, W, H);

  // Dynamic island
  ctx.fillStyle = "#000";
  rr(ctx, W / 2 - 58, 18, 116, 30, 15);
  ctx.fill();

  // Status bar
  ctx.fillStyle = "#F2F5FA";
  ctx.font = "700 26px Inter, system-ui, -apple-system, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("9:41", 36, 50);
  // 5G + wifi glyph
  ctx.font = "600 20px Inter, system-ui, -apple-system, sans-serif";
  ctx.fillText("5G", W - 176, 49);
  ctx.strokeStyle = "#F2F5FA";
  ctx.lineWidth = 2.4;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(W - 130, 48, 4 + i * 4.5, Math.PI * 1.25, Math.PI * 1.75);
    ctx.stroke();
  }
  // battery
  rr(ctx, W - 84, 30, 46, 20, 5);
  ctx.stroke();
  ctx.fillStyle = "#F2F5FA";
  rr(ctx, W - 81, 33, 32, 14, 3);
  ctx.fill();
  rr(ctx, W - 35, 36, 4, 8, 2);
  ctx.fill();

  /* ---- Call sheet: slides from top like a real in-call UI ---- */

  // Caller identity: avatar with living ring
  const cx = W / 2;
  const cy = 176;
  const ringR = 78 + Math.sin(t * 1.9) * 3;
  const ring = ctx.createRadialGradient(cx, cy, ringR * 0.4, cx, cy, ringR + 26);
  ring.addColorStop(0, "rgba(47,212,255,0.28)");
  ring.addColorStop(1, "rgba(47,212,255,0)");
  ctx.fillStyle = ring;
  ctx.beginPath();
  ctx.arc(cx, cy, ringR + 26, 0, Math.PI * 2);
  ctx.fill();
  // avatar disc
  const av = ctx.createLinearGradient(cx - 60, cy - 60, cx + 60, cy + 60);
  av.addColorStop(0, "#2E7CDE");
  av.addColorStop(0.55, "#1E5FB8");
  av.addColorStop(1, "#0E2C57");
  ctx.fillStyle = av;
  ctx.beginPath();
  ctx.arc(cx, cy, 74, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.28)";
  ctx.lineWidth = 2;
  ctx.stroke();
  // initials
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "700 52px Inter, system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("MC", cx, cy + 2);
  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "600 34px Inter, system-ui, -apple-system, sans-serif";
  ctx.fillText("Maya Clinic", cx, 292);
  ctx.fillStyle = "rgba(214,228,244,0.75)";
  ctx.font = "500 22px Inter, system-ui, -apple-system, sans-serif";
  ctx.fillText("AI Receptionist · on the line", cx, 324);

  // Timer chip
  const secs = Math.floor(t) % 600;
  const timeStr = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
  panelFill(ctx, cx - 56, 344, 112, 38, 19, "rgba(255,255,255,0.13)", "rgba(255,255,255,0.06)");
  ctx.fillStyle = "#CFF3FF";
  ctx.font = "600 21px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillText(timeStr, cx, 370);

  /* ---- Live transcript: two clean bubbles (no labels, no cue text) ---- */

  // caller bubble (left)
  panelFill(ctx, 34, 420, 320, 96, 22, "rgba(255,255,255,0.10)", "rgba(255,255,255,0.05)");
  ctx.strokeStyle = "rgba(255,255,255,0.09)";
  ctx.lineWidth = 1.5;
  rr(ctx, 34, 420, 320, 96, 22);
  ctx.stroke();
  ctx.fillStyle = "#E9EFF7";
  ctx.font = "400 27px Inter, system-ui, -apple-system, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("Do you take bookings", 58, 458);
  ctx.fillText("on Sundays?", 58, 492);

  // AI bubble (right, cerulean glass)
  const bx = 158;
  panelFill(ctx, bx, 540, 320, 122, 22, "rgba(58,140,236,0.34)", "rgba(30,95,184,0.22)");
  ctx.strokeStyle = "rgba(111,203,255,0.35)";
  rr(ctx, bx, 540, 320, 122, 22);
  ctx.stroke();
  ctx.fillStyle = "#F4FAFF";
  ctx.fillText("We do. Sundays run", bx + 24, 580);
  ctx.fillText("nine to two.", bx + 24, 616);

  // barge-in chip under AI bubble
  const pulse = 0.6 + Math.abs(Math.sin(t * 2.2)) * 0.4;
  ctx.fillStyle = `rgba(47,212,255,${0.10 + pulse * 0.08})`;
  rr(ctx, bx, 676, 190, 32, 16);
  ctx.fill();
  ctx.strokeStyle = `rgba(47,212,255,${0.35 + pulse * 0.3})`;
  ctx.lineWidth = 1.4;
  rr(ctx, bx, 676, 190, 32, 16);
  ctx.stroke();
  ctx.fillStyle = "#9FE4FF";
  ctx.font = "600 17px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillText("BARGE-IN · LIVE", bx + 16, 697);

  /* ---- Waveform: glossy studio meter ---- */

  panelFill(ctx, 34, 742, W - 68, 108, 24, "rgba(255,255,255,0.05)", "rgba(255,255,255,0.02)");
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1.5;
  rr(ctx, 34, 742, W - 68, 108, 24);
  ctx.stroke();
  const bars = 30;
  const bw = (W - 68 - 72) / bars;
  for (let i = 0; i < bars; i++) {
    const amp = Math.abs(Math.sin(t * 2.6 + i * 0.55) * 0.7 + Math.sin(t * 1.1 + i * 0.21) * 0.3);
    const bh = 10 + amp * 62;
    const x = 62 + i * bw;
    const y = 742 + 54 - bh / 2;
    const g = ctx.createLinearGradient(0, y, 0, y + bh);
    if (amp > 0.72) {
      g.addColorStop(0, "#6fd6ff");
      g.addColorStop(1, "#2fd4ff");
    } else {
      g.addColorStop(0, "rgba(111,203,255,0.95)");
      g.addColorStop(1, "rgba(46,124,222,0.85)");
    }
    ctx.fillStyle = g;
    rr(ctx, x, y, bw - 6, bh, 2.5);
    ctx.fill();
    ctx.fillStyle = "rgba(232,248,255,0.5)";
    rr(ctx, x, y, bw - 6, Math.max(2, bh * 0.16), 2);
    ctx.fill();
  }

  /* ---- Live counters (honest: they read the database) ---- */

  ctx.strokeStyle = "rgba(255,255,255,0.09)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(34, 884);
  ctx.lineTo(W - 34, 884);
  ctx.stroke();
  const cells = [
    { label: "USERS", v: stats ? String(stats.users) : "0" },
    { label: "EMPLOYEES", v: stats ? String(stats.employees) : "0" },
    { label: "CALLS", v: stats ? String(stats.calls) : "0" },
    { label: "MSGS", v: stats ? String(stats.messages) : "0" },
  ];
  cells.forEach((c, i) => {
    const cw = (W - 68) / 4;
    const ccx = 34 + cw * i + cw / 2;
    ctx.fillStyle = "#F5F5F3";
    ctx.font = "700 36px Inter, system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(c.v, ccx, 936);
    ctx.fillStyle = "rgba(214,228,244,0.55)";
    ctx.font = "600 15px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillText(c.label, ccx, 960);
  });

  /* ---- Call controls: iOS-style circles ---- */

  const ctrlY = 1006;
  const xs = [80, 197.3, 314.7, 432];
  const drawCtl = (x: number, glyph: "mic" | "pad" | "wave", on: boolean) => {
    ctx.fillStyle = on ? "#FFFFFF" : "rgba(255,255,255,0.14)";
    ctx.beginPath();
    ctx.arc(x, ctrlY, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = on ? "#0B1D36" : "#DDE8F4";
    ctx.fillStyle = on ? "#0B1D36" : "#DDE8F4";
    ctx.lineWidth = 3;
    if (glyph === "mic") {
      rr(ctx, x - 6, ctrlY - 13, 12, 18, 6);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, ctrlY + 9, 8, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
    } else if (glyph === "pad") {
      for (let r = 0; r < 3; r++) {
        for (let c2 = 0; c2 < 3; c2++) {
          ctx.beginPath();
          ctx.arc(x - 8 + c2 * 8, ctrlY - 8 + r * 8, 1.9, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else {
      ctx.beginPath();
      ctx.arc(x, ctrlY, 11, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, ctrlY, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
  };
  drawCtl(xs[0], "mic", false);
  drawCtl(xs[1], "pad", false);
  drawCtl(xs[2], "wave", true);

  // 4th control: end call. Filled cerulean with a handset-down glyph
  // (product palette: cerulean, never red).
  {
    const ex = xs[3];
    const eg = ctx.createLinearGradient(0, ctrlY - 34, 0, ctrlY + 34);
    eg.addColorStop(0, "#3D8AEC");
    eg.addColorStop(1, "#2364C4");
    ctx.fillStyle = eg;
    ctx.beginPath();
    ctx.arc(ex, ctrlY, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.22)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.save();
    ctx.translate(ex, ctrlY);
    ctx.rotate(-Math.PI / 4);
    ctx.fillStyle = "#FFFFFF";
    rr(ctx, -19, -7, 38, 14, 7);
    ctx.fill();
    ctx.restore();
  }

  // Home indicator
  ctx.fillStyle = "rgba(214,228,244,0.5)";
  rr(ctx, W / 2 - 72, H - 22, 144, 8, 4);
  ctx.fill();
}

/* ---------------- the phone ---------------- */

function Phone({ stats, reduced }: { stats: PhoneStats; reduced: boolean }) {
  const group = useRef<THREE.Group>(null!);
  const frameCount = useRef(0);

  // The screen IS a canvas texture, created once; the frame loop redraws it.
  const screen = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;
    drawConsole(ctx, 0, stats);
    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 8;
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
    g.rotation.y = Math.sin(t * 0.32) * 0.14 + state.pointer.x * 0.22;
    g.rotation.x = Math.sin(t * 0.47) * 0.04 - state.pointer.y * 0.12;
    g.position.y = Math.sin(t * 0.85) * 0.07;
  });

  const glassGlare = useMemo(() => {
    // Diagonal specular streak, like light on real cover glass.
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 512;
    const ctx = c.getContext("2d")!;
    const g = ctx.createLinearGradient(60, 0, 200, 512);
    g.addColorStop(0, "rgba(255,255,255,0)");
    g.addColorStop(0.28, "rgba(255,255,255,0.11)");
    g.addColorStop(0.38, "rgba(255,255,255,0.03)");
    g.addColorStop(0.62, "rgba(255,255,255,0.13)");
    g.addColorStop(0.72, "rgba(255,255,255,0.02)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 512);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  return (
    <group ref={group} rotation={[0.02, -0.14, 0]}>
      {/* titanium chassis */}
      <RoundedBox args={[2.06, 4.24, 0.22]} radius={0.17} smoothness={12} castShadow>
        <meshPhysicalMaterial
          color="#3c3f46"
          metalness={0.95}
          roughness={0.28}
          clearcoat={0.6}
          clearcoatRoughness={0.3}
          envMapIntensity={1.15}
        />
      </RoundedBox>
      {/* polished side buttons */}
      <mesh position={[1.04, 0.65, 0]}>
        <boxGeometry args={[0.028, 0.62, 0.09]} />
        <meshPhysicalMaterial color="#9aa0aa" metalness={1} roughness={0.18} />
      </mesh>
      <mesh position={[-1.04, 0.95, 0]}>
        <boxGeometry args={[0.028, 0.34, 0.09]} />
        <meshPhysicalMaterial color="#9aa0aa" metalness={1} roughness={0.18} />
      </mesh>
      <mesh position={[-1.04, 0.5, 0]}>
        <boxGeometry args={[0.028, 0.34, 0.09]} />
        <meshPhysicalMaterial color="#9aa0aa" metalness={1} roughness={0.18} />
      </mesh>
      {/* black front glass, slightly proud of the frame */}
      <mesh position={[0, 0, 0.113]}>
        <boxGeometry args={[1.98, 4.16, 0.02]} />
        <meshPhysicalMaterial
          color="#05070c"
          metalness={0.1}
          roughness={0.08}
          clearcoat={1}
          clearcoatRoughness={0.06}
          envMapIntensity={1.6}
        />
      </mesh>
      {/* the live screen */}
      <mesh position={[0, 0, 0.126]}>
        <planeGeometry args={[1.84, 4.02]} />
        <meshBasicMaterial map={screen.texture} toneMapped={false} />
      </mesh>
      {/* cover-glass specular streak (additive: reads as real glare) */}
      <mesh position={[0, 0, 0.132]} rotation={[0, 0, -0.28]}>
        <planeGeometry args={[1.9, 4.08]} />
        <meshBasicMaterial
          map={glassGlare}
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      {/* cerulean edge light along the right rail */}
      <mesh position={[1.035, 0, 0.0]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.012, 3.2, 0.045]} />
        <meshBasicMaterial color="#4a90e2" toneMapped={false} />
      </mesh>
    </group>
  );
}

export default function PhoneCanvas({ stats, reduced }: { stats: PhoneStats; reduced: boolean }) {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0, 8.8], fov: 30 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance", toneMapping: THREE.ACESFilmicToneMapping }}
      style={{ background: "transparent" }}
    >
      <fog attach="fog" args={["#070E1A", 11, 19]} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 7, 6]} intensity={1.6} />
      {/* cerulean rim light */}
      <pointLight position={[-4.6, -0.8, 3.6]} intensity={30} distance={14} decay={2} color="#4a90e2" />
      <pointLight position={[4.6, 2.6, 3.2]} intensity={12} distance={12} decay={2} color="#ffffff" />
      {/* Studio environment rendered from local lightformers (no external HDR fetch) */}
      <Environment resolution={256}>
        <group rotation={[-Math.PI / 3, 0, 0]}>
          <Lightformer form="circle" intensity={4} position={[0, 5, -9]} scale={2} />
          <Lightformer form="rect" intensity={2} color="#dfeeff" position={[-5, 1, -1]} scale={[3, 0.8]} />
          <Lightformer form="rect" intensity={1.4} color="#4a90e2" position={[10, 4, 1]} scale={[2.5, 6]} />
          <Lightformer form="rect" intensity={1} color="#ffffff" position={[-10, -2, 3]} scale={[2, 4]} />
        </group>
      </Environment>
      <group position={[0, 0.1, 0]}>
        <Phone stats={stats} reduced={reduced} />
      </group>
      <ContactShadows position={[0, -2.55, 0]} opacity={0.62} scale={9} blur={2.6} far={4} color="#000000" />
    </Canvas>
  );
}
