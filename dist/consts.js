"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const currentWeekNumber = require("current-week-number");
exports.currentWeek = currentWeekNumber;
exports.Months = [
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
exports.BigMonths = [1, 3, 5, 7, 8, 10, 12];
exports.Weekdays = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday"
];
exports.Weekdays2 = ["Mon", "Tues", "Wed", "Thurs", "Fri", "Sat", "Sun"];
exports.Beginnings = {
    year: 1970,
    week: 1,
    day: 1,
    month: 1,
    date: 1,
    hours: 0,
    minutes: 0,
    seconds: 0
};
exports.Endings = {
    year: 9999,
    week: 52,
    day: 7,
    month: 12,
    date: 31,
    hours: 23,
    minutes: 59,
    seconds: 59
};
exports.Props = Object.keys(exports.Beginnings);
exports.ReversedProps = Object.keys(exports.Beginnings).reverse();
exports.TimeoutLimit = Math.pow(2, 31) - 1;
//# sourceMappingURL=consts.js.map