const SolverNode = require('./node')
const EventEmitter = require('events').EventEmitter
const Heap = require('heap')

class Solver extends EventEmitter {
  constructor (initialState, goal, strategies) {
    super()

    this.initialState = initialState
    this.goal = goal
    this.strategies = strategies
    this.openNodes = new Heap((a, b) => a.fScore - b.fScore)

    const initial = new SolverNode(goal, initialState, goal.targets)
    this.openNodes.push(initial)
  }

  update () {
    if (this.openNodes.size === 0) {
      this.emit('noSolutionAvailable')
      return
    }

    const node = this.openNodes.pop()
    for (const strat of this.strategies) {
      const child = node.createChild()
      child.task = strat
      strat.modifyState(child.state)

      if (!strat.isValid(child.state)) continue

      child.cost += strat.estimateExecutionTime(child.state)
      child.heuristic = strat.estimateHeuristic(child.state, child.goal)

      this.openNodes.push(child)
    }
  }
}

module.exports = Solver
