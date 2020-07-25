"use strict";
var CollectItem = require('./strats/collectItem').CollectItem;
var CollectBlock = require('./strats/collectBlock').CollectBlock;
var WaitForTime = require('./strats/waitForTime').WaitForTime;
var WaitForItemDrop = require('./strats/waitForItemDrop').WaitForItemDrop;
function loadDefaultStrategies(gameplay) {
    gameplay.addStrategy(new CollectItem(gameplay.bot));
    gameplay.addStrategy(new CollectBlock(gameplay.bot));
    gameplay.addStrategy(new WaitForTime(gameplay.bot));
    gameplay.addStrategy(new WaitForItemDrop(gameplay.bot));
}
var Gameplay = (function () {
    function Gameplay(bot, loadDefault) {
        if (loadDefault === void 0) { loadDefault = true; }
        this.bot = bot;
        this.strategies = [];
        this.activeStrategy = null;
        if (loadDefault)
            loadDefaultStrategies(this);
    }
    Gameplay.prototype.addStrategy = function (strategy) {
        var _this = this;
        this.strategies.push(strategy);
        this[strategy.name] = function (options, cb) {
            if (_this.activeStrategy !== null) {
                cb(new Error("Strategy " + _this.activeStrategy.name + " is still active!"));
                return;
            }
            try {
                _this.activeStrategy = strategy;
                strategy.run(options, function (err, returns) {
                    _this.activeStrategy = null;
                    cb(err, returns);
                });
            }
            catch (err) {
                _this.activeStrategy = null;
                cb(err);
            }
        };
    };
    Gameplay.prototype.stopAll = function () {
        if (this.activeStrategy !== null)
            this.activeStrategy.exit();
    };
    return Gameplay;
}());
module.exports = { Gameplay: Gameplay };
