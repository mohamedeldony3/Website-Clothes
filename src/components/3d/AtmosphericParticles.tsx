import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const AtmosphericParticles: React.FC<{ count?: number }> = ({ count = 100 }) => {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions, scales] = useMemo(() => {
    const safeCount = Math.min(count, 120);
    const pos = new Float32Array(safeCount * 3);
    const sca = new Float32Array(safeCount);

    for (let i = 0; i < safeCount; i++) {
      // Spread in a cylindrical studio volume around the hoodie
      const radius = 2.0 + Math.random() * 4.5;
      const angle = Math.random() * Math.PI * 2;
      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 6.0;
      pos[i * 3 + 2] = Math.sin(angle) * radius;

      sca[i] = Math.random() * 0.03 + 0.01;
    }
    return [pos, sca];
  }, [count]);

  // High performance GPU-friendly transform: no CPU buffer reallocation/transfer per frame
  useFrame((state) => {
    if (!pointsRef.current) return;
    const t = state.clock.getElapsedTime();
    pointsRef.current.rotation.y = t * 0.035;
    pointsRef.current.position.y = Math.sin(t * 0.4) * 0.08;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-scale"
          count={scales.length}
          array={scales}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.045}
        color="#CEFF00"
        transparent
        opacity={0.35}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
};
