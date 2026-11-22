import React, { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Float } from '@react-three/drei';
import { RealHoodieModel } from './3d/RealHoodieModel';
import { HoodieFit, HoodieFinish } from './3d/HoodieSculpt';
import { useCart } from '../context/CartContext';
import { X, Camera, RefreshCw, ZoomIn, ZoomOut, AlertCircle, Sparkles, Check, Download } from 'lucide-react';

interface ARViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentColor: string;
  fit: HoodieFit;
  finish: HoodieFinish;
  graphicUrl?: string;
}

export const ARViewModal: React.FC<ARViewModalProps> = ({
  isOpen,
  onClose,
  currentColor,
  fit,
  finish,
  graphicUrl,
}) => {
  const { t, language } = useCart();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [hasCamera, setHasCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [arScale, setArScale] = useState(1.0);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      // Stop camera stream when modal closes
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
      setHasCamera(false);
      setCameraError(null);
      setCapturedPhoto(null);
      return;
    }

    // Attempt to access user device camera
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({
          video: {
            facingMode: 'environment', // Prefer back camera for room inspection
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
            setHasCamera(true);
          }
        })
        .catch((err) => {
          console.warn('Camera access denied or unavailable:', err);
          setCameraError(
            language === 'ar'
              ? 'تعذر الوصول إلى الكاميرا. يتم الآن عرض وضع المحاكاة ثلاثية الأبعاد.'
              : 'Camera access denied or unavailable. Running in Studio AR Simulation mode.'
          );
          setHasCamera(false);
        });
    } else {
      setCameraError(
        language === 'ar'
          ? 'المتصفح لا يدعم الكاميرا الحية. يتم استخدام وضع المحاكاة.'
          : 'Live camera stream not supported. Using Studio Simulation mode.'
      );
    }
  }, [isOpen, language]);

  if (!isOpen) return null;

  // Capture composite AR snapshot (camera background + 3D canvas)
  const handleCaptureAR = () => {
    const container = containerRef.current;
    if (!container) return;

    const threeCanvas = container.querySelector('canvas');
    if (!threeCanvas) return;

    // Create an offscreen composite canvas
    const compositeCanvas = document.createElement('canvas');
    compositeCanvas.width = 1080;
    compositeCanvas.height = 1440;
    const ctx = compositeCanvas.getContext('2d');
    if (!ctx) return;

    // 1. Draw video background or simulated dark studio
    if (hasCamera && videoRef.current && videoRef.current.videoWidth > 0) {
      ctx.drawImage(videoRef.current, 0, 0, 1080, 1440);
    } else {
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, 1080, 1440);
      // Grid lines
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 1;
      for (let x = 0; x < 1080; x += 60) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 1440);
        ctx.stroke();
      }
    }

    // 2. Overlay 3D canvas
    ctx.drawImage(threeCanvas, 0, 0, 1080, 1440);

    // 3. Draw luxury Brutalist HUD Watermark
    ctx.fillStyle = 'rgba(10, 10, 10, 0.85)';
    ctx.fillRect(40, 1320, 1000, 80);
    ctx.strokeStyle = '#CEFF00';
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 1320, 1000, 80);

    ctx.fillStyle = '#CEFF00';
    ctx.font = 'bold 22px monospace';
    ctx.fillText('MONO / STUDIO • AR FITTING LAB', 70, 1368);

    ctx.fillStyle = '#888888';
    ctx.font = '16px monospace';
    ctx.fillText(`FIT: ${fit.toUpperCase()} // FINISH: ${finish.toUpperCase()} // CAIRO 2026`, 620, 1368);

    const dataUrl = compositeCanvas.toDataURL('image/png');
    setCapturedPhoto(dataUrl);
  };

  const handleDownloadPhoto = () => {
    if (!capturedPhoto) return;
    const link = document.createElement('a');
    link.download = `MONO-STUDIO-AR-LOOK-${fit}-${Date.now()}.png`;
    link.href = capturedPhoto;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-between p-3 sm:p-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="w-full max-w-4xl flex items-center justify-between border-b border-[#222] pb-3 z-20">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-[#CEFF00] rounded-full animate-ping" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-white">
            {t.fittingLab.arTitle}
          </h3>
          <span className="hidden sm:inline-block text-[10px] font-mono text-[#777] border-l border-[#333] pl-2 uppercase">
            {hasCamera ? t.fittingLab.arCameraNotice : 'STUDIO AR ENVIRONMENT'}
          </span>
        </div>

        <button
          onClick={onClose}
          className="p-2 text-[#888] hover:text-white hover:bg-[#222] transition-colors"
          aria-label="Close AR"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main AR Viewport Stage */}
      <div
        ref={containerRef}
        className="relative w-full max-w-4xl flex-1 my-3 bg-[#0d0d0d] border border-[#262626] rounded-none overflow-hidden flex items-center justify-center"
      >
        {/* Real-time Video Camera Background */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
            hasCamera ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Fallback Simulation Background if no camera */}
        {!hasCamera && (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#181818] via-[#090909] to-[#040404]">
            <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:3rem_3rem]" />
            {cameraError && (
              <div className="absolute top-4 left-4 right-4 z-20 flex items-center gap-2 bg-[#161616]/90 border border-[#333] p-2.5 text-[11px] font-mono text-[#aaa]">
                <AlertCircle className="w-4 h-4 text-[#CEFF00] shrink-0" />
                <span>{cameraError}</span>
              </div>
            )}
          </div>
        )}

        {/* 3D AR Superimposed Transparent Canvas */}
        <div className="absolute inset-0 z-10 cursor-grab active:cursor-grabbing">
          <Canvas
            shadows
            camera={{ position: [0, 0.2, 3.8], fov: 45 }}
            gl={{
              antialias: true,
              alpha: true,
              preserveDrawingBuffer: true,
              powerPreference: 'high-performance',
            }}
          >
            <ambientLight intensity={1.2} />
            <spotLight position={[3, 5, 4]} intensity={3.5} angle={0.65} penumbra={0.8} />
            <directionalLight position={[-4, 2, -3]} intensity={2.0} color="#a0c0ff" />
            <pointLight position={[0, -2, 1]} intensity={1.5} color="#CEFF00" />

            <Suspense fallback={null}>
              <group scale={[arScale, arScale, arScale]}>
                <Float speed={1.2} rotationIntensity={0.12} floatIntensity={0.18}>
                  <RealHoodieModel
                    color={currentColor}
                    wireframe={false}
                    interactive={false}
                    graphicUrl={graphicUrl}
                  />
                </Float>
              </group>
            </Suspense>

            <OrbitControls
              enableZoom={false}
              enablePan={true}
              rotateSpeed={0.8}
            />
          </Canvas>
        </div>

        {/* Floating AR Overlay Crosshairs */}
        <div className="absolute inset-0 pointer-events-none z-15 flex flex-col justify-between p-4">
          <div className="flex justify-between text-[10px] font-mono text-[#CEFF00]/70">
            <span>[ AR_TRACKING_LOCKED ]</span>
            <span>1:1 HUMAN SCALE SIMULATION</span>
          </div>

          {/* Center Target Box */}
          <div className="w-48 h-48 sm:w-64 sm:h-64 border border-dashed border-[#CEFF00]/40 rounded-none mx-auto my-auto relative">
            <span className="absolute -top-1.5 -left-1.5 w-3 h-3 border-t-2 border-l-2 border-[#CEFF00]" />
            <span className="absolute -top-1.5 -right-1.5 w-3 h-3 border-t-2 border-r-2 border-[#CEFF00]" />
            <span className="absolute -bottom-1.5 -left-1.5 w-3 h-3 border-b-2 border-l-2 border-[#CEFF00]" />
            <span className="absolute -bottom-1.5 -right-1.5 w-3 h-3 border-b-2 border-r-2 border-[#CEFF00]" />
          </div>

          <div className="text-center text-[10px] font-mono text-[#888] bg-black/60 py-1 max-w-xs mx-auto border border-[#222]">
            DRAG TO MOVE • USE CONTROLS TO SCALE
          </div>
        </div>
      </div>

      {/* Bottom AR Control HUD Bar */}
      <div className="w-full max-w-4xl flex flex-wrap items-center justify-between gap-3 bg-[#111] border border-[#222] p-3 sm:p-4 z-20">
        {/* Scale Controls */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-[#888] uppercase hidden sm:inline">SCALE:</span>
          <button
            onClick={() => setArScale(Math.max(0.6, arScale - 0.1))}
            className="p-2 bg-[#181818] border border-[#333] hover:border-[#666] text-white"
            title="Scale down"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="px-2 text-xs font-mono font-bold text-[#CEFF00]">
            {Math.round(arScale * 100)}%
          </span>
          <button
            onClick={() => setArScale(Math.min(1.6, arScale + 0.1))}
            className="p-2 bg-[#181818] border border-[#333] hover:border-[#666] text-white"
            title="Scale up"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setArScale(1.0)}
            className="px-2.5 py-1.5 bg-[#181818] border border-[#333] hover:border-[#CEFF00] text-[10px] font-mono text-[#ccc] hover:text-white uppercase"
          >
            {t.fittingLab.arScaleReset}
          </button>
        </div>

        {/* Snapshot Capture Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleCaptureAR}
            className="px-5 py-2.5 bg-[#CEFF00] hover:bg-[#b8e600] text-[#090909] text-xs font-mono font-bold tracking-widest uppercase transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(206,255,0,0.3)]"
          >
            <Camera className="w-4 h-4" />
            <span>{t.fittingLab.arCapture}</span>
          </button>
        </div>
      </div>

      {/* Captured Photo Preview Overlay Modal */}
      {capturedPhoto && (
        <div className="fixed inset-0 z-60 bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#111] border border-[#333] p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#222] pb-3">
              <span className="text-xs font-mono text-[#CEFF00] font-bold uppercase">
                AR EDITORIAL SNAPSHOT SAVED
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
                <span>DOWNLOAD PHOTO</span>
              </button>
              <button
                onClick={() => setCapturedPhoto(null)}
                className="px-4 py-3 bg-[#181818] border border-[#333] text-white font-mono text-xs uppercase"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
