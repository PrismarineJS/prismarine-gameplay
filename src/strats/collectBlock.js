const { Strategy } = require('../strategy')
const { GoalNear } = require('mineflayer-pathfinder').goals
const Movements = require('mineflayer-pathfinder').Movements

/**
 * A strategy which mines and collects the target block.
 * Requires the pathfinder plugin to be loaded in order to work.
 */
class CollectBlock extends Strategy {
  /**
   * Creates a new Collect Block strategy.
   *
   * @param {Bot} bot - The bot to act on.
   */
  constructor (bot) {
    super('collectBlock', bot)
  }

  /**
   * @inheritdoc
   *
   * Options:
   * * block - The block to mine and collect
   */
  run (options, cb) {
    if (options.block !== undefined) {
      this._handleItems([options.item], cb)
    } else {
      cb(new Error('Target block must be specified!'))
    }
  }

  _handleBlock (block, cb) {
    const mcData = require('minecraft-data')(this.bot.version)
    const defaultMove = new Movements(this.bot, mcData)
    this.bot.pathfinder.setMovements(defaultMove)

    const followGoal = new GoalNear(block.position)
    this.bot.pathfinder.setGoal(followGoal)

    this.bot.once('goal_reached', () => {
      const dig = block => {
        this.bot.dig(block, err => {
          if (err) {
            cb(err)
            return
          }

          this.bot.gameplay.waitForTime({ ticks: 20 }, err => {
            if (err) {
              cb(err)
              return
            }

            // TODO Replace this simple 'waitForTime' approach for a more viable option.
            // Namely, a function which waits for the actual item drop entity to spawn
            // and collects that item directly.

            this.bot.gameplay.collectItem(
              {
                distance: 10
              },
              err => cb(err)
            )
          })
        })
      }

      const tool = this.getBestTool(block)
      if (tool) {
        this.bot.equip(tool, 'hand', err => {
          if (err) {
            cb(err)
            return
          }

          dig(block)
        })
      } else {
        // TODO Throw error if bot doesn't have the tool required to collect the block
        // This would probably need to be implemented after loot tables are generated

        dig(block)
      }
    })
  }

  _getBestTool (block) {
    const items = this.bot.inventory.items()
    for (const i in block.harvestTools) {
      const id = parseInt(i, 10)
      for (const j in items) {
        const item = items[j]
        if (item.type === id) return item
      }
    }
  }
}

module.exports = { CollectBlock }
