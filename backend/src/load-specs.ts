import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const specsDir = join(__dirname, 'specs');

function load(name: string): string {
  return readFileSync(join(specsDir, name), 'utf-8');
}

export const SPEC_WRITING = load('skill-writing-standard.md');
export const SPEC_ACCIO = load('accio-skills-spec.md');
export const SPEC_PITFALLS = load('skill-pitfalls.md');

export const ALL_SPECS = `
=== 规范1：Skill 书写标准 ===
${SPEC_WRITING}

=== 规范2：Accio Skills 规范 ===
${SPEC_ACCIO}

=== 规范3：Skill 能力边界与踩坑指南 ===
${SPEC_PITFALLS}
`.trim();
