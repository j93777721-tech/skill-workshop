export const SPEC_WRITING = `# Skill 书写标准（规范1精要）

来源：《Skill书写示例与标准》— 以商家订单查询为案例的完整编写指南。

---

## 一、Skill 拆分决策

**合并 vs 拆分的判断标准：**
- 如果多个功能共享同一个用户意图（如"查订单"），合成一个 Skill，通过参数区分
- 如果功能面向不同意图（如"查订单" vs "改订单"），拆成独立 Skill

**反面案例：** 把"查订单列表""查订单详情""按时间查订单"拆成三个 Skill，用户只会说"查一下订单"，AI 分不清该用哪个。

## 二、文件结构

\`\`\`
skill-name/
├── SKILL.md              # 核心：告诉 AI 什么时候用、怎么用
├── scripts/              # 实际执行脚本
├── references/           # 参考文档（按需加载）
└── examples/             # 示例文件
\`\`\`

**拆分原则：** SKILL.md 被加载到 AI 上下文，太长会挤占对话历史空间。详细文档拆出去，AI 需要时再读。

## 三、SKILL.md 头部元数据要求

### name
- 英文 + 连字符，和代码保持一致
- 正确：\`merchant-order-query\`
- 错误：\`MerchantOrderQuery\`、\`merchant_order_query\`
- **文件夹名必须与 name 完全一致**
- **name 不包含版本信息**

### description（最重要）
- **必须用业务语言**，不能用技术语言
- 错误：\`调用订单查询接口，传入 merchant_id 和 order_id 参数...\`
- 正确：\`查询商家订单信息，当小二需要了解商家订单情况时调用...\`
- AI 靠 description 判断什么时候用你，技术语言模型理解不了
- **YAML 格式严格要求：** description 的 YAML 值中不能包含空行、纯空格行或尾部空换行。使用 \`>-\` 折叠标量时，每一行都必须有实际文本内容，行与行之间不能出现空行或只有空格/缩进的行。违反此规则会导致 YAML 解析异常或 Skill 加载失败。

### trigger_keywords
- 放用户实际会说的词，越全越好
- 是口语化的触发词，不是技术术语

### metadata
- 记版本号和变更历史，方便回溯
- **版本号必须缩进两格**写在 metadata 块中，如：
  \`\`\`yaml
  metadata:
    author: ggs-team
    version: "1.0.0"
  \`\`\`

### scripts/ 注意事项
- **涉及 MCP 工具调用时，不要写在 scripts/ 中**（无法包含用户登录态）
- 只需在 SKILL.md 中声明应调用什么 MCP 工具即可

## 四、正文必写内容

### 4.1 什么时候用 + 什么时候不用
- 适用场景：列出具体场景
- **不适用场景（关键）**：AI 会同时加载很多 Skill，多个 Skill 都能处理类似问题时会混乱，明确排除帮 AI 做选择

### 4.2 使用步骤
标准四步：
1. 确认意图（用户想做什么）
2. 提取参数（从用户输入中提取）
3. 调用工具（执行操作）
4. 整理返回结果（格式化给用户）

### 4.3 多轮对话处理
- 缺参数 → 主动询问
- 用代词 → 从对话历史找上下文
- "再查一下" → 用相同参数重新执行

### 4.4 错误处理
用表格列出常见错误情况和处理方式。HTTP 错误码用户看不懂，转成业务语言。

### 4.5 示例（至少 3 个）
覆盖：
1. 最常见场景
2. 特定查询
3. 多轮对话（代词引用等）

每个示例包含：用户输入 → 参数提取 → 执行 → 返回结果

## 五、发布前检查清单

- [ ] description 用业务语言
- [ ] description 的 YAML 值无空行、无纯空格行、无尾部空换行
- [ ] trigger_keywords 包含用户实际会说的词
- [ ] 写了"什么时候用"和"什么时候不用"
- [ ] 参数说明包含格式示例
- [ ] 至少 3 个示例
- [ ] 错误处理覆盖常见失败情况
- [ ] 多轮对话场景有说明
- [ ] 版本号正确
- [ ] 代码能独立运行（如有 scripts/）
- [ ] 测试环境验证通过`;

export const SPEC_ACCIO = `# Accio Skills 规范（规范2精要）

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

\`\`\`
skill-name/
├── SKILL.md              # [必需] 核心指令文件
├── LICENSE.txt           # [推荐] 许可证
├── scripts/              # [可选] 可执行脚本
├── references/           # [可选] 参考文档（按需加载）
└── assets/               # [可选] 资源文件
\`\`\`

## 四、Name 命名规范

| 规则 | 正确示例 | 错误示例 |
|------|---------|---------|
| 小写字母 | \`content-writer\` | \`ContentWriter\` |
| 连字符分隔 | \`lead-research-assistant\` | \`lead_research_assistant\` |
| 名词短语或动名词 | \`mcp-builder\`, \`file-organizer\` | \`build-mcp\`, \`organize\` |
| 简洁明确 | \`pdf\` | \`pdf-document-processor-tool\` |
| **文件夹名与 name 一致** | 文件夹 \`message-rfq-agent-setting\`，name \`message-rfq-agent-setting\` | 文件夹名与 name 不同 |
| **name 不含版本号** | \`message-rfq-agent-setting\` | \`message-rfq-agent-setting-v1.0.0\` |

## 五、Version 信息规范

> 来源：《accio work skill repo 开发规范》

| 规则 | 说明 |
|------|------|
| **版本号位置** | 必须写在 frontmatter 的 \`metadata\` 块中 |
| **缩进要求** | \`metadata\` 下的字段必须**缩进两格**，避免和 repo 版本冲突 |
| **不要放在 name/description 中** | name 字段不包含版本信息 |

正确示例：
\`\`\`yaml
name: message-rfq-agent-setting
description: >-
  ...
metadata:
  author: ggs-team
  version: "1.0.0"
\`\`\`

## 六、Scripts 目录规范

> 来源：《accio work skill repo 开发规范》

| 规则 | 说明 |
|------|------|
| **MCP 工具调用不写 scripts** | 涉及 Accio 内部 MCP 工具时，**不要把 MCP 工具调用直接写在 scripts/ 中**（无法包含用户登录态） |
| **在 SKILL.md 中声明** | 只需在 SKILL.md 中写出应该调用什么 MCP 工具（以及必要参数指引）即可 |
| **scripts/ 放纯逻辑** | scripts/ 只放不依赖用户登录态的纯处理逻辑（如数据解析、格式转换） |

## 七、Description 编写公式

\`\`\`
[做什么] + [解决什么问题] + [何时使用]
\`\`\`

注意事项：
- 明确触发条件
- 控制在 100 词以内
- 包含关键词便于语义匹配

## 六、Steps 设计要点

每个 Step 必须包含：
\`\`\`markdown
### Step N: [步骤名称]
- **Input**: [输入内容]
- **Action**: [执行动作]
- **Output**: [输出内容]
\`\`\`

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
- 某场景使用率 < 20% → offload 到 references/`;

export const SPEC_PITFALLS = `# Skill 能力边界与踩坑指南（规范3精要）

来源：《Skill的能力边界与踩坑分享》— Skill、Tool、SubAgent 的边界划分，常见失败模式与设计原则。

---

## 一、Skill / Tool / SubAgent 边界

| | Skill | Tool | SubAgent |
|---|-------|------|----------|
| 本质 | 一包"专家知识"，注入给 Agent 的操作手册 | 一个函数，做完就完，没有思考逻辑 | 独立的 Agent，有自己的上下文和推理 |
| 激活方式 | Agent 读完手册按手册走 | Agent 想用就调用 | 主 Agent 把子任务"外包"给它 |
| 比喻 | 大脑 | 手 | 外包小团队 |

**三者配合使用：** 用户说"帮我分析 Q4 选品机会" → 主 Agent 激活选品 Skill（方法论）→ 调用 web search Tool（获取数据）→ 调用成本计算 Tool（算落地成本）→ 综合给出建议。

## 二、什么适合写 Skill，什么不适合

### 适合写 Skill

| 类型 | 说明 | 示例 |
|------|------|------|
| 有固定流程的任务 | 流程可描述、可标准化 | 选品分析：明确范围→收集信号→评估排名→给出建议 |
| 需要注入领域规范的任务 | 规范可复用，每次自动遵守 | 报价单生成：必填字段、货币格式、校验规则 |
| 一组相关工具的封装 | 整理成清晰的使用手册 | 关税查询：多个接口统一封装 |

### 不适合写 Skill

| 类型 | 原因 | 应该用什么 |
|------|------|-----------|
| 只调一个 API | 没有流程和规范，零知识含量，白白消耗 Token | Tool |
| 需要动态判断路径的逻辑 | 用户回复结果无法预先规范 | Agent 决策 + Tool |
| 非常复杂的多轮推理 | 多个子任务需并行处理 | SubAgent |

## 三、常见失败模式（踩坑清单）

### 踩坑 1：把 Tool 硬写成 Skill
**现象：** Skill 内容就是"调用 GET /api/product/price 接口，返回价格"。
**问题：** 没有流程、没有规范、零知识含量，每次激活白白注入上下文消耗 Token。
**修复：** 直接写成 Tool 函数。

### 踩坑 2：description 写得太模糊
**现象：** \`description: A helpful tool for product analysis\`。
**问题：** 太宽泛，任何产品相关的问题都可能触发，或者真正需要时反而找不到。
**真实事故：** 用户问"帮我看看这个供应商的产品质量"，结果触发了选品 Skill。
**修复：** 明确说清"做什么、不做什么"。

### 踩坑 3：一个 Skill 承担过多职责
**现象：** 一个 Skill 塞了选品分析、上架操作、价格策略、库存管理、供应商谈判。
**问题：** SKILL.md 超 5000 词，每次激活消耗大量上下文，模型不知道走哪个子流程，维护牵一发动全身。**更要命的是 Skill 会一直在上下文里，干扰后续决策。**
**修复：** 按单一职责拆开，通过 Dependencies 组合。

### 踩坑 4：在 Skill 里写实时数据
**现象：** "当前热门品类：户外露营装备（搜索量增长 320%）"。
**问题：** 数据每季度都在变，半年后用这个 Skill 得到过时的推荐。
**修复：** Skill 写方法论——教 Agent 怎么评估热度，实时数据让 Agent 用 Tool 动态获取。

### 踩坑 5：步骤写得太虚
**现象：** "1. 理解用户需求 2. 做市场分析 3. 给出建议"。
**问题：** 等于没写，"做市场分析"用什么数据源？每次执行结果差异极大。
**修复：** 明确每步的 Input / Action / Output。

### 踩坑 6：只定义触发条件，没有排除条件
**现象：** 新品设计 Skill 只写了"当用户需要设计新品时使用"。
**问题：** 用户问"现在流行什么产品风格"（趋势调研）→ 误触发设计 Skill → 直接生成设计图。
**修复：** 明确标出"不要用"的场景。

### 踩坑 7：文件夹名与 name 不一致
**现象：** SKILL.md 中 \`name: product-agent-setting\`，但文件夹叫 \`product_agent_setting\` 或 \`ProductAgentSetting\`。
**问题：** Accio Work 上传 skill 时，文件夹名必须与 name 完全一致（小写+连字符），否则可能导致 skill 无法正确识别或更新。
**修复：** 文件夹名使用小写字母+连字符，与 name 字段完全一致。

### 踩坑 8：name 中包含版本信息
**现象：** \`name: message-rfq-agent-setting-v1.0.0\`。
**问题：** name 不应包含版本信息，版本号应写在 metadata 中。否则会影响 skill 自动更新机制。
**修复：** name 只保留功能标识，版本号写在 metadata 块中且缩进两格。

### 踩坑 9：MCP 工具调用写在 scripts 中
**现象：** 在 scripts/ 的 Python/JS 脚本中直接调用 MCP 工具。
**问题：** scripts 中无法包含用户登录态，MCP 工具调用会失败。
**修复：** MCP 工具调用只在 SKILL.md 中声明（告诉 AI 应该调什么工具），scripts/ 只放不依赖登录态的纯处理逻辑。

### 踩坑 10：description 的 YAML 值中包含空行或空格行
**现象：** description 使用 \`>-\` 折叠标量时，行与行之间存在空行、纯空格行或尾部有多余的空换行。
**问题：** YAML 解析器对空行敏感，空行会导致解析结果不符合预期（如被截断、多出换行符），严重时会导致 Skill 加载失败或 description 内容丢失。
**修复：** 确保 description 的 YAML 值中每一行都有实际文本内容，不留空行、不留纯空格/缩进行、不留尾部空换行。正确写法示例：
\`\`\`yaml
description: >-
  查询商家订单信息。当小二需要了解商家订单情况时调用。
  典型场景：
  - 查某个商家的最近订单
  - 按订单号查订单详情
  Skip for:
  - 修改订单（请使用订单修改 Skill）
\`\`\`

## 四、垂域 Skill 设计原则

### 上下文机制（理解前提）
**Skill 一旦激活，内容会持续占据 Agent 上下文。** 不像 Tool 调完释放，Skill 会一直在。同时激活多个 Skill 时，光 Skill 本身就吃掉大量上下文窗口，留给对话和数据的空间变少，模型注意力被分散，执行质量下降。

### 六条设计原则

| 序号 | 原则 | 说明 |
|------|------|------|
| 1 | 方法论优先，不存数据 | 教 Agent 怎么分析，不给它结论 |
| 2 | 触发条件精确，同时写"用"和"不用" | description 是 Agent 判断激活的唯一依据 |
| 3 | 步骤要有 I/A/O 三件套 | 写明输入来源、要搜什么/调什么、输出格式 |
| 4 | 证据驱动，强制数据支撑 | 所有推断必须附数据来源和样本量，禁止无依据结论 |
| 5 | 渐进式结构，主文件 < 3000 词 | 低频场景放 references/，主文件只放高频核心流程 |
| 6 | 声明 Dependencies | 让 Skill 之间可组合，不重复造轮子 |

## 五、目录结构使用原则

| 目录 | 作用 | 何时需要 |
|------|------|---------|
| scripts/ | 可执行脚本 | 工具类必需；Skill 需要实际调用代码时 |
| references/ | 参考文档（按需加载） | 低频场景或详细规则需要 offload 时 |
| templates/ | 输出模板 | 有格式化输出要求时 |
| assets/ | 静态资源 | 需要字体、图片等资源时 |

**总体原则：** SKILL.md 是必选，其他目录按需创建。不要为了"看起来整齐"创建空目录。`;

export const ALL_SPECS = `=== 规范1：Skill 书写标准 ===\n${SPEC_WRITING}\n\n=== 规范2：Accio Skills 规范 ===\n${SPEC_ACCIO}\n\n=== 规范3：Skill 能力边界与踩坑指南 ===\n${SPEC_PITFALLS}`;
