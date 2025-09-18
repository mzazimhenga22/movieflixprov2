"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBuiltinSources = getBuiltinSources;
exports.getBuiltinExternalSources = getBuiltinExternalSources;
exports.getBuiltinEmbeds = getBuiltinEmbeds;
const all_1 = require("../providers/all");
function getBuiltinSources() {
    return (0, all_1.gatherAllSources)().filter((v) => !v.disabled && !v.externalSource);
}
function getBuiltinExternalSources() {
    return (0, all_1.gatherAllSources)().filter((v) => v.externalSource && !v.disabled);
}
function getBuiltinEmbeds() {
    return (0, all_1.gatherAllEmbeds)().filter((v) => !v.disabled);
}
