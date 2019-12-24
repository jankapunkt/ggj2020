import Cache from './Cache.js'

function RayCaster (map) {
  this.map = map

  const keyFunction = (point, angle, range) => `${point};${angle};${range}`
  this.cache = new Cache(keyFunction)
}

RayCaster.prototype.cast = function (point, angle, range) {
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
    step.height = self.map.get(step.x - dx, step.y - dy)
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

RayCaster.prototype.get = function (point, angle, range) {
  const cached = this.cache.get(point)
  if (cached) {
    return cached
  }

  const ray = this.cast(point, angle, range)
  this.cache.add(ray, point, angle, range)
  return ray
}

export default RayCaster
