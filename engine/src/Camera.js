import Cache from './Cache.js'
import Globals from './Globals.js'
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

  // current rays
  this.rayCache = new Cache()
  this.rays = []
  this.projectionCache = {}
}

Camera.prototype.update = function (states, player, actors, rayCaster) {
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

  // cast rays only if player moves, otherwise
  // we just use the rays from the last cast because there
  // is nothing new to be drawn on the screen
  this.key = player.x.toString() + player.y.toString() + player.direction.toString()
  const cachedRays = this.rayCache.get(this.key)
  if (!cachedRays) { //this.rays.length < this.resolution || player.isRotating || player.isMoving) {
    const rays = []
    rays.length = this.resolution
    for (let column = 0; column < this.resolution; column++) {
      const x = column / this.resolution - 0.5
      const angle = Math.atan2(x, this.focalLength)
      const ray = rayCaster.cast(player, player.direction + angle, this.range)
      ray.angle = angle
      rays[ column ] = ray
    }
    this.rayCache.add(rays, this.key)
  }

  // update actors, find actors in view field
  // TODO get math to calculate view field of actor
  // TODO and add calculated values to this.actors
  // TODO which will then be used to draw them in render
}

Camera.prototype.drawFromBuffer = function () { this.buffer.to(this.ctx) }

Camera.prototype.render = function (player, environment, map, rayCaster) {
  // use buffered image for example when
  // a menu is opened, the minimap is opened, etc.
  if (this.buffer) {
    this.drawFromBuffer()
    return
  }

  this.drawGround(player.direction, environment.ground, environment.light)
  this.drawSky(player.direction, environment.sky, environment.light)
  this.drawColumns(player, environment, rayCaster)
//  this.drawActors(player, environment, map)
  this.drawWeapon(player.weapon, player.paces)
}

Camera.prototype.drawGround = function (direction, ground, ambient) {
  const width = ground.width * (this.height / ground.height) * 2
  const left = (direction / Globals.CIRCLE) * -width

  this.ctx.save()
  this.ctx.fillStyle = '#030100'
  this.ctx.fillRect(left, 0, width, this.height)

  // this.ctx.drawImage(ground.image, left, this.height / 2, width, this.height)

  if (left < width - this.width) {
    // this.ctx.drawImage(ground.image, left + width, this.height / 2, width, this.height)
    this.ctx.fillRect(left + width, 0, width, this.height)
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

  // draw sky texture
  //this.ctx.fillStyle = '#ffffff'
  //this.ctx.globalAlpha = 0.2
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

Camera.prototype.drawColumns = function (player, environment) {
  this.ctx.save()
  const rays = this.rayCache.get(this.key)
  for (let i = 0, len = rays.length; i < len; i++) {
    const entry = rays[ i ]
    this.drawColumn(i, entry, environment)
  }
  this.ctx.restore()
}

Camera.prototype.drawColumn = function (column, ray, environment) {
  const ctx = this.ctx
  const left = Math.floor(column * this.spacing)
  const width = Math.ceil(this.spacing)
  const angle = ray.angle
  let hit = -1

  // scanning the current ray by checking if this hit
  // is not facing a wall (where ray.height > 0)
  while (++hit < ray.length && ray[ hit ].height <= 0) {}

  // draw single ray
  for (let s = ray.length - 1; s >= 0; s--) {
    const step = ray[ s ]

    if (s === hit) {
      const texture = environment.wall[ step.height - 1 ]
      let textureX = Math.floor(texture.width * step.offset)

      // TODO use height value from a height map
      let wall = this.project(1, angle, step.distance)

      ctx.globalAlpha = 1
      ctx.drawImage(texture.image, textureX, 0, 1, texture.height, left, wall.top, width, wall.height)

      ctx.fillStyle = '#000000'
      ctx.globalAlpha = Math.max((step.distance + step.shading) / this.lightRange - environment.light, 0)
      ctx.fillRect(left, wall.top, width, wall.height)
    }

    // TODO to environment
    if (this.rainEnabled) {
      ctx.fillStyle = '#ffffff'
      ctx.globalAlpha = 0.15
      this.rainDrops = Math.pow(Math.random(), 100) * s
      this.rain = (this.rainDrops > 0) && this.project(0.1, angle, step.distance)
      while (--this.rainDrops > 0) {
        ctx.fillRect(left, Math.random() * this.rain.top, 1, this.rain.height)
      }
    }
  }
}

Camera.prototype.drawActors = function (player, map) {
  const actors = this.actors
  if (actors.length === 0) return

  const ctx = this.ctx
  this.ctx.save()

  ctx.fillStyle = '#ffAA00'
  ctx.globalAlpha = 0.15
  this.actors.forEach(actor => {

  })
  this.ctx.restore()

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
  this.projectionCache.top = bottom - wallHeight,
    this.projectionCache.height = wallHeight
  return this.projectionCache
}

export default Camera
