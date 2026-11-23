/**
 * High-Performance Client-Side AI Pose & Upper-Torso Tracker
 * - Utilizes native Hardware-Accelerated FaceDetector API where available.
 * - Graceful fallback to high-speed optical skin/motion centroid analysis.
 * - Zero external heavy dependencies, zero network latency, 60fps tracking.
 */

export interface TrackedPose {
  x: number; // 3D world space X offset
  y: number; // 3D world space Y offset
  scale: number; // 3D world space Scale
  confidence: number;
  isDetected: boolean;
}

export class AIPoseTracker {
  private faceDetector: any = null;
  private offscreenCanvas: HTMLCanvasElement | null = null;
  private offscreenCtx: CanvasRenderingContext2D | null = null;
  private isSupported = false;

  constructor() {
    if (typeof window !== 'undefined' && 'FaceDetector' in window) {
      try {
        this.faceDetector = new (window as any).FaceDetector({
          fastMode: true,
          maxDetectedFaces: 1,
        });
        this.isSupported = true;
      } catch {
        this.faceDetector = null;
      }
    }

    if (typeof document !== 'undefined') {
      this.offscreenCanvas = document.createElement('canvas');
      this.offscreenCanvas.width = 64;
      this.offscreenCanvas.height = 48;
      this.offscreenCtx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true });
    }
  }

  public async track(
    video: HTMLVideoElement,
    isSelfie = true
  ): Promise<TrackedPose> {
    if (!video || video.readyState < 2 || video.videoWidth === 0) {
      return { x: 0, y: -0.1, scale: 1.0, confidence: 0, isDetected: false };
    }

    // 1. Try Native Hardware-Accelerated Face/Torso Detection
    if (this.faceDetector) {
      try {
        const faces = await this.faceDetector.detect(video);
        if (faces && faces.length > 0) {
          const face = faces[0].boundingBox;
          const vWidth = video.videoWidth;
          const vHeight = video.videoHeight;

          // Normalized face center & shoulder positioning
          const normCenterX = (face.x + face.width / 2) / vWidth;
          const normCollarY = (face.y + face.height * 1.35) / vHeight;

          // Map to 3D Stage Units (fov 42 at z: 3.4)
          // In selfie mode, video is visually mirrored, so we match the natural mirror orientation
          const xOffset = isSelfie ? -(normCenterX - 0.5) * 2.2 : (normCenterX - 0.5) * 2.2;
          const yOffset = -(normCollarY - 0.5) * 2.4;

          // Proportional garment scale relative to distance (face width ratio)
          const targetScale = Math.min(1.6, Math.max(0.65, (face.width / vWidth) * 4.2));

          return {
            x: xOffset,
            y: yOffset,
            scale: targetScale,
            confidence: 0.95,
            isDetected: true,
          };
        }
      } catch {
        // Fallback to optical tracker if FaceDetector fails
      }
    }

    // 2. Optical Centroid & Upper-Torso Tracker (Universal fallback for all browsers)
    if (this.offscreenCtx && this.offscreenCanvas) {
      try {
        const cw = 64;
        const ch = 48;
        this.offscreenCtx.drawImage(video, 0, 0, cw, ch);
        const imgData = this.offscreenCtx.getImageData(0, 0, cw, ch);
        const data = imgData.data;

        let totalWeight = 0;
        let weightedX = 0;
        let weightedY = 0;

        // Focus on upper 70% of frame (head, neck, shoulders)
        const maxRow = Math.floor(ch * 0.75);

        for (let y = 6; y < maxRow; y++) {
          for (let x = 8; x < cw - 8; x++) {
            const idx = (y * cw + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];

            // Human skin / brightness tone filter heuristic
            const isSkinTone = r > 60 && g > 40 && b > 20 && r > b && (r - g) > 8;
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;

            if (isSkinTone || lum > 90) {
              const weight = 1 + (isSkinTone ? 2 : 0);
              weightedX += x * weight;
              weightedY += y * weight;
              totalWeight += weight;
            }
          }
        }

        if (totalWeight > 80) {
          const avgX = weightedX / totalWeight / cw;
          const avgY = (weightedY / totalWeight / ch) + 0.18; // Neck & chest offset below centroid

          const xOffset = isSelfie ? -(avgX - 0.5) * 1.8 : (avgX - 0.5) * 1.8;
          const yOffset = -(avgY - 0.5) * 2.0;

          return {
            x: xOffset,
            y: yOffset,
            scale: 1.05,
            confidence: 0.78,
            isDetected: true,
          };
        }
      } catch {
        // ignore
      }
    }

    return { x: 0, y: -0.1, scale: 1.0, confidence: 0, isDetected: false };
  }
}
