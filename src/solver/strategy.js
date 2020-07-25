class Strategy {
  estimateExecutionTime () {
    return 10
  }

  execute (cb) {
    // Do nothing by default

    cb()
  }

  modifyState () {
    // Do nothing by default
  }

  estimateHeuristic (state, goal) {
    let h = 0

    for (const flagName in goal) {
      const flagVal = goal[flagName]
      let flagH = 0

      switch (typeof flagVal) {
        case 'number':
          if (state[flagName] === undefined) flagH = (flagVal + 1) * 10
          else flagH = Math.abs(state[flagName] - flagVal) * 10
          break

        default:
          if (state[flagName] !== flagVal) flagH = 100
          break
      }

      if (!isNaN(flagH)) h += flagH
      else h += 100
    }

    return h
  }

  isValid () {
    return true
  }
}

module.exports = Strategy
