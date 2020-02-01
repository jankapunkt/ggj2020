import { ValidatedMethod } from 'meteor/mdg:validated-method'
import { Schema } from '../schema/Schema'

export const createMethods = methods => {
  Object.keys(methods).forEach(methodKey => {
    console.log('create method', methodKey)
    const methodDef = methods[ methodKey ]
    createMethod(methodDef)
  })
}

//TODO RATE LIMIT
function createMethod ({ name, schema, run }) {
  const validationSchema = Schema.create(schema)
  const validate = function (doc) {validationSchema.validate(doc)}
  return new ValidatedMethod({ name, validate, run })
}