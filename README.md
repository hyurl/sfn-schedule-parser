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
const { parse, parseDateTime, parseStatement } = require("sfn-schedule-parser");

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

console.log(parse('20:00 every day'));
// 0 minutes of every hour on every Monday.
console.log(parse('*:00 every Monday'));
```

## Returning Values

All three functions return an object (type `ScheduleInfo` in TypeScript) that 
carries these information:

- `year: number` 2018+
- `month: number` `1` - `12`.
- `day: number` Day of week, `0` - `6`, `0` represents Sunday.
- `date: number` Day of month, `1` - `31`.
- `hours: number` `0` - `23`.
- `minutes: number` `0` - `59`.
- `seconds: number` `0` - `59`.
- `once: boolean` Whether the schedule should run only once.
- `increment: [string, number]` Increases the interval time by a specific 
    property and number when the schedule has been run.

If any of these properties isn't set, it's value would be `undefined`, when a 
value is undefined, the scheduler should not check the property.

### About `once`

The functions will set this property automatically by analyzing the input 
statement, but whether or not to run the schedule only once, it's all up to 
you. It's highly recommended that when `once` is `true` you should always run 
the schedule only once though, and stop it right after it has been run.

### About `increment`

When `increment` is set, the first element would be a property name, the 
scheduler must check this property, when the schedule has been run, the 
scheduler should set the corresponding property a new value according to the 
second element of `increment`, so that the next tick could check the new value.

The `increment` property will be set when the statement contains an `every...`
phrase, e.g.

- `every 2 hours` => ['hours', 2]
- `every day` => ['date', 1]
- `every Monday` => ['day', 1]

**Warning:** when `increment` is set, the `once` shall never be `true`.

## Checking Rules

When any property of `ScheduleInfo` is set, the scheduler must check it and 
compare the value to the current date-time, and should check as many 
properties as provided. If the current date-time matches the details that 
`ScheduleInfo` provides, the schedule runs. As talked above, when `once` is 
`true` or `increment` is set, the scheduler should act properly.

## How to build a scheduler?

In JavaScript, you could use `setInterval()`, `setTimeout()` or Node.js 
`process.nextTick()` to build a scheduler, checking the date-time within 
proper period, and run any callbacks when the certain time arrives. If you're 
using the former two, make sure that the interval you set is less than `1000` 
milliseconds.

This module also exports another two functions that allow you building a 
scheduler in no time, the following example is a very simple scheduler that 
shows you how to use them.

```javascript
const { parse, toTime, applyIncrement } = require("sfn-schedule-parser");

var info = parse("20:00 every day");

let func = info.once ? setTimeout : setInterval;
let timer = func(() => {
    let target = Math.round(toTime(info) / 1000),
        current = Math.round(Date.now() / 1000);

    if (target === current) {
        // ...
        applyIncrement(info);
    }
}, 500);
```

**Warning:** if you're going to use `process.nextTick()`, make sure that your 
program will hang until the schedule is called.