class StrategyState {
  constructor (bot) {
    this.bot = bot
  }

  clone () {
    const state = new StrategyState(this.bot)
    for (const prop in this) state[prop] = this[prop]
    state.parent = this

    return state
  }
}

module.exports = StrategyState
