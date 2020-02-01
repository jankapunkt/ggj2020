import { Tracker } from 'meteor/tracker'
import SimpleSchema from 'simpl-schema'

SimpleSchema.extendOptions(['autoform', 'name'])

export const Schema = {}

Schema.create = function (schemaDefinition, options) {
  const tracker = Meteor.isClient && { tracker: Tracker }
  return new SimpleSchema(schemaDefinition, Object.assign({}, options, tracker))
}
