/**
 * 插件与技能自检：结构、注册行为、资源完整性、审查脚本行为。
 * 运行：node tests/plugin-smoke.mjs
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { name as pluginName, inject, apply } from '../lib/index.js';
import {
  MEDICAL_UI_SKILL,
  MEDICAL_UI_SKILL_CONTENT,
  MEDICAL_UI_SKILL_NAME,
  MEDICAL_UI_SKILL_RESOURCE_BASE,
} from '../lib/skill.js';

const root = fileURLToPath(new URL('..', import.meta.url));
let passed = 0;
const failures = [];

function check(label, fn) {
  try {
    fn();
    passed += 1;
    console.log(`  ok  ${label}`);
  } catch (error) {
    failures.push(`${label}: ${error.message}`);
    console.log(`FAIL  ${label}\n      ${error.message}`);
  }
}

console.log('插件清单与导出');
check('插件名与包名一致', () => assert.equal(pluginName, 'dsh-medical-ui-design'));
check('只注入 skills 服务', () => assert.deepEqual(inject, ['skills']));

console.log('技能定义');
check('技能名为 kebab-case', () => assert.match(MEDICAL_UI_SKILL_NAME, /^[a-z][a-z0-9-]*$/));
check('注册对象字段完整', () => {
  assert.equal(MEDICAL_UI_SKILL.name, MEDICAL_UI_SKILL_NAME);
  assert.equal(MEDICAL_UI_SKILL.source, 'runtime');
  assert.equal(MEDICAL_UI_SKILL.resourceBase.kind, 'directory');
  assert.equal(MEDICAL_UI_SKILL.resourceBase.path, MEDICAL_UI_SKILL_RESOURCE_BASE);
  assert.equal(MEDICAL_UI_SKILL.content, MEDICAL_UI_SKILL_CONTENT);
});
check('description 覆盖医院场景与触发词', () => {
  for (const keyword of ['医院', 'HIS', '桌面', '布局', '页面']) {
    assert.ok(MEDICAL_UI_SKILL.description.includes(keyword), `description 缺少关键词 ${keyword}`);
  }
});
check('whenToUse 覆盖新增页面/改动功能场景', () => {
  for (const keyword of ['新增页面', '改动', '布局']) {
    assert.ok(MEDICAL_UI_SKILL.whenToUse.includes(keyword), `whenToUse 缺少关键词 ${keyword}`);
  }
});
check('技能正文非空且包含核心规范', () => {
  assert.ok(MEDICAL_UI_SKILL_CONTENT.length > 4000, '技能正文过短');
  for (const keyword of ['左导航', '#2563EB', '禁止事项', '自检', 'Token']) {
    assert.ok(MEDICAL_UI_SKILL_CONTENT.includes(keyword), `技能正文缺少 ${keyword}`);
  }
});

console.log('资源完整性');
const requiredResources = [
  'SKILL.md',
  'references/design-tokens.md',
  'references/layout-recipes.md',
  'references/components.md',
  'references/states-feedback.md',
  'references/checklists.md',
  'references/platform-web.md',
  'references/platform-wpf.md',
  'templates/tokens.css',
  'templates/theme.xaml',
  'scripts/ui-audit.mjs',
];
for (const relative of requiredResources) {
  check(`资源存在: ${relative}`, () => assert.ok(existsSync(path.join(MEDICAL_UI_SKILL_RESOURCE_BASE, relative))));
}
check('SKILL.md 资源索引覆盖全部资源文件', () => {
  for (const relative of requiredResources.filter((r) => r !== 'SKILL.md')) {
    assert.ok(MEDICAL_UI_SKILL_CONTENT.includes(relative), `资源索引缺少 ${relative}`);
  }
});

console.log('注册与卸载');
check('apply 注册技能并返回卸载器', () => {
  const registered = [];
  const unregistered = [];
  const ctx = {
    skills: {
      register(skill) {
        registered.push(skill);
        return () => unregistered.push(skill);
      },
    },
    logger: { info() {}, warn() {} },
  };
  const dispose = apply(ctx);
  assert.equal(registered.length, 1);
  assert.equal(registered[0].name, MEDICAL_UI_SKILL_NAME);
  assert.equal(typeof dispose, 'function');
  dispose();
  assert.equal(unregistered.length, 1);
});
check('缺少 skills 服务时降级为 no-op', () => {
  const warnings = [];
  const ctx = { logger: { warn: (...args) => warnings.push(args.join(' ')), info() {} } };
  const dispose = apply(ctx);
  assert.equal(typeof dispose, 'function');
  dispose();
  assert.equal(warnings.length, 1);
});

console.log('审查脚本行为');
const auditScript = path.join(MEDICAL_UI_SKILL_RESOURCE_BASE, 'scripts', 'ui-audit.mjs');
function runAudit(args) {
  try {
    const stdout = execFileSync(process.execPath, [auditScript, ...args], { encoding: 'utf8' });
    return { code: 0, stdout };
  } catch (error) {
    return { code: error.status ?? 1, stdout: error.stdout ?? '' };
  }
}

check('违规样例命中核心规则并返回退出码 1', () => {
  const { code, stdout } = runAudit([path.join(root, 'tests/fixtures/violations.html'), '--json']);
  assert.equal(code, 1);
  const report = JSON.parse(stdout);
  const rules = new Set(report.issues.map((issue) => issue.rule));
  for (const expected of ['R001', 'R002', 'R003', 'R004', 'R005', 'R006', 'R009']) {
    assert.ok(rules.has(expected), `未命中 ${expected}`);
  }
  assert.ok(report.summary.error >= 1, '应至少有一个 error 级问题');
});
check('合规样例零命中且退出码 0', () => {
  const { code, stdout } = runAudit([path.join(root, 'tests/fixtures/compliant.xaml'), '--json']);
  assert.equal(code, 0);
  const report = JSON.parse(stdout);
  assert.equal(report.total, 0, `不应命中，实际：${JSON.stringify(report.issues.slice(0, 3))}`);
});
check('自带模板与参考文档零 error 命中', () => {
  const { code, stdout } = runAudit([path.join(MEDICAL_UI_SKILL_RESOURCE_BASE, 'templates'), '--json']);
  assert.equal(code, 0);
  assert.equal(JSON.parse(stdout).summary.error, 0);
});

console.log(`\n通过 ${passed} 项，失败 ${failures.length} 项`);
if (failures.length > 0) {
  console.log(failures.map((f) => ` - ${f}`).join('\n'));
  process.exitCode = 1;
}
