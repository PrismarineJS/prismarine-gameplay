const Strategy = require('../src/solver/strategy')
const Solver = require('../src/solver/solver')
const SolverState = require('../src/solver/state')

class ColorStrat extends Strategy {
  constructor (color) {
    super()
    this.color = color
  }

  execute (cb) {
    console.log(`${this.color} Strategy Executed`)

    if (cb) cb()
  }

  isValid (state) {
    return state.last !== this.color
  }

  modifyState (state) {
    if (state[this.color] === undefined) state[this.color] = 1
    else state[this.color]++

    state.last = this.color
  }
}

const strats = [
  new ColorStrat('Red'),
  new ColorStrat('Blue'),
  new ColorStrat('Green'),
  new ColorStrat('Purple')
]

const goal = {
  Red: 3,
  Blue: 1,
  Green: 2,
  Purple: 0
}

const state = new SolverState(this.bot)
state.Red = 0
state.Blue = 0
state.Green = 0
state.Purple = 0

const solver = new Solver(state, goal, strats)

solver.once('solutionFound', result => {
  console.log(`Found solution in ${result.steps} steps.`)

  for (const task of result.taskList) task.execute()

  process.exit(0)
})

solver.once('noSolutionAvailable', result => {
  console.log(`No solution found in ${result.steps} steps.`)
  process.exit(0)
})

while (true) {
  solver.update()
}
