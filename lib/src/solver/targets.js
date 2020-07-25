"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Targets = void 0;
var Targets = (function () {
    function Targets() {
    }
    Targets.prototype.clone = function () {
        var targets = new Targets();
        for (var prop in this)
            targets[prop] = this[prop];
        return targets;
    };
    return Targets;
}());
exports.Targets = Targets;
