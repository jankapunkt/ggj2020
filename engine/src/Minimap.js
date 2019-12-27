function Minimap ({ canvas, map, scale, background, wallColor, actorColor }) {
  this.canvas = canvas
  this.ctx = canvas.getContext('2d')
  this.canvas.width = map.width * scale
  this.canvas.height = map.height * scale
  this.map = map
  this.scale = scale || 1
  this.bg = background || '#FFFFFF'
  this.wallColor = wallColor || '#A4A4A4'
  this.actorColor = actorColor || '#4A4A4A'
  this.debug = false
}

Minimap.prototype.update = function (state, player) {
  if (state.map) {
    this.drawActive = true
    this.x = player.x
    this.y = player.y
    this.direction = player.direction
  }
  if (!state.map && this.drawActive) {
    this.drawActive = false
    const ctx = this.ctx
    const map = this.map
    const mapWidth = map.width
    const mapHeight = map.height
    const scale = this.scale
    ctx.clearRect(0, 0, mapWidth * scale, mapHeight * scale)
  }
}

Minimap.prototype.render = function () {
  if (!this.drawActive) return

  const ctx = this.ctx
  const map = this.map
  const mapWidth = map.width
  const mapHeight = map.height
  const scale = this.scale

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

  // player as mini square
  ctx.fillStyle = this.actorColor
  ctx.fillRect(this.x * scale - 2, this.y * scale - 2, 4, 4)

  // player direction
  ctx.beginPath()
  ctx.strokeStyle = this.actorColor
  ctx.moveTo(this.x * scale, this.y * scale)
  ctx.lineTo((this.x + Math.cos(this.direction) * 4) * scale, (this.y + Math.sin(this.direction) * 4) * scale)
  ctx.closePath()
  ctx.stroke()

  ctx.fillStyle = this.bg
}

export default Minimap
