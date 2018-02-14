"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduleInfo = {
    year: undefined,
    month: undefined,
    day: undefined,
    date: undefined,
    hours: undefined,
    minutes: undefined,
    seconds: undefined,
    once: undefined,
    increment: undefined
};
function getDateInfo() {
    let dateTime = new Date();
    return {
        year: dateTime.getFullYear(),
        month: dateTime.getMonth() + 1,
        day: dateTime.getDay(),
        date: dateTime.getDate(),
        hours: dateTime.getHours(),
        minutes: dateTime.getHours(),
        seconds: dateTime.getSeconds()
    };
}
const Weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const Weekdays2 = ["Sun", "Mon", "Tues", "Wed", "Thurs", "Fri", "Sat"];
const Months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
function parseDateTime(pattern) {
    let parts = pattern.split(/[\.\s]+/);
    let info = Object.assign({}, exports.ScheduleInfo, {
        once: pattern.indexOf("*") === -1
    });
    for (let part of parts) {
        let numbers, isDate = false, isTime = false;
        if (part.indexOf(":") > 0) {
            numbers = part.split(":");
            isTime = true;
        }
        else if (part.match(/[\-\/]/)) {
            numbers = part.split(/[\-\/]/);
            isDate = true;
        }
        if (isDate || isTime) {
            let num1 = parseInt(numbers[0]), num2 = parseInt(numbers[1]), num3 = parseInt(numbers[2]);
            num1 = isNaN(num1) ? -1 : num1;
            num2 = isNaN(num2) ? -1 : num2;
            num3 = isNaN(num3) ? -1 : num3;
            if (isDate) {
                if (num3 > 31 || num3 === -1) {
                    info.year = num3 >= 1970 ? num3 : undefined;
                    info.month = num1 >= 1 && num1 <= 12 ? num1 : undefined;
                    info.date = num2 >= 1 && num2 <= 31 ? num2 : undefined;
                }
                else {
                    info.year = num1 >= 1970 ? num1 : undefined;
                    info.month = num2 >= 1 && num2 <= 12 ? num2 : undefined;
                    info.date = num3 >= 1 && num3 <= 31 ? num3 : undefined;
                }
            }
            else {
                info.hours = num1 >= 0 && num1 <= 23 ? num1 : undefined;
                info.minutes = num2 >= 0 && num2 <= 59 ? num2 : undefined;
                info.seconds = num3 >= 0 && num3 <= 59 ? num3 : undefined;
            }
        }
        else {
            let i = Weekdays2.indexOf(part);
            if (i >= 0) {
                info.day = i;
                continue;
            }
            i = Months.indexOf(part);
            if (i >= 0) {
                info.month = i + 1;
                continue;
            }
            if (!isNaN(part) || part.substring(part.length - 2) === "th") {
                let num = parseInt(part) || -1;
                if (info.date === undefined)
                    info.date = num >= 1 && num <= 31 ? num : undefined;
                if (info.year === undefined)
                    info.year = !info.year && num >= 1970 ? num : undefined;
            }
        }
    }
    return info;
}
exports.parseDateTime = parseDateTime;
function parseStatement(str) {
    let info = Object.assign({}, exports.ScheduleInfo);
    let re1 = /(every|in|after)\s+(\d+)\s+(\w+)/i;
    let re2 = /(every)\s+(\w+)/i;
    let re3 = /today|tomorrow|the\s+day\s+after\s+(.+)/i;
    let props = Object.keys(info);
    let units = ["day", "month", "year", "week"];
    let prep;
    let num;
    let unit;
    let prop;
    props.pop();
    let match = re1.exec(str) || re2.exec(str) || re3.exec(str);
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
                    info.day = i;
                    info.once = false;
                }
                else {
                    num = 1;
                    unit = match[2].toLowerCase();
                }
            }
            else if (match[0] === "today") {
                num = 0;
                info.once = true;
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
    if (num > 1 && unit[unit.length - 1] === "s") {
        let _unit = unit.substring(0, unit.length - 1);
        unit = units.includes(_unit) ? _unit : unit;
    }
    if (unit == "day" || unit == "week")
        prop = "date";
    else
        prop = unit;
    if (num && props.includes(prop)) {
        let current = getDateInfo();
        if (prep === "in" || prep === "after") {
            if (unit == "week") {
                num = num * 7;
            }
            num = prep == "in" ? num : (num + 1);
            info[prop] = current[prop] + num;
            info.once = true;
        }
        else {
            info.once = false;
            info[prop] = current[prop];
            info.increment = [prop, num];
        }
    }
    return info;
}
exports.parseStatement = parseStatement;
function parse(str) {
    let info = {};
    let info1 = parseStatement(str);
    let info2 = parseDateTime(str);
    for (let i in exports.ScheduleInfo) {
        if (i === "once")
            continue;
        if (info2[i] !== undefined)
            info[i] = info2[i];
        else if (info1[i] !== undefined)
            info[i] = info1[i];
        else
            info[i] = undefined;
    }
    info.once = info1.once !== undefined ? info1.once : info2.once;
    return info;
}
exports.parse = parse;
function toTime(info) {
    let current = getDateInfo();
    let copy = Object.assign({}, info);
    for (let i in info) {
        if (info[i] === undefined)
            copy[i] = current[i];
        else
            copy[i] = info[i];
    }
    let { year, month, date, hours, minutes, seconds } = copy;
    return new Date(year, month, date, hours, minutes, seconds).getTime();
}
exports.toTime = toTime;
function applyIncrement(info) {
    if (info.increment && !info.once)
        info[info.increment[0]] += info.increment[1];
}
exports.applyIncrement = applyIncrement;
