const {
    parse,
    parseDateTime,
    parseStatement,
    toTime,
    applyIncrement
} = require("./");

console.log(parseDateTime('2018-2-14 20:00')); // a certain time.
console.log(parseDateTime('2018-*-14')); // 14th day of every month in 2018.
console.log(parseDateTime('*:30')); // 30 minutes of every hour in today.
console.log(parseDateTime('Sat 20:00')); // 20:00 on Saturday in this week.
// every minutes of 20 hours in the 14th day of every month.
console.log(parseDateTime('2018/*/14 20:*'));
// February 14th in 2018.
console.log(parseDateTime('Feb 14th 2018'));

console.log(parseStatement('every 2 hours'));
console.log(parseStatement('in 2 hours'));
console.log(parseStatement('after 2 hours'));
console.log(parseStatement('every day'));
console.log(parseStatement('every Monday')); // Monday, not Mon or monday.
console.log(parseStatement('tomorrow'));
console.log(parseStatement('the day after tomorrow'));
console.log(parseStatement('the day after 2 days'));

var info = parse('20:00 every day');

console.log(info);
// 0 minutes of every hour on every Monday.
console.log(parse('*:00 every Monday'));

console.log(toTime(info));
applyIncrement(info);
console.log(info);