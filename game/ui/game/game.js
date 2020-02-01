import { ReactiveDict } from 'meteor/reactive-dict'
import { Game } from '../../api/game/Game'
import { cam1990, cam2020, playerConfig } from './GameConfig'
import GameHandler from './GameHandler'
import './game.html'
import { Routes } from '../../api/routes/Routes'
import { Router } from '../../api/routes/Router'

Template.game.onCreated(function () {
  const instance = this
  instance.state = new ReactiveDict()
  instance.autorun(() => {
    const data = Template.currentData()
    console.log(data)
    const { gameId } = data.params
    const sub = Meteor.subscribe(Game.publications.current.name, { _id: gameId })
    if (sub.ready()) {
      console.log('game doc ready')
      const gameDoc = Game.collection().findOne(gameId)
      if (!gameDoc) {
        // fails
        return
      }
      instance.state.set('gameDoc', gameDoc)
    }
  })

  instance.autorun(() => {
    const gameDoc = instance.state.get('gameDoc')
    if (!gameDoc) return

    if (gameDoc.completedAt) {
      alert('yeah compled')
      return Router.go(Routes.root.path())
    }

    if (!instance.game) {
      /**
       * ---------------------------------------------------------
       * SETUP ENGINE AND GAME LOGIC
       * ---------------------------------------------------------
       */

      const display = document.querySelector('#display')
      const minimapCanvas = document.querySelector('#minimap')
      const statusCanvas = document.querySelector('#status')

      const gameInstance = new GameHandler(gameDoc._id, display, minimapCanvas, statusCanvas)
      gameInstance.setupMap(gameDoc.map)
      gameInstance.setupMinimap()
      gameInstance.setupPlayer(playerConfig)
      gameInstance.setupEnvironment()
      gameInstance.setupWindowHandlers()

      instance.game = gameInstance
    } else {
      const map = instance.game.map
      gameDoc.map.data.forEach((value, index) => {
        if (map.data[index] !== value) {
          map.data[index] = value
        }
      })
    }
  })
})

Template.game.helpers({
  gameDoc () {
    return Template.instance().state.get('gameDoc')
  },
  running () {
    return Template.instance().state.get('running')
  }
})

Template.game.events({
  'click .start-button' (event, templateInstance) {
    event.preventDefault()
    const year = templateInstance.$(event.currentTarget).data('year')
    const display = templateInstance.$('#display').get(0)
    if (year === 1990) {
      templateInstance.game.setupCamera(cam1990(display))
    }
    if (year === 2020) {
      templateInstance.game.setupCamera(cam2020(display))
    }

    templateInstance.game.run()
    templateInstance.state.set('running', true)
  }
})