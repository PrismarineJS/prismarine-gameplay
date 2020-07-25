"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var Strategy = require('../src/solver/strategy');
var Solver = require('../src/solver/solver');
var SolverState = require('../src/solver/state');
var Targets = require('../src/solver/targets');
var ColorStrat = (function (_super) {
    __extends(ColorStrat, _super);
    function ColorStrat(color) {
        var _this = _super.call(this) || this;
        _this.color = color;
        return _this;
    }
    ColorStrat.prototype.execute = function (cb) {
        console.log(this.color + " Strategy Executed");
        if (cb)
            cb();
    };
    ColorStrat.prototype.modifyState = function (state) {
        if (state[this.color] === undefined)
            state[this.color] = 1;
        else
            state[this.color]++;
        state.last = this.color;
    };
    return ColorStrat;
}(Strategy));
var strats = [
    new ColorStrat('Red'),
    new ColorStrat('Blue'),
    new ColorStrat('Green'),
    new ColorStrat('Purple')
];
var goal = {
    Red: 3,
    Blue: 1,
    Green: 2,
    Purple: 0
};
var state = new SolverState(this.bot);
state.Red = 0;
state.Blue = 0;
state.Green = 0;
state.Purple = 0;
var solver = new Solver(state, goal, strats);
solver.once('solutionFound', function (result) {
    console.log("Found solution in " + result.steps + " steps.");
    var targets = new Targets();
    for (var _i = 0, _a = result.taskList; _i < _a.length; _i++) {
        var task = _a[_i];
        task.execute(targets);
    }
    process.exit(0);
});
solver.once('noSolutionAvailable', function (result) {
    console.log("No solution found in " + result.steps + " steps.");
    process.exit(0);
});
while (true) {
    solver.update();
}
