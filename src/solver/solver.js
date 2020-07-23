const SolverNode = require('./node')
const EventEmitter = require('events').EventEmitter
const Heap = require('heap')

class Solver extends EventEmitter {
  constructor (initialState, goalFlags, strategies, maxDepth = 50) {
    super()

    this.initialState = initialState
    this.goalFlags = goalFlags
    this.strategies = strategies
    this.openNodes = new Heap((a, b) => a.fScore - b.fScore)
    this.maxDepth = maxDepth

    this.steps = 0

    const initial = new SolverNode(initialState)
    initial.depth = 0
    this.openNodes.push(initial)
  }

  update () {
    if (this.openNodes.size() === 0) {
      this.emit('noSolutionAvailable', {
        steps: this.steps
      })
      return
    }

    const node = this.openNodes.pop()
    this.steps++

    if (this._isSolved(node)) {
      this.emit('solutionFound', {
        taskList: this._buildTaskList(node),
        steps: this.steps
      })
      return
    }

    if (node.depth >= this.maxDepth) return

    for (const strat of this.strategies) {
      const child = node.createChild()
      child.task = strat
      child.depth = node.depth + 1

      if (!strat.isValid(child.state, this.goalFlags)) continue

      strat.modifyState(child.state)
      child.cost += strat.estimateExecutionTime(child.state)
      child.heuristic = strat.estimateHeuristic(child.state, this.goalFlags)

      this.openNodes.push(child)
    }
  }

  _isSolved (node) {
    for (const prop in this.goalFlags) {
      if (node.state.flags[prop] !== this.goalFlags[prop]) return false
    }

    return true
  }

  _buildTaskList (node) {
    const list = []
    while (node) {
      if (node.task) list.push(node.task)

      node = node.parent
    }

    return list.reverse()
  }
}

module.exports = Solver
