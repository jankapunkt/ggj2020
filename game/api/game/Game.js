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
    name: {
      type: String,
      min: 3,
      max: 16,
      regEx: Meteor.settings.public.usernameRegEx
    }
  },
  run: Meteor.isServer && function ({ name }) {
    let gameDoc = API.findRunningGame()

    if (!gameDoc) {
      const word = API.randomWord()
      const map = API.createMap(word)
      const gameDocId = API.createGame({ word, map })
      gameDoc = Game.collection().findOne(gameDocId)
    }

    Game.collection().update(gameDoc._id, { $addToSet: { users: name } })
    return gameDoc._id
  }
}

Game.methods.complete = {
  name: 'game.methods.complete',
  schema: {
    answer: {
      type: String,
      min: 1,
      max: 20,
      regEx: Meteor.settings.public.usernameRegEx
    }
  },
  run: Meteor.isServer && function ({ answer }) {
    const gameDoc = Game.api.findRunningGame()
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
    value: Number
  },
  run: Meteor.isServer && function ({ _id, index, value }) {
    const gameDoc = Game.collection().findOne(_id)
    if (!gameDoc) throw new Meteor.Error(404, 'no running game by id')
    if (index >= gameDoc.map.data.length) throw new Meteor.Error(500, 'tried to access undefined index')
    const modifier = { [ `map.data.${index}` ]: value }
    return Game.collection().update(_id, { $set: modifier })
  }
}

Game.publications = {}
Game.publications.current = {
  name: 'game.publication.current',
  schema: { _id: String },
  run: Meteor.isServer && function ({ _id }) {
    return Game.collection().find({ _id }, { limit: 1 })
  }
}
