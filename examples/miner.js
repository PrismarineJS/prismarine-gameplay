const mineflayer = require('mineflayer')
const pathfinder = require('mineflayer-pathfinder').pathfinder
const mineflayerViewer = require('prismarine-viewer').mineflayer
const { gameplay, MoveTo } = require('prismarine-gameplay')

if (process.argv.length < 4 || process.argv.length > 6) {
  console.log('Usage : node miner.js <host> <port> [<name>] [<password>]')
  process.exit(1)
}

const bot = mineflayer.createBot({
  host: process.argv[2],
  port: parseInt(process.argv[3]),
  username: process.argv[4] ? process.argv[4] : 'collect_items',
  password: process.argv[5]
})

bot.loadPlugin(pathfinder)
bot.loadPlugin(gameplay)

bot.once('spawn', () => {
  mineflayerViewer(bot, { firstPerson: true, port: 3000 })
})

bot.on('chat', (username, message) => {
  console.log(`${username}: ${message}`)

  const command = message.split(' ')
  switch (true) {
    case /^moveto -?[0-9]+ -?[0-9]+$/.test(message):
      bot.gameplay.solveFor(
        new MoveTo({
          x: parseInt(command[1]),
          z: parseInt(command[2])
        })
      )
      break

    case /^moveto -?[0-9]+ -?[0-9]+ -?[0-9]+$/.test(message):
      bot.gameplay.solveFor(
        new MoveTo({
          x: parseInt(command[1]),
          y: parseInt(command[2]),
          z: parseInt(command[3])
        })
      )
      break

    case /^collect [a-zA-Z_]+$/.test(message):
      bot.chat('Mining for ' + command[1])
      break

    case /^stop$/.test(message):
      bot.chat('Stopping')
      bot.gameplay.stopAll()
      break
  }
})

const readline = require('readline')
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function consoleInput () {
  rl.question('> ', function (message) {
    bot.chat(message)
    consoleInput()
  })
}

consoleInput()
