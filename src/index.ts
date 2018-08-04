import assign = require("lodash/assign");
import { DateTimeLike, DateTime } from "./types";
import { parseDateString, parseDateStatement } from "./parser";
import { shouldRunOnce, getNextTick, getTicKState, getBestInterval, getBestTimeout } from "./util";

export class ScheduleInfo implements DateTimeLike {
    year?: string | number;
    day?: string | number;
    month?: string | number;
    date?: string | number;
    hours?: string | number;
    minutes?: string | number;
    seconds?: string | number;
    /** Whether the schedule should run only once. */
    readonly once: boolean;
    readonly pattern: string;
    private nextTick: DateTime;

    constructor(pattern: string) {
        let date = new Date;

        assign(this, parseDateString(pattern), parseDateStatement(pattern, date));
        this.pattern = pattern;
        this.once = shouldRunOnce(this);
        this.nextTick = getNextTick(this, date);

        if (this.getState() === -1)
            throw new RangeError("Schedule pattern is already expired.");
    }

    /**
     * - `-1` expired, the schedule should stop now.
     * - `0` in position, the schedule should run now;
     * - `1` waiting, the schedule should wait for the next tick.
     */
    getState() {
        let state = getTicKState(this, this.nextTick);

        if (state === 0)
            this.nextTick = getNextTick(this);

        return state;
    }

    getBestTimeout() {
        return getBestTimeout(this.nextTick);
    }

    getBestInterval() {
        return getBestInterval(this.nextTick);
    }
}

export function parse(pattern: string) {
    return new ScheduleInfo(pattern);
}

export default parse;