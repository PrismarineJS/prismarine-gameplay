const mineflayer = require('mineflayer')
const pathfinder = require('mineflayer-pathfinder').pathfinder
const gameplay = require('../').gameplay

if (process.argv.length < 4 || process.argv.length > 6) {
  console.log(
    'Usage : node collectItems.js <host> <port> [<name>] [<password>]'
  )
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

bot.on('chat', (username, message) => {
  switch (true) {
    case /^collect$/.test(message):
      collectItems()
      break
  }
})

function collectItems () {
  bot.gameplay.runStrategy(
    'collect_item',
    {
      distance: 20
    },
    err => {
      if (err) console.log(err)
    }
  )
}
