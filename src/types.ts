export interface DateTimeLike {
    /** 2018+. */
    year?: string | number;
    /** Week of year, `1` - `52`. */
    week?: string | number;
    /** Day of week, `1` - `7`, `7` represents Sunday. */
    day?: string | number;
    /** `1` - `12`. */
    month?: string | number;
    /** Day of month, `1` - `31`. */
    date?: string | number;
    /** `0` - `23`. */
    hours?: string | number;
    /** `0` - `59`. */
    minutes?: string | number;
    /** `0` - `59`. */
    seconds?: string | number;
}

export interface DateTime extends DateTimeLike {
    year?: number;
    week?: number;
    day?: number;
    month?: number;
    date?: number;
    hours?: number;
    minutes?: number;
    seconds?: number;
};