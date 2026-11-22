import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { useCart } from '../context/CartContext';
import { PRODUCTS } from '../data/products';
import { Product, ProductColor, ProductSize } from '../types';
import { LightingMood } from './3d/HoodieShowroom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowDown,
  ArrowRight,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Palette,
  ShoppingBag,
  Compass,
  Layers,
  RotateCcw,
  Sparkles,
  Check,
  Eye,
  X,
  Lock,
} from 'lucide-react';

// Lazy load the 3D Showroom so initial HTML/CSS loads in milliseconds!
const HoodieShowroom = lazy(() =>
  import('./3d/HoodieShowroom').then((mod) => ({ default: mod.HoodieShowroom }))
);

export const Hero: React.FC = () => {
  const { t, language, formatPrice, addToCart, setSelectedProduct, products } = useCart();
  const currentProducts = products.length > 0 ? products : PRODUCTS;
  const total = currentProducts.length;

  const [activeIndex, setActiveIndex] = useState(0);
  const activeProduct = currentProducts[activeIndex] || currentProducts[0];
  const [activeColor, setActiveColor] = useState<ProductColor>(activeProduct.colors[0]);
  const [selectedSize, setSelectedSize] = useState<ProductSize>(activeProduct.sizes?.[0] || 'L');

  const [isWireframe, setIsWireframe] = useState(false);
  const [lightingMood, setLightingMood] = useState<LightingMood>('cairo');
  const [isBackView, setIsBackView] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [isAdded, setIsAdded] = useState(false);

  // Flying transition state for Vexel glide effect
  const [flyer, setFlyer] = useState<{
    id: string;
    image: string;
    startX: number;
    startY: number;
  } | null>(null);

  const heroRef = useRef<HTMLElement>(null);
  const userHoldUntilRef = useRef<number>(0);
  const isPausedRef = useRef<boolean>(false);

  // Sync color and size when active product changes
  useEffect(() => {
    if (activeProduct.colors && activeProduct.colors.length > 0) {
      setActiveColor(activeProduct.colors[0]);
    }
    if (activeProduct.sizes && activeProduct.sizes.length > 0) {
      setSelectedSize(activeProduct.sizes[0]);
    }
  }, [activeProduct]);

  const setUserHold = (durationMs = 7000) => {
    userHoldUntilRef.current = Date.now() + durationMs;
  };

  const step = (direction: number, fromRect?: DOMRect, targetProduct?: Product) => {
    setUserHold();
    const nextIndex = (activeIndex + direction + total) % total;
    const nextProd = targetProduct || currentProducts[nextIndex];

    if (fromRect) {
      setFlyer({
        id: nextProd.id,
        image: nextProd.images[0],
        startX: fromRect.left,
        startY: fromRect.top,
      });
      setTimeout(() => setFlyer(null), 950);
    }

    setActiveIndex(nextIndex);
  };

  // Autoplay loop (every 7 seconds unless paused by user interaction)
  useEffect(() => {
    const interval = setInterval(() => {
      if (
        !isPausedRef.current &&
        Date.now() >= userHoldUntilRef.current &&
        !autoRotate
      ) {
        step(1);
      }
    }, 7000);
    return () => clearInterval(interval);
  }, [activeIndex, autoRotate, total]);

  // Keyboard navigation (Arrow keys)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (['ArrowRight', 'ArrowDown'].includes(e.key)) {
        step(1);
      } else if (['ArrowLeft', 'ArrowUp'].includes(e.key)) {
        step(-1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeIndex, total]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleAddToCart = () => {
    addToCart(activeProduct, activeColor, selectedSize, 1);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  // Preview packshots for the upcoming queue (slots 0 and 1)
  const queueSlot0 = currentProducts[(activeIndex + 1) % total];
  const queueSlot1 = currentProducts[(activeIndex + 2) % total];

  return (
    <section
      id="hero"
      ref={heroRef}
      onMouseEnter={() => {
        isPausedRef.current = true;
      }}
      onMouseLeave={() => {
        isPausedRef.current = false;
      }}
      className="relative w-full min-h-[100svh] sm:h-screen sm:min-h-[740px] sm:max-h-[1100px] bg-[#090909] overflow-hidden flex flex-col justify-between pt-16 pb-28 sm:pb-8 select-none"
    >
      {/* Background Architectural Grid Lines */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.04] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:4rem_4rem]" />

      {/* 3D SHOWROOM CANVAS STAGE (Full-Screen Visual Centerpiece - Continuous Turntable with Zero Touch Interference) */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none" style={{ touchAction: 'pan-y' }}>
        <Suspense
          fallback={
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#090909] text-xs font-mono text-[#CEFF00] space-y-3">
              <div className="w-10 h-10 border-2 border-[#222] border-t-[#CEFF00] rounded-full animate-spin" />
              <span className="tracking-widest uppercase">
                INITIALIZING 3D DIGITAL ATELIER...
              </span>
            </div>
          }
        >
          <HoodieShowroom
            currentColor={activeColor.threeColor || activeColor.hex}
            isWireframe={isWireframe}
            lightingMood={lightingMood}
            frontGraphicUrl={activeProduct.frontGraphicUrl}
            backGraphicUrl={activeProduct.backGraphicUrl || activeProduct.graphicUrl}
            graphicUrl={activeProduct.graphicUrl}
            autoRotate={true}
            isBackView={isBackView}
            interactive={false}
          />
        </Suspense>
      </div>

      {/* Flying transition overlay when packshot is clicked */}
      {flyer && (
        <motion.div
          key={flyer.id}
          initial={{
            left: flyer.startX,
            top: flyer.startY,
            scale: 0.6,
            opacity: 0.9,
          }}
          animate={{
            left: '50%',
            top: '46%',
            x: '-50%',
            y: '-50%',
            scale: 1.35,
            opacity: 0,
          }}
          transition={{ duration: 0.9, ease: [0.22, 0.9, 0.3, 1] }}
          className="fixed z-40 w-36 h-48 pointer-events-none rounded-none overflow-hidden shadow-2xl border border-[#CEFF00]/40"
        >
          <img src={flyer.image} alt="Flying garment" className="w-full h-full object-cover" />
        </motion.div>
      )}

      {/* Top Hero Editorial HUD Bar */}
      <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-3 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="px-2 sm:px-2.5 py-1 text-[9px] sm:text-[10px] font-mono tracking-widest uppercase bg-[#141414]/90 backdrop-blur-md border border-[#262626] text-[#CEFF00]">
            {language === 'ar' ? 'موسم جديد // إصدار الأرشيف 04' : 'NEW SEASON // ARCHIVE DROP 04'}
          </span>
          <span className="hidden sm:inline-block text-[11px] font-mono tracking-widest text-[#777] uppercase">
            {activeProduct.weightGsm || 520} {language === 'ar' ? 'جرام/م² قطن مصري تيري حلقي' : 'GSM LOOPBACK EGYPTIAN COTTON'}
          </span>
        </div>

        {/* Desktop piece tracker */}
        <div className="text-[11px] font-mono tracking-widest text-[#777] uppercase hidden md:flex items-center gap-3">
          <span>{language === 'ar' ? `قطعة ${activeIndex + 1} من ${total}` : `PIECE ${activeIndex + 1} OF ${total}`}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#CEFF00]" />
          <span>{language === 'ar' ? 'أزياء تجريبية من القاهرة' : 'CAIRO EXPERIMENTAL APPAREL'}</span>
        </div>

        {/* Mobile piece stepper and quick 3D Lab trigger */}
        <div className="flex md:hidden items-center gap-1.5 pointer-events-auto">
          <button
            onClick={() => scrollTo('fitting-lab')}
            className="px-2 py-1 text-[10px] font-mono tracking-wider uppercase bg-[#141414]/90 backdrop-blur-md border border-[#262626] text-[#CEFF00] hover:border-[#CEFF00] flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3 text-[#CEFF00]" />
            <span>{language === 'ar' ? 'معمل 3D' : '3D LAB'}</span>
          </button>
          <div className="flex items-center gap-1 bg-[#141414]/90 backdrop-blur-md border border-[#262626] p-1">
            <button
              onClick={() => step(-1)}
              aria-label="Previous garment"
              className="p-0.5 text-[#888] hover:text-[#CEFF00] transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
            </button>
            <span className="text-[10px] font-mono font-bold text-[#CEFF00] px-1">
              {activeIndex + 1}/{total}
            </span>
            <button
              onClick={() => step(1)}
              aria-label="Next garment"
              className="p-0.5 text-[#888] hover:text-[#CEFF00] transition-colors"
            >
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Layout: Left Rolling Typography & Right Floating Packshot Rail */}
      <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mb-auto sm:my-auto pointer-events-none pt-2 sm:pt-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-6 items-center">
          {/* Left Column: Masked Rolling Title & Specs (Constrained to left 4 cols on desktop to guarantee zero 3D hoodie overlap) */}
          <div className="lg:col-span-4 xl:col-span-4 space-y-1 sm:space-y-4 max-w-sm sm:max-w-md">
            <div className="hidden sm:inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-0.5 sm:py-1 bg-[#141414]/90 backdrop-blur-md border border-[#2a2a2a] text-[9px] sm:text-[11px] font-mono tracking-widest text-[#bbb] pointer-events-auto">
              <Sparkles className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-[#CEFF00]" />
              <span>COLLECTION REPERTOIRE</span>
            </div>

            {/* Masked Rolling Title */}
            <div className="min-h-[2rem] sm:min-h-[4.5rem] overflow-hidden relative">
              <AnimatePresence mode="wait">
                <motion.h1
                  key={activeProduct.id}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
                  className="text-base sm:text-3xl lg:text-4xl xl:text-5xl font-black text-[#F1F0EB] uppercase leading-tight max-w-xs sm:max-w-none"
                >
                  {language === 'ar' ? activeProduct.nameAr : activeProduct.name}
                </motion.h1>
              </AnimatePresence>
            </div>

            {/* Masked Rolling Price & Subtext */}
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="h-5 sm:h-9 overflow-hidden relative">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeProduct.id + activeProduct.price}
                    initial={{ y: 15, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -15, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 0.61, 0.36, 1] }}
                    className="text-xs sm:text-2xl font-mono text-[#CEFF00] font-black tracking-tight"
                  >
                    {formatPrice(activeProduct.price)}
                  </motion.div>
                </AnimatePresence>
              </div>

              {activeProduct.originalPrice && (
                <span className="text-[10px] sm:text-sm font-mono text-[#666] line-through">
                  {formatPrice(activeProduct.originalPrice)}
                </span>
              )}
            </div>

            <p className="hidden sm:block max-w-sm text-xs sm:text-sm text-[#aaaaaa] font-normal leading-relaxed drop-shadow-md line-clamp-2">
              {language === 'ar' ? activeProduct.descriptionAr : activeProduct.description}
            </p>

            {/* Hero CTAs: Desktop only in this column; on mobile action buttons live in the Cart Pill at the bottom */}
            <div className="hidden sm:flex items-center gap-2 sm:gap-3 pt-0.5 sm:pt-1 pointer-events-auto">
              <button
                onClick={() => setSelectedProduct(activeProduct)}
                className="group px-3.5 py-2 sm:px-5 sm:py-3 bg-[#CEFF00] hover:bg-[#b8e600] text-[#090909] font-mono font-bold text-[10px] sm:text-xs tracking-wider uppercase transition-all shadow-[0_0_20px_rgba(206,255,0,0.25)] flex items-center gap-1.5 sm:gap-2 active:scale-95"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'معاينة وفحص' : 'INSPECT'}</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => scrollTo('fitting-lab')}
                className="px-3.5 py-2 sm:px-5 sm:py-3 bg-[#141414]/90 hover:bg-[#202020] border border-[#2d2d2d] hover:border-[#CEFF00] text-[#F1F0EB] font-mono font-medium text-[10px] sm:text-xs tracking-wider uppercase backdrop-blur-md transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#CEFF00]" />
                <span>3D LAB</span>
              </button>
            </div>
          </div>

          {/* Center 4 Columns: Clear Stage Spacer for Center 3D Hoodie */}
          <div className="hidden lg:block lg:col-span-4 pointer-events-none" />

          {/* Right Column: Vexel Floating Packshot Rail Queue & HUD Switchers */}
          <div className="lg:col-span-4 flex flex-col items-end space-y-4 pointer-events-auto">
            {/* Vexel Floating Packshot Rail */}
            <div className="hidden sm:flex flex-col items-end gap-3">
              <div className="text-[10px] font-mono tracking-widest text-[#777] uppercase flex items-center gap-2 mb-1">
                <span>NEXT IN QUEUE</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#CEFF00] animate-pulse" />
              </div>

              {/* Packshot Slot 0 */}
              <button
                type="button"
                id="packshot-slot-0"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  step(1, rect, queueSlot0);
                }}
                className="group relative w-36 h-48 border border-[#282828] bg-[#111111]/85 backdrop-blur-md overflow-hidden hover:border-[#CEFF00] transition-all hover:scale-105 shadow-xl text-left"
              >
                <img
                  src={queueSlot0.images[0]}
                  alt={queueSlot0.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex flex-col justify-end p-2.5">
                  <span className="text-[9px] font-mono text-[#CEFF00] font-bold uppercase truncate">
                    {language === 'ar' ? queueSlot0.nameAr.split(' ')[1] || queueSlot0.nameAr : queueSlot0.name.split(' ')[0]}
                  </span>
                  <span className="text-[10px] font-mono text-[#ddd]">
                    {formatPrice(queueSlot0.price)}
                  </span>
                </div>
              </button>

              {/* Packshot Slot 1 */}
              <button
                type="button"
                id="packshot-slot-1"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  step(2, rect, queueSlot1);
                }}
                className="group relative w-28 h-36 border border-[#202020] bg-[#111111]/70 backdrop-blur-md overflow-hidden hover:border-[#CEFF00] transition-all hover:scale-105 opacity-70 hover:opacity-100 shadow-lg text-left"
              >
                <img
                  src={queueSlot1.images[0]}
                  alt={queueSlot1.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex flex-col justify-end p-2">
                  <span className="text-[8px] font-mono text-[#aaa] font-bold uppercase truncate">
                    {language === 'ar' ? queueSlot1.nameAr.split(' ')[1] || queueSlot1.nameAr : queueSlot1.name.split(' ')[0]}
                  </span>
                </div>
              </button>
            </div>

            {/* 3D Floating Control Dock for Front/Back Flip & Palette (Desktop) */}
            <div className="hidden lg:block bg-[#121212]/90 backdrop-blur-xl border border-[#242424] p-3 rounded-none space-y-2.5 w-full max-w-[260px] shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#202020] pb-1.5">
                <span className="text-[10px] font-mono tracking-widest text-[#888] uppercase">
                  COLORWAY & VIEW
                </span>
                <div className="flex items-center gap-1.5">
                  {/* 180° Front / Back Toggle */}
                  <button
                    onClick={() => setIsBackView(!isBackView)}
                    title="Toggle Front / Back Artwork (180°)"
                    className={`p-1.5 border text-xs transition-colors ${isBackView
                        ? 'border-[#CEFF00] text-black bg-[#CEFF00] font-bold'
                        : 'border-[#333] text-[#777] hover:text-white'
                      }`}
                  >
                    <Compass className="w-3.5 h-3.5" />
                  </button>

                  {/* Wireframe toggle */}
                  <button
                    onClick={() => setIsWireframe(!isWireframe)}
                    title="Toggle 3D Wireframe Mesh"
                    className={`p-1.5 border text-xs transition-colors ${isWireframe
                        ? 'border-[#CEFF00] text-[#CEFF00] bg-[#CEFF00]/10'
                        : 'border-[#333] text-[#777] hover:text-white'
                      }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                  </button>

                  {/* 360 Turntable Auto Rotate */}
                  <button
                    onClick={() => setAutoRotate(!autoRotate)}
                    title="Toggle 360° Turntable Rotation"
                    className={`p-1.5 border text-xs transition-colors ${autoRotate
                        ? 'border-[#CEFF00] text-[#CEFF00] bg-[#CEFF00]/10'
                        : 'border-[#333] text-[#777] hover:text-white'
                      }`}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Active Product Colors Swatches */}
              <div className="flex flex-wrap items-center gap-1.5">
                {activeProduct.colors.map((c) => (
                  <button
                    key={c.hex}
                    onClick={() => setActiveColor(c)}
                    title={language === 'ar' ? (c.nameAr || c.name) : c.name}
                    className={`w-7 h-7 border transition-all flex items-center justify-center relative ${activeColor.hex.toLowerCase() === c.hex.toLowerCase()
                        ? 'border-[#CEFF00] scale-110 shadow-[0_0_8px_rgba(206,255,0,0.4)]'
                        : 'border-[#333] opacity-60 hover:opacity-100'
                      }`}
                    style={{ backgroundColor: c.hex }}
                  >
                    {activeColor.hex.toLowerCase() === c.hex.toLowerCase() && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#CEFF00]" />
                    )}
                  </button>
                ))}
              </div>

              {/* Lighting Mood Toggle */}
              <div className="pt-1.5 border-t border-[#202020] flex items-center justify-between">
                <span className="text-[9px] font-mono text-[#777] uppercase">LIGHT:</span>
                <div className="flex items-center gap-1">
                  {(['cairo', 'studio', 'cyber'] as LightingMood[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => setLightingMood(m)}
                      className={`px-2 py-0.5 text-[9px] font-mono uppercase border transition-colors ${lightingMood === m
                          ? 'border-[#CEFF00] text-[#CEFF00] bg-[#CEFF00]/10 font-bold'
                          : 'border-[#262626] text-[#666] hover:text-white'
                        }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Vexel Dash Pagination & Navigation Controls */}
            <div className="hidden lg:flex items-center gap-2 pt-1">
              <div className="flex items-center gap-1.5">
                {currentProducts.map((p, i) => (
                  <button
                    key={p.id}
                    onClick={() => setActiveIndex(i)}
                    title={p.name}
                    className={`h-1.5 rounded-full transition-all duration-300 ${i === activeIndex
                        ? 'w-6 bg-[#CEFF00]'
                        : 'w-2 bg-[#333] hover:bg-[#666]'
                      }`}
                  />
                ))}
              </div>
            </div>

            {/* Interaction Hint */}
            <div className="text-[10px] font-mono text-[#777] tracking-wider uppercase bg-[#0e0e0e]/80 px-2.5 py-1 border border-[#222] hidden sm:flex items-center gap-1.5">
              <span>DRAG 360° • SCROLL / SWIPE TO EXPLORE</span>
              <ArrowRight className="w-3 h-3 text-[#CEFF00]" />
            </div>
          </div>
        </div>
      </div>

      {/* Floating Edge Navigation Chevrons (RTL-aware natural reading order) */}
      <button
        onClick={() => step(language === 'ar' ? 1 : -1)}
        aria-label={language === 'ar' ? 'القطعة التالية' : 'Previous garment'}
        title={language === 'ar' ? 'القطعة التالية' : 'Previous garment'}
        className="absolute left-1.5 sm:left-6 top-1/2 -translate-y-1/2 z-30 w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-[#121212]/85 hover:bg-[#1f1f1f] border border-[#2e2e2e] hover:border-[#CEFF00] text-white hover:text-[#CEFF00] backdrop-blur-xl flex items-center justify-center transition-all shadow-[0_8px_30px_rgba(0,0,0,0.8)] active:scale-90 group pointer-events-auto"
      >
        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-0.5 transition-transform" />
      </button>

      <button
        onClick={() => step(language === 'ar' ? -1 : 1)}
        aria-label={language === 'ar' ? 'القطعة السابقة' : 'Next garment'}
        title={language === 'ar' ? 'القطعة السابقة' : 'Next garment'}
        className="absolute right-1.5 sm:right-6 top-1/2 -translate-y-1/2 z-30 w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-[#121212]/85 hover:bg-[#1f1f1f] border border-[#2e2e2e] hover:border-[#CEFF00] text-white hover:text-[#CEFF00] backdrop-blur-xl flex items-center justify-center transition-all shadow-[0_8px_30px_rgba(0,0,0,0.8)] active:scale-90 group pointer-events-auto"
      >
        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-0.5 transition-transform" />
      </button>

      {/* Floating Scroll Down Guide Pill (Quick 1-tap thumb navigation to explore below - Desktop Only) */}
      <button
        onClick={() => scrollTo('collections')}
        title={language === 'ar' ? 'انزل لتصفح التشكيلات' : 'Scroll down to collections'}
        className="hidden sm:flex absolute bottom-[130px] left-1/2 -translate-x-1/2 z-20 items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1 sm:py-1.5 bg-[#121212]/90 hover:bg-[#1f1f1f] border border-[#2a2a2a] hover:border-[#CEFF00] text-[9px] sm:text-xs font-mono text-[#aaa] hover:text-[#CEFF00] rounded-full shadow-[0_8px_25px_rgba(0,0,0,0.85)] backdrop-blur-md transition-all active:scale-95 group pointer-events-auto"
      >
        <ArrowDown className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-[#CEFF00] animate-bounce" />
        <span className="font-semibold tracking-wider uppercase">
          {language === 'ar' ? 'انزل لتصفح التشكيلات' : 'SCROLL DOWN TO EXPLORE'}
        </span>
      </button>

      {/* Floating Unified Colorway & Garment Size Dock for Active Piece */}
      <div className="absolute bottom-[62px] sm:bottom-[88px] left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 sm:gap-2 bg-[#121212]/95 backdrop-blur-2xl border border-[#2a2a2a] px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full shadow-[0_12px_35px_rgba(0,0,0,0.9)] pointer-events-auto max-w-[96vw] overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1 shrink-0 text-[#888]">
          <Palette className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-[#CEFF00]" />
          <span className="text-[9px] sm:text-xs font-mono font-bold text-white uppercase tracking-wider max-w-[70px] sm:max-w-none truncate">
            {language === 'ar' ? (activeColor.nameAr || activeColor.name) : activeColor.name}
          </span>
        </div>

        <span className="w-px h-3 bg-[#2c2c2c] shrink-0" />

        {/* Active Product Colors Swatches */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {activeProduct.colors.map((c) => {
            const isSelected = activeColor.hex.toLowerCase() === c.hex.toLowerCase();
            return (
              <button
                key={c.hex}
                onClick={() => {
                  setActiveColor(c);
                  setUserHold(8000);
                }}
                title={language === 'ar' ? (c.nameAr || c.name) : c.name}
                aria-label={c.name}
                className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 transition-all flex items-center justify-center relative ${
                  isSelected
                    ? 'border-[#CEFF00] scale-110 shadow-[0_0_8px_rgba(206,255,0,0.5)] z-10 ring-1 ring-[#CEFF00]/40'
                    : 'border-[#333] opacity-65 hover:opacity-100 hover:border-[#666]'
                }`}
                style={{ backgroundColor: c.hex }}
              >
                {isSelected && (
                  <span className="w-1 h-1 rounded-full bg-[#CEFF00] shadow-[0_0_4px_#CEFF00]" />
                )}
              </button>
            );
          })}
        </div>

        <span className="w-px h-3 bg-[#2c2c2c] shrink-0" />

        {/* Interactive Clothing Size Selector Chips (S, M, L, XL, XXL) */}
        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
          {(activeProduct.sizes && activeProduct.sizes.length > 0 ? activeProduct.sizes : ['S', 'M', 'L', 'XL', 'XXL']).map((sz) => {
            const isSzActive = selectedSize === sz;
            return (
              <button
                key={sz}
                onClick={() => setSelectedSize(sz)}
                title={language === 'ar' ? `مقاس ${sz}` : `Size ${sz}`}
                className={`px-1.5 py-0.5 text-[8px] sm:text-[10px] font-mono font-bold rounded-full transition-all ${
                  isSzActive
                    ? 'bg-[#CEFF00] text-black shadow-[0_0_6px_rgba(206,255,0,0.5)]'
                    : 'text-[#888] hover:text-white bg-[#1a1a1a]/80'
                }`}
              >
                {sz}
              </button>
            );
          })}
        </div>
      </div>

      {/* Vexel Floating Bottom Cart Pill (`cart-pill`) */}
      <aside className="absolute bottom-2.5 sm:bottom-6 left-1/2 -translate-x-1/2 z-30 w-[96%] sm:w-auto max-w-[560px] bg-[#121212]/95 backdrop-blur-2xl border border-[#2e2e2e] p-1.5 sm:px-4 sm:py-2.5 rounded-full flex items-center justify-between shadow-[0_16px_45px_rgba(0,0,0,0.85)] pointer-events-auto">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full overflow-hidden border border-[#383838] shrink-0 bg-black">
            <img
              src={activeProduct.images[0]}
              alt={activeProduct.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0 pr-1 sm:pr-2">
            <div className="text-[10px] sm:text-xs font-mono font-bold text-white uppercase tracking-wider truncate max-w-[130px] sm:max-w-[260px]">
              {language === 'ar' ? activeProduct.nameAr : activeProduct.name}
            </div>
            <div className="text-[8px] sm:text-[10px] font-mono text-[#888] flex items-center gap-1 sm:gap-2">
              <span
                className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full inline-block shrink-0"
                style={{ backgroundColor: activeColor.hex }}
              />
              <span className="truncate max-w-[50px] sm:max-w-none">
                {language === 'ar' ? (activeColor.nameAr || activeColor.name) : activeColor.name}
              </span>
              <span>•</span>
              <span className="text-[#CEFF00] font-bold">
                {selectedSize}
              </span>
              <span>•</span>
              <span className="text-[#CEFF00] font-bold">
                {formatPrice(activeProduct.price)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Quick Flip View Button on Pill */}
          <button
            onClick={() => setIsBackView(!isBackView)}
            title="Toggle Front / Back"
            className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-2 bg-[#1c1c1c] hover:bg-[#282828] border border-[#333] hover:border-[#CEFF00] text-[9px] sm:text-[10px] font-mono text-[#ccc] rounded-full transition-all"
          >
            <Compass className="w-3 h-3 text-[#CEFF00]" />
            <span>{isBackView ? 'FRONT' : '180°'}</span>
          </button>

          {/* Continuous Turntable 360° Live Rotation Indicator */}
          <div
            title="360° Turntable Live Rotation"
            className="flex items-center gap-1 px-1.5 sm:px-2.5 py-1 sm:py-1.5 text-[8px] sm:text-[10px] font-mono text-[#CEFF00] bg-[#141414] border border-[#2a2a2a] rounded-full"
          >
            <RotateCcw className="w-3 h-3 text-[#CEFF00] animate-spin" style={{ animationDuration: '6s' }} />
            <span>360°</span>
          </div>

          {/* Add to Cart button */}
          <button
            onClick={handleAddToCart}
            className="px-2.5 sm:px-4 py-1.5 sm:py-2 bg-[#CEFF00] hover:bg-[#b8e600] text-[#090909] font-mono font-bold text-[10px] sm:text-xs tracking-wider uppercase rounded-full flex items-center gap-1 sm:gap-2 transition-transform active:scale-95 shadow-[0_0_15px_rgba(206,255,0,0.3)]"
          >
            {isAdded ? (
              <>
                <Check className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                <span className="hidden xs:inline">{language === 'ar' ? 'تمت الإضافة' : 'ADDED'}</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                <span>{language === 'ar' ? 'شراء' : 'BUY'}</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Bottom Sub-Anchor Strip (Desktop only - mobile uses clean floating Cart Pill) */}
      <div className="hidden sm:block relative z-10 border-t border-[#1a1a1a] bg-[#090909]/80 backdrop-blur-md py-2.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-[10px] font-mono tracking-widest text-[#666] uppercase">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#CEFF00] rounded-full animate-ping" />
            <span className="text-[#aaa]">
              {language === 'ar' ? 'توأم رقمي ثلاثي الأبعاد • محاكاة PBR فائقة الدقة' : '3D DIGITAL TWIN • REALTIME PBR SHADERS'}
            </span>
          </div>

          <button
            onClick={() => scrollTo('collections')}
            className="flex items-center gap-1.5 text-[#aaa] hover:text-[#CEFF00] transition-colors"
          >
            <span>{language === 'ar' ? 'استكشف التشكيلات' : 'DISCOVER COLLECTIONS'}</span>
            <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
          </button>
        </div>
      </div>
    </section>
  );
};
