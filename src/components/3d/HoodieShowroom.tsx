import React, { Suspense, useState, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Float } from '@react-three/drei';
import * as THREE from 'three';
import { HoodieSculpt, HoodieFit, HoodieFinish } from './HoodieSculpt';
import { RealHoodieModel } from './RealHoodieModel';
import { AtmosphericParticles } from './AtmosphericParticles';
import { getOptimizedDpr } from '../../utils/performance';

export type LightingMood = 'cairo' | 'studio' | 'cyber';

// Dynamic Responsive Camera: guarantees perfect hoodie framing on any screen aspect ratio (especially narrow mobile portrait)
const ResponsiveCamera: React.FC = () => {
  const { camera, size } = useThree();

  useEffect(() => {
    const aspect = size.width / Math.max(1, size.height);
    const isMobile = size.width < 768 || aspect < 0.75;
    const persp = camera as THREE.PerspectiveCamera;

    if (isMobile) {
      // Precise mobile viewport framing:
      // Phone portrait displays have narrow width (aspect ~ 0.45 - 0.55).
      // At distance 6.6 and FOV 36°, the ~2.1-unit hoodie fits with ~18% side margins
      // and comfortable top/bottom vertical clearance from title & cart pill.
      persp.fov = 36;
      persp.position.set(0, -0.06, 6.6);
    } else {
      // Desktop editorial framing: leaves generous center stage breathing room so 3D model never collides with side typography
      persp.fov = 39;
      persp.position.set(0, 0.1, 4.85);
    }
    persp.updateProjectionMatrix();
  }, [camera, size.width, size.height]);

  return null;
};

// Lightweight, GPU-accelerated Turntable: runs auto-rotation without capturing any pointer/touch events
const TurntableGroup: React.FC<{ children: React.ReactNode; speed?: number; autoRotate?: boolean }> = ({
  children,
  speed = 0.45,
  autoRotate = true,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    if (autoRotate) {
      groupRef.current.rotation.y += delta * speed;
    } else {
      // Smoothly return turntable base to 0 so Front and Back alignments stay square to camera
      groupRef.current.rotation.y = THREE.MathUtils.damp(
        groupRef.current.rotation.y,
        0,
        5.0,
        delta
      );
    }
  });
  return <group ref={groupRef}>{children}</group>;
};

interface HoodieShowroomProps {
  currentColor: string;
  isWireframe?: boolean;
  lightingMood?: LightingMood;
  fit?: HoodieFit;
  finish?: HoodieFinish;
  graphicUrl?: string;
  frontGraphicUrl?: string;
  backGraphicUrl?: string;
  autoRotate?: boolean;
  isBackView?: boolean;
  interactive?: boolean;
}

export const HoodieShowroom: React.FC<HoodieShowroomProps> = ({
  currentColor = '#0c0c0c',
  isWireframe = false,
  lightingMood = 'cairo',
  fit = 'boxy',
  finish = 'cotton',
  graphicUrl = '/graphics/chrome-spider.png',
  frontGraphicUrl = '/graphics/chrome-spider-front.png',
  backGraphicUrl = '/graphics/chrome-spider.png',
  autoRotate = true,
  isBackView = false,
  interactive = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isInView, setIsInView] = useState(true);

  // Resize listener
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Intersection Observer Throttling: Pause 3D render loop when Hero is scrolled out of viewport
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.05 }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative pointer-events-none select-none"
      style={{ pointerEvents: 'none', touchAction: 'auto' }}
    >
      <Canvas
        shadows={false}
        frameloop={isInView ? 'always' : 'demand'}
        className="pointer-events-none select-none"
        style={{ pointerEvents: 'none', touchAction: 'auto' }}
        camera={{
          position: [0, typeof window !== 'undefined' && window.innerWidth < 768 ? -0.06 : 0.12, typeof window !== 'undefined' && window.innerWidth < 768 ? 6.6 : 4.2],
          fov: typeof window !== 'undefined' && window.innerWidth < 768 ? 36 : 43,
          near: 0.1,
          far: 25,
        }}
        gl={{
          antialias: true,
          alpha: true,
          preserveDrawingBuffer: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.NeutralToneMapping,
          toneMappingExposure: 1.15,
        }}
        dpr={getOptimizedDpr()}
      >
        <ResponsiveCamera />
        <color attach="background" args={['#090909']} />

        {/* Studio Lighting with Edge Rim Lights to ensure black garments pop against dark backgrounds */}
        <ambientLight intensity={1.75} color="#ffffff" />
        <hemisphereLight
          color="#ffffff"
          groundColor="#1a1a1a"
          intensity={0.7}
        />

        {/* Symmetric Studio Lights: Front, Back, Left, Right */}
        <directionalLight
          position={[0, 3.5, 3.2]}
          intensity={1.3}
          color="#ffffff"
        />

        <directionalLight
          position={[0, 2.0, 4.2]}
          intensity={1.1}
          color="#ffffff"
        />

        <directionalLight
          position={[0, 2.5, -4.0]}
          intensity={1.2}
          color="#ffffff"
        />

        <directionalLight
          position={[-4.0, 2.2, 0]}
          intensity={1.1}
          color={lightingMood === 'cyber' ? '#00f0ff' : '#ffffff'}
        />

        <directionalLight
          position={[4.0, 2.2, 0]}
          intensity={1.1}
          color="#ffffff"
        />

        {/* Dual Rim Lights: Left-Back and Right-Back for subtle fabric silhouette highlights */}
        <directionalLight
          position={[-3.5, 2.8, -3.0]}
          intensity={0.9}
          color="#ffffff"
        />
        <directionalLight
          position={[3.5, 2.8, -3.0]}
          intensity={0.9}
          color="#ffffff"
        />

        {/* Top-Down Ambient Sculpt Light */}
        <directionalLight
          position={[0, 4.5, 0]}
          intensity={0.65}
          color="#ffffff"
        />

        {/* Cyber Mood Accent Under-Glow only in cyber mode */}
        {lightingMood === 'cyber' && (
          <pointLight
            position={[0, -2.5, 0.5]}
            intensity={2.5}
            color="#CEFF00"
            distance={6}
          />
        )}

        <TurntableGroup speed={isMobile ? 0.5 : 0.4} autoRotate={autoRotate}>
          <Float
            speed={1.5}
            rotationIntensity={0}
            floatIntensity={0.15}
            floatingRange={[-0.04, 0.04]}
          >
            <RealHoodieModel
              color={currentColor}
              wireframe={isWireframe}
              interactive={isInView}
              graphicUrl={graphicUrl}
              frontGraphicUrl={frontGraphicUrl}
              backGraphicUrl={backGraphicUrl || graphicUrl}
              isBackView={isBackView}
            />
          </Float>
        </TurntableGroup>

        {/* Atmospheric Studio Dust Particles */}
        <AtmosphericParticles count={isMobile ? 80 : 160} />

        {/* Studio Pedestal Contact Shadow */}
        <ContactShadows
          position={[0, -1.8, 0]}
          opacity={0.88}
          scale={6.5}
          blur={2.0}
          far={4.5}
          resolution={isMobile ? 256 : 512}
          frames={1}
          color="#000000"
        />

        {/* Studio Pedestal Ring Geometry */}
        <group position={[0, -1.82, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.5, 1.55, 64]} />
            <meshBasicMaterial
              color={lightingMood === 'cyber' ? '#CEFF00' : '#262626'}
              transparent
              opacity={lightingMood === 'cyber' ? 0.6 : 0.4}
            />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[2.2, 2.22, 64]} />
            <meshBasicMaterial color="#1a1a1a" transparent opacity={0.6} />
          </mesh>
        </group>
      </Canvas>
    </div>
  );
};
