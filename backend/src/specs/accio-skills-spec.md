# Accio Skills 规范（规范2精要）

来源：《Accio Skills 规范》— Skill 分类体系、结构设计、设计原则的官方规范。

---

## 一、Skill 分类体系

| 类型 | 核心特征 | 典型示例 |
|------|---------|---------|
| 工具类 (TOOL) | 提供工具集/API，按需调用，组合使用 | document-parser、tariff-calculator |
| 工作流类 (WORKFLOW) | 定义固定流程，步骤化执行，顺序依赖 | product-compare、canvas-design |
| 能力类-模板路由 (CAPABILITY-ROUTING) | 识别类型 → 加载模板 → 执行 | business-email（询价/催单/投诉模板） |
| 能力类-规范注入 (CAPABILITY-SPEC) | 注入规范，自动应用 | quote-format（报价单格式规范） |
| 场景类 (SCENARIO) | 端到端解决垂直场景，整合多个工具 | product-selection、product-design |

**能力类两种子类型可组合使用。**

## 二、各类型必选要素矩阵

| 要素 | 说明 | 工具类 | 工作流类 | 能力类(路由) | 能力类(规范) | 场景类 |
|------|------|:------:|:-------:|:-----------:|:-----------:|:-----:|
| name | 小写+连字符 | 必需 | 必需 | 必需 | 必需 | 必需 |
| description | 功能描述+触发条件(<100词) | 必需 | 必需 | 必需 | 必需 | 必需 |
| When to Use | 适用场景列表 | 必需 | 必需 | 必需 | 必需 | 必需 |
| How to Use | 使用方法/流程 | 必需 | 必需 | 必需 | 必需 | 必需 |
| Quick Reference | 工具/能力速查表 | 必需 | — | — | — | — |
| Steps (I/A/O) | 步骤定义 | — | 必需 | — | — | 可选 |
| Routing Logic | 类型→模板映射 | — | — | 必需 | — | — |
| Spec Definition | 字段/格式/校验规则 | — | — | — | 必需 | — |
| Output Format | 输出格式定义 | 可选 | 必需 | 可选 | 必需 | 可选 |
| Examples | 使用示例 | 必需 | 可选 | 必需 | 可选 | 必需 |
| Dependencies | 依赖声明 | — | 可选 | — | — | 必需 |
| Next Steps | 指向 references/ | 可选 | 可选 | 可选 | 可选 | 可选 |
| scripts/ | 可执行脚本 | 必需 | 可选 | — | — | 可选 |
| references/ | 参考文档 | 可选 | 可选 | — | 可选 | 可选 |
| assets/ | 资源文件 | 可选 | 可选 | 可选 | 可选 | 可选 |

## 三、标准目录结构

```
skill-name/
├── SKILL.md              # [必需] 核心指令文件
├── LICENSE.txt           # [推荐] 许可证
├── scripts/              # [可选] 可执行脚本
├── references/           # [可选] 参考文档（按需加载）
└── assets/               # [可选] 资源文件
```

## 四、Name 命名规范

| 规则 | 正确示例 | 错误示例 |
|------|---------|---------|
| 小写字母 | `content-writer` | `ContentWriter` |
| 连字符分隔 | `lead-research-assistant` | `lead_research_assistant` |
| 名词短语或动名词 | `mcp-builder`, `file-organizer` | `build-mcp`, `organize` |
| 简洁明确 | `pdf` | `pdf-document-processor-tool` |
| **文件夹名与 name 一致** | 文件夹 `message-rfq-agent-setting`，name `message-rfq-agent-setting` | 文件夹名与 name 不同 |
| **name 不含版本号** | `message-rfq-agent-setting` | `message-rfq-agent-setting-v1.0.0` |

## 五、Version 信息规范

> 来源：《accio work skill repo 开发规范》

| 规则 | 说明 |
|------|------|
| **版本号位置** | 必须写在 frontmatter 的 `metadata` 块中 |
| **缩进要求** | `metadata` 下的字段必须**缩进两格**，避免和 repo 版本冲突 |
| **不要放在 name/description 中** | name 字段不包含版本信息 |

正确示例：
```yaml
name: message-rfq-agent-setting
description: >-
  ...
metadata:
  author: ggs-team
  version: "1.0.0"
```

## 六、Scripts 目录规范

> 来源：《accio work skill repo 开发规范》

| 规则 | 说明 |
|------|------|
| **MCP 工具调用不写 scripts** | 涉及 Accio 内部 MCP 工具时，**不要把 MCP 工具调用直接写在 scripts/ 中**（无法包含用户登录态） |
| **在 SKILL.md 中声明** | 只需在 SKILL.md 中写出应该调用什么 MCP 工具（以及必要参数指引）即可 |
| **scripts/ 放纯逻辑** | scripts/ 只放不依赖用户登录态的纯处理逻辑（如数据解析、格式转换） |

## 七、Description 编写公式

```
[做什么] + [解决什么问题] + [何时使用]
```

注意事项：
- 明确触发条件
- 控制在 100 词以内
- 包含关键词便于语义匹配

## 六、Steps 设计要点

每个 Step 必须包含：
```markdown
### Step N: [步骤名称]
- **Input**: [输入内容]
- **Action**: [执行动作]
- **Output**: [输出内容]
```

| 要点 | 说明 |
|------|------|
| 步骤原子化 | 每步只做一件事 |
| 明确 I/O | 每步输入输出必须明确 |
| 支持中断 | 关键步骤后可设检查点 |
| 错误处理 | 定义失败时的回退策略 |

## 七、渐进式披露（三级加载）

| Level | 内容 | 加载时机 | Token 消耗 |
|-------|------|---------|-----------|
| L1 | name + description + steps预览 | 始终在上下文 | ~100 |
| L2 | SKILL.md 主体 | Skill 激活时 | < 3000 词 |
| L3 | references / scripts | 按需加载 | 不限 |

**Token 优化策略：**
- L1 在 description 中预览 Steps
- 用表格替代冗长描述
- 低频场景指向 references/
- 可执行逻辑放 scripts/

**拆分阈值：**
- SKILL.md > 3000 词 → 考虑拆分
- 某场景使用率 < 20% → offload 到 references/
