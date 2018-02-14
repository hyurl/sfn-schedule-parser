export type ScheduleInfo = {
    /** 2018+ */
    year?: number,
    /** `1` - `12`. */
    month?: number,
    /** Day of week, `0` - `6`, `0` represents Sunday. */
    day?: number,
    /** Day of month, `1` - `31`. */
    date?: number,
    /** `0` - `23`. */
    hours?: number,
    /** `0` - `59`. */
    minutes?: number,
    /** `0` - `59`. */
    seconds?: number,
    /** Whether the schedule should run only once. */
    once?: boolean,
    /**
     * Increases the interval time by a specific property and number when the 
     * schedule has been run.
     */
    increment?: [string, number]
};

export const ScheduleInfo: ScheduleInfo = {
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

function getDateInfo(): ScheduleInfo {
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

/**
 * Parses date-time pattern.
 * @param pattern The date part could be `yyyy-mm-dd`, `mm-dd-yyyy`, `mm-dd`;
 *  the time part could be `HH:mm:ss`, `HH::mm`; the weekday and month part 
 *  must be a short-hand writing of names, e.g. `Mon`, `Sun`, `Feb`, `Otc`. 
 *  Every part is optional and unordered, when a certain value is unknown, use
 *  the placeholder `*` instead.
 * @example
 *  parseDateTime('2018-2-14 20:00') // a certain time.
 *  parseDateTime('2018-*-14') // 14th day of every month in 2018. 
 *  parseDateTime('*:30') // 30 minutes of every hour in today.
 *  parseDateTime('Sat 20:00') // 20:00 on Saturday in this week.
 *  // every minutes of 20 hours in the 14th day of every month.
 *  parseDateTime('2018-*-14 20:*')
 *  // February 14th in 2018.
 *  parseDateTime('Feb 14th 2018');
 */
export function parseDateTime(pattern: string): ScheduleInfo {
    let parts = pattern.split(/[\.\s]+/);
    let info: ScheduleInfo = Object.assign({}, ScheduleInfo, {
        once: pattern.indexOf("*") === -1
    });

    for (let part of parts) {
        let numbers: string[],
            isDate: boolean = false,
            isTime: boolean = false;

        if (part.indexOf(":") > 0) { // match H:i:s
            numbers = part.split(":");
            isTime = true;
        } else if (part.match(/[\-\/]/)) { // match Y-m-d or m-d-Y
            numbers = part.split(/[\-\/]/);
            isDate = true;
        }

        if (isDate || isTime) {
            let num1 = parseInt(numbers[0]),
                num2 = parseInt(numbers[1]),
                num3 = parseInt(numbers[2]);

            num1 = isNaN(num1) ? -1 : num1;
            num2 = isNaN(num2) ? -1 : num2;
            num3 = isNaN(num3) ? -1 : num3;

            if (isDate) {
                if (num3 > 31 || num3 === -1) {
                    info.year = num3 >= 1970 ? num3 : undefined;
                    info.month = num1 >= 1 && num1 <= 12 ? num1 : undefined;
                    info.date = num2 >= 1 && num2 <= 31 ? num2 : undefined;
                } else {
                    info.year = num1 >= 1970 ? num1 : undefined;
                    info.month = num2 >= 1 && num2 <= 12 ? num2 : undefined;
                    info.date = num3 >= 1 && num3 <= 31 ? num3 : undefined;
                }
            } else {
                info.hours = num1 >= 0 && num1 <= 23 ? num1 : undefined;
                info.minutes = num2 >= 0 && num2 <= 59 ? num2 : undefined;
                info.seconds = num3 >= 0 && num3 <= 59 ? num3 : undefined;
            }
        } else {
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

            if (!isNaN(<any>part) || part.substring(part.length - 2) === "th") {
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

/**
 * Parses statements in human language.
 * @param str The number in the string must be decimal, and must be a certain 
 *  time or period, uncertain statement like `every week`, `every month` are 
 *  not supported.
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
export function parseStatement(str: string): ScheduleInfo {
    let info: ScheduleInfo = Object.assign({}, ScheduleInfo);
    let re1 = /(every|in|after)\s+(\d+)\s+(\w+)/i;
    let re2 = /(every)\s+(\w+)/i;
    let re3 = /today|tomorrow|the\s+day\s+after\s+(.+)/i;
    let props = Object.keys(info);
    let units = ["day", "month", "year", "week"];
    let prep: string;
    let num: number;
    let unit: string;
    let prop: string;

    props.pop();

    let match = re1.exec(str) || re2.exec(str) || re3.exec(str);
    if (match) {
        if (match.length === 4) { // match re1
            prep = match[1].toLowerCase();
            num = parseInt(match[2]) || -1;
            unit = match[3].toLowerCase();
        } else {
            if (match[1] === "every") { // match re2
                prep = "every";
                let i = Weekdays.indexOf(match[2]);
                if (i >= 0) {
                    info.day = i;
                    info.once = false;
                } else {
                    num = 1;
                    unit = match[2].toLowerCase();
                }
            } else if (match[0] === "today") {
                num = 0;
                info.once = true;
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

        if (prep === "in" || prep === "after") { // in... or after...
            if (unit == "week") {
                num = num * 7;
            }
            num = prep == "in" ? num : (num + 1);
            info[prop] = current[prop] + num;
            info.once = true;
        } else { // every...
            info.once = false;
            info[prop] = current[prop];
            info.increment = [prop, num];
        }
    }

    return info;
}

/**
 * Parses schedule strings, this is the combination of `parseDateTime()` and 
 * `parseStatement()`.
 * @param str Must be clear and understandable, statements like 
 *  `2018-2-14 every day` would be incorrect.
 * @example
 *  parse('20:00 every day')
 *  parse('*:00 every Monday') // 0 minutes of every hour on every Monday. 
 */
export function parse(str: string): ScheduleInfo {
    let info: ScheduleInfo = {};
    let info1 = parseStatement(str);
    let info2 = parseDateTime(str);
    for (let i in ScheduleInfo) {
        if (i === "once") continue;

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


/**
 * Gets the UNIX timestamp according to the schedule information.
 * @param info If a property is undefined, the current date-time will be used.
 */
export function toTime(info: ScheduleInfo): number {
    let current = getDateInfo();
    let copy = Object.assign({}, info);
    for (let i in info) {
        if(info[i] === undefined)
            copy[i] = current[i];
        else
            copy[i] = info[i];
    }
    let { year, month, date, hours, minutes, seconds } = copy;
    return new Date(year, month, date, hours, minutes, seconds).getTime();
}

/** Automatically applies increment of the schedule information. */
export function applyIncrement(info: ScheduleInfo) {
    if(info.increment && !info.once)
        info[info.increment[0]] += info.increment[1];
}