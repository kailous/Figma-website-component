# Figma-website-component
面向 Figma 网站建站的代码组件集合。直接粘贴到代码块即可用，通过右侧属性面板配置即可获得酷炫效果、节省 token。

## 快速开始
1. 在 Figma 网站中创建代码组件，将对应 `.tsx` 文件内容粘贴进去。
2. 在画布里给目标容器/元素设置 `aria-label`，确保与组件的目标参数一致。
3. 在右侧属性面板调整参数，效果会自动生效。

## 目录结构
```
.
|-- README.md
|-- tsconfig.json
`-- component
    |-- 瀑布流布局插件.tsx
    |-- 反色特效.tsx
    |-- 鼠标指针.tsx
    |-- 打字机特效.tsx
    `-- from
        |-- 表单接入.tsx
        `-- 表单提交器.tsx
```

## 组件列表

### 瀑布流布局插件
文件：`component/瀑布流布局插件.tsx`

让指定容器内的卡片自动排成瀑布流，并根据断点自适应列数。

参数说明：
- `targetLabel`：目标容器的 `aria-label`。
- `breakpoints`：断点列表（px），用逗号分隔。
- `columns`：列数列表（与断点一一对应）。
- `gap`：卡片间距（px）。
- `isActive`：是否启用。

使用提示：
- 该组件会将子元素设置为 `position: absolute` 并接管排版。
- 容器高度会自动计算设置，避免内容重叠。
- 图片加载完成后会自动重新排版。

### 反色特效
文件：`component/反色特效.tsx`

对指定容器内的文本和图形做反色叠加，适合用于深浅色背景切换或炫酷效果。

参数说明：
- `targetLabel`：目标容器的 `aria-label`（同名 label 都会生效）。
- `selectors`：容器内需要反色的元素选择器列表。
- `isActive`：是否启用。

使用提示：
- 依赖 `mix-blend-mode: difference`，效果受背景影响较大。
- 使用了 `div:has(...)` 选择器，需较新的浏览器环境支持。

### 鼠标指针
文件：`component/鼠标指针.tsx`

自定义鼠标指针：默认圆点、文本模式竖线、按钮模式磁吸包裹。

参数说明：
- `diameter`：默认圆点直径（px）。
- `damping`：跟随阻尼（越小越快）。
- `textTags`：触发文本模式的选择器。
- `buttonTags`：触发按钮模式的选择器。
- `buttonPadding`：按钮模式比按钮扩大的边距（px）。

使用提示：
- 组件会全局隐藏系统光标。
- 按钮模式会吸附到按钮中心并继承圆角。

### 打字机特效
文件：`component/打字机特效.tsx`

滚动到可视区域后开始打字动画，支持超高速打字。

参数说明：
- `targetLabel`：目标容器的 `aria-label`。
- `speed`：速度（字/秒）。
- `delay`：触发后延迟（秒）。
- `threshold`：触发可视比例（0-1）。
- `isActive`：是否启用。

使用提示：
- 通过 `IntersectionObserver` 触发，默认只播放一次。
- 关闭再开启 `isActive` 可重新播放。

### 表单接入
文件：`component/from/表单接入.tsx`

将设计稿里的文本/容器替换为真实可输入的表单输入框，并继承文字样式。

参数说明：
- `targetAriaLabel`：目标容器的 `aria-label`。
- `placeholderText`：占位提示文案。
- `placeholderColor`：占位提示颜色。
- `formName`：表单字段名（`name`）。
- `inputType`：输入类型（`text`/`password`/`email` 等）。
- `isRequired`：是否必填。
- `maxLength`：最大字符数。
- `autoComplete`：浏览器自动填充策略。
- `autoFocus`：是否自动聚焦。

使用提示：
- 组件会隐藏容器内原有文本，并在原位置渲染 `input`。
- 文字样式会自动继承容器内文本的字体与排版。
- 配合提交器使用的详细教程见 `component/from/表单教程.md`。

### 表单提交器
文件：`component/from/表单提交器.tsx`

收集表单容器内的 `input`，点击按钮后统一提交，支持模拟和真实接口模式。

参数说明：
- `buttonLabel`：触发按钮的 `aria-label`。
- `formContainerLabel`：表单容器的 `aria-label`。
- `submitMode`：提交模式（`mock`/`real`）。
- `apiUrl`：接口地址（`real` 模式生效）。
- `httpMethod`：请求方法。
- `authToken`：可选的 Bearer Token。
- `successMessage`：成功提示文案。
- `errorMessage`：失败提示文案。

使用提示：
- 表单容器内的 `input` 需要设置 `name` 才会被收集。
- `mock` 模式会打印数据到控制台并弹出提示。
- 组件联动配置详见 `component/from/表单教程.md`。

## 通用说明
- 同名 `aria-label` 会匹配页面上的所有元素。
- 建议为每个效果使用清晰、唯一的 label。
- 若效果无反应，优先检查 `aria-label` 和是否启用组件。
