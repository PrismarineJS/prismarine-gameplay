"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BreakBlockStrategy = void 0;
var BreakBlockStrategy = (function () {
    function BreakBlockStrategy(bot) {
        this.bot = bot;
    }
    BreakBlockStrategy.prototype.modifyState = function (state) {
        throw new Error("Method not implemented.");
    };
    BreakBlockStrategy.prototype.isValid = function (state, goal) {
        throw new Error("Method not implemented.");
    };
    BreakBlockStrategy.prototype.estimateExecutionTime = function (state) {
        return 20;
    };
    BreakBlockStrategy.prototype.estimateHeuristic = function (state, goal) {
        throw new Error("Method not implemented.");
    };
    BreakBlockStrategy.prototype.execute = function (targets, cb) {
        throw new Error("Method not implemented.");
    };
    return BreakBlockStrategy;
}());
exports.BreakBlockStrategy = BreakBlockStrategy;
