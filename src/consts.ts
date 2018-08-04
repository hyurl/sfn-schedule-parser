import { DateTime } from "./types";

export const Months = [
    undefined,
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

export const BigMonths = [1, 3, 5, 7, 8, 10, 12];

export const Weekdays = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
];

export const Weekdays2 = ["Sun", "Mon", "Tues", "Wed", "Thurs", "Fri", "Sat"];

export const Beginnings: DateTime = {
    year: 1970,
    day: 1,
    month: 1,
    date: 1,
    hours: 0,
    minutes: 0,
    seconds: 0
};

export const Endings: DateTime = {
    year: 9999,
    day: 7,
    month: 12,
    date: 31,
    hours: 23,
    minutes: 59,
    seconds: 59
};

export const Props = Object.keys(Beginnings);

export const ReversedProps = Object.keys(Beginnings).reverse();

export const TimeoutLimit = Math.pow(2, 31) - 1;