import { History } from '../history/History'

export const Game = { name: 'game' }

Game.collection = () => {
  throw new Error('not created')
}

Game.schema = {
  word: String,
  users: Array,
  'users.$': {
    type: String,
    min: 3,
    max: 16,
    regEx: Meteor.settings.public.usernameRegEx
  },
  map: Object,
  'map.width': Number,
  'map.height': Number,
  'map.data': Array,
  'map.data.$': Number,
  createdAt: Date,
  completedAt: {
    type: Date,
    optional: true
  }
}

const API = Meteor.isServer && (function () {
  import { getMapDataFromText } from '../utils/textUtils'

  const wordGen = Meteor.isServer && Meteor.settings.wordGen

  return {
    randomWord () {
      let word = ''
      const chars = wordGen.chars
      for (let i = 0; i < wordGen.length; i++) {
        const index = Math.floor(Math.random() * chars.length)
        word += chars[ index ]
      }
      return word
    },
    findRunningGame () {
      return Game.collection().findOne({
        completedAt: { $exists: false }
      })
    },
    createGame ({ map, word }) {
      const createdAt = new Date()
      return Game.collection().insert({ word, map, createdAt })
    },
    createMap (word, size = 16) {
      return getMapDataFromText(word, size)
    }
  }
})()

Game.methods = {}

Game.methods.join = {
  name: 'game.methods.join',
  schema: {
    username: {
      type: String,
      min: 3,
      max: 16,
      regEx: Meteor.settings.public.usernameRegEx
    },
    password: {
      type: String,
      min: 4,
      max: 128
    }
  },
  run: Meteor.isServer && function ({ username, password }) {
    let userId = this.userId
    if (!userId) {
      userId = Accounts.createUser({ username, password })
    }

    let gameDoc = API.findRunningGame()
    if (!gameDoc) {
      const word = API.randomWord()
      const map = API.createMap(word)
      const gameDocId = API.createGame({ word, map })
      gameDoc = Game.collection().findOne(gameDocId)
    }

    Game.collection().update(gameDoc._id, { $addToSet: { users: userId } })
    return gameDoc._id
  }
}

Game.methods.complete = {
  name: 'game.methods.complete',
  schema: {
    _id: String,
    answer: {
      type: String,
      min: 1,
      max: 20,
      regEx: Meteor.settings.public.usernameRegEx
    }
  },
  run: Meteor.isServer && function ({ _id, answer }) {
    const gameDoc = API.findRunningGame()
    if (!gameDoc) throw new Meteor.Error(404, 'no running game found')

    const correct = gameDoc.word === answer
    if (correct) {
      Game.collection().update(gameDoc._id, { $set: { completedAt: new Date() } })
      return true
    }
    return false
  }
}

Game.methods.updateWall = {
  name: 'game.methods.updateWall',
  schema: {
    _id: String,
    index: {
      type: Number,
      min: 0
    },
    value: Number,
    color: String
  },
  run: Meteor.isServer && (function () {
    import { History } from '../history/History'

    return function ({ _id, index, value, color }) {
      const userId = this.userId
      const user = Meteor.users.findOne(userId)
      if (!userId || !user) throw new Meteor.Error(403, 'permission denied not logged in')

      const gameDoc = Game.collection().findOne(_id)
      if (!gameDoc) throw new Meteor.Error(404, 'no running game by id')
      if (index >= gameDoc.map.data.length) throw new Meteor.Error(500, 'tried to access undefined index')

      const modifier = { [ `map.data.${index}` ]: value }
      const gameUpdated = Game.collection().update(_id, { $set: modifier })
      const historyUpdated = Meteor.call(History.methods.update.name, { color, userId, name: user.username, gameId: gameDoc._id })
      return gameUpdated && historyUpdated
    }
  })()
}

Game.publications = {}
Game.publications.current = {
  name: 'game.publication.current',
  schema: { _id: String },
  run: Meteor.isServer && function ({ _id }) {
    return Game.collection().find({ _id }, { limit: 1 })
  }
}
