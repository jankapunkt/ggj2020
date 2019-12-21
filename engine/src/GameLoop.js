function GameLoop ({ fpsHandler } = {}) {
  this.frame = this.frame.bind(this)
  this.lastTime = 0
  this.fpsRatio = 60 / 1000
  this.callback = function () {}
  this.fpsHandler = fpsHandler
}

GameLoop.prototype.start = function (callback) {
  this.callback = callback
  window.requestAnimationFrame(this.frame)
}

GameLoop.prototype.pause = function () {
  this.pause = true
}

GameLoop.prototype.stop = function () {
  this.stopped = true
}

GameLoop.prototype.frame = function (time) {
  const seconds = (time - this.lastTime) / 1000
  this.lastTime = time

  if (this.fpsHandler) {
    this.fpsHandler((1000 - seconds) * this.fpsRatio)
  }

  if (seconds < 0.2) {
    this.callback(seconds)
  }
  if (!this.stopped) {
    window.requestAnimationFrame(this.frame)
  }
}

export default GameLoop
