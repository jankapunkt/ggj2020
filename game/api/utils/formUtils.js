/* global AutoForm */

export const formIsValid = function formIsValid (schema, formId, isUpdate) {
  const formDoc = isUpdate
    ? AutoForm.getFormValues(formId).updateDoc
    : AutoForm.getFormValues(formId).insertDoc
  let options
  if (isUpdate) {
    options = {}
    options.modifier = true
  }
  const context = schema.newContext()
  context.validate(formDoc, options)
  const errors = context.validationErrors()
  if (errors && errors.length > 0) {
    errors.forEach(err => AutoForm.addStickyValidationError(formId, err.key, err.type, err.value))
    return null
  } else {
    return formDoc
  }
}

export const formReset = formId => AutoForm.resetForm(formId)
