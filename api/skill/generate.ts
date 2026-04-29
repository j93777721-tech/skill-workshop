import type { VercelRequest, VercelResponse } from '@vercel/node';
import { streamChat } from '../lib/dashscope';
import { generatePrompt } from '../lib/prompts-generate';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { idea, evaluation, refMaterials = [] } = req.body;
  if (!idea) return res.status(400).json({ error: 'idea is required' });
  if (!evaluation) return res.status(400).json({ error: 'evaluation is required' });

  const prompt = generatePrompt(idea, evaluation, refMaterials);

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
