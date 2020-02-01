import './title.html'
import { Schema } from '../../api/schema/Schema'
import { formIsValid } from '../../api/utils/formUtils'

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

    console.log(insertDoc)
  },
  'input .username-input' (event) {
    if (event.code === 'Enter') {
      document.querySelector('#joinForm').submit()
    }
  }
})