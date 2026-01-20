import { useEffect, useRef } from "react";
import { defineProperties } from "figma:react";

export default function ScrollDrawerAutoEvent({
  targetLabel = "bottom-drawer",
  handleLabel = "bashou",
  triggerThreshold = 100,
  animationDuration = 0.5,
  handleOpacityActive = 0.3,
  isActive = true,
  isFigmaFixerMode = true,
}) {
  const isOpen = useRef(false);
  const scrollAccumulator = useRef(0);
  const currentClosedTransform = useRef("");

  useEffect(() => {
    if (!isActive) return;

    const container = document.querySelector(
      `[aria-label="${targetLabel}"]`,
    ) as HTMLElement;
    const handle = document.querySelector(
      `[aria-label="${handleLabel}"]`,
    ) as HTMLElement;

    if (!container || !handle) return;

    // --- 核心修复：自动对齐计算 ---
    const updatePosition = () => {
      // 暂时重置 transform 以获取原始物理坐标
      const originalTransform = container.style.transform;
      container.style.transform = "none";

      const containerRect = container.getBoundingClientRect();
      const handleRect = handle.getBoundingClientRect();

      // 恢复 transform
      container.style.transform = originalTransform;

      // 计算从容器顶边到把手底边的垂直距离
      const offsetToHandleBottom =
        handleRect.bottom - containerRect.top;

      // 生成收起时的位移字符串
      const transformValue = `translateY(calc(100% - ${offsetToHandleBottom}px))`;
      currentClosedTransform.current = transformValue;

      // 初始化容器样式
      Object.assign(container.style, {
        position: "fixed",
        left: "0",
        bottom: "0",
        width: "100%",
        transform: isOpen.current
          ? "translateY(0)"
          : transformValue,
        transition: `transform ${animationDuration}s cubic-bezier(0.22, 1, 0.36, 1)`,
        zIndex: "9998",
        overflow: "visible", // 确保把手不被裁切
        backgroundColor: "transparent",
      });
    };

    // 初始计算
    updatePosition();

    const openDrawer = () => {
      container.style.transform = "translateY(0)";
      if (handle)
        handle.style.opacity = handleOpacityActive.toString();
      isOpen.current = true;
      // 发送信号给打字机/阶梯组件
      window.dispatchEvent(
        new CustomEvent("drawerStateChange", {
          detail: { label: targetLabel, state: "open" },
        }),
      );
    };

    const closeDrawer = () => {
      container.style.transform =
        currentClosedTransform.current;
      if (handle) handle.style.opacity = "1";
      isOpen.current = false;
      // 发送信号
      window.dispatchEvent(
        new CustomEvent("drawerStateChange", {
          detail: { label: targetLabel, state: "closed" },
        }),
      );
    };

    const handleWheel = (e: WheelEvent) => {
      scrollAccumulator.current += e.deltaY;
      if (scrollAccumulator.current < 0)
        scrollAccumulator.current = 0;
      if (
        scrollAccumulator.current > triggerThreshold &&
        !isOpen.current
      )
        openDrawer();
      else if (
        scrollAccumulator.current <= triggerThreshold &&
        isOpen.current
      )
        closeDrawer();
    };

    const toggle = () =>
      isOpen.current ? closeDrawer() : openDrawer();

    // 绑定交互
    if (isFigmaFixerMode) {
      window.addEventListener("wheel", handleWheel);
    }
    handle.style.cursor = "pointer";
    handle.addEventListener("click", toggle);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("wheel", handleWheel);
      handle.removeEventListener("click", toggle);
      window.removeEventListener("resize", updatePosition);
    };
  }, [
    targetLabel,
    handleLabel,
    triggerThreshold,
    animationDuration,
    handleOpacityActive,
    isActive,
    isFigmaFixerMode,
  ]);

  return null;
}

defineProperties(ScrollDrawerAutoEvent, {
  targetLabel: {
    label: "容器 Label",
    type: "string",
    defaultValue: "bottom-drawer",
  },
  handleLabel: {
    label: "把手 Label",
    type: "string",
    defaultValue: "bashou",
  },
  handleOpacityActive: {
    label: "拉开后把手透明度",
    type: "number",
    defaultValue: 0.3,
  },
  triggerThreshold: {
    label: "触发阈值",
    type: "number",
    defaultValue: 100,
  },
  animationDuration: {
    label: "动画时长(s)",
    type: "number",
    defaultValue: 0.5,
  },
  isFigmaFixerMode: {
    label: "兼容 Fixer (滚轮模式)",
    type: "boolean",
    defaultValue: true,
  },
  isActive: {
    label: "启用",
    type: "boolean",
    defaultValue: true,
  },
});