import { useEffect, useRef, useState } from "react";
import { defineProperties } from "figma:react";

export default function DualModeCursor({
  diameter = 30,
  damping = 0.2,
  // 1. 文本模式设置
  textTags = "p, span, h1, h2, h3, article, input, textarea",
  // 2. 按钮模式设置
  buttonTags = "a, button, .btn, [role='button']",
  buttonPadding = 10, // 新增：按钮模式下，光标比按钮大多少像素
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mousePos = useRef({ x: -100, y: -100 }); // 鼠标真实位置
  const targetPos = useRef({ x: -100, y: -100 }); // 光标应当在的位置 (用于磁吸)
  const currentPos = useRef({ x: -100, y: -100 }); // 光标当前动画位置
  const rafId = useRef<number | null>(null);

  // 核心状态：管理当前形态
  const [cursorState, setCursorState] = useState({
    mode: "default" as "default" | "text" | "button",
    width: diameter,
    height: diameter,
    radius: "50%",
  });

  useEffect(() => {
    // 全局强制隐藏原生指针
    const style = document.createElement("style");
    style.id = "cursor-logic-styles";
    style.innerHTML = `* { cursor: none !important; }`;
    document.head.appendChild(style);

    const handleMove = (e: MouseEvent) => {
      // 总是记录真实的鼠标位置，供非吸附状态使用
      mousePos.current = { x: e.clientX, y: e.clientY };

      const target = e.target as HTMLElement;

      // 默认目标位置等于鼠标位置
      let destX = e.clientX;
      let destY = e.clientY;

      let newMode: "default" | "text" | "button" = "default";
      let newWidth = diameter;
      let newHeight = diameter;
      let newRadius = "50%";

      // 优先级 1：检测是否在按钮上 (磁性吸附 + 融入容器)
      const buttonElement = target?.closest(buttonTags);
      // 优先级 2：检测是否在文本上 (变成线)
      const textElement = target?.closest(textTags);

      if (buttonElement) {
        newMode = "button";

        // 获取按钮的尺寸和位置
        const rect = buttonElement.getBoundingClientRect();
        const computedStyle =
          window.getComputedStyle(buttonElement);

        // 1. 磁性吸附：将目标坐标锁定在按钮中心
        destX = rect.left + rect.width / 2;
        destY = rect.top + rect.height / 2;

        // 2. 尺寸适应：按钮尺寸 + 内边距
        newWidth = rect.width + buttonPadding * 2;
        newHeight = rect.height + buttonPadding * 2;

        // 3. 圆角继承：尝试获取按钮圆角，如果获取不到则默认稍微圆润一点
        const buttonRadius = computedStyle.borderRadius;
        // 简单的逻辑：如果按钮是圆角，外层光标的圆角应该是 按钮圆角 + padding
        // 这里简化直接使用按钮圆角，视觉上通常足够，或者默认为 12px
        newRadius =
          buttonRadius !== "0px" ? buttonRadius : "8px";
      } else if (textElement && target.childNodes.length > 0) {
        const range = document.caretRangeFromPoint(
          e.clientX,
          e.clientY,
        );
        if (range && range.getClientRects().length > 0) {
          const rect = range.getClientRects()[0];
          const buffer = 5;

          if (
            e.clientY >= rect.top - buffer &&
            e.clientY <= rect.bottom + buffer
          ) {
            newMode = "text";
            // 文本模式：吸附到文字行左侧或跟随
            destX = rect.left;
            destY = rect.top + rect.height / 2;

            const computedStyle =
              window.getComputedStyle(textElement);
            const lineHeight = parseFloat(
              computedStyle.lineHeight,
            );
            const fontSize = parseFloat(computedStyle.fontSize);

            newWidth = 2; // 线条宽度
            newHeight = isNaN(lineHeight)
              ? fontSize * 1.2
              : lineHeight;
            newRadius = "1px";
          }
        }
      }

      // 更新目标坐标
      targetPos.current = { x: destX, y: destY };

      // 只有状态改变时才触发 React 渲染 (性能优化)
      if (
        cursorState.mode !== newMode ||
        cursorState.width !== newWidth ||
        cursorState.height !== newHeight
      ) {
        setCursorState({
          mode: newMode,
          width: newWidth,
          height: newHeight,
          radius: newRadius,
        });
      }
    };

    const animate = () => {
      // 缓动算法：让 currentPos 追赶 targetPos
      // 注意：在 button 模式下，targetPos 是静止的按钮中心，所以光标会平滑地吸附过去
      currentPos.current.x +=
        (targetPos.current.x - currentPos.current.x) * damping;
      currentPos.current.y +=
        (targetPos.current.y - currentPos.current.y) * damping;

      if (containerRef.current) {
        containerRef.current.style.transform = `translate3d(${currentPos.current.x}px, ${currentPos.current.y}px, 0) translate(-50%, -50%)`;
      }
      rafId.current = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", handleMove);
    rafId.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      if (rafId.current) cancelAnimationFrame(rafId.current);
      document.getElementById("cursor-logic-styles")?.remove();
    };
  }, [
    damping,
    diameter,
    textTags,
    buttonTags,
    buttonPadding,
    cursorState.mode,
    cursorState.width,
    cursorState.height,
  ]);

  return (
    <>
      <style>{`
        @keyframes cursor-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
      <div
        ref={containerRef}
        className="pointer-events-none fixed left-0 top-0 z-[9999] will-change-transform"
        style={{
          width: cursorState.width,
          height: cursorState.height,
          borderRadius: cursorState.radius,

          backgroundColor: "white",
          mixBlendMode: "difference", // 关键：反色模式让光标覆盖按钮时，按钮文字反白可见

          animation:
            cursorState.mode === "text"
              ? "cursor-blink 1s infinite"
              : "none",

          // 这里的 transition 负责形状变化的平滑过渡
          transition:
            "width 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), height 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), border-radius 0.3s",
        }}
      />
    </>
  );
}

// 属性面板配置
defineProperties(DualModeCursor, {
  diameter: {
    label: "常规圆直径",
    type: "number",
    defaultValue: 30,
  },
  damping: {
    label: "跟随阻尼 (平滑度)",
    type: "number",
    control: "slider",
    min: 0.05,
    max: 0.5,
    step: 0.01,
    defaultValue: 0.15, // 稍微调低一点阻尼，让吸附感更强
  },
  // 按钮模式配置
  buttonTags: {
    label: "按钮标签选择器",
    type: "string",
    defaultValue: "a, button, .btn, [role='button']",
  },
  buttonPadding: {
    label: "按钮吸附边距",
    type: "number",
    defaultValue: 8, // 默认比按钮大 8px
  },
  // 文本模式配置
  textTags: {
    label: "文本标签选择器",
    type: "string",
    defaultValue: "p, span, h1, h2, h3",
  },
});