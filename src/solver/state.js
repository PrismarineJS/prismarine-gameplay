const Targets = require('./targets')

class SolverState {
  constructor (bot, targets) {
    if (targets === undefined) targets = new Targets()

    this.bot = bot
    this.targets = targets
    this.flags = {}
  }

  clone () {
    const state = new SolverState()

    for (const prop in this) state[prop] = this[prop]

    state.targets = state.targets.clone()
    state.flags = {}

    for (const prop in this.flags) state.flags[prop] = this.flags[prop]

    return state
  }
}

module.exports = SolverState
