const mineflayer = require('mineflayer')
const pathfinder = require('mineflayer-pathfinder').pathfinder
const gameplay = require('prismarine-gameplay').gameplay
const mineflayerViewer = require('prismarine-viewer').mineflayer

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
  mineflayerViewer(bot, { port: 3000 })
})

bot.on('login', () => {
  const r = readline.start('> ')
  r.context.bot = bot

  r.on('exit', () => {
    bot.end()
  })
})

bot.on('chat', (username, message) => {
  if (username === bot.username) return

  const command = message.split(' ')
  switch (true) {
    case /^collect [a-zA-Z_]+$/.test(message):
      bot.chat('Mining for ' + command[1])
      bot.gameplay.api.collectBlock(
        {
          blockType: command[1],
          distance: 16
        },
        err => {
          if (err) {
            console.log(err)
            bot.chat(err.message)
          } else bot.chat('Operation complete.')
        }
      )
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
