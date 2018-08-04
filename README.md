# SFN-Schedule-Parser

**A simple friendly Node.js tool for parsing schedule string patterns in human language.**

**Notice:** this is not a ready-to-use scheduler tool, it just exposes a 
simple, friendly and common API, so that developers can build schedulers 
according to the API.

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
console.log(parse('Dec 25th 2018'));

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

// the date-time can be specified with an `*/<num>` value, to set an every...
// phrase.
console.log(parse('*/2:00')); // every 2 hours at 0 minutes in today.
console.log(parse('2018-*/2-*/5')) // every 2 months and every 5 days.
```

## Returning Values

The `parse()` function returns a `ScheduleInfo` that carries information of:

- `year?: number | string` 2018+.
- `day?: number | string` Day of week, 0 - 6, 0 represents Sunday.
- `month?: number | string` 1 - 12.
- `date?: number | string` Day of month, 1 - 31.
- `hours?: number | string` 0 - 23.
- `minutes?: number | string` 0 - 59.
- `seconds?: number | string` 0 - 59.
- `once: bool` Whether the schedule should run only once.

**Warning:** if the schedule pattern is already expired, an `RangeError` will
be thrown, the scheduler may or may not catch this error, but it must not 
start any job in this situation.

## The state of a schedule

The method `getState()` returns the state of the schedule, possible 
values are:

- `-1` expired, the schedule should stop now.
- `0` in position, the schedule should run now;
- `1` waiting, the schedule should wait for the next tick.

The methods `getBestInterval()` and `getBestTimeout()` returns the best 
interval/timeout value calculated according to the schedule information, so 
that the scheduler doesn't need to check the state every second when not 
necessary.

## Whether the schedule should run only once or more than once?

You can check this condition by accessing to the read-only property `once`, if
it returns `true`, that means the callback function of the schedule should run
only once, and after that, the scheduler must turn off. 

## How to build a scheduler?

In JavaScript, you could use `setInterval()`, `setTimeout()`, or 
`process.nextTick()` in Node.js to build a scheduler, checking the date-time 
within proper period, and run any callbacks when the time is ripe.

```javascript
const { parse } = require("sfn-schedule-parser");

var schedule = parse("20:00 every day");
var interval = schedule.getBestInterval(); // returns the best interval value.

let timer = setInterval(() => {
    let state = schedule.getState();

    if (state === 0) {
        // your task...
    } else if (state === -1) {
        clearInterval(timer);
    }
    // normally you don't need to do anything when the state is 1.
}, interval);
```

**Warning:** if you're going to use `setTimeout()` or `process.nextTick()`, 
make sure that your program will hang until the schedule is called at least 
once, unless you stop it manually.

**Tip:** it's always better to use `setTimeout()` and `getBestTimeout()` in a 
recursive function to form a scheduler, which will protect memory leak and run
fewer times of the timer callback function, in which case, more efficient. 
Look this example:

```javascript
var schedule = parse("20:00 every day");
var timer = null;
var scheduler = () => {
    let state = schedule.getState();

    if (state === 0) {
        // your task...

        if (schedule.once == false)
            start(); // continue the scheduler and waiting for the next timeout.
    } else if (state === -1) {
        clearTimeout(timer);
    }
};
var start = () => {
    timer = setTimeout(scheduler, schedule.getBestTimeout());
};

start(); // start the scheduler
```