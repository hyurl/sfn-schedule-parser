import trimRight = require("lodash/trimEnd");
import assign = require("lodash/assign");
import { DateTimeLike, DateTime } from "./types";
import {
    currentWeek,
    Months,
    BigMonths,
    Weekdays,
    Weekdays2,
    Beginnings,
    Endings,
    Props,
    ReversedProps,
    TimeoutLimit
} from "./consts";

/** Whether the input data is string '*'. */
function isWildcard(data: any): boolean {
    return typeof data == "string" && data[0] == "*";
}

function getNum(str: string): string | number {
    if (str === undefined) {
        return -1;
    } else if (isWildcard(str)) {
        return str;
    } else {
        let num = parseInt(str);
        return isNaN(num) ? -1 : num;
    }
}

function getPrevUsedProp(current: string, tick: DateTimeLike): string {
    let started = false;

    for (let prop of ReversedProps) {
        if (started && tick[prop] != undefined)
            return prop;
        else if (prop == current)
            started = true;
    }
}

/** Gets the tick information according to the current time or given date. */
export function getCurrentTick(date?: Date): DateTime {
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
    }
}

export class ScheduleInfo implements DateTimeLike {
    year: string | number;
    week: string | number;
    day: string | number;
    month: string | number;
    date: string | number;
    hours: string | number;
    minutes: string | number;
    seconds: string | number;

    /** Whether the schedule should run only once. */
    readonly once: boolean;
    /** @private */
    private nextTick: DateTime;

    /**
     * The constructor acts exactly the same as function `parse()`.
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
        let endings = ["st", "nd", "rd", "th"]; // e.g. 1st, 2nd, 3rd 4th

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

                let _part = trimRight(part, "."); // e.g. Mon. => Mon
                i = Months.indexOf(_part);
                if (i >= 0) {
                    this.month = i + 1;
                    continue;
                }

                let ending = part.substring(part.length - 2);
                let isNum = !isNaN(<any>part);

                if (endings.indexOf(ending) >= 0 || (isNum && part.length == 2)) { // match date
                    let num = parseInt(part) || -1;
                    if (this.date === undefined && num >= 1 && num <= 31)
                        this.date = num;
                } else if (isNum) { // match year
                    let num = parseInt(part) || -1;
                    if (this.year === undefined && num >= 1970)
                        this.year = num;
                }
            }
        }
    }

    /** @private */
    private setProp(prop: string, val: string | number) {
        if (typeof val == "number") {
            let min = Beginnings[prop],
                max = Endings[prop];

            this[prop] = (val >= min && val <= max) ? val : undefined;
        } else if (isWildcard(val)) {
            this[prop] = val;
        }
    }


    /** @private */
    private setDate(year: string | number, month: string | number, date: string | number) {
        this.setProp("year", year);
        this.setProp("month", month);
        this.setProp("date", date);
    }

    /** @private */
    private setTime(hours: string | number, minutes: string | number, seconds: string | number) {
        this.setProp("hours", hours);
        this.setProp("minutes", minutes);
        this.setProp("seconds", seconds);
    }

    /** @private */
    private correctDate(tick: DateTimeLike, num: number, current: DateTime, force = false) {
        let date = <number>tick.date;
        if (isWildcard(this.month) && typeof tick.month == "number") {
            tick.month = tick.month + Math.floor(date / num);
        } else if (force) {
            tick.month = current.month + Math.floor(date / num);
        }
        tick.date = date % num;
    }

    /** @private */
    private correctTick(tick: DateTimeLike, prop: string, current?: DateTime, force = false) {
        current = current || getCurrentTick();
        let ending: number = Endings[prop];

        if (prop == "date") {
            if (typeof tick.date != "number") return;

            let year: number;
            let month: number;

            // month
            if (tick.month === undefined || isWildcard(tick.month))
                month = current.month;
            else
                month = <number>tick.month;

            // year
            if (tick.year === undefined || isWildcard(tick.year))
                year = current.year;
            else
                year = <number>tick.year;

            // date
            if (month == 2) {
                if (year % 4 && tick.date > 28) {
                    this.correctDate(tick, 28, current, force);
                } else if (tick.date > 29) {
                    this.correctDate(tick, 29, current, force);
                }
            } else if (BigMonths.indexOf(month) >= 0 && <number>tick.date > 31) {
                this.correctDate(tick, 31, current, force);
            } else if (<number>tick.date > 30) {
                this.correctDate(tick, 30, current, force);
            }
        } else if (typeof tick[prop] == "number" && tick[prop] > ending) {
            let i = ReversedProps.indexOf(prop),
                step = prop == "month" ? 3 : 1,
                prev = ReversedProps[i + step];

            ending = (prop == "day" || prop == "month") ? ending : ending + 1;

            if (prev && isWildcard(this[prev]) && tick[prop] <= current[prop]) {
                tick[prev] += Math.floor(tick[prop] / ending);
            } else if (prev && force) {
                tick[prev] = current[prev] + Math.floor(tick[prop] / ending);
            }

            tick[prop] %= ending;
        }
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
     *  parseStatement('every Monday') // Monday, not Mon or Monday.
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
                if (prep == "every") {
                    this.week = "*";
                } else {
                    this.week = current.week + num;
                    this.correctTick(this, "week", current, true);
                }
                continue;
            }

            if (num === -1)
                continue;

            if (num >= 1 && units1.indexOf(unit) >= 0) {
                // plural to singular
                unit = unit.substring(0, unit.length - 1);
            } else if (num === 1 && units2.indexOf(unit) >= 0) {
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
                    this.correctTick(this, prop, current, true);
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
        Beginnings.year = current.year + 1;
        let tick: DateTime = {};
        let wildcard1: [string, number];
        let wildcard2: [string, number];
        let wildcard3: [string, number];

        for (let prop of ReversedProps) {
            if (this[prop] === undefined) {
                continue;
            } else if (typeof this[prop] == "number") {
                tick[prop] = this[prop];
            } else if (isWildcard(this[prop])) {
                let num = parseInt((<string>this[prop]).split("/")[1]);

                if (isNaN(num)) {
                    let _prop = getPrevUsedProp(prop, this);
                    num = !_prop || tick[_prop] >  current[_prop] ? 1 : 0;
                }

                if (wildcard1 === undefined) {
                    wildcard1 = [prop, num];
                    tick[prop] = Beginnings[prop];
                } else if (wildcard2 === undefined) {
                    wildcard2 = [prop, num];
                    tick[prop] = current[prop] + num;
                    this.correctTick(tick, prop, current);
                } else {
                    tick[prop] = current[prop];
                    if (wildcard3 === undefined)
                        wildcard3 = [prop, num];
                }
            }
        }

        if (wildcard1) {
            if (wildcard2 === undefined) {
                let [prop, num] = wildcard1;
                tick[prop] = current[prop] + num;
                this.correctTick(tick, prop, current);
            } else {
                let [prop1, num1] = wildcard1;
                let prop2 = wildcard2[0];
<<<<<<< HEAD
                let _tick = assign({}, tick);
=======
                let _tick = Object.assign({}, tick);
>>>>>>> d4e158353112ad07d13097e3da556091c7b4341e

                _tick[prop1] = current[prop1] + num1;
                _tick[prop2] = current[prop2];
                this.correctTick(tick, prop1, current);

                if (this.realGetState(current, _tick) !== -1) {
                    tick = _tick;
                } else if (this.realGetState(current, tick) === -1) {
                    tick[prop2] = Beginnings[prop2];
                    if (wildcard3) {
                        let [prop3] = wildcard3;
                        tick[prop3] = Beginnings[prop3];
                    }
                }
            }
        }

        return tick;
    }

    /** Gets the best interval value according to the schedule information. */
    getBestInterval(): number {
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

        return interval || intervals.week;
    }

    /** Gets the best timeout value according to the schedule information. */
    getBestTimeout(): number {
        let now = new Date();
        let tick = getCurrentTick(now);
        /** Last available property. */
        let lastProp: { name: string, value?: number };

        for (let i in ReversedProps) {
            let prop = ReversedProps[i];

            if (this.nextTick[prop] !== undefined) {
                tick[prop] = this.nextTick[prop];
                if (!lastProp) {
                    lastProp = { name: prop };
                    if (isWildcard(this[prop])) {
                        let val = (<string>this[prop]).split("/")[0] || "1";
                        lastProp.value = parseInt(val);
                    }
                }
            } else if (this.nextTick[prop] === undefined && !lastProp) {
                tick[prop] = Beginnings[prop];
            }
        }

        let i = Props.lastIndexOf(lastProp.name);
        let prop = Props[i + 1];
        if (prop !== undefined)
            tick[prop] = Beginnings[prop];

        let { year, month, date, hours, minutes, seconds } = tick;
        let target = new Date(year, month - 1, date, hours, minutes, seconds);
        let step = lastProp.value || 1;
        let timeout = (target.getTime() - now.getTime()) * step;

        // when timeout is out limit, use the limit number instead.
        timeout = timeout > TimeoutLimit ? TimeoutLimit : timeout;

        return timeout;
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
 *  parse('every Monday') // Monday, not Mon or Monday.
 *  parse('tomorrow')
 *  parse('the day after tomorrow')
 *  parse('the day after 2 days')
 *  parse('20:00 every day')
 *  parse('*:00 every Monday') // 0 minutes of every hour on every Monday. 
 */
export function parse(pattern: string): ScheduleInfo {
    return new ScheduleInfo(pattern);
}
<<<<<<< HEAD

export default parse;
=======
>>>>>>> d4e158353112ad07d13097e3da556091c7b4341e
