"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SolverState = void 0;
var targets_1 = require("./targets");
var SolverState = (function () {
    function SolverState(bot, targets) {
        if (targets === undefined)
            targets = new targets_1.Targets();
        this.bot = bot;
        this.targets = targets;
    }
    SolverState.prototype.clone = function () {
        var state = new SolverState(this.bot, this.targets.clone());
        for (var prop in this)
            if (state[prop] === undefined)
                state[prop] = this[prop];
        return state;
    };
    return SolverState;
}());
exports.SolverState = SolverState;
