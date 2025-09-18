"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeProviders = makeProviders;
const controls_1 = require("../entrypoint/controls");
const providers_1 = require("../entrypoint/providers");
const targets_1 = require("../entrypoint/utils/targets");
const get_1 = require("../providers/get");
function makeProviders(ops) {
    const features = (0, targets_1.getTargetFeatures)(ops.proxyStreams ? 'any' : ops.target, ops.consistentIpForRequests ?? false, ops.proxyStreams);
    const sources = [...(0, providers_1.getBuiltinSources)()];
    if (ops.externalSources === 'all')
        sources.push(...(0, providers_1.getBuiltinExternalSources)());
    else {
        ops.externalSources?.forEach((source) => {
            const matchingSource = (0, providers_1.getBuiltinExternalSources)().find((v) => v.id === source);
            if (!matchingSource)
                return;
            sources.push(matchingSource);
        });
    }
    const list = (0, get_1.getProviders)(features, {
        embeds: (0, providers_1.getBuiltinEmbeds)(),
        sources,
    });
    return (0, controls_1.makeControls)({
        embeds: list.embeds,
        sources: list.sources,
        features,
        fetcher: ops.fetcher,
        proxiedFetcher: ops.proxiedFetcher,
        proxyStreams: ops.proxyStreams,
    });
}
