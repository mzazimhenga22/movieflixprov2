"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasDuplicates = hasDuplicates;
function hasDuplicates(values) {
    return new Set(values).size !== values.length;
}
