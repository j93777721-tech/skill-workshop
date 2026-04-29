import { ALL_SPECS } from './specs';

export function evaluatePrompt(idea: string, refMaterials: string[]): string {
  const refSection = refMaterials.length > 0
    ? `\n\n用户还提供了以下参考材料：\n${refMaterials.map((r, i) => `--- 参考材料 ${i + 1} ---\n${r}`).join('\n')}`
    : '';

  return `你是一个 Skill 架构专家。请根据以下三份官方规范，评估用户的点子是否适合做成 Skill。

${ALL_SPECS}

---

用户的点子：
${idea}
${refSection}

请从以下维度评估，并给出结论：

1. **是否有固定流程**：流程可描述、可标准化？
2. **是否需要领域规范**：需要注入专家知识？
3. **是否涉及多工具协作**：不是单 API 调用？
4. **是否需要多轮推理并行**：是否过于复杂需要 SubAgent？
5. **知识含量**：有没有超出 Tool 的知识？

请严格按以下 JSON 格式输出（不要输出其他内容）：

{
  "feasible": true/false,
  "recommendation": "skill" | "tool" | "subagent",
  "skillType": "WORKFLOW" | "TOOL" | "CAPABILITY-ROUTING" | "CAPABILITY-SPEC" | "SCENARIO" | null,
  "suggestedName": "lowercase-hyphenated-name",
  "reasoning": [
    {"check": "描述", "pass": true/false, "detail": "说明"},
    ...
  ],
  "summary": "一句话总结",
  "steps": [
    {"name": "步骤名称", "description": "简要描述"}
  ]
}`;
}

export function generatePrompt(idea: string, evaluation: any, refMaterials: string[]): string {
  const refSection = refMaterials.length > 0
    ? `\n\n用户提供的参考材料：\n${refMaterials.map((r, i) => `--- 参考材料 ${i + 1} ---\n${r}`).join('\n')}`
    : '';

  return `你是一个 Skill 编写专家。请根据以下规范和评估结果，为用户生成一份完整的、合规的 SKILL.md。

${ALL_SPECS}

---

用户的点子：
${idea}

可行性评估结果：
${JSON.stringify(evaluation, null, 2)}
${refSection}

请生成一份完整的 SKILL.md，必须满足：

1. 包含完整的 YAML frontmatter（name, description, metadata）
2. description 使用业务语言，包含触发条件和排除条件（Skip for）
3. 包含 When to Use 和 When NOT to Use
4. 如果是工作流类，每个 Step 有 Input/Action/Output 三件套
5. 至少 3 个示例（覆盖常见场景、特定操作、多轮对话）
6. 包含错误处理表格
7. 包含多轮对话处理
8. 主文件控制在 3000 词以内
9. 命名使用小写+连字符

直接输出 SKILL.md 的完整内容（从 --- 开始），不需要额外解释。`;
}
