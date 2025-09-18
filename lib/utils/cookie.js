"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeCookieHeader = makeCookieHeader;
exports.parseSetCookie = parseSetCookie;
const cookie_1 = __importDefault(require("cookie"));
const set_cookie_parser_1 = __importDefault(require("set-cookie-parser"));
function makeCookieHeader(cookies) {
    return Object.entries(cookies)
        .map(([name, value]) => cookie_1.default.serialize(name, value))
        .join('; ');
}
function parseSetCookie(headerValue) {
    const splitHeaderValue = set_cookie_parser_1.default.splitCookiesString(headerValue);
    const parsedCookies = set_cookie_parser_1.default.parse(splitHeaderValue, {
        map: true,
    });
    return parsedCookies;
}
