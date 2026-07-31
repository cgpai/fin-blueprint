import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../../server';

/** Ensure Express sees the full path it registered. */
function run(path: string) {
  return (req: VercelRequest, res: VercelResponse) => {
    req.url = path;
    // @ts-expect-error VercelRequest is compatible enough for Express
    return app(req, res);
  };
}

export default run('/api/ai/mine');

export const config = { maxDuration: 60 };
