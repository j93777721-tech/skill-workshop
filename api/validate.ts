import type { VercelRequest, VercelResponse } from '@vercel/node';
import { streamChat } from './lib/dashscope.js';
import { validatePrompt } from './lib/prompts-validate.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { skillContent, references = [] } = req.body;
  if (!skillContent) return res.status(400).json({ error: 'skillContent is required' });

  const prompt = validatePrompt(skillContent, references);

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  try {
    await streamChat(
      prompt,
      (chunk) => res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`),
      (full) => {
        res.write(`data: ${JSON.stringify({ type: 'done', fullContent: full })}\n\n`);
        res.end();
      },
    );
  } catch (err: any) {
    res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
    res.end();
  }
}

export const config = { maxDuration: 60 };
