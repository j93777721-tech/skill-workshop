# Skill Workshop

基于 Accio Skills 官方规范的 Skill 校验与生成工具。一页式交互，两大核心功能：

**校验 Skill** — 粘贴或上传已有的 SKILL.md，AI 基于三份官方规范做全量合规检查，输出结构化表格报告（FAIL / WARN / PASS），支持一键生成修复建议。

**造 Skill** — 用自然语言描述想法，AI 先评估可行性（判断该做 Skill / Tool / SubAgent），再流式生成完整的 SKILL.md，右侧面板实时显示结构合规检查。

## 截图

校验 Skill 报告（表格化 FAIL/WARN/PASS）：

![validate](https://raw.githubusercontent.com/wiki/placeholder/validate.png)

从点子生成 Skill（可行性评估 + 流式生成）：

![generate](https://raw.githubusercontent.com/wiki/placeholder/generate.png)

## 技术栈

- **前端**：React 18 + Vite + Tailwind CSS + react-markdown
- **后端**：Node.js + Express + tsx（TypeScript 直接运行）
- **AI**：百炼 CLI (`bl text chat`) —— qwen-plus 模型，SSE 流式输出
- **规范知识库**：内置三份官方规范文件（`backend/src/specs/`）

## 前置要求

- Node.js >= 18
- [百炼 CLI (`bl`)](https://help.aliyun.com/zh/model-studio/bailian-cli) 已安装并配置好 API Key

```bash
# 安装百炼 CLI
npm install -g @anthropic-ai/bailian-cli
# 配置 API Key
bl configure
```

## 快速开始

```bash
# 克隆仓库
git clone https://github.com/YOUR_USERNAME/skill-workshop.git
cd skill-workshop

# 安装后端依赖并启动
cd backend
npm install
npm run dev
# 后端运行在 http://localhost:3001

# 新开终端，安装前端依赖并启动
cd frontend
npm install
npm run dev
# 前端运行在 http://localhost:5173
```

打开浏览器访问 `http://localhost:5173` 即可体验。

## 项目结构

```
skill-workshop/
├── backend/
│   ├── src/
│   │   ├── index.ts              # Express 入口
│   │   ├── load-specs.ts         # 加载三份规范文件
│   │   ├── routes/
│   │   │   ├── validate.ts       # POST /api/validate, POST /api/validate/fix
│   │   │   └── generate.ts       # POST /api/skill/evaluate, POST /api/skill/generate
│   │   ├── prompts/
│   │   │   ├── validate.ts       # 校验 & 修复的 prompt 模板
│   │   │   └── generate.ts       # 评估 & 生成的 prompt 模板
│   │   └── specs/                # 三份官方规范 md 文件
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.tsx               # 单页布局 + Tab 切换
│   │   ├── views/
│   │   │   ├── ValidateView.tsx  # 校验视图
│   │   │   └── GenerateView.tsx  # 生成视图
│   │   ├── services/api.ts       # SSE 流式请求 + JSON 请求
│   │   └── index.css             # Tailwind + markdown 表格样式
│   └── package.json
└── README.md
```

## API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/validate` | POST | 校验 SKILL.md（SSE 流式返回报告） |
| `/api/validate/fix` | POST | 根据报告生成修复建议（SSE 流式） |
| `/api/skill/evaluate` | POST | 评估点子可行性（同步返回 JSON） |
| `/api/skill/generate` | POST | 生成 SKILL.md（SSE 流式） |

## License

MIT
