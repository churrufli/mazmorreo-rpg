// En las pruebas no suena nada.
class Sound {
  constructor(_name, _base, cb) { if (typeof cb === 'function') Promise.resolve().then(() => cb('sin sonido en pruebas')); }
  play() { return this; }
  stop(cb) { if (cb) cb(); return this; }
  release() { return this; }
  setVolume() { return this; }
  setNumberOfLoops() { return this; }
}
module.exports = Sound;
module.exports.default = Sound;
