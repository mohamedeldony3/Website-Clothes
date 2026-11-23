import React, { useMemo, useEffect, useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { getProceduralFabricTexture } from './FabricTexture';

/**
 * Intelligent PBR Garment Color Calibration
 * Guarantees that dark fabric dyes (Chocolate Brown, Acid Moss Olive, Oxblood Burgundy, Midnight Navy, Onyx Black)
 * retain their vibrant real-world garment hue under Three.js PBR lighting without crushing to pure black or shifting hue.
 */
export const getCalibratedGarmentColor = (colorHex: string): THREE.Color => {
  if (!colorHex) return new THREE.Color('#f0f0ee');
  const clean = colorHex.toLowerCase().trim();

  // Known atelier swatch calibrations: authentic physical textile dye values for PBR
  const swatchMap: Record<string, string> = {
    // Acid Moss Olive / Forest
    '#373a32': '#627845',
    '#4a5636': '#667c48',
    '#56643f': '#6a824c',
    // Chocolate Brown / Mocha
    '#3d261c': '#6b422c',
    '#4a2f22': '#724730',
    '#5e4230': '#7d5940',
    '#6e4e39': '#855f46',
    // Oxblood / Rich Wine / Burgundy
    '#521422': '#7d1e34',
    '#631829': '#88223a',
    '#5c1728': '#7d1e34',
    '#6e1b30': '#8b253f',
    // Forest Pine / Emerald
    '#1d4a38': '#2d7359',
    '#235d46': '#348567',
    // Midnight Navy
    '#162438': '#2b446a',
    '#1b2c46': '#32507d',
    // Onyx Black (True deep luxury obsidian cotton with visible geometry & fold highlights)
    '#111111': '#242424',
    '#0f0f0f': '#242424',
    '#0c0c0c': '#242424',
    '#141414': '#242424',
    // Chalk White / Raw Bone
    '#f7f7f7': '#f0eeea',
    '#ebe9e2': '#eae7e0',
    '#dcd7cd': '#dad4c8',
    '#d3ccc0': '#d5cec2',
    // Washed Charcoal
    '#2c2c2c': '#3c3c3c',
    '#303030': '#404040',
  };

  if (swatchMap[clean]) {
    return new THREE.Color(swatchMap[clean]);
  }

  // Dynamic algorithmic calibration for custom hex colors added via Admin
  const c = new THREE.Color(colorHex);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);

  if (hsl.s > 0.08 && hsl.l < 0.28) {
    // Saturated dark shade (e.g. custom dark green/brown/burgundy): lift lightness to prevent PBR black crush
    c.setHSL(hsl.h, Math.min(1, hsl.s * 1.15), Math.max(0.25, hsl.l * 1.6));
  } else if (hsl.l < 0.06) {
    // Pure black: maintain deep obsidian cotton
    c.setHSL(0, 0, 0.08);
  }

  return c;
};

interface RealHoodieModelProps {
  color?: string;
  wireframe?: boolean;
  interactive?: boolean;
  graphicUrl?: string;
  frontGraphicUrl?: string;
  backGraphicUrl?: string;
  isBackView?: boolean;
  leftArmAngle?: number;
  rightArmAngle?: number;
  leftForearmAngle?: number;
  rightForearmAngle?: number;
  isLeftHandInPouch?: boolean;
  isRightHandInPouch?: boolean;
}

export const RealHoodieModel: React.FC<RealHoodieModelProps> = ({
  color = '#f0f0ee',
  wireframe = false,
  interactive = true,
  graphicUrl,
  frontGraphicUrl,
  backGraphicUrl,
  isBackView = false,
  leftArmAngle = 0,
  rightArmAngle = 0,
  leftForearmAngle = 0,
  rightForearmAngle = 0,
  isLeftHandInPouch = false,
  isRightHandInPouch = false,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const activeBackGraphicUrl = backGraphicUrl || graphicUrl;

  // Real-time GPU Sleeve Dual-Joint Rigging, Kangaroo Pocket Tucking & 520 GSM Fabric Physics Uniforms
  const armUniforms = useRef({
    uLeftArmAngle: { value: 0 },
    uRightArmAngle: { value: 0 },
    uLeftForearmAngle: { value: 0 },
    uRightForearmAngle: { value: 0 },
    uClothSway: { value: new THREE.Vector2(0, 0) },
    uLeftHandInPouch: { value: 0.0 },
    uRightHandInPouch: { value: 0.0 },
  });

  // Inertia damping spring-mass state for dense 520 GSM Egyptian cotton
  const clothPhysics = useRef({
    dispX: 0,
    dispY: 0,
    velX: 0,
    velY: 0,
    prevX: 0,
    prevY: 0,
    hasInitialized: false,
  });

  // Load the authentic, seamless pullover hoodie model (with MeshoptDecoder)
  const { scene } = useGLTF('/models/pullover_hoodie.glb', undefined, undefined, (loader) => {
    loader.setMeshoptDecoder(MeshoptDecoder);
  });

  // Center and normalize bounding box via wrapper group so node scale is preserved
  const wrapper = useMemo(() => {
    const cloned = scene.clone(true);

    // Deep clone materials across all meshes to ensure each RealHoodieModel instance has completely independent material state
    cloned.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material = mesh.material.map((m) => m.clone());
          } else {
            mesh.material = (mesh.material as THREE.Material).clone();
          }
        }
      }
    });

    const box = new THREE.Box3().setFromObject(cloned);
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    box.getCenter(center);
    box.getSize(size);

    // Center geometry to origin
    cloned.position.set(-center.x, -center.y, -center.z);

    // Scale to standard height ~2.45 units for perfect viewport framing
    const maxDim = Math.max(size.x, size.y, size.z);
    const targetScale = 2.45 / maxDim;

    const wrap = new THREE.Group();
    wrap.scale.setScalar(targetScale);
    wrap.add(cloned);

    return wrap;
  }, [scene]);

  const [backTexture, setBackTexture] = useState<THREE.Texture | null>(null);
  const [backAspect, setBackAspect] = useState<number>(1.0);

  const [frontTexture, setFrontTexture] = useState<THREE.Texture | null>(null);
  const [frontAspect, setFrontAspect] = useState<number>(1.0);

  // Load back graphic decal texture
  useEffect(() => {
    if (!activeBackGraphicUrl) {
      setBackTexture(null);
      return;
    }

    let isMounted = true;
    const loader = new THREE.TextureLoader();
    loader.load(
      activeBackGraphicUrl,
      (tex) => {
        if (!isMounted) return;
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.generateMipmaps = true;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.needsUpdate = true;
        if (tex.image && tex.image.width && tex.image.height) {
          setBackAspect(tex.image.width / tex.image.height);
        }
        setBackTexture(tex);
      },
      undefined,
      (err) => console.warn('Back graphic texture load error:', err)
    );

    return () => {
      isMounted = false;
    };
  }, [activeBackGraphicUrl]);

  // Load front graphic decal texture
  useEffect(() => {
    if (!frontGraphicUrl) {
      setFrontTexture(null);
      return;
    }

    let isMounted = true;
    const loader = new THREE.TextureLoader();
    loader.load(
      frontGraphicUrl,
      (tex) => {
        if (!isMounted) return;
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.generateMipmaps = true;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.needsUpdate = true;
        if (tex.image && tex.image.width && tex.image.height) {
          setFrontAspect(tex.image.width / tex.image.height);
        }
        setFrontTexture(tex);
      },
      undefined,
      (err) => console.warn('Front graphic texture load error:', err)
    );

    return () => {
      isMounted = false;
    };
  }, [frontGraphicUrl]);

  const bumpMap = useMemo(() => getProceduralFabricTexture(), []);

  // Update materials reactively: 100% solid, fully opaque cotton with double-sided rendering
  useEffect(() => {
    if (!wrapper) return;

    const activeHex = color || '#f0f0ee';
    const baseColor = getCalibratedGarmentColor(activeHex);

    const attachSleeveRigging = (mat: THREE.MeshStandardMaterial) => {
      mat.onBeforeCompile = (shader) => {
        shader.uniforms.uLeftArmAngle = armUniforms.current.uLeftArmAngle;
        shader.uniforms.uRightArmAngle = armUniforms.current.uRightArmAngle;
        shader.uniforms.uLeftForearmAngle = armUniforms.current.uLeftForearmAngle;
        shader.uniforms.uRightForearmAngle = armUniforms.current.uRightForearmAngle;
        shader.uniforms.uClothSway = armUniforms.current.uClothSway;
        shader.uniforms.uLeftHandInPouch = armUniforms.current.uLeftHandInPouch;
        shader.uniforms.uRightHandInPouch = armUniforms.current.uRightHandInPouch;

        shader.vertexShader = `
          uniform float uLeftArmAngle;
          uniform float uRightArmAngle;
          uniform float uLeftForearmAngle;
          uniform float uRightForearmAngle;
          uniform vec2 uClothSway;
          uniform float uLeftHandInPouch;
          uniform float uRightHandInPouch;
        ` + shader.vertexShader;

        shader.vertexShader = shader.vertexShader.replace(
          '#include <begin_vertex>',
          `
          #include <begin_vertex>

          // 1. Heavyweight 520 GSM Fabric Inertia Damping: Hem sway
          if (transformed.y < -0.15) {
            float hemWeight = smoothstep(-0.15, -0.85, transformed.y);
            transformed.x += uClothSway.x * hemWeight;
            transformed.z += uClothSway.y * hemWeight * 0.6;
          }

          // 2. Dual-Joint Sleeve Kinematics (Shoulder + Independent Forearm / Elbow Rigging)
          if (transformed.x > 0.36) {
            // Upper Arm Rotation around Shoulder Pivot
            float armWeight = smoothstep(0.36, 0.68, transformed.x);
            vec3 shoulderPivot = vec3(0.42, 0.30, 0.0);
            vec3 p = transformed - shoulderPivot;
            float angle = uLeftArmAngle * armWeight;
            float c = cos(angle);
            float s = sin(angle);
            mat2 rot = mat2(c, -s, s, c);
            p.xy = rot * p.xy;
            transformed = p + shoulderPivot;

            // Independent Forearm Splitting around Elbow Pivot
            if (transformed.x > 0.62) {
              float elbowWeight = smoothstep(0.62, 0.78, transformed.x);
              vec3 elbowPivot = vec3(0.65, 0.02, 0.0);
              vec3 pe = transformed - elbowPivot;
              float ebAngle = uLeftForearmAngle * elbowWeight;
              float ce = cos(ebAngle);
              float se = sin(ebAngle);
              mat2 rotElbow = mat2(ce, -se, se, ce);
              pe.xy = rotElbow * pe.xy;
              pe.z += se * 0.16 * elbowWeight;
              transformed = pe + elbowPivot;
            }

            // Kangaroo Pouch Left Hand Tucking
            if (uLeftHandInPouch > 0.01 && transformed.x > 0.45 && transformed.y < 0.0) {
              float tuckWeight = smoothstep(0.45, 0.88, transformed.x) * uLeftHandInPouch;
              vec3 pocketTarget = vec3(0.16, -0.38, 0.36);
              transformed = mix(transformed, pocketTarget, tuckWeight * 0.72);
            }

            // Cuff Inertia Lag
            float cuffWeight = smoothstep(0.74, 0.96, transformed.x);
            transformed.x += uClothSway.x * cuffWeight * 0.45;
          } else if (transformed.x < -0.36) {
            // Upper Arm Rotation around Right Shoulder Pivot
            float armWeight = smoothstep(0.36, 0.68, -transformed.x);
            vec3 shoulderPivot = vec3(-0.42, 0.30, 0.0);
            vec3 p = transformed - shoulderPivot;
            float angle = -uRightArmAngle * armWeight;
            float c = cos(angle);
            float s = sin(angle);
            mat2 rot = mat2(c, -s, s, c);
            p.xy = rot * p.xy;
            transformed = p + shoulderPivot;

            // Independent Forearm Splitting around Right Elbow Pivot
            if (transformed.x < -0.62) {
              float elbowWeight = smoothstep(0.62, 0.78, -transformed.x);
              vec3 elbowPivot = vec3(-0.65, 0.02, 0.0);
              vec3 pe = transformed - elbowPivot;
              float ebAngle = -uRightForearmAngle * elbowWeight;
              float ce = cos(ebAngle);
              float se = sin(ebAngle);
              mat2 rotElbow = mat2(ce, -se, se, ce);
              pe.xy = rotElbow * pe.xy;
              pe.z += abs(se) * 0.16 * elbowWeight;
              transformed = pe + elbowPivot;
            }

            // Kangaroo Pouch Right Hand Tucking
            if (uRightHandInPouch > 0.01 && transformed.x < -0.45 && transformed.y < 0.0) {
              float tuckWeight = smoothstep(0.45, 0.88, -transformed.x) * uRightHandInPouch;
              vec3 pocketTarget = vec3(-0.16, -0.38, 0.36);
              transformed = mix(transformed, pocketTarget, tuckWeight * 0.72);
            }

            // Cuff Inertia Lag
            float cuffWeight = smoothstep(0.74, 0.96, -transformed.x);
            transformed.x += uClothSway.x * cuffWeight * 0.45;
          }

          // 3. Subtle Kangaroo Pouch Fabric Expansion when hand rests inside
          if ((uLeftHandInPouch > 0.01 || uRightHandInPouch > 0.01) &&
              abs(transformed.x) < 0.28 && transformed.y > -0.55 && transformed.y < -0.22 && transformed.z > 0.32) {
            float pouchBulge = max(uLeftHandInPouch, uRightHandInPouch) * 0.024;
            transformed.z += pouchBulge;
          }

          // 4. Facial & Chin Depth Collision Buffer (Prevents sleeve clipping through user face)
          vec3 headCenter = vec3(0.0, 0.44, 0.08);
          float headRadius = 0.28;
          vec3 toHead = transformed - headCenter;
          float dHead = length(toHead);
          if (dHead < headRadius && dHead > 0.001) {
            transformed += (toHead / dHead) * (headRadius - dHead);
          }
          `
        );
      };
    };

    wrapper.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        if (mesh.material && (mesh.material as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
          const mat = mesh.material as THREE.MeshStandardMaterial;
          mat.color.copy(baseColor);
          mat.roughness = 0.82;
          mat.metalness = 0.0;
          mat.wireframe = wireframe;
          mat.bumpMap = bumpMap;
          mat.bumpScale = 0.008;
          attachSleeveRigging(mat);
          mat.needsUpdate = true;
        } else {
          const newMat = new THREE.MeshStandardMaterial({
            color: baseColor.clone(),
            roughness: 0.82,
            metalness: 0.0,
            side: THREE.DoubleSide,
            transparent: false,
            opacity: 1.0,
            depthWrite: true,
            depthTest: true,
            wireframe: wireframe,
            bumpMap: bumpMap,
            bumpScale: 0.008,
          });
          attachSleeveRigging(newMat);
          mesh.material = newMat;
        }
      }
    });
  }, [wrapper, color, wireframe, bumpMap]);

  // Back Graphic Decal Material
  const backDecalMaterial = useMemo(() => {
    if (!backTexture) return null;
    return new THREE.MeshStandardMaterial({
      map: backTexture,
      transparent: true,
      alphaTest: 0.01,
      roughness: 0.45,
      metalness: 0.08,
      side: THREE.FrontSide,
      depthWrite: false,
      depthTest: true,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
    });
  }, [backTexture]);

  // Front Graphic Decal Material
  const frontDecalMaterial = useMemo(() => {
    if (!frontTexture) return null;
    return new THREE.MeshStandardMaterial({
      map: frontTexture,
      transparent: true,
      alphaTest: 0.01,
      roughness: 0.45,
      metalness: 0.08,
      side: THREE.FrontSide,
      depthWrite: false,
      depthTest: true,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
    });
  }, [frontTexture]);

  const targetRotationY = isBackView ? Math.PI : 0;

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    // Gentle natural breathing float elevation animation
    groupRef.current.position.y = Math.sin(t * 1.5) * 0.025;

    // Smooth luxury turntable spin transition between Front (0) and Back (180°)
    groupRef.current.rotation.y = THREE.MathUtils.damp(
      groupRef.current.rotation.y,
      targetRotationY,
      7.0,
      delta
    );

    // Smooth GPU sleeve arm elevation damping
    armUniforms.current.uLeftArmAngle.value = THREE.MathUtils.damp(
      armUniforms.current.uLeftArmAngle.value,
      leftArmAngle || 0,
      12.0,
      delta
    );
    armUniforms.current.uRightArmAngle.value = THREE.MathUtils.damp(
      armUniforms.current.uRightArmAngle.value,
      rightArmAngle || 0,
      12.0,
      delta
    );

    // Smooth GPU independent forearm flexion / elbow bend damping
    armUniforms.current.uLeftForearmAngle.value = THREE.MathUtils.damp(
      armUniforms.current.uLeftForearmAngle.value,
      leftForearmAngle || 0,
      14.0,
      delta
    );
    armUniforms.current.uRightForearmAngle.value = THREE.MathUtils.damp(
      armUniforms.current.uRightForearmAngle.value,
      rightForearmAngle || 0,
      14.0,
      delta
    );

    // Smooth GPU kangaroo pocket hand engagement damping
    armUniforms.current.uLeftHandInPouch.value = THREE.MathUtils.damp(
      armUniforms.current.uLeftHandInPouch.value,
      isLeftHandInPouch ? 1.0 : 0.0,
      12.0,
      delta
    );
    armUniforms.current.uRightHandInPouch.value = THREE.MathUtils.damp(
      armUniforms.current.uRightHandInPouch.value,
      isRightHandInPouch ? 1.0 : 0.0,
      12.0,
      delta
    );

    // 520 GSM Heavyweight Loopback Cotton Inertia Damping Simulation
    // Tracks body translation velocity to calculate natural physical hem & cuff sway
    const currentWorldPos = new THREE.Vector3();
    groupRef.current.getWorldPosition(currentWorldPos);

    if (!clothPhysics.current.hasInitialized) {
      clothPhysics.current.prevX = currentWorldPos.x;
      clothPhysics.current.prevY = currentWorldPos.y;
      clothPhysics.current.hasInitialized = true;
    } else {
      const dt = Math.max(0.001, Math.min(0.1, delta));
      const vx = (currentWorldPos.x - clothPhysics.current.prevX) / dt;
      const vy = (currentWorldPos.y - clothPhysics.current.prevY) / dt;
      clothPhysics.current.prevX = currentWorldPos.x;
      clothPhysics.current.prevY = currentWorldPos.y;

      // Heavy fabric spring constant k=35, damping c=8.2, inertial mass=1.0
      const springK = 35.0;
      const dampingC = 8.2;
      const forceX = -vx * 0.08 - springK * clothPhysics.current.dispX - dampingC * clothPhysics.current.velX;
      const forceY = -vy * 0.06 - springK * clothPhysics.current.dispY - dampingC * clothPhysics.current.velY;

      clothPhysics.current.velX += forceX * dt;
      clothPhysics.current.velY += forceY * dt;
      clothPhysics.current.dispX += clothPhysics.current.velX * dt;
      clothPhysics.current.dispY += clothPhysics.current.velY * dt;

      // Realistic physical limits for dense cotton draping
      clothPhysics.current.dispX = THREE.MathUtils.clamp(clothPhysics.current.dispX, -0.08, 0.08);
      clothPhysics.current.dispY = THREE.MathUtils.clamp(clothPhysics.current.dispY, -0.06, 0.06);

      armUniforms.current.uClothSway.value.set(clothPhysics.current.dispX, clothPhysics.current.dispY);
    }
  });

  return (
    <group ref={groupRef}>
      {/* 100% Solid Seamless Authentic Pullover Hoodie */}
      <primitive object={wrapper} />

      {/* Front Chest Graphic Decal placed flush against outer chest fabric at z=0.430 */}
      {frontDecalMaterial && (
        <group position={[0, 0.12, 0.430]} rotation={[0, 0, 0]}>
          <mesh material={frontDecalMaterial}>
            <planeGeometry args={[0.54 * frontAspect, 0.54]} />
          </mesh>
        </group>
      )}

      {/* Back Graphic Decal placed flush against outer back fabric at z=-0.372 */}
      {backDecalMaterial && (
        <group position={[0, 0.08, -0.372]} rotation={[0, Math.PI, 0]}>
          <mesh material={backDecalMaterial}>
            <planeGeometry args={[0.82 * backAspect, 0.82]} />
          </mesh>
        </group>
      )}
    </group>
  );
};

useGLTF.preload('/models/pullover_hoodie.glb', undefined, undefined, (loader) => {
  loader.setMeshoptDecoder(MeshoptDecoder);
});
