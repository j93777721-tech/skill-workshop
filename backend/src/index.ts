import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import validateRouter from './routes/validate.js';
import generateRouter from './routes/generate.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.use('/api/validate', validateRouter);
app.use('/api/skill', generateRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Skill Workshop backend running on http://localhost:${PORT}`);
});
