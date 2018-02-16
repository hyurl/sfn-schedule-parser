"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const currentWeek = require("current-week-number");
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
function getNum(str) {
    if (str === undefined) {
        return -1;
    }
    else if (str[0] == "*") {
        return str;
    }
    else {
        let num = parseInt(str);
        return isNaN(num) ? -1 : num;
    }
}
;
function getCurrentTick() {
    let date = new Date();
    return {
        year: date.getFullYear(),
        week: currentWeek(date),
        day: date.getDay(),
        month: date.getMonth() + 1,
        date: date.getDate(),
        hours: date.getHours(),
        minutes: date.getMinutes(),
        seconds: date.getSeconds()
    };
}
exports.getCurrentTick = getCurrentTick;
function correctTick(tick) {
    let bigMonths = [1, 3, 5, 7, 8, 10, 12];
    if (tick.seconds > 59) {
        if (tick.minutes !== undefined)
            tick.minutes += Math.floor(tick.seconds / 60);
        tick.seconds %= 60;
    }
    if (tick.minutes > 59) {
        if (tick.hours !== undefined)
            tick.hours += Math.floor(tick.minutes / 60);
        tick.minutes %= 60;
    }
    if (tick.hours > 23) {
        if (tick.date !== undefined)
            tick.date += Math.floor(tick.hours / 24);
        tick.hours %= 24;
    }
    if (tick.month == 2) {
        if ((!tick.year || tick.year % 4) && tick.date > 28) {
            if (tick.month !== undefined)
                tick.month += Math.floor(tick.date / 28);
            tick.date %= 28;
        }
        else if (tick.date > 29) {
            if (tick.month !== undefined)
                tick.month += Math.floor(tick.date / 29);
            tick.date %= 29;
        }
    }
    else if (bigMonths.includes(tick.month) && tick.date > 31) {
        if (tick.month !== undefined)
            tick.month += Math.floor(tick.date / 31);
        tick.date %= 31;
    }
    else if (tick.date > 30) {
        if (tick.month !== undefined)
            tick.month += Math.floor(tick.date / 30);
        tick.date %= 30;
    }
    if (tick.month > 12) {
        if (tick.year !== undefined)
            tick.year += Math.floor(tick.month / 12);
        tick.month %= 12;
    }
    if (tick.day > 7) {
        if (tick.week !== undefined)
            tick.week += Math.floor(tick.day / 7);
        tick.month %= 7;
    }
    if (tick.week > 52) {
        if (tick.year !== undefined)
            tick.year + Math.floor(tick.week / 52);
        tick.week %= 52;
    }
}
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
            if (typeof this[prop] == "string") {
                this.once = false;
                break;
            }
        }
        if (this.realGetState() === -1) {
            throw new RangeError("Schedule pattern is already expired.");
        }
    }
    getState() {
        let current = getCurrentTick();
        let state = this.realGetState(current);
        if (state === 0)
            this.nextTick = this.getNextTick(current);
        return state;
    }
    realGetState(current) {
        current = current || getCurrentTick();
        let state = -1;
        let tick = this.nextTick;
        for (let prop of Props) {
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
                state = this.once ? -1 : 1;
                break;
            }
        }
        return state;
    }
    getBestInterval(deviation = 0) {
        let intervals = {
            seconds: 1000,
            minutes: 1000 * 60,
            hours: 1000 * 60 * 60,
            date: 1000 * 60 * 60 * 24,
            week: 1000 * 60 * 60 * 24 * 7,
        };
        let interval;
        for (let prop in intervals) {
            if (typeof this[prop] == "string" && this[prop][0] == "*") {
                let num = parseInt(this[prop].split("/")[1] || "1");
                interval = intervals[prop] * num;
                break;
            }
            else if (typeof this[prop] == "number") {
                interval = intervals[prop];
                break;
            }
        }
        return (interval || intervals.week) - deviation;
    }
    parseDateTime(pattern) {
        let parts = pattern.split(/[\.\s]+/);
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
                i = Months.indexOf(part);
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
        else if (year[0] == "*")
            this.year = year;
        if (typeof month == "number")
            this.month = month >= 1 && month <= 12 ? month : undefined;
        else if (month[0] == "*")
            this.month = month;
        if (typeof date == "number")
            this.date = date >= 1 && date <= 31 ? date : undefined;
        else if (date[0] == "*")
            this.date = month;
    }
    setTime(hours, minutes, seconds) {
        if (typeof hours == "number")
            this.hours = hours >= 0 && hours <= 23 ? hours : undefined;
        else if (hours[0] == "*")
            this.hours = hours;
        if (typeof minutes == "number")
            this.minutes = minutes >= 0 && minutes <= 59 ? minutes : undefined;
        else if (minutes[0] == "*")
            this.minutes = minutes;
        if (typeof seconds == "number")
            this.seconds = seconds >= 0 && seconds <= 59 ? seconds : undefined;
        else if (seconds[0] == "*")
            this.seconds = seconds;
    }
    parseStatement(pattern, current) {
        current = current || getCurrentTick();
        let units1 = ["days", "months", "years", "weeks"];
        let units2 = ["hour", "minute", "second"];
        let matches = [
            pattern.match(/(on)\s+(\w+)/),
            pattern.match(/(every)\s+(\w+)/i),
            pattern.match(/(in|after)\s+(this|next|\d+)\s+(\w+)/i),
            pattern.match(/(every|in|after)\s+(\d+)\s+(\w+)/i),
            pattern.match(/today|tomorrow|the\s+(\w+)\s+after\s+(.+)/i),
            pattern.match(/(this|next)\s+(\w+)/i)
        ];
        let matched = false;
        for (let match of matches) {
            if (!match)
                continue;
            matched = true;
            let prep;
            let num;
            let unit;
            let prop;
            if (match.length === 4) {
                prep = match[1].toLowerCase();
                unit = match[3].toLowerCase();
                let target = match[2].toLowerCase();
                if (target === "this")
                    num = 0;
                else if (target === "next")
                    num = 1;
                else
                    num = parseInt(target) || -1;
            }
            else if (match[1] === "this" || match[1] == "next") {
                num = match[1] === "this" ? 0 : 1;
                unit = match[2].toLowerCase();
            }
            else if (match[1] === "every" || match[1] === "on") {
                prep = match[1];
                let i = Weekdays.indexOf(match[2]);
                if (i >= 0) {
                    this.day = i + 1;
                    if (match[1] === "every") {
                        this.week = "*";
                    }
                    continue;
                }
                else {
                    num = 1;
                    unit = match[2].toLowerCase();
                }
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
                    unit = parts[1].toLowerCase();
                    num = num >= 0 ? num + 1 : num;
                }
            }
            prep = prep || "in";
            unit = unit || "day";
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
            if (Props.includes(prop)) {
                if (prep === "in" || prep === "after") {
                    num = prep == "in" ? num : (num + 1);
                    this[prop] = current[prop] + num;
                }
                else if (prep == "every") {
                    this[prop] = num == 1 ? "*" : `*/${num}`;
                }
            }
        }
    }
    getNextTick(current) {
        current = current || getCurrentTick();
        let atBeginning = undefined;
        let next = {};
        let beggings = {
            week: 1,
            day: 0,
            month: 1,
            date: 1,
            hours: 0,
            minutes: 0,
            seconds: 0
        };
        for (let i in Props) {
            let prop = Props[i];
            if (typeof this[prop] == "string" && this[prop][0] == "*") {
                let num = parseInt(this[prop].split("/")[1] || "1");
                if (atBeginning === true) {
                    next[prop] = beggings[prop];
                }
                else if (atBeginning === false) {
                    next[prop] = current[prop] + num;
                }
                else {
                    let j = parseInt(i) + 1;
                    let atCurrent = false;
                    for (; j < Props.length; j++) {
                        let _prop = Props[j];
                        if (typeof this[_prop] == "string"
                            || this[_prop] >= current[_prop]) {
                            atCurrent = true;
                            break;
                        }
                    }
                    next[prop] = atCurrent ? current[prop] : current[prop] + num;
                }
            }
            else if (typeof this[prop] == "number") {
                next[prop] = this[prop];
                if (atBeginning === undefined) {
                    atBeginning = this[prop] > current[prop];
                }
            }
            else {
                next[prop] = undefined;
            }
        }
        correctTick(next);
        return next;
    }
}
exports.ScheduleInfo = ScheduleInfo;
function parse(pattern) {
    return new ScheduleInfo(pattern);
}
exports.parse = parse;
