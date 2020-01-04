import Cache from './Cache.js'
import Globals from './Globals.js'
import CanvasBuffer from './CanvasBuffer.js'

function Camera ({ canvas, resolution, focalLength, canvasScale, range, isMobile, scaleFactor }) {
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
  this.scale = (this.width + this.height) / (scaleFactor || 1200)
  this.buffer = null
  this.rainEnabled = true

  // caches
  this.rayCache = new Cache()
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

  this.drawGround(player, environment)
  this.drawSky(player, environment)
  this.drawColumns(player, environment, rayCaster)
//  this.drawActors(player, environment, map)
  this.drawWeapon(player.weapon, player.paces)
}

Camera.prototype.drawGround = function (player, environment) {
  const ground = environment.ground.texture
  const width = ground.width * (this.height / ground.height) * 2
  const left = (player.direction / Globals.CIRCLE) * -width

  this.ctx.save()
  this.ctx.fillStyle = '#FF00FF'//'#030100'
  this.ctx.fillRect(left, 0, width, this.height)

  // this.ctx.drawImage(ground.image, left, this.height / 2, width, this.height)

  if (left < width - this.width) {
    // this.ctx.drawImage(ground.image, left + width, this.height / 2, width, this.height)
    this.ctx.fillRect(left + width, 0, width, this.height)
  }

  if (environment.light > 0) {
    this.ctx.fillStyle = '#ffffff'
    this.ctx.globalAlpha = environment.light * 0.1
    this.ctx.fillRect(0, this.height * 0.5, this.width, this.height * 0.5)
  }
  this.ctx.restore()
}

Camera.prototype.drawSky = function (player,  environment) {
  const sky = environment.sky
  if (!sky || !sky.texture) return

  const texture = sky.texture
  const width = texture.width * (this.height / texture.height) * 2
  const left = (player.direction / Globals.CIRCLE) * -width
  const height = (this.height / 2) - ((this.height / 2) * player.directionV)


  // begin draw
  this.ctx.save()

  // draw from buffer
  if (texture.canvas) {
    texture.to(this.ctx, 0, 0, texture.width, texture.height, left, 0, width, height)
    if (left < width - this.width) {
      texture.to(this.ctx, 0, 0, texture.width, texture.height, left + width, 0, width, height)
    }
  }

  // draw from image
  if (texture.image) {
    this.ctx.drawImage(texture.image, 0, 0, texture.width, texture.height, left, 0, width, this.height / 2)
    if (left < width - this.width) {
      this.ctx.drawImage(texture.image, 0, 0, texture.width, texture.height, left + width, 0, width, this.height / 2)
    }
  }

  // optional light effects
  if (environment.light > 0) {
    this.ctx.fillStyle = '#ffffff'
    this.ctx.globalAlpha = environment.light * 0.1
    this.ctx.fillRect(0, this.height * 0.5, this.width, this.height * 0.5)
  }

  // end draw
  this.ctx.restore()


}

Camera.prototype.drawColumns = function (player, environment) {
  this.ctx.save()
  const rays = this.rayCache.get(this.key)
  for (let i = 0, len = rays.length; i < len; i++) {
    const entry = rays[ i ]
    this.drawColumn(i, entry, player, environment)
  }
  this.ctx.restore()
}

Camera.prototype.drawColumn = function (column, ray, player, environment) {
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
      const texture = environment.wall.textures[ step.height - 1 ]
      let textureX = Math.floor(texture.width * step.offset)

      // TODO use height value from a height map
      let wall = this.project(1, angle, player.directionV, step.distance)

      ctx.globalAlpha = 1
      ctx.drawImage(texture.image, textureX, 0, 1, texture.height, left, wall.top, width, wall.height)

      ctx.fillStyle = '#000000'
      ctx.globalAlpha = Math.max((step.distance + step.shading) / environment.ambient.light - environment.light, 0)
      ctx.fillRect(left, wall.top, width, wall.height)
    }

    // draw rain from environment for this column
    // so we can draw more drops on top of a wall
    // by knowing its boundaries and projection
    if (environment.rain && !environment.rain.disabled) {
      ctx.fillStyle = '#ffffff'
      ctx.globalAlpha = 0.15
      this.rainDrops = Math.pow(Math.random(), 100 - environment.rain.amount) * s
      this.rain = (this.rainDrops > 0) && this.project(0.1, angle, player.directionV, step.distance)
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

Camera.prototype.project = function (height, angleH, angleV, distance) {
  const z = distance * Math.cos(angleH)
  const wallHeight = this.height * height / z
  const bottom = this.height / 2 * ((1  - angleV )+ 1 / z)
  this.projectionCache.top = bottom - wallHeight
  this.projectionCache.height = wallHeight
  return this.projectionCache
}

export default Camera
