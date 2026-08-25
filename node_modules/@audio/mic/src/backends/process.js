/**
 * Process backend — capture PCM from system audio tools (last resort)
 */
import { spawn, execSync } from 'node:child_process'
import { platform } from 'node:os'

function tryExec(cmd) {
  try { execSync(cmd, { stdio: 'ignore' }); return true } catch { return false }
}

function findRecorder(sampleRate, channels, bitDepth) {
  const os = platform()
  const fmt = bitDepth === 8 ? 'u8' : bitDepth === 32 ? 'f32le' : `s${bitDepth}le`

  if (os === 'darwin' && tryExec('ffmpeg -version'))
    return ['ffmpeg', ['-f', 'avfoundation', '-i', ':default', '-f', fmt, '-ar', sampleRate, '-ac', channels, '-']]

  if (os === 'linux' && tryExec('ffmpeg -version'))
    return ['ffmpeg', ['-f', 'pulse', '-i', 'default', '-f', fmt, '-ar', sampleRate, '-ac', channels, '-']]

  if (tryExec('sox --version'))
    return ['sox', ['-d', '-t', 'raw', '-r', sampleRate, '-c', channels, '-b', bitDepth, '-e', 'signed-integer', '-L', '-']]

  if (os === 'linux' && tryExec('arecord --version')) {
    const afmt = bitDepth === 8 ? 'U8' : bitDepth === 32 ? 'FLOAT_LE' : `S${bitDepth}_LE`
    return ['arecord', ['-f', afmt, '-r', sampleRate, '-c', channels, '-t', 'raw']]
  }

  return null
}

export function open({ sampleRate = 44100, channels = 1, bitDepth = 16 } = {}) {
  const recorder = findRecorder(sampleRate, channels, bitDepth)
  if (!recorder) throw new Error('No audio recorder found (install ffmpeg or sox)')

  const [cmd, args] = recorder
  const proc = spawn(cmd, args.map(String), { stdio: ['ignore', 'pipe', 'ignore'] })

  let closed = false
  let pending = null

  proc.on('close', () => { closed = true })

  proc.stdout.on('data', (chunk) => {
    if (pending) {
      const cb = pending
      pending = null
      cb(null, chunk)
    }
  })

  proc.stdout.on('error', () => {})

  return {
    read(cb) {
      if (closed) return cb?.(new Error('Process exited'), null)
      pending = cb
    },

    close() {
      if (closed) return
      closed = true
      pending = null
      proc.stdout.destroy()
      proc.kill()
    }
  }
}
