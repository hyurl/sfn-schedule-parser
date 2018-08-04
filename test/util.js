var assert = require("assert");
var format = require("./format").format;
var util = require("../dist/util");

var date = new Date(),
    dateInfo1 = {
        hours: 8,
        minutes: 0
    },
    expected1 = {
        hours: 8,
        minutes: 0
    },
    tickInfo1 = util.getNextTick(dateInfo1, date),
    dateInfo2 = {
        hours: 8,
        minutes: "*/5"
    },
    expected2 = {
        hours: 8,
        minutes: date.getMinutes() + 5
    },
    tickInfo2 = util.getNextTick(dateInfo2, date),
    dateInfo3 = {
        hours: 8,
        minutes: "*/5",
        seconds: "*/10"
    },
    expected3 = {
        hours: 8,
        minutes: date.getMinutes(),
        seconds: date.getSeconds() + 10,
    },
    tickInfo3 = util.getNextTick(dateInfo3, date),
    dateInfo4 = {
        date: "*",
        hours: 8,
        seconds: "*/10"
    },
    expected4 = {
        date: date.getDate() + (date.getHours() > 8 ? 1 : 0),
        hours: 8,
        seconds: date.getSeconds() + 10,
    },
    tickInfo4 = util.getNextTick(dateInfo4, date),
    dateInfo5 = {
        hours: "*",
        minutes: "*/5",
        seconds: "*/10"
    },
    expected5 = {
        hours: date.getHours(),
        minutes: date.getMinutes(),
        seconds: date.getSeconds() + 10
    },
    tickInfo5 = util.getNextTick(dateInfo5, date);

if (expected2.minutes >= 60) {
    expected2.minutes -= 60;
}

if (expected3.seconds >= 60) {
    expected3.seconds -= 60;
    expected3.minutes += 5;
}

if (expected3.minutes >= 60) {
    expected3.minutes -= 60;
}

if (expected4.date > date.getDate()) {
    expected4.seconds = 0;
}

if (expected4.seconds > 59) {
    expected4.seconds -= 60;
}

if (expected5.seconds >= 60) {
    expected5.seconds -= 60;
    expected5.minutes += 5;
}

if (expected5.minutes >= 60) {
    expected5.minutes -= 60;
    expected5.hours += 1;
}

if (expected5.hours >= 24) {
    expected5.hours -= 24;
}

describe("getNextTick(dateInfo: DateTimeLike, date?: Date): DateTime", function () {
    it(format(dateInfo1) + " should result in " + format(expected1), function () {
        assert.deepStrictEqual(tickInfo1, expected1);
    });

    it(format(dateInfo2) + " should result in " + format(expected2), function () {
        assert.deepStrictEqual(tickInfo2, expected2);
    });

    it(format(dateInfo3) + " should result in " + format(expected3), function () {
        assert.deepStrictEqual(tickInfo3, expected3);
    });

    it(format(dateInfo4) + " should result in " + format(expected4), function () {
        assert.deepStrictEqual(tickInfo4, expected4);
    });

    it(format(dateInfo5) + " should result in " + format(expected5), function () {
        assert.deepStrictEqual(tickInfo5, expected5);
    });
});

var time1 = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    expected1.hours,
    expected1.minutes,
    date.getSeconds()
).getTime();
var time2 = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    expected2.hours,
    expected2.minutes,
    date.getSeconds()
).getTime();
var time3 = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    expected3.hours,
    expected3.minutes,
    expected3.seconds
).getTime();
var time4 = new Date(
    date.getFullYear(),
    date.getMonth(),
    expected4.date,
    expected4.hours,
    date.getMinutes(),
    expected4.seconds
).getTime();
var time5 = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    expected5.hours,
    expected5.minutes,
    expected5.seconds
).getTime();

describe("getNextTickTime(tickInfo: DateTime, date?: Date): number", function () {
    it(format(tickInfo1) + " should result in " + time1, function () {
        assert.strictEqual(util.getNextTickTime(tickInfo1, date), time1);
    });

    it(format(tickInfo2) + " should result in " + time2, function () {
        assert.strictEqual(util.getNextTickTime(tickInfo2, date), time2);
    });

    it(format(tickInfo3) + " should result in " + time3, function () {
        assert.strictEqual(util.getNextTickTime(tickInfo3, date), time3);
    });

    it(format(tickInfo4) + " should result in " + time4, function () {
        assert.strictEqual(util.getNextTickTime(tickInfo4, date), time4);
    });

    it(format(tickInfo5) + " should result in " + time5, function () {
        assert.strictEqual(util.getNextTickTime(tickInfo5, date), time5);
    });
});

var timeout1 = time1 - date.getTime(),
    timeout2 = time2 - date.getTime(),
    timeout3 = time3 - date.getTime(),
    timeout4 = time4 - date.getTime(),
    timeout5 = time5 - date.getTime();

describe("getBestTimeout(tickInfo: DateTime, date?: Date): number", function () {
    it(format(tickInfo1) + " should result in " + timeout1, function () {
        assert.strictEqual(util.getBestTimeout(tickInfo1, date), timeout1);
    });

    it(format(tickInfo2) + " should result in " + timeout2, function () {
        assert.strictEqual(util.getBestTimeout(tickInfo2, date), timeout2);
    });

    it(format(tickInfo3) + " should result in " + timeout3, function () {
        assert.strictEqual(util.getBestTimeout(tickInfo3, date), timeout3);
    });

    it(format(tickInfo4) + " should result in " + timeout4, function () {
        assert.strictEqual(util.getBestTimeout(tickInfo4, date), timeout4);
    });

    it(format(tickInfo5) + " should result in " + timeout5, function () {
        assert.strictEqual(util.getBestTimeout(tickInfo5, date), timeout5);
    });
});

describe("getBestInterval(tickInfo: DateTime): number", function () {
    it(format(tickInfo1) + " should result in " + (1000 * 60), function () {
        assert.strictEqual(util.getBestInterval(tickInfo1), 1000 * 60);
    });
});