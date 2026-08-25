export interface BrowserMicOptions {
  sampleRate?: number
  channels?: number
  bitDepth?: 8 | 16 | 32
  context?: AudioContext
  echoCancellation?: boolean
  noiseSuppression?: boolean
  autoGainControl?: boolean
}

export interface ReadFn {
  (cb: (err: Error | null, chunk?: Uint8Array | null) => void): void
  (cb: null): void
  end(): void
  close(): void
  backend: 'mediastream'
}

export default function mic(opts?: BrowserMicOptions): Promise<ReadFn>
