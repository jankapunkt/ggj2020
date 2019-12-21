function AudioPlayer () {
  this.sounds = {}
}

AudioPlayer.prototype.init = function (sources) {
  sources.forEach(({ id, url, listeners }) => {
    const audio = new window.Audio(url)
    if (listeners) {
      Object.keys(listeners).forEach(eventName => {
        const handler = listeners[eventName]
        audio.addEventListener(eventName, handler)
      })
    }

    this.sounds[id] = { url, audio: audio, listeners }
  })
}

AudioPlayer.prototype.play = function (id, {volume, loop}) {
  const sound = this.sounds[id]
  if (!sound) return
  if (volume) sound.audio.volume = volume
  if (loop) sound.audio.loop = loop
  sound.audio.play()
}

AudioPlayer.prototype.pause = function (id) {
  const sound = this.sounds[id]
  if (!sound) return
  sound.audio.pause()
}

AudioPlayer.prototype.stop = function (id) {
  const sound = this.sounds[id]
  if (!sound) return
  sound.audio.pause()
  sound.audio.currentTime = 0
}

AudioPlayer.prototype.dispose = function (id) {
  if (id) {
    const sound = this.sounds[id]
    if (!sound) return
    if (sound.listeners) {
      Object.keys(sound.listeners).forEach(eventName => {
        const handler = sound.listeners[eventName]
        sound.audio.removeEventListener(eventName, handler)
      })
    }
    sound.audio = null
    delete this.sounds[id]
  } else {
    // dispose all
    Object.keys(this.sounds).forEach(key => this.dispose(key))
  }
}
