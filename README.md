# SFN-Schedule-Parser

**A simple friendly Node.js tool for parsing schedule string patterns.**

**Notice:** This is not a schedule tool, it just exposes a common API, so that 
developers can build schedulers according to the API.

## Install

```sh
npm i sfn-schedule-parser
```

## Example

```javascript
const { parse } = require("sfn-schedule-parser");

console.log(parse('2018-2-14 20:00')); // a certain time.
console.log(parse('2018-*-14')); // 14th day of every month in 2018.
console.log(parse('*:30')); // 30 minutes of every hour in today.
console.log(parse('Sat 20:00')); // 20:00 on Saturday in this week.
// every minutes of 20 hours in the 14th day of every month.
console.log(parse('2018/*/14 20:*'));
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
```

## Returning Values

The `parse()` function returns an `ScheduleInfo` that carries these 
information:

- `year: number | "*"` 2018+
- `month: number | "*"` `1` - `12`.
- `day: number | "*"` Day of week, `0` - `6`, `0` represents Sunday.
- `date: number | "*"` Day of month, `1` - `31`.
- `hours: number | "*"` `0` - `23`.
- `minutes: number | "*"` `0` - `59`.
- `seconds: number | "*"` `0` - `59`.

If any of these properties isn't set, it's value would be `undefined`; if the 
parsing pattern contains any asterisks (`*`), the corresponding property will 
be set to `*`.

### The state of a schedule

The getter property `state` indicates the position of the schedule, possible 
values are:

- `-1` expired, the schedule should stop now.
- `0` in position, the schedule should run now;
- `1` waiting, the schedule should wait for the next tick.

## How to build a scheduler?

In JavaScript, you could use `setInterval()`, `setTimeout()` or Node.js 
`process.nextTick()` to build a scheduler, checking the date-time within 
proper period, and run any callbacks when the certain time arrives. If you're 
using the former two, make sure that the interval you set is less than `1000` 
milliseconds.

```javascript
const { parse } = require("sfn-schedule-parser");

var info = parse("20:00 every day");

let timer = setInterval(() => {
    let state = info.state; // it's better to call info.state just once.
    if (state === 0) {
        // ...
        info.update(); // update the schedule info.
    } else if (state === -1) {
        clearInterval(timer);
    }
}, 500);
```

**Warning:** if you're going to use `setTimeout()` or `process.nextTick()`, 
make sure that your program will hang until the schedule is called at least 
once, unless you stop it manually.

## Customizing API

If you're not going to use the `state` property, you can manually check the 
properties in the `ScheduleInfo`, and compare them to the current time.