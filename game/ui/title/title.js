import { Template } from 'meteor/templating'
import { ReactiveDict } from 'meteor/reactive-dict'
import { Schema } from '../../api/schema/Schema'
import { Game } from '../../api/game/Game'
import { Routes } from '../../api/routes/Routes'
import { Router } from '../../api/routes/Router'
import { formIsValid } from '../../api/utils/formUtils'
import './title.html'

const usernameRegEx = Meteor.settings.public.usernameRegEx

const joinSchema = Schema.create({
  username: {
    type: String,
    label: 'Username',
    regEx: usernameRegEx,
    min: 3,
    max: 16,
    autoform: {
      autocomplete: 'username',
      class: 'text-center username-input'
    }
  },
  password: {
    type: String,
    min: 4,
    max: 128,
    autoform: {
      type: 'password',
      autocomplete: 'current-password',
      class: 'text-center password-input'
    }
  }
})

Template.title.onCreated(function () {
  const instance = this
  instance.state = new ReactiveDict()
})

Template.title.helpers({
  joinSchema () {
    return joinSchema
  },
  allowedChars() {
    return 'a-z A-Z 0-9 _ @ & - + / ! ? .'
  },
  loggingIn () {
    return Template.instance().state.get('loggingIn')
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

    templateInstance.state.set('loggingIn', true)
    Meteor.loginWithPassword(insertDoc.username, insertDoc.password, (err) => {
      let loggedIn = !err
      Meteor.call(Game.methods.join.name, insertDoc, (err, gameId) => {
        if (loggedIn) {
          templateInstance.state.set('loggingIn', false)
          if (err) return alert(err.reason)
          const gameRoute = Routes.game.path(gameId)
          Router.go(gameRoute)
        } else {
          Meteor.loginWithPassword(insertDoc.username, insertDoc.password, (err) => {
            templateInstance.state.set('loggingIn', false)
            if (err) return alert(err.reason)
            const gameRoute = Routes.game.path(gameId)
            Router.go(gameRoute)
          })
        }
      })
    })

  },
  'input .username-input' (event) {
    if (event.code === 'Enter') {
      document.querySelector('#joinForm').submit()
    }
  }
})