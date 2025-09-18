"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encrypt = encrypt;
exports.getVerify = getVerify;
const crypto_js_1 = __importDefault(require("crypto-js"));
const common_1 = require("./common");
function encrypt(str) {
    return crypto_js_1.default.TripleDES.encrypt(str, crypto_js_1.default.enc.Utf8.parse(common_1.key), {
        iv: crypto_js_1.default.enc.Utf8.parse(common_1.iv),
    }).toString();
}
function getVerify(str, str2, str3) {
    if (str) {
        return crypto_js_1.default.MD5(crypto_js_1.default.MD5(str2).toString() + str3 + str).toString();
    }
    return null;
}
