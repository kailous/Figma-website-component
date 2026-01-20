import { useEffect } from "react";

export default function FigmaViewportFixer() {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const container = document.getElementById("container");

    const forceResponsive = () => {
      // 1. 获取真实视口高度
      const vh = window.innerHeight;
      const vw = window.innerWidth;

      // 2. 强力覆盖 Figma 的内联 height: 506px
      // 使用 !important 的程序化等价方案：直接修改 style 属性
      html.style.setProperty("height", `${vh}px`, "important");
      body.style.setProperty("height", `${vh}px`, "important");
      html.style.setProperty("overflow", "hidden", "important");
      body.style.setProperty("overflow", "hidden", "important");

      // 3. 修正 Figma 生成的内部变量
      html.style.setProperty("--100dvh", `${vh}px`);
      html.style.setProperty("--100dvw", `${vw}px`);

      // 4. 处理 Figma 特有的容器类
      if (container) {
        container.style.height = "100%";
        container.style.width = "100%";

        // 寻找 Figma 自动生成的那些具有 min-height 的子 div 并重置它们
        const figmaInnerDivs = container.querySelectorAll(
          'div[data-breakpoint="true"]',
        );
        figmaInnerDivs.forEach((el) => {
          const div = el as HTMLElement;
          div.style.height = "100%";
          div.style.minHeight = "100%";
          div.style.maxHeight = "100%";
        });
      }
    };

    // 执行重置
    forceResponsive();

    // 监听所有可能导致高度变化的事件
    window.addEventListener("resize", forceResponsive);
    window.addEventListener(
      "orientationchange",
      forceResponsive,
    );

    return () => {
      window.removeEventListener("resize", forceResponsive);
      window.removeEventListener(
        "orientationchange",
        forceResponsive,
      );
    };
  }, []);

  return null;
}