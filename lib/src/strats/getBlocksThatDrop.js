"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetBlocksThatDropStrategy = void 0;
function getBlockTypesByDrops(mcData, blockType) {
    var targetId = mcData.blocksByName[blockType].id;
    var blocks = [];
    for (var _i = 0, _a = mcData.blocksArray; _i < _a.length; _i++) {
        var block = _a[_i];
        for (var _b = 0, _c = block.drops; _b < _c.length; _b++) {
            var drop = _c[_b];
            if (drop === targetId) {
                blocks.push(block.name);
                break;
            }
        }
    }
    return blocks;
}
var GetBlocksThatDropStrategy = (function () {
    function GetBlocksThatDropStrategy(bot) {
        this.bot = bot;
    }
    GetBlocksThatDropStrategy.prototype.modifyState = function (state) {
        this.findBlocks(state.targets);
    };
    GetBlocksThatDropStrategy.prototype.isValid = function (state) {
        if (state.targets.blockTypes === undefined)
            return false;
        return state.targets.blockTypes.length > 0;
    };
    GetBlocksThatDropStrategy.prototype.estimateExecutionTime = function (state) {
        return 1;
    };
    GetBlocksThatDropStrategy.prototype.estimateHeuristic = function (state, goal) {
        throw new Error("Method not implemented.");
    };
    GetBlocksThatDropStrategy.prototype.execute = function (targets, cb) {
        try {
            this.findBlocks(targets);
            cb();
        }
        catch (err) {
            cb(err);
        }
    };
    GetBlocksThatDropStrategy.prototype.findBlocks = function (targets) {
        if (targets.blockTypes === undefined)
            throw new Error("Block types not defined in targets!");
        if (this.mcData === undefined)
            this.mcData = require('minecraft-data')(this.bot.version);
        var blockTypes = [];
        for (var _i = 0, _a = targets.blockTypes; _i < _a.length; _i++) {
            var type = _a[_i];
            blockTypes.push.apply(blockTypes, getBlockTypesByDrops(this.mcData, type));
        }
        if (blockTypes.length === 0)
            throw new Error("No block types available!");
        targets.blockTypes = blockTypes;
    };
    return GetBlocksThatDropStrategy;
}());
exports.GetBlocksThatDropStrategy = GetBlocksThatDropStrategy;
