"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeBody = serializeBody;
const form_data_1 = __importDefault(require("form-data"));
const native_1 = require("../utils/native");
function serializeBody(body) {
    if (body === undefined || typeof body === 'string' || body instanceof URLSearchParams || body instanceof form_data_1.default) {
        if (body instanceof URLSearchParams && (0, native_1.isReactNative)()) {
            return {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: body.toString(),
            };
        }
        return {
            headers: {},
            body,
        };
    }
    // serialize as JSON
    return {
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    };
}
