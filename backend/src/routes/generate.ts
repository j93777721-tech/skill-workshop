import { Router, Request, Response } from 'express';
import { spawn, execFile } from 'child_process';
import { evaluatePrompt, generatePrompt } from '../prompts/generate.js';

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
      if (!text) return;
    }
    fullOutput += text;
    res.write(`data: ${JSON.stringify({ type: 'chunk', content: text })}\n\n`);
  });

  child.stderr.on('data', (chunk: Buffer) => {
    console.error('[bl stderr]', chunk.toString().slice(0, 200));
  });

  child.on('close', () => {
    res.write(`data: ${JSON.stringify({ type: 'done', fullContent: fullOutput })}\n\n`);
    res.end();
  });

  child.on('error', (err) => {
    res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
    res.end();
  });

  res.on('close', () => { child.kill(); });
}

// 评估可行性（同步，返回 JSON）
router.post('/evaluate', async (req: Request, res: Response) => {
  const { idea, references = [] } = req.body;
  if (!idea) {
    res.status(400).json({ error: 'idea is required' });
    return;
  }

  const prompt = evaluatePrompt(idea, references);
  const messages = JSON.stringify([{ role: 'user', content: prompt }]);

  try {
    // Use spawn to pipe messages via stdin
    const result = await new Promise<string>((resolve, reject) => {
      const child = spawn('bl', [
        'text', 'chat',
        '--messages-file', '-',
        '--no-stream',
        '--output', 'json',
        '--model', 'qwen-plus',
        '--max-tokens', '4096',
      ], { env: { ...process.env } });

      child.stdin.write(messages);
      child.stdin.end();

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString(); });
      child.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });

      child.on('close', (code) => {
        if (code !== 0) reject(new Error(`bl exited with code ${code}: ${stderr}`));
        else resolve(stdout);
      });
      child.on('error', reject);
    });

    // bl --output json returns: request_id line + JSON body
    // Extract the AI content from the JSON response
    let aiContent = '';
    const jsonLines = result.split('\n');
    // Find the JSON object in the output
    const jsonStart = result.indexOf('{');
    if (jsonStart !== -1) {
      const jsonStr = result.slice(jsonStart);
      try {
        const parsed = JSON.parse(jsonStr);
        if (parsed.choices?.[0]?.message?.content) {
          aiContent = parsed.choices[0].message.content;
        } else if (parsed.content) {
          aiContent = parsed.content;
        }
      } catch {
        // Try to find a nested JSON in the content
        aiContent = jsonStr;
      }
    }

    // Now extract the evaluation JSON from the AI content
    const evalJsonMatch = aiContent.match(/\{[\s\S]*\}/);
    if (evalJsonMatch) {
      const evaluation = JSON.parse(evalJsonMatch[0]);
      res.json({ success: true, evaluation });
    } else {
      res.json({ success: false, error: 'AI 未返回有效 JSON', raw: aiContent || result });
    }
  } catch (err: any) {
    console.error('[evaluate error]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 生成 Skill（流式）
router.post('/generate', (req: Request, res: Response) => {
  const { idea, evaluation, references = [] } = req.body;
  if (!idea || !evaluation) {
    res.status(400).json({ error: 'idea and evaluation are required' });
    return;
  }
  const prompt = generatePrompt(idea, evaluation, references);
  streamBl(prompt, res);
});

export default router;
