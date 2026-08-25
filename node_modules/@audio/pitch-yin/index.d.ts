/** YIN pitch detection (de Cheveigné & Kawahara, 2002). */
export interface YinOptions {
  /** sample rate (Hz), default 44100 */
  fs?: number
  /** CMND threshold — lower = stricter, fewer detections, default 0.15 */
  threshold?: number
}

/** Single-frame pitch estimate. Returns null if no periodic structure is found. */
export default function yin(data: Float32Array | Float64Array, options?: YinOptions): { freq: number, clarity: number } | null
