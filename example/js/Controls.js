function Controls () {
  this.codes = {
    a: 'left',
    d: 'right',
    w: 'forward',
    s: 'backward',
    x: 'map',
    'shift': 'run'
  }
  this.states = {
    'left': false,
    'right': false,
    'forward': false,
    'backward': false,
    'run': false,
    'map': false,
    'rotateX': 0
  }
  document.addEventListener('keydown', this.onKey.bind(this, true), false)
  document.addEventListener('keyup', this.onKey.bind(this, false), false)
  document.addEventListener('mousemove', this.onMousemove.bind(this), false)
}

Controls.prototype.onMousemove = function (e) {
  const neg = e.movementX < 0 ? -1 : 1
  const absX = Math.abs(e.movementX)
  const x = absX > 25 ? 25 : absX
  this.states.rotateX = x * neg
  e.preventDefault()
  e.stopPropagation()
}

Controls.prototype.onKey = function (val, e) {
  const state = this.codes[ e.key.toLowerCase() ]
  console.log(state, val)
  if (typeof state === 'undefined') return
  this.states[ state ] = val
  e.preventDefault && e.preventDefault()
  e.stopPropagation && e.stopPropagation()
}
