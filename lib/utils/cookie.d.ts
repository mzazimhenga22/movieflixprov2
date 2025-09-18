export interface Cookie {
    name: string;
    value: string;
}
export declare function makeCookieHeader(cookies: Record<string, string>): string;
export declare function parseSetCookie(headerValue: string): Record<string, Cookie>;
