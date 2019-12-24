const defaults = {
  keyFunction: val => val
}

/**
 * Simple generic cache to store values by using a function to generate keys.
 * @param keyFunction the function to generate a key by given arguments
 * @param strict optional, defaults to false
 * @constructor
 */

function Cache (keyFunction = defaults.keyFunction, { strict = false } = {}) {
  this.map = {}
  this.count = 0
  this.strict = strict
  this.keyFunction = keyFunction
}

/**
 * Gets a key by applying arguments to a given key function.
 * 
 */

Cache.prototype.key = function (args) {
  return this.keyFunction.apply(this, args)
}

/**
 * Adds a value to the cache. All following arguments are used by the key function
 * to determine the caching key.
 * @param value the value to be stored
 * @param args arguments to by used by the key function to generate a key
 * @throws if strict an error is thrown when a value exists for the generated key
 */

Cache.prototype.add = function (value, ...args) {
  const key = this.key(args)
  const keyExists = Object.prototype.hasOwnProperty.call(this.map, key)
  if (this.strict && keyExists) {
    throw new Error(`Expected no value to be present for key <${key}>`)
  }
  
  this.map[ key ] = value
  if (!keyExists) {
    this.count++
  }
}

/**
 * Returns a value by given arguments, if the generated key using the arguments fits a value in the map.
 * @param args
 * @returns {*}
 * @throws in strict mode it throws an error if the object keys are not the same size of the size counter.
 */

Cache.prototype.get = function (...args) {
  const key = this.key(args)
  return this.map[ key ]
}

Cache.prototype.size = function () {
  if (!this.strict) {
    return this.count
  }

  const keys = Object.keys(this.map).length
  if (keys !== this.count) {
    throw new Error(`Expected size of ${this.count}, got ${keys}`)
  }
  return keys
}

export default Cache
