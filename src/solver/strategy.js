class Strategy {
  estimateExecutionTime (state) {
    return 10
  }

  execute (cb) {
    // Do nothing by default

    cb()
  }

  modifyState (state) {
    // Do nothing by default
  }

  estimateHeuristic (state, goal) {
    let h = 0

    for (const flagName in goal) {
      const flagVal = goal[flagName]
      let flagH = 0

      switch (typeof flagVal) {
        case 'number':
          if (state.flags[flagName] === undefined) flagH = flagVal
          else flagH = Math.abs(state.flags[flagName] - flagVal)
          break

        default:
          if (state.flags[flagName] !== flagVal) flagH = 10
          break
      }

      if (!isNaN(flagH)) h += flagH * 10
    }

    return h
  }

  isValid (state) {
    return true
  }
}

module.exports = Strategy
