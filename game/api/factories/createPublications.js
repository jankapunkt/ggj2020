import { Schema } from '../schema/Schema'

export const createPublications = publications => {
  Object.keys(publications).forEach(key => {
    const pubDef = publications[ key ]
    createPublication(pubDef)
  })
}

//TODO RATE LIMIT
function createPublication ({ name, schema, run }) {
  const validationSchema = Schema.create(schema)
  const validate = function (doc) {validationSchema.validate(doc)}
  Meteor.publish(name, function (options = {}) {
    const self = this
    console.log('run pub', name)
    try {
      validate(options)
      const cursor = run.call(self, options)
      if (!cursor || !cursor.count) {
        throw new Error('expected cursor')
      }
      return cursor
    } catch(e) {
      console.error(e)
      self.error(e)
      self.ready()
    }
  })
  console.info('createdd publication', name)
}
