import trimRight = require("lodash/trimEnd");
import { DateTimeLike } from "./types";
import { Weekdays2, Months, Beginnings, Endings, Weekdays } from "./consts";
import { ucfirst, isWildcard } from "./util";

function getNum(str: string): string | number {
    if (str === undefined) {
        return undefined;
    } else if (isWildcard(str)) {
        return str;
    } else {
        let num = parseInt(str);
        return isNaN(num) ? -1 : num;
    }
}

function setDateInfo(dateInfo: DateTimeLike, prop: string, val: string | number) {
    if (typeof val == "number") {
        dateInfo[prop] = (val >= Beginnings[prop] && val <= Endings[prop])
            ? val
            : undefined;
    } else if (isWildcard(val)) {
        dateInfo[prop] = val;
    }
}

export function parseDateString(pattern: string): DateTimeLike {
    let parts = pattern.split(/\s+/),
        endings = ["st", "nd", "rd", "th"], // e.g. 1st, 2nd, 3rd 4th
        dateInfo: DateTimeLike = {};

    for (let part of parts) {
        let nums: string[],
            isDate: boolean = false,
            isTime: boolean = false;

        if (part.indexOf(":") > 0) { // match H:i:s
            nums = part.split(":");
            isTime = true;
        } else if (part.indexOf("-") > 0) { // match Y-m-d or m-d-Y
            nums = part.split("-");
            isDate = true;
        }

        if (isDate || isTime) {
            let num1 = getNum(nums[0]);
            let num2 = getNum(nums[1]);
            let num3 = getNum(nums[2]);

            if (isDate) {
                if (typeof num3 === "number" && num3 > 31 || num3 === -1) { // m-d-Y
                    setDateInfo(dateInfo, "year", num3);
                    setDateInfo(dateInfo, "month", num1);
                    setDateInfo(dateInfo, "date", num2);
                } else { // Y-m-d
                    if (num1 !== undefined) setDateInfo(dateInfo, "year", num1);
                    if (num2 !== undefined) setDateInfo(dateInfo, "month", num2);
                    if (num3 !== undefined) setDateInfo(dateInfo, "date", num3);
                }
            } else {
                if (num1 !== undefined) setDateInfo(dateInfo, "hours", num1);
                if (num2 !== undefined) setDateInfo(dateInfo, "minutes", num2);
                if (num3 !== undefined) setDateInfo(dateInfo, "seconds", num3);
            }
        } else {
            let _part = trimRight(part, "."); // e.g. Mon. => Mon
            let i = Weekdays2.indexOf(_part);
            if (i >= 0) {
                dateInfo.day = i;
                continue;
            }

            i = Months.indexOf(_part);
            if (i >= 0) {
                dateInfo.month = i;
                continue;
            }

            let ending = part.substring(part.length - 2);
            let isNum = !isNaN(<any>part);

            if (endings.indexOf(ending) >= 0 || (isNum && part.length == 2)) { // match date
                let num = parseInt(part) || -1;
                if (dateInfo.date === undefined && num >= 1 && num <= 31)
                    dateInfo.date = num;
            } else if (isNum) { // match year
                let num = parseInt(part) || -1;
                if (dateInfo.year === undefined && num >= 1970)
                    dateInfo.year = num;
            }
        }
    }

    return dateInfo;
}

export function parseDateStatement(pattern: string, date?: Date): DateTimeLike {
    date = date || new Date;

    let re1 = /(every|on)\s+([a-z]+)/i,
        re2 = /(every|in|after)\s+(this|next|\d+)\s+([a-z]+)|(this|next)\s+([a-z]+)/i,
        re3 = /the\s+([a-z]+)\s+after\s+(.+)|today|tomorrow/i,
        matches1: RegExpMatchArray = null,
        matches2: RegExpMatchArray = null,
        matches3: RegExpMatchArray = null,
        dateInfo: DateTimeLike = {};

    while (pattern.length > 0) {
        if (matches1 = pattern.match(re1)) { // on week day
            pattern = pattern.replace(matches1[0], "");

            if (matches1[1] == "on") {
                let day = matches1[2],
                    index = Weekdays.indexOf(day);

                if (index >= 0 && !("day" in dateInfo))
                    dateInfo.day = index;
            } else {
                let unit = matches1[2];
                switch (unit) {
                    case "second": // every second
                    case "minute": // every minute
                    case "hour": // every hour
                    case "day": // every day
                        let prop = unit == "day" ? "date" : unit + "s";
                        if (!(prop in dateInfo)) dateInfo[prop] = "*";
                        break;

                    case "week": //every week
                        // starts from the current week day
                        if (!("day" in dateInfo)) dateInfo.day = date.getDay();
                        if (!("month" in dateInfo)) dateInfo.month = "*";
                        break;

                    case "month": // every month
                        if (!("month" in dateInfo)) dateInfo.month = "*";
                        break;

                    default: // try to match weekdays, e.g. every Monday
                        let index = Weekdays.indexOf(unit);

                        if (index >= 0) {
                            if (!("day" in dateInfo)) dateInfo.day = index;
                            if (!("month" in dateInfo)) dateInfo.month = "*";
                        }
                        break;
                }
            }
        } else if (matches2 = pattern.match(re2)) {
            pattern = pattern.replace(matches2[0], "");

            let prep = matches2[1],
                num: string | number = prep ? matches2[2] : matches2[4],
                unit = prep ? matches2[3] : matches2[5];

            if (prep) { // statement with preposition 'in' or 'every' 
                if (num == "this")
                    num = prep == "in" ? 0 : 1;
                else if (num == "next")
                    num = prep == "in" ? 1 : 2;
                else
                    num = parseInt(num) + (prep == "in" || prep == "every" ? 0 : 1);
            } else {
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
                    let prop = unit == "day" ? "date" : unit + "s",
                        method = "get" + ucfirst(prop);

                    if (!(prop in dateInfo)) {
                        if (prep == "every")
                            dateInfo[prop] = num == 1 ? "*" : "*/" + num
                        else
                            dateInfo[prop] = date[method]() + num;
                    }
                    break;

                case "week": // when parsing week, set date instead
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
                    let index = Weekdays.indexOf(unit);

                    if (index >= 0) {
                        if (num == 0 && !("day" in dateInfo))
                            dateInfo.day = date.getDay();
                        else if (num == 1 && !("date" in dateInfo)) // set date instead
                            dateInfo.date = 7 - index + date.getDate();
                    }
                    break;
            }
        } else if (matches3 = pattern.match(re3)) {
            pattern = pattern.replace(matches3[0], "");

            if (matches3[0] == "today" && !("date" in dateInfo)) {
                dateInfo.date = date.getDate();
            } else if (matches3[0] == "tomorrow" && !("date" in dateInfo)) {
                dateInfo.date = date.getDate() + 1;
            } else {
                let unit = matches3[1],
                    str = matches3[2],
                    getNum = (matches: RegExpMatchArray): number => {
                        if (matches[1] == "this" || matches[0] == "today")
                            return 1;
                        else if (matches[1] == "next" || matches[0] == "tomorrow")
                            return 2;
                        else
                            return parseInt(matches[1]);
                    };

                if (unit == "day") {
                    let matches = str.match(/(\d+)\s+day[s]|today|tomorrow/);
                    if (matches && !("date" in dateInfo))
                        dateInfo.date = date.getDate() + getNum(matches);
                } else if (unit == "week" || unit == "month") {
                    let re = new RegExp("(this|next\\d+)\\s+" + unit + "[s]"),
                        matches = str.match(re);

                    if (matches) {
                        if (unit == "week") {
                            if (!("date" in dateInfo))
                                dateInfo.date = date.getDate() + (getNum(matches) * 7);
                        } else {
                            if (!("month" in dateInfo))
                                dateInfo.month = date.getMonth() + 1 + getNum(matches);
                        }
                    }
                }
            }
        } else {
            break;
        }
    }

    return dateInfo;
}