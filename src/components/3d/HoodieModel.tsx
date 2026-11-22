import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getProceduralFabricTexture } from './FabricTexture';
import { getProductGraphicTexture } from './GraphicTextureProcessor';

export type HoodieFit = 'boxy' | 'cocoon' | 'cropped';
export type HoodieFinish = 'cotton' | 'nylon' | 'washed';

interface HoodieModelProps {
  color?: string;
  wireframe?: boolean;
  interactive?: boolean;
  fit?: HoodieFit;
  finish?: HoodieFinish;
  hasChestGraphic?: boolean;
  graphicUrl?: string;
}

export const HoodieModel: React.FC<HoodieModelProps> = ({
  color = '#141414',
  wireframe = false,
  interactive = true,
  fit = 'boxy',
  finish = 'cotton',
  hasChestGraphic = true,
  graphicUrl,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const leftAgletRef = useRef<THREE.Group>(null);
  const rightAgletRef = useRef<THREE.Group>(null);

  const [backGraphicTexture, setBackGraphicTexture] = useState<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    if (!graphicUrl) {
      setBackGraphicTexture(null);
      return;
    }
    const tex = getProductGraphicTexture(graphicUrl, (loadedTex) => {
      setBackGraphicTexture(loadedTex);
    });
    if (tex) setBackGraphicTexture(tex);
  }, [graphicUrl]);

  const bumpMap = useMemo(() => getProceduralFabricTexture(), []);

  // Proportions according to fit
  const fitScale = useMemo<[number, number, number]>(() => {
    switch (fit) {
      case 'cocoon':
        return [1.18, 1.12, 1.25];
      case 'cropped':
        return [1.2, 0.92, 1.12];
      case 'boxy':
      default:
        return [1.12, 1.08, 1.12];
    }
  }, [fit]);

  // High-End PBR Material configured based on selected Fabric Finish
  const fabricMaterial = useMemo(() => {
    const baseColor = new THREE.Color(color);

    let roughness = 0.88;
    let metalness = 0.08;
    let bumpScale = 0.025;

    if (finish === 'nylon') {
      roughness = 0.32;
      metalness = 0.38;
      bumpScale = 0.012;
    } else if (finish === 'washed') {
      roughness = 0.94;
      metalness = 0.04;
      bumpScale = 0.045;
      baseColor.multiplyScalar(0.9);
    } else {
      roughness = 0.9;
      metalness = 0.06;
      bumpScale = 0.03;
    }

    return new THREE.MeshStandardMaterial({
      color: baseColor,
      roughness: roughness,
      metalness: metalness,
      bumpMap: bumpMap,
      bumpScale: bumpScale,
      wireframe: wireframe,
    });
  }, [color, wireframe, bumpMap, finish]);

  // Ribbed material for cuffs & hem
  const ribMaterial = useMemo(() => {
    const col = new THREE.Color(color).multiplyScalar(finish === 'nylon' ? 0.7 : 0.82);
    return new THREE.MeshStandardMaterial({
      color: col,
      roughness: 0.95,
      metalness: 0.04,
      bumpMap: bumpMap,
      bumpScale: 0.05,
      wireframe: wireframe,
    });
  }, [color, wireframe, bumpMap, finish]);

  // Hardware material
  const gunmetalMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#4a4a4a',
      roughness: 0.22,
      metalness: 0.94,
    });
  }, []);

  // Emblem materials
  const emblemMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#050505',
      roughness: 0.3,
      metalness: 0.2,
    });
  }, []);

  const accentMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#CEFF00',
      roughness: 0.2,
      metalness: 0.8,
      emissive: new THREE.Color('#CEFF00'),
      emissiveIntensity: 0.25,
    });
  }, []);

  // Back graphic decal material
  const graphicMaterial = useMemo(() => {
    if (!backGraphicTexture) return null;
    return new THREE.MeshStandardMaterial({
      map: backGraphicTexture,
      transparent: true,
      roughness: 0.75,
      metalness: 0.08,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      side: THREE.DoubleSide,
    });
  }, [backGraphicTexture]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();

    // Natural breathing float animation
    groupRef.current.position.y = Math.sin(t * 1.5) * 0.08;

    if (interactive) {
      // Mouse responsive parallax tilt with smooth damping
      const targetRotY = (state.pointer.x * Math.PI) / 5 + t * 0.22;
      const targetRotX = (-state.pointer.y * Math.PI) / 14;

      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        targetRotY,
        0.04
      );
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        targetRotX,
        0.05
      );
      groupRef.current.rotation.z = THREE.MathUtils.lerp(
        groupRef.current.rotation.z,
        state.pointer.x * 0.08,
        0.04
      );
    } else {
      groupRef.current.rotation.y += 0.01;
    }

    // Dynamic drawstring sway
    if (leftAgletRef.current && rightAgletRef.current) {
      leftAgletRef.current.rotation.z = Math.sin(t * 2.2) * 0.09;
      rightAgletRef.current.rotation.z = -Math.cos(t * 2.0) * 0.09;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]} scale={fitScale}>
      {/* ================= MAIN TORSO ================= */}
      {/* Upper Torso / Chest Volume */}
      <mesh position={[0, 0.45, 0]} material={fabricMaterial} castShadow receiveShadow>
        <cylinderGeometry args={[1.05, 1.18, 1.0, 32, 4]} />
      </mesh>

      {/* Mid & Lower Torso with subtle boxy streetwear drape */}
      <mesh position={[0, -0.22, 0]} material={fabricMaterial} castShadow receiveShadow>
        <cylinderGeometry args={[1.18, fit === 'cocoon' ? 1.08 : 1.22, 0.8, 32, 4]} />
      </mesh>

      {/* Side Drapes / Thick Cotton Silhouette Depth */}
      <mesh position={[0, 0.12, 0]} material={fabricMaterial} castShadow>
        <boxGeometry args={[2.22, 1.36, 1.16]} />
      </mesh>

      {/* Organic Draping Fold Wrinkles */}
      <group position={[0, 0.1, 0.58]} rotation={[0.08, 0, 0]}>
        <mesh position={[0, 0.22, 0]} material={fabricMaterial} castShadow>
          <torusGeometry args={[0.85, 0.04, 12, 32, Math.PI * 0.65]} />
        </mesh>
        <mesh position={[0, -0.15, 0]} rotation={[0, 0, 0.05]} material={fabricMaterial} castShadow>
          <torusGeometry args={[0.95, 0.045, 12, 32, Math.PI * 0.7]} />
        </mesh>
      </group>

      {/* Bottom Heavy Ribbed Hem Band */}
      <mesh position={[0, -0.72, 0]} material={ribMaterial} castShadow>
        <cylinderGeometry args={[fit === 'cocoon' ? 1.06 : 1.14, fit === 'cocoon' ? 1.06 : 1.14, 0.22, 32]} />
      </mesh>

      {/* ================= KANGAROO POCKET ================= */}
      <group position={[0, -0.26, 0.62]}>
        <mesh material={fabricMaterial} castShadow>
          <boxGeometry args={[1.34, 0.68, 0.14]} />
        </mesh>
        <mesh position={[-0.68, 0.04, -0.02]} rotation={[0, -0.35, 0.2]} material={fabricMaterial}>
          <boxGeometry args={[0.1, 0.58, 0.14]} />
        </mesh>
        <mesh position={[0.68, 0.04, -0.02]} rotation={[0, 0.35, -0.2]} material={fabricMaterial}>
          <boxGeometry args={[0.1, 0.58, 0.14]} />
        </mesh>
        <mesh position={[0, 0.34, 0.06]} material={ribMaterial}>
          <boxGeometry args={[1.32, 0.03, 0.03]} />
        </mesh>
        <mesh position={[-0.62, 0.3, 0.08]} material={gunmetalMaterial}>
          <sphereGeometry args={[0.022, 12, 12]} />
        </mesh>
        <mesh position={[0.62, 0.3, 0.08]} material={gunmetalMaterial}>
          <sphereGeometry args={[0.022, 12, 12]} />
        </mesh>
      </group>

      {/* ================= BACK GRAPHIC DECAL (180° INSPECTION) ================= */}
      {graphicMaterial && (
        <group position={[0, 0.05, -0.62]} rotation={[0, Math.PI, 0]}>
          <mesh material={graphicMaterial}>
            <planeGeometry args={[1.15, 1.25]} />
          </mesh>
        </group>
      )}

      {/* ================= DROPPED SLEEVES ================= */}
      <group position={[-1.4, 0.62, 0]} rotation={[0, 0, -0.32]}>
        <mesh material={fabricMaterial} castShadow>
          <cylinderGeometry args={[0.5, 0.46, 0.95, 24]} />
        </mesh>
        <group position={[0, -0.85, 0.1]} rotation={[0.25, 0, 0.22]}>
          <mesh material={fabricMaterial} castShadow>
            <cylinderGeometry args={[0.46, 0.36, 1.0, 24]} />
          </mesh>
          <mesh position={[0, 0.1, -0.1]} rotation={[0.4, 0, 0]} material={fabricMaterial}>
            <torusGeometry args={[0.4, 0.035, 8, 20, Math.PI * 0.5]} />
          </mesh>
          <mesh position={[0, -0.58, 0]} material={ribMaterial} castShadow>
            <cylinderGeometry args={[0.34, 0.34, 0.22, 24]} />
          </mesh>
        </group>
      </group>

      <group position={[1.4, 0.62, 0]} rotation={[0, 0, 0.32]}>
        <mesh material={fabricMaterial} castShadow>
          <cylinderGeometry args={[0.5, 0.46, 0.95, 24]} />
        </mesh>
        <group position={[0, -0.85, 0.1]} rotation={[0.25, 0, -0.22]}>
          <mesh material={fabricMaterial} castShadow>
            <cylinderGeometry args={[0.46, 0.36, 1.0, 24]} />
          </mesh>
          <mesh position={[0, 0.1, -0.1]} rotation={[0.4, 0, 0]} material={fabricMaterial}>
            <torusGeometry args={[0.4, 0.035, 8, 20, Math.PI * 0.5]} />
          </mesh>
          <mesh position={[0, -0.58, 0]} material={ribMaterial} castShadow>
            <cylinderGeometry args={[0.34, 0.34, 0.22, 24]} />
          </mesh>
        </group>
      </group>

      {/* ================= ARCHITECTURAL HOOD ================= */}
      <group position={[0, 1.15, -0.1]}>
        <mesh position={[0, 0.3, -0.05]} material={fabricMaterial} castShadow>
          <sphereGeometry args={[0.8, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.72]} />
        </mesh>
        <mesh position={[0, -0.15, 0.22]} material={fabricMaterial} castShadow>
          <cylinderGeometry args={[0.62, 0.72, 0.35, 24]} />
        </mesh>
        <mesh position={[0, 0.25, 0.42]} rotation={[0.35, 0, 0]} material={ribMaterial}>
          <torusGeometry args={[0.48, 0.06, 16, 32]} />
        </mesh>
        <mesh position={[-0.22, -0.05, 0.55]} rotation={[0.35, -0.3, 0]} material={gunmetalMaterial}>
          <torusGeometry args={[0.045, 0.015, 12, 24]} />
        </mesh>
        <mesh position={[0.22, -0.05, 0.55]} rotation={[0.35, 0.3, 0]} material={gunmetalMaterial}>
          <torusGeometry args={[0.045, 0.015, 12, 24]} />
        </mesh>
      </group>

      {/* ================= DRAWSTRINGS & AGLETS ================= */}
      <group position={[-0.24, 0.85, 0.62]} ref={leftAgletRef}>
        <mesh material={fabricMaterial}>
          <cylinderGeometry args={[0.02, 0.02, 0.75, 12]} />
        </mesh>
        <mesh position={[0, -0.42, 0]} material={gunmetalMaterial}>
          <cylinderGeometry args={[0.03, 0.026, 0.14, 16]} />
        </mesh>
      </group>

      <group position={[0.24, 0.85, 0.62]} ref={rightAgletRef}>
        <mesh material={fabricMaterial}>
          <cylinderGeometry args={[0.02, 0.02, 0.75, 12]} />
        </mesh>
        <mesh position={[0, -0.42, 0]} material={gunmetalMaterial}>
          <cylinderGeometry args={[0.03, 0.026, 0.14, 16]} />
        </mesh>
      </group>

      {/* ================= EMBOSSED CHEST EMBLEM ================= */}
      {hasChestGraphic && !backGraphicTexture && (
        <group position={[0, 0.5, 0.64]}>
          <mesh material={emblemMaterial} castShadow>
            <boxGeometry args={[0.56, 0.18, 0.025]} />
          </mesh>
          <mesh position={[0, -0.06, 0.016]} material={accentMaterial}>
            <boxGeometry args={[0.42, 0.018, 0.01]} />
          </mesh>
        </group>
      )}
    </group>
  );
};
