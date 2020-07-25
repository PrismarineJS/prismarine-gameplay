"use strict";
var mineflayer = require('mineflayer');
var pathfinder = require('mineflayer-pathfinder').pathfinder;
var gameplay = require('..').gameplay;
if (process.argv.length < 4 || process.argv.length > 6) {
    console.log('Usage : node miner.js <host> <port> [<name>] [<password>]');
    process.exit(1);
}
var bot = mineflayer.createBot({
    host: process.argv[2],
    port: parseInt(process.argv[3]),
    username: process.argv[4] ? process.argv[4] : 'collect_items',
    password: process.argv[5]
});
bot.loadPlugin(pathfinder);
bot.loadPlugin(gameplay);
bot.on('chat', function (username, message) {
    if (username === bot.username)
        return;
    var command = message.split(' ');
    switch (true) {
        case /^collect [a-zA-Z_]+$/.test(message):
            bot.chat('Mining for ' + command[1]);
            bot.gameplay.collectBlock({
                blockType: command[1],
                distance: 16
            }, function (err) {
                if (err)
                    console.log(err);
                bot.chat('Operation complete.');
            });
            break;
        case /^stop$/.test(message):
            bot.chat('Stopping');
            bot.gameplay.stopAll();
            break;
    }
});
