import AudioPlayer from './AudioPlayer.js'

const defaults = {
  light: 0
}

function Environment ({ light, sounds, textures } = 0) {
  this.light = light || defaults.light

  this.sounds = new AudioPlayer()
  this.sounds.init(sounds)

  // textures
  this.sky = textures.sky
  this.wall = textures.wall
  this.ground = textures.ground
}

Environment.prototype.update = function (seconds) {
  // TODO provide a callback to define this behavior
  if (this.light > 0) {
    this.light = Math.max(this.light - 10 * seconds, 0)
  } else if (Math.random() * 8 < seconds) {
    this.sounds.play('thunder', { volume: 0.5 })
    this.light = 2
  }
}

export default Environment
