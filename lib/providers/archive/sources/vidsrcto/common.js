"use strict";
// This file is based on https://github.com/Ciarands/vidsrc-to-resolver/blob/dffa45e726a4b944cb9af0c9e7630476c93c0213/vidsrc.py#L16
// Full credits to @Ciarands!
Object.defineProperty(exports, "__esModule", { value: true });
exports.decryptSourceUrl = exports.decodeData = exports.decodeBase64UrlSafe = void 0;
const DECRYPTION_KEY = 'WXrUARXb1aDLaZjI';
const decodeBase64UrlSafe = (str) => {
    const standardizedInput = str.replace(/_/g, '/').replace(/-/g, '+');
    const decodedData = atob(standardizedInput);
    const bytes = new Uint8Array(decodedData.length);
    for (let i = 0; i < bytes.length; i += 1) {
        bytes[i] = decodedData.charCodeAt(i);
    }
    return bytes;
};
exports.decodeBase64UrlSafe = decodeBase64UrlSafe;
const decodeData = (key, data) => {
    const state = Array.from(Array(256).keys());
    let index1 = 0;
    for (let i = 0; i < 256; i += 1) {
        index1 = (index1 + state[i] + key.charCodeAt(i % key.length)) % 256;
        const temp = state[i];
        state[i] = state[index1];
        state[index1] = temp;
    }
    index1 = 0;
    let index2 = 0;
    let finalKey = '';
    for (let char = 0; char < data.length; char += 1) {
        index1 = (index1 + 1) % 256;
        index2 = (index2 + state[index1]) % 256;
        const temp = state[index1];
        state[index1] = state[index2];
        state[index2] = temp;
        if (typeof data[char] === 'string') {
            finalKey += String.fromCharCode(data[char].charCodeAt(0) ^ state[(state[index1] + state[index2]) % 256]);
        }
        else if (typeof data[char] === 'number') {
            finalKey += String.fromCharCode(data[char] ^ state[(state[index1] + state[index2]) % 256]);
        }
    }
    return finalKey;
};
exports.decodeData = decodeData;
const decryptSourceUrl = (sourceUrl) => {
    const encoded = (0, exports.decodeBase64UrlSafe)(sourceUrl);
    const decoded = (0, exports.decodeData)(DECRYPTION_KEY, encoded);
    return decodeURIComponent(decodeURIComponent(decoded));
};
exports.decryptSourceUrl = decryptSourceUrl;
