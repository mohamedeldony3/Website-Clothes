/**
 * Device Tier & Performance Profiling
 * Allows dynamic throttling of 3D Canvas DPR, particle counts, and shadow rendering
 * for low-end mobile devices and power-saving laptops.
 */

export function isAndroidDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android/i.test(navigator.userAgent);
}

export function isLowEndHardware(): boolean {
  if (typeof window === 'undefined') return false;

  const isMobileScreen = window.innerWidth < 768;

  // Check hardware concurrency (CPU cores)
  const cpuCores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4;
  const isWeakCPU = cpuCores <= 4;

  // Check device memory (RAM in GB if supported by browser)
  const deviceMem = typeof navigator !== 'undefined' && (navigator as any).deviceMemory ? (navigator as any).deviceMemory : 8;
  const isLowRAM = deviceMem <= 4;

  return isMobileScreen || isWeakCPU || isLowRAM || isAndroidDevice();
}

/**
 * Returns optimal device pixel ratio (DPR) range to prevent GPU overheating
 * on retina and mobile displays.
 */
export function getOptimizedDpr(): [number, number] {
  if (typeof window === 'undefined') return [1, 1];
  const isLow = isLowEndHardware();
  const screenDpr = window.devicePixelRatio || 1;

  if (isLow) {
    // Mobile or low-end: limit to max 1.15 to prevent thermal throttling and memory pressure
    return [1, Math.min(screenDpr, 1.15)];
  }

  // Desktop or high-end: crisp visual fidelity capped at 1.5
  return [1, Math.min(screenDpr, 1.5)];
}

/**
 * Throttles pose tracking inference interval based on device capabilities:
 * Low-end / Android: runs inference every 55ms (~18 FPS)
 * High-end desktop: runs inference every 28ms (~35 FPS)
 * Both render Three.js at 60 FPS with smooth LERP damping.
 */
export function getPoseInferenceIntervalMs(): number {
  return isLowEndHardware() ? 55 : 28;
}
