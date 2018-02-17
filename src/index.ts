import currentWeekNumber = require("current-week-number");
import { trimRight } from "string-trimmer";

const currentWeek: (arg?: string | Date) => number = currentWeekNumber;
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
const ReversedProps: string[] = Object.assign([], Props).reverse();

type PropType = string | number;
type DateTime = {
    year?: number;
    week?: number;
    day?: number;
    month?: number;
    date?: number;
    hours?: number;
    minutes?: number;
    seconds?: number;
};

function isWildcard(data: any): boolean {
    return typeof data == "string" && data[0] == "*";
}

function getNum(str: string): PropType {
    if (str === undefined) {
        return -1;
    } else if (isWildcard(str)) {
        return str;
    } else {
        let num = parseInt(str);
        return isNaN(num) ? -1 : num;
    }
}

/** Gets the tick information according to the current time. */
export function getCurrentTick(): DateTime {
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
    }
}

export class ScheduleInfo {
    /** 2018+. */
    year: PropType;
    /** Week of year, `1` - `52`. */
    week: PropType;
    /** Day of week, `1` - `7`, `7` represents Sunday. */
    day: PropType;
    /** `1` - `12`. */
    month: PropType;
    /** Day of month, `1` - `31`. */
    date: PropType;
    /** `0` - `23`. */
    hours: PropType;
    /** `0` - `59`. */
    minutes: PropType;
    /** `0` - `59`. */
    seconds: PropType;
    /** Whether the schedule should run only once. */
    readonly once: boolean;
    /** @private */
    private nextTick: DateTime;

    /**
     * If `pattern` is a string, the constructor acts exactly the same as 
     * function `parse()`.
     */
    constructor(pattern: string) {
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

    /**
     * Parses date-time pattern.
     * @private
     * @param pattern The date part could be `yyyy-mm-dd`, `mm-dd-yyyy`, 
     *  `mm-dd`; the time part could be `HH:mm:ss`, `HH::mm`; the weekday and 
     *  month part must be a short-hand writing of names, e.g. `Mon`, `Sun`, 
     *  `Feb`, `Oct`. Every part is optional and unordered, when a certain 
     *  value is unknown, use the placeholder `*` instead. The `*` could be 
     *  divided with a number, which represents an `every...` phrase.
     * @example
     *  parseDateTime('2018-2-14 20:00') // a certain time.
     *  parseDateTime('2018-*-14') // 14th day of every month in 2018. 
     *  parseDateTime('*:30') // 30 minutes of every hour in today.
     *  parseDateTime('Sat 20:00') // 20:00 on Saturday in this week.
     *  // every minutes of 20 hours in the 14th day of every month.
     *  parseDateTime('2018-*-14 20:*')
     *  parseDateTime('Feb 14th 2018') // February 14th in 2018.
     */
    private parseDateTime(pattern: string): void {
        let parts = pattern.split(/\s+/);

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
                    if (typeof num3 === "number" && num3 > 31 || num3 === -1) {
                        this.setDate(num3, num1, num2);
                    } else {
                        this.setDate(num1, num2, num3);
                    }
                } else {
                    this.setTime(num1, num2, num3);
                }
            } else {
                let i = Weekdays2.indexOf(part);
                if (i >= 0) {
                    this.day = i + 1;
                    continue;
                }

                let _part = trimRight(part, ".");
                i = Months.indexOf(_part);
                if (i >= 0) {
                    this.month = i + 1;
                    continue;
                }

                if (part.substring(part.length - 2) === "th") {
                    let num = parseInt(part) || -1;
                    if (this.date === undefined && num >= 1 && num <= 31)
                        this.date = num;
                } else if (!isNaN(<any>part)) {
                    let num = parseInt(part) || -1;
                    if (this.year === undefined && num >= 1970)
                        this.year = num;
                }
            }
        }
    }

    /** @private */
    private setDate(year: PropType, month: PropType, date: PropType) {
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

    /** @private */
    private setTime(hours: PropType, minutes: PropType, seconds: PropType) {
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

    /**
     * Parses statements in human language.
     * @private
     * @param pattern The number in the string must be decimal, and must be a 
     *  certain date or period. DOT use more than one phrase that shares the 
     *  same pattern.
     * @example
     *  parseStatement('every 2 hours')
     *  parseStatement('in 2 hours')
     *  parseStatement('after 2 hours')
     *  parseStatement('every day')
     *  parseStatement('every Monday') // Monday, not Mon or monday.
     *  parseStatement('tomorrow')
     *  parseStatement('the day after tomorrow')
     *  parseStatement('the day after 2 days')
     */
    private parseStatement(pattern: string, current?: DateTime): void {
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
            if (!match) continue;

            let prep: string;
            let num: number;
            let unit: string;
            let prop: string;

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
            } else if (match[1] === "this" || match[1] == "next") {
                num = match[1] === "this" ? 0 : 1;
                unit = match[2];
            } else if (match[1] === "every" || match[1] === "on") {
                prep = match[1];
                num = 1;
                unit = match[2];
            } else if (match[0] === "today") {
                num = 0;
            } else if (match[0] === "tomorrow") {
                num = 1;
            } else if (match[0].split(/\s+/)[0] === "the") {
                if (match[1] === "day" && match[2] === "tomorrow") {
                    num = 2;
                } else {
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
                // plural to singular
                unit = unit.substring(0, unit.length - 1);
            } else if (num === 1 && units2.includes(unit)) {
                unit += "s"; // singular to plural
            }

            if (unit == "day") {
                prop = "date";
            } else {
                prop = unit;
            }

            i = Props.indexOf(prop);
            if (i >= 0) {
                if (prep === "in" || prep === "after") { // in... or after...
                    num = prep == "in" ? num : (num + 1);
                    this[prop] = current[prop] + num;
                } else if (prep == "every") { // every...
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

    /**
     * - `-1` expired, the schedule should stop now.
     * - `0` in position, the schedule should run now;
     * - `1` waiting, the schedule should wait for the next tick.
     */
    getState(): number {
        let current = getCurrentTick();
        let state = this.realGetState(current);

        if (state <= 0)
            this.nextTick = this.getNextTick(current);

        return state;
    }

    /** @private */
    private realGetState(current?: DateTime, tick?: DateTime): number {
        current = current || getCurrentTick();
        tick = tick || this.nextTick;
        let state = -1;

        for (let i in Props) {
            let prop = Props[i];
            if (tick[prop] === undefined) {
                continue;
            } else if (tick[prop] === current[prop]) {
                state = 0;
            } else if (tick[prop] > current[prop]) {
                state = 1;
                break;
            } else {
                state = -1;
                break;
            }
        }

        return state;
    }

    /**
     * Gets the next tick time of the current schedule.
     * @private
     */
    private getNextTick(current?: DateTime): DateTime {
        current = current || getCurrentTick();
        let tick: DateTime = {};
        let beginnings: DateTime = {
            year: current.year + 1,
            week: 1,
            day: 0,
            month: 1,
            date: 1,
            hours: 0,
            minutes: 0,
            seconds: 0
        };
        let wildcard1: [string, number];
        let wildcard2: [string, number];
        let wildcard3: [string, number];

        for (let prop of ReversedProps) {
            if (this[prop] === undefined) {
                continue;
            } else if (typeof this[prop] == "number") {
                tick[prop] = this[prop];
            } else if (isWildcard(this[prop])) {
                let num = parseInt((<string>this[prop]).split("/")[1]) || 1;
                if (wildcard1 === undefined) {
                    wildcard1 = [prop, num];
                    tick[prop] = beginnings[prop];
                } else if (wildcard2 === undefined) {
                    wildcard2 = [prop, num];
                    tick[prop] = current[prop] + num;
                } else {
                    tick[prop] = current[prop];
                    if (wildcard3 === undefined)
                        wildcard3 = [prop, num];
                }
            }
        }

        if (wildcard1) {
            if (wildcard2 === undefined) {
                tick[wildcard1[0]] = current[wildcard1[0]] + wildcard1[1];
            } else {
                let _tick = Object.assign({}, tick);
                _tick[wildcard1[0]] = current[wildcard1[0]] + wildcard1[1];
                _tick[wildcard2[0]] = current[wildcard2[0]];
                if (this.realGetState(current, _tick) !== -1) {
                    tick = _tick;
                } else if (this.realGetState(current, tick) === -1) {
                    tick[wildcard2[0]] = beginnings[wildcard2[0]];
                    if (wildcard3)
                        tick[wildcard3[0]] = current[wildcard3[0]] + wildcard3[1];
                }
            }
        }

        this.correctTick(tick);
        return tick;
    }

    /** 
     * Corrects out-bounded properties of a tick time.
     * @private
     */
    private correctTick(tick: DateTime): void {
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
            } else if (tick.date > 29) {
                if (isWildcard(this.month))
                    tick.month += Math.floor(tick.date / 29);
                tick.date %= 29;
            }
        } else if (bigMonths.includes(tick.month) && tick.date > 31) {
            if (isWildcard(this.month))
                tick.month += Math.floor(tick.date / 31);
            tick.date %= 31;
        } else if (tick.date > 30) {
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

    /** Gets the best interval value according to the schedule information. */
    getBestInterval(deviation = 0): number {
        let intervals: { [prop: string]: number } = {
            seconds: 1000,
            minutes: 1000 * 60,
            hours: 1000 * 60 * 60,
            date: 1000 * 60 * 60 * 24,
            week: 1000 * 60 * 60 * 24 * 7,
        };
        let interval: number; // checking period

        for (let prop in intervals) {
            if (this[prop] !== undefined) {
                interval = intervals[prop];
                break;
            }
        }

        return (interval || intervals.week) - deviation;
    }
}

/**
 * Parses schedule patterns that contains a phrase.
 * @param pattern Must be clear and understandable, statements like
 *  `2018-2-14 every day` would be incorrect, and DOT use more than one phrase
 *  that shares the
 *  same pattern.
 * @example
 *  parse('2018-2-14 20:00') // a certain time.
 *  parse('2018-*-14') // 14th day of every month in 2018.
 *  parse('*:30') // 30 minutes of every hour in today.
 *  parse('Sat 20:00') // 20:00 on Saturday in this week.
 *  // every minutes of 20 hours in the 14th day of every month.
 *  parse('2018-*-14 20:*')
 *  parse('Feb 14th 2018') // February 14th in 2018.
 *  parse('every 2 hours')
 *  parse('in 2 hours')
 *  parse('after 2 hours')
 *  parse('every day')
 *  parse('every Monday') // Monday, not Mon or monday.
 *  parse('tomorrow')
 *  parse('the day after tomorrow')
 *  parse('the day after 2 days')
 *  parse('20:00 every day')
 *  parse('*:00 every Monday') // 0 minutes of every hour on every Monday. 
 */
export function parse(pattern: string): ScheduleInfo {
    return new ScheduleInfo(pattern);
}