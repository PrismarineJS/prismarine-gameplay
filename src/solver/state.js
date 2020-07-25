const Targets = require('./targets')

class SolverState {
  constructor (bot, targets) {
    if (targets === undefined) targets = new Targets()

    this.bot = bot
    this.targets = targets
  }

  clone () {
    const state = new SolverState(this.bot, this.targets.clone())

    for (const prop in this) {
      if (state[prop] === undefined) state[prop] = this[prop]
    }

    return state
  }
}

module.exports = SolverState
