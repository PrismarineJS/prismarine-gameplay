const mineflayer = require('mineflayer')
const pathfinder = require('mineflayer-pathfinder').pathfinder
const mineflayerViewer = require('prismarine-viewer').mineflayer
const { gameplay, MoveTo, BreakBlock } = require('prismarine-gameplay')

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

const ChatMessage = require('prismarine-chat')('1.16')
bot.on('message', message => console.log(new ChatMessage(message).toString()))

function run (message) {
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

    case /^break -?[0-9]+ -?[0-9]+ -?[0-9]+$/.test(message):
      bot.gameplay.solveFor(
        new BreakBlock({
          position: new Vec3(
            parseInt(command[1]),
            parseInt(command[2]),
            parseInt(command[3])
          )
        })
      )
      break

    case /^collect [a-zA-Z_]+$/.test(message):
      bot.gameplay.solveFor(
        new ObtainItem({
          itemType: require('minecraft-data')(bot.version).blocksByName[
            command[1]
          ].id
        })
      )
      break

    case /^stop$/.test(message):
      bot.chat('Stopping')
      break
  }
}

const readline = require('readline')
const { Vec3 } = require('vec3')
const { ObtainItem } = require('../lib/dependencies/obtainItem')
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function consoleInput () {
  rl.question('> ', function (message) {
    bot.chat(message)
    run(message)
    consoleInput()
  })
}

consoleInput()
