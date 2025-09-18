export declare const flags: {
    readonly CORS_ALLOWED: "cors-allowed";
    readonly IP_LOCKED: "ip-locked";
    readonly CF_BLOCKED: "cf-blocked";
    readonly PROXY_BLOCKED: "proxy-blocked";
};
export type Flags = (typeof flags)[keyof typeof flags];
export declare const targets: {
    readonly BROWSER: "browser";
    readonly BROWSER_EXTENSION: "browser-extension";
    readonly NATIVE: "native";
    readonly ANY: "any";
};
export type Targets = (typeof targets)[keyof typeof targets];
export type FeatureMap = {
    requires: Flags[];
    disallowed: Flags[];
};
export declare const targetToFeatures: Record<Targets, FeatureMap>;
export declare function getTargetFeatures(target: Targets, consistentIpForRequests: boolean, proxyStreams?: boolean): FeatureMap;
export declare function flagsAllowedInFeatures(features: FeatureMap, inputFlags: Flags[]): boolean;
