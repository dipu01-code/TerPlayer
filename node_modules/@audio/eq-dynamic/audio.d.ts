// Generated from the audio.js manifest (params metadata is the source of truth).
// Regenerate: node tools/dts.js in @audio/compile. Do not edit by hand.

/** Automatable number — scalar, `t => value` fn, or breakpoint curve {t, v} */
type Auto = number | ((t: number) => number) | { t: number[], v: number[] }
/** Per-block param values as delivered by hosts (numbers arrive as 1-length Float32Array) */
type Live = Record<string, Float32Array | string | boolean>
type Ctx = { sampleRate: number, maxBlockSize: number, maxChannels: number, currentTime: number, duration?: number, events?: readonly any[], emit?: (name: string, ...args: any[]) => void, [k: string]: unknown }
type Process = (inputs: Float32Array[][], outputs: Float32Array[][], params: Live) => void

/** Chainable-host options for 'dyneq' */
export interface DyneqOptions {
  /** 40..16000 Hz (default 6000) */
  "fc"?: Auto
  /** 0.3..20 (default 2) */
  "Q"?: Auto
  /** -60..0 dB (default -30) */
  "threshold"?: Auto
  /** 1..20 (default 3) */
  "ratio"?: Auto
  /** 0.5..100 ms (default 5) */
  "attack"?: Auto
  /** 10..1000 ms (default 80) */
  "release"?: Auto
  /** 0..24 dB (default 12) */
  "maxGain"?: Auto
  /** default "down" */
  "mode"?: "down" | "up"
  at?: number | string
  duration?: number | string
}

export declare const dyneq: {
  (ctx: Ctx): Process
  channels: "any"
  streaming: false
  tail: 0.2
  params: {
    /** 40..16000 Hz (default 6000) */
    "fc": { type: "number", default: 6000 }
    /** 0.3..20 (default 2) */
    "Q": { type: "number", default: 2 }
    /** -60..0 dB (default -30) */
    "threshold": { type: "number", default: -30 }
    /** 1..20 (default 3) */
    "ratio": { type: "number", default: 3 }
    /** 0.5..100 ms (default 5) */
    "attack": { type: "number", default: 5 }
    /** 10..1000 ms (default 80) */
    "release": { type: "number", default: 80 }
    /** 0..24 dB (default 12) */
    "maxGain": { type: "number", default: 12 }
    /** default "down" */
    "mode": { type: "enum", values: ["down","up"], default: "down" }
  }
}
