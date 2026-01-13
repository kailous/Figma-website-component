import { useEffect } from "react";
import { defineProperties } from "figma:react";

export default function DeepInvertBackdrop({
  targetLabel = "banner", // 必须匹配的 aria-label 值
  selectors = "h1, p, span, svg, path, .invert-target", // 容器内部需要反色的元素
  isActive = true,
}) {
  useEffect(() => {
    if (!isActive) return;

    // 定义基础容器选择器：这会选中页面上 *所有* 拥有该 label 的元素
    const containerSelector = `[aria-label="${targetLabel}"]`;
    const styleId = `deep-invert-${targetLabel}`;

    // 清理旧样式（防止重复挂载）
    const existingStyle = document.getElementById(styleId);
    if (existingStyle) existingStyle.remove();

    const style = document.createElement("style");
    style.id = styleId;

    // 核心逻辑：将用户传入的 "h1, p" 转换成 "[aria-label='banner'] h1, [aria-label='banner'] p"
    // 这样能确保它作用于页面上 *每一个* 同名 label 的容器内部
    const generatedSelectors = selectors
      .split(",")
      .map((s) => `${containerSelector} ${s.trim()}`)
      .join(", ");

    style.innerHTML = `
      /* 1. 选中所有指定 label 的容器：设置隔离，防止混合模式穿透到背景图片 */
      ${containerSelector} {
        isolation: auto !important;
      }

      /* 2. 选中所有容器内的目标子元素：应用反色效果 */
      ${generatedSelectors} {
        color: white !important;
        fill: white !important;
        stroke: white !important;
        mix-blend-mode: difference !important;
        
        /* 提升层级，确保不被父级的层叠上下文吞没 */
        position: relative;
        z-index: 1;
      }

      /* 3. 选中所有容器内的包裹层 div：移除背景色 */
      /* 只要 div 内部包含了我们要反色的元素，就强制透明 */
      ${containerSelector} div:has(${selectors}) {
        background-color: transparent !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.getElementById(styleId)?.remove();
    };
  }, [targetLabel, selectors, isActive]);

  return null;
}

defineProperties(DeepInvertBackdrop, {
  targetLabel: {
    label: "目标容器 Label (匹配所有同名)",
    type: "string",
    defaultValue: "banner",
  },
  selectors: {
    label: "生效标签 (支持多个)",
    type: "string",
    defaultValue: "h1, p, span, svg, path",
  },
  isActive: {
    label: "启用反色",
    type: "boolean",
    defaultValue: true,
  },
});