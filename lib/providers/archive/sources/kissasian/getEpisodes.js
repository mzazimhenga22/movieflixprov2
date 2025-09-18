"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEpisodes = getEpisodes;
function getEpisodes(dramaPage) {
    const episodesEl = dramaPage('.episodeSub');
    return episodesEl
        .toArray()
        .map((ep) => {
        const number = dramaPage(ep).find('.episodeSub a').text().split('Episode')[1]?.trim();
        const url = dramaPage(ep).find('.episodeSub a').attr('href');
        return { number, url };
    })
        .filter((e) => !!e.url);
}
