import { useEffect, useRef } from "react";
import { defineProperties } from "figma:react";

export default function UniversalStagger({
  targetLabel = "iconicon",
  parentDrawerLabel = "bottom-drawer",
  triggerMode = "event",
  staggerDelay = 0.1,
  startDelay = 0.3,
  isActive = true,
  threshold = 0.1,
}) {
  const isAnimating = useRef(false);

  useEffect(() => {
    if (!isActive) return;
    const containers = document.querySelectorAll(
      `[aria-label="${targetLabel}"]`,
    );
    if (containers.length === 0) return;

    const timers: number[] = [];

    const reset = () => {
      timers.forEach((t) => clearTimeout(t));
      timers.length = 0;
      containers.forEach((container) => {
        Array.from(container.children).forEach((item) => {
          (item as HTMLElement).style.opacity = "0";
          (item as HTMLElement).style.visibility = "hidden";
        });
      });
      isAnimating.current = false;
    };

    const play = () => {
      if (isAnimating.current) return;
      isAnimating.current = true;
      const tStart = window.setTimeout(() => {
        containers.forEach((container) => {
          Array.from(container.children).forEach(
            (item, index) => {
              const tItem = window.setTimeout(
                () => {
                  (item as HTMLElement).style.opacity = "1";
                  (item as HTMLElement).style.visibility =
                    "visible";
                  (item as HTMLElement).style.transition =
                    "opacity 0.3s ease";
                },
                index * staggerDelay * 1000,
              );
              timers.push(tItem);
            },
          );
        });
      }, startDelay * 1000);
      timers.push(tStart);
    };

    const onDrawerChange = (e: any) => {
      const { label, state } = e.detail;
      if (label === parentDrawerLabel) {
        state === "open" ? play() : reset();
      }
    };

    let observer: IntersectionObserver | null = null;

    if (triggerMode === "event") {
      window.addEventListener(
        "drawerStateChange",
        onDrawerChange,
      );
      reset();
    } else {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) =>
            entry.isIntersecting ? play() : reset(),
          );
        },
        { threshold },
      );
      containers.forEach((c) => observer?.observe(c));
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
    staggerDelay,
    startDelay,
    isActive,
    threshold,
  ]);

  return null;
}

defineProperties(UniversalStagger, {
  targetLabel: {
    label: "目标容器 Label",
    type: "string",
    defaultValue: "iconicon",
  },
  triggerMode: {
    label: "触发模式",
    type: "enum",
    options: ["scroll", "event"],
    defaultValue: "event",
  },
  parentDrawerLabel: {
    label: "关联抽屉 Label",
    type: "string",
    defaultValue: "bottom-drawer",
  },
  staggerDelay: {
    label: "显现间隔",
    type: "number",
    defaultValue: 0.1,
  },
  startDelay: {
    label: "总延迟",
    type: "number",
    defaultValue: 0.3,
  },
  isActive: {
    label: "启用",
    type: "boolean",
    defaultValue: true,
  },
});