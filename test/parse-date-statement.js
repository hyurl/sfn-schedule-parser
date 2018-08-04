var assert = require("assert");
var format = require("./format").format;
var parseDateStatement = require("../dist/parser").parseDateStatement;

describe("parseDateStatement(pattern: string): DateTimeLike", function () {
    var pattern1 = "runs every day",
        expected1 = { date: "*" };
    it("'" + pattern1 + "' should result in " + format(expected1), function () {
        assert.deepStrictEqual(parseDateStatement(pattern1), expected1);
    });

    var pattern2 = "runs every 2 days",
        expected2 = { date: "*/2" };
    it("'" + pattern2 + "' should result in " + format(expected2), function () {
        assert.deepStrictEqual(parseDateStatement(pattern2), expected2);
    });

    var pattern3 = "today",
        expected3 = { date: (new Date).getDate() };
    it("'" + pattern3 + "' should result in " + format(expected3), function () {
        assert.deepStrictEqual(parseDateStatement(pattern3), expected3);
    });

    var pattern4 = "tomorrow",
        expected4 = { date: (new Date).getDate() + 1 };
    it("'" + pattern4 + "' should result in " + format(expected4), function () {
        assert.deepStrictEqual(parseDateStatement(pattern4), expected4);
    });

    var pattern5 = "the day after tomorrow",
        expected5 = { date: (new Date).getDate() + 2 };
    it("'" + pattern5 + "' should result in " + format(expected5), function () {
        assert.deepStrictEqual(parseDateStatement(pattern5), expected5);
    });

    var pattern6 = "runs in 5 seconds",
        expected6 = { seconds: (new Date).getSeconds() + 5 };
    it("'" + pattern6 + "' should result in " + format(expected6), function () {
        assert.deepStrictEqual(parseDateStatement(pattern6), expected6);
    });

    var pattern7 = "on Sunday",
        expected7 = { day: 0 };
    it("'" + pattern7 + "' should result in " + format(expected7), function () {
        assert.deepStrictEqual(parseDateStatement(pattern7), expected7);
    });

    var pattern8 = "every Monday",
        expected8 = { day: 1, month: "*" };
    it("'" + pattern8 + "' should result in " + format(expected8), function () {
        assert.deepStrictEqual(parseDateStatement(pattern8), expected8);
    });

    var pattern9 = "runs every 5 seconds in this month",
        expected9 = { month: (new Date).getMonth() + 1, seconds: "*/5" };
    it("'" + pattern9 + "' should result in " + format(expected9), function () {
        assert.deepStrictEqual(parseDateStatement(pattern9), expected9);
    });

    var pattern10 = "after 10 hours",
        expected10 = { hours: (new Date).getHours() + 11 };
    it("'" + pattern10 + "' should result in " + format(expected10), function () {
        assert.deepStrictEqual(parseDateStatement(pattern10), expected10);
    });

    var pattern11 = "in 10 hours",
        expected11 = { hours: (new Date).getHours() + 10 };
    it("'" + pattern11 + "' should result in " + format(expected11), function () {
        assert.deepStrictEqual(parseDateStatement(pattern11), expected11);
    });

    var pattern12 = "runs in the next month",
        expected12 = { month: (new Date).getMonth() + 2 };
    it("'" + pattern12 + "' should result in " + format(expected12), function () {
        assert.deepStrictEqual(parseDateStatement(pattern12), expected12);
    });

    var pattern13 = "I wish this schedule will run at every hour in today",
        expected13 = { hours: "*", date: (new Date).getDate() };
    it("'" + pattern13 + "' should result in " + format(expected13), function () {
        assert.deepStrictEqual(parseDateStatement(pattern13), expected13);
    });
});