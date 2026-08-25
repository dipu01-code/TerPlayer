// MFCC — mel-frequency cepstral coefficients: FFT → mel filterbank (triangular,
// Davis & Mermelstein 1980) → log → DCT-II. Ported from audio core.

import { fft } from 'fourier-transform'

const hz2mel = f => 2595 * Math.log10(1 + f / 700)
const mel2hz = m => 700 * (10 ** (m / 2595) - 1)

// triangular mel filterbank weights over FFT power bins
function melBank (nMel, nBins, fs, n, fmin, fmax) {
	let melMin = hz2mel(fmin), melMax = hz2mel(fmax)
	let centers = new Float64Array(nMel + 2)
	for (let i = 0; i < nMel + 2; i++) centers[i] = mel2hz(melMin + (melMax - melMin) * i / (nMel + 1)) * n / fs
	let bank = []
	for (let m = 0; m < nMel; m++) {
		let lo = centers[m], mid = centers[m + 1], hi = centers[m + 2]
		let w = new Float64Array(nBins)
		for (let k = Math.ceil(lo); k < Math.min(hi, nBins); k++) {
			if (k < mid) w[k] = (k - lo) / (mid - lo)
			else w[k] = (hi - k) / (hi - mid)
			if (w[k] < 0) w[k] = 0
		}
		bank.push(w)
	}
	return bank
}

/**
 * @param {Float32Array} data — mono PCM frame (power-of-2 length)
 * @param {object} opts — { fs, bins=13, nMel=40, fmin=0, fmax=fs/2 }
 * @returns {Float32Array} cepstral coefficients
 */
export default function mfcc (data, { fs = 44100, bins = 13, nMel = 40, fmin = 0, fmax = fs / 2 } = {}) {
	let [re, im] = fft(Float64Array.from(data))
	let half = data.length / 2
	let power = new Float64Array(half + 1)
	for (let k = 0; k <= half; k++) power[k] = re[k] * re[k] + im[k] * im[k]

	let bank = melBank(nMel, half + 1, fs, data.length, fmin, fmax)
	let logMel = new Float64Array(nMel)
	for (let m = 0; m < nMel; m++) {
		let e = 0
		for (let k = 0; k <= half; k++) e += power[k] * bank[m][k]
		logMel[m] = Math.log(e + 1e-10)
	}

	let out = new Float32Array(bins)
	for (let k = 0; k < bins; k++) {
		let sum = 0
		for (let m = 0; m < nMel; m++) sum += logMel[m] * Math.cos(Math.PI * k * (2 * m + 1) / (2 * nMel))
		out[k] = sum
	}
	return out
}
