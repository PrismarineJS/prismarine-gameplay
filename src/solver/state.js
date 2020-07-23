class SolverState {
  constructor (bot, targets) {
    this.bot = bot
    this.targets = targets
  }

  clone () {
    const state = new SolverState()

    for (const prop in this) state[prop] = this[prop]
    state.targets = state.targets.clone()

    return state
  }
}

module.exports = SolverState
