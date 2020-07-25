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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Solver = void 0;
var events_1 = require("events");
var node_1 = require("./node");
var heap_1 = __importDefault(require("heap"));
var Solver = (function (_super) {
    __extends(Solver, _super);
    function Solver(initialState, goal, strategies, maxDepth) {
        if (maxDepth === void 0) { maxDepth = 50; }
        var _this = _super.call(this) || this;
        _this.goal = goal;
        _this.strategies = strategies;
        _this.openNodes = new heap_1.default(function (a, b) { return a.fScore - b.fScore; });
        _this.maxDepth = maxDepth;
        _this.steps = 0;
        var initial = new node_1.SolverNode(initialState);
        _this.openNodes.push(initial);
        return _this;
    }
    Solver.prototype.update = function () {
        if (this.openNodes.size() === 0) {
            this.emit('noSolutionAvailable', {
                steps: this.steps
            });
            return;
        }
        var node = this.openNodes.pop();
        this.steps++;
        if (this.isSolved(node)) {
            this.emit('solutionFound', {
                taskList: this.buildTaskList(node),
                steps: this.steps
            });
            return;
        }
        if (node.depth >= this.maxDepth)
            return;
        for (var _i = 0, _a = this.strategies; _i < _a.length; _i++) {
            var strat = _a[_i];
            var child = node.createChild();
            child.task = strat;
            strat.modifyState(child.state);
            if (!strat.isValid(child.state, this.goal))
                continue;
            child.cost += strat.estimateExecutionTime(child.state);
            child.heuristic = strat.estimateHeuristic(child.state, this.goal);
            this.openNodes.push(child);
        }
    };
    Solver.prototype.isSolved = function (node) {
        for (var prop in this.goal) {
            if (node.state[prop] !== this.goal[prop])
                return false;
        }
        return true;
    };
    Solver.prototype.buildTaskList = function (node) {
        var n = node;
        var list = [];
        while (n) {
            if (n.task)
                list.push(n.task);
            n = n.parent;
        }
        return list.reverse();
    };
    return Solver;
}(events_1.EventEmitter));
exports.Solver = Solver;
