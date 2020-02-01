import engine from 'raycaster2'
import {getRandom} from '../../api/utils/utils'

const Status = engine.Status
const Player = engine.Player
const Controls = engine.Controls
const Environment = engine.Environment
const Map = engine.Map
const Minimap = engine.Minimap
const Camera = engine.Camera
const GameLoop = engine.GameLoop
const RayCaster = engine.RayCaster
const CanvasBuffer = engine.CanvasBuffer

class GameHandler {

  constructor (displayCanvas, minimapCanvas, statusCanvas) {
    this.gameLoop = new GameLoop()
    this.controls = new Controls()
    this.environment = null
    this.player = null
    this.map = null
    this.camera = null
    this.minimap = null
    this.statusScreen = null
    this.displayCanvas = displayCanvas
    this.minimapCanvas = minimapCanvas
    this.statusCanvas = statusCanvas
  }

  setupMap({ width, height, data }) {
    this.map = new Map({data, width, height})
  }

  setupEnvironment() {
    const skyBuffer = new CanvasBuffer({ width: window.innerWidth * 2, height: window.innerHeight * 2, alpha: false })
    skyBuffer.pre(context => {
      context.fillStyle = '#00010a'
      context.fillRect(0, 0, window.innerWidth * 2, window.innerHeight * 2)

      const stars = 2500
      const colorrange = [ 0, 60, 240 ]
      let y
      let radius
      let hue
      let sat
      for (let i = 0; i < stars; i++) {
        let x = Math.random() * window.innerWidth * 2
        y = Math.random() * window.innerHeight * 2
        radius = Math.random() * 1.2
        hue = colorrange[ getRandom(0, colorrange.length - 1) ]
        sat = getRandom(50, 100)
        context.beginPath()
        context.arc(x, y, radius, 0, 360)
        context.fillStyle = 'hsl(' + hue + ', ' + sat + '%, 88%)'
        context.fill()
      }
    })

    const wallBuffer = new CanvasBuffer({ width: 1024, height: 1024 })
    wallBuffer.pre((context) => {
      context.fillStyle = '#06ff00'
      context.fillRect(0, 0, 1024, 1024)

      const block = 32

      for (let x = 0; x < block; x++) {
        for (let y = 0; y < block; y++) {
          const value = 255 - Math.floor(Math.random() * 50)
          context.fillStyle = `rgb(
            ${value},
            ${value},
            ${value}
            )`
          context.fillRect(x * block, y * block, block, block)
        }
      }
    })

    const groundBuffer = new CanvasBuffer({ width: 1024, height: 1024 })
    groundBuffer.pre((context) => {
      context.fillStyle = '#b3b0b4'
      context.fillRect(0, 0, 1024, 1024)

      const block = 32

      for (let x = 0; x < block; x++) {
        for (let y = 0; y < block; y++) {
          const value = 255 - Math.floor(Math.random() * 50)
          context.fillStyle = `rgb(
            ${value},
            ${value},
            ${value}
            )`
          context.fillRect(x * block, y * block, block, block)
        }
      }
    })

    const game = this
    const envConfig = {
      sky: {
        texture: skyBuffer
      },
      wall: {
        textures: [
          wallBuffer
        ],
        color: '#399dff',
        border: {
          top: 1,
          left: 1,
          bottom: 1,
          right: 1
        }
      },
      ground: {
        texture: groundBuffer,
        color: '#0000FF'
      },
      rain: {
        amount: 1,
        sound: { id: 'rain', url: 'assets/audio/rain.ogg' }
      },
      thunder: {
        light: 2,
        sound: { id: 'thunder', url: 'assets/audio/thunder.ogg' }
      },
      ambient: {
        light: 5,
        sound: {
          id: 'ambient',
          url: 'assets/audio/ambient.mp3',
          listeners: {
            ended: () => {
              // play ambient after 15 seconds
              setTimeout(() => {
                game.environment.sounds.play('ambient', { volume: 0.8, loop: false })
              }, 15 * 1000)
            }
          }
        }
      }
    }
    game.environment = new Environment(envConfig)
  }

  setupPlayer(playerConfig) {
    this.player = new Player(playerConfig)
  }

  setupMinimap () {
    this.minimap = new Minimap({
      canvas: this.minimapCanvas,
      map: this.map,
      controls: this.controls,
      scale: 16,
      background: 'rgba(0,0,0,0)',
      wallColor: 'rgba(255, 255, 255, 0.4)',
      actorColor: 'rgba(0,255,0,0.7)'
    })
  }

  setupWindowHandlers () {
    const game = this
    const statusCanvas = this.statusCanvas
    const display = this.displayCanvas
    const statusScreen = new Status({ canvas: statusCanvas })
    statusScreen.register(game.player)
    statusCanvas.addEventListener('click', function () {
      display.requestPointerLock = display.requestPointerLock || display.mozRequestPointerLock || display.webkitRequestPointerLock
      display.requestPointerLock()
    })
    this.statusScreen = statusScreen

    let mouseCaptured = false

    window.document.addEventListener('pointerlockchange', function () {
      mouseCaptured = !mouseCaptured
      game.player.lockControls = !mouseCaptured
      document.body.style.cursor = mouseCaptured ? 'none' : 'pointer'
    })

    window.document.addEventListener('keydown', function (event) {
      if (event.code !== 'Space') return
      prompt('type in your solution', '')
    })
  }

  setupCamera(config) {
    this.camera = new Camera(config)
  }

  run () {
    const game = this
    const display = game.displayCanvas

    display.requestPointerLock = display.requestPointerLock || display.mozRequestPointerLock || display.webkitRequestPointerLock
    display.requestPointerLock()

    // play rain immediately
    game.environment.sounds.play('rain', { volume: 0.8, loop: true })

    // play ambient after 15 seconds
    setTimeout(() => {
      game.environment.sounds.play('ambient', { volume: 0.8, loop: false })
    }, 15 * 1000)

    const actors = []
    const environment = game.environment
    const map = game.map
    const camera = game.camera
    const player = game.player
    const controls = this.controls
    const statusScreen = game.statusScreen
    const rayCaster = new RayCaster(map)
    const loop = this.gameLoop
    const miniMap = this.minimap

    function update (seconds) {
      // environment updates
      environment.update(seconds)

      // actors updates
      player.update(controls.states, map, seconds)
      actors.forEach(actor => actor.update({}, map, seconds))
      camera.update(controls.states, player, actors, rayCaster, seconds)

      // ui updates
      statusScreen.update(controls.states, seconds)
      miniMap.update(controls.states, player, seconds)
    }

    function render () {
      camera.render(player, environment, map, rayCaster)
      statusScreen.render()
      miniMap.render()
    }

    loop.start(update, render)
  }

  dispose () {

  }
}

export default GameHandler
