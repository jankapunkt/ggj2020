import './title.html'
import { Schema } from '../../api/schema/Schema'
import { formIsValid } from '../../api/utils/formUtils'
import { Game } from '../../api/game/Game'
import { Routes } from '../../api/routes/Routes'
import { Router } from '../../api/routes/Router'

const usernameRegEx = Meteor.settings.public.usernameRegEx

const joinSchema = Schema.create({
  username: {
    type: String,
    label: 'Username',
    regEx: usernameRegEx,
    min: 3,
    max: 16,
    autoform: {
      class: 'text-center username-input'
    }
  }
})

Template.title.helpers({
  joinSchema () {
    return joinSchema
  },
  allowedChars() {
    return 'a-z A-Z 0-9 _ @ & - + / ! ? .'
  }
})

Template.title.onRendered(function () {
  document.querySelector('.username-input').focus()
})

Template.title.events({
  'submit #joinForm' (event, templateInstance) {
    event.preventDefault()
    const insertDoc = formIsValid(joinSchema, 'joinForm')
    if (!insertDoc) return

    Meteor.call(Game.methods.join.name, { name: insertDoc.username }, (err, gameId) => {
      if (err) return alert(err.reason)
      const gameRoute = Routes.game.path(gameId)
      Router.go(gameRoute)
    })
  },
  'input .username-input' (event) {
    if (event.code === 'Enter') {
      document.querySelector('#joinForm').submit()
    }
  }
})