import { useEffect } from "react";
import { defineProperties } from "figma:react";

export default function WaterfallInjector({
  targetLabel = "waterfall-container", // 对应 Figma 容器的 aria-label
  breakpoints = "1280, 800, 400", // 响应式断点
  columns = "3, 2, 1", // 对应列数
  gap = 24, // 间距 (px)
  isActive = true,
}) {
  useEffect(() => {
    if (!isActive) return;

    // 1. 查找所有目标容器
    const containers = document.querySelectorAll(
      `[aria-label="${targetLabel}"]`,
    );
    if (containers.length === 0) return;

    // 解析配置参数
    const parseConfig = (str) =>
      str.split(",").map((s) => Number(s.trim()));

    const bpList = parseConfig(breakpoints);
    const colList = parseConfig(columns);

    // --------------------------------------------------------
    // 2. 核心排版引擎 (Layout Engine)
    // --------------------------------------------------------
    const reflow = (container) => {
      if (!container) return;

      const containerWidth =
        container.getBoundingClientRect().width;

      // A. 计算当前列数
      let colCount = colList[colList.length - 1] || 1;
      for (let i = 0; i < bpList.length; i++) {
        if (containerWidth >= bpList[i]) {
          colCount = colList[i];
          break;
        }
      }

      // B. 准备子元素
      const children = Array.from(container.children);
      if (children.length === 0) return;

      // 计算单张卡片宽度
      const itemWidth =
        (containerWidth - (colCount - 1) * gap) / colCount;

      // 记录每列当前高度 (初始化为0)
      const colHeights = new Array(colCount).fill(0);

      // C. 循环落子
      children.forEach((child) => {
        const el = child;

        // 找出目前最短的那一列
        let minColIndex = 0;
        let minColHeight = colHeights[0];

        for (let i = 1; i < colCount; i++) {
          if (colHeights[i] < minColHeight) {
            minColIndex = i;
            minColHeight = colHeights[i];
          }
        }

        // 计算坐标
        const left = minColIndex * (itemWidth + gap);
        const top = minColHeight;

        // 应用样式
        el.style.position = "absolute";
        el.style.width = `${itemWidth}px`;
        el.style.boxSizing = "border-box"; // 防止 padding 撑破布局
        el.style.margin = "0"; // 清除 margin 干扰

        // ✨ 关键优化：添加平滑过渡 (位置和宽度的变化都会有动画)
        el.style.transition =
          "transform 0.3s ease-out, width 0.3s ease-out, left 0.3s ease-out, top 0.3s ease-out";

        el.style.left = `${left}px`;
        el.style.top = `${top}px`;

        // 更新列高
        const childHeight = el.getBoundingClientRect().height;
        colHeights[minColIndex] += childHeight + gap;
      });

      // D. 撑开父容器高度 (防止下方内容重叠)
      const maxColHeight = Math.max(...colHeights);
      container.style.height = `${maxColHeight}px`;
      container.style.position = "relative";
    };

    // --------------------------------------------------------
    // 3. 监听器设置
    // --------------------------------------------------------
    const observer = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        window.requestAnimationFrame(() => {
          reflow(entry.target);
        });
      });
    });

    // 初始化
    containers.forEach((node) => {
      const el = node;

      // 首次排版
      reflow(el);
      observer.observe(el);

      // ✨ 关键优化：图片加载保护
      // 只要图片加载完成，就重新排版一次，防止因为图片没高度导致的重叠
      const images = el.querySelectorAll("img");
      images.forEach((img) => {
        if (!img.complete) {
          img.addEventListener("load", () => reflow(el));
        }
      });
    });

    // 清理函数
    return () => {
      observer.disconnect();
      containers.forEach((node) => {
        // 可选：组件销毁时是否还原样式？通常不用还原，这里留空即可
      });
    };
  }, [targetLabel, breakpoints, columns, gap, isActive]);

  return null;
}

// --------------------------------------------------------
// 4. 属性面板定义
// --------------------------------------------------------
defineProperties(WaterfallInjector, {
  targetLabel: {
    label: "目标容器 Label",
    type: "string",
    defaultValue: "waterfall-container",
    description: "设置 Frame 的 aria-label 以应用布局",
  },
  breakpoints: {
    label: "断点 (px)",
    type: "string",
    defaultValue: "1280, 800, 400",
  },
  columns: {
    label: "列数",
    type: "string",
    defaultValue: "3, 2, 1",
  },
  gap: {
    label: "间距 (px)",
    type: "number",
    defaultValue: 24,
  },
  isActive: {
    label: "启用布局",
    type: "boolean",
    defaultValue: true,
  },
});