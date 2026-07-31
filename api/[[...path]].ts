import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../server';

/** Catch-all: /api/ai/mine|analyze|propose-deployment|meeting-summary */
export default function handler(req: VercelRequest, res: VercelResponse) {
  return app(req as any, res as any);
}

export const config = {
  maxDuration: 60,
};
