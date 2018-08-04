var assert = require("assert");
var format = require("./format").format;
var parser = require("../dist/parser");

describe("parseDateString(pattern: string): DateTimeLike", function () {
    var pattern1 = "2018-08-01 8:*";
    var expected1 = {
        year: 2018,
        month: 8,
        date: 1,
        hours: 8,
        minutes: "*",
    };

    it("'" + pattern1 + "' should result in " + format(expected1), function () {
        assert.deepStrictEqual(parser.parseDateString(pattern1), expected1);
    });

    var pattern2 = "2018-08-* *:30:10";
    var expected2 = {
        year: 2018,
        month: 8,
        date: "*",
        hours: "*",
        minutes: 30,
        seconds: 10
    };

    it("'" + pattern2 + "' should result in " + format(expected2), function () {
        assert.deepStrictEqual(parser.parseDateString(pattern2), expected2);
    });

    var pattern3 = "08-*-2018 *:*:*/10";
    var expected3 = {
        year: 2018,
        month: 8,
        date: "*",
        hours: "*",
        minutes: "*",
        seconds: "*/10"
    };
    
    it("'" + pattern3 + "' should result in " + format(expected3), function () {
        assert.deepStrictEqual(parser.parseDateString(pattern3), expected3);
    });

    var pattern4 = "*:*:*/10 08-*-2018";
    var expected4 = expected3;

    it("'" + pattern4 + "' should result in " + format(expected4), function () {
        assert.deepStrictEqual(parser.parseDateString(pattern4), expected4);
    });

    var pattern5 = "Sun Jul 29 2018 *:00:00 GMT+0800";
    var expected5 = {
        year: 2018,
        month: 7,
        day: 0,
        date: 29,
        hours: "*",
        minutes: 0,
        seconds: 0
    };

    it("'" + pattern5 + "' should result in " + format(expected5), function () {
        assert.deepStrictEqual(parser.parseDateString(pattern5), expected5);
    });

    var pattern6 = "Sun. Jul. 29th 2018 *:00:00 GMT+0800";
    var expected6 = expected5;
    it("'" + pattern6 + "' should result in " + format(expected6), function () {
        assert.deepStrictEqual(parser.parseDateString(pattern6), expected6);
    });
});
