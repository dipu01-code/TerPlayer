// @audio/eq — equalization & tone shaping umbrella re-exporting every @audio/eq-* atom.
// For smaller bundles, depend directly on the individual atom.
// Headphone crossfeed lives in @audio/spatial-crossfeed.

export { default as graphicEq } from '@audio/eq-graphic'
export { default as parametricEq } from '@audio/eq-parametric'
export { default as crossover } from '@audio/eq-crossover'
export { default as lowShelf } from '@audio/eq-lowshelf'
export { default as highShelf } from '@audio/eq-highshelf'
export { default as baxandall } from '@audio/eq-baxandall'
export { default as tilt } from '@audio/eq-tilt'
export { default as firEq, design as firDesign } from '@audio/eq-fir'
export { default as dynamicEq } from '@audio/eq-dynamic'
