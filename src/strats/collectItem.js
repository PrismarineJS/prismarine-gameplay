const { Strategy } = require('../strategy')
const { GoalFollow } = require('mineflayer-pathfinder').goals

/**
 * A simple task which collects a specific item from the ground.
 * Requires the pathfinder plugin to be loaded in order to work.
 */
class CollectItem extends Strategy {
  /**
   * Creates a new Collect Item strategy.
   *
   * @param {Bot} bot - The bot to act on.
   */
  constructor (bot) {
    super('collect_item', bot)
  }

  /**
   * @inheritdoc
   *
   * Options:
   * * item - The item drop to pick up. If undefined, bot targets all nearby item drops.
   * * distance - The maximum distance to look for item drops if specific target not specified.
   */
  run (options, cb) {
    if (options.item !== undefined) {
      this._handleItems([options.item], cb)
    } else if (options.distance !== undefined) {
      this._handleItems(this._findNearbyItems(options.distance), cb)
    } else {
      cb(new Error('Target item or search distance must be specified!'))
    }
  }

  _findNearbyItems (distance) {
    const items = []
    for (const entityName of Object.keys(this.bot.entities)) {
      const entity = this.bot.entities[entityName]

      if (entity.objectType !== 'Item') {
        continue
      }

      if (entity.position.distanceTo(this.bot.entity.position) > distance) {
        continue
      }

      items.push(entity)
    }

    items.sort((a, b) => {
      return (
        b.position.distanceTo(this.bot.entity.position) -
        a.position.distanceTo(this.bot.entity.position)
      )
    })

    return items
  }

  _handleItems (items, cb) {
    if (items.length === 0) {
      cb()
      return
    }

    const item = items.pop()
    const followGoal = new GoalFollow(item)

    this.bot.pathfinder.setGoal(followGoal)
    this.bot.pathfinder.once('goal_reached', () => this._handleItems(items, cb))
  }
}

module.exports = { CollectItem }
