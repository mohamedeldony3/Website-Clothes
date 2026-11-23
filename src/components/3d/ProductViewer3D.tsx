import React, { Suspense, useState, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Float } from '@react-three/drei';
import * as THREE from 'three';
import { RealHoodieModel } from './RealHoodieModel';
import { HoodieSculpt } from './HoodieSculpt';
import { ProductColor } from '../../types';
import { getOptimizedDpr } from '../../utils/performance';
import { Layers, RotateCcw, Compass } from 'lucide-react';
import type { OrbitControls as OrbitControlsType } from 'three-stdlib';

interface ProductViewer3DProps {
  currentColor: ProductColor;
  onColorChange?: (color: ProductColor) => void;
  availableColors?: ProductColor[];
  graphicUrl?: string;
  frontGraphicUrl?: string;
  backGraphicUrl?: string;
}

export const ProductViewer3D: React.FC<ProductViewer3DProps> = ({
  currentColor,
  onColorChange,
  availableColors = [],
  graphicUrl,
  frontGraphicUrl,
  backGraphicUrl,
}) => {
  const controlsRef = useRef<OrbitControlsType>(null);
  const [wireframe, setWireframe] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [isBackView, setIsBackView] = useState(false);

  const toggleViewAngle = () => {
    setAutoRotate(false);
    setIsBackView((prev) => !prev);
  };

  const activeColorHex = currentColor?.threeColor || currentColor?.hex || '#f0f0ee';

  return (
    <div className="w-full h-full min-h-[440px] md:min-h-[560px] relative bg-[#0a0a0a] rounded-none overflow-hidden border border-[#222]">
      {/* 3D Canvas */}
      <Canvas
        shadows={false}
        dpr={getOptimizedDpr()}
        camera={{ position: [0, -0.05, 3.6], fov: 42 }}
        gl={{
          antialias: true,
          alpha: true,
          preserveDrawingBuffer: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.NeutralToneMapping,
          toneMappingExposure: 1.15,
        }}
      >
        <color attach="background" args={['#0e0e0e']} />

        {/* Balanced 360° Studio Lighting: 100% True-to-Life Garment Color at Every Angle */}
        <ambientLight intensity={1.6} color="#ffffff" />
        <hemisphereLight
          color="#ffffff"
          groundColor="#ffffff"
          intensity={0.6}
        />

        {/* 4 Symmetric Directional Lights: Front, Back, Left, Right for zero hue/brightness shifting on spin */}
        <directionalLight
          position={[0, 2.0, 4.0]}
          intensity={1.1}
          color="#ffffff"
        />

        <directionalLight
          position={[0, 2.0, -4.0]}
          intensity={1.1}
          color="#ffffff"
        />

        <directionalLight
          position={[-4.0, 2.0, 0]}
          intensity={1.1}
          color="#ffffff"
        />

        <directionalLight
          position={[4.0, 2.0, 0]}
          intensity={1.1}
          color="#ffffff"
        />

        {/* Top-Down Sculpt Light */}
        <directionalLight
          position={[0, 4.5, 0]}
          intensity={0.6}
          color="#ffffff"
        />

        <Float speed={1.2} rotationIntensity={0} floatIntensity={0.12}>
          <RealHoodieModel
            color={activeColorHex}
            wireframe={wireframe}
            interactive={false}
            frontGraphicUrl={frontGraphicUrl}
            backGraphicUrl={backGraphicUrl || graphicUrl}
            isBackView={isBackView}
          />
        </Float>

        <ContactShadows
          position={[0, -1.6, 0]}
          opacity={0.85}
          scale={5}
          blur={2.2}
          far={3.5}
          color="#000"
        />

        <OrbitControls
          ref={controlsRef}
          target={[0, -0.05, 0]}
          maxPolarAngle={Math.PI / 1.6}
          minPolarAngle={Math.PI / 3.8}
          enableZoom={true}
          minDistance={1.8}
          maxDistance={5.5}
          enablePan={false}
          autoRotate={autoRotate}
          autoRotateSpeed={1.0}
        />
      </Canvas>

      {/* Floating 3D Control Bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        <div className="flex items-center gap-2 bg-[#121212]/95 backdrop-blur-md px-3 py-1.5 border border-[#2a2a2a] text-xs font-mono uppercase tracking-wider text-[#999] pointer-events-auto">
          <span className="w-2 h-2 rounded-full bg-[#CEFF00] animate-pulse" />
          <span>3D STUDIO • 360° CLOTH VIEWER</span>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Flip to Back / Front */}
          <button
            onClick={toggleViewAngle}
            title="Toggle Front / Back (180°)"
            className="px-3 py-1.5 text-xs font-mono tracking-wider flex items-center gap-1.5 border border-[#CEFF00] bg-[#CEFF00]/15 text-[#CEFF00] hover:bg-[#CEFF00] hover:text-black transition-all font-bold shadow-[0_0_12px_rgba(206,255,0,0.25)]"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>{isBackView ? 'VIEW FRONT' : 'VIEW BACK (180°)'}</span>
          </button>

          <button
            onClick={() => setWireframe(!wireframe)}
            title="Toggle Wireframe Architecture"
            className={`px-3 py-1.5 text-xs font-mono tracking-wider flex items-center gap-1.5 transition-all border ${
              wireframe
                ? 'bg-[#CEFF00] text-[#090909] border-[#CEFF00] font-bold'
                : 'bg-[#141414]/90 text-[#999] hover:text-white border-[#2a2a2a]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">WIREFRAME</span>
          </button>

          <button
            onClick={() => setAutoRotate(!autoRotate)}
            title="Toggle 360 Turntable"
            className={`px-3 py-1.5 text-xs font-mono tracking-wider flex items-center gap-1.5 transition-all border ${
              autoRotate
                ? 'bg-[#222] text-[#CEFF00] border-[#333]'
                : 'bg-[#141414]/90 text-[#777] border-[#2a2a2a]'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{autoRotate ? 'ROTATING' : 'PAUSED'}</span>
          </button>
        </div>
      </div>

      {/* Interactive Colorways on 3D Viewer */}
      {availableColors.length > 0 && onColorChange && (
        <div className="absolute bottom-4 left-4 flex flex-wrap max-w-[80%] items-center gap-1.5 bg-[#121212]/95 backdrop-blur-md p-2 border border-[#2a2a2a] z-10">
          <span className="text-[10px] font-mono text-[#888] uppercase px-1">FINISH:</span>
          {availableColors.map((col) => (
            <button
              key={col.hex}
              onClick={() => onColorChange(col)}
              title={col.name}
              className={`w-5 h-5 rounded-none border transition-all ${
                currentColor?.hex?.toLowerCase() === col?.hex?.toLowerCase()
                  ? 'border-[#CEFF00] scale-110 shadow-[0_0_8px_rgba(206,255,0,0.5)]'
                  : 'border-[#444] opacity-70 hover:opacity-100'
              }`}
              style={{ backgroundColor: col.hex }}
            />
          ))}
        </div>
      )}

      {/* Interaction Hint */}
      <div className="absolute bottom-4 right-4 text-[10px] font-mono text-[#777] tracking-wider bg-[#0a0a0a]/90 px-2.5 py-1 border border-[#222] hidden sm:block z-10">
        DRAG TO ROTATE 360° • SCROLL TO ZOOM
      </div>
    </div>
  );
};
