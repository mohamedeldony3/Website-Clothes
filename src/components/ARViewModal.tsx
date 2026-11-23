import React, { useRef, useState, useEffect, Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { RealHoodieModel } from './3d/RealHoodieModel';
import { HoodieFit, HoodieFinish } from './3d/HoodieSculpt';
import { useCart } from '../context/CartContext';
import { getOptimizedDpr, getPoseInferenceIntervalMs, isLowEndHardware, isAndroidDevice } from '../utils/performance';
import { AIPoseTracker } from '../utils/aiPoseTracker';
import {
  X,
  Camera,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  AlertCircle,
  Sparkles,
  Download,
  RotateCw,
  Smartphone,
  Eye,
  Check,
  Move,
  Layers,
  User,
  SlidersHorizontal,
  Maximize2,
  SwitchCamera,
  Crosshair
} from 'lucide-react';

interface ARViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentColor: string;
  fit: HoodieFit;
  finish: HoodieFinish;
  graphicUrl?: string;
  frontGraphicUrl?: string;
  backGraphicUrl?: string;
  productName?: string;
  colorName?: string;
}

export const ARViewModal: React.FC<ARViewModalProps> = ({
  isOpen,
  onClose,
  currentColor,
  fit,
  finish,
  graphicUrl,
  frontGraphicUrl,
  backGraphicUrl,
  productName,
  colorName,
}) => {
  const { t, language } = useCart();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Camera Stream State
  const [hasCamera, setHasCamera] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  // Interactive AR Manipulations
  const [arScale, setArScale] = useState(1.0);
  const [modelYOffset, setModelYOffset] = useState(-0.1);
  const [isBackView, setIsBackView] = useState(false);
  const [showSilhouette, setShowSilhouette] = useState(true);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // AI Upper-Torso & Dual-Joint Arm Articulation Tracking State
  const [isAiTracking, setIsAiTracking] = useState(true);
  const [aiLocked, setAiLocked] = useState(false);
  const [aiOffset, setAiOffset] = useState({
    x: 0,
    y: 0,
    z: 0,
    scale: 1.0,
    rotationY: 0,
    rotationZ: 0,
    leftArmAngle: 0,
    rightArmAngle: 0,
    leftForearmAngle: 0,
    rightForearmAngle: 0,
    isLeftHandInPouch: false,
    isRightHandInPouch: false,
  });
  const trackerRef = useRef<AIPoseTracker | null>(null);

  // Detect iOS and Android for Native AR Launchers
  const isAndroid = useMemo(() => {
    return isAndroidDevice();
  }, []);

  const isIOS = useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    return /iPhone|iPad|iPod/i.test(navigator.userAgent);
  }, []);

  const sceneViewerUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const glbUrl = `${window.location.origin}/models/pullover_hoodie.glb`;
    const title = encodeURIComponent(productName || 'MONO STUDIO HOODIE');
    return `intent://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(
      glbUrl
    )}&mode=ar_only&resizable=true&title=${title}#Intent;scheme=https;package=com.google.ar.core;action=android.intent.action.VIEW;S.browser_fallback_url=${encodeURIComponent(
      window.location.href
    )};end;`;
  }, [productName]);

  // Real-time AI Pose Tracking Frame Loop (Adaptive Throttling for Android & Low-End Devices)
  useEffect(() => {
    if (!isOpen || !hasCamera || !isAiTracking) {
      setAiLocked(false);
      return;
    }

    if (!trackerRef.current) {
      trackerRef.current = new AIPoseTracker();
    }

    let animationFrameId: number;
    let isActive = true;
    let lastInferenceTime = 0;
    const inferenceInterval = getPoseInferenceIntervalMs();

    const runPoseTracking = async () => {
      if (!isActive || !videoRef.current || videoRef.current.readyState < 2) {
        if (isActive) {
          animationFrameId = requestAnimationFrame(runPoseTracking);
        }
        return;
      }

      const now = performance.now();
      if (now - lastInferenceTime >= inferenceInterval) {
        lastInferenceTime = now;
        try {
          const pose = await trackerRef.current!.track(videoRef.current, facingMode === 'user');
          if (pose && pose.isDetected && pose.confidence > 0.28) {
            setAiLocked(true);
            setAiOffset((prev) => ({
              x: THREE.MathUtils.lerp(prev.x, pose.x, 0.22),
              y: THREE.MathUtils.lerp(prev.y, pose.y, 0.22),
              z: THREE.MathUtils.lerp(prev.z, pose.z, 0.16),
              scale: THREE.MathUtils.lerp(prev.scale, pose.scale, 0.16),
              rotationY: THREE.MathUtils.lerp(prev.rotationY, pose.rotationY, 0.18),
              rotationZ: THREE.MathUtils.lerp(prev.rotationZ, pose.rotationZ, 0.20),
              leftArmAngle: THREE.MathUtils.lerp(prev.leftArmAngle, pose.leftArmAngle || 0, 0.24),
              rightArmAngle: THREE.MathUtils.lerp(prev.rightArmAngle, pose.rightArmAngle || 0, 0.24),
              leftForearmAngle: THREE.MathUtils.lerp(prev.leftForearmAngle, pose.leftForearmAngle || 0, 0.24),
              rightForearmAngle: THREE.MathUtils.lerp(prev.rightForearmAngle, pose.rightForearmAngle || 0, 0.24),
              isLeftHandInPouch: pose.isLeftHandInPouch,
              isRightHandInPouch: pose.isRightHandInPouch,
            }));
          } else {
            setAiLocked(false);
          }
        } catch {
          setAiLocked(false);
        }
      }

      if (isActive) {
        animationFrameId = requestAnimationFrame(runPoseTracking);
      }
    };

    animationFrameId = requestAnimationFrame(runPoseTracking);

    return () => {
      isActive = false;
      cancelAnimationFrame(animationFrameId);
    };
  }, [isOpen, hasCamera, isAiTracking, facingMode]);

  // Clean stop for video streams
  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setHasCamera(false);
  };

  // Robust Camera Stream Acquisition with automatic fallback constraints
  const startCamera = async (mode: 'environment' | 'user') => {
    stopCameraStream();
    setCameraLoading(true);
    setCameraError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        language === 'ar'
          ? 'المتصفح لا يدعم الوصول المباشر لكاميرا الواقع المعزز. يتم تشغيل وضع الاستوديو التفاعلي.'
          : 'Live camera stream not supported on this browser. Running Studio Simulation mode.'
      );
      setCameraLoading(false);
      return;
    }

    try {
      // 1. Try preferred facingMode with adaptive resolution for mobile & low-tier devices
      const isLow = isLowEndHardware();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: isLow ? 640 : 1280 },
          height: { ideal: isLow ? 480 : 720 },
          frameRate: { ideal: isLow ? 24 : 30, max: 30 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch {
          // Playback promise catch for iOS Safari
        }
        setHasCamera(true);
      }
    } catch (err) {
      console.warn('Initial camera constraint failed, attempting basic fallback:', err);
      try {
        // 2. Fallback to any available video stream
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });

        streamRef.current = fallbackStream;
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
          try {
            await videoRef.current.play();
          } catch {}
          setHasCamera(true);
        }
      } catch (fallbackErr) {
        console.error('All camera attempts failed:', fallbackErr);
        setCameraError(
          language === 'ar'
            ? 'تعذر تشغيل الكاميرا. يرجى التأكد من منح الإذن للمتصفح. تم تفعيل وضع الاستوديو الافتراضي.'
            : 'Camera permission denied or camera in use. Running Studio Simulation mode.'
        );
        setHasCamera(false);
      }
    } finally {
      setCameraLoading(false);
    }
  };

  // Handle open / close lifecycle
  useEffect(() => {
    if (isOpen) {
      startCamera(facingMode);
    } else {
      stopCameraStream();
      setCapturedPhoto(null);
      setCameraError(null);
    }
    return () => {
      stopCameraStream();
    };
  }, [isOpen, facingMode]);

  if (!isOpen) return null;

  // Toggle Camera (Selfie vs Room View)
  const toggleCameraMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
  };

  // Capture High-Res AR Composite Photo
  const handleCaptureAR = () => {
    const container = containerRef.current;
    if (!container || isCapturing) return;

    const threeCanvas = container.querySelector('canvas');
    if (!threeCanvas) return;

    setIsCapturing(true);

    try {
      const compositeCanvas = document.createElement('canvas');
      compositeCanvas.width = 1080;
      compositeCanvas.height = 1440;
      const ctx = compositeCanvas.getContext('2d');
      if (!ctx) return;

      // 1. Draw camera background or studio backdrop
      if (hasCamera && videoRef.current && videoRef.current.videoWidth > 0) {
        ctx.save();
        if (facingMode === 'user') {
          // Mirror front camera
          ctx.translate(1080, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(videoRef.current, 0, 0, 1080, 1440);
        ctx.restore();
      } else {
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, 1080, 1440);
        ctx.strokeStyle = '#181818';
        ctx.lineWidth = 1;
        for (let x = 0; x < 1080; x += 60) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, 1440);
          ctx.stroke();
        }
      }

      // 2. Overlay 3D Canvas
      ctx.drawImage(threeCanvas, 0, 0, 1080, 1440);

      // 3. Editorial Brutalist Overlay Tag
      ctx.fillStyle = 'rgba(9, 9, 9, 0.9)';
      ctx.fillRect(40, 1310, 1000, 90);
      ctx.strokeStyle = '#CEFF00';
      ctx.lineWidth = 2;
      ctx.strokeRect(40, 1310, 1000, 90);

      ctx.fillStyle = '#CEFF00';
      ctx.font = 'bold 22px monospace';
      ctx.fillText('MONO / STUDIO • AR DIGITAL TWIN', 65, 1352);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 16px monospace';
      const nameText = productName ? productName.toUpperCase() : 'HEAVYWEIGHT HOODIE';
      ctx.fillText(nameText, 65, 1380);

      ctx.fillStyle = '#888888';
      ctx.font = '14px monospace';
      ctx.fillText(
        `FIT: ${fit.toUpperCase()} // ${finish.toUpperCase()} // CAIRO 2026`,
        680,
        1366
      );

      const dataUrl = compositeCanvas.toDataURL('image/png', 0.95);
      setCapturedPhoto(dataUrl);
    } catch (err) {
      console.error('AR snapshot failed:', err);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleDownloadPhoto = () => {
    if (!capturedPhoto) return;
    const link = document.createElement('a');
    link.download = `MONO-STUDIO-AR-LOOK-${Date.now()}.png`;
    link.href = capturedPhoto;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-between p-2 sm:p-5 animate-in fade-in duration-200">
      {/* Top Header Command Bar */}
      <div className="w-full max-w-4xl flex items-center justify-between border-b border-[#222] pb-3 z-20">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 bg-[#CEFF00] rounded-none animate-pulse" />
          <h3 className="text-xs sm:text-sm font-mono font-bold uppercase tracking-widest text-white flex items-center gap-2">
            <span>{language === 'ar' ? 'معاينة الواقع المعزز (AR ATELIER)' : 'AUGMENTED REALITY FITTING'}</span>
          </h3>
          <span className="hidden md:inline-block text-[10px] font-mono text-[#777] border-l border-[#333] pl-2 uppercase">
            {hasCamera
              ? facingMode === 'user'
                ? (language === 'ar' ? 'المرآة الافتراضية (سيلفي)' : 'VIRTUAL MIRROR MODE')
                : (language === 'ar' ? 'محيط الغرفة (كاميرا خلفية)' : 'ROOM PERSPECTIVE')
              : (language === 'ar' ? 'محاكاة 3D تفاعلية' : 'STUDIO 3D SIMULATION')}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Native iOS Apple AR Quick Look Button (USDZ) */}
          {isIOS && (
            <a
              href="/models/pullover_hoodie.usdz"
              rel="ar"
              title="Launch Apple AR Quick Look"
              className="px-2.5 py-1 bg-[#CEFF00] text-black text-[10px] font-mono font-bold tracking-wider flex items-center gap-1.5 uppercase hover:bg-[#b8e600] transition-colors shadow-sm"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'Apple AR مباشر' : 'APPLE AR'}</span>
            </a>
          )}

          {/* Native Android Scene Viewer Button (GLB) - Fully visible on Mobile & Tablets */}
          {isAndroid && (
            <a
              href={sceneViewerUrl}
              target="_blank"
              rel="noreferrer"
              title="Launch Google Scene Viewer (ARCore Native)"
              className="flex px-2 py-1 sm:px-2.5 sm:py-1 bg-[#CEFF00] text-black text-[10px] font-mono font-bold tracking-wider items-center gap-1.5 uppercase hover:bg-[#b8e600] transition-colors shadow-sm"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'Google AR مباشر' : 'ARCORE'}</span>
            </a>
          )}

          {/* Switch Camera Button (Front / Back) */}
          <button
            onClick={toggleCameraMode}
            title={language === 'ar' ? 'تبديل الكاميرا (أمامية / خلفية)' : 'Switch Camera'}
            className="p-1.5 sm:px-2.5 sm:py-1 bg-[#141414] hover:bg-[#222] border border-[#333] text-xs font-mono text-[#CEFF00] flex items-center gap-1.5 transition-colors"
          >
            <SwitchCamera className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {facingMode === 'environment'
                ? (language === 'ar' ? 'كاميرا السيلفي' : 'SELFIE MIRROR')
                : (language === 'ar' ? 'كاميرا الغرفة' : 'ROOM CAMERA')}
            </span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 text-[#888] hover:text-white border border-transparent hover:border-[#333] transition-colors"
            aria-label="Close AR"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main AR Stage Viewport */}
      <div
        ref={containerRef}
        className="relative w-full max-w-4xl flex-1 my-2 bg-[#0c0c0c] border border-[#262626] overflow-hidden flex items-center justify-center select-none"
      >
        {/* Real-time Video Stream Background */}
        <video
          ref={videoRef}
          playsInline
          autoPlay
          muted
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            hasCamera ? 'opacity-100' : 'opacity-0'
          } ${facingMode === 'user' ? '-scale-x-100' : ''}`}
        />

        {/* Fallback Grid Studio Background when Camera is Disabled / Denied */}
        {!hasCamera && (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1a1a1a] via-[#0a0a0a] to-[#040404]">
            <div className="absolute inset-0 opacity-[0.06] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:3.5rem_3.5rem]" />

            {cameraLoading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-xs font-mono text-[#aaa]">
                <RefreshCw className="w-6 h-6 text-[#CEFF00] animate-spin" />
                <span>{language === 'ar' ? 'جاري الاتصال بالكاميرا...' : 'CONNECTING TO CAMERA SENSOR...'}</span>
              </div>
            ) : cameraError ? (
              <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between gap-3 bg-[#141414]/95 border border-[#333] p-3 text-xs font-mono text-[#aaa]">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-[#CEFF00] shrink-0" />
                  <span>{cameraError}</span>
                </div>
                <button
                  onClick={() => startCamera(facingMode)}
                  className="px-3 py-1 bg-[#222] hover:bg-[#333] text-white text-[11px] uppercase border border-[#444]"
                >
                  {language === 'ar' ? 'إعادة المحاولة' : 'RETRY'}
                </button>
              </div>
            ) : null}
          </div>
        )}

        {/* Human Silhouette Alignment Guide (Optional Overlay for Body Try-On) */}
        {showSilhouette && hasCamera && (
          <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center opacity-40">
            <svg
              className="w-full h-full max-w-md max-h-[80%] stroke-[#CEFF00]"
              viewBox="0 0 200 300"
              fill="none"
              strokeWidth="1.2"
              strokeDasharray="4 4"
            >
              {/* Head & Neck Guide */}
              <circle cx="100" cy="50" r="28" />
              {/* Shoulders & Torso */}
              <path d="M 60 95 C 75 90, 125 90, 140 95 L 165 140 L 145 150 L 135 260 L 65 260 L 55 150 L 35 140 Z" />
            </svg>
          </div>
        )}

        {/* Interactive 3D Canvas Rig */}
        <div className="absolute inset-0 z-15 cursor-grab active:cursor-grabbing">
          <Canvas
            shadows={false}
            dpr={getOptimizedDpr()}
            camera={{ position: [0, 0.1, 3.4], fov: 42 }}
            gl={{
              antialias: true,
              alpha: true,
              preserveDrawingBuffer: true,
              powerPreference: 'high-performance',
              toneMapping: THREE.NeutralToneMapping,
              toneMappingExposure: 1.15,
            }}
          >
            {/* Calibrated Studio 360° Lighting: Zero Color Distortion */}
            <ambientLight intensity={1.6} color="#ffffff" />
            <hemisphereLight color="#ffffff" groundColor="#ffffff" intensity={0.6} />
            <directionalLight position={[0, 3.5, 3.0]} intensity={1.3} color="#ffffff" />
            <directionalLight position={[0, 2.0, 4.0]} intensity={1.1} color="#ffffff" />
            <directionalLight position={[0, 2.0, -4.0]} intensity={1.1} color="#ffffff" />
            <directionalLight position={[-4.0, 2.0, 0]} intensity={1.1} color="#ffffff" />
            <directionalLight position={[4.0, 2.0, 0]} intensity={1.1} color="#ffffff" />
            <directionalLight position={[0, 4.5, 0]} intensity={0.6} color="#ffffff" />

            <Suspense fallback={null}>
              <group
                position={[
                  isAiTracking ? aiOffset.x : 0,
                  (isAiTracking ? aiOffset.y : 0) + modelYOffset,
                  isAiTracking ? aiOffset.z : 0
                ]}
                rotation={[
                  0,
                  isAiTracking ? aiOffset.rotationY : 0,
                  isAiTracking ? aiOffset.rotationZ : 0
                ]}
                scale={[
                  (isAiTracking ? aiOffset.scale : 1.0) * arScale,
                  (isAiTracking ? aiOffset.scale : 1.0) * arScale,
                  (isAiTracking ? aiOffset.scale : 1.0) * arScale
                ]}
              >
                <RealHoodieModel
                  color={currentColor}
                  wireframe={false}
                  interactive={true}
                  graphicUrl={graphicUrl}
                  frontGraphicUrl={frontGraphicUrl}
                  backGraphicUrl={backGraphicUrl || graphicUrl}
                  isBackView={isBackView}
                  leftArmAngle={isAiTracking ? aiOffset.leftArmAngle : 0}
                  rightArmAngle={isAiTracking ? aiOffset.rightArmAngle : 0}
                  leftForearmAngle={isAiTracking ? aiOffset.leftForearmAngle : 0}
                  rightForearmAngle={isAiTracking ? aiOffset.rightForearmAngle : 0}
                  isLeftHandInPouch={isAiTracking && aiOffset.isLeftHandInPouch}
                  isRightHandInPouch={isAiTracking && aiOffset.isRightHandInPouch}
                />
              </group>
            </Suspense>

            <OrbitControls
              enableZoom={true}
              minDistance={1.4}
              maxDistance={5.5}
              enablePan={true}
              rotateSpeed={0.8}
              panSpeed={0.8}
            />
          </Canvas>
        </div>

        {/* HUD Overlay Crosshairs & Telemetry */}
        <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-3.5">
          <div className="flex flex-wrap justify-between items-center gap-1.5 text-[10px] font-mono text-[#CEFF00]">
            <div className="flex items-center gap-1.5">
              <span className="bg-[#111]/85 backdrop-blur-md px-2 py-0.5 border border-[#333]">
                [ AR_MODE: {hasCamera ? (facingMode === 'user' ? 'MIRROR' : 'ROOM') : 'STUDIO'}{isLowEndHardware() ? ' • ECO' : ''} ]
              </span>
              {hasCamera && (
                <span className={`backdrop-blur-md px-2 py-0.5 border font-bold flex items-center gap-1.5 transition-all ${
                  aiLocked
                    ? 'bg-[#14260a]/90 border-[#CEFF00] text-[#CEFF00] shadow-[0_0_10px_rgba(206,255,0,0.3)]'
                    : 'bg-[#111]/85 border-[#333] text-[#888]'
                }`}>
                  <Crosshair className={`w-3 h-3 ${aiLocked ? 'text-[#CEFF00] animate-pulse' : 'text-[#888]'}`} />
                  <span>{aiLocked ? (language === 'ar' ? 'تتبع الجسم: تم التثبيت والمطابقة' : 'AI BODY LOCKED') : (language === 'ar' ? 'جاري التعرف على الجسم...' : 'SCANNING BODY...')}</span>
                </span>
              )}
            </div>
            <span className="bg-[#111]/85 backdrop-blur-md px-2 py-0.5 border border-[#333]">
              {aiLocked
                ? `${(aiOffset.scale * 100).toFixed(0)}% FIT • ${(aiOffset.rotationZ * (180 / Math.PI)).toFixed(0)}° TILT${
                    Math.abs(aiOffset.leftArmAngle) > 0.12 || Math.abs(aiOffset.rightArmAngle) > 0.12 ? ' • ARMS RIGGED' : ''
                  }${
                    aiOffset.isLeftHandInPouch || aiOffset.isRightHandInPouch ? ' • POUCH ENGAGED' : ''
                  }`
                : `1:1 SCALE • ${Math.round(arScale * 100)}%`}
            </span>
          </div>

          {/* Center Target Box */}
          <div className={`w-48 h-48 sm:w-60 sm:h-60 border border-dashed rounded-none mx-auto my-auto relative pointer-events-none transition-all duration-300 ${
            aiLocked ? 'border-[#CEFF00]/60 scale-105' : 'border-[#CEFF00]/25'
          }`}>
            <span className="absolute -top-1.5 -left-1.5 w-3 h-3 border-t-2 border-l-2 border-[#CEFF00]" />
            <span className="absolute -top-1.5 -right-1.5 w-3 h-3 border-t-2 border-r-2 border-[#CEFF00]" />
            <span className="absolute -bottom-1.5 -left-1.5 w-3 h-3 border-b-2 border-l-2 border-[#CEFF00]" />
            <span className="absolute -bottom-1.5 -right-1.5 w-3 h-3 border-b-2 border-r-2 border-[#CEFF00]" />
          </div>

          <div className="text-center text-[9px] sm:text-[10px] font-mono text-[#aaa] bg-black/75 backdrop-blur-md py-1 px-3 max-w-sm mx-auto border border-[#222]">
            {aiLocked
              ? (language === 'ar' ? '✓ تم التعرف على الجسم وضبط مقاس وميلان الهودي تلقائياً' : '✓ Body recognized: Auto-scaled and locked to your shoulders')
              : (language === 'ar' ? 'قف أمام الكاميرا لمطابقة الهودي مع كتفيك وجسمك تلقائياً' : 'Stand in frame to auto-fit hoodie to your shoulders')}
          </div>
        </div>
      </div>

      {/* Bottom AR Control HUD Bar */}
      <div className="w-full max-w-4xl flex flex-wrap items-center justify-between gap-2.5 bg-[#111] border border-[#222] p-2.5 sm:p-3.5 z-20">
        {/* Scale & Position Quick Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Scale Down */}
          <button
            onClick={() => setArScale((prev) => Math.max(0.5, Number((prev - 0.1).toFixed(1))))}
            className="p-2 bg-[#181818] border border-[#333] hover:border-[#666] text-white"
            title="Scale down"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <span className="px-2 text-xs font-mono font-bold text-[#CEFF00] min-w-[50px] text-center">
            {Math.round(arScale * 100)}%
          </span>

          {/* Scale Up */}
          <button
            onClick={() => setArScale((prev) => Math.min(1.8, Number((prev + 0.1).toFixed(1))))}
            className="p-2 bg-[#181818] border border-[#333] hover:border-[#666] text-white"
            title="Scale up"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          {/* Reset Scale & Position */}
          <button
            onClick={() => {
              setArScale(1.0);
              setModelYOffset(-0.1);
            }}
            className="px-2.5 py-1.5 bg-[#181818] border border-[#333] hover:border-[#CEFF00] text-[10px] font-mono text-[#ccc] hover:text-white uppercase transition-colors"
          >
            {language === 'ar' ? 'إعادة ضبط 1:1' : 'RESET 1:1'}
          </button>

          {/* Height Adjust */}
          <button
            onClick={() => setModelYOffset((prev) => prev + 0.1)}
            className="p-1.5 sm:px-2 bg-[#181818] border border-[#333] hover:border-[#666] text-white text-[10px] font-mono"
            title="Move up"
          >
            ▲
          </button>
          <button
            onClick={() => setModelYOffset((prev) => prev - 0.1)}
            className="p-1.5 sm:px-2 bg-[#181818] border border-[#333] hover:border-[#666] text-white text-[10px] font-mono"
            title="Move down"
          >
            ▼
          </button>
        </div>

        {/* Feature Toggles (AI Tracking, 180° Flip & Silhouette Guide) */}
        <div className="flex items-center gap-2">
          {/* AI Torso Auto-Tracking Toggle */}
          {hasCamera && (
            <button
              onClick={() => setIsAiTracking(!isAiTracking)}
              className={`px-3 py-1.5 text-xs font-mono flex items-center gap-1.5 border transition-all ${
                isAiTracking
                  ? 'bg-[#18260e] text-[#CEFF00] border-[#CEFF00]'
                  : 'bg-[#181818] text-[#777] border-[#333]'
              }`}
              title="Toggle AI Torso Fitting"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {isAiTracking
                  ? (language === 'ar' ? 'تتبع الذكاء الاصطناعي: مفعّل' : 'AI AUTO-FIT: ON')
                  : (language === 'ar' ? 'تتبع الذكاء الاصطناعي: معطّل' : 'AI AUTO-FIT: OFF')}
              </span>
            </button>
          )}

          {/* 180° Front / Back Flip */}
          <button
            onClick={() => setIsBackView(!isBackView)}
            className={`px-3 py-1.5 text-xs font-mono flex items-center gap-1.5 border transition-all ${
              isBackView
                ? 'bg-[#CEFF00] text-black border-[#CEFF00] font-bold'
                : 'bg-[#181818] text-[#ccc] border-[#333] hover:border-[#555]'
            }`}
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>{isBackView ? '180° (الظهر)' : '180° (الصدر)'}</span>
          </button>

          {/* Human Silhouette Guide Toggle */}
          <button
            onClick={() => setShowSilhouette(!showSilhouette)}
            className={`px-3 py-1.5 text-xs font-mono flex items-center gap-1.5 border transition-all ${
              showSilhouette
                ? 'bg-[#1e1e1e] text-[#CEFF00] border-[#CEFF00]'
                : 'bg-[#181818] text-[#777] border-[#333]'
            }`}
            title="Toggle Body Fit Silhouette"
          >
            <User className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {showSilhouette ? (language === 'ar' ? 'دليل القياس: مفعّل' : 'BODY GUIDE: ON') : (language === 'ar' ? 'دليل القياس: معطّل' : 'BODY GUIDE: OFF')}
            </span>
          </button>

          {/* Snapshot Capture Button */}
          <button
            onClick={handleCaptureAR}
            disabled={isCapturing}
            className="px-4 py-2 bg-[#CEFF00] hover:bg-[#b8e600] disabled:opacity-50 text-[#090909] text-xs font-mono font-bold tracking-widest uppercase transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(206,255,0,0.3)]"
          >
            <Camera className="w-4 h-4" />
            <span>{isCapturing ? (language === 'ar' ? 'جاري الالتقاط...' : 'CAPTURING...') : (language === 'ar' ? 'التقاط صورة' : 'SNAP AR')}</span>
          </button>
        </div>
      </div>

      {/* Captured Photo Preview Overlay Modal */}
      {capturedPhoto && (
        <div className="fixed inset-0 z-60 bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#111] border border-[#333] p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#222] pb-3">
              <span className="text-xs font-mono text-[#CEFF00] font-bold uppercase">
                {language === 'ar' ? 'تم حفظ لقطة الواقع المعزز بنجاح' : 'AR EDITORIAL SNAPSHOT SAVED'}
              </span>
              <button onClick={() => setCapturedPhoto(null)} className="text-[#888] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative aspect-[3/4] bg-black border border-[#222] overflow-hidden">
              <img src={capturedPhoto} alt="AR Snapshot" className="w-full h-full object-contain" />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleDownloadPhoto}
                className="flex-1 py-3 bg-[#CEFF00] hover:bg-[#b8e600] text-black font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>{language === 'ar' ? 'تحميل الصورة' : 'DOWNLOAD PHOTO'}</span>
              </button>
              <button
                onClick={() => setCapturedPhoto(null)}
                className="px-4 py-3 bg-[#181818] border border-[#333] text-white font-mono text-xs uppercase"
              >
                {language === 'ar' ? 'إغلاق' : 'CLOSE'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
