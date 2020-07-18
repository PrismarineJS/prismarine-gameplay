const { CollectItem } = require('./strats/collectItem')
const { CollectBlock } = require('./strats/collectBlock')
const { WaitForTime } = require('./strats/waitForTime')
const { WaitForItemDrop } = require('./strats/waitForItemDrop')

function loadDefaultStrategies (gameplay) {
  gameplay.addStrategy(new CollectItem(gameplay.bot))
  gameplay.addStrategy(new CollectBlock(gameplay.bot))
  gameplay.addStrategy(new WaitForTime(gameplay.bot))
  gameplay.addStrategy(new WaitForItemDrop(gameplay.bot))
}

/**
 * A container for all containing and configuring gameplay strategies.
 */
class Gameplay {
  /**
   * Creates a new gameplay object
   *
   * @param {Bot} bot - The bot this gameplay container is acting upon
   */
  constructor (bot, loadDefault = true) {
    this.bot = bot
    this.strategies = []

    if (loadDefault) loadDefaultStrategies(this)
  }

  /**
   * Adds a new strategy to this gameplay container.
   *
   * @param {Strategy} strategy - The strategy to add.
   */
  addStrategy (strategy) {
    this.strategies.push(strategy)
    strategy.active = false

    this[strategy.name] = (options, cb) => {
      try {
        if (strategy.active) throw new Error('Strategy is already active!')

        strategy.active = true
        strategy.run(options, (err, returns) => {
          strategy.active = false
          cb(err, returns)
        })
      } catch (err) {
        strategy.active = false
        cb(err)
      }
    }
  }

  stopAll () {
    for (const strat of this.strategies) {
      if (strat.active) strat.exit()
    }
  }
}

module.exports = { Gameplay }
