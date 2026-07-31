import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../../server.ts';

function run(path: string) {
  return (req: VercelRequest, res: VercelResponse) => {
    req.url = path;
    return app(req, res);
  };
}

export default run('/api/ai/meeting-summary');

export const config = { maxDuration: 60 };
