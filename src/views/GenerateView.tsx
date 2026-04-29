import { useState, useCallback } from 'react';
import { postJSON, streamRequest } from '../services/api';
import { Lightbulb, Loader2, CheckCircle, XCircle, ArrowRight, Copy, Download, Plus, X, FileText, RotateCcw } from 'lucide-react';

interface Reasoning { check: string; pass: boolean; detail: string; }
interface StepPreview { name: string; description: string; }
interface Evaluation {
  feasible: boolean;
  recommendation: string;
  skillType: string | null;
  suggestedName: string;
  reasoning: Reasoning[];
  summary: string;
  steps: StepPreview[];
}

const DEFAULT_IDEA = `我想做一个 Skill，当用户发来一篇英文文章或论文摘要时，自动翻译成中文，并提取出 3-5 个核心观点做成摘要卡片，方便快速了解内容。`;

export default function GenerateView() {
  const [idea, setIdea] = useState(DEFAULT_IDEA);
  const [refFiles, setRefFiles] = useState<{ name: string; content: string }[]>([]);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [evalLoading, setEvalLoading] = useState(false);
  const [evalError, setEvalError] = useState('');

  const [generated, setGenerated] = useState('');
  const [genLoading, setGenLoading] = useState(false);
  const [genDone, setGenDone] = useState(false);

  const [phase, setPhase] = useState<'input' | 'evaluated' | 'generating' | 'done'>('input');

  const handleEvaluate = useCallback(async () => {
    if (!idea.trim()) return;
    setEvalLoading(true);
    setEvalError('');
    setEvaluation(null);
    setGenerated('');
    setGenDone(false);

    try {
      const res = await postJSON('/skill/evaluate', {
        idea,
        references: refFiles.map(r => r.content),
      });
      if (res.success && res.evaluation) {
        setEvaluation(res.evaluation);
        setPhase('evaluated');
      } else {
        setEvalError(res.error || 'AI 评估失败');
      }
    } catch (err: any) {
      setEvalError(err.message || '请求失败');
    } finally {
      setEvalLoading(false);
    }
  }, [idea, refFiles]);

  const handleGenerate = useCallback(() => {
    if (!evaluation) return;
    setGenerated('');
    setGenLoading(true);
    setGenDone(false);
    setPhase('generating');

    streamRequest(
      '/skill/generate',
      { idea, evaluation, references: refFiles.map(r => r.content) },
      (chunk) => setGenerated(prev => prev + chunk),
      () => { setGenLoading(false); setGenDone(true); setPhase('done'); },
      (msg) => { setGenerated(prev => prev || `Error: ${msg}`); setGenLoading(false); setPhase('done'); },
    ).catch((err) => {
      console.error('[handleGenerate] unhandled:', err);
      setGenerated(prev => prev || `Error: ${err?.message || '未知错误'}`);
      setGenLoading(false);
      setPhase('done');
    });
  }, [idea, evaluation, refFiles]);

  const handleAddRef = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.md,.txt';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        setRefFiles(prev => [...prev, { name: file.name, content: ev.target!.result as string }]);
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleReset = () => {
    setPhase('input');
    setEvaluation(null);
    setGenerated('');
    setGenDone(false);
  };

  const copyToClipboard = (text: string) => navigator.clipboard.writeText(text);

  const typeLabel: Record<string, string> = {
    WORKFLOW: '工作流类', TOOL: '工具类', SCENARIO: '场景类',
    'CAPABILITY-ROUTING': '能力类(模板路由)', 'CAPABILITY-SPEC': '能力类(规范注入)',
  };

  return (
    <div className="space-y-6">
      {/* Idea input */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">从点子造 Skill</h2>
          {phase !== 'input' && (
            <button onClick={handleReset} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
              <RotateCcw size={14} /> 重来
            </button>
          )}
        </div>

        <textarea
          value={idea}
          onChange={e => setIdea(e.target.value)}
          placeholder={'描述你的想法...\n\n例如：我想做一个 Skill，当用户说"帮我分析一下这个供应商靠不靠谱"的时候，自动去查供应商的交易数据、评价、纠纷率，然后给出综合评分和建议。'}
          className="w-full h-36 p-4 border border-gray-200 rounded-lg text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={phase === 'generating'}
        />

        {/* Reference files */}
        <div className="mt-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm text-gray-600">补充材料（可选）：</span>
            <button onClick={handleAddRef} className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              <Plus size={14} /> 上传
            </button>
          </div>
          {refFiles.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {refFiles.map((f, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm">
                  <FileText size={12} /> {f.name}
                  <button onClick={() => setRefFiles(prev => prev.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500">
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {phase === 'input' && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleEvaluate}
              disabled={!idea.trim() || evalLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {evalLoading ? <Loader2 size={16} className="animate-spin" /> : <Lightbulb size={16} />}
              {evalLoading ? '评估中...' : '评估可行性'}
            </button>
          </div>
        )}
        {evalError && <p className="mt-2 text-sm text-red-500">{evalError}</p>}
      </div>

      {/* Evaluation result */}
      {evaluation && (
        <div className={`bg-white rounded-xl border p-6 ${evaluation.feasible ? 'border-green-200' : 'border-red-200'}`}>
          <div className="flex items-center gap-3 mb-4">
            {evaluation.feasible
              ? <CheckCircle size={24} className="text-green-500" />
              : <XCircle size={24} className="text-red-500" />
            }
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                {evaluation.feasible ? '适合做 Skill' : `不建议做 Skill，建议做 ${evaluation.recommendation === 'tool' ? 'Tool' : 'SubAgent'}`}
              </h2>
              <p className="text-sm text-gray-500">{evaluation.summary}</p>
            </div>
          </div>

          {/* Reasoning checks */}
          <div className="space-y-2 mb-4">
            {evaluation.reasoning.map((r, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                {r.pass
                  ? <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                  : <XCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
                }
                <div>
                  <span className="font-medium text-gray-700">{r.check}</span>
                  <span className="text-gray-500 ml-1">- {r.detail}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Suggested positioning */}
          {evaluation.feasible && evaluation.steps.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                <span>类型：<strong className="text-gray-800">{typeLabel[evaluation.skillType || ''] || evaluation.skillType}</strong></span>
                <span>建议命名：<code className="bg-white px-2 py-0.5 rounded text-blue-700">{evaluation.suggestedName}</code></span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {evaluation.steps.map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm">
                      <span className="text-gray-400 text-xs">Step {i + 1}</span>
                      <div className="font-medium text-gray-800">{s.name}</div>
                    </div>
                    {i < evaluation.steps.length - 1 && <ArrowRight size={14} className="text-gray-300" />}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            {!evaluation.feasible && (
              <button onClick={handleGenerate} className="text-sm text-gray-500 hover:text-gray-700">
                我还是想试试生成
              </button>
            )}
            {evaluation.feasible && phase === 'evaluated' && (
              <button
                onClick={handleGenerate}
                className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
              >
                <Wand2 size={16} /> 开始生成 Skill
              </button>
            )}
          </div>
        </div>
      )}

      {/* Generated SKILL.md */}
      {(generated || phase === 'generating') && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">
              生成的 SKILL.md
              {genLoading && <span className="ml-2 text-sm font-normal text-blue-600">生成中...</span>}
            </h2>
            {genDone && (
              <div className="flex gap-2">
                <button onClick={() => copyToClipboard(generated)} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
                  <Copy size={14} /> 复制
                </button>
                <button onClick={() => {
                  const blob = new Blob([generated], { type: 'text/markdown' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url; a.download = `${evaluation?.suggestedName || 'skill'}-SKILL.md`; a.click();
                }} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
                  <Download size={14} /> 下载
                </button>
              </div>
            )}
          </div>

          {/* Two-pane layout */}
          <div className="flex divide-x divide-gray-100" style={{ minHeight: '400px' }}>
            {/* Left: source */}
            <div className="flex-1 p-4 overflow-auto">
              <pre className="text-sm font-mono text-gray-800 whitespace-pre-wrap leading-relaxed">{generated || '等待生成...'}</pre>
            </div>
            {/* Right: structure preview */}
            <div className="w-72 p-4 bg-gray-50 overflow-auto flex-shrink-0">
              <StructurePreview content={generated} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 快速引入 Wand2
function Wand2({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z"/>
      <path d="m14 7 3 3"/><path d="M5 6v4"/><path d="M19 14v4"/><path d="M10 2v2"/><path d="M7 8H3"/><path d="M21 16h-4"/><path d="M11 3H9"/>
    </svg>
  );
}

function StructurePreview({ content }: { content: string }) {
  if (!content) return <p className="text-sm text-gray-400">等待生成...</p>;

  // 简单解析 frontmatter 和结构
  const lines = content.split('\n');
  let name = '—', desc = '—', hasWhenToUse = false, hasWhenNotToUse = false;
  let hasSteps = false, hasExamples = false, hasErrorHandling = false;
  let inFrontmatter = false, fmLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '---') {
      if (inFrontmatter) { inFrontmatter = false; continue; }
      inFrontmatter = true; continue;
    }
    if (inFrontmatter) {
      fmLines.push(line);
      if (trimmed.startsWith('name:')) name = trimmed.slice(5).trim();
      if (trimmed.startsWith('description:')) desc = trimmed.slice(12).trim().slice(0, 60) + '...';
    }
    if (/^#{1,3}\s.*when\s+to\s+use/i.test(trimmed)) hasWhenToUse = true;
    if (/^#{1,3}\s.*when\s+not/i.test(trimmed) || /^#{1,3}\s.*skip\s+for/i.test(trimmed) || /^#{1,3}\s.*不适用/i.test(trimmed) || /^#{1,3}\s.*什么时候不/i.test(trimmed)) hasWhenNotToUse = true;
    if (/^#{1,3}\s.*step/i.test(trimmed) || /^#{1,3}\s.*步骤/i.test(trimmed)) hasSteps = true;
    if (/^#{1,3}\s.*example/i.test(trimmed) || /^#{1,3}\s.*示例/i.test(trimmed)) hasExamples = true;
    if (/^#{1,3}\s.*error/i.test(trimmed) || /^#{1,3}\s.*错误/i.test(trimmed)) hasErrorHandling = true;
  }

  const checks = [
    { label: 'name 命名', pass: /^[a-z][a-z0-9-]*$/.test(name) },
    { label: 'description', pass: desc !== '—' },
    { label: 'When to Use', pass: hasWhenToUse },
    { label: 'When NOT to Use', pass: hasWhenNotToUse },
    { label: 'Steps', pass: hasSteps },
    { label: 'Examples', pass: hasExamples },
    { label: '错误处理', pass: hasErrorHandling },
  ];

  const passCount = checks.filter(c => c.pass).length;
  const warnCount = checks.filter(c => !c.pass).length;

  return (
    <div className="space-y-4 text-sm">
      <div>
        <div className="text-gray-400 text-xs mb-1">名称</div>
        <div className="font-medium text-gray-800">{name}</div>
      </div>
      <div>
        <div className="text-gray-400 text-xs mb-1">描述</div>
        <div className="text-gray-600">{desc}</div>
      </div>
      <div className="pt-2 border-t border-gray-200">
        <div className="text-gray-400 text-xs mb-2">实时合规检查</div>
        <div className="space-y-1.5">
          {checks.map((c, i) => (
            <div key={i} className="flex items-center gap-2">
              {c.pass
                ? <CheckCircle size={14} className="text-green-500" />
                : <XCircle size={14} className="text-amber-400" />
              }
              <span className={c.pass ? 'text-gray-700' : 'text-amber-600'}>{c.label}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-2 border-t border-gray-200 text-xs text-gray-500">
          PASS: {passCount} | WARN: {warnCount}
        </div>
      </div>
    </div>
  );
}
