# Web 落地映射（HTML / CSS / React / Vue / Tailwind）

适用于 Electron / Tauri / Web Desktop 形态的医院内部工具。设计决策来自 `SKILL.md` 与 `design-tokens.md`，本文件只讲写法。

## 1. token 接入

- 原生 CSS：复制 `templates/tokens.css`，在入口引入；所有颜色/间距/圆角**只引用变量**。
- Tailwind：在 `tailwind.config.js` 的 `theme.extend` 中映射变量，禁止在 `className` 里写任意值（`bg-[#123456]`）。

```js
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: 'var(--color-primary)', hover: 'var(--color-primary-hover)', soft: 'var(--color-primary-soft)' },
        success: 'var(--color-success)', warning: 'var(--color-warning)', danger: 'var(--color-danger)',
        bg: 'var(--color-bg)', surface: 'var(--color-surface)', border: 'var(--color-border)',
        text: { DEFAULT: 'var(--color-text)', secondary: 'var(--color-text-secondary)', muted: 'var(--color-text-muted)' },
      },
      borderRadius: { control: '8px', card: '10px', drawer: '14px' },
      spacing: { 1: '4px', 2: '8px', 3: '12px', 4: '16px', 5: '20px', 6: '24px', 8: '32px' },
      height: { header: '60px', control: '36px' },
    },
  },
};
```

- 字体：`font-family: var(--font-ui)`；数字表格列加 `font-variant-numeric: tabular-nums`。

## 2. 外壳骨架

```html
<div class="app">                       <!-- display:grid; grid-template-columns: var(--nav-width) 1fr; height:100vh -->
  <aside class="nav"> … </aside>         <!-- 固定，不滚动 -->
  <div class="main">                     <!-- grid-template-rows: var(--header-height) 1fr; min-width:0 -->
    <header class="header"> … </header>  <!-- 固定高 60px，底边框 -->
    <main class="content"> … </main>     <!-- overflow:auto; padding:24px -->
  </div>
</div>
```

- `.main` 必须 `min-width:0`，否则内部表格会撑破栅格。
- 表格容器：`overflow:auto`，`thead th { position:sticky; top:0; background:var(--color-surface-alt) }`。
- 操作列：`position:sticky; right:0; background:var(--color-surface)`，避免横向滚动后操作按钮丢失。

## 3. 组件骨架（React 风格，Vue 同理）

```jsx
// StatCard
export function StatCard({ label, value, delta, deltaTone = 'muted', onClick }) {
  return (
    <button className="card stat" onClick={onClick} disabled={!onClick}>
      <span className="stat__label">{label}</span>
      <strong className="stat__value">{value}</strong>
      {delta && <span className={`stat__delta is-${deltaTone}`}>{delta}</span>}
    </button>
  );
}
```

```jsx
// StatusBadge —— 状态→颜色只在这里映射一次
const TONE = { 待处理: 'warning', 处理中: 'info', 已完成: 'success', 异常: 'danger', 已取消: 'muted' };
export const StatusBadge = ({ status }) => (
  <span className={`badge badge--${TONE[status] ?? 'muted'}`}><i className="dot" />{status}</span>
);
```

```jsx
// DataTable 状态分支：Loading / Empty / Error 都替换表体，表头保留
<tbody>
  {loading ? <SkeletonRows rows={8} cols={cols.length} />
   : error ? <tr><td colSpan={cols.length}><ErrorState onRetry={reload} /></td></tr>
   : rows.length === 0 ? <tr><td colSpan={cols.length}><EmptyState onRefresh={reload} /></td></tr>
   : rows.map(r => <Row key={r.id} row={r} />)}
</tbody>
```

## 4. 抽屉

- 用 `<aside role="dialog" aria-modal="true">` + 遮罩，`transform: translateX(100%) → 0`，200～240ms。
- 打开时 `Esc` 关闭；焦点移入抽屉并做焦点陷阱；关闭后焦点回到触发行。
- 未保存内容时关闭需确认。
- 数据刷新逻辑必须**跳过当前打开记录**：`if (openId === row.id) continue;`

## 5. 增量更新与静默刷新

```js
// 只改变化行，保持滚动位置与焦点；新行做一次轻微高亮
setRows(prev => prev.map(r => changed.has(r.id) ? { ...r, ...changed.get(r.id) } : r));
flashRow(newId);  // 900ms 后移除高亮 class
```

- 列表 key 必须使用稳定业务 id，禁止用数组下标（会导致输入框内容错位）。
- 轮询/推送更新不得触发整页重新挂载（不要用 `key={refreshToken}` 强制重建组件树）。

## 6. 权限与隐私

```jsx
{can('repair:handle') ? <Button>处理</Button> : <LockedAction reason="无维修处理权限" />}
```

- 无权限时渲染禁用/隐藏态，不渲染"点了报错"的按钮。
- 敏感字段统一走格式化函数：`maskName('张三') → '张**'`，`maskPhone('13800001234') → '138****1234'`；禁止在组件里零散手写脱敏。

## 7. 图标

- `lucide-react` / `lucide-vue-next`，`size={18} strokeWidth={1.75}` 全局统一；建立 `Icon` 包装组件，禁止页面直接 import 各种图标库。
- 代码中禁止 Emoji 充当 UI 图标（审查脚本会报）。

## 8. 常见错误（本技能审查脚本会报的项）

| 错误 | 正确 |
|---|---|
| `style={{ background: '#1234AB' }}` | `var(--color-primary)` 或 Tailwind `bg-primary` |
| `font-size: 11px` | ≥12px，正文 14px |
| `border-radius: 24px` 卡片 | 8～12px |
| `background: linear-gradient(...)` 大面积 | 纯色 + 边框分区 |
| `backdrop-filter: blur(...)` 玻璃拟态 | 纯色表面 + 轻阴影 |
| `<span>✅</span>` 当状态图标 | 矢量 StatusBadge |
| 同一卡片 `box-shadow: 0 4px 16px rgba(0,0,0,.3)` | `var(--shadow-card)` 或去掉 |
| 行高 32px 的表格 | 44～52px |
