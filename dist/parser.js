"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var trimRight = require("lodash/trimEnd");
var consts_1 = require("./consts");
var util_1 = require("./util");
function getNum(str) {
    if (str === undefined) {
        return undefined;
    }
    else if (util_1.isWildcard(str)) {
        return str;
    }
    else {
        var num = parseInt(str);
        return isNaN(num) ? -1 : num;
    }
}
function setDateInfo(dateInfo, prop, val) {
    if (typeof val == "number") {
        dateInfo[prop] = (val >= consts_1.Beginnings[prop] && val <= consts_1.Endings[prop])
            ? val
            : undefined;
    }
    else if (util_1.isWildcard(val)) {
        dateInfo[prop] = val;
    }
}
function parseDateString(pattern) {
    var parts = pattern.split(/\s+/), endings = ["st", "nd", "rd", "th"], dateInfo = {};
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
                    setDateInfo(dateInfo, "year", num3);
                    setDateInfo(dateInfo, "month", num1);
                    setDateInfo(dateInfo, "date", num2);
                }
                else {
                    if (num1 !== undefined)
                        setDateInfo(dateInfo, "year", num1);
                    if (num2 !== undefined)
                        setDateInfo(dateInfo, "month", num2);
                    if (num3 !== undefined)
                        setDateInfo(dateInfo, "date", num3);
                }
            }
            else {
                if (num1 !== undefined)
                    setDateInfo(dateInfo, "hours", num1);
                if (num2 !== undefined)
                    setDateInfo(dateInfo, "minutes", num2);
                if (num3 !== undefined)
                    setDateInfo(dateInfo, "seconds", num3);
            }
        }
        else {
            var _part = trimRight(part, ".");
            var i = consts_1.Weekdays2.indexOf(_part);
            if (i >= 0) {
                dateInfo.day = i;
                continue;
            }
            i = consts_1.Months.indexOf(_part);
            if (i >= 0) {
                dateInfo.month = i;
                continue;
            }
            var ending = part.substring(part.length - 2);
            var isNum = !isNaN(part);
            if (endings.indexOf(ending) >= 0 || (isNum && part.length == 2)) {
                var num = parseInt(part) || -1;
                if (dateInfo.date === undefined && num >= 1 && num <= 31)
                    dateInfo.date = num;
            }
            else if (isNum) {
                var num = parseInt(part) || -1;
                if (dateInfo.year === undefined && num >= 1970)
                    dateInfo.year = num;
            }
        }
    }
    return dateInfo;
}
exports.parseDateString = parseDateString;
function parseDateStatement(pattern, date) {
    date = date || new Date;
    var re1 = /(every|on)\s+([a-z]+)/i, re2 = /(every|in|after)\s+(this|next|\d+)\s+([a-z]+)|(this|next)\s+([a-z]+)/i, re3 = /the\s+([a-z]+)\s+after\s+(.+)|today|tomorrow/i, matches1 = null, matches2 = null, matches3 = null, dateInfo = {};
    while (pattern.length > 0) {
        if (matches1 = pattern.match(re1)) {
            pattern = pattern.replace(matches1[0], "");
            if (matches1[1] == "on") {
                var day = matches1[2], index = consts_1.Weekdays.indexOf(day);
                if (index >= 0 && !("day" in dateInfo))
                    dateInfo.day = index;
            }
            else {
                var unit = matches1[2];
                switch (unit) {
                    case "second":
                    case "minute":
                    case "hour":
                    case "day":
                        var prop = unit == "day" ? "date" : unit + "s";
                        if (!(prop in dateInfo))
                            dateInfo[prop] = "*";
                        break;
                    case "week":
                        if (!("day" in dateInfo))
                            dateInfo.day = date.getDay();
                        if (!("month" in dateInfo))
                            dateInfo.month = "*";
                        break;
                    case "month":
                        if (!("month" in dateInfo))
                            dateInfo.month = "*";
                        break;
                    default:
                        var index = consts_1.Weekdays.indexOf(unit);
                        if (index >= 0) {
                            if (!("day" in dateInfo))
                                dateInfo.day = index;
                            if (!("month" in dateInfo))
                                dateInfo.month = "*";
                        }
                        break;
                }
            }
        }
        else if (matches2 = pattern.match(re2)) {
            pattern = pattern.replace(matches2[0], "");
            var prep = matches2[1], num = prep ? matches2[2] : matches2[4], unit = prep ? matches2[3] : matches2[5];
            if (prep) {
                if (num == "this")
                    num = prep == "in" ? 0 : 1;
                else if (num == "next")
                    num = prep == "in" ? 1 : 2;
                else
                    num = parseInt(num) + (prep == "in" || prep == "every" ? 0 : 1);
            }
            else {
                if (num == "this")
                    num = 0;
                else
                    num = 1;
            }
            if (unit[unit.length - 1] == "s")
                unit = unit.substring(0, unit.length - 1);
            switch (unit) {
                case "second":
                case "minute":
                case "hour":
                case "day":
                    var prop = unit == "day" ? "date" : unit + "s", method = "get" + util_1.ucfirst(prop);
                    if (!(prop in dateInfo)) {
                        if (prep == "every")
                            dateInfo[prop] = num == 1 ? "*" : "*/" + num;
                        else
                            dateInfo[prop] = date[method]() + num;
                    }
                    break;
                case "week":
                    if (!("date" in dateInfo)) {
                        if (prep == "every")
                            dateInfo.date = "*/" + (num * 7);
                        else
                            dateInfo.date = date.getDate() + (7 * num);
                    }
                    break;
                case "month":
                    if (!("month" in dateInfo)) {
                        if (prep == "every")
                            dateInfo.month = num == 1 ? "*" : "*/" + num;
                        else
                            dateInfo.month = date.getMonth() + 1 + num;
                    }
                    break;
                default:
                    var index = consts_1.Weekdays.indexOf(unit);
                    if (index >= 0) {
                        if (num == 0 && !("day" in dateInfo))
                            dateInfo.day = date.getDay();
                        else if (num == 1 && !("date" in dateInfo))
                            dateInfo.date = 7 - index + date.getDate();
                    }
                    break;
            }
        }
        else if (matches3 = pattern.match(re3)) {
            pattern = pattern.replace(matches3[0], "");
            if (matches3[0] == "today" && !("date" in dateInfo)) {
                dateInfo.date = date.getDate();
            }
            else if (matches3[0] == "tomorrow" && !("date" in dateInfo)) {
                dateInfo.date = date.getDate() + 1;
            }
            else {
                var unit = matches3[1], str = matches3[2], getNum_1 = function (matches) {
                    if (matches[1] == "this" || matches[0] == "today")
                        return 1;
                    else if (matches[1] == "next" || matches[0] == "tomorrow")
                        return 2;
                    else
                        return parseInt(matches[1]);
                };
                if (unit == "day") {
                    var matches = str.match(/(\d+)\s+day[s]|today|tomorrow/);
                    if (matches && !("date" in dateInfo))
                        dateInfo.date = date.getDate() + getNum_1(matches);
                }
                else if (unit == "week" || unit == "month") {
                    var re = new RegExp("(this|next\\d+)\\s+" + unit + "[s]"), matches = str.match(re);
                    if (matches) {
                        if (unit == "week") {
                            if (!("date" in dateInfo))
                                dateInfo.date = date.getDate() + (getNum_1(matches) * 7);
                        }
                        else {
                            if (!("month" in dateInfo))
                                dateInfo.month = date.getMonth() + 1 + getNum_1(matches);
                        }
                    }
                }
            }
        }
        else {
            break;
        }
    }
    return dateInfo;
}
exports.parseDateStatement = parseDateStatement;
//# sourceMappingURL=parser.js.map