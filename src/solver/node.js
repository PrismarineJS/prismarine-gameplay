class SolverNode {
  constructor (goal, state, targets) {
    this.goal = goal
    this.state = state
    this.targets = targets

    this._cost = 0
    this._heuristic = 0
    this._fScore = 0
    this.task = null
    this.parent = null
  }

  set cost (value) {
    this._cost = value
    this.fScore = this._cost + this._heuristic
  }

  get cost () {
    return this._cost
  }

  set heuristic (value) {
    this._heuristic = value
    this.fScore = this._cost + this._heuristic
  }

  get heuristic () {
    return this._heuristic
  }

  get fScore () {
    return this.fScore
  }

  createChild () {
    const goal = this.goal
    const state = this.state.clone()
    const targets = this.targets.clone()

    const node = new SolverNode(goal, state, targets)
    node.cost = this.cost
    node.heuristic = this.heuristic
    node.parent = this

    return node
  }
}

module.exports = SolverNode
