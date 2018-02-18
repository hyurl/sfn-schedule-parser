export type StrOrNum = string | number;

export interface DateTimeLike {
    /** 2018+. */
    year?: StrOrNum;
    /** Week of year, `1` - `52`. */
    week?: StrOrNum;
    /** Day of week, `1` - `7`, `7` represents Sunday. */
    day?: StrOrNum;
    /** `1` - `12`. */
    month?: StrOrNum;
    /** Day of month, `1` - `31`. */
    date?: StrOrNum;
    /** `0` - `23`. */
    hours?: StrOrNum;
    /** `0` - `59`. */
    minutes?: StrOrNum;
    /** `0` - `59`. */
    seconds?: StrOrNum;
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