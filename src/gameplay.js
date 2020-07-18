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
    this[strategy.name] = (options, cb) => {
      try {
        strategy.run(options, cb)
      } catch (err) {
        cb(err)
      }
    }
  }

  /**
   * Gets a strategy from this container based on the given name.
   *
   * @param {string} name - The name of the strategy.
   * @returns The strategy, or undefined if there is no strategy with the given name.
   */
  getStrategy (name) {
    for (const strategy of this.strategies) {
      if (strategy.name === name) return strategy
    }
  }

  /**
   * Finds and begins executing the given strategy.
   *
   * @param {string} name - The name of the strategy to execute.
   * @param {*} options - The options to run the strategy with.
   * @param {*} callback - If there was an error while preforming this action.
   */
  runStrategy (name, options, cb) {
    const strategy = this.getStrategy(name)

    try {
      if (strategy) strategy.run(options, cb)
      else throw new Error(`No available strategy with the name '${name}'!`)
    } catch (err) {
      cb(err)
    }
  }
}

module.exports = { Gameplay }
