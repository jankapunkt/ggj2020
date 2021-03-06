import engine from 'raycaster2'
import {getRandom} from '../../api/utils/utils'
import { Game } from '../../api/game/Game'
const AudioPlayer = engine.AudioPlayer
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
const Color = engine.Color

class GameHandler {

  constructor (id, displayCanvas, minimapCanvas, statusCanvas) {
    this.id = id
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
    const skyBuffers = [0, 1, 2, 3, 4, 5].map(index => {
      const skyBuffer = new CanvasBuffer({ width: window.innerWidth * 2, height: window.innerHeight * 2, alpha: false })
      skyBuffer.pre(context => {
        const g = index * 30
        const b = index * 50
        context.fillStyle = `rgb(0, ${g}, ${ b })`
        context.fillRect(0, 0, window.innerWidth * 2, window.innerHeight * 2)

        const stars = 2500 - (500 * (index + 1))
        if (!stars) return
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
      return skyBuffer
    })

    let wallBuffers = [0,1,2,3,4]
    wallBuffers = wallBuffers.map((index) => {
      const block = 32
      const wallBuffer = new CanvasBuffer({ width: 1024, height: 1024 })
      wallBuffer.pre((context) => {
        let value = 255 - Math.floor(Math.random() * 50)
        switch (index) {
          case 0:
            wallBuffer.background = `rgb( ${value}, ${value}, ${value})`
            break
          case 1:
            wallBuffer.background = `rgb( ${value}, ${0}, ${value})`
            break
          case 2:
            wallBuffer.background = `rgb( ${0}, ${0}, ${value})`
            break;
          case 3:
            wallBuffer.background = `rgb( ${value}, ${value}, ${0})`
            break
          case 4:
            wallBuffer.background = `rgb( ${value}, ${0}, ${0})`
            break;
          case 5:
            wallBuffer.background = `rgb( ${0}, ${value}, ${value})`
            break
          default:
            wallBuffer.background= `rgb( ${0}, ${0}, ${0})`
        }

        for (let x = 0; x < block; x++) {
          for (let y = 0; y < block; y++) {
            value = 255 - Math.floor(Math.random() * 50)
            switch (index) {
              case 0:
                context.fillStyle = `rgb( ${value}, ${value}, ${value})`
                break
              case 1:
                context.fillStyle = `rgb( ${value}, ${0}, ${value})`
                break
              case 2:
                context.fillStyle = `rgb( ${0}, ${0}, ${value})`
                break;
              case 3:
                context.fillStyle = `rgb( ${value}, ${value}, ${0})`
                break
              case 4:
                context.fillStyle = `rgb( ${value}, ${0}, ${0})`
                break;
              case 5:
                context.fillStyle = `rgb( ${0}, ${value}, ${value})`
                break
              default:
                context.fillStyle = `rgb( ${0}, ${0}, ${0})`
            }
            context.fillRect(x * block, y * block, block, block)
          }
        }
      })
      return wallBuffer
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
        current: 0,
        textures: skyBuffers
      },
      wall: {
        textures: wallBuffers,
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
        sound: { id: 'rain', url: '/assets/audio/rain.ogg', volume: 0.5 }
      },
      thunder: {
        light: 2,
        sound: { id: 'thunder', url: '/assets/audio/thunder.ogg', volume: 0.6 }
      },
      ambient: {
        light: 3,
        sound: {
          id: 'ambient',
          url: '/assets/audio/ambient.mp3',
          loop: true
        }
      }
    }
    game.environment = new Environment(envConfig)
    game.runEnvironment()
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

    const isNum = x => /[0-9]/.test(x)
    window.document.addEventListener('keydown', function (event) {
      // if (isNum(event.code)) {} // TODO change color based on numpad
      if (event.code === 'Space') {
        const answer = prompt('type in your solution', '')
        display.requestPointerLock()
        if (!answer) return

        const _id = game.id
        Meteor.call(Game.methods.complete.name, { _id, answer }, (err, res) => {
          console.log(err, res)
        })
      }
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
    if (game.environment.rain.amount) {
      game.environment.sounds.play('rain', { volume: 0.6, loop: true })
    }
    if (game.environment.ambient.sound) {
      game.environment.sounds.play('ambient', { volume: 0.8, loop: true })
    }

    const actors = []
    const environment = game.environment
    const map = game.map
    const camera = game.camera
    const player = game.player
    const controls = this.controls
    const statusScreen = game.statusScreen

    const loop = this.gameLoop
    const miniMap = this.minimap
    const maxdist = 4

    const rayCaster = new RayCaster(map)
    this.rayCaster = rayCaster


    display.addEventListener('click', function () {
      const x = player.x
      const y = player.y
      const d = player.direction

      let found = undefined
      let dx
      let dy
      for (let i = 1 ; i <= maxdist; i++) {
        dx = (x + Math.cos(d) * i)
        dy = (y + Math.sin(d) * i)
        found = game.map.get(dx, dy)
        if (found) break
      }

      if (found !== 1) return

      const _id = game.id
      const index = Math.floor(dy) * game.map.width + Math.floor(dx)
      let value = getRandom(2, environment.wall.textures.length - 1)

      // optimistic ui: update the wall immediately
      // and reverse if the server encountered any error
      game.map.set(dx, dy, value)

      const color = game.environment.wall.textures[value].background

      Meteor.call(Game.methods.updateWall.name, { _id, index, value, color }, (err) => {
        if (err) {
          console.error(err)
          game.map.set(dx, dy, found) // reset to old value
          return
        }
        player.sounds.stop('paint')
        player.sounds.play('paint', { volume: 1 })
      })
    })


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
      miniMap.render({ threshold: 2 })
    }
    loop.start(update, render)
  }

  runEnvironment() {
    const game = this
    const update = () => {
      let count = 0
      let walls = 0
      game.map.data.forEach(value => {
        if (value > 1) count++
        if (value === 1) walls++
      })
      const perc = Math.round(100 * (count / (count + walls)))

      const rain = { amount: 1, volume: 0.6 }
      const thunder = { light: 2, volume: 0.5 }
      const ambient = { light: 4 }
      const sky = { current: 0 }

      if (perc > 5) {
        rain.amount = 0.6
        rain.volume = 0.4
        ambient.light = 5
        sky.current = 0
        thunder.light = 1.8
        thunder.volume = 0.5
      }

      // very low rain
      if (perc > 10) {
        rain.amount = 0.3
        rain.volume = 0.2
        ambient.light = 7
        sky.current = 1
        thunder.light = 1
        thunder.volume = 0.3
      }

      // no rain
      // lighter sky
      if (perc > 20) {
        rain.amount = 0.0
        rain.volume = 0.0
        ambient.light = 9
        sky.current = 2
        thunder.light = 0.05
        thunder.volume = 0.05
      }

      // dark blue sky
      if (perc > 30) {
        ambient.light = 11
        sky.current = 3
        thunder.light = 0.0
        thunder.volume = 0.0
      }

      // orange sky
      // ambient music
      if (perc > 40) {
        ambient.light = 15
        sky.current = 4
      }

      // blue sky
      // flowers grow
      if (perc > 50) {
        ambient.light = 20
        sky.current = 5
      }

      // todo move to environment / camera
      game.updateAmbient(ambient)
      game.updateRain(rain)
      game.updateThunder(thunder)
      game.updateSky(sky)
    }
    update()
    game.envTimer = setInterval(update, 1000)
  }

  updateRain ({ amount, volume }) {
    if (!volume) {
      this.environment.sounds.stop('rain')
    } else {
      this.environment.sounds.volume('rain', volume, { autoplay: true, loop: true })
    }
    this.environment.rain.amount = amount
  }

  updateThunder({ light, volume }) {
    this.environment.thunder.light = light
    this.environment.thunder.volume = volume
  }

  updateSky({ current }) {
    this.environment.sky.current = current
  }

  updateAmbient({ light }) {
    if (light) this.environment.ambient.light = light
  }

  dispose () {
    this.gameLoop.stop()
    this.environment.dispose()
    this.map.dispose()
    this.camera.dispose()
    this.rayCaster.dispose()
    clearInterval(this.envTimer)
  }
}

export default GameHandler
