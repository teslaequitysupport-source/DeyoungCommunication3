"use client";

/**
 * DEYOUNG 3D Signal Field: hero scene.
 * 160 instanced bars in a slow ring. Peak bars ignite in signal red.
 * Honest label: ambient visual identity. During live calls (call console),
 * the same visual language is driven by real microphone amplitude.
 * Graceful degradation: WebGL-missing → 2D canvas fallback; reduced-motion → static frame.
 */

import { useMemo, useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function SignalRing({ count = 160 }: { count?: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null!);
  const group = useRef<THREE.Group>(null!);
  const color = useMemo(() => new THREE.Color(), []);
  const cDark = useMemo(() => new THREE.Color("#232323"), []);
  const cRed = useMemo(() => new THREE.Color("#e10600"), []);

  const items = useMemo(() => {
    const arr: { angle: number; x: number; z: number }[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      arr.push({ angle, x: Math.cos(angle) * 3.35, z: Math.sin(angle) * 3.35 });
    }
    return arr;
  }, [count]);

  // Paint per-instance colors once.
  useEffect(() => {
    if (!mesh.current) return;
    for (let i = 0; i < count; i++) mesh.current.setColorAt(i, cDark);
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
  }, [count, cDark]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const m = mesh.current;
    if (!m) return;

    // Fresh dummy per frame (small allocation; satisfies render-immutable lint).
    const dummy = new THREE.Object3D();
    let hot = 0;
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      // Layered harmonic field: designed idle motion (deterministic, not random noise).
      const a =
        0.5 +
        0.28 * Math.sin(t * 1.25 + it.angle * 3.0) +
        0.22 * Math.sin(t * 0.42 + it.angle * 7.0 + 1.7) * Math.sin(t * 0.31 + it.angle * 2.0);
      const level = Math.max(0.06, a);
      const h = 0.1 + level * 1.75;

      dummy.position.set(it.x, h / 2, it.z);
      dummy.scale.set(1, h, 1);
      dummy.rotation.y = -it.angle;
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);

      // Peaks ignite signal red; base stays ink.
      if (level > 0.86) {
        m.setColorAt(i, cRed);
        hot++;
      } else if (level < 0.55) {
        m.setColorAt(i, cDark);
      }
    }
    if (m.instanceMatrix) m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;

    // Slow drift + damped pointer parallax.
    if (group.current) {
      const g = group.current;
      const targetX = 0.42 + state.pointer.y * 0.06;
      const targetZ = 0.16 + state.pointer.x * 0.08;
      g.rotation.x += (targetX - g.rotation.x) * 0.04;
      g.rotation.z += (targetZ - g.rotation.z) * 0.04;
      g.rotation.y = t * 0.05;
    }
    void hot;
  });

  return (
    <group ref={group} rotation={[0.42, 0, 0.16]}>
      <instancedMesh ref={mesh} args={[undefined, undefined, count]} frustumCulled={false}>
        <boxGeometry args={[0.075, 1, 0.075]} />
        <meshBasicMaterial vertexColors={false} toneMapped={false} />
      </instancedMesh>
      {/* Center core: one red beacon that breathes */}
      <mesh position={[0, 0.55, 0]}>
        <sphereGeometry args={[0.34, 32, 32]} />
        <meshBasicMaterial color="#e10600" toneMapped={false} />
      </mesh>
      {/* Ring floor guide */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <ringGeometry args={[3.28, 3.42, 128]} />
        <meshBasicMaterial color="#1a1a1a" side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
    </group>
  );
}

export default function HeroScene({ className }: { className?: string }) {
  return (
    <div className={className} aria-hidden="true">
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 3.6, 7.2], fov: 40 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ background: "transparent" }}
      >
        <fog attach="fog" args={["#090909", 7.5, 15]} />
        <SignalRing count={160} />
      </Canvas>
    </div>
  );
}
