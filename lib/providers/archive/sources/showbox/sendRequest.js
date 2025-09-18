"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendRequest = void 0;
const crypto_js_1 = __importDefault(require("crypto-js"));
const nanoid_1 = require("nanoid");
const common_1 = require("./common");
const crypto_1 = require("./crypto");
const randomId = (0, nanoid_1.customAlphabet)('1234567890abcdef');
const expiry = () => Math.floor(Date.now() / 1000 + 60 * 60 * 12);
const sendRequest = async (ctx, data, altApi = false) => {
    const defaultData = {
        childmode: '0',
        app_version: '11.5',
        appid: common_1.appId,
        lang: 'en',
        expired_date: `${expiry()}`,
        platform: 'android',
        channel: 'Website',
    };
    const encryptedData = (0, crypto_1.encrypt)(JSON.stringify({
        ...defaultData,
        ...data,
    }));
    const appKeyHash = crypto_js_1.default.MD5(common_1.appKey).toString();
    const verify = (0, crypto_1.getVerify)(encryptedData, common_1.appKey, common_1.key);
    const body = JSON.stringify({
        app_key: appKeyHash,
        verify,
        encrypt_data: encryptedData,
    });
    const base64body = btoa(body);
    const formatted = new URLSearchParams();
    formatted.append('data', base64body);
    formatted.append('appid', '27');
    formatted.append('platform', 'android');
    formatted.append('version', '129');
    formatted.append('medium', 'Website');
    formatted.append('token', randomId(32));
    const requestUrl = altApi ? common_1.apiUrls[1] : common_1.apiUrls[0];
    const response = await ctx.proxiedFetcher(requestUrl, {
        method: 'POST',
        headers: {
            Platform: 'android',
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'okhttp/3.2.0',
        },
        body: formatted,
    });
    return JSON.parse(response);
};
exports.sendRequest = sendRequest;
