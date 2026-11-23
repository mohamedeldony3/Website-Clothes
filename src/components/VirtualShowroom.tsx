import React, { useState, useMemo, useRef, useEffect, Suspense } from 'react';
import { useCart } from '../context/CartContext';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Float } from '@react-three/drei';
import * as THREE from 'three';
import { HoodieSculpt, HoodieFit, HoodieFinish } from './3d/HoodieSculpt';
import { RealHoodieModel } from './3d/RealHoodieModel';
import { AtmosphericParticles } from './3d/AtmosphericParticles';
import { LightingMood } from './3d/HoodieShowroom';
import { ARViewModal } from './ARViewModal';
import { PRODUCTS } from '../data/products';
import { Product } from '../types';
import { Box, Sparkles, Layers, Check, ShoppingBag, Camera, Smartphone, Compass } from 'lucide-react';
import type { OrbitControls as OrbitControlsType } from 'three-stdlib';
import { getOptimizedDpr } from '../utils/performance';

export const VirtualShowroom: React.FC = () => {
  const { t, language, formatPrice, addToCart, products } = useCart();
  const currentProducts = products.length > 0 ? products : PRODUCTS;
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControlsType>(null);

  const [selectedProduct, setSelectedProduct] = useState<Product>(currentProducts[0]);

  const activeFits = useMemo<HoodieFit[]>(() => {
    return selectedProduct.availableFits && selectedProduct.availableFits.length > 0
      ? selectedProduct.availableFits
      : ['boxy', 'cocoon', 'cropped'];
  }, [selectedProduct]);

  const activeFinishes = useMemo<HoodieFinish[]>(() => {
    return selectedProduct.availableFinishes && selectedProduct.availableFinishes.length > 0
      ? selectedProduct.availableFinishes
      : ['cotton', 'nylon', 'washed'];
  }, [selectedProduct]);

  const activeLighting = useMemo<LightingMood[]>(() => {
    return selectedProduct.availableLighting && selectedProduct.availableLighting.length > 0
      ? selectedProduct.availableLighting
      : ['cairo', 'studio', 'cyber'];
  }, [selectedProduct]);

  const [fit, setFit] = useState<HoodieFit>(selectedProduct.defaultFit && activeFits.includes(selectedProduct.defaultFit) ? selectedProduct.defaultFit : activeFits[0]);
  const [finish, setFinish] = useState<HoodieFinish>(selectedProduct.defaultFinish && activeFinishes.includes(selectedProduct.defaultFinish) ? selectedProduct.defaultFinish : activeFinishes[0]);
  const [lighting, setLighting] = useState<LightingMood>(selectedProduct.defaultLighting && activeLighting.includes(selectedProduct.defaultLighting) ? selectedProduct.defaultLighting : activeLighting[0]);
  const [color, setColor] = useState(selectedProduct.colors[0]);
  const [wireframe, setWireframe] = useState(false);
  const [isBackView, setIsBackView] = useState(false);
  const [added, setAdded] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isAROpen, setIsAROpen] = useState(false);
  const [isInView, setIsInView] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Sync selected product if updated in products store
  useEffect(() => {
    const updated = currentProducts.find((p) => p.id === selectedProduct.id);
    if (updated && updated !== selectedProduct) {
      setSelectedProduct(updated);
    }
  }, [currentProducts, selectedProduct.id]);

  // Keep active fit/finish/lighting in bounds if available options change
  useEffect(() => {
    if (!activeFits.includes(fit)) {
      setFit(selectedProduct.defaultFit && activeFits.includes(selectedProduct.defaultFit) ? selectedProduct.defaultFit : activeFits[0]);
    }
  }, [activeFits, fit, selectedProduct.defaultFit]);

  useEffect(() => {
    if (!activeFinishes.includes(finish)) {
      setFinish(selectedProduct.defaultFinish && activeFinishes.includes(selectedProduct.defaultFinish) ? selectedProduct.defaultFinish : activeFinishes[0]);
    }
  }, [activeFinishes, finish, selectedProduct.defaultFinish]);

  useEffect(() => {
    if (!activeLighting.includes(lighting)) {
      setLighting(selectedProduct.defaultLighting && activeLighting.includes(selectedProduct.defaultLighting) ? selectedProduct.defaultLighting : activeLighting[0]);
    }
  }, [activeLighting, lighting, selectedProduct.defaultLighting]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // When selected piece changes, update active color to product's signature color and reset view to front
  const handleSelectPiece = (product: Product) => {
    setSelectedProduct(product);
    setIsBackView(false);
    if (product.colors && product.colors.length > 0) {
      setColor(product.colors[0]);
    }
    const pFits = product.availableFits && product.availableFits.length > 0 ? product.availableFits : (['boxy', 'cocoon', 'cropped'] as HoodieFit[]);
    const pFinishes = product.availableFinishes && product.availableFinishes.length > 0 ? product.availableFinishes : (['cotton', 'nylon', 'washed'] as HoodieFinish[]);
    const pLights = product.availableLighting && product.availableLighting.length > 0 ? product.availableLighting : (['cairo', 'studio', 'cyber'] as LightingMood[]);

    setFit(product.defaultFit && pFits.includes(product.defaultFit) ? product.defaultFit : pFits[0]);
    setFinish(product.defaultFinish && pFinishes.includes(product.defaultFinish) ? product.defaultFinish : pFinishes[0]);
    setLighting(product.defaultLighting && pLights.includes(product.defaultLighting) ? product.defaultLighting : pLights[0]);
  };

  // Robust graphic URL resolution: support both Front and Back graphics for 3D model with fallback
  const currentFrontGraphicUrl = useMemo(() => {
    if (selectedProduct.frontGraphicUrl) return selectedProduct.frontGraphicUrl;
    const defaultItem = PRODUCTS.find((p) => p.id === selectedProduct.id);
    if (defaultItem?.frontGraphicUrl) return defaultItem.frontGraphicUrl;
    const id = selectedProduct.id.toLowerCase();
    if (id.includes('spider')) return '/graphics/chrome-spider-front.png';
    if (id.includes('savage')) return '/graphics/savage-front.png';
    if (id.includes('revelation')) return '/graphics/revelation-front.png';
    if (id.includes('tokyo') || id.includes('wave')) return '/graphics/tokyo-wave-front.png';
    if (id.includes('one-piece') || id.includes('sanji')) return '/graphics/one-piece-front.png';
    if (id.includes('tree')) return '/graphics/bare-tree-front.png';
    if (id.includes('are-you-ok') || id.includes('hands')) return '/graphics/are-you-ok-front.png';
    if (id.includes('christmas') || id.includes('drip') || id.includes('calligraphy')) return '/graphics/merry-christmas-front.png';
    return undefined;
  }, [selectedProduct]);

  const currentBackGraphicUrl = useMemo(() => {
    if (selectedProduct.backGraphicUrl) return selectedProduct.backGraphicUrl;
    if (selectedProduct.graphicUrl) return selectedProduct.graphicUrl;
    const defaultItem = PRODUCTS.find((p) => p.id === selectedProduct.id);
    if (defaultItem?.backGraphicUrl) return defaultItem.backGraphicUrl;
    if (defaultItem?.graphicUrl) return defaultItem.graphicUrl;
    const id = selectedProduct.id.toLowerCase();
    if (id.includes('spider')) return '/graphics/chrome-spider.png';
    if (id.includes('savage')) return '/graphics/savage.png';
    if (id.includes('revelation')) return '/graphics/revelation.png';
    if (id.includes('tokyo') || id.includes('wave')) return '/graphics/tokyo-wave.png';
    if (id.includes('one-piece') || id.includes('sanji')) return '/graphics/one-piece.png';
    if (id.includes('tree')) return '/graphics/bare-tree.png';
    if (id.includes('are-you-ok') || id.includes('hands')) return '/graphics/are-you-ok.png';
    if (id.includes('christmas') || id.includes('drip') || id.includes('calligraphy')) return '/graphics/merry-christmas.png';
    return undefined;
  }, [selectedProduct]);

  // Performance Optimization: Intersection Observer to throttle rendering when scrolled away
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const toggleViewAngle = () => {
    setIsBackView((prev) => !prev);
  };

  const handleAddCustomToCart = () => {
    addToCart(
      {
        ...selectedProduct,
        name: `CUSTOM ${fit.toUpperCase()} ${selectedProduct.name}`,
        nameAr: `هودي مخصص بقصة ${fit === 'boxy' ? 'بوكسي' : fit === 'cocoon' ? 'كوكون' : 'كروب'} - ${selectedProduct.nameAr}`,
        fit: fit === 'boxy' ? 'Exaggerated Boxy' : fit === 'cocoon' ? 'Architectural Cocoon' : 'Heavy Cropped',
        fabric:
          finish === 'cotton'
            ? '520 GSM Loopback Egyptian Cotton'
            : finish === 'nylon'
            ? 'Matte Waxed Tech-Nylon Membrane'
            : 'Acid Washed Enzyme Cotton',
      },
      {
        name: color.name,
        nameAr: color.name,
        hex: color.hex,
        threeColor: color.threeColor,
      },
      'L',
      1
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  // High-Res 3D Snapshot Export with Brutalist Watermark
  const handleCaptureSnapshot = () => {
    if (!containerRef.current) return;
    const canvas = containerRef.current.querySelector('canvas');
    if (!canvas) return;

    setIsCapturing(true);

    try {
      const snapCanvas = document.createElement('canvas');
      snapCanvas.width = 1200;
      snapCanvas.height = 1500;
      const ctx = snapCanvas.getContext('2d');
      if (ctx) {
        // Dark studio background
        ctx.fillStyle = '#090909';
        ctx.fillRect(0, 0, 1200, 1500);

        // Grid lines
        ctx.strokeStyle = '#181818';
        ctx.lineWidth = 1;
        for (let i = 0; i < 1200; i += 60) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i, 1500);
          ctx.stroke();
        }

        // Draw 3D Canvas in center
        ctx.drawImage(canvas, 60, 60, 1080, 1260);

        // Top Header
        ctx.fillStyle = '#CEFF00';
        ctx.font = 'bold 24px monospace';
        ctx.fillText('MONO / STUDIO', 60, 1370);

        ctx.fillStyle = '#888888';
        ctx.font = '16px monospace';
        ctx.fillText(`PIECE: ${selectedProduct.name} // 3D ATELIER`, 60, 1400);

        // Specs on right
        ctx.fillStyle = '#F1F0EB';
        ctx.font = 'bold 18px monospace';
        ctx.fillText(`FIT: ${fit.toUpperCase()} // ${selectedProduct.weightGsm} GSM`, 740, 1370);
        ctx.fillText(`FINISH: ${finish.toUpperCase()}`, 740, 1400);

        ctx.fillStyle = '#CEFF00';
        ctx.font = '14px monospace';
        ctx.fillText(`COLOR: ${color.name.toUpperCase()} // CAIRO 2026`, 740, 1430);

        // Export as image
        const imgUrl = snapCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `MONO-STUDIO-CUSTOM-${selectedProduct.id}-${Date.now()}.png`;
        link.href = imgUrl;
        link.click();
      }
    } catch (err) {
      console.error('Snapshot capture failed:', err);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <section
      id="fitting-lab"
      ref={containerRef}
      className="py-24 bg-[#0a0a0a] text-[#F1F0EB] relative border-y border-[#1c1c1c] overflow-hidden"
    >
      {/* Background Subtle Tech Coordinates */}
      <div className="absolute top-8 left-8 text-[10px] font-mono text-[#333] tracking-widest hidden md:block select-none">
        LAT: 30.0444° N // LON: 31.2357° E // CAIRO GARMENT LAB // 3D DIGITAL TWIN
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 border-b border-[#202020] pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#141414] border border-[#262626] text-xs font-mono tracking-widest text-[#CEFF00] mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>// 02.B {t.fittingLab.badge}</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight uppercase">
              {t.fittingLab.title}
            </h2>
          </div>
          <p className="text-xs sm:text-sm font-mono text-[#777] max-w-md mt-3 md:mt-0 tracking-wider">
            {t.fittingLab.subtitle}
          </p>
        </div>

        {/* Main 3D Studio Stage & Control Console (Unified Digital Atelier) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8 items-stretch">
          {/* Left / Center 3D Interactive Canvas Stage */}
          <div className="lg:col-span-8 bg-[#0c0c0c] border border-[#222] h-[450px] sm:h-[520px] lg:h-[660px] relative overflow-hidden flex flex-col">
            {/* Integrated Top Drop Selector HUD Header inside 3D Stage */}
            <div className="relative z-20 bg-[#121212]/95 backdrop-blur-md border-b border-[#222] p-1.5 sm:p-2.5 shrink-0">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider mb-1.5 px-1">
                <span className="text-[#888] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#CEFF00]" />
                  <span>{language === 'ar' ? 'إصدارات الأرشيف (8 تصاميم 3D)' : 'ARCHIVE REPERTOIRE (8 DESIGNS IN 3D)'}:</span>
                </span>
                <span className="text-[#CEFF00] font-bold truncate max-w-[180px] sm:max-w-[260px]">
                  {language === 'ar' ? selectedProduct.nameAr : selectedProduct.name}
                </span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none touch-pan-x">
                {currentProducts.map((prod) => (
                  <button
                    key={prod.id}
                    onClick={() => handleSelectPiece(prod)}
                    className={`relative w-12 sm:w-20 shrink-0 border transition-all text-left group ${
                      selectedProduct.id === prod.id
                        ? 'border-[#CEFF00] scale-105 shadow-[0_0_12px_rgba(206,255,0,0.35)] bg-[#1c1c1c] z-10'
                        : 'border-[#262626] opacity-60 hover:opacity-100 hover:border-[#555] bg-[#141414]'
                    }`}
                  >
                    <div className="aspect-[3/4] overflow-hidden bg-black">
                      <img
                        src={prod.images[0]}
                        alt={prod.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="p-0.5 sm:p-1 text-[8px] sm:text-[9px] font-mono line-clamp-1 uppercase text-[#bbb] group-hover:text-white text-center">
                      {language === 'ar' ? prod.nameAr.split(' ')[1] || prod.nameAr : prod.name.split(' ')[0]}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 3D Canvas Stage Body */}
            <div className="flex-1 w-full relative min-h-0 cursor-grab active:cursor-grabbing">
              {/* Floating Top Controls Inside Canvas */}
              <div className="absolute top-2 left-2 right-2 z-20 flex items-center justify-between pointer-events-none gap-1 sm:gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2 bg-[#121212]/90 backdrop-blur-md px-2 sm:px-2.5 py-1 border border-[#262626] text-[9px] sm:text-[10px] font-mono tracking-wider text-[#aaa] pointer-events-auto shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#CEFF00] animate-ping" />
                  <span className="text-white font-bold">{fit.toUpperCase()}</span>
                  <span>•</span>
                  <span>{finish.toUpperCase()}</span>
                </div>

                {/* Utility actions (Back/Front View + Snap + AR + Wireframe) */}
                <div className="flex items-center gap-1 sm:gap-1.5 pointer-events-auto">
                  {/* 180° Flip to Back / Front */}
                  <button
                    onClick={toggleViewAngle}
                    title="Inspect Back Graphic (180°)"
                    className="px-2 sm:px-2.5 py-1 text-[10px] sm:text-xs font-mono tracking-wider flex items-center gap-1 border border-[#2c2c2c] bg-[#141414]/90 text-[#ccc] hover:text-[#CEFF00] hover:border-[#CEFF00] transition-all"
                  >
                    <Compass className="w-3.5 h-3.5 text-[#CEFF00]" />
                    <span className="hidden sm:inline">{isBackView ? (language === 'ar' ? 'معاينة الأمام' : 'VIEW FRONT') : (language === 'ar' ? 'معاينة الظهر (180°)' : 'VIEW BACK (180°)')}</span>
                    <span className="sm:hidden">{isBackView ? (language === 'ar' ? 'الأمام' : 'FRONT') : '180°'}</span>
                  </button>

                  {/* 3D High-Res Snap Button */}
                  <button
                    onClick={handleCaptureSnapshot}
                    disabled={isCapturing}
                    title="Export High-Res 3D Editorial Photo"
                    className="px-2 sm:px-2.5 py-1 text-[10px] sm:text-xs font-mono tracking-wider flex items-center gap-1 border border-[#2c2c2c] bg-[#141414]/90 text-[#ccc] hover:text-[#CEFF00] hover:border-[#CEFF00] transition-all"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">
                      {isCapturing ? t.fittingLab.snapping : t.fittingLab.snapBtn}
                    </span>
                    <span className="sm:hidden">{language === 'ar' ? 'لقطة' : 'SNAP'}</span>
                  </button>

                  {/* Live AR Camera Superimpose Trigger */}
                  <button
                    onClick={() => setIsAROpen(true)}
                    title="View Garment in Your Room with AR"
                    className="px-2 sm:px-2.5 py-1 text-[10px] sm:text-xs font-mono tracking-wider flex items-center gap-1 border border-[#CEFF00] bg-[#CEFF00]/15 text-[#CEFF00] hover:bg-[#CEFF00] hover:text-black font-bold transition-all shadow-[0_0_12px_rgba(206,255,0,0.2)]"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{t.fittingLab.arBtn}</span>
                    <span className="sm:hidden">AR</span>
                  </button>

                  {/* Wireframe toggle */}
                  <button
                    onClick={() => setWireframe(!wireframe)}
                    className={`hidden sm:flex px-2 sm:px-2.5 py-1 text-xs font-mono tracking-wider items-center gap-1 border transition-all ${
                      wireframe
                        ? 'bg-[#CEFF00] text-black border-[#CEFF00] font-bold'
                        : 'bg-[#141414]/90 text-[#888] hover:text-white border-[#2c2c2c]'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>WIREFRAME</span>
                  </button>
                </div>
              </div>

              {/* 3D Canvas */}
              <div className="absolute inset-0" style={{ touchAction: 'pan-y' }}>
                <Canvas
                  shadows={false}
                  dpr={getOptimizedDpr()}
                  frameloop={isInView ? 'always' : 'demand'}
                  style={{ touchAction: 'pan-y' }}
                  camera={{
                    position: [0, isMobile ? 0.05 : 0.1, isMobile ? 2.95 : 3.25],
                    fov: isMobile ? 44 : 43,
                  }}
                  gl={{
                    antialias: true,
                    alpha: true,
                    preserveDrawingBuffer: true,
                    powerPreference: 'high-performance',
                    toneMapping: THREE.NeutralToneMapping,
                    toneMappingExposure: 1.15,
                  }}
                >
                  <color attach="background" args={['#0c0c0c']} />
                  <ambientLight intensity={1.6} color="#ffffff" />
                  <hemisphereLight
                    color="#ffffff"
                    groundColor="#ffffff"
                    intensity={0.6}
                  />

                  {/* Balanced 360° Studio Rig: 100% true-to-life color consistency from all angles */}
                  <directionalLight
                    position={[0, 3.5, 3.0]}
                    intensity={1.3}
                    color="#ffffff"
                  />

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
                    color={lighting === 'cyber' ? '#00f0ff' : '#ffffff'}
                  />

                  <directionalLight
                    position={[4.0, 2.0, 0]}
                    intensity={1.1}
                    color="#ffffff"
                  />

                  <directionalLight
                    position={[0, 4.5, 0]}
                    intensity={0.6}
                    color="#ffffff"
                  />

                  {lighting === 'cyber' && (
                    <pointLight
                      position={[0, -2, 1]}
                      intensity={2.5}
                      color="#CEFF00"
                    />
                  )}

                  <Float speed={1.5} rotationIntensity={0} floatIntensity={0.15}>
                    <RealHoodieModel
                      color={color?.threeColor || color?.hex || '#f0f0ee'}
                      wireframe={wireframe}
                      interactive={isInView}
                      frontGraphicUrl={currentFrontGraphicUrl}
                      backGraphicUrl={currentBackGraphicUrl}
                      isBackView={isBackView}
                    />
                  </Float>

                  <AtmosphericParticles count={120} />

                  <ContactShadows
                    position={[0, -1.65, 0]}
                    opacity={0.85}
                    scale={6.5}
                    blur={2.0}
                    far={4.5}
                    resolution={isMobile ? 256 : 512}
                    frames={1}
                    color="#000"
                  />

                  <OrbitControls
                    ref={controlsRef}
                    autoRotate={false}
                    enableZoom={true}
                    minDistance={1.8}
                    maxDistance={4.8}
                    enablePan={false}
                    maxPolarAngle={Math.PI / 1.6}
                    minPolarAngle={Math.PI / 3.8}
                  />
                </Canvas>
              </div>

              {/* Bottom Interaction Hint */}
              <div className="absolute bottom-2 left-2 right-2 z-10 flex items-center justify-between text-[9px] font-mono text-[#666] pointer-events-none">
                <span className="bg-[#101010]/90 backdrop-blur-md px-2 py-0.5 border border-[#222]">
                  {language === 'ar' ? 'اسحب للتدوير 360° • باللمس للتقريب' : t.fittingLab.zoomInspect}
                </span>
                <span className="hidden sm:inline bg-[#101010]/90 backdrop-blur-md px-2 py-0.5 border border-[#222]">
                  PBR GRAPHIC MAPPING • 180° ROTATION
                </span>
              </div>
            </div>
          </div>

          {/* Right Customizer Panel */}
          <div className="lg:col-span-4 bg-[#111111] border border-[#222] p-3.5 sm:p-7 flex flex-col justify-between space-y-4 sm:space-y-6">
            <div className="space-y-4 sm:space-y-6">
              {/* Telemetry info */}
              <div className="border-b border-[#202020] pb-2.5 sm:pb-4 flex flex-wrap sm:flex-nowrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] sm:text-xs font-mono text-[#CEFF00] tracking-widest uppercase mb-0.5">
                    {language === 'ar' ? 'مواصفات التخصيص' : 'CONFIGURATOR SPEC'}
                  </div>
                  <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white uppercase leading-snug">
                    {language === 'ar' ? selectedProduct.nameAr : selectedProduct.name}
                  </h3>
                </div>
                <div className="text-sm sm:text-base font-mono font-bold text-[#CEFF00] shrink-0 pt-0.5">
                  {formatPrice(selectedProduct.price)}
                </div>
              </div>

              {/* 1. Colorways for Selected Product Only (Top Priority) */}
              <div className="space-y-2 sm:space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-mono text-[#aaa] tracking-wider uppercase">
                    {language === 'ar' ? 'درجة اللون:' : 'COLORWAY:'} <strong className="text-white">{language === 'ar' ? (color.nameAr || color.name) : color.name}</strong>
                  </div>
                  <span className="text-[10px] font-mono text-[#777] uppercase">{color.hex}</span>
                </div>

                {/* Only Selected Product Colors */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  {selectedProduct.colors.map((c) => (
                    <button
                      key={c.hex}
                      onClick={() => setColor(c)}
                      title={language === 'ar' ? (c.nameAr || c.name) : c.name}
                      className={`w-7 h-7 sm:w-9 sm:h-9 border transition-all flex items-center justify-center relative ${
                        color.hex.toLowerCase() === c.hex.toLowerCase()
                          ? 'border-[#CEFF00] scale-110 shadow-[0_0_12px_rgba(206,255,0,0.4)] z-10'
                          : 'border-[#333] opacity-65 hover:opacity-100 hover:border-[#666]'
                      }`}
                      style={{ backgroundColor: c.hex }}
                    >
                      {color.hex.toLowerCase() === c.hex.toLowerCase() && (
                        <span className="w-1.5 h-1.5 bg-[#CEFF00] rounded-full shadow-[0_0_4px_#CEFF00]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Silhouette / Fit Option */}
              <div className="space-y-1.5 sm:space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-[#aaa] tracking-wider uppercase">
                  <span>{t.fittingLab.silhouette}:</span>
                  <strong className="text-white">{t.fittingLab.fits[fit] || fit}</strong>
                </div>
                <div className={`grid gap-1.5 sm:gap-2 ${activeFits.length === 1 ? 'grid-cols-1' : activeFits.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                  {activeFits.map((f) => (
                    <button
                      key={f}
                      onClick={() => setFit(f)}
                      className={`py-2 sm:py-2 px-1 text-center text-[10px] sm:text-[11px] font-mono tracking-wider uppercase border transition-all ${
                        fit === f
                          ? 'bg-[#CEFF00] text-[#090909] border-[#CEFF00] font-bold shadow-[0_0_10px_rgba(206,255,0,0.3)]'
                          : 'bg-[#161616] text-[#999] border-[#292929] hover:border-[#666]'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Fabric Finish */}
              <div className="space-y-1.5 sm:space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-[#aaa] tracking-wider uppercase">
                  <span>{t.fittingLab.fabricFinish}:</span>
                  <strong className="text-white">{t.fittingLab.finishes[finish] || finish}</strong>
                </div>
                <div className={`grid gap-1.5 sm:gap-2 ${activeFinishes.length === 1 ? 'grid-cols-1' : activeFinishes.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                  {activeFinishes.map((fin) => (
                    <button
                      key={fin}
                      onClick={() => setFinish(fin)}
                      className={`py-2 sm:py-2 px-1 text-center text-[10px] sm:text-[11px] font-mono tracking-wider uppercase border transition-all ${
                        finish === fin
                          ? 'bg-[#F1F0EB] text-[#090909] border-white font-bold'
                          : 'bg-[#161616] text-[#999] border-[#292929] hover:border-[#666]'
                      }`}
                    >
                      {fin}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Lighting Mood Preset */}
              <div className="space-y-2 sm:space-y-2.5">
                <div className="flex items-center justify-between text-xs font-mono text-[#aaa] tracking-wider uppercase">
                  <span>{t.fittingLab.lightingMood}:</span>
                  <strong className="text-white">{t.fittingLab.lights[lighting] || lighting}</strong>
                </div>
                <div className={`grid gap-2 ${activeLighting.length === 1 ? 'grid-cols-1' : activeLighting.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                  {activeLighting.map((l) => (
                    <button
                      key={l}
                      onClick={() => setLighting(l)}
                      className={`py-2 px-1 text-center text-[10px] font-mono tracking-wider uppercase border transition-all ${
                        lighting === l
                          ? 'bg-[#222] text-[#CEFF00] border-[#444] font-bold'
                          : 'bg-[#161616] text-[#777] border-[#292929] hover:border-[#555]'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-[#202020] space-y-3">
              <button
                onClick={handleAddCustomToCart}
                disabled={added}
                className={`w-full py-4 text-xs font-mono font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${
                  added
                    ? 'bg-green-500 text-black'
                    : 'bg-[#CEFF00] hover:bg-[#b8e600] text-[#090909] shadow-[0_0_20px_rgba(206,255,0,0.3)]'
                }`}
              >
                {added ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>ADDED CUSTOM FIT TO BAG</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>{t.fittingLab.addToBag}</span>
                  </>
                )}
              </button>

              <div className="text-[10px] font-mono text-[#666] text-center uppercase">
                MADE-TO-ORDER IN CAIRO // SHIPS IN 3-5 BUSINESS DAYS
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AR Live Simulation Modal */}
      <ARViewModal
        isOpen={isAROpen}
        onClose={() => setIsAROpen(false)}
        currentColor={color.threeColor || color.hex}
        fit={fit}
        finish={finish}
        graphicUrl={currentBackGraphicUrl}
        frontGraphicUrl={currentFrontGraphicUrl}
        backGraphicUrl={currentBackGraphicUrl}
        productName={language === 'ar' ? selectedProduct.nameAr : selectedProduct.name}
        colorName={language === 'ar' ? color.nameAr : color.name}
      />
    </section>
  );
};
