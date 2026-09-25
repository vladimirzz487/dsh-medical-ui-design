# WPF / XAML 落地映射

适用于 WPF / XAML 桌面形态的医院内部工具（包括打包为单文件 exe 的内网客户端）。设计决策来自 `SKILL.md` 与 `design-tokens.md`，本文件只讲 XAML 写法。

## 1. 资源字典（唯一色源）

把 `templates/theme.xaml` 合并进 `App.xaml`：

```xml
<Application.Resources>
  <ResourceDictionary>
    <ResourceDictionary.MergedDictionaries>
      <ResourceDictionary Source="Themes/Theme.xaml"/>
    </ResourceDictionary.MergedDictionaries>
  </ResourceDictionary>
</Application.Resources>
```

`Theme.xaml` 中颜色成对定义（`Color` + `SolidColorBrush`），尺寸用 `sys:Double`：

```xml
<ResourceDictionary xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
                    xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
                    xmlns:sys="clr-namespace:System;assembly=mscorlib">
  <Color x:Key="Color.Primary">#FF2563EB</Color>
  <SolidColorBrush x:Key="Brush.Primary" Color="{StaticResource Color.Primary}"/>
  <SolidColorBrush x:Key="Brush.Primary.Soft" Color="#FFEFF6FF"/>
  <SolidColorBrush x:Key="Brush.Bg" Color="#FFF5F7FA"/>
  <SolidColorBrush x:Key="Brush.Surface" Color="#FFFFFFFF"/>
  <SolidColorBrush x:Key="Brush.Border" Color="#FFE5E7EB"/>
  <SolidColorBrush x:Key="Brush.Text" Color="#FF1F2937"/>
  <SolidColorBrush x:Key="Brush.Text.Secondary" Color="#FF6B7280"/>
  <SolidColorBrush x:Key="Brush.Text.Muted" Color="#FF9CA3AF"/>
  <CornerRadius x:Key="Radius.Card">10</CornerRadius>
  <CornerRadius x:Key="Radius.Control">8</CornerRadius>
  <Thickness x:Key="Pad.Card">20</Thickness>
  <sys:Double x:Key="Nav.Width">220</sys:Double>
  <sys:Double x:Key="Header.Height">60</sys:Double>
  <sys:Double x:Key="Row.Height">48</sys:Double>
  <sys:Double x:Key="Drawer.Width">520</sys:Double>
  <FontFamily x:Key="Font.UI">Microsoft YaHei UI, Microsoft YaHei</FontFamily>
  <sys:Double x:Key="Font.Body">14</sys:Double>
  <sys:Double x:Key="Font.Title">22</sys:Double>
</ResourceDictionary>
```

**页面里禁止内联硬编码**：`Background="#FF1234AB"`、`FontSize="11"`、`CornerRadius="24"`。一律 `{StaticResource ...}`。

## 2. 窗口与外壳（Grid）

```xml
<Window FontFamily="{StaticResource Font.UI}" FontSize="{StaticResource Font.Body}"
        Background="{StaticResource Brush.Bg}"
        TextOptions.TextFormattingMode="Display"
        UseLayoutRounding="True" SnapsToDevicePixels="True"
        MinWidth="1280" MinHeight="720" WindowStartupLocation="CenterScreen">
  <Grid>
    <Grid.ColumnDefinitions>
      <ColumnDefinition Width="{StaticResource Nav.Width}"/>   <!-- 注意：需 Double，或用 220 常量 -->
      <ColumnDefinition Width="*" MinWidth="0"/>
    </Grid.ColumnDefinitions>
    <Grid.RowDefinitions>
      <RowDefinition Height="{StaticResource Header.Height}"/>
      <RowDefinition Height="*"/>
    </Grid.RowDefinitions>

    <Border Grid.RowSpan="2" Background="{StaticResource Brush.Surface}"
            BorderBrush="{StaticResource Brush.Border}" BorderThickness="0,0,1,0">
      <!-- 左侧导航：ListBox/ItemsControl 绑定导航项 -->
    </Border>

    <Border Grid.Column="1" Background="{StaticResource Brush.Surface}"
            BorderBrush="{StaticResource Brush.Border}" BorderThickness="0,0,0,1">
      <!-- 顶栏：左标题 / 右系统状态·通知·用户·设置 -->
    </Border>

    <ScrollViewer Grid.Row="1" Grid.Column="1" VerticalScrollBarVisibility="Auto">
      <ContentControl Margin="{StaticResource Pad.Card}" Content="{Binding CurrentPage}"/>
    </ScrollViewer>

    <!-- 抽屉覆盖层（见 §5） -->
  </Grid>
</Window>
```

要点：
- 主内容区是唯一滚动容器；左导航与顶栏不滚动。
- `TextFormattingMode="Display"` + `UseLayoutRounding` 让中小字号中文更锐利、对齐更准。
- 顶级 Grid 的 `ColumnDefinition Width` 不能直接吃 `sys:Double` 资源，需要转换或用常量 220 / 60；如需资源化，可在 code-behind 里赋值。

## 3. 卡片与统计卡

```xml
<Border Background="{StaticResource Brush.Surface}"
        BorderBrush="{StaticResource Brush.Border}" BorderThickness="1"
        CornerRadius="{StaticResource Radius.Card}" Padding="{StaticResource Pad.Card}"
        Margin="0,0,16,0">
  <StackPanel>
    <TextBlock Text="待处理" FontSize="13" Foreground="{StaticResource Brush.Text.Secondary}"/>
    <TextBlock Text="{Binding PendingCount}" FontSize="30" FontWeight="SemiBold"
               Foreground="{StaticResource Brush.Text}" Margin="0,6,0,0"/>
    <TextBlock Text="{Binding PendingDelta}" FontSize="12"
               Foreground="{StaticResource Brush.Text.Muted}" Margin="0,6,0,0"/>
  </StackPanel>
</Border>
```

统计卡用 `UniformGrid Columns="4"` 或 `Grid` 等宽列；不超过 5 个。

## 4. DataGrid

```xml
<DataGrid ItemsSource="{Binding Rows}" AutoGenerateColumns="False"
          RowHeight="{StaticResource Row.Height}" HeadersVisibility="Column"
          GridLinesVisibility="Horizontal" HorizontalGridLinesBrush="{StaticResource Brush.Border}"
          Background="{StaticResource Brush.Surface}" BorderThickness="0"
          CanUserAddRows="False" SelectionMode="Single" EnableRowVirtualization="True">
  <DataGrid.Columns>
    <DataGridTemplateColumn Header="状态" Width="110">
      <DataGridTemplateColumn.CellTemplate>
        <DataTemplate>
          <StackPanel Orientation="Horizontal" VerticalAlignment="Center">
            <Ellipse Width="8" Height="8" Margin="0,0,6,0" Fill="{Binding StatusBrush}"/>
            <TextBlock Text="{Binding StatusText}" FontSize="13" Foreground="{Binding StatusBrush}"/>
          </StackPanel>
        </DataTemplate>
      </DataGridTemplateColumn.CellTemplate>
    </DataGridTemplateColumn>
    <DataGridTextColumn Header="编号" Binding="{Binding Code}" Width="160"/>
    <DataGridTextColumn Header="科室" Binding="{Binding Dept}" Width="120"/>
    <DataGridTextColumn Header="时间" Binding="{Binding Time}" Width="100"/>
    <DataGridTextColumn Header="数量" Binding="{Binding Qty}" Width="80">
      <DataGridTextColumn.ElementStyle>
        <Style TargetType="TextBlock">
          <Setter Property="HorizontalAlignment" Value="Right"/>
          <Setter Property="Margin" Value="0,0,12,0"/>
        </Style>
      </DataGridTextColumn.ElementStyle>
    </DataGridTextColumn>
    <DataGridTemplateColumn Header="操作" Width="160">
      <DataGridTemplateColumn.CellTemplate>
        <DataTemplate>
          <StackPanel Orientation="Horizontal">
            <Button Content="查看" Style="{StaticResource LinkButton}"/>
            <Button Content="处理" Style="{StaticResource LinkButton}" Margin="12,0,0,0"
                    Visibility="{Binding CanHandle, Converter={StaticResource BoolToVisibility}}"/>
          </StackPanel>
        </DataTemplate>
      </DataGridTemplateColumn.CellTemplate>
    </DataGridTemplateColumn>
  </DataGrid.Columns>
</DataGrid>
```

要点：
- `RowHeight` 绑同一个资源（48px 默认，紧凑 44px）；表头样式在 `Theme.xaml` 统一（13px、次要色、浅底）。
- 状态列最左、操作列最右；操作按钮用文字/链接样式，不用实心主色按钮（一行一个 Primary 会破坏层级）。
- 数字列右对齐；长文本用 `TextTrimming="CharacterEllipsis"` + ToolTip 全文。
- 空/加载/错误态：在 DataGrid 之上叠加 `Border`，按 `State` 属性切换 `Visibility`，不要留空白表格。
- 无权限的操作：`Visibility=Collapsed` 或 `IsEnabled=false` + ToolTip 说明原因；禁止点击后弹错误框。

## 5. 抽屉（覆盖层 + 动画）

WPF 没有内置 Drawer，用主 Grid 的最后一行叠一层：

```xml
<Grid x:Name="DrawerLayer" Grid.RowSpan="2" Grid.ColumnSpan="2"
      Visibility="{Binding IsDrawerOpen, Converter={StaticResource BoolToVisibility}}">
  <Rectangle Fill="#59111827"/>                      <!-- rgba(17,24,39,.35) -->
  <Border Width="{StaticResource Drawer.Width}" HorizontalAlignment="Right"
          Background="{StaticResource Brush.Surface}" CornerRadius="14,0,0,14"
          BorderBrush="{StaticResource Brush.Border}" BorderThickness="1,0,0,0">
    <Border.RenderTransform><TranslateTransform x:Name="DrawerShift"/></Border.RenderTransform>
    <Grid>
      <Grid.RowDefinitions>
        <RowDefinition Height="56"/>   <!-- 标题 + 关闭 -->
        <RowDefinition Height="*"/>    <!-- 滚动内容，分组 -->
        <RowDefinition Height="56"/>   <!-- 底部操作条 -->
      </Grid.RowDefinitions>
      …
    </Grid>
  </Border>
</Grid>
```

滑入动画（200～240ms）：

```xml
<Storyboard x:Key="DrawerIn">
  <DoubleAnimation Storyboard.TargetName="DrawerShift" Storyboard.TargetProperty="X"
                   From="520" To="0" Duration="0:0:0.22">
    <DoubleAnimation.EasingFunction><CubicEase EasingMode="EaseOut"/></DoubleAnimation.EasingFunction>
  </DoubleAnimation>
</Storyboard>
```

- `Esc` 关闭：在 Window 上处理 `PreviewKeyDown`。
- 未保存内容时关闭要确认（`MessageBox` 或自定义 Dialog）。
- 后台定时刷新绑定集合时，**不要重建当前打开的详情对象**；用 `ObservableCollection` 更新行，详情区绑定同一对象引用或按 id 跳过。

## 6. 通知 / Toast

- 轻量提示：主 Grid 右上角叠 `StackPanel`，`DispatcherTimer` 2～4 秒后移除；错误/需操作的不自动消失。
- 避免用 `MessageBox` 做常规反馈（属高频弹窗禁忌）；仅在危险操作二次确认与紧急业务时使用。
- 导航 Badge：导航项右侧 `Border` 圆形/胶囊 + 计数，`Visibility` 绑定计数 > 0。

## 7. 图标

- 系统图标字体：Windows 10 用 `Segoe MDL2 Assets`，Windows 11 用 `Segoe Fluent Icons`；通过 `IconGlyph` 资源统一声明，字号 16/18/20。
- 项目自绘图标统一 `Path` 矢量 + 同一 `StrokeThickness`。
- **禁止在按钮/状态里放 Emoji 字符**（✅ ⚠️ 📦 等）；审查脚本会报。

## 8. 字体与 DPI

- `FontFamily="Microsoft YaHei UI"`，回退 `Microsoft YaHei`；数字列可 `FontFamily="Consolas"` 或使用 `Typography.NumeralAlignment="Tabular"`。
- 正文 14px，最小 12px；不要为了"放得下"把正文降到 11px。
- 高分屏：`UseLayoutRounding` + `SnapsToDevicePixels`；图片资源提供 @2x，`Stretch="Uniform"`。
- `MinWidth="1280" MinHeight="720"`，保证 1366×768 下主流程可用。

## 9. 常见错误（对应审查脚本规则）

| 错误写法 | 正确写法 |
|---|---|
| `Background="#FF2563EB"` 内联硬编码 | `{StaticResource Brush.Primary}` |
| `FontSize="11"` | ≥12（正文 14） |
| `CornerRadius="24"` 卡片 | 8～12 |
| `DataGrid RowHeight="32"` | 44～52 |
| `<LinearGradientBrush>` 大面积背景 | 纯色 + 分区边框 |
| `<Button Background="Red">` 表示删除但无确认 | Danger 样式 + 二次确认 |
| 状态用 Emoji 文本 | `Ellipse` + 文字 + 语义色 |
| 每个 Message 用 `MessageBox` | Toast，仅危险操作/紧急业务用弹窗 |
| 页面各自定义一套颜色 | 全部走 `Theme.xaml` |
