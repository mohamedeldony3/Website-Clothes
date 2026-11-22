import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getProceduralFabricTexture } from './FabricTexture';
import { getProductGraphicTexture } from './GraphicTextureProcessor';

export type HoodieFit = 'boxy' | 'cocoon' | 'cropped';
export type HoodieFinish = 'cotton' | 'nylon' | 'washed';

interface HoodieSculptProps {
  color?: string;
  wireframe?: boolean;
  interactive?: boolean;
  fit?: HoodieFit;
  finish?: HoodieFinish;
  graphicUrl?: string;
}

export const HoodieSculpt: React.FC<HoodieSculptProps> = ({
  color = '#141414',
  wireframe = false,
  interactive = true,
  fit = 'boxy',
  finish = 'cotton',
  graphicUrl,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const leftAgletRef = useRef<THREE.Group>(null);
  const rightAgletRef = useRef<THREE.Group>(null);

  const [graphicTexture, setGraphicTexture] = useState<THREE.Texture | null>(null);
  const [aspect, setAspect] = useState<number>(0.85);

  // Load graphic texture cleanly
  useEffect(() => {
    if (!graphicUrl) {
      setGraphicTexture(null);
      return;
    }

    let isMounted = true;
    const loader = new THREE.TextureLoader();
    loader.load(
      graphicUrl,
      (loaded) => {
        if (!isMounted) return;
        loaded.generateMipmaps = true;
        loaded.minFilter = THREE.LinearMipmapLinearFilter;
        if (loaded.image && loaded.image.width && loaded.image.height) {
          setAspect(loaded.image.width / loaded.image.height);
        }
        setGraphicTexture(loaded);
      },
      undefined,
      (err) => console.warn('Texture load warning:', err)
    );

    return () => {
      isMounted = false;
    };
  }, [graphicUrl]);

  const bumpMap = useMemo(() => getProceduralFabricTexture(), []);

  // Compute dynamic scale and geometry proportions according to fit
  const fitScale = useMemo<[number, number, number]>(() => {
    switch (fit) {
      case 'cocoon':
        return [1.14, 1.08, 1.18];
      case 'cropped':
        return [1.16, 0.9, 1.08];
      case 'boxy':
      default:
        return [1.1, 1.05, 1.08];
    }
  }, [fit]);

  // High-End PBR Fabric Material: Ensures dark colors never become pitch-black silhouettes
  const fabricMaterial = useMemo(() => {
    const baseColor = new THREE.Color(color);

    // If color is near black, subtly lift to deep charcoal (#181818) so surface curvature and lights are visible!
    const luminance = baseColor.r * 0.299 + baseColor.g * 0.587 + baseColor.b * 0.114;
    if (luminance < 0.08) {
      baseColor.setRGB(0.1, 0.1, 0.1);
    }

    let roughness = 0.78;
    let metalness = 0.08;
    let bumpScale = 0.02;

    if (finish === 'nylon') {
      roughness = 0.35;
      metalness = 0.35;
      bumpScale = 0.01;
    } else if (finish === 'washed') {
      roughness = 0.92;
      metalness = 0.05;
      bumpScale = 0.035;
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
    const col = new THREE.Color(color);
    const lum = col.r * 0.299 + col.g * 0.587 + col.b * 0.114;
    if (lum < 0.08) {
      col.setRGB(0.08, 0.08, 0.08);
    } else {
      col.multiplyScalar(0.85);
    }

    return new THREE.MeshStandardMaterial({
      color: col,
      roughness: 0.92,
      metalness: 0.04,
      bumpMap: bumpMap,
      bumpScale: 0.04,
      wireframe: wireframe,
    });
  }, [color, wireframe, bumpMap]);

  // Hardware material
  const gunmetalMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#555555',
      roughness: 0.2,
      metalness: 0.92,
    });
  }, []);

  // Back Graphic Material (clearly visible, crisp, with dedicated emissive boost)
  const graphicMaterial = useMemo(() => {
    if (!graphicTexture) return null;
    return new THREE.MeshStandardMaterial({
      map: graphicTexture,
      transparent: true,
      alphaTest: 0.05,
      roughness: 0.55,
      metalness: 0.1,
      side: THREE.DoubleSide,
      depthWrite: true,
      polygonOffset: true,
      polygonOffsetFactor: -3,
      polygonOffsetUnits: -3,
    });
  }, [graphicTexture]);

  // Smooth Organic Sleeve Curves (No blocky disconnected cylinders!)
  const { leftSleeveGeo, rightSleeveGeo } = useMemo(() => {
    // Left sleeve path from shoulder to wrist with organic curve
    const leftCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.95, 0.62, 0.0),
      new THREE.Vector3(-1.38, 0.32, 0.04),
      new THREE.Vector3(-1.48, -0.15, 0.1),
      new THREE.Vector3(-1.32, -0.68, 0.18),
    ]);
    const leftGeo = new THREE.TubeGeometry(leftCurve, 32, 0.32, 20, false);

    // Right sleeve path from shoulder to wrist with organic curve
    const rightCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.95, 0.62, 0.0),
      new THREE.Vector3(1.38, 0.32, 0.04),
      new THREE.Vector3(1.48, -0.15, 0.1),
      new THREE.Vector3(1.32, -0.68, 0.18),
    ]);
    const rightGeo = new THREE.TubeGeometry(rightCurve, 32, 0.32, 20, false);

    return { leftSleeveGeo: leftGeo, rightSleeveGeo: rightGeo };
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();

    // Natural breathing float animation
    groupRef.current.position.y = Math.sin(t * 1.5) * 0.06;

    if (interactive) {
      const targetRotY = (state.pointer.x * Math.PI) / 5 + t * 0.18;
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
    }

    if (leftAgletRef.current && rightAgletRef.current) {
      leftAgletRef.current.rotation.z = Math.sin(t * 2.0) * 0.08;
      rightAgletRef.current.rotation.z = -Math.cos(t * 1.8) * 0.08;
    }
  });

  return (
    <group ref={groupRef} scale={fitScale}>
      {/* ================= NATURAL STREETWEAR TORSO ================= */}
      {/* Flattened Torso with human anatomical streetwear silhouette */}
      <group scale={[1.0, 1.0, 0.46]}>
        {/* Upper Torso / Chest with smooth rounded curvature */}
        <mesh position={[0, 0.25, 0]} material={fabricMaterial} castShadow receiveShadow>
          <cylinderGeometry args={[0.98, 1.12, 1.25, 48, 6]} />
        </mesh>

        {/* Shoulder Arch Curve */}
        <mesh position={[0, 0.72, 0]} rotation={[0, 0, Math.PI / 2]} material={fabricMaterial} castShadow>
          <cylinderGeometry args={[0.34, 0.34, 1.88, 32]} />
        </mesh>

        {/* Bottom Ribbed Hem */}
        <mesh position={[0, -0.48, 0]} material={ribMaterial} castShadow>
          <cylinderGeometry args={[1.08, 1.08, 0.22, 48]} />
        </mesh>
      </group>

      {/* ================= SEAMLESS ORGANIC SLEEVES ================= */}
      {/* Left Smooth Curved Sleeve */}
      <mesh geometry={leftSleeveGeo} material={fabricMaterial} castShadow receiveShadow />
      {/* Left Ribbed Wrist Cuff */}
      <mesh position={[-1.32, -0.74, 0.18]} rotation={[0.35, 0, 0.3]} material={ribMaterial} castShadow>
        <cylinderGeometry args={[0.26, 0.26, 0.18, 24]} />
      </mesh>

      {/* Right Smooth Curved Sleeve */}
      <mesh geometry={rightSleeveGeo} material={fabricMaterial} castShadow receiveShadow />
      {/* Right Ribbed Wrist Cuff */}
      <mesh position={[1.32, -0.74, 0.18]} rotation={[0.35, 0, -0.3]} material={ribMaterial} castShadow>
        <cylinderGeometry args={[0.26, 0.26, 0.18, 24]} />
      </mesh>

      {/* ================= KANGAROO FRONT POCKET ================= */}
      <group position={[0, -0.16, 0.26]}>
        <mesh material={fabricMaterial} castShadow>
          <boxGeometry args={[1.18, 0.54, 0.12]} />
        </mesh>
        {/* Slanted side openings with bar-tack rivets */}
        <mesh position={[-0.58, 0.02, 0.0]} rotation={[0, -0.3, 0.2]} material={fabricMaterial}>
          <boxGeometry args={[0.08, 0.46, 0.12]} />
        </mesh>
        <mesh position={[0.58, 0.02, 0.0]} rotation={[0, 0.3, -0.2]} material={fabricMaterial}>
          <boxGeometry args={[0.08, 0.46, 0.12]} />
        </mesh>
        {/* Top stitch border */}
        <mesh position={[0, 0.27, 0.06]} material={ribMaterial}>
          <boxGeometry args={[1.18, 0.025, 0.02]} />
        </mesh>
        {/* Rivets */}
        <mesh position={[-0.52, 0.24, 0.07]} material={gunmetalMaterial}>
          <sphereGeometry args={[0.02, 12, 12]} />
        </mesh>
        <mesh position={[0.52, 0.24, 0.07]} material={gunmetalMaterial}>
          <sphereGeometry args={[0.02, 12, 12]} />
        </mesh>
      </group>

      {/* ================= BACK GRAPHIC PRINT (PLACED ON EXTERIOR SURFACE!) ================= */}
      {/* Positioned on outer back at z = -0.52 facing 180° (-Z) so it's fully visible at 180°! */}
      {graphicMaterial ? (
        <group position={[0, 0.18, -0.52]} rotation={[0, Math.PI, 0]}>
          <mesh material={graphicMaterial}>
            <planeGeometry args={[1.05 * aspect, 1.05]} />
          </mesh>
        </group>
      ) : (
        /* Default subtle Studio branding on back */
        <group position={[0, 0.25, -0.52]} rotation={[0, Math.PI, 0]}>
          <mesh material={ribMaterial}>
            <boxGeometry args={[0.62, 0.18, 0.02]} />
          </mesh>
        </group>
      )}

      {/* ================= DRAPED HOOD ================= */}
      <group position={[0, 0.88, -0.06]}>
        {/* Hood Main Dome */}
        <mesh position={[0, 0.24, -0.1]} material={fabricMaterial} castShadow>
          <sphereGeometry args={[0.68, 36, 24, 0, Math.PI * 2, 0, Math.PI * 0.75]} />
        </mesh>

        {/* Hood Collar Wrap */}
        <mesh position={[0, -0.14, 0.18]} material={fabricMaterial} castShadow>
          <cylinderGeometry args={[0.52, 0.64, 0.28, 32]} />
        </mesh>

        {/* Hood Face Opening Ring */}
        <mesh position={[0, 0.18, 0.32]} rotation={[0.42, 0, 0]} material={ribMaterial}>
          <torusGeometry args={[0.42, 0.05, 16, 32]} />
        </mesh>

        {/* Metal Aglet Eyelets */}
        <mesh position={[-0.18, -0.05, 0.44]} rotation={[0.4, -0.2, 0]} material={gunmetalMaterial}>
          <torusGeometry args={[0.035, 0.012, 12, 20]} />
        </mesh>
        <mesh position={[0.18, -0.05, 0.44]} rotation={[0.4, 0.2, 0]} material={gunmetalMaterial}>
          <torusGeometry args={[0.035, 0.012, 12, 20]} />
        </mesh>
      </group>

      {/* ================= DRAWSTRINGS & AGLETS ================= */}
      <group position={[-0.18, 0.72, 0.48]} ref={leftAgletRef}>
        <mesh material={fabricMaterial}>
          <cylinderGeometry args={[0.016, 0.016, 0.65, 12]} />
        </mesh>
        <mesh position={[0, -0.36, 0]} material={gunmetalMaterial}>
          <cylinderGeometry args={[0.025, 0.022, 0.12, 16]} />
        </mesh>
      </group>

      <group position={[0.18, 0.72, 0.48]} ref={rightAgletRef}>
        <mesh material={fabricMaterial}>
          <cylinderGeometry args={[0.016, 0.016, 0.65, 12]} />
        </mesh>
        <mesh position={[0, -0.36, 0]} material={gunmetalMaterial}>
          <cylinderGeometry args={[0.025, 0.022, 0.12, 16]} />
        </mesh>
      </group>
    </group>
  );
};
