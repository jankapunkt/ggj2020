import Globals from './Globals.js'
import RayCache from './RayCache.js'
import CanvasBuffer from './CanvasBuffer.js'

function Camera ({ canvas, resolution, focalLength, canvasScale, range, lightRange, isMobile, scaleFactor }) {
  this.canvas = canvas
  this.ctx = canvas.getContext('2d')
  this.canvasScale = canvasScale || 1
  this.width = canvas.width = window.innerWidth * this.canvasScale
  this.height = canvas.height = window.innerHeight * this.canvasScale

  // projection plane configurable
  this.resolution = resolution
  this.spacing = this.width / resolution
  this.focalLength = focalLength || 0.8
  this.range = range || (isMobile ? 8 : 14)
  this.lightRange = lightRange || 5
  this.scale = (this.width + this.height) / (scaleFactor || 1200)
  this.buffer = null
  this.rainEnabled = true
  this.rayCache = new RayCache()
  this.playerCache = { x: 0, y: 0, direction: 0 }
}

Camera.prototype.update = function (states, player, map) {
  if (states.map && !this.buffer) {
    const offScreenBuffer = new CanvasBuffer({ width: window.innerWidth, height: window.innerHeight })
    offScreenBuffer.pre(function (ctx) {
      ctx.filter = 'blur(3px)'
    })
    offScreenBuffer.from(this.canvas)
    offScreenBuffer.post(function (ctx) {
      ctx.filter = 'none'
    })
    this.buffer = offScreenBuffer
  }
  if (!states.map && this.buffer) {
    this.buffer.dispose()
    this.buffer = null
  }

  const cachedRays = this.rayCache.get(player)
  if (!cachedRays) {
    // prepare entries to be cached
    const cacheEntries = []
    cacheEntries.length = this.resolution

    // cast all rays and add to cache
    for (let column = 0; column < this.resolution; column++) {
      const x = column / this.resolution - 0.5
      const angle = Math.atan2(x, this.focalLength)
      const ray = map.cast(player, player.direction + angle, this.range)
      cacheEntries[ column ] = { ray, angle }
    }

    this.rayCache.add(player, cacheEntries)
  }
}

Camera.prototype.drawFromBuffer = function () { this.buffer.to(this.ctx) }

Camera.prototype.render = function (player, map) {
  if (this.buffer) {
    this.drawFromBuffer()
    return
  }
  this.drawGround(player.direction, map.ground, map.light)
  this.drawSky(player.direction, map.sky, map.light)
  this.drawColumns(player, map)
  this.drawWeapon(player.weapon, player.paces)
}

Camera.prototype.drawGround = function (direction, ground, ambient) {
  const width = ground.width * (this.height / ground.height) * 2
  const left = (direction / Globals.CIRCLE) * -width

  this.ctx.save()
  this.ctx.fillStyle = '#030100'
  // this.ctx.globalAlpha = 0.3
  // this.ctx.drawImage(ground.image, left, 0, width, this.height)
  this.ctx.fillRect(left, 0, width, this.height)
  if (left < width - this.width) {
    // this.ctx.drawImage(ground.image, left + width, 0, width, this.height)
    this.ctx.fillRect(left +width, 0, width, this.height)
  }
  if (ambient > 0) {
    this.ctx.fillStyle = '#ffffff'
    this.ctx.globalAlpha = ambient * 0.1
    this.ctx.fillRect(0, this.height * 0.5, this.width, this.height * 0.5)
  }
  this.ctx.restore()
}

Camera.prototype.drawSky = function (direction, sky, ambient) {
  const width = sky.width * (this.height / sky.height) * 2
  const left = (direction / Globals.CIRCLE) * -width

  this.ctx.save()
  this.ctx.drawImage(sky.image, 0, 0, sky.width, sky.height / 2, left, 0, width, this.height / 2)

  // allow seamless image in 360 degree rotation
  if (left < width - this.width) {
    this.ctx.drawImage(sky.image, 0, 0, sky.width, sky.height / 2, left + width, 0, width, this.height / 2)
  }
  if (ambient > 0) {
    this.ctx.fillStyle = '#ffffff'
    this.ctx.globalAlpha = ambient * 0.1
    this.ctx.fillRect(0, this.height * 0.5, this.width, this.height * 0.5)
  }
  this.ctx.restore()
}

Camera.prototype.drawColumns = function (player, map) {

  const cachedRays = this.rayCache.get(player)
  if (!cachedRays) {
    throw new Error('Ray not found in cache for this position')
  }
  this.ctx.save()
  cachedRays.forEach(({ ray, angle }, index) => {
    this.drawColumn(index, ray, angle, map)
  })
  this.ctx.restore()
}

Camera.prototype.drawColumn = function (column, ray, angle, map) {
  const ctx = this.ctx
  const left = Math.floor(column * this.spacing)
  const width = Math.ceil(this.spacing)
  let hit = -1

  // scanning the current ray by checking if this hit
  // is not facing a wall (where ray.height > 0)
  while (++hit < ray.length && ray[ hit ].height <= 0) {}

  // draw single ray
  for (let s = ray.length - 1; s >= 0; s--) {
    const step = ray[ s ]

    if (s === hit) {
      const texture = map.wall[step.height - 1]
      let textureX = Math.floor(texture.width * step.offset)

      // TODO use height value from a height map
      let wall = this.project(1, angle, step.distance)

      ctx.globalAlpha = 1
      ctx.drawImage(texture.image, textureX, 0, 1, texture.height, left, wall.top, width, wall.height)

      ctx.fillStyle = '#000000'
      ctx.globalAlpha = Math.max((step.distance + step.shading) / this.lightRange - map.light, 0)
      ctx.fillRect(left, wall.top, width, wall.height)
    }

    if (this.rainEnabled) {
      ctx.fillStyle = '#ffffff'
      ctx.globalAlpha = 0.15
      let rainDrops = Math.pow(Math.random(), 100) * s
      let rain = (rainDrops > 0) && this.project(0.1, angle, step.distance)
      while (--rainDrops > 0) {
        ctx.fillRect(left, Math.random() * rain.top, 1, rain.height)
      }
    }
  }
}

Camera.prototype.drawWeapon = function (weapon, paces) {
  const bobX = Math.cos(paces * 3) * this.scale * 6
  const bobY = Math.sin(paces * 5) * this.scale * 6
  const left = this.width * 0.66 + bobX
  const top = this.height * 0.6 + bobY
  this.ctx.drawImage(weapon.image, left, top, weapon.width * this.scale, weapon.height * this.scale)
}

Camera.prototype.project = function (height, angle, distance) {
  const z = distance * Math.cos(angle)
  const wallHeight = this.height * height / z
  const bottom = this.height / 2 * (1 + 1 / z)
  return {
    top: bottom - wallHeight,
    height: wallHeight
  }
}

export default Camera
