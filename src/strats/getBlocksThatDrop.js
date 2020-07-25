const Strategy = require('../solver/strategy')

function getBlockTypesByDrops (mcData, blockType) {
  const targetId = mcData.blocksByName[blockType].id
  const blocks = []

  for (const block of mcData.blocksArray) {
    for (const drop of block.drops) {
      if (drop === targetId) {
        blocks.push(block.name)
        break
      }
    }
  }

  return blocks
}

class GetBlocksThatDropStrategy extends Strategy {
  constructor (bot) {
    super()
    this.bot = bot
  }

  estimateExecutionTime () {
    return 1
  }

  modifyState (state) {
    this._findBlocks(state.targets)
  }

  execute (targets, cb) {
    this._findBlocks(targets)
    cb()
  }

  _findBlocks (targets) {
    if (targets.blockTypes === undefined) return

    if (this.mcData === undefined) {
      this.mcData = require('minecraft-data')(this.bot.version)
    }

    const blockTypes = []
    for (const type of targets.blockTypes) {
      blockTypes.push(...getBlockTypesByDrops(this.mcData, type))
    }

    targets.blockTypes = blockTypes
  }

  isValid (state) {
    if (state.targets.blockTypes === undefined) return false

    return state.targets.blockTypes.length > 0
  }
}

module.exports = GetBlocksThatDropStrategy
