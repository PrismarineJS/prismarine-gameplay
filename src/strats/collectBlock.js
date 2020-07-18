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
   *
   * _OR_
   *
   * * blockType - The type of block to look for.
   * * distance - How far away from the bot to look for this block in
   */
  run (options, cb) {
    this.shouldExit = false

    if (options.block !== undefined) {
      this._handleItems([options.item], cb)
    } else if (options.blockType !== undefined) {
      const mcData = require('minecraft-data')(this.bot.version)
      const id = mcData.blocksByName[options.blockType].id

      const findNext = () => {
        if (this.shouldExit) {
          cb()
          return
        }

        const block = this._findNearbyBlock(id, options.distance)

        if (block) this._handleBlock(block, () => findNext())
        else cb()
      }

      findNext()
    } else {
      cb(new Error('Target block must be specified!'))
    }
  }

  exit () {
    this.shouldExit = true
    this.bot.pathfinder.setGoal(null)
  }

  _findNearbyBlock (blockId, distance) {
    return this.bot.findBlock({
      matching: blockId,
      maxDistance: distance
    })
  }

  _handleBlock (block, cb) {
    const mcData = require('minecraft-data')(this.bot.version)
    const defaultMove = new Movements(this.bot, mcData)
    this.bot.pathfinder.setMovements(defaultMove)

    const goalNear = new GoalNear(
      block.position.x,
      block.position.y,
      block.position.z,
      3
    )
    this.bot.pathfinder.setGoal(goalNear)

    this.bot.once('goal_reached', () => {
      const dig = block => {
        this.bot.dig(block, err => {
          if (err) {
            cb(err)
            return
          }

          this.bot.gameplay.waitForItemDrop(
            {
              position: block.position,
              maxDistance: 5,
              maxTicks: 20,
              groupItems: true
            },
            (err, returns) => {
              if (err) {
                cb(err)
                return
              }

              this.bot.gameplay.collectItem(
                {
                  items: returns.items
                },
                err => cb(err)
              )
            }
          )
        })
      }

      const tool = this._getBestTool(block)
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
