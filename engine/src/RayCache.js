/**
 * Simple cache for a column of rays by a given player position and direction.
 * Rays are casted byased on the combination of a player's position and direction and
 * as long as the environment does not change, they can be easily cached here.
 * @constructor
 */

function RayCache () {
  this.map = {}
  this.count = 0
}

/**
 * Gets a key by position x, y and direction
 * @param x The player's x position
 * @param y The player's y position
 * @param direction The player's direction
 * @return {String} a key-String as combination of these values
 */

RayCache.prototype.key = function (x, y, direction) {
  return `${x};${y};${direction}`
}

/**
 * Adds a column of ray computations to the cache.
 * @param x
 * @param y
 * @param direction
 * @param rays {Array} and Array of objects, where eeach entry contains the respective ray #
 * and the angle computed using the direction
 */

RayCache.prototype.add = function ({ x, y, direction }, rays) {
  const key = this.key(x, y, direction)
  this.map[ key ] = rays
  this.count++
}

/**
 * Gets a column of rays by a given player position / direction
 * @param x The player's x position
 * @param y The player's y position
 * @param direction The player's direction
 * @return {Array|undefined} an Array of ray/angle entries or undefined
 */

RayCache.prototype.get = function ({ x, y, direction }) {
  const key = this.key(x, y, direction)
  return this.map[ key ]
}

export default RayCache
