"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const string_trimmer_1 = require("string-trimmer");
const consts_1 = require("./consts");
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
        let num = parseInt(str);
        return isNaN(num) ? -1 : num;
    }
}
function getCurrentTick(date) {
    date = date || new Date();
    let day = date.getDay();
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
class ScheduleInfo {
    constructor(pattern) {
        for (let prop of consts_1.Props) {
            this[prop] = undefined;
        }
        let current = getCurrentTick();
        this.parseDateTime(pattern);
        this.parseStatement(pattern, current);
        this.once = true;
        this.nextTick = this.getNextTick(current);
        for (let prop of consts_1.Props) {
            if (isWildcard(this[prop])) {
                this.once = false;
                break;
            }
        }
        if (this.realGetState() === -1) {
            throw new RangeError("Schedule pattern is already expired.");
        }
    }
    parseDateTime(pattern) {
        let parts = pattern.split(/\s+/);
        for (let part of parts) {
            let nums, isDate = false, isTime = false;
            if (part.indexOf(":") > 0) {
                nums = part.split(":");
                isTime = true;
            }
            else if (part.indexOf("-") > 0) {
                nums = part.split("-");
                isDate = true;
            }
            if (isDate || isTime) {
                let num1 = getNum(nums[0]);
                let num2 = getNum(nums[1]);
                let num3 = getNum(nums[2]);
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
                let i = consts_1.Weekdays2.indexOf(part);
                if (i >= 0) {
                    this.day = i + 1;
                    continue;
                }
                let _part = string_trimmer_1.trimRight(part, ".");
                i = consts_1.Months.indexOf(_part);
                if (i >= 0) {
                    this.month = i + 1;
                    continue;
                }
                if (part.substring(part.length - 2) === "th") {
                    let num = parseInt(part) || -1;
                    if (this.date === undefined && num >= 1 && num <= 31)
                        this.date = num;
                }
                else if (!isNaN(part)) {
                    let num = parseInt(part) || -1;
                    if (this.year === undefined && num >= 1970)
                        this.year = num;
                }
            }
        }
    }
    setProp(prop, val) {
        if (typeof val == "number") {
            let min = consts_1.Beginnings[prop], max = consts_1.Endings[prop];
            this[prop] = (val >= min && val <= max) ? val : undefined;
        }
        else if (isWildcard(val)) {
            this[prop] = val;
        }
    }
    setDate(year, month, date) {
        this.setProp("year", year);
        this.setProp("month", month);
        this.setProp("date", date);
    }
    setTime(hours, minutes, seconds) {
        this.setProp("hours", hours);
        this.setProp("minutes", minutes);
        this.setProp("seconds", seconds);
    }
    correctDate(tick, num, current, force = false) {
        let date = tick.date;
        if (isWildcard(this.month) && typeof tick.month == "number") {
            tick.month = tick.month + Math.floor(date / num);
        }
        else if (force) {
            tick.month = current.month + Math.floor(date / num);
        }
        tick.date = date % num;
    }
    correctTick(tick, prop, current, force = false) {
        current = current || getCurrentTick();
        let ending = consts_1.Endings[prop];
        if (prop == "date") {
            if (typeof tick.date != "number")
                return;
            let year;
            let month;
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
            else if (consts_1.BigMonths.includes(month) && tick.date > 31) {
                this.correctDate(tick, 31, current, force);
            }
            else if (tick.date > 30) {
                this.correctDate(tick, 30, current, force);
            }
        }
        else if (typeof tick[prop] == "number" && tick[prop] > ending) {
            let i = consts_1.ReversedProps.indexOf(prop), step = prop == "month" ? 3 : 1, prev = consts_1.ReversedProps[i + step];
            ending = (prop == "day" || prop == "month") ? ending : ending + 1;
            if (prev && isWildcard(this[prev]) && tick[prop] <= current[prop]) {
                tick[prev] += Math.floor(tick[prop] / ending);
            }
            else if (prev && force) {
                tick[prev] = current[prev] + Math.floor(tick[prop] / ending);
            }
            tick[prop] %= ending;
        }
    }
    parseStatement(pattern, current) {
        current = current || getCurrentTick();
        let units1 = ["days", "months", "years", "weeks"];
        let units2 = ["hour", "minute", "second"];
        let matches = [
            pattern.match(/(on)\s+(\w+)/),
            pattern.match(/(every)\s+(\w+)/),
            pattern.match(/(in|after)\s+(this|next|\d+)\s+(\w+)/),
            pattern.match(/(every|in|after)\s+(\d+)\s+(\w+)/),
            pattern.match(/today|tomorrow|the\s+(\w+)\s+after\s+(.+)/),
            pattern.match(/(this|next)\s+(\w+)/)
        ];
        for (let match of matches) {
            if (!match)
                continue;
            let prep;
            let num;
            let unit;
            let prop;
            if (match.length === 4) {
                prep = match[1];
                unit = match[3];
                let target = match[2];
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
                    let parts = match[2].split(/\s+/);
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
            let i = consts_1.Weekdays.indexOf(unit);
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
            if (num >= 1 && units1.includes(unit)) {
                unit = unit.substring(0, unit.length - 1);
            }
            else if (num === 1 && units2.includes(unit)) {
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
                    this[prop] = num == 1 ? "*" : `*/${num}`;
                    for (let j = i - 1; j >= 0; j--) {
                        if (this[consts_1.Props[j]] !== undefined)
                            break;
                        else
                            this[consts_1.Props[j]] = "*";
                    }
                }
            }
        }
    }
    getState() {
        let current = getCurrentTick();
        let state = this.realGetState(current);
        if (state <= 0)
            this.nextTick = this.getNextTick(current);
        return state;
    }
    realGetState(current, tick) {
        current = current || getCurrentTick();
        tick = tick || this.nextTick;
        let state = -1;
        for (let i in consts_1.Props) {
            let prop = consts_1.Props[i];
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
    }
    getNextTick(current) {
        current = current || getCurrentTick();
        consts_1.Beginnings.year = current.year + 1;
        let tick = {};
        let wildcard1;
        let wildcard2;
        let wildcard3;
        for (let prop of consts_1.ReversedProps) {
            if (this[prop] === undefined) {
                continue;
            }
            else if (typeof this[prop] == "number") {
                tick[prop] = this[prop];
            }
            else if (isWildcard(this[prop])) {
                let num = parseInt(this[prop].split("/")[1]) || 1;
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
                let [prop, num] = wildcard1;
                tick[prop] = current[prop] + num;
                this.correctTick(tick, prop, current);
            }
            else {
                let [prop1, num1] = wildcard1;
                let [prop2, num2] = wildcard2;
                let _tick = Object.assign({}, tick);
                _tick[prop1] = current[prop1] + num1;
                _tick[prop2] = current[prop2];
                this.correctTick(tick, prop1, current);
                if (this.realGetState(current, _tick) !== -1) {
                    tick = _tick;
                }
                else if (this.realGetState(current, tick) === -1) {
                    tick[prop2] = consts_1.Beginnings[prop2];
                    if (wildcard3) {
                        let [prop3] = wildcard3;
                        tick[prop3] = consts_1.Beginnings[prop3];
                    }
                }
            }
        }
        return tick;
    }
    getBestInterval() {
        let intervals = {
            seconds: 1000,
            minutes: 1000 * 60,
            hours: 1000 * 60 * 60,
            date: 1000 * 60 * 60 * 24,
            week: 1000 * 60 * 60 * 24 * 7,
        };
        let interval;
        for (let prop in intervals) {
            if (this[prop] !== undefined) {
                interval = intervals[prop];
                break;
            }
        }
        return interval || intervals.week;
    }
    getBestTimeout(deviation = 0) {
        let now = new Date();
        let tick = getCurrentTick(now);
        let lastProp;
        for (let i in consts_1.ReversedProps) {
            let prop = consts_1.ReversedProps[i];
            if (this.nextTick[prop] !== undefined) {
                tick[prop] = this.nextTick[prop];
                if (!lastProp) {
                    lastProp = { name: prop };
                    if (isWildcard(this[prop])) {
                        let val = this[prop].split("/")[0] || "1";
                        lastProp.value = parseInt(val);
                    }
                }
            }
            else if (this.nextTick[prop] === undefined && !lastProp) {
                tick[prop] = consts_1.Beginnings[prop];
            }
        }
        let i = consts_1.Props.lastIndexOf(lastProp.name);
        let prop = consts_1.Props[i + 1];
        if (prop !== undefined)
            tick[prop] = consts_1.Beginnings[prop];
        let { year, month, date, hours, minutes, seconds } = tick;
        let target = new Date(year, month - 1, date, hours, minutes, seconds);
        let step = lastProp.value || 1;
        return (target.getTime() - now.getTime()) * step;
    }
}
exports.ScheduleInfo = ScheduleInfo;
function parse(pattern) {
    return new ScheduleInfo(pattern);
}
exports.parse = parse;
//# sourceMappingURL=index.js.map