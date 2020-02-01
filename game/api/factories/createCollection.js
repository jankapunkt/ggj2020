import { Mongo } from 'meteor/mongo'
import { Schema } from '../schema/Schema'

export const createCollection = (context) => {
  const {name, schema} = context
  const collection = new Mongo.Collection(name)
  const collectionSchema = Schema.create(schema)
  // collection.attachSchema(collectionSchema)
  context.collection = () => collection
}
