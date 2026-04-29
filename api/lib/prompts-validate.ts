import { ALL_SPECS } from './specs';

export function validatePrompt(skillContent: string, references: string[]): string {
  const refSection = references.length > 0
    ? `\n\n用户还提供了以下 references/ 文件内容：\n${references.map((r, i) => `--- reference ${i + 1} ---\n${r}`).join('\n')}`
    : '';

  return `你是一个 Skill 规范专家。请严格按照以下三份官方规范，对用户提交的 Skill 做全量合规检查。

${ALL_SPECS}

---

请对以下 SKILL.md 内容执行完整的合规检查流程：

1. 判断 Skill 类型（工具类/工作流类/能力类-路由/能力类-规范/场景类）
2. 按类型执行结构完整性检查（必选要素矩阵）
3. 执行内容质量检查（description/trigger_keywords/Steps/Examples/Token管理）
4. 执行踩坑项排查（10大反模式）
5. 输出结构化检查报告

待检查的 SKILL.md 内容：
\`\`\`
${skillContent}
\`\`\`
${refSection}

请输出以下格式的检查报告（用 Markdown）：

## Skill 合规检查报告

**Skill 名称**：[从 frontmatter 提取]
**Skill 类型**：[判定的类型]

### 总结

| PASS | WARN | FAIL | 总体结论 |
|------|------|------|----------|
| X 项 | X 项 | X 项 | 通过 / 有改进建议 / 需修复后重检 |

### FAIL 项（必须修复）

用表格输出，每个问题一行：

| # | 问题 | 规范出处 | 修复建议 |
|---|------|----------|----------|
| 1 | 简明扼要的问题描述（一句话） | 规范X §Y | 简洁的修复操作说明 |

注意：修复建议列只写操作要点（如"添加 metadata 块"），不要贴大段代码。保持表格紧凑。

### WARN 项（建议优化）

同样用表格：

| # | 问题 | 优化建议 |
|---|------|----------|
| 1 | 简明问题描述 | 简洁优化建议 |

### PASS 项

用简洁的列表列出所有通过的检查项，每项一行即可。`;
}

export function fixPrompt(skillContent: string, report: string): string {
  return `你是一个 Skill 规范专家。以下是一份 Skill 的校验报告和原始内容。
请针对报告中的每个 FAIL 和 WARN 项，生成具体的修复建议。

对于每个问题：
1. 说明具体要改什么
2. 给出修改后的内容片段（可以直接复制使用）
3. 如果是新增内容，给出完整的新增段落

校验报告：
${report}

原始 SKILL.md：
\`\`\`
${skillContent}
\`\`\`

请按以下格式输出：

## 修复建议

### 修复 1：[问题名称]
**位置**：[在文件中的位置]
**修改内容**：
\`\`\`markdown
[修改后的内容]
\`\`\`

（逐个列出所有 FAIL 和 WARN 项的修复建议）

最后，输出完整的修复后 SKILL.md（整合所有修改）：

## 修复后完整 SKILL.md
\`\`\`markdown
[完整内容]
\`\`\``;
}
