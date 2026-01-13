import { useState, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { defineProperties } from "figma:react";

export default function AutoInputReplacer({
  // 1. 目标定位
  targetAriaLabel = "SearchBox",

  // 2. 视觉样式 (Placeholder)
  placeholderText = "请输入内容...",
  placeholderColor = "#999999",

  // 3. 表单参数 (Form Attributes)
  formName = "fieldName", // input name="..."
  inputType = "text", // text, password, email...
  isRequired = false, // required
  maxLength = 100, // max length
  autoComplete = "off", // autocomplete
  autoFocus = false, // autofocus
}) {
  const [targetElement, setTargetElement] =
    useState<HTMLElement | null>(null);
  const [inheritedStyles, setInheritedStyles] = useState({
    color: "inherit",
    fontSize: "inherit",
    fontFamily: "inherit",
    lineHeight: "inherit",
    fontWeight: "inherit",
    letterSpacing: "inherit",
    textAlign: "left" as any,
    padding: "0px",
  });

  const uniqueId = useRef(
    "hijack-" + Math.floor(Math.random() * 10000),
  );

  useLayoutEffect(() => {
    // 1. 寻找目标容器
    const container = document.querySelector(
      `[aria-label="${targetAriaLabel}"]`,
    ) as HTMLElement;

    if (container) {
      // 2. 寻找容器内的文本节点
      const textNode =
        container.querySelector("p, span") || container;
      const computed = window.getComputedStyle(
        textNode as Element,
      );
      const containerComputed =
        window.getComputedStyle(container);

      // 3. 提取关键样式
      setInheritedStyles({
        color: computed.color,
        fontSize: computed.fontSize,
        fontFamily: computed.fontFamily,
        lineHeight: computed.lineHeight,
        fontWeight: computed.fontWeight,
        letterSpacing: computed.letterSpacing,
        textAlign: computed.textAlign as any,
        padding: "0",
      });

      // 4. 隐藏原有文本
      if (container.querySelector("p, span")) {
        (
          container.querySelector("p, span") as HTMLElement
        ).style.display = "none";
      } else {
        container.innerText = "";
      }

      // 5. 确保容器定位
      if (containerComputed.position === "static") {
        container.style.position = "relative";
      }
      if (containerComputed.display === "inline") {
        container.style.display = "inline-block";
      }

      setTargetElement(container);
    }
  }, [targetAriaLabel]);

  if (!targetElement) return null;

  return createPortal(
    <>
      <style>{`
        .${uniqueId.current}::placeholder {
          color: ${placeholderColor} !important;
          opacity: 1;
        }
        .${uniqueId.current}:focus {
          outline: none;
        }
        /* 针对密码框，可能需要隐藏特定浏览器的图标 */
        .${uniqueId.current}::-ms-reveal,
        .${uniqueId.current}::-ms-clear {
          display: none;
        }
      `}</style>

      <input
        // --- 核心表单属性 ---
        name={formName}
        type={inputType}
        required={isRequired}
        maxLength={maxLength > 0 ? maxLength : undefined}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        className={uniqueId.current}
        placeholder={placeholderText}
        style={{
          position: "relative",
          display: "block",
          width: "100%",
          height: "100%",
          background: "transparent",
          border: "none",
          outline: "none",
          margin: 0,
          // 继承样式
          color: inheritedStyles.color,
          fontSize: inheritedStyles.fontSize,
          fontFamily: inheritedStyles.fontFamily,
          lineHeight: inheritedStyles.lineHeight,
          fontWeight: inheritedStyles.fontWeight,
          letterSpacing: inheritedStyles.letterSpacing,
          textAlign: inheritedStyles.textAlign,
          padding: inheritedStyles.padding,
        }}
      />
    </>,
    targetElement,
  );
}

// 属性面板配置
defineProperties(AutoInputReplacer, {
  targetAriaLabel: {
    label: "目标容器 Aria-Label",
    type: "string",
    defaultValue: "SearchBox",
  },
  // --- 视觉设置 ---
  placeholderText: {
    label: "占位提示文案",
    type: "string",
    defaultValue: "请输入...",
  },
  placeholderColor: {
    label: "未输入颜色",
    type: "string",
    control: "color",
    defaultValue: "#CCCCCC",
  },
  // --- 表单核心设置 ---
  formName: {
    label: "字段名称 (name)",
    type: "string",
    defaultValue: "username",
    description: "表单提交时的字段名",
  },
  inputType: {
    label: "输入类型 (type)",
    type: "string",
    control: "select",
    options: [
      { label: "普通文本 (text)", value: "text" },
      { label: "密码 (password)", value: "password" },
      { label: "电子邮箱 (email)", value: "email" },
      { label: "电话号码 (tel)", value: "tel" },
      { label: "搜索 (search)", value: "search" },
      { label: "网址 (url)", value: "url" },
      { label: "数字 (number)", value: "number" },
    ],
    defaultValue: "text",
  },
  isRequired: {
    label: "是否必填 (Required)",
    type: "boolean",
    defaultValue: false,
  },
  maxLength: {
    label: "最大字符数",
    type: "number",
    defaultValue: 100,
  },
  autoComplete: {
    label: "自动填充",
    type: "string",
    control: "select",
    options: [
      { label: "关闭 (off)", value: "off" },
      { label: "开启 (on)", value: "on" },
      { label: "用户名 (username)", value: "username" },
      {
        label: "当前密码 (current-password)",
        value: "current-password",
      },
      { label: "新密码 (new-password)", value: "new-password" },
    ],
    defaultValue: "off",
  },
  autoFocus: {
    label: "自动聚焦",
    type: "boolean",
    defaultValue: false,
  },
});