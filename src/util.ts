import { DateTimeLike, DateTime } from "./types";
import { TimeoutLimit, BigMonths, ReversedProps, Props } from "./consts";

export function ucfirst(str: string): string {
    return str[0].toUpperCase() + str.substring(1);
}

export function isWildcard(data: any): boolean {
    return typeof data == "string" && data[0] == "*";
}

export function getNextTick(dateInfo: DateTimeLike, date?: Date): DateTime {
    date = date || new Date();

    let tickInfo: DateTime = {},
        shouldForward = true,
        prevWildcarProp = "",
        resetPrevProp = (prevProp: string, curProp: string): string => {
            if (prevProp) {
                if (prevProp == "date" || prevProp == "month")
                    tickInfo[prevProp] = 1;
                else
                    tickInfo[prevProp] = 0;
            }

            return curProp;
        };

    for (let x of ReversedProps) {
        if (!(x in dateInfo)) {
            continue;
        } else if (typeof dateInfo[x] == "number") {
            let method: string;

            if (["seconds", "minutes", "hours", "date", "day", "month"].indexOf(x)) {
                method = "get" + ucfirst(x);
            } else {
                method = "getFullYear";
            }

            let currentValue = date[method]();

            if (x == "month") currentValue += 1;

            tickInfo[x] = dateInfo[x];
            shouldForward = dateInfo[x] < currentValue;
        } else {
            if (shouldForward)
                prevWildcarProp = resetPrevProp(prevWildcarProp, x);

            let step = shouldForward ? parseInt(dateInfo[x].split("/")[1] || 1) : 0,
                num: number;

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

                    let currentYear = date.getFullYear(),
                        isLeapYear = currentYear % 4 === 0,
                        currentMonth = date.getMonth() + 1,
                        isBigMonth = BigMonths.indexOf(currentMonth) >= 0;

                    if (currentMonth == 2) { // Feb.
                        if (isLeapYear && num > 29 || num > 28) {
                            shouldForward = true;
                            tickInfo[x] = num - (isLeapYear ? 29 : 28);
                        } else {
                            shouldForward = false;
                            tickInfo[x] = num;
                        }
                    } else if (isBigMonth && num > 31 || num > 30) {
                        shouldForward = true;
                        tickInfo[x] = num - (isBigMonth ? 31 : 30);
                    } else {
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

function correctDates(tickInfo: DateTime, date?: Date): DateTime {
    date = date || new Date();

    for (let x of ReversedProps) {
        if (tickInfo[x] === undefined) {
            continue;
        } else if (x == "seconds" && tickInfo[x] >= 60) {
            if (tickInfo.minutes !== undefined) {
                tickInfo[x] -= 60;
                tickInfo.minutes += 1;
            } else {
                tickInfo[x] = undefined;
            }
        } else if (x == "minutes" && tickInfo[x] >= 60) {
            if (tickInfo.hours !== undefined) {
                tickInfo[x] -= 60;
                tickInfo.hours += 1;
            } else {
                tickInfo[x] = undefined;
            }
        } else if (x == "hours" && tickInfo[x] >= 24) {
            if (tickInfo.date !== undefined) {
                tickInfo[x] -= 24;
                tickInfo.date += 1;
            } else {
                tickInfo[x] = undefined;
            }
        } else if (x == "date") {
            let currentYear = date.getFullYear(),
                isLeapYear = currentYear % 4 === 0,
                currentMonth = date.getMonth() + 1,
                isBigMonth = BigMonths.indexOf(currentMonth) >= 0;

            if (currentMonth == 2) { // Feb.
                if (isLeapYear && tickInfo[x] > 29 || tickInfo[x] > 28) {
                    if (tickInfo.month !== undefined) {
                        tickInfo[x] -= isLeapYear ? 29 : 28;
                        tickInfo.month += 1;
                    } else {
                        tickInfo[x] = undefined;
                    }
                }
            } else if (isBigMonth && tickInfo[x] > 31 || tickInfo[x] > 30) {
                if (tickInfo.month !== undefined) {
                    tickInfo[x] -= isLeapYear ? 31 : 30;
                    tickInfo.month += 1;
                } else {
                    tickInfo[x] = undefined;
                }
            }
        } else if (x == "day" && tickInfo[x] > 6) {
            if (tickInfo.month !== undefined) {
                tickInfo[x] %= 7;
                tickInfo.month += Math.ceil(tickInfo[x] / 7 / 4.1) + 1;
            } else {
                tickInfo[x] = undefined;
            }
        } else if (x == "month" && tickInfo[x] > 12) {
            if (tickInfo.year !== undefined) {
                tickInfo[x] -= 12;
                tickInfo.year += 1;
            } else {
                tickInfo[x] = undefined;
            }
        }
    }

    return tickInfo;
}

export function getNextTickTime(tickInfo: DateTime, date?: Date): number {
    date = date || new Date();

    var seconds = tickInfo.seconds !== undefined ? tickInfo.seconds : date.getSeconds(),
        minutes = tickInfo.minutes !== undefined ? tickInfo.minutes : date.getMinutes(),
        hours = tickInfo.hours !== undefined ? tickInfo.hours : date.getHours(),
        month = tickInfo.month !== undefined ? tickInfo.month : date.getMonth() + 1,
        year = tickInfo.year !== undefined ? tickInfo.year : date.getFullYear(),
        _date: number;


    if (tickInfo.date !== undefined) { // use monthly date as the first choice
        _date = tickInfo.date;
    } else if (tickInfo.day !== undefined) { // if missing date, use weekday instead
        if (tickInfo.day >= date.getDay()) {
            _date = tickInfo.day - date.getDay() + date.getDate();
        } else {
            _date = tickInfo.day - date.getDay() + 7 + date.getDate();
        }
    } else {
        _date = date.getDate();
    }

    var { seconds, minutes, hours, date: _date, month, year } = correctDates({
        seconds, minutes, hours, date: _date, month, year
    }, date);

    return new Date(year, month - 1, _date, hours, minutes, seconds).getTime();
}

function getCurrentTick(): DateTime {
    let date = new Date();

    return {
        year: date.getFullYear(),
        day: date.getDay(),
        month: date.getMonth() + 1,
        date: date.getDate(),
        hours: date.getHours(),
        minutes: date.getMinutes(),
        seconds: date.getSeconds()
    }
}

/**
 * The possible returning values is:
 * -1: tick is expired;
 * 0: tick is just on time;
 * 1: tick is still awaiting.
 */
export function getTicKState(dateInfo: DateTimeLike, tickInfo: DateTime): number {
    let currentTick = getCurrentTick(),
        waitNextTick = false,
        state = 1;

    for (let x of Props) {
        if (!waitNextTick && isWildcard(dateInfo[x]))
            waitNextTick = true;

        if (tickInfo[x] === undefined) {
            continue;
        } else if (tickInfo[x] === currentTick[x]) {
            state = 0;
        } else if (tickInfo[x] > currentTick[x]) {
            state = 1;
            break;
        } else { // tickInfo[x] < currentTick[x]
            state = waitNextTick ? 1 : -1;
            break;
        }
    }

    return state;
}

export function getBestTimeout(tickInfo: DateTime, date?: Date): number {
    let timeout = getNextTickTime(tickInfo, date) - (date ? date.getTime() : Date.now());
    return timeout > TimeoutLimit ? TimeoutLimit : timeout;
}

export function getBestInterval(tickInfo: DateTime): number {
    let timeouts = {
        seconds: 1000,
        minutes: 1000 * 60,
        hours: 1000 * 60 * 60,
        date: 1000 * 60 * 60 * 24,
    };

    for (let x in timeouts) {
        if (tickInfo[x] !== undefined)
            return timeouts[x];
    }

    return timeouts.date;
}

export function shouldRunOnce(dateInfo: DateTimeLike): boolean {
    let should = true;

    for (let x in dateInfo) {
        if (isWildcard(dateInfo[x])) {
            should = false
            break;
        }
    }

    return should;
}