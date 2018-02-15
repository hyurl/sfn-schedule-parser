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

export class ScheduleInfo {
    /** 2018+ */
    year: number | "*";
    /** `1` - `12`. */
    month: number | "*";
    /** Day of week, `0` - `6`, `0` represents Sunday. */
    day: number | "*";
    /** Day of month, `1` - `31`. */
    date: number | "*";
    /** `0` - `23`. */
    hours: number | "*";
    /** `0` - `59`. */
    minutes: number | "*";
    /** `0` - `59`. */
    seconds: number | "*";
    /**
     * - `-1` expired, the schedule should stop now.
     * - `0` in position, the schedule should run now;
     * - `1` waiting, the schedule should wait for the next tick.
     */
    get state(): number {
        let target = Math.floor(this.toTime() / 1000);
        let current = Math.floor(Date.now() / 1000);
        let res = target - current;
        return res ? (res > 0 || this[increment] ? 1 : -1) : 0;
    };

    /**
     * If `pattern` is a string, the constructor acts exactly the same as 
     * function `parse()`.
     */
    constructor(pattern: string | Date) {
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
        } else {
            this.year = pattern && pattern.getFullYear();
            this.month = pattern && pattern.getMonth() + 1;
            this.day = pattern && pattern.getDay();
            this.date = pattern && pattern.getDate();
            this.hours = pattern && pattern.getHours();
            this.minutes = pattern && pattern.getMinutes();
            this.seconds = pattern && pattern.getSeconds();
        }
    }

    /**
     * Parses date-time pattern.
     * @private
     * @param pattern The date part could be `yyyy-mm-dd`, `mm-dd-yyyy`, 
     *  `mm-dd`; the time part could be `HH:mm:ss`, `HH::mm`; the weekday and 
     *  month part must be a short-hand writing of names, e.g. `Mon`, `Sun`, 
     *  `Feb`, `Oct`. Every part is optional and unordered, when a certain 
     *  value is unknown, use the placeholder `*` instead.
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
        let parts = pattern.split(/[\.\s]+/);

        for (let part of parts) {
            let nums: string[],
                isDate: boolean = false,
                isTime: boolean = false;

            if (part.indexOf(":") > 0) { // match H:i:s
                nums = part.split(":");
                isTime = true;
            } else if (part.match(/[\-\/]/)) { // match Y-m-d or m-d-Y
                nums = part.split(/[\-\/]/);
                isDate = true;
            }

            if (isDate || isTime) {
                let num1 = nums[0] === "*" ? nums[0] : parseInt(nums[0]) || -1,
                    num2 = nums[1] === "*" ? nums[1] : parseInt(nums[1]) || -1,
                    num3 = nums[2] === "*" ? nums[2] : parseInt(nums[2]) || -1;

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

    /**
     * @private
     */
    private setDate(year, month, date) {
        if(typeof year === "number")
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

    /**
     * @private
     */
    private setTime(hours, minutes, seconds) {
        if(typeof hours == "number")
            this.hours = hours >= 0 && hours <= 23 ? hours : undefined;
        else
            this.hours = hours;

        if(typeof minutes == "number")
            this.minutes = minutes >= 0 && minutes <= 59 ? minutes : undefined;
        else
            this.minutes = minutes;

        if(typeof seconds == "number")
            this.seconds = seconds >= 0 && seconds <= 59 ? seconds : undefined;
        else
            this.seconds = seconds;
    }

    /**
     * Parses statements in human language.
     * @private
     * @param pattern The number in the string must be decimal, and must be a 
     *  certain date or period.
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
    private parseStatement(pattern: string): void {
        let re1 = /(every|in|after)\s+(\d+)\s+(\w+)/i;
        let re2 = /(every)\s+(\w+)/i;
        let re3 = /today|tomorrow|the\s+day\s+after\s+(.+)/i;
        let units1 = ["days", "months", "years", "weeks"];
        let units2 = ["hour", "minute", "second"];
        let prep: string;
        let num: number;
        let unit: string;
        let prop: string;

        let match = re1.exec(pattern) || re2.exec(pattern) || re3.exec(pattern);
        if (match) {
            if (match.length === 4) { // match re1
                prep = match[1].toLowerCase();
                num = parseInt(match[2]) || -1;
                unit = match[3].toLowerCase();
            } else {
                if (match[1] === "every") { // match re2
                    prep = "every";
                    let i = Weekdays.indexOf(match[2]);
                    if (i >= 0) { // match weekdays
                        this.day = i;
                        return;
                    } else {
                        num = 1;
                        unit = match[2].toLowerCase();
                    }
                } else if (match[0] === "today") {
                    this.date = new Date().getDate();
                    return;
                } else if (match[0] === "tomorrow") {
                    num = 1;
                } else {
                    if (match[1] === "tomorrow") {
                        num = 2;
                    } else {
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
            unit = unit.substring(0, unit.length - 1); // plural to singular
        } else if (num === 1 && units2.includes(unit)) {
            unit += "s"; // singular to plural
        }

        if (unit == "day" || unit == "week") {
            prop = "date";
            if (unit == "week")
                num = num * 7;
        } else {
            prop = unit;
        }

        if (num && Props.includes(prop)) {
            let current = ScheduleInfo.getCurrent();

            if (prep === "in" || prep === "after") { // in... or after...
                num = prep == "in" ? num : (num + 1);
                this[prop] = current[prop] + num;
            } else { // every...
                this[prop] = current[prop];
                this[increment] = [prop, num];
            }

            this.correct();
        }
    }

    /**
     * @private
     */
    private correct(): void {
        let current: { [x: string]: number } = <any>ScheduleInfo.getCurrent();
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
                } else if (this.date > 29) {
                    this.month = current.month + Math.floor(this.date / 29);
                    this.date %= 29;
                }
            } else if (typeof this.month == "number"
                && bigMonths.includes(this.month) && this.date > 31) {
                this.month = current.month + Math.floor(this.date / 31);
                this.date %= 31;
            } else if (this.date > 30) {
                this.month = current.month + Math.floor(this.date / 30);
                this.date %= 30;
            }
        }

        if (typeof this.month == "number" && this.month > 12) {
            this.year = current.year + Math.floor(this.month / 12);
            this.month %= 12;
        }
    }

    /** Updates information if the pattern contains an `every...` phrase. */
    update(): void {
        if (this[increment]) {
            this[this[increment][0]] += this[increment][1];
            this.correct();
        }
    }

    /**
     * Gets the UNIX timestamp according to the schedule information, if a 
     * property is undefined or `*`, the current date-time will be used.
     */
    toTime() {
        let current = (<typeof ScheduleInfo>this.constructor).getCurrent();
        let info: { [x: string]: number } = {};

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

    /** Gets a ScheduleInfo instance according to the current time. */
    static getCurrent(): ScheduleInfo {
        return new this(new Date);
    }

    static parse(pattern: string): ScheduleInfo {
        return new this(pattern);
    }
}

/**
 * Parses schedule patterns that contains a phrase.
 * @param pattern Must be clear and understandable, statements like
 *  `2018-2-14 every day` would be incorrect.
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