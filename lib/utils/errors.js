"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotFoundError = void 0;
class NotFoundError extends Error {
    constructor(reason) {
        super(`Couldn't find a stream: ${reason ?? 'not found'}`);
        this.name = 'NotFoundError';
    }
}
exports.NotFoundError = NotFoundError;
