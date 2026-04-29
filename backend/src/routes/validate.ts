import { Router, Request, Response } from 'express';
import { spawn } from 'child_process';
import { validatePrompt, fixPrompt } from '../prompts/validate.js';

const router = Router();

function streamBl(prompt: string, res: Response) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  const messages = JSON.stringify([{ role: 'user', content: prompt }]);

  const child = spawn('bl', [
    'text', 'chat',
    '--messages-file', '-',
    '--stream',
    '--output', 'text',
    '--model', 'qwen-plus',
    '--max-tokens', '8192',
  ], {
    env: { ...process.env },
  });

  // Write messages to stdin then close it
  child.stdin.write(messages);
  child.stdin.end();

  let fullOutput = '';
  let isFirstChunk = true;

  child.stdout.on('data', (chunk: Buffer) => {
    let text = chunk.toString();
    // Strip request_id line from first chunk
    if (isFirstChunk) {
      isFirstChunk = false;
      text = text.replace(/^request_id:.*\n/, '');
      if (!text) return; // nothing left after stripping
    }
    fullOutput += text;
    res.write(`data: ${JSON.stringify({ type: 'chunk', content: text })}\n\n`);
  });

  child.stderr.on('data', (chunk: Buffer) => {
    console.error('[bl stderr]', chunk.toString().slice(0, 200));
  });

  child.on('close', (code) => {
    res.write(`data: ${JSON.stringify({ type: 'done', fullContent: fullOutput })}\n\n`);
    res.end();
  });

  child.on('error', (err) => {
    res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
    res.end();
  });

  res.on('close', () => {
    child.kill();
  });
}

// 校验 Skill
router.post('/', (req: Request, res: Response) => {
  const { skillContent, references = [] } = req.body;
  if (!skillContent) {
    res.status(400).json({ error: 'skillContent is required' });
    return;
  }
  const prompt = validatePrompt(skillContent, references);
  streamBl(prompt, res);
});

// 生成修复建议
router.post('/fix', (req: Request, res: Response) => {
  const { skillContent, report } = req.body;
  if (!skillContent || !report) {
    res.status(400).json({ error: 'skillContent and report are required' });
    return;
  }
  const prompt = fixPrompt(skillContent, report);
  streamBl(prompt, res);
});

export default router;
