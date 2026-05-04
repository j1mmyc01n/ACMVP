export declare function json(body: unknown, init?: ResponseInit): Response;
/**
 * Wrap a handler so thrown HttpError instances become typed JSON responses
 * and any other failure becomes a 500 without leaking internals.
 */
export declare function handler(fn: (req: Request) => Promise<Response>): (req: Request) => Promise<Response>;
export declare function readJson<T>(req: Request): Promise<T>;
//# sourceMappingURL=response.d.ts.map