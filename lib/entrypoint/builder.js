"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildProviders = buildProviders;
const controls_1 = require("../entrypoint/controls");
const providers_1 = require("../entrypoint/providers");
const targets_1 = require("../entrypoint/utils/targets");
const get_1 = require("../providers/get");
function buildProviders() {
    let consistentIpForRequests = false;
    let target = null;
    let fetcher = null;
    let proxiedFetcher = null;
    const embeds = [];
    const sources = [];
    const builtinSources = (0, providers_1.getBuiltinSources)();
    const builtinExternalSources = (0, providers_1.getBuiltinExternalSources)();
    const builtinEmbeds = (0, providers_1.getBuiltinEmbeds)();
    return {
        enableConsistentIpForRequests() {
            consistentIpForRequests = true;
            return this;
        },
        setFetcher(f) {
            fetcher = f;
            return this;
        },
        setProxiedFetcher(f) {
            proxiedFetcher = f;
            return this;
        },
        setTarget(t) {
            target = t;
            return this;
        },
        addSource(input) {
            if (typeof input !== 'string') {
                sources.push(input);
                return this;
            }
            const matchingSource = [...builtinSources, ...builtinExternalSources].find((v) => v.id === input);
            if (!matchingSource)
                throw new Error('Source not found');
            sources.push(matchingSource);
            return this;
        },
        addEmbed(input) {
            if (typeof input !== 'string') {
                embeds.push(input);
                return this;
            }
            const matchingEmbed = builtinEmbeds.find((v) => v.id === input);
            if (!matchingEmbed)
                throw new Error('Embed not found');
            embeds.push(matchingEmbed);
            return this;
        },
        addBuiltinProviders() {
            sources.push(...builtinSources);
            embeds.push(...builtinEmbeds);
            return this;
        },
        build() {
            if (!target)
                throw new Error('Target not set');
            if (!fetcher)
                throw new Error('Fetcher not set');
            const features = (0, targets_1.getTargetFeatures)(target, consistentIpForRequests);
            const list = (0, get_1.getProviders)(features, {
                embeds,
                sources,
            });
            return (0, controls_1.makeControls)({
                fetcher,
                proxiedFetcher: proxiedFetcher ?? undefined,
                embeds: list.embeds,
                sources: list.sources,
                features,
            });
        },
    };
}
