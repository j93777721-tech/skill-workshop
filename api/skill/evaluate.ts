import type { VercelRequest, VercelResponse } from '@vercel/node';
import { syncChat } from '../lib/dashscope.js';
import { evaluatePrompt } from '../lib/prompts-generate.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { idea, refMaterials = [] } = req.body;
  if (!idea) return res.status(400).json({ error: 'idea is required' });

  const prompt = evaluatePrompt(idea, refMaterials);

  try {
    const result = await syncChat(prompt);

    // Parse JSON from the response
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({ success: false, error: 'Failed to parse evaluation result' });
    }

    const evaluation = JSON.parse(jsonMatch[0]);
    return res.status(200).json({ success: true, evaluation });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export const config = { maxDuration: 60 };
