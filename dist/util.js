"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var consts_1 = require("./consts");
function ucfirst(str) {
    return str[0].toUpperCase() + str.substring(1);
}
exports.ucfirst = ucfirst;
function isWildcard(data) {
    return typeof data == "string" && data[0] == "*";
}
exports.isWildcard = isWildcard;
function getNextTick(dateInfo, date) {
    date = date || new Date();
    var tickInfo = {}, shouldForward = true, prevWildcarProp = "", resetPrevProp = function (prevProp, curProp) {
        if (prevProp) {
            if (prevProp == "date" || prevProp == "month")
                tickInfo[prevProp] = 1;
            else
                tickInfo[prevProp] = 0;
        }
        return curProp;
    };
    for (var _i = 0, ReversedProps_1 = consts_1.ReversedProps; _i < ReversedProps_1.length; _i++) {
        var x = ReversedProps_1[_i];
        if (!(x in dateInfo)) {
            continue;
        }
        else if (typeof dateInfo[x] == "number") {
            var method = void 0;
            if (["seconds", "minutes", "hours", "date", "day", "month"].indexOf(x)) {
                method = "get" + ucfirst(x);
            }
            else {
                method = "getFullYear";
            }
            var currentValue = date[method]();
            if (x == "month")
                currentValue += 1;
            tickInfo[x] = dateInfo[x];
            shouldForward = dateInfo[x] < currentValue;
        }
        else {
            if (shouldForward)
                prevWildcarProp = resetPrevProp(prevWildcarProp, x);
            var step = shouldForward ? parseInt(dateInfo[x].split("/")[1] || 1) : 0, num = void 0;
            switch (x) {
                case "seconds":
                    num = date.getSeconds() + step;
                    shouldForward = num >= 60;
                    tickInfo[x] = shouldForward ? num - 60 : num;
                    break;
                case "minutes":
                    num = date.getMinutes() + step;
                    shouldForward = num >= 60;
                    tickInfo[x] = shouldForward ? num - 60 : num;
                    break;
                case "hours":
                    num = date.getHours() + step;
                    shouldForward = num >= 24;
                    tickInfo[x] = shouldForward ? num - 24 : num;
                    break;
                case "date":
                    num = date.getDate() + step;
                    var currentYear = date.getFullYear(), isLeapYear = currentYear % 4 === 0, currentMonth = date.getMonth() + 1, isBigMonth = consts_1.BigMonths.indexOf(currentMonth) >= 0;
                    if (currentMonth == 2) {
                        if (isLeapYear && num > 29 || num > 28) {
                            shouldForward = true;
                            tickInfo[x] = num - (isLeapYear ? 29 : 28);
                        }
                        else {
                            shouldForward = false;
                            tickInfo[x] = num;
                        }
                    }
                    else if (isBigMonth && num > 31 || num > 30) {
                        shouldForward = true;
                        tickInfo[x] = num - (isBigMonth ? 31 : 30);
                    }
                    else {
                        shouldForward = false;
                        tickInfo[x] = num;
                    }
                    break;
                case "day":
                    num = date.getDay() + (step > 0 ? (step - 1) * 7 : 0);
                    shouldForward = num > 6;
                    tickInfo[x] = shouldForward ? num - 6 : num;
                    break;
                case "month":
                    num = date.getMonth() + 1 + step;
                    shouldForward = num > 12;
                    tickInfo[x] = shouldForward ? num - 12 : num;
                    break;
                case "year":
                    tickInfo[x] = date.getFullYear() + step;
                    break;
            }
        }
    }
    return correctDates(tickInfo, date);
}
exports.getNextTick = getNextTick;
function correctDates(tickInfo, date) {
    date = date || new Date();
    for (var _i = 0, ReversedProps_2 = consts_1.ReversedProps; _i < ReversedProps_2.length; _i++) {
        var x = ReversedProps_2[_i];
        if (tickInfo[x] === undefined) {
            continue;
        }
        else if (x == "seconds" && tickInfo[x] >= 60) {
            if (tickInfo.minutes !== undefined) {
                tickInfo[x] -= 60;
                tickInfo.minutes += 1;
            }
            else {
                tickInfo[x] = undefined;
            }
        }
        else if (x == "minutes" && tickInfo[x] >= 60) {
            if (tickInfo.hours !== undefined) {
                tickInfo[x] -= 60;
                tickInfo.hours += 1;
            }
            else {
                tickInfo[x] = undefined;
            }
        }
        else if (x == "hours" && tickInfo[x] >= 24) {
            if (tickInfo.date !== undefined) {
                tickInfo[x] -= 24;
                tickInfo.date += 1;
            }
            else {
                tickInfo[x] = undefined;
            }
        }
        else if (x == "date") {
            var currentYear = date.getFullYear(), isLeapYear = currentYear % 4 === 0, currentMonth = date.getMonth() + 1, isBigMonth = consts_1.BigMonths.indexOf(currentMonth) >= 0;
            if (currentMonth == 2) {
                if (isLeapYear && tickInfo[x] > 29 || tickInfo[x] > 28) {
                    if (tickInfo.month !== undefined) {
                        tickInfo[x] -= isLeapYear ? 29 : 28;
                        tickInfo.month += 1;
                    }
                    else {
                        tickInfo[x] = undefined;
                    }
                }
            }
            else if (isBigMonth && tickInfo[x] > 31 || tickInfo[x] > 30) {
                if (tickInfo.month !== undefined) {
                    tickInfo[x] -= isLeapYear ? 31 : 30;
                    tickInfo.month += 1;
                }
                else {
                    tickInfo[x] = undefined;
                }
            }
        }
        else if (x == "day" && tickInfo[x] > 6) {
            if (tickInfo.month !== undefined) {
                tickInfo[x] %= 7;
                tickInfo.month += Math.ceil(tickInfo[x] / 7 / 4.1) + 1;
            }
            else {
                tickInfo[x] = undefined;
            }
        }
        else if (x == "month" && tickInfo[x] > 12) {
            if (tickInfo.year !== undefined) {
                tickInfo[x] -= 12;
                tickInfo.year += 1;
            }
            else {
                tickInfo[x] = undefined;
            }
        }
    }
    return tickInfo;
}
function getNextTickTime(tickInfo, date) {
    date = date || new Date();
    var seconds = tickInfo.seconds !== undefined ? tickInfo.seconds : date.getSeconds(), minutes = tickInfo.minutes !== undefined ? tickInfo.minutes : date.getMinutes(), hours = tickInfo.hours !== undefined ? tickInfo.hours : date.getHours(), month = tickInfo.month !== undefined ? tickInfo.month : date.getMonth() + 1, year = tickInfo.year !== undefined ? tickInfo.year : date.getFullYear(), _date;
    if (tickInfo.date !== undefined) {
        _date = tickInfo.date;
    }
    else if (tickInfo.day !== undefined) {
        if (tickInfo.day >= date.getDay()) {
            _date = tickInfo.day - date.getDay() + date.getDate();
        }
        else {
            _date = tickInfo.day - date.getDay() + 7 + date.getDate();
        }
    }
    else {
        _date = date.getDate();
    }
    var _a = correctDates({
        seconds: seconds, minutes: minutes, hours: hours, date: _date, month: month, year: year
    }, date), seconds = _a.seconds, minutes = _a.minutes, hours = _a.hours, _date = _a.date, month = _a.month, year = _a.year;
    return new Date(year, month - 1, _date, hours, minutes, seconds).getTime();
}
exports.getNextTickTime = getNextTickTime;
function getCurrentTick() {
    var date = new Date();
    return {
        year: date.getFullYear(),
        day: date.getDay(),
        month: date.getMonth() + 1,
        date: date.getDate(),
        hours: date.getHours(),
        minutes: date.getMinutes(),
        seconds: date.getSeconds()
    };
}
function getTicKState(dateInfo, tickInfo) {
    var currentTick = getCurrentTick(), waitNextTick = false, state = 1;
    for (var _i = 0, Props_1 = consts_1.Props; _i < Props_1.length; _i++) {
        var x = Props_1[_i];
        if (!waitNextTick && isWildcard(dateInfo[x]))
            waitNextTick = true;
        if (tickInfo[x] === undefined) {
            continue;
        }
        else if (tickInfo[x] === currentTick[x]) {
            state = 0;
        }
        else if (tickInfo[x] > currentTick[x]) {
            state = 1;
            break;
        }
        else {
            state = waitNextTick ? 1 : -1;
            break;
        }
    }
    return state;
}
exports.getTicKState = getTicKState;
function getBestTimeout(tickInfo, date) {
    var timeout = getNextTickTime(tickInfo, date) - (date ? date.getTime() : Date.now());
    return timeout > consts_1.TimeoutLimit ? consts_1.TimeoutLimit : timeout;
}
exports.getBestTimeout = getBestTimeout;
function getBestInterval(tickInfo) {
    var timeouts = {
        seconds: 1000,
        minutes: 1000 * 60,
        hours: 1000 * 60 * 60,
        date: 1000 * 60 * 60 * 24,
    };
    for (var x in timeouts) {
        if (tickInfo[x] !== undefined)
            return timeouts[x];
    }
    return timeouts.date;
}
exports.getBestInterval = getBestInterval;
function shouldRunOnce(dateInfo) {
    var should = true;
    for (var x in dateInfo) {
        if (isWildcard(dateInfo[x])) {
            should = false;
            break;
        }
    }
    return should;
}
exports.shouldRunOnce = shouldRunOnce;
//# sourceMappingURL=util.js.map