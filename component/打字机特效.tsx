import { useEffect, useRef } from "react";
import { defineProperties } from "figma:react";

export default function TypewriterController({
  targetLabel = "intro-text",
  speed = 2000, // 【修改】默认设为 2000 试试看
  delay = 0.2,
  isActive = true,
  threshold = 0.3,
}) {
  useEffect(() => {
    const elements = document.querySelectorAll(
      `[aria-label="${targetLabel}"]`,
    );
    if (elements.length === 0) return;

    const cleanupFns: Array<() => void> = [];

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const htmlEl = entry.target as HTMLElement;
            const playAnimation = (htmlEl as any)
              .__playTypewriter;
            if (playAnimation) playAnimation();
            observer.unobserve(htmlEl);
          }
        });
      },
      { threshold: threshold },
    );

    elements.forEach((element) => {
      const rootEl = element as HTMLElement;

      // 1. 备份
      if (!rootEl.dataset.originalHtml) {
        if (!rootEl.innerHTML.trim()) return;
        rootEl.dataset.originalHtml = rootEl.innerHTML;
      }

      if (!isActive) {
        rootEl.innerHTML = rootEl.dataset.originalHtml;
        return;
      }

      // 2. 准备文本节点
      const textNodes: { node: Node; text: string }[] = [];
      function traverse(node: Node) {
        if (node.nodeType === 3) {
          const val = node.nodeValue;
          if (val) {
            textNodes.push({ node, text: val });
            node.nodeValue = "";
          }
        } else {
          node.childNodes.forEach(traverse);
        }
      }

      rootEl.innerHTML = rootEl.dataset.originalHtml;
      traverse(rootEl);

      // 3. 动画逻辑
      let timeoutId: number | null = null;
      let intervalId: number | null = null;

      const runAnimation = () => {
        timeoutId = window.setTimeout(() => {
          let globalCharIndex = 0;

          // --- 核心算法升级：突破浏览器 4ms 限制 ---

          let charsPerTick = 1; // 默认每次打 1 个字
          let intervalTime = 1000 / Math.max(speed, 1);

          // 浏览器最小间隔极限约为 16ms (60fps) - 20ms
          // 如果计算出的间隔小于 20ms，说明速度太快了，需要开启“批量模式”
          const MIN_INTERVAL = 20;

          if (intervalTime < MIN_INTERVAL) {
            intervalTime = MIN_INTERVAL; // 锁定为 20ms 一次
            // 计算每次需要打多少个字才能满足目标速度
            // 公式：每次字数 = 目标速度(字/秒) * (每次间隔(ms) / 1000)
            // 例如：2000 * (20 / 1000) = 40 个字
            charsPerTick = speed * (MIN_INTERVAL / 1000);

            // 至少为 1，且保留小数用于累加（这里简单处理，直接向上取整保证速度不慢于预期）
            charsPerTick = Math.max(1, Math.ceil(charsPerTick));
          }

          const totalChars = textNodes.reduce(
            (acc, item) => acc + item.text.length,
            0,
          );

          intervalId = window.setInterval(() => {
            // 【关键】每次增加 charsPerTick 个字
            globalCharIndex += charsPerTick;

            // 确保不超过总数，防止最后一下越界
            const safeCurrentIndex = Math.min(
              globalCharIndex,
              totalChars,
            );

            let remainingCharsToType = safeCurrentIndex;

            for (const item of textNodes) {
              const nodeTextLength = item.text.length;
              if (remainingCharsToType <= 0) {
                if (item.node.nodeValue !== "")
                  item.node.nodeValue = "";
              } else if (
                remainingCharsToType < nodeTextLength
              ) {
                item.node.nodeValue = item.text.slice(
                  0,
                  remainingCharsToType,
                );
                remainingCharsToType = 0;
              } else {
                if (item.node.nodeValue !== item.text)
                  item.node.nodeValue = item.text;
                remainingCharsToType -= nodeTextLength;
              }
            }

            if (globalCharIndex >= totalChars) {
              if (intervalId) {
                clearInterval(intervalId);
                intervalId = null;
              }
            }
          }, intervalTime);
        }, delay * 1000);
      };

      (rootEl as any).__playTypewriter = runAnimation;
      observer.observe(rootEl);

      cleanupFns.push(() => {
        observer.unobserve(rootEl);
        if (timeoutId) clearTimeout(timeoutId);
        if (intervalId) clearInterval(intervalId);
        if (rootEl.dataset.originalHtml) {
          rootEl.innerHTML = rootEl.dataset.originalHtml;
        }
      });
    });

    return () => {
      observer.disconnect();
      cleanupFns.forEach((fn) => fn());
    };
  }, [targetLabel, speed, delay, isActive, threshold]);

  return null;
}

defineProperties(TypewriterController, {
  targetLabel: {
    label: "目标容器 (aria-label)",
    type: "string",
    defaultValue: "intro-text",
  },
  speed: {
    label: "速度 (字/秒)",
    type: "number",
    // 默认值给大一点，方便测试极速效果
    defaultValue: 2000,
  },
  delay: {
    label: "触发后延迟 (秒)",
    type: "number",
    defaultValue: 0.2,
  },
  threshold: {
    label: "触发可视比例",
    type: "number",
    defaultValue: 0.3,
  },
  isActive: {
    label: "启用打字机",
    type: "boolean",
    defaultValue: true,
  },
});