import { useState, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { streamRequest } from '../services/api';
import { Play, Copy, Download, Wrench, Loader2, Plus, X, FileText } from 'lucide-react';

const DEFAULT_SKILL = `---
name: supplier-analyzer
description: 当用户需要分析供应商靠不靠谱时，自动查询供应商交易数据、评价和纠纷率，给出综合评分和建议。
trigger_keywords:
  - 分析供应商
  - 供应商靠谱吗
  - 查一下这个供应商
---

# Supplier Analyzer

帮助用户快速评估 1688 供应商的可靠性。

## When to Use
当用户提到"分析供应商"、"这个供应商靠谱吗"等关键词时触发。

## Steps
1. 从用户消息中提取供应商名称或链接
2. 调用 1688 API 查询供应商基础信息
3. 获取交易数据、买家评价、纠纷率等指标
4. 综合评分并生成分析报告

## Examples
用户：帮我分析一下"义乌好货贸易有限公司"靠不靠谱
助手：正在查询该供应商信息...（输出综合评分报告）`;

export default function ValidateView() {
  const [skillContent, setSkillContent] = useState(DEFAULT_SKILL);
  const [references, setReferences] = useState<{ name: string; content: string }[]>([]);
  const [report, setReport] = useState('');
  const [fixContent, setFixContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [fixLoading, setFixLoading] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'validating' | 'done'>('idle');
  const reportRef = useRef<HTMLDivElement>(null);

  const handleValidate = useCallback(() => {
    if (!skillContent.trim()) return;
    setReport('');
    setFixContent('');
    setLoading(true);
    setPhase('validating');

    streamRequest(
      '/validate',
      { skillContent, references: references.map(r => r.content) },
      (chunk) => setReport(prev => prev + chunk),
      (full) => { setLoading(false); setPhase('done'); },
      (msg) => { setReport(prev => prev || `Error: ${msg}`); setLoading(false); setPhase('done'); },
    ).catch((err) => {
      console.error('[handleValidate] unhandled:', err);
      setReport(prev => prev || `Error: ${err?.message || '未知错误'}`);
      setLoading(false);
      setPhase('done');
    });
  }, [skillContent, references]);

  const handleFix = useCallback(() => {
    if (!report) return;
    setFixContent('');
    setFixLoading(true);

    streamRequest(
      '/validate/fix',
      { skillContent, report },
      (chunk) => setFixContent(prev => prev + chunk),
      () => setFixLoading(false),
      (msg) => { setFixContent(prev => prev || `Error: ${msg}`); setFixLoading(false); },
    ).catch((err) => {
      console.error('[handleFix] unhandled:', err);
      setFixContent(`Error: ${err?.message || '未知错误'}`);
      setFixLoading(false);
    });
  }, [skillContent, report]);

  const handleAddRef = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.md,.txt';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        setReferences(prev => [...prev, { name: file.name, content: ev.target!.result as string }]);
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleFileUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.md,.txt';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => setSkillContent(ev.target!.result as string);
      reader.readAsText(file);
    };
    input.click();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      {/* Input section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">校验已有 Skill</h2>
          <button onClick={handleFileUpload} className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
            <FileText size={14} /> 上传文件
          </button>
        </div>

        <textarea
          value={skillContent}
          onChange={e => setSkillContent(e.target.value)}
          placeholder={'粘贴 SKILL.md 内容...\n\n---\nname: my-skill\ndescription: ...\n---\n\n# My Skill\n...'}
          className="w-full h-64 p-4 border border-gray-200 rounded-lg font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
          spellCheck={false}
        />

        {/* References */}
        <div className="mt-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm text-gray-600">references/ 文件（可选）：</span>
            <button onClick={handleAddRef} className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              <Plus size={14} /> 添加
            </button>
          </div>
          {references.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {references.map((ref, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm">
                  {ref.name}
                  <button onClick={() => setReferences(prev => prev.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500">
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleValidate}
            disabled={!skillContent.trim() || loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
            {loading ? '校验中...' : '开始校验'}
          </button>
        </div>
      </div>

      {/* Report section */}
      {(report || phase === 'validating') && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">
              校验报告
              {loading && <span className="ml-2 text-sm font-normal text-blue-600">生成中...</span>}
            </h2>
            {phase === 'done' && (
              <div className="flex gap-2">
                <button onClick={() => copyToClipboard(report)} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
                  <Copy size={14} /> 复制
                </button>
                <button onClick={() => {
                  const blob = new Blob([report], { type: 'text/markdown' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url; a.download = 'skill-check-report.md'; a.click();
                }} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
                  <Download size={14} /> 下载
                </button>
              </div>
            )}
          </div>
          <div ref={reportRef} className="markdown-report text-sm text-gray-700 leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{report}</ReactMarkdown>
          </div>
          {phase === 'done' && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={handleFix}
                disabled={fixLoading}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 disabled:opacity-50 transition-colors"
              >
                {fixLoading ? <Loader2 size={16} className="animate-spin" /> : <Wrench size={16} />}
                {fixLoading ? '生成中...' : '一键生成修复建议'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Fix suggestions */}
      {fixContent && (
        <div className="bg-white rounded-xl border border-amber-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">修复建议</h2>
            <button onClick={() => copyToClipboard(fixContent)} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
              <Copy size={14} /> 复制全部
            </button>
          </div>
          <div className="markdown-report text-sm text-gray-700 leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{fixContent}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
