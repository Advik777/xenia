import type { NextFunction, Request, Response } from 'express';
import { UserErrors } from '../lib/userErrors.js';

/** Wraps an async route handler so thrown errors reach the error middleware. */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: UserErrors.notFound });
}

// Express needs the 4-arg signature to recognise this as an error handler.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  // eslint-disable-next-line no-console
  console.error('Unhandled error:', err);
  if (res.headersSent) return;
  res.status(500).json({ error: UserErrors.serverError });
}
