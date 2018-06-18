"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var trimRight = require("lodash/trimEnd");
var assign = require("lodash/assign");
var consts_1 = require("./consts");
function isWildcard(data) {
    return typeof data == "string" && data[0] == "*";
}
function getNum(str) {
    if (str === undefined) {
        return -1;
    }
    else if (isWildcard(str)) {
        return str;
    }
    else {
        var num = parseInt(str);
        return isNaN(num) ? -1 : num;
    }
}
function getPrevUsedProp(current, tick) {
    var started = false;
    for (var _i = 0, ReversedProps_1 = consts_1.ReversedProps; _i < ReversedProps_1.length; _i++) {
        var prop = ReversedProps_1[_i];
        if (started && tick[prop] != undefined)
            return prop;
        else if (prop == current)
            started = true;
    }
}
function getCurrentTick(date) {
    date = date || new Date();
    var day = date.getDay();
    return {
        year: date.getFullYear(),
        week: consts_1.currentWeek(date),
        day: day === 0 ? 7 : day,
        month: date.getMonth() + 1,
        date: date.getDate(),
        hours: date.getHours(),
        minutes: date.getMinutes(),
        seconds: date.getSeconds()
    };
}
exports.getCurrentTick = getCurrentTick;
var ScheduleInfo = (function () {
    function ScheduleInfo(pattern) {
        for (var _i = 0, Props_1 = consts_1.Props; _i < Props_1.length; _i++) {
            var prop = Props_1[_i];
            this[prop] = undefined;
        }
        var current = getCurrentTick();
        this.parseDateTime(pattern);
        this.parseStatement(pattern, current);
        this.once = true;
        this.nextTick = this.getNextTick(current);
        for (var _a = 0, Props_2 = consts_1.Props; _a < Props_2.length; _a++) {
            var prop = Props_2[_a];
            if (isWildcard(this[prop])) {
                this.once = false;
                break;
            }
        }
        if (this.realGetState() === -1) {
            throw new RangeError("Schedule pattern is already expired.");
        }
    }
    ScheduleInfo.prototype.parseDateTime = function (pattern) {
        var parts = pattern.split(/\s+/);
        var endings = ["st", "nd", "rd", "th"];
        for (var _i = 0, parts_1 = parts; _i < parts_1.length; _i++) {
            var part = parts_1[_i];
            var nums = void 0, isDate = false, isTime = false;
            if (part.indexOf(":") > 0) {
                nums = part.split(":");
                isTime = true;
            }
            else if (part.indexOf("-") > 0) {
                nums = part.split("-");
                isDate = true;
            }
            if (isDate || isTime) {
                var num1 = getNum(nums[0]);
                var num2 = getNum(nums[1]);
                var num3 = getNum(nums[2]);
                if (isDate) {
                    if (typeof num3 === "number" && num3 > 31 || num3 === -1) {
                        this.setDate(num3, num1, num2);
                    }
                    else {
                        this.setDate(num1, num2, num3);
                    }
                }
                else {
                    this.setTime(num1, num2, num3);
                }
            }
            else {
                var i = consts_1.Weekdays2.indexOf(part);
                if (i >= 0) {
                    this.day = i + 1;
                    continue;
                }
                var _part = trimRight(part, ".");
                i = consts_1.Months.indexOf(_part);
                if (i >= 0) {
                    this.month = i + 1;
                    continue;
                }
                var ending = part.substring(part.length - 2);
                var isNum = !isNaN(part);
                if (endings.indexOf(ending) >= 0 || (isNum && part.length == 2)) {
                    var num = parseInt(part) || -1;
                    if (this.date === undefined && num >= 1 && num <= 31)
                        this.date = num;
                }
                else if (isNum) {
                    var num = parseInt(part) || -1;
                    if (this.year === undefined && num >= 1970)
                        this.year = num;
                }
            }
        }
    };
    ScheduleInfo.prototype.setProp = function (prop, val) {
        if (typeof val == "number") {
            var min = consts_1.Beginnings[prop], max = consts_1.Endings[prop];
            this[prop] = (val >= min && val <= max) ? val : undefined;
        }
        else if (isWildcard(val)) {
            this[prop] = val;
        }
    };
    ScheduleInfo.prototype.setDate = function (year, month, date) {
        this.setProp("year", year);
        this.setProp("month", month);
        this.setProp("date", date);
    };
    ScheduleInfo.prototype.setTime = function (hours, minutes, seconds) {
        this.setProp("hours", hours);
        this.setProp("minutes", minutes);
        this.setProp("seconds", seconds);
    };
    ScheduleInfo.prototype.correctDate = function (tick, num, current, force) {
        if (force === void 0) { force = false; }
        var date = tick.date;
        if (isWildcard(this.month) && typeof tick.month == "number") {
            tick.month = tick.month + Math.floor(date / num);
        }
        else if (force) {
            tick.month = current.month + Math.floor(date / num);
        }
        tick.date = date % num;
    };
    ScheduleInfo.prototype.correctTick = function (tick, prop, current, force) {
        if (force === void 0) { force = false; }
        current = current || getCurrentTick();
        var ending = consts_1.Endings[prop];
        if (prop == "date") {
            if (typeof tick.date != "number")
                return;
            var year = void 0;
            var month = void 0;
            if (tick.month === undefined || isWildcard(tick.month))
                month = current.month;
            else
                month = tick.month;
            if (tick.year === undefined || isWildcard(tick.year))
                year = current.year;
            else
                year = tick.year;
            if (month == 2) {
                if (year % 4 && tick.date > 28) {
                    this.correctDate(tick, 28, current, force);
                }
                else if (tick.date > 29) {
                    this.correctDate(tick, 29, current, force);
                }
            }
            else if (consts_1.BigMonths.indexOf(month) >= 0 && tick.date > 31) {
                this.correctDate(tick, 31, current, force);
            }
            else if (tick.date > 30) {
                this.correctDate(tick, 30, current, force);
            }
        }
        else if (typeof tick[prop] == "number" && tick[prop] > ending) {
            var i = consts_1.ReversedProps.indexOf(prop), step = prop == "month" ? 3 : 1, prev = consts_1.ReversedProps[i + step];
            ending = (prop == "day" || prop == "month") ? ending : ending + 1;
            if (prev && isWildcard(this[prev]) && tick[prop] <= current[prop]) {
                tick[prev] += Math.floor(tick[prop] / ending);
            }
            else if (prev && force) {
                tick[prev] = current[prev] + Math.floor(tick[prop] / ending);
            }
            tick[prop] %= ending;
        }
    };
    ScheduleInfo.prototype.parseStatement = function (pattern, current) {
        current = current || getCurrentTick();
        var units1 = ["days", "months", "years", "weeks"];
        var units2 = ["hour", "minute", "second"];
        var matches = [
            pattern.match(/(on)\s+(\w+)/),
            pattern.match(/(every)\s+(\w+)/),
            pattern.match(/(in|after)\s+(this|next|\d+)\s+(\w+)/),
            pattern.match(/(every|in|after)\s+(\d+)\s+(\w+)/),
            pattern.match(/today|tomorrow|the\s+(\w+)\s+after\s+(.+)/),
            pattern.match(/(this|next)\s+(\w+)/)
        ];
        for (var _i = 0, matches_1 = matches; _i < matches_1.length; _i++) {
            var match = matches_1[_i];
            if (!match)
                continue;
            var prep = void 0;
            var num = void 0;
            var unit = void 0;
            var prop = void 0;
            if (match.length === 4) {
                prep = match[1];
                unit = match[3];
                var target = match[2];
                if (target === "this")
                    num = 0;
                else if (target === "next")
                    num = 1;
                else
                    num = parseInt(target) || -1;
            }
            else if (match[1] === "this" || match[1] == "next") {
                num = match[1] === "this" ? 0 : 1;
                unit = match[2];
            }
            else if (match[1] === "every" || match[1] === "on") {
                prep = match[1];
                num = 1;
                unit = match[2];
            }
            else if (match[0] === "today") {
                num = 0;
            }
            else if (match[0] === "tomorrow") {
                num = 1;
            }
            else if (match[0].split(/\s+/)[0] === "the") {
                if (match[1] === "day" && match[2] === "tomorrow") {
                    num = 2;
                }
                else {
                    var parts = match[2].split(/\s+/);
                    if (parts[0] === "this")
                        num = 0;
                    else if (parts[0] === "next")
                        num = 1;
                    else
                        num = parseInt(parts[0]) || -1;
                    unit = parts[1];
                    num = num >= 0 ? num + 1 : num;
                }
            }
            prep = prep || "in";
            unit = unit || "day";
            var i = consts_1.Weekdays.indexOf(unit);
            if (i >= 0) {
                this.day = i + 1;
                if (prep == "every") {
                    this.week = "*";
                }
                else {
                    this.week = current.week + num;
                    this.correctTick(this, "week", current, true);
                }
                continue;
            }
            if (num === -1)
                continue;
            if (num >= 1 && units1.indexOf(unit) >= 0) {
                unit = unit.substring(0, unit.length - 1);
            }
            else if (num === 1 && units2.indexOf(unit) >= 0) {
                unit += "s";
            }
            if (unit == "day") {
                prop = "date";
            }
            else {
                prop = unit;
            }
            i = consts_1.Props.indexOf(prop);
            if (i >= 0) {
                if (prep === "in" || prep === "after") {
                    num = prep == "in" ? num : (num + 1);
                    this[prop] = current[prop] + num;
                    this.correctTick(this, prop, current, true);
                }
                else if (prep == "every") {
                    this[prop] = num == 1 ? "*" : "*/" + num;
                    for (var j = i - 1; j >= 0; j--) {
                        if (this[consts_1.Props[j]] !== undefined)
                            break;
                        else
                            this[consts_1.Props[j]] = "*";
                    }
                }
            }
        }
    };
    ScheduleInfo.prototype.getState = function () {
        var current = getCurrentTick();
        var state = this.realGetState(current);
        if (state <= 0)
            this.nextTick = this.getNextTick(current);
        return state;
    };
    ScheduleInfo.prototype.realGetState = function (current, tick) {
        current = current || getCurrentTick();
        tick = tick || this.nextTick;
        var state = -1;
        for (var i in consts_1.Props) {
            var prop = consts_1.Props[i];
            if (tick[prop] === undefined) {
                continue;
            }
            else if (tick[prop] === current[prop]) {
                state = 0;
            }
            else if (tick[prop] > current[prop]) {
                state = 1;
                break;
            }
            else {
                state = -1;
                break;
            }
        }
        return state;
    };
    ScheduleInfo.prototype.getNextTick = function (current) {
        current = current || getCurrentTick();
        consts_1.Beginnings.year = current.year + 1;
        var tick = {};
        var wildcard1;
        var wildcard2;
        var wildcard3;
        for (var _i = 0, ReversedProps_2 = consts_1.ReversedProps; _i < ReversedProps_2.length; _i++) {
            var prop = ReversedProps_2[_i];
            if (this[prop] === undefined) {
                continue;
            }
            else if (typeof this[prop] == "number") {
                tick[prop] = this[prop];
            }
            else if (isWildcard(this[prop])) {
                var num = parseInt(this[prop].split("/")[1]);
                if (isNaN(num)) {
                    var _prop = getPrevUsedProp(prop, this);
                    num = !_prop || tick[_prop] > current[_prop] ? 1 : 0;
                }
                if (wildcard1 === undefined) {
                    wildcard1 = [prop, num];
                    tick[prop] = consts_1.Beginnings[prop];
                }
                else if (wildcard2 === undefined) {
                    wildcard2 = [prop, num];
                    tick[prop] = current[prop] + num;
                    this.correctTick(tick, prop, current);
                }
                else {
                    tick[prop] = current[prop];
                    if (wildcard3 === undefined)
                        wildcard3 = [prop, num];
                }
            }
        }
        if (wildcard1) {
            if (wildcard2 === undefined) {
                var prop = wildcard1[0], num = wildcard1[1];
                tick[prop] = current[prop] + num;
                this.correctTick(tick, prop, current);
            }
            else {
                var prop1 = wildcard1[0], num1 = wildcard1[1];
                var prop2 = wildcard2[0];
                var _tick = assign({}, tick);
                _tick[prop1] = current[prop1] + num1;
                _tick[prop2] = current[prop2];
                this.correctTick(tick, prop1, current);
                if (this.realGetState(current, _tick) !== -1) {
                    tick = _tick;
                }
                else if (this.realGetState(current, tick) === -1) {
                    tick[prop2] = consts_1.Beginnings[prop2];
                    if (wildcard3) {
                        var prop3 = wildcard3[0];
                        tick[prop3] = consts_1.Beginnings[prop3];
                    }
                }
            }
        }
        return tick;
    };
    ScheduleInfo.prototype.getBestInterval = function () {
        var intervals = {
            seconds: 1000,
            minutes: 1000 * 60,
            hours: 1000 * 60 * 60,
            date: 1000 * 60 * 60 * 24,
            week: 1000 * 60 * 60 * 24 * 7,
        };
        var interval;
        for (var prop in intervals) {
            if (this[prop] !== undefined) {
                interval = intervals[prop];
                break;
            }
        }
        return interval || intervals.week;
    };
    ScheduleInfo.prototype.getBestTimeout = function () {
        var now = new Date();
        var tick = getCurrentTick(now);
        var lastProp;
        for (var i_1 in consts_1.ReversedProps) {
            var prop_1 = consts_1.ReversedProps[i_1];
            if (this.nextTick[prop_1] !== undefined) {
                tick[prop_1] = this.nextTick[prop_1];
                if (!lastProp) {
                    lastProp = { name: prop_1 };
                    if (isWildcard(this[prop_1])) {
                        var val = this[prop_1].split("/")[0] || "1";
                        lastProp.value = parseInt(val);
                    }
                }
            }
            else if (this.nextTick[prop_1] === undefined && !lastProp) {
                tick[prop_1] = consts_1.Beginnings[prop_1];
            }
        }
        var i = consts_1.Props.lastIndexOf(lastProp.name);
        var prop = consts_1.Props[i + 1];
        if (prop !== undefined)
            tick[prop] = consts_1.Beginnings[prop];
        var year = tick.year, month = tick.month, date = tick.date, hours = tick.hours, minutes = tick.minutes, seconds = tick.seconds;
        var target = new Date(year, month - 1, date, hours, minutes, seconds);
        var step = lastProp.value || 1;
        var timeout = (target.getTime() - now.getTime()) * step;
        timeout = timeout > consts_1.TimeoutLimit ? consts_1.TimeoutLimit : timeout;
        return timeout;
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