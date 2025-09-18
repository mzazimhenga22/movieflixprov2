"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logDeepObject = logDeepObject;
const node_util_1 = require("node:util");
function logDeepObject(object) {
    // This is the dev cli, so we can use console.log
    // eslint-disable-next-line no-console
    console.log((0, node_util_1.inspect)(object, { showHidden: false, depth: null, colors: true }));
}
