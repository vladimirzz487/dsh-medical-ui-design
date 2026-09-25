# 设计 Token 与视觉规范（完整表）

本文件是唯一权威 token 来源。新增页面、改样式时**只能**取这里的值；项目已有 Design System 时，把它映射到本表并保持一对一，不允许同一语义出现两个值。

## 1. 颜色

### 1.1 品牌与语义色

| 语义 | Token | 值 | 用法 |
|---|---|---|---|
| Primary | `--color-primary` | `#2563EB` | 主按钮、选中态、链接、进度、聚焦环 |
| Primary Hover | `--color-primary-hover` | `#1D4ED8` | 主按钮悬停 |
| Primary Soft | `--color-primary-soft` | `#EFF6FF` | 选中行底色、轻量标签底 |
| Success | `--color-success` | `#16A34A` | 已完成、正常、同步成功 |
| Warning | `--color-warning` | `#F59E0B` | 待处理、临期、注意 |
| Danger | `--color-danger` | `#DC2626` | 异常、删除、终止、报错 |
| Info | `--color-info` | `#2563EB` | 处理中、提示（与 Primary 同值，语义不同） |
| Info Soft | `--color-info-soft` | `#E0F2FE` | 处理中标签底色 |

状态色**只允许**出现在：Badge、图标、小面积提示、状态文字、进度条、左侧 3px 状态条。禁止作为卡片背景大面积铺色。

### 1.2 中性色

| 语义 | Token | 值 |
|---|---|---|
| 页面背景 | `--color-bg` | `#F5F7FA` |
| 卡片/表面 | `--color-surface` | `#FFFFFF` |
| 次级表面（表头、分组底） | `--color-surface-alt` | `#F9FAFB` |
| 边框 | `--color-border` | `#E5E7EB` |
| 分割线（更弱） | `--color-divider` | `#F3F4F6` |
| 主要文字 | `--color-text` | `#1F2937` |
| 次要文字 | `--color-text-secondary` | `#6B7280` |
| 辅助文字 | `--color-text-muted` | `#9CA3AF` |
| 禁用文字 | `--color-text-disabled` | `#C4C7CE` |
| 遮罩 | `--color-overlay` | `rgba(17, 24, 39, 0.35)` |

### 1.3 状态 → 颜色映射（全产品唯一）

| 业务状态 | 颜色 | 标识 |
|---|---|---|
| 待处理 | Warning 橙 | `● 待处理` |
| 处理中 | Info/Primary 蓝 | `● 处理中` |
| 已完成 | Success 绿 | `● 已完成` |
| 异常 | Danger 红 | `● 异常` |
| 已取消/已作废 | 中性灰 `#9CA3AF` | `● 已取消` |

新增业务状态时必须在此表登记；**同一种状态在整个产品中永远同一种颜色**。

## 2. 文字

| 层级 | 字号 | 字重 | 颜色 | 用途 |
|---|---|---|---|---|
| 页面标题 | 20～24px（默认 22px） | 600 | 主要文字 | 顶栏当前页面名、列表页标题 |
| 模块标题 | 16～18px（默认 16px） | 600 | 主要文字 | 卡片标题、抽屉分组标题 |
| 正文 | 14px | 400 | 主要文字 | 表格、表单、说明 |
| 次要 | 13px | 400 | 次要文字 | 表头、标签、辅助描述 |
| 辅助 | 12～13px | 400 | 辅助文字 | 时间戳、单位、脚注 |
| 统计数字 | 28～32px | 600 | 主要文字 | 概览卡片主数字 |

规则：
- 正文字号**不得小于 12px**，且不得让 12px 承担大段正文。
- 表格正文 13～14px；表头与正文同级或略小，靠字重与颜色区分，不靠放大。
- 数字用等宽数字（`font-variant-numeric: tabular-nums` / XAML `Typography.NumeralAlignment="Tabular"`），保证列对齐。
- 中文正文字体优先 微软雅黑 / Microsoft YaHei UI；等宽场景（编号、时间）用 Consolas 或 Cascadia Mono。

## 3. 间距

4px 基准体系，只允许这些值：`4 / 8 / 12 / 16 / 20 / 24 / 32`。

| 场景 | 值 |
|---|---|
| 页面内容左右留白 | 24px |
| 卡片内边距 | 16～24px |
| 卡片之间 | 16～20px |
| 分组之间 | 24～32px |
| 表单行之间 | 16～20px |
| 标签与输入框 | 6～8px |
| 按钮之间 | 8～12px |
| 图标与文字 | 6～8px |
| 表格单元格左右内边距 | 12～16px |

禁止出现 5px、7px、13px、18px、25px 这类非体系值。

## 4. 圆角、边框、阴影

| 元素 | 圆角 | 边框 | 阴影 |
|---|---|---|---|
| 按钮 | 6～8px | 次要按钮 1px 边框 | 无（或极轻） |
| 输入框 | 6～8px | 1px `--color-border` | 无 |
| 卡片 | 8～12px | 1px `--color-border` | 极轻（`0 1px 2px rgba(16,24,40,.04)`） |
| 表格容器 | 8～12px | 1px 边框 + 行分割线 | 无 |
| 抽屉 Drawer | 12～16px（仅左侧圆角） | 左侧 1px | 中等（浮层） |
| 弹窗 Dialog | 12～16px | 无 | 中等 |
| Badge | 4～6px（或胶囊 999px，项目内统一一种） | 无 | 无 |

**优先边框而非大阴影**。阴影只用两级：卡片级（几乎不可见）与浮层级（抽屉、弹窗、下拉）。

## 5. 尺寸与密度

| 元素 | 值 |
|---|---|
| 左导航宽 | 210～240px（默认 220px） |
| 顶栏高 | 56～68px（默认 60px） |
| 抽屉宽 | 450～600px（默认 520px） |
| 表格行高 | 44～52px（默认 48px，紧凑视图 44px） |
| 按钮高 | 主要按钮 34～38px；表格内小按钮 28～32px |
| 输入框高 | 34～38px |
| Badge 高 | 20～24px |
| 图标 | 16 / 18 / 20 / 24px 四档，同层级内统一 |
| 页面最小可用宽 | 1280px（1366×768 必须完整可用） |

数据密度取**中等**：既不做过大留白（浪费医生时间），也不一屏塞几十行难以扫描。

## 6. 动效时长

| 场景 | 时长 | 曲线 |
|---|---|---|
| 悬停/聚焦 | 120ms | ease-out |
| 淡入、Toast | 150～200ms | ease-out |
| Drawer 滑入 | 200～240ms | cubic-bezier(.2,.8,.2,1) |
| 数据高亮衰减 | 600～900ms 一次性 | ease-out |

禁止超过 300ms 的常规交互动画，禁止循环动画（除加载指示器）。

## 7. Web 变量（复制自 `templates/tokens.css`）

```css
:root{
  --color-primary:#2563EB; --color-primary-hover:#1D4ED8; --color-primary-soft:#EFF6FF;
  --color-success:#16A34A; --color-warning:#F59E0B; --color-danger:#DC2626; --color-info:#2563EB;
  --color-bg:#F5F7FA; --color-surface:#FFFFFF; --color-surface-alt:#F9FAFB;
  --color-border:#E5E7EB; --color-divider:#F3F4F6;
  --color-text:#1F2937; --color-text-secondary:#6B7280; --color-text-muted:#9CA3AF;
  --radius-control:8px; --radius-card:10px; --radius-drawer:14px;
  --space-1:4px; --space-2:8px; --space-3:12px; --space-4:16px; --space-5:20px; --space-6:24px; --space-8:32px;
  --shadow-card:0 1px 2px rgba(16,24,40,.04); --shadow-overlay:0 8px 24px rgba(16,24,40,.12);
  --nav-width:220px; --header-height:60px; --row-height:48px; --drawer-width:520px;
  --font-ui:"Microsoft YaHei UI","Microsoft YaHei",system-ui,sans-serif;
}
```

## 8. WPF 资源字典（复制自 `templates/theme.xaml`）

XAML 中颜色用 `Color` + `SolidColorBrush` 成对定义，圆角用 `CornerRadius`，间距用 `Thickness` 资源，行高用 `DataGrid.RowHeight` 绑定同一个 `Double` 资源；控件样式统一在 `Theme.xaml` 的 `ResourceDictionary` 中声明，页面**不允许**写内联 `Background="#FF1234AB"` 这类硬编码。

```xml
<Color x:Key="Color.Primary">#FF2563EB</Color>
<SolidColorBrush x:Key="Brush.Primary" Color="{StaticResource Color.Primary}"/>
<CornerRadius x:Key="Radius.Card">10</CornerRadius>
<Thickness x:Key="Pad.Card">20</Thickness>
<sys:Double x:Key="Row.Height">48</sys:Double>
```
