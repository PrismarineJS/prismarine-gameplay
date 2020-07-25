"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StrategyBase = void 0;
var StrategyBase = (function () {
    function StrategyBase() {
    }
    StrategyBase.prototype.estimateExecutionTime = function (state) {
        return 10;
    };
    StrategyBase.prototype.execute = function (targets, cb) {
        cb();
        return true;
    };
    StrategyBase.prototype.modifyState = function (state) {
    };
    StrategyBase.prototype.estimateHeuristic = function (state, goal) {
        var h = 0;
        for (var flagName in goal) {
            var flagVal = goal[flagName];
            var flagH = 0;
            switch (typeof flagVal) {
                case 'number':
                    if (state[flagName] === undefined)
                        flagH = (flagVal + 1) * 10;
                    else
                        flagH = Math.abs(state[flagName] - flagVal) * 10;
                    break;
                default:
                    if (state[flagName] !== flagVal)
                        flagH = 100;
                    break;
            }
            if (!isNaN(flagH))
                h += flagH;
            else
                h += 100;
        }
        return h;
    };
    StrategyBase.prototype.isValid = function (state, goal) {
        return true;
    };
    return StrategyBase;
}());
exports.StrategyBase = StrategyBase;
