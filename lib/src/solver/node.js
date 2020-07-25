"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SolverNode = void 0;
var SolverNode = (function () {
    function SolverNode(state) {
        this.cost = 0;
        this.heuristic = 0;
        this.state = state;
        this.depth = 0;
    }
    Object.defineProperty(SolverNode.prototype, "fScore", {
        get: function () {
            return this.cost + this.heuristic;
        },
        enumerable: false,
        configurable: true
    });
    SolverNode.prototype.createChild = function () {
        var node = new SolverNode(this.state.clone());
        node.cost = this.cost;
        node.heuristic = this.heuristic;
        node.parent = this;
        node.depth = this.depth + 1;
        return node;
    };
    return SolverNode;
}());
exports.SolverNode = SolverNode;
