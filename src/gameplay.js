const { CollectItem } = require('./strats/collectItem')

function loadDefaultStrategies (gameplay) {
  gameplay.addStrategy(new CollectItem(gameplay.bot))
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
  constructor (bot) {
    this.bot = bot
    this.strategies = []

    loadDefaultStrategies(this)
  }

  /**
   * Adds a new strategy to this gameplay container.
   *
   * @param {Strategy} strategy - The strategy to add.
   */
  addStrategy (strategy) {
    this.strategies.push(strategy)
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
