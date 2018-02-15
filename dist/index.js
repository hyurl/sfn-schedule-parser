"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
const Props = ["year", "month", "day", "date", "hours", "minutes", "seconds"];
const increment = Symbol("increment");
class ScheduleInfo {
    get state() {
        let target = Math.floor(this.toTime() / 1000);
        let current = Math.floor(Date.now() / 1000);
        let res = target - current;
        return res ? (res > 0 || this[increment] ? 1 : -1) : 0;
    }
    ;
    constructor(pattern) {
        this[increment] = undefined;
        if (typeof pattern === "string") {
            this.year = undefined;
            this.month = undefined;
            this.day = undefined;
            this.date = undefined;
            this.hours = undefined;
            this.minutes = undefined;
            this.seconds = undefined;
            this.parseDateTime(pattern);
            this.parseStatement(pattern);
        }
        else {
            this.year = pattern && pattern.getFullYear();
            this.month = pattern && pattern.getMonth() + 1;
            this.day = pattern && pattern.getDay();
            this.date = pattern && pattern.getDate();
            this.hours = pattern && pattern.getHours();
            this.minutes = pattern && pattern.getMinutes();
            this.seconds = pattern && pattern.getSeconds();
        }
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
                let num1 = nums[0] === "*" ? nums[0] : parseInt(nums[0]) || -1, num2 = nums[1] === "*" ? nums[1] : parseInt(nums[1]) || -1, num3 = nums[2] === "*" ? nums[2] : parseInt(nums[2]) || -1;
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
                    if (this.date === undefined)
                        this.date = num >= 1 && num <= 31 ? num : undefined;
                    if (this.year === undefined)
                        this.year = !this.year && num >= 1970 ? num : undefined;
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
        let re1 = /(every|in|after)\s+(\d+)\s+(\w+)/i;
        let re2 = /(every)\s+(\w+)/i;
        let re3 = /today|tomorrow|the\s+day\s+after\s+(.+)/i;
        let units1 = ["days", "months", "years", "weeks"];
        let units2 = ["hour", "minute", "second"];
        let prep;
        let num;
        let unit;
        let prop;
        let match = re1.exec(pattern) || re2.exec(pattern) || re3.exec(pattern);
        if (match) {
            if (match.length === 4) {
                prep = match[1].toLowerCase();
                num = parseInt(match[2]) || -1;
                unit = match[3].toLowerCase();
            }
            else {
                if (match[1] === "every") {
                    prep = "every";
                    let i = Weekdays.indexOf(match[2]);
                    if (i >= 0) {
                        this.day = i;
                        return;
                    }
                    else {
                        num = 1;
                        unit = match[2].toLowerCase();
                    }
                }
                else if (match[0] === "today") {
                    this.date = new Date().getDate();
                    return;
                }
                else if (match[0] === "tomorrow") {
                    num = 1;
                }
                else {
                    if (match[1] === "tomorrow") {
                        num = 2;
                    }
                    else {
                        let parts = match[1].split(/\s+/);
                        num = parseInt(parts[0]) || -1;
                        unit = parts[1].toLowerCase();
                    }
                }
                prep = prep || "in";
                unit = unit || "day";
            }
        }
        num = num > 0 ? num : undefined;
        if (num > 1 && units1.includes(unit)) {
            unit = unit.substring(0, unit.length - 1);
        }
        else if (num === 1 && units2.includes(unit)) {
            unit += "s";
        }
        if (unit == "day" || unit == "week") {
            prop = "date";
            if (unit == "week")
                num = num * 7;
        }
        else {
            prop = unit;
        }
        if (num && Props.includes(prop)) {
            let current = ScheduleInfo.getCurrent();
            if (prep === "in" || prep === "after") {
                num = prep == "in" ? num : (num + 1);
                this[prop] = current[prop] + num;
            }
            else {
                this[prop] = current[prop];
                this[increment] = [prop, num];
            }
            this.correct();
        }
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
        if (this[increment]) {
            this[this[increment][0]] += this[increment][1];
            this.correct();
        }
    }
    toTime() {
        let current = this.constructor.getCurrent();
        let info = {};
        for (let prop of Props) {
            if (this[prop] === undefined || this[prop] === "*")
                info[prop] = current[prop];
            else
                info[prop] = this[prop];
        }
        let { year, month, date, hours, minutes, seconds } = info;
        month -= 1;
        return new Date(year, month, date, hours, minutes, seconds).getTime();
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
