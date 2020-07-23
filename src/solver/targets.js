class Targets {
  clone () {
    const targets = new Targets()
    for (const prop in this) targets[prop] = this[prop]

    return targets
  }
}

module.exports = Targets
