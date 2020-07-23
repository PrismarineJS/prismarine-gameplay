class Strategy {
  constructor (name) {
    this.name = name
  }

  isReadOnly () {
    return false
  }

  estimateExecutionTime (state) {
    if (this.isReadOnly()) return 1
    else return 10
  }

  execute (cb) {
    // Do nothing by default

    cb()
  }

  modifyState (state) {
    // Do nothing by default
  }

  estimateHeuristic (state, goal) {
    return 0
  }

  isValid (state) {
    return true
  }
}

module.exports = Strategy
