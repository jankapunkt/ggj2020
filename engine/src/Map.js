const defaults = {
  width: 32,
  height: 32,
}


function Map ({ width, height, data } = {}) {
  this.width = width || defaults.width
  this.height = height || defaults.height
  this.size = this.width * this.height
  this.data = new Uint8Array(this.size)
  if (data) {
    this.load(data)
  }
}

Map.defaults = defaults

Map.prototype.load = function (data) {
  const self = this
  data.forEach((value, index) => {
    self.data[index] = value & 0xFF // to uint8
  })
}

Map.prototype.set = function (x = -1, y = -1, value) {
  x = Math.floor(x)
  y = Math.floor(y)
  if (x < 0 || x > this.width - 1 || y < 0 || y > this.height - 1) {
    return null
  }
  this.data[ y * this.width + x ] = value
  return value
}

Map.prototype.get = function (x = -1, y = -1) {
  x = Math.floor(x)
  y = Math.floor(y)
  if (x < 0 || x > this.width - 1 || y < 0 || y > this.height - 1) {
    return null
  }
  return this.data[ y * this.width + x ]
}

Map.prototype.randomize = function (depth = 0.3) {
  for (let i = 0; i < this.size; i++) {
    this.data[ i ] = Math.random() < depth ? 1 : 0
  }
}

Map.prototype.cast = function (point, angle, range) {
  const self = this
  const sin = Math.sin(angle)
  const cos = Math.cos(angle)
  const noWall = { length2: Infinity }

  return ray({ x: point.x, y: point.y, height: 0, distance: 0 })

  function ray (origin) {
    const stepX = step(sin, cos, origin.x, origin.y)
    const stepY = step(cos, sin, origin.y, origin.x, true)
    const nextStep = stepX.length2 < stepY.length2
      ? inspect(stepX, 1, 0, origin.distance, stepX.y)
      : inspect(stepY, 0, 1, origin.distance, stepY.x)

    if (nextStep.distance > range) return [ origin ]
    return [ origin ].concat(ray(nextStep))
  }

  function step (rise, run, x, y, inverted) {
    if (run === 0) return noWall
    const dx = run > 0 ? Math.floor(x + 1) - x : Math.ceil(x - 1) - x
    const dy = dx * (rise / run)
    return {
      x: inverted ? y + dy : x + dx,
      y: inverted ? x + dx : y + dy,
      length2: dx * dx + dy * dy
    }
  }

  // TODO memoize for different cos / sin values
  function inspect (step, shiftX, shiftY, distance, offset) {
    const dx = cos < 0 ? shiftX : 0
    const dy = sin < 0 ? shiftY : 0
    step.height = self.get(step.x - dx, step.y - dy)
    step.distance = distance + Math.sqrt(step.length2)
    if (shiftX) {
      step.shading = cos < 0 ? 2 : 0
    } else {
      step.shading = sin < 0 ? 2 : 1
    }
    step.offset = offset - Math.floor(offset)
    return step
  }
}


Map.prototype.update = function (seconds) {}

export default Map
