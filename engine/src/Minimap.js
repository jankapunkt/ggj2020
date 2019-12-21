function Minimap ({ canvas, map, scale, background, wallColor, actorColor }) {
  this.canvas = canvas
  this.ctx = canvas.getContext('2d')
  this.map = map
  this.actors = new Set()
  this.scale = scale || 1
  this.bg = background || '#FFFFFF'
  this.wallColor = wallColor || '#A4A4A4'
  this.actorColor = actorColor || '#4A4A4A'

  canvas.width = map.size * scale
  canvas.height = map.size * scale

  this.debug = false
}

Minimap.prototype.add = function (actor) {
  this.actors.add(actor)
}

Minimap.prototype.remove = function (actor) {
  this.actors.delete(actor)
}

Minimap.prototype.update = function (state) {
  if (state.map) this.drawActive = true
  if (!state.map && this.drawActive) {
    this.drawActive = false
    const ctx = this.ctx
    const map = this.map
    const mapWidth = map.size
    const mapHeight = map.size
    const scale = this.scale
    ctx.clearRect(0, 0, mapWidth * scale, mapHeight * scale)
  }
}

Minimap.prototype.render = function () {
  if (!this.drawActive) return

  const ctx = this.ctx
  const map = this.map
  const mapWidth = map.size
  const mapHeight = map.size
  const scale = this.scale
  const actors = this.actors

  ctx.clearRect(0, 0, mapWidth * scale, mapHeight * scale)

  // draw background as rect
  ctx.fillStyle = this.bg
  ctx.fillRect(0, 0, mapWidth * scale, mapHeight * scale)

  // Loop through all blocks on the map
  for (let y = 0; y < mapHeight; y++) {
    for (let x = 0; x < mapWidth; x++) {
      const wall = map.get(x, y)
      if (wall > 0) {
        ctx.fillStyle = this.wallColor
        ctx.fillRect(x * scale, y * scale, scale, scale)
      }
    }
  }

  actors.forEach(actor => {
    // player as mini square
    ctx.fillStyle = this.actorColor
    ctx.fillRect(actor.x * scale - 2, actor.y * scale - 2, 4, 4)

    // player direction
    ctx.beginPath()
    ctx.strokeStyle = this.actorColor
    ctx.moveTo(actor.x * scale, actor.y * scale)
    ctx.lineTo((actor.x + Math.cos(actor.direction) * 4) * scale, (actor.y + Math.sin(actor.direction) * 4) * scale)
    ctx.closePath()
    ctx.stroke()
  })

  ctx.fillStyle = this.bg
}

export default Minimap
