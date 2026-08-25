export interface MicOptions {
  sampleRate?: number
  channels?: number
  bitDepth?: 8 | 16 | 24 | 32
  bufferSize?: number
  backend?: 'miniaudio' | 'process' | 'null'
}

export interface ReadFn {
  (cb: (err: Error | null, chunk?: Buffer | Uint8Array | null) => void): void
  (cb: null): void
  end(): void
  close(): void
  backend: string
  [Symbol.asyncIterator](): AsyncIterator<Buffer | Uint8Array>
}

export default function mic(opts?: MicOptions): ReadFn
