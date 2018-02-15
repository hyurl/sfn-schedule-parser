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
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
];
const Weekdays2 = ["Sun", "Mon", "Tues", "Wed", "Thurs", "Fri", "Sat"];
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
const getNum = (num) => {
    if (num === "*") {
        num = num;
    }
    else {
        num = parseInt(num);
        num = isNaN(num) ? -1 : num;
    }
    return num;
};
const state = Symbol("state");
class ScheduleInfo {
    constructor(pattern) {
        if (typeof pattern === "string") {
            for (let prop of Props) {
                this[prop] = undefined;
            }
            this.increment = undefined;
            this.parseDateTime(pattern);
            this.parseStatement(pattern);
            this.once = this.increment === undefined
                && /\*[\/\-:]|[\/\-:]\*/.test(pattern) === false;
        }
        else {
            this.year = pattern && pattern.getFullYear();
            this.week = pattern && currentWeek(pattern);
            this.day = pattern && pattern.getDay();
            this.month = pattern && pattern.getMonth() + 1;
            this.date = pattern && pattern.getDate();
            this.hours = pattern && pattern.getHours();
            this.minutes = pattern && pattern.getMinutes();
            this.seconds = pattern && pattern.getSeconds();
            this.increment = undefined;
            this.once = true;
        }
    }
    getState() {
        if (this[state] == -1)
            return -1;
        let stat = -1;
        let current = ScheduleInfo.getCurrent();
        let hasWildcard = false;
        for (let prop of Props) {
            if (this[prop] === undefined) {
                continue;
            }
            else if (this[prop] === "*") {
                stat = 0;
                hasWildcard = true;
            }
            else if (this[prop] === current[prop]) {
                stat = 0;
            }
            else if (this[prop] > current[prop]) {
                stat = 1;
                break;
            }
            else if (this[prop] < current[prop]) {
                if (hasWildcard) {
                    stat = 1;
                    break;
                }
                stat = -1;
                for (let _prop of Props) {
                    if (_prop == prop) {
                        break;
                    }
                    else if (this[_prop] === undefined) {
                        continue;
                    }
                    else if (this[_prop] > current[_prop]) {
                        stat = 1;
                        break;
                    }
                }
                break;
            }
        }
        this[state] = stat;
        return stat;
    }
    ;
    get state() {
        return this.getState();
    }
    parseDateTime(pattern) {
        let parts = pattern.split(/[\.\s]+/);
        for (let part of parts) {
            let nums, isDate = false, isTime = false;
            if (part.indexOf(":") > 0) {
                nums = part.split(":");
                isTime = true;
            }
            else if (part.match(/[\-\/]/)) {
                nums = part.split(/[\-\/]/);
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
                    this.day = i;
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
        if (typeof year === "number")
            this.year = year >= 1970 ? year : undefined;
        else
            this.year = year;
        if (typeof month === "number")
            this.month = month >= 1 && month <= 12 ? month : undefined;
        else
            this.month = month;
        if (typeof date === "number")
            this.date = date >= 1 && date <= 31 ? date : undefined;
        else
            this.date = month;
    }
    setTime(hours, minutes, seconds) {
        if (typeof hours == "number")
            this.hours = hours >= 0 && hours <= 23 ? hours : undefined;
        else
            this.hours = hours;
        if (typeof minutes == "number")
            this.minutes = minutes >= 0 && minutes <= 59 ? minutes : undefined;
        else
            this.minutes = minutes;
        if (typeof seconds == "number")
            this.seconds = seconds >= 0 && seconds <= 59 ? seconds : undefined;
        else
            this.seconds = seconds;
    }
    parseStatement(pattern) {
        let units1 = ["days", "months", "years", "weeks"];
        let units2 = ["hour", "minute", "second"];
        let current = ScheduleInfo.getCurrent();
        let matches = [
            pattern.match(/(on)\s+(\w+)/),
            pattern.match(/(every)\s+(\w+)/i),
            pattern.match(/(in|after)\s+(this|next|\d+)\s+(\w+)/i),
            pattern.match(/(every|in|after)\s+(\d+)\s+(\w+)/i),
            pattern.match(/today|tomorrow|the\s+(\w+)\s+after\s+(.+)/i)
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
            else {
                if (match[1] === "every" || match[1] === "on") {
                    prep = match[1];
                    let i = Weekdays.indexOf(match[2]);
                    if (i >= 0) {
                        this.day = i;
                        if (match[1] === "every")
                            this.increment = ["week", 1];
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
            if (Props.includes(prop)) {
                if (prep === "in" || prep === "after") {
                    num = prep == "in" ? num : (num + 1);
                    this[prop] = current[prop] + num;
                }
                else {
                    this[prop] = current[prop];
                    this.increment = [prop, num];
                }
            }
        }
        if (matched)
            this.correct();
    }
    correct() {
        let current = ScheduleInfo.getCurrent();
        let bigMonths = [1, 3, 5, 7, 8, 10, 12];
        if (typeof this.seconds == "number" && this.seconds > 59) {
            this.minutes = current.minutes + Math.floor(this.seconds / 60);
            this.seconds %= 60;
        }
        if (typeof this.minutes == "number" && this.minutes > 59) {
            this.hours = current.hours + Math.floor(this.minutes / 60);
            this.minutes %= 60;
        }
        if (typeof this.hours == "number" && this.hours > 23) {
            this.date = current.date + Math.floor(this.hours / 24);
            this.hours %= 24;
        }
        if (typeof this.date == "number") {
            if (this.month == 2) {
                if ((!this.year
                    || (typeof this.year == "number" && this.year % 4 > 0))
                    && this.date > 28) {
                    this.month = current.month + Math.floor(this.date / 28);
                    this.date %= 28;
                }
                else if (this.date > 29) {
                    this.month = current.month + Math.floor(this.date / 29);
                    this.date %= 29;
                }
            }
            else if (typeof this.month == "number"
                && bigMonths.includes(this.month) && this.date > 31) {
                this.month = current.month + Math.floor(this.date / 31);
                this.date %= 31;
            }
            else if (this.date > 30) {
                this.month = current.month + Math.floor(this.date / 30);
                this.date %= 30;
            }
        }
        if (typeof this.month == "number" && this.month > 12) {
            this.year = current.year + Math.floor(this.month / 12);
            this.month %= 12;
        }
    }
    update() {
        if (this.increment) {
            this[this.increment[0]] += this.increment[1];
            this.correct();
        }
        else if (this.once && this[state] === 0) {
            this[state] = -1;
        }
    }
    static getCurrent() {
        return new this(new Date);
    }
    static parse(pattern) {
        return new this(pattern);
    }
}
exports.ScheduleInfo = ScheduleInfo;
function parse(pattern) {
    return new ScheduleInfo(pattern);
}
exports.parse = parse;
