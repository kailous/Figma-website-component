import { useEffect, useRef, useState } from "react";
import { defineProperties } from "figma:react";

export default function DualModeCursor({
  diameter = 30,
  damping = 0.2,
  // 1. 文本模式设置
  textTags = "p, span, h1, h2, h3, article",
  // 2. 按钮模式设置
  buttonTags = "a, button, .btn, [role='button']",
  buttonHoverSize = 60,
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mousePos = useRef({ x: -100, y: -100 });
  const currentPos = useRef({ x: -100, y: -100 });
  const rafId = useRef<number | null>(null);

  // 核心状态：管理当前形态
  const [cursorState, setCursorState] = useState({
    mode: "default" as "default" | "text" | "button",
    height: 30,
  });

  useEffect(() => {
    // 全局强制隐藏原生指针
    const style = document.createElement("style");
    style.id = "cursor-logic-styles";
    style.innerHTML = `* { cursor: none !important; }`;
    document.head.appendChild(style);

    const handleMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      let targetX = e.clientX;
      let targetY = e.clientY;
      let newMode: "default" | "text" | "button" = "default";
      let newHeight = diameter;

      // 优先级 1：检测是否在按钮上 (放大圆形)
      const buttonElement = target?.closest(buttonTags);
      // 优先级 2：检测是否在文本上 (变成线)
      const textElement = target?.closest(textTags);

      if (buttonElement) {
        newMode = "button";
        newHeight = buttonHoverSize;
      } else if (textElement && target.childNodes.length > 0) {
        const range = document.caretRangeFromPoint(
          e.clientX,
          e.clientY,
        );
        if (range) {
          const rects = range.getClientRects();
          if (rects.length > 0) {
            const rect = rects[0];
            // 垂直范围内触发吸附
            const buffer = 5;
            if (
              e.clientY >= rect.top - buffer &&
              e.clientY <= rect.bottom + buffer
            ) {
              newMode = "text";
              targetX = rect.left;
              targetY = rect.top + rect.height / 2;

              const computedStyle =
                window.getComputedStyle(textElement);
              const lineHeight = parseFloat(
                computedStyle.lineHeight,
              );
              const fontSize = parseFloat(
                computedStyle.fontSize,
              );
              newHeight = isNaN(lineHeight)
                ? fontSize * 1.2
                : lineHeight;
            }
          }
        }
      }

      mousePos.current = { x: targetX, y: targetY };

      if (
        cursorState.mode !== newMode ||
        cursorState.height !== newHeight
      ) {
        setCursorState({ mode: newMode, height: newHeight });
      }
    };

    const animate = () => {
      currentPos.current.x +=
        (mousePos.current.x - currentPos.current.x) * damping;
      currentPos.current.y +=
        (mousePos.current.y - currentPos.current.y) * damping;

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
    buttonHoverSize,
    cursorState.mode,
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
          // 逻辑：线模式下宽度恒定为 2px，其他模式为圆形直径
          width:
            cursorState.mode === "text"
              ? "2px"
              : cursorState.mode === "button"
                ? buttonHoverSize
                : diameter,
          height:
            cursorState.mode === "text"
              ? cursorState.height
              : cursorState.mode === "button"
                ? buttonHoverSize
                : diameter,
          borderRadius:
            cursorState.mode === "text" ? "1px" : "50%",

          backgroundColor: "white",
          mixBlendMode: "difference",

          // 仅文本模式闪烁
          animation:
            cursorState.mode === "text"
              ? "cursor-blink 1s infinite"
              : "none",

          transition:
            "width 0.25s cubic-bezier(0.19, 1, 0.22, 1), height 0.25s cubic-bezier(0.19, 1, 0.22, 1), border-radius 0.2s",
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
    label: "跟随阻尼 (延迟)",
    type: "number",
    control: "slider",
    min: 0.01,
    max: 0.5,
    step: 0.01,
    defaultValue: 0.2,
  },
  // 按钮模式配置
  buttonTags: {
    label: "按钮标签选择器",
    type: "string",
    defaultValue: "a, button, .btn",
  },
  buttonHoverSize: {
    label: "按钮悬停尺寸",
    type: "number",
    defaultValue: 60,
  },
  // 文本模式配置
  textTags: {
    label: "文本标签选择器",
    type: "string",
    defaultValue: "p, span, h1, h2, h3",
  },
});