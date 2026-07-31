import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../../server';

function run(path: string) {
  return (req: VercelRequest, res: VercelResponse) => {
    req.url = path;
    // @ts-expect-error VercelRequest is compatible enough for Express
    return app(req, res);
  };
}

export default run('/api/ai/propose-deployment');

export const config = { maxDuration: 60 };
