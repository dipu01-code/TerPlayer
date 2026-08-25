// Generated from the audio.js manifest (params metadata is the source of truth).
// Regenerate: node tools/dts.js in @audio/compile. Do not edit by hand.

/** Automatable number — scalar, `t => value` fn, or breakpoint curve {t, v} */
type Auto = number | ((t: number) => number) | { t: number[], v: number[] }
/** Per-block param values as delivered by hosts (numbers arrive as 1-length Float32Array) */
type Live = Record<string, Float32Array | string | boolean>
type Ctx = { sampleRate: number, maxBlockSize: number, maxChannels: number, currentTime: number, duration?: number, events?: readonly any[], emit?: (name: string, ...args: any[]) => void, [k: string]: unknown }
type Process = (inputs: Float32Array[][], outputs: Float32Array[][], params: Live) => void

/** Chainable-host options for 'geq' */
export interface GeqOptions {
  /** -15..15 dB (default 0) */
  "g31"?: Auto
  /** -15..15 dB (default 0) */
  "g63"?: Auto
  /** -15..15 dB (default 0) */
  "g125"?: Auto
  /** -15..15 dB (default 0) */
  "g250"?: Auto
  /** -15..15 dB (default 0) */
  "g500"?: Auto
  /** -15..15 dB (default 0) */
  "g1k"?: Auto
  /** -15..15 dB (default 0) */
  "g2k"?: Auto
  /** -15..15 dB (default 0) */
  "g4k"?: Auto
  /** -15..15 dB (default 0) */
  "g8k"?: Auto
  /** -15..15 dB (default 0) */
  "g16k"?: Auto
  at?: number | string
  duration?: number | string
}

export declare const geq: {
  (ctx: Ctx): Process
  channels: "any"
  params: {
    /** -15..15 dB (default 0) */
    "g31": { type: "number", default: 0 }
    /** -15..15 dB (default 0) */
    "g63": { type: "number", default: 0 }
    /** -15..15 dB (default 0) */
    "g125": { type: "number", default: 0 }
    /** -15..15 dB (default 0) */
    "g250": { type: "number", default: 0 }
    /** -15..15 dB (default 0) */
    "g500": { type: "number", default: 0 }
    /** -15..15 dB (default 0) */
    "g1k": { type: "number", default: 0 }
    /** -15..15 dB (default 0) */
    "g2k": { type: "number", default: 0 }
    /** -15..15 dB (default 0) */
    "g4k": { type: "number", default: 0 }
    /** -15..15 dB (default 0) */
    "g8k": { type: "number", default: 0 }
    /** -15..15 dB (default 0) */
    "g16k": { type: "number", default: 0 }
  }
}
