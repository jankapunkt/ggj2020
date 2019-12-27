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

export default Map
