"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.gatherAllSources = gatherAllSources;
exports.gatherAllEmbeds = gatherAllEmbeds;
const dood_1 = require("../providers/embeds/dood");
const mixdrop_1 = require("../providers/embeds/mixdrop");
const turbovid_1 = require("../providers/embeds/turbovid");
const upcloud_1 = require("../providers/embeds/upcloud");
const autoembed_1 = require("../providers/sources/autoembed");
const ee3_1 = require("../providers/sources/ee3");
const fsharetv_1 = require("../providers/sources/fsharetv");
const insertunit_1 = require("../providers/sources/insertunit");
const mp4hydra_1 = require("../providers/sources/mp4hydra");
const nepu_1 = require("../providers/sources/nepu");
const pirxcy_1 = require("../providers/sources/pirxcy");
const tugaflix_1 = require("../providers/sources/tugaflix");
const vidsrc_1 = require("../providers/sources/vidsrc");
const vidsrcvip_1 = require("../providers/sources/vidsrcvip");
const zoechip_1 = require("../providers/sources/zoechip");
const animetsu_1 = require("./embeds/animetsu");
const autoembed_2 = require("./embeds/autoembed");
const cinemaos_1 = require("./embeds/cinemaos");
const closeload_1 = require("./embeds/closeload");
const madplay_1 = require("./embeds/madplay");
const mp4hydra_2 = require("./embeds/mp4hydra");
const myanimedub_1 = require("./embeds/myanimedub");
const myanimesub_1 = require("./embeds/myanimesub");
const ridoo_1 = require("./embeds/ridoo");
const streamtape_1 = require("./embeds/streamtape");
const streamvid_1 = require("./embeds/streamvid");
const streamwish_1 = require("./embeds/streamwish");
const vidcloud_1 = require("./embeds/vidcloud");
const vidify_1 = require("./embeds/vidify");
const vidnest_1 = require("./embeds/vidnest");
const vidsrcsu_1 = require("./embeds/vidsrcsu");
const viper_1 = require("./embeds/viper");
const hls_1 = require("./embeds/warezcdn/hls");
const mp4_1 = require("./embeds/warezcdn/mp4");
const warezplayer_1 = require("./embeds/warezcdn/warezplayer");
const zunime_1 = require("./embeds/zunime");
const _8stream_1 = require("./sources/8stream");
const animeflv_1 = require("./sources/animeflv");
const animetsu_2 = require("./sources/animetsu");
const cinemaos_2 = require("./sources/cinemaos");
const coitus_1 = require("./sources/coitus");
const cuevana3_1 = require("./sources/cuevana3");
const embedsu_1 = require("./sources/embedsu");
const hdrezka_1 = require("./sources/hdrezka");
const iosmirror_1 = require("./sources/iosmirror");
const iosmirrorpv_1 = require("./sources/iosmirrorpv");
const lookmovie_1 = require("./sources/lookmovie");
const madplay_2 = require("./sources/madplay");
const myanime_1 = require("./sources/myanime");
const nunflix_1 = require("./sources/nunflix");
const rgshows_1 = require("./sources/rgshows");
const ridomovies_1 = require("./sources/ridomovies");
const slidemovies_1 = require("./sources/slidemovies");
const soapertv_1 = require("./sources/soapertv");
const streambox_1 = require("./sources/streambox");
const vidapiclick_1 = require("./sources/vidapiclick");
const vidify_2 = require("./sources/vidify");
const vidnest_2 = __importDefault(require("./sources/vidnest"));
const warezcdn_1 = require("./sources/warezcdn");
const wecima_1 = require("./sources/wecima");
const zunime_2 = require("./sources/zunime");
function gatherAllSources() {
    // all sources are gathered here
    return [
        cuevana3_1.cuevana3Scraper,
        ridomovies_1.ridooMoviesScraper,
        hdrezka_1.hdRezkaScraper,
        warezcdn_1.warezcdnScraper,
        insertunit_1.insertunitScraper,
        soapertv_1.soaperTvScraper,
        autoembed_1.autoembedScraper,
        myanime_1.myanimeScraper,
        tugaflix_1.tugaflixScraper,
        ee3_1.ee3Scraper,
        fsharetv_1.fsharetvScraper,
        vidsrc_1.vidsrcScraper,
        zoechip_1.zoechipScraper,
        mp4hydra_1.mp4hydraScraper,
        embedsu_1.embedsuScraper,
        slidemovies_1.slidemoviesScraper,
        iosmirror_1.iosmirrorScraper,
        iosmirrorpv_1.iosmirrorPVScraper,
        vidapiclick_1.vidapiClickScraper,
        coitus_1.coitusScraper,
        streambox_1.streamboxScraper,
        nunflix_1.nunflixScraper,
        _8stream_1.EightStreamScraper,
        wecima_1.wecimaScraper,
        animeflv_1.animeflvScraper,
        cinemaos_2.cinemaosScraper,
        nepu_1.nepuScraper,
        pirxcy_1.pirxcyScraper,
        vidsrcvip_1.vidsrcvipScraper,
        madplay_2.madplayScraper,
        rgshows_1.rgshowsScraper,
        vidify_2.vidifyScraper,
        zunime_2.zunimeScraper,
        vidnest_2.default,
        animetsu_2.animetsuScraper,
        lookmovie_1.lookmovieScraper,
    ];
}
function gatherAllEmbeds() {
    // all embeds are gathered here
    return [
        upcloud_1.upcloudScraper,
        vidcloud_1.vidCloudScraper,
        mixdrop_1.mixdropScraper,
        ridoo_1.ridooScraper,
        closeload_1.closeLoadScraper,
        dood_1.doodScraper,
        streamvid_1.streamvidScraper,
        streamtape_1.streamtapeScraper,
        hls_1.warezcdnembedHlsScraper,
        mp4_1.warezcdnembedMp4Scraper,
        warezplayer_1.warezPlayerScraper,
        autoembed_2.autoembedEnglishScraper,
        autoembed_2.autoembedHindiScraper,
        autoembed_2.autoembedBengaliScraper,
        autoembed_2.autoembedTamilScraper,
        autoembed_2.autoembedTeluguScraper,
        turbovid_1.turbovidScraper,
        mp4hydra_2.mp4hydraServer1Scraper,
        mp4hydra_2.mp4hydraServer2Scraper,
        vidsrcsu_1.VidsrcsuServer1Scraper,
        vidsrcsu_1.VidsrcsuServer2Scraper,
        vidsrcsu_1.VidsrcsuServer3Scraper,
        vidsrcsu_1.VidsrcsuServer4Scraper,
        vidsrcsu_1.VidsrcsuServer5Scraper,
        vidsrcsu_1.VidsrcsuServer6Scraper,
        vidsrcsu_1.VidsrcsuServer7Scraper,
        vidsrcsu_1.VidsrcsuServer8Scraper,
        vidsrcsu_1.VidsrcsuServer9Scraper,
        vidsrcsu_1.VidsrcsuServer10Scraper,
        vidsrcsu_1.VidsrcsuServer11Scraper,
        vidsrcsu_1.VidsrcsuServer12Scraper,
        vidsrcsu_1.VidsrcsuServer20Scraper,
        viper_1.viperScraper,
        streamwish_1.streamwishJapaneseScraper,
        streamwish_1.streamwishLatinoScraper,
        streamwish_1.streamwishSpanishScraper,
        streamwish_1.streamwishEnglishScraper,
        streamtape_1.streamtapeLatinoScraper,
        ...cinemaos_1.cinemaosEmbeds,
        // ...cinemaosHexaEmbeds,
        // vidsrcNovaEmbed,
        // vidsrcCometEmbed,
        // vidsrcPulsarEmbed,
        madplay_1.madplayBaseEmbed,
        madplay_1.madplayNsapiEmbed,
        madplay_1.madplayRoperEmbed,
        madplay_1.madplayNsapiVidFastEmbed,
        ...vidify_1.vidifyEmbeds,
        ...zunime_1.zunimeEmbeds,
        ...animetsu_1.AnimetsuEmbeds,
        vidnest_1.vidnestHollymoviehdEmbed,
        vidnest_1.vidnestAllmoviesEmbed,
        vidnest_1.vidnestFlixhqEmbed,
        vidnest_1.vidnestOfficialEmbed,
        myanimesub_1.myanimesubScraper,
        myanimedub_1.myanimedubScraper,
    ];
}
