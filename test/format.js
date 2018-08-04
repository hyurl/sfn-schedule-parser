var util = require("util");

/**
 * @param {any} obj
 * @returns {string} 
 */
function format(obj) {
    return util.format(obj).split("\n ").join("");
}

exports.format = format;