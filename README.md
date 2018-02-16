# SFN-Schedule-Parser

**A simple friendly Node.js tool for parsing schedule string patterns.**

**Notice:** this is not a schedule tool, it just exposes a common API, so that 
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
```

## Returning Values

The `parse()` function returns an `ScheduleInfo` that carries these 
information:

- `year: number | string` 2018+.
- `week: number | string` Week of year, 1 - 52.
- `day: number | string` Day of week, 1 - 7, 7 represents Sunday.
- `month: number | string` 1 - 12.
- `date: number | string` Day of month, 1 - 31.
- `hours: number | string` 0 - 23.
- `minutes: number | string` 0 - 59.
- `seconds: number | string` 0 - 59.
- `once` Whether the schedule should run only once.

If any of these properties isn't set, it's value would be `undefined`.

**Warning:** if the schedule pattern is already expired, and `RangeError` will
be thrown, the scheduler may or may not catch this error, but the scheduler 
must not start in the situation.

### The state of a schedule

The method `getState()` returns the position of the schedule, possible 
values are:

- `-1` expired, the schedule should stop now.
- `0` in position, the schedule should run now;
- `1` waiting, the schedule should wait for the next tick.

The method `getBestInterval()` returns the best interval value calculated 
according to the schedule information, so that the scheduler doesn't need to 
check the state every second when not necessary.

## How to build a scheduler?

In JavaScript, you could use `setInterval()`, `setTimeout()` or 
`process.nextTick()` in Node.js to build a scheduler, checking the date-time 
within proper period, and run any callbacks when the certain time arrives.

```javascript
const { parse } = require("sfn-schedule-parser");

var schedule = parse("20:00 every day");
var interval = schedule.getBestInterval(); // returns the best interval value.

let timer = setInterval(() => {
    let state = schedule.getState();
    if (state === 0) {
        // your task...

        if (schedule.once) {
            // because this schedule runs every day, so `schedule.once` will 
            // never be true, and this block will never run, just for example.
            clearInterval(timer);
        }
    } else if (state === -1) {
        clearInterval(timer);
    }
}, interval);
```

**Warning:** if you're going to use `setTimeout()` or `process.nextTick()`, 
make sure that your program will hang until the schedule is called at least 
once, unless you stop it manually.