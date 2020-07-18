const { Strategy } = require('../strategy')

/**
 * An extremely simple task which just waits for a period of time.
 */
class WaitForTime extends Strategy {
  /**
   * Creates a new Wait For Time strategy.
   *
   * @param {Bot} bot - The bot to act on.
   */
  constructor (bot) {
    super('waitForTime', bot)
  }

  /**
   * @inheritdoc
   *
   * Options:
   * * ticks - The number of ticks to wait for.
   */
  run (options, cb) {
    if (options.ticks !== undefined) {
      this._waitForTime(options.ticks)
    } else {
      cb(new Error('Number of ticks to wait for must be specified!'))
    }
  }

  _waitForTime (ticks, cb) {
    const bot = this.bot

    function countDown () {
      ticks--

      if (ticks === 0) {
        bot.removeListener('physicTick', countDown)
        cb()
      }
    }

    bot.on('physicTick', countDown)
  }
}

module.exports = { WaitForTime }
