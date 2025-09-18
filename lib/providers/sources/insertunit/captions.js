"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCaptions = getCaptions;
const captions_1 = require("../../../providers/captions");
async function getCaptions(data) {
    let captions = [];
    for (const subtitle of data) {
        let language = '';
        if (subtitle.name.includes('Рус')) {
            language = 'ru';
        }
        else if (subtitle.name.includes('Укр')) {
            language = 'uk';
        }
        else if (subtitle.name.includes('Eng')) {
            language = 'en';
        }
        else {
            continue;
        }
        captions.push({
            id: subtitle.url,
            url: subtitle.url,
            language,
            type: 'vtt',
            hasCorsRestrictions: false,
        });
    }
    captions = (0, captions_1.removeDuplicatedLanguages)(captions);
    return captions;
}
