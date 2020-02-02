export const History = { name: 'history' }

History.schema = {
  gameId: String,
  entries: Array,
  'entries.$': Object,
  'entries.$.userId': String,
  'entries.$.name': String,
  'entries.$.color': String
}

History.collection = () => {
  throw new Error('no collection created')
}

History.methods = {}
History.methods.update = {
  name: 'history.methods.update',
  schema: {
    gameId: String,
    userId: String,
    name: String,
    color: String
  },
  run: Meteor.isServer && (function () {
    import { Game } from '../game/Game'

    return function ({ gameId, userId, name, color }) {
      const gameDoc = Game.collection().findOne(gameId)
      if (!gameDoc) throw new Meteor.Error('no game doc by id', gameId)
      if (gameDoc.completedAt) throw new Meteor.Error('game is completed', gameId)

      const entry = { name, userId, color }
      const HistoryCollection = History.collection()
      const historyDoc = HistoryCollection.findOne({ gameId })
      if (historyDoc) {
        return HistoryCollection.update(historyDoc._id, { $push: { entries: entry } })
      } else {
        return HistoryCollection.insert({ gameId, entries: [ entry ] })
      }
    }
  })()
}

History.publications = {}

History.publications.game = {
  name: 'history.publications.game',
  schema: {
    gameId: String
  },
  run: Meteor.isServer && function ({ gameId }) {
    return History.collection().find({ gameId })
  }
}