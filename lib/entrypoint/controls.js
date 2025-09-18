"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeControls = makeControls;
const meta_1 = require("../entrypoint/utils/meta");
const common_1 = require("../fetchers/common");
const individualRunner_1 = require("../runners/individualRunner");
const runner_1 = require("../runners/runner");
function makeControls(ops) {
    const list = {
        embeds: ops.embeds,
        sources: ops.sources,
    };
    const providerRunnerOps = {
        features: ops.features,
        fetcher: (0, common_1.makeFetcher)(ops.fetcher),
        proxiedFetcher: (0, common_1.makeFetcher)(ops.proxiedFetcher ?? ops.fetcher),
        proxyStreams: ops.proxyStreams,
    };
    return {
        runAll(runnerOps) {
            return (0, runner_1.runAllProviders)(list, {
                ...providerRunnerOps,
                ...runnerOps,
            });
        },
        runSourceScraper(runnerOps) {
            return (0, individualRunner_1.scrapeInvidualSource)(list, {
                ...providerRunnerOps,
                ...runnerOps,
            });
        },
        runEmbedScraper(runnerOps) {
            return (0, individualRunner_1.scrapeIndividualEmbed)(list, {
                ...providerRunnerOps,
                ...runnerOps,
            });
        },
        getMetadata(id) {
            return (0, meta_1.getSpecificId)(list, id);
        },
        listSources() {
            return (0, meta_1.getAllSourceMetaSorted)(list);
        },
        listEmbeds() {
            return (0, meta_1.getAllEmbedMetaSorted)(list);
        },
    };
}
