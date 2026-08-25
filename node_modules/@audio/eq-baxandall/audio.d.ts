// Generated from the audio.js manifest (params metadata is the source of truth).
// Regenerate: node tools/dts.js in @audio/compile. Do not edit by hand.

/** Automatable number — scalar, `t => value` fn, or breakpoint curve {t, v} */
type Auto = number | ((t: number) => number) | { t: number[], v: number[] }
/** Per-block param values as delivered by hosts (numbers arrive as 1-length Float32Array) */
type Live = Record<string, Float32Array | string | boolean>
type Ctx = { sampleRate: number, maxBlockSize: number, maxChannels: number, currentTime: number, duration?: number, events?: readonly any[], emit?: (name: string, ...args: any[]) => void, [k: string]: unknown }
type Process = (inputs: Float32Array[][], outputs: Float32Array[][], params: Live) => void

/** Chainable-host options for 'baxandall' */
export interface BaxandallOptions {
  /** -15..15 dB (default 0) */
  "bass"?: Auto
  /** -15..15 dB (default 0) */
  "treble"?: Auto
  /** 60..1000 Hz (default 250) */
  "fBass"?: Auto
  /** 1000..12000 Hz (default 4000) */
  "fTreble"?: Auto
  at?: number | string
  duration?: number | string
}

export declare const baxandall: {
  (ctx: Ctx): Process
  channels: "any"
  params: {
    /** -15..15 dB (default 0) */
    "bass": { type: "number", default: 0 }
    /** -15..15 dB (default 0) */
    "treble": { type: "number", default: 0 }
    /** 60..1000 Hz (default 250) */
    "fBass": { type: "number", default: 250 }
    /** 1000..12000 Hz (default 4000) */
    "fTreble": { type: "number", default: 4000 }
  }
}
