const { Strategy } = require('../strategy')

/**
 * Waits for an item to drop near an area and returns that item drop entity.
 */
class WaitForItemDrop extends Strategy {
  /**
   * Creates a new Wait For Item Drop strategy.
   *
   * @param {Bot} bot - The bot to act on.
   */
  constructor (bot) {
    super('waitForItemDrop', bot)
  }

  /**
   * @inheritdoc
   *
   * Options:
   * * position - The location where the item is expected to spawn at. (Defaults to bot location)
   * * maxDistance - How far away from the position to check for item spawns within. (Defaults to 16 blocks)
   * * maxTicks - The maximum number of ticks to wait for. (Defaults to 50)
   * * groupItems - If an item drops, should additional ticks be allocated to wait for more drops in that same spot? (Defaults to false)
   *
   * Returns:
   * * items - A list of items which were spawned
   */
  run (options, cb) {
    const position =
      options.position !== undefined
        ? options.position
        : this.bot.entity.position

    const maxDistance =
      options.maxDistance !== undefined ? options.maxDistance : 16

    const maxTicks = options.maxTicks !== undefined ? options.maxTicks : 50

    const groupItems =
      options.groupItems !== undefined ? options.groupItems : false

    this._waitForDrop(position, maxDistance, maxTicks, groupItems, cb)
  }

  _waitForDrop (position, distance, ticks, groupItems, cb) {
    const bot = this.bot
    const items = []

    function cleanup () {
      bot.removeListener('physicTick', countDown)
      cb(undefined, {
        items: items
      })
    }

    // Timeout
    function countDown () {
      ticks--

      if (ticks === 0) {
        cleanup()
      }
    }

    function entitySpawn (entity) {
      if (entity.objectType !== 'Item') return
      if (entity.position.distanceTo(position) > distance) return

      items.push(entity)

      // Wait up to 3 more ticks if grouped items. Else, cleanup now.
      if (groupItems) ticks = 3
      else cleanup()
    }

    bot.on('physicTick', countDown)

    bot.on('entitySpawn', entitySpawn)
  }
}

module.exports = { WaitForItemDrop }
