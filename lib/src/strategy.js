"use strict";
var Strategy = (function () {
    function Strategy(name, bot) {
        this.name = name;
        this.bot = bot;
    }
    Strategy.prototype.run = function (options, cb) {
        cb();
    };
    Strategy.prototype.exit = function () { };
    return Strategy;
}());
module.exports = { Strategy: Strategy };
