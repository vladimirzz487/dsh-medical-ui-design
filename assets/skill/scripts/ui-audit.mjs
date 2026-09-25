#!/usr/bin/env node
/**
 * ui-audit.mjs —— 医院软件桌面 UI 规范合规审查（零依赖）
 *
 * 依据《医院软件桌面端 UI 设计规范》，对界面源码做机器可查的违规扫描：
 * 硬编码颜色、过小字号、过大圆角、渐变/玻璃拟态、Emoji 当图标、表格行高、
 * 过重阴影、深色科技风、非体系间距等。
 *
 * 用法：
 *   node ui-audit.mjs <文件或目录...> [--json] [--max-issues=N] [--level=error|warn|info]
 *
 * 退出码：存在 error 级问题 → 1，否则 0（可直接接入 CI）。
 *
 * 说明：审查结果是线索而非判决。命中项必须结合页面语义人工确认后再改，
 *       尤其 R004（渐变在图表/进度条中可能是合理的）与 R006（注释里的符号无害）。
 */

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const EXTENSIONS = new Set([
  '.html', '.htm', '.css', '.scss', '.less', '.sass',
  '.vue', '.jsx', '.tsx', '.js', '.ts', '.xaml', '.axaml',
]);

const IGNORED_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', 'out', 'bin', 'obj',
  'coverage', '.next', '.nuxt', 'vendor', 'wwwroot', 'packages', '.vs',
]);

/** 规范 token 中已定义的色值：命中这些不算硬编码。 */
const ALLOWED_COLORS = new Set([
  '#2563EB', '#1D4ED8', '#EFF6FF', // primary / hover / soft
  '#16A34A', '#F59E0B', '#DC2626', // success / warning / danger
  '#E9F7EF', '#FEF3E2', '#FDECEC', '#E8F1FE', // 语义浅底
  '#F5F7FA', '#FFFFFF', '#F9FAFB', '#E5E7EB', '#F3F4F6', // 中性
  '#1F2937', '#6B7280', '#9CA3AF', '#C4C7CE', // 文字
  '#F9FBFF', '#59111827', // 悬停底 / 遮罩
  '#FFF', '#000',
]);

/** 允许的间距体系（4px 基准）。 */
const ALLOWED_SPACING = new Set([0, 2, 4, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 56, 60, 64]);

const RULES = [
  {
    id: 'R001', level: 'warn', title: '硬编码颜色',
    fix: '改用 token：CSS 用 var(--color-*)；XAML 用 {StaticResource Brush.*}。新语义色先登记进 design-tokens.md。',
    pattern: /#[0-9a-fA-F]{8}\b|#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3,4}\b/g,
    keep: (m, ctx) => !ctx.isTokenFile && !ALLOWED_COLORS.has(m.toUpperCase()),
  },
  {
    id: 'R002', level: 'error', title: '字号小于 12px',
    fix: '正文 14px、次要 13px、辅助最小 12px。医院软件禁止用 12px 以下承载信息。',
    pattern: /(?:font-size|FontSize)\s*[:=]\s*["']?(\d+(?:\.\d+)?)(px|pt)?/gi,
    keep: (m) => Number(/(\d+(?:\.\d+)?)/.exec(m)[1]) < 12,
  },
  {
    id: 'R003', level: 'warn', title: '圆角过大',
    fix: '按钮/输入框 6～8px，卡片 8～12px，抽屉 12～16px。过度圆角会显得"儿童化"。',
    pattern: /(?:border-radius|CornerRadius)\s*[:=]\s*["']?([^;"'}\n]+)/gi,
    keep: (m) => {
      const value = /[:=]\s*["']?([^;"'}\n]+)/.exec(m)[1];
      if (/999|50%|9999/.test(value)) return false; // 胶囊/圆点
      return value.split(/[\s,]+/).some((part) => {
        const n = parseFloat(part);
        return Number.isFinite(n) && n > 16;
      });
    },
  },
  {
    id: 'R004', level: 'warn', title: '渐变背景',
    fix: '医疗工作台禁用大面积渐变，改用纯色底 + 卡片分区 + 1px 边框。仅图表内部允许渐变填充。',
    pattern: /linear-gradient|radial-gradient|conic-gradient|LinearGradientBrush|RadialGradientBrush/gi,
  },
  {
    id: 'R005', level: 'warn', title: '玻璃拟态 / 模糊',
    fix: '禁用 backdrop-filter 与大面积 blur；用纯色表面 + 轻阴影 + 边框建立层次。',
    pattern: /backdrop-filter\s*:|filter\s*:\s*blur\(/gi,
  },
  {
    id: 'R006', level: 'warn', title: 'Emoji 当作 UI 图标',
    fix: '换成矢量图标（Web：Lucide；WPF：Segoe MDL2/Fluent Icons 或 Path）。代码注释中的符号可忽略。',
    pattern: /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/gu,
    keep: (m, ctx) => !ctx.isComment,
  },
  {
    id: 'R008', level: 'error', title: '表格行高越界',
    fix: '表格行高固定 44～52px（默认 48）。低于 44 难以扫描，高于 52 浪费竖向空间。',
    pattern: /(?:RowHeight|row-height|--row-height)\s*[:=]\s*["']?(\d+(?:\.\d+)?)(px)?|(?:^|\n)[ \t]*(?:[^\n{}]*\b(?:tr|td)\b[^\n{}]*)\{[^}]*?height\s*:\s*(\d+(?:\.\d+)?)px/gi,
    keep: (m) => {
      const value = /(?:RowHeight|row-height|--row-height)\s*[:=]\s*["']?(\d+(?:\.\d+)?)/i.exec(m);
      const n = Number(value ? value[1] : /height\s*:\s*(\d+(?:\.\d+)?)px/i.exec(m)[1]);
      return n < 44 || n > 52;
    },
  },
  {
    id: 'R009', level: 'warn', title: '阴影过重',
    fix: '优先用 1px 边框，其次极轻阴影。浮层用 --shadow-overlay，卡片用 --shadow-card。',
    pattern: /box-shadow\s*:\s*([^;}\n]+)|BlurRadius\s*=\s*"(\d+(?:\.\d+)?)"/gi,
    keep: (m) => {
      const blur = /BlurRadius\s*=\s*"(\d+(?:\.\d+)?)"/i.exec(m);
      if (blur) return Number(blur[1]) > 12;
      const nums = [...m.matchAll(/(-?\d+(?:\.\d+)?)px/g)].map((x) => Math.abs(Number(x[1])));
      const alpha = /rgba?\([^)]*?,\s*(0?\.\d+|1|0)\s*\)/i.exec(m);
      const blurRadius = nums.length >= 3 ? nums[2] : 0;
      return blurRadius > 24 || (alpha !== null && Number(alpha[1]) >= 0.25);
    },
  },
  {
    id: 'R010', level: 'warn', title: '深色科技风背景',
    fix: '默认浅灰底 #F5F7FA + 白卡片。深色科技风仅在用户明确要求时使用。',
    pattern: /background(?:-color)?\s*[:=]\s*["']?#(?:0|1)[0-9a-fA-F]{5}\b/gi,
  },
  {
    id: 'R011', level: 'info', title: '间距不在 4px 体系内',
    fix: '只使用 4/8/12/16/20/24/32px。',
    pattern: /(?:margin|padding|gap)\s*[:=]\s*["']?([^;"'}\n]+)/gi,
    keep: (m, ctx) => {
      if (ctx.isTokenFile) return false;
      const value = /[:=]\s*["']?([^;"'}\n]+)/.exec(m)[1];
      if (/%|auto|em|rem|vw|vh/.test(value)) return false;
      return value.split(/\s+/).some((part) => {
        const n = parseFloat(part);
        return Number.isFinite(n) && n >= 3 && n <= 40 && !ALLOWED_SPACING.has(n);
      });
    },
  },
];

/** 文件级规则：整文件统计。 */
const FILE_RULES = [
  {
    id: 'R007', level: 'warn', title: '!important 滥用',
    fix: '超过 3 处 !important 说明选择器结构失控，优先收敛样式作用域而不是加权重。',
    count: (text) => (text.match(/!important/g) ?? []).length,
    threshold: 3,
  },
];

const TOKEN_FILE_PATTERN = /(^|[\\/])(tokens?|theme|variables?|_variables|design-tokens)[^\\/]*\.(css|scss|less|xaml|axaml)$/i;

function isCommentLine(line) {
  const trimmed = line.trim();
  return (
    trimmed.startsWith('//') ||
    trimmed.startsWith('*') ||
    trimmed.startsWith('/*') ||
    trimmed.startsWith('<!--') ||
    trimmed.endsWith('-->') ||
    /^\s*#\s/.test(line)
  );
}

async function collectFiles(targets) {
  const files = [];
  for (const target of targets) {
    const abs = path.resolve(target);
    let info;
    try {
      info = await readdir(abs, { withFileTypes: true }).then((entries) => ({ entries, isDir: true }));
    } catch {
      info = { isDir: false };
    }
    if (!info.isDir) {
      files.push(abs);
      continue;
    }
    const stack = [abs];
    while (stack.length > 0) {
      const dir = stack.pop();
      let entries;
      try {
        entries = await readdir(dir, { withFileTypes: true });
      } catch {
        continue;
      }
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (IGNORED_DIRS.has(entry.name)) continue;
          stack.push(full);
        } else if (entry.isFile() && EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
          files.push(full);
        }
      }
    }
  }
  return [...new Set(files)].sort();
}

function auditText(text, file) {
  const issues = [];
  const isTokenFile = TOKEN_FILE_PATTERN.test(file);
  const lines = text.split(/\r?\n/);
  const seen = new Set();

  for (const rule of RULES) {
    // 每条规则独立扫描全文，保证跨行/多命中都被捕获。
    const regex = new RegExp(rule.pattern.source, rule.pattern.flags.includes('g') ? rule.pattern.flags : `${rule.pattern.flags}g`);
    let match;
    while ((match = regex.exec(text)) !== null) {
      const lineNo = text.slice(0, match.index).split('\n').length;
      const line = lines[lineNo - 1] ?? '';
      const ctx = { isTokenFile, isComment: isCommentLine(line) };
      if (rule.keep && !rule.keep(match[0], ctx)) continue;
      // 同一行同一规则只报一次（例如 "⚠️" 会匹配基础字符与变体选择符）。
      const key = `${rule.id}:${lineNo}`;
      if (seen.has(key)) continue;
      seen.add(key);
      issues.push({
        rule: rule.id,
        level: rule.level,
        title: rule.title,
        file,
        line: lineNo,
        snippet: line.trim().slice(0, 160),
        message: `${rule.title}：${match[0].trim().slice(0, 60)}`,
        fix: rule.fix,
      });
      if (match.index === regex.lastIndex) regex.lastIndex += 1;
    }
  }

  for (const rule of FILE_RULES) {
    const count = rule.count(text);
    if (count > rule.threshold) {
      issues.push({
        rule: rule.id,
        level: rule.level,
        title: rule.title,
        file,
        line: 1,
        snippet: `!important × ${count}`,
        message: `${rule.title}：全文出现 ${count} 次`,
        fix: rule.fix,
      });
    }
  }

  return issues;
}

const LEVEL_ORDER = { error: 0, warn: 1, info: 2 };
const LEVEL_TAG = { error: 'E', warn: 'W', info: 'I' };

function parseArgs(argv) {
  const targets = [];
  const options = { json: false, maxIssues: Number.POSITIVE_INFINITY, level: 'info' };
  for (const arg of argv) {
    if (arg === '--json') options.json = true;
    else if (arg.startsWith('--max-issues=')) options.maxIssues = Number(arg.split('=')[1]) || Number.POSITIVE_INFINITY;
    else if (arg.startsWith('--level=')) options.level = arg.split('=')[1];
    else if (arg === '--help' || arg === '-h') options.help = true;
    else targets.push(arg);
  }
  return { targets, options };
}

const HELP = `医院软件桌面 UI 规范合规审查（零依赖）

用法：
  node ui-audit.mjs <文件或目录...> [--json] [--max-issues=N] [--level=error|warn|info]

规则：
  R001 硬编码颜色        R002 字号小于 12px     R003 圆角过大
  R004 渐变背景          R005 玻璃拟态/模糊     R006 Emoji 当图标
  R007 !important 滥用   R008 表格行高越界      R009 阴影过重
  R010 深色科技风背景    R011 间距不在体系内

退出码：存在 error 级问题 → 1，否则 0。
审查结果是线索，必须结合页面语义人工确认后再改。`;

async function main() {
  const { targets, options } = parseArgs(process.argv.slice(2));
  if (options.help || targets.length === 0) {
    process.stdout.write(`${HELP}\n`);
    process.exitCode = options.help ? 0 : 2;
    return;
  }

  const files = await collectFiles(targets);
  const allIssues = [];
  for (const file of files) {
    let text;
    try {
      text = await readFile(file, 'utf8');
    } catch {
      continue;
    }
    allIssues.push(...auditText(text, path.relative(process.cwd(), file) || file));
  }

  const filterLevel = LEVEL_ORDER[options.level] ?? 2;
  const issues = allIssues
    .filter((issue) => LEVEL_ORDER[issue.level] <= filterLevel)
    .sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level] || a.file.localeCompare(b.file) || a.line - b.line);

  const shown = issues.slice(0, options.maxIssues);
  const counts = { error: 0, warn: 0, info: 0 };
  for (const issue of issues) counts[issue.level] += 1;

  if (options.json) {
    process.stdout.write(`${JSON.stringify({
      scannedFiles: files.length,
      summary: counts,
      total: issues.length,
      shown: shown.length,
      issues: shown,
    }, null, 2)}\n`);
  } else {
    const out = [];
    out.push('医院软件桌面 UI 规范审查（medical-desktop-ui-design）');
    out.push(`扫描 ${files.length} 个文件，命中 ${issues.length} 项（错误 ${counts.error} / 警告 ${counts.warn} / 提示 ${counts.info}）`);
    out.push('');
    if (shown.length === 0) {
      out.push('未发现机器可查的违规项。仍需按 SKILL.md §13 人工走查状态、层级与适配。');
    }
    for (const issue of shown) {
      out.push(`[${LEVEL_TAG[issue.level]}] ${issue.rule} ${issue.file}:${issue.line}  ${issue.message}`);
      out.push(`     修复：${issue.fix}`);
    }
    if (issues.length > shown.length) out.push(`\n（还有 ${issues.length - shown.length} 项未显示，用 --max-issues 调整）`);
    out.push('\n提示：审查结果是线索，命中项需结合页面语义人工确认（图表内渐变、注释内符号等属合理例外）。');
    process.stdout.write(`${out.join('\n')}\n`);
  }

  process.exitCode = counts.error > 0 ? 1 : 0;
}

main().catch((error) => {
  process.stderr.write(`ui-audit 运行失败：${error?.stack ?? error}\n`);
  process.exitCode = 2;
});
