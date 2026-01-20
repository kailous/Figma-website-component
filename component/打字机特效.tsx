import { useEffect, useRef } from "react";
import { defineProperties } from "figma:react";

export default function UniversalTypewriter({
  targetLabel = "intro-text",
  parentDrawerLabel = "bottom-drawer",
  triggerMode = "event", // "scroll" 或 "event"
  speed = 2000,
  delay = 0.2,
  isActive = true,
  threshold = 0.3,
}) {
  const isAnimating = useRef(false);

  useEffect(() => {
    const rootEl = document.querySelector(
      `[aria-label="${targetLabel}"]`,
    ) as HTMLElement;
    if (!rootEl || !isActive) return;

    // 1. 文本准备逻辑
    if (!rootEl.dataset.originalHtml) {
      rootEl.dataset.originalHtml = rootEl.innerHTML;
    }
    const textNodes: { node: Node; text: string }[] = [];
    function traverse(node: Node) {
      if (node.nodeType === 3)
        textNodes.push({ node, text: node.nodeValue || "" });
      else node.childNodes.forEach(traverse);
    }
    rootEl.innerHTML = rootEl.dataset.originalHtml;
    traverse(rootEl);

    let intervalId: any = null;
    let timeoutId: any = null;

    const reset = () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
      textNodes.forEach((item) => {
        item.node.nodeValue = "";
      });
      isAnimating.current = false;
    };

    const play = () => {
      if (isAnimating.current) return;
      isAnimating.current = true;
      timeoutId = setTimeout(() => {
        let globalCharIndex = 0;
        const totalChars = textNodes.reduce(
          (acc, item) => acc + item.text.length,
          0,
        );
        const charsPerTick = Math.max(
          1,
          Math.ceil(speed * 0.02),
        );
        intervalId = setInterval(() => {
          globalCharIndex += charsPerTick;
          let remaining = Math.min(globalCharIndex, totalChars);
          for (const item of textNodes) {
            const len = item.text.length;
            if (remaining <= 0) item.node.nodeValue = "";
            else if (remaining < len) {
              item.node.nodeValue = item.text.slice(
                0,
                remaining,
              );
              remaining = 0;
            } else {
              item.node.nodeValue = item.text;
              remaining -= len;
            }
          }
          if (globalCharIndex >= totalChars)
            clearInterval(intervalId);
        }, 20);
      }, delay * 1000);
    };

    // 2. 触发模式判断
    let observer: IntersectionObserver | null = null;

    const onDrawerChange = (e: any) => {
      const { label, state } = e.detail;
      if (label === parentDrawerLabel) {
        state === "open" ? play() : reset();
      }
    };

    if (triggerMode === "event") {
      window.addEventListener(
        "drawerStateChange",
        onDrawerChange,
      );
      reset(); // 事件模式初始隐藏
    } else {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) =>
            entry.isIntersecting ? play() : reset(),
          );
        },
        { threshold },
      );
      observer.observe(rootEl);
    }

    return () => {
      window.removeEventListener(
        "drawerStateChange",
        onDrawerChange,
      );
      if (observer) observer.disconnect();
      reset();
    };
  }, [
    targetLabel,
    parentDrawerLabel,
    triggerMode,
    speed,
    delay,
    isActive,
    threshold,
  ]);

  return null;
}

defineProperties(UniversalTypewriter, {
  targetLabel: {
    label: "文本容器 Label",
    type: "string",
    defaultValue: "intro-text",
  },
  triggerMode: {
    label: "触发模式",
    type: "enum",
    options: ["scroll", "event"],
    defaultValue: "event",
  },
  parentDrawerLabel: {
    label: "关联抽屉 Label (事件模式用)",
    type: "string",
    defaultValue: "bottom-drawer",
  },
  speed: { label: "速度", type: "number", defaultValue: 2000 },
  delay: { label: "延迟", type: "number", defaultValue: 0.2 },
  threshold: {
    label: "滚动触发比例 (滚动模式用)",
    type: "number",
    defaultValue: 0.3,
  },
  isActive: {
    label: "启用",
    type: "boolean",
    defaultValue: true,
  },
});