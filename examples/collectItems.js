const mineflayer = require('mineflayer')
const pathfinder = require('mineflayer-pathfinder')
const gameplay = require('../')

const bot = mineflayer.createBot({
  host: 'localhost',
  port: 25565,
  username: 'ItemCollector'
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
