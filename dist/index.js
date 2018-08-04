"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var assign = require("lodash/assign");
var parser_1 = require("./parser");
var util_1 = require("./util");
var ScheduleInfo = (function () {
    function ScheduleInfo(pattern) {
        var date = new Date;
        assign(this, parser_1.parseDateString(pattern), parser_1.parseDateStatement(pattern, date));
        this.pattern = pattern;
        this.once = util_1.shouldRunOnce(this);
        this.nextTick = util_1.getNextTick(this, date);
        if (this.getState() === -1)
            throw new RangeError("Schedule pattern is already expired.");
    }
    ScheduleInfo.prototype.getState = function () {
        var state = util_1.getTicKState(this, this.nextTick);
        if (state === 0)
            this.nextTick = util_1.getNextTick(this);
        return state;
    };
    ScheduleInfo.prototype.getBestTimeout = function () {
        return util_1.getBestTimeout(this.nextTick);
    };
    ScheduleInfo.prototype.getBestInterval = function () {
        return util_1.getBestInterval(this.nextTick);
    };
    return ScheduleInfo;
}());
exports.ScheduleInfo = ScheduleInfo;
function parse(pattern) {
    return new ScheduleInfo(pattern);
}
exports.parse = parse;
exports.default = parse;
//# sourceMappingURL=index.js.map