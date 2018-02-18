"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const currentWeekNumber = require("current-week-number");
const string_trimmer_1 = require("string-trimmer");
const currentWeek = currentWeekNumber;
const Months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sept",
    "Oct",
    "Nov",
    "Dec"
];
const Weekdays = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday"
];
const Weekdays2 = ["Mon", "Tues", "Wed", "Thurs", "Fri", "Sat", "Sun"];
const Props = [
    "year",
    "week",
    "day",
    "month",
    "date",
    "hours",
    "minutes",
    "seconds"
];
const ReversedProps = Object.assign([], Props).reverse();
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
        week: currentWeek(date),
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
        for (let prop of Props) {
            this[prop] = undefined;
        }
        let current = getCurrentTick();
        this.parseDateTime(pattern);
        this.parseStatement(pattern, current);
        this.once = true;
        this.nextTick = this.getNextTick(current);
        for (let prop of Props) {
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
                let i = Weekdays2.indexOf(part);
                if (i >= 0) {
                    this.day = i + 1;
                    continue;
                }
                let _part = string_trimmer_1.trimRight(part, ".");
                i = Months.indexOf(_part);
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
    setDate(year, month, date) {
        if (typeof year == "number")
            this.year = year >= 1970 ? year : undefined;
        else if (isWildcard(year))
            this.year = year;
        if (typeof month == "number")
            this.month = month >= 1 && month <= 12 ? month : undefined;
        else if (isWildcard(month))
            this.month = month;
        if (typeof date == "number")
            this.date = date >= 1 && date <= 31 ? date : undefined;
        else if (isWildcard(date))
            this.date = date;
    }
    setTime(hours, minutes, seconds) {
        if (typeof hours == "number")
            this.hours = hours >= 0 && hours <= 23 ? hours : undefined;
        else if (isWildcard(hours))
            this.hours = hours;
        if (typeof minutes == "number")
            this.minutes = minutes >= 0 && minutes <= 59 ? minutes : undefined;
        else if (isWildcard(minutes))
            this.minutes = minutes;
        if (typeof seconds == "number")
            this.seconds = seconds >= 0 && seconds <= 59 ? seconds : undefined;
        else if (isWildcard(seconds))
            this.seconds = seconds;
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
            let i = Weekdays.indexOf(unit);
            if (i >= 0) {
                this.day = i + 1;
                if (prep == "every")
                    this.week = "*";
                else
                    this.week = current.week + num;
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
            i = Props.indexOf(prop);
            if (i >= 0) {
                if (prep === "in" || prep === "after") {
                    num = prep == "in" ? num : (num + 1);
                    this[prop] = current[prop] + num;
                }
                else if (prep == "every") {
                    this[prop] = num == 1 ? "*" : `*/${num}`;
                    for (let j = i - 1; j >= 0; j--) {
                        if (this[Props[j]] !== undefined)
                            break;
                        else
                            this[Props[j]] = "*";
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
        for (let i in Props) {
            let prop = Props[i];
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
        let tick = {};
        let beginnings = {
            year: current.year + 1,
            week: 1,
            day: 1,
            month: 1,
            date: 1,
            hours: 0,
            minutes: 0,
            seconds: 0
        };
        let wildcard1;
        let wildcard2;
        let wildcard3;
        for (let prop of ReversedProps) {
            if (this[prop] === undefined || typeof this[prop] == "number") {
                tick[prop] = this[prop];
            }
            else if (isWildcard(this[prop])) {
                let num = parseInt(this[prop].split("/")[1]) || 1;
                if (wildcard1 === undefined) {
                    wildcard1 = [prop, num];
                    tick[prop] = beginnings[prop];
                }
                else if (wildcard2 === undefined) {
                    wildcard2 = [prop, num];
                    tick[prop] = current[prop] + num;
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
                tick[wildcard1[0]] = current[wildcard1[0]] + wildcard1[1];
            }
            else {
                let _tick = Object.assign({}, tick);
                _tick[wildcard1[0]] = current[wildcard1[0]] + wildcard1[1];
                _tick[wildcard2[0]] = current[wildcard2[0]];
                if (this.realGetState(current, _tick) !== -1) {
                    tick = _tick;
                }
                else if (this.realGetState(current, tick) === -1) {
                    tick[wildcard2[0]] = beginnings[wildcard2[0]];
                    if (wildcard3)
                        tick[wildcard3[0]] = current[wildcard3[0]] + wildcard3[1];
                }
            }
        }
        this.correctTick(tick);
        return tick;
    }
    correctTick(tick) {
        let bigMonths = [1, 3, 5, 7, 8, 10, 12];
        if (tick.seconds > 59) {
            if (isWildcard(this.minutes))
                tick.minutes += Math.floor(tick.seconds / 60);
            tick.seconds %= 60;
        }
        if (tick.minutes > 59) {
            if (isWildcard(this.hours))
                tick.hours += Math.floor(tick.minutes / 60);
            tick.minutes %= 60;
        }
        if (tick.hours > 23) {
            if (isWildcard(this.date))
                tick.date += Math.floor(tick.hours / 24);
            tick.hours %= 24;
        }
        if (tick.month == 2) {
            if ((!tick.year || tick.year % 4) && tick.date > 28) {
                if (isWildcard(this.month))
                    tick.month += Math.floor(tick.date / 28);
                tick.date %= 28;
            }
            else if (tick.date > 29) {
                if (isWildcard(this.month))
                    tick.month += Math.floor(tick.date / 29);
                tick.date %= 29;
            }
        }
        else if (bigMonths.includes(tick.month) && tick.date > 31) {
            if (isWildcard(this.month))
                tick.month += Math.floor(tick.date / 31);
            tick.date %= 31;
        }
        else if (tick.date > 30) {
            if (isWildcard(this.month))
                tick.month += Math.floor(tick.date / 30);
            tick.date %= 30;
        }
        let yearIncreased = false;
        if (tick.month > 12) {
            if (isWildcard(this.year)) {
                tick.year += Math.floor(tick.month / 12);
                yearIncreased = true;
            }
            tick.month %= 12;
        }
        if (tick.day > 7) {
            if (isWildcard(this.week))
                tick.week += Math.floor(tick.day / 7);
            tick.month %= 7;
        }
        if (tick.week > 52) {
            if (!yearIncreased && isWildcard(this.year))
                tick.year + Math.floor(tick.week / 52);
            tick.week %= 52;
        }
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
        for (let prop of Props) {
            if (this.nextTick[prop] !== undefined) {
                tick[prop] = this.nextTick[prop];
            }
        }
        let { year, month, date, hours, minutes, seconds } = tick;
        let target = new Date(year, month - 1, date, hours, minutes, seconds);
        return target.getTime() - now.getTime();
    }
}
exports.ScheduleInfo = ScheduleInfo;
function parse(pattern) {
    return new ScheduleInfo(pattern);
}
exports.parse = parse;
