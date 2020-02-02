import { ReactiveDict } from 'meteor/reactive-dict'
import { Game } from '../../api/game/Game'
import { cam1990, cam2020, playerConfig } from './GameConfig'
import GameHandler from './GameHandler'
import './game.html'
import { Routes } from '../../api/routes/Routes'
import { Router } from '../../api/routes/Router'
import { History } from '../../api/history/History'

Template.game.onCreated(function () {
  const instance = this
  instance.state = new ReactiveDict()

  /**
   * Subscription to the main game document
   */

  instance.autorun(() => {
    const data = Template.currentData()
    console.log(data)
    const { gameId } = data.params
    const sub = Meteor.subscribe(Game.publications.current.name, { _id: gameId })
    if (sub.ready()) {
      const gameDoc = Game.collection().findOne(gameId)
      if (!gameDoc) {
        // fails
        return
      }
      instance.state.set('gameDoc', gameDoc)
    }
  })

  /**
   * Subscription to the game history
   */

  instance.autorun(() => {
    const gameDoc = instance.state.get('gameDoc')
    if (!gameDoc) return

    const gameId = gameDoc._id
    const historySub = Meteor.subscribe(History.publications.game.name, {gameId})
    if (historySub.ready()) {
      const historyDoc =History.collection().findOne({ gameId })
      if (historyDoc) {
        console.log(historyDoc.entries.reverse())
        instance.state.set('history', historyDoc.entries.reverse())
      }
    }
  })

  /**
   * Initialization of a new game or ending an existing one
   */

  instance.autorun(() => {
    const gameDoc = instance.state.get('gameDoc')
    if (!gameDoc) return

    if (gameDoc.completedAt) {
      alert('yeah compled')
      if (instance.game) {
        instance.game.dispose()
      }
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
      // the publication runs this function each time the map updates
      // so we are syncing the cached client size map
      // with values from the updated values from the gameDoc
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
    return Template.instance().state.get('isRunning')
  },
  history () {
    const instance = Template.instance()

    return instance.state.get('isRunning') && instance.state.get('history')
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
    templateInstance.state.set('isRunning', true)
  }
})