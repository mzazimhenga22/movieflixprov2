/**
 * Middleware for API key enforcement.
 *
 * Keys come from your `.env` file:
 *   PUSH_API_KEY=@Mzazimhenga02
 *   ADMIN_API_KEY=@Mzazimhenga02
 *
 * Use headers:
 *   x-push-api-key: @Mzazimhenga02
 *   x-admin-api-key: @Mzazimhenga02
 */

import { Request, Response, NextFunction } from "express";

export function requirePushApiKey(req: Request, res: Response, next: NextFunction) {
  const expected = process.env.PUSH_API_KEY;
  if (!expected) return next(); // allow if unset (dev mode)

  const got =
    req.headers["x-push-api-key"] ||
    req.query.apiKey ||
    req.body?.apiKey;

  if (String(got) !== String(expected)) {
    return res.status(401).json({ ok: false, error: "invalid push api key" });
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const expected = process.env.ADMIN_API_KEY;
  if (!expected) return next(); // allow if unset (dev mode)

  const got =
    req.headers["x-admin-api-key"] ||
    req.query.adminKey ||
    req.body?.adminKey;

  if (String(got) !== String(expected)) {
    return res.status(401).json({ ok: false, error: "admin auth required" });
  }
  next();
}
