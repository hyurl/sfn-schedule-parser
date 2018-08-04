var assert = require("assert");
var format = require("./format").format;
var assign = require("lodash/assign");
var parse = require("../").default;
var ScheduleInfo = require("../").ScheduleInfo;

describe("parse(pattern: string): ScheduleInfo", function () {
    var date = new Date,
        pattern1 = "runs at 8:00 every day",
        expected1 = assign(Object.create(ScheduleInfo.prototype), {
            pattern: pattern1,
            date: "*",
            hours: 8,
            minutes: 0,
            once: false,
            nextTick: {
                date: date.getDate() + (date.getHours() > 8 ? 1 : 0),
                hours: 8,
                minutes: 0
            }
        });
    it("'" + pattern1 + "' should result in " + format(expected1), function () {
        var res = parse(pattern1),
            state = (new Date).getHours() == 8 ? 0 : 1;

        assert.deepStrictEqual(res, expected1);
        assert.strictEqual(res.getState(), state);
    });

    var pattern2 = "runs at 8:00 today",
        expected2 = assign(Object.create(ScheduleInfo.prototype), {
            pattern: pattern2,
            date: new Date().getDate(),
            hours: 8,
            minutes: 0,
            once: true,
            nextTick: {
                date: (new Date).getDate(),
                hours: 8,
                minutes: 0
            }
        });
    it("'" + pattern2 + "' should result in " + format(expected2), function () {
        if ((new Date).getHours() <= 8) {
            assert.deepStrictEqual(parse(pattern2), expected2);
        } else {
            try {
                parse(pattern2);
            } catch (e) {
                assert.strictEqual(e.toString(), "RangeError: Schedule pattern is already expired.");
            }
        }
    });
});