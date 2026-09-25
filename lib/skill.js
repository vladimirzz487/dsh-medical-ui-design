/**
 * The `medical-desktop-ui-design` Skill definition.
 *
 * The instruction body is read once at module load and handed to the skill
 * registry verbatim; `resourceBase` points at the packaged `assets/skill`
 * directory so the loaded skill can resolve the reference manuals, the theme
 * templates, and the zero-dependency compliance audit script next to SKILL.md.
 *
 * @module dsh-medical-ui-design/skill
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/** Stable catalog / invocation name. */
export const MEDICAL_UI_SKILL_NAME = 'medical-desktop-ui-design';

/** Packaged resource root (references/, templates/, scripts/). */
export const MEDICAL_UI_SKILL_RESOURCE_BASE = fileURLToPath(new URL('../assets/skill/', import.meta.url));

/** Bundled instruction body, read from SKILL.md. */
export const MEDICAL_UI_SKILL_CONTENT = readFileSync(new URL('../assets/skill/SKILL.md', import.meta.url), 'utf8');

/** Runtime skill registration handed to `ctx.skills.register()`. */
export const MEDICAL_UI_SKILL = {
  name: MEDICAL_UI_SKILL_NAME,
  description:
    '医院内部软件（HIS 配套工具、医学装备/设备管理、卫材库房、物资、维修、工作台、数据监控）桌面端 UI/UX 设计规范：' +
    '新增页面、新增/改动功能、调整页面布局、加字段或改表格/表单/详情/状态时套用统一的设计系统（左导航+顶栏+主区外壳、医疗蓝主色、卡片与表格规格、' +
    '状态徽标、抽屉详情、空/加载/错误态、静默刷新、隐私与权限、禁止事项），并给出 Web（HTML/CSS/React/Vue/Tailwind）与 WPF/XAML 的落地映射和生产级自检清单。' +
    '当任务涉及医院/医疗/临床/HIS 软件的界面设计、页面布局、组件样式、配色、图标、交互状态、界面改版、UI 走查或代码审查中的界面合规问题时使用。',
  whenToUse:
    '要为一个医院内部软件新增页面、新增或改动功能、调整布局与信息层级、增加字段或列、改动表格/表单/详情/导航/状态提示/配色主题时；' +
    '或者需要对已有的医疗软件界面做 UI 走查、统一视觉、修复风格不一致、检查桌面端适配（1920×1080 / 1366×768）时。',
  source: 'runtime',
  resourceBase: {
    kind: 'directory',
    path: MEDICAL_UI_SKILL_RESOURCE_BASE,
  },
  content: MEDICAL_UI_SKILL_CONTENT,
};
