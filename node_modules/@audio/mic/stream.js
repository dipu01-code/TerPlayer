/**
 * @module audio-mic/stream
 *
 * Node.js Readable stream for audio capture.
 */
import { Readable } from 'node:stream'
import mic from './index.js'

export default function readable(opts) {
  const read = mic(opts)
  return Readable.from(read, {
    highWaterMark: Math.round(
      (opts?.sampleRate || 44100) * (opts?.channels || 1) *
      ((opts?.bitDepth || 16) / 8) * (opts?.bufferSize || 50) / 1000
    )
  })
}
