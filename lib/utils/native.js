"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isReactNative = void 0;
const isReactNative = () => {
    try {
        // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
        require('react-native');
        return true;
    }
    catch (e) {
        return false;
    }
};
exports.isReactNative = isReactNative;
