const { parse } = require("./");

console.log(parse('2018-2-14 20:00')); // a certain time.
console.log(parse('2018-*-14')); // 14th day of every month in 2018.
console.log(parse('*:30')); // 30 minutes of every hour in today.
console.log(parse('Sat 20:00')); // 20:00 on Saturday in this week.
// every minutes of 20 hours in the 14th day of every month.
console.log(parse('2018-*-14 20:*'));
// February 14th in 2018.
console.log(parse('Feb 14th 2018'));

console.log(parse('every 2 hours'));
console.log(parse('in 2 hours'));
console.log(parse('after 2 hours'));
console.log(parse('every day'));
console.log(parse('every Monday')); // Monday, not Mon or monday.
console.log(parse('tomorrow'));
console.log(parse('the day after tomorrow'));
console.log(parse('the day after 2 days'));

console.log(parse('20:00 every day'));
// 0 minutes of every hour on every Monday.
console.log(parse('*:00 every Monday'));