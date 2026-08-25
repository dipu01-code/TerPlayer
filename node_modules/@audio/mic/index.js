/**
 * @module audio-mic
 *
 * Capture audio data from microphone.
 * let read = mic({ sampleRate: 44100 })
 * read((err, chunk) => {})
 * read(null) // stop
 */
import { open } from './src/backend.js'

const defaults = {
  sampleRate: 44100,
  channels: 1,
  bitDepth: 16,
  bufferSize: 50
}

export default function mic(opts) {
  const config = { ...defaults, ...opts }
  const { name, device } = open(config, config.backend)

  read.close = () => { device.close() }
  read.end = () => { device.close() }
  read.backend = name
  read[Symbol.asyncIterator] = () => ({
    next: () => new Promise((resolve, reject) => {
      device.read((err, chunk) => {
        if (err) return reject(err)
        if (!chunk) return resolve({ done: true, value: undefined })
        resolve({ done: false, value: chunk })
      })
    })
  })

  return read

  function read(cb) {
    if (cb == null) {
      device.close()
      return
    }
    device.read(cb)
  }
}
