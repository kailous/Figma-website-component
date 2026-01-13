import { useLayoutEffect, useState } from "react";
import { defineProperties } from "figma:react";

export default function NetworkFormSubmitter({
  // --- 1. 定位设置 ---
  buttonLabel = "SubmitBtn",
  formContainerLabel = "LoginFormArea",

  // --- 2. 核心模式设置 ---
  submitMode = "mock", // 'mock' (演示) 或 'real' (真实请求)

  // --- 3. 网络请求配置 (仅在 real 模式生效) ---
  apiUrl = "https://api.example.com/login",
  httpMethod = "POST",
  contentType = "application/json", // 或者 'application/x-www-form-urlencoded'
  authToken = "", // 可选：Bearer Token

  // --- 4. 反馈文案 ---
  successMessage = "提交成功！",
  errorMessage = "提交失败，请重试。",
}) {
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  useLayoutEffect(() => {
    const btn = document.querySelector(
      `[aria-label="${buttonLabel}"]`,
    ) as HTMLElement;
    const formContainer = document.querySelector(
      `[aria-label="${formContainerLabel}"]`,
    ) as HTMLElement;

    if (!btn) return;

    const handleClick = async (e: MouseEvent) => {
      e.preventDefault();
      if (status === "loading") return;

      if (!formContainer) {
        alert("配置错误：找不到表单容器");
        return;
      }

      // 1. 收集数据
      const inputs = formContainer.querySelectorAll("input");
      const formData: Record<string, any> = {};
      let isValid = true;

      for (const input of inputs) {
        if (!input.name) continue;
        if (!input.checkValidity()) {
          isValid = false;
          input.reportValidity();
          return;
        }
        formData[input.name] = input.value;
      }

      if (isValid) {
        setStatus("loading");

        // 视觉反馈：按钮变灰
        const originalOpacity = btn.style.opacity;
        btn.style.opacity = "0.6";
        btn.style.cursor = "wait";

        try {
          if (submitMode === "mock") {
            // --- 模拟模式 ---
            await new Promise((resolve) =>
              setTimeout(resolve, 1500),
            );
            console.log("【模拟提交】数据包:", formData);
            alert(
              `[演示模式] ${successMessage}\n数据已打印在控制台。`,
            );
            setStatus("success");
          } else {
            // --- 真实网络请求模式 ---

            // 构建 Headers
            const headers: Record<string, string> = {
              "Content-Type": contentType,
            };
            if (authToken) {
              headers["Authorization"] = `Bearer ${authToken}`;
            }

            // 发起 Fetch
            const response = await fetch(apiUrl, {
              method: httpMethod,
              headers: headers,
              body:
                contentType === "application/json"
                  ? JSON.stringify(formData)
                  : new URLSearchParams(formData).toString(),
            });

            if (response.ok) {
              const result = await response.json();
              console.log("服务器响应:", result);
              alert(successMessage); // 实际项目中这里可能会跳转页面
              setStatus("success");
            } else {
              console.error(
                "服务器错误:",
                response.status,
                response.statusText,
              );
              alert(
                `${errorMessage} (代码: ${response.status})`,
              );
              setStatus("error");
            }
          }
        } catch (error) {
          console.error("网络请求异常:", error);
          alert("网络错误，无法连接到服务器。");
          setStatus("error");
        } finally {
          // 恢复按钮状态
          btn.style.opacity = originalOpacity;
          btn.style.cursor = "pointer";
          setStatus("idle");
        }
      }
    };

    btn.addEventListener("click", handleClick);

    return () => {
      btn.removeEventListener("click", handleClick);
    };
  }, [
    buttonLabel,
    formContainerLabel,
    submitMode,
    apiUrl,
    httpMethod,
    authToken,
    status,
  ]);

  return null;
}

// 属性面板配置
defineProperties(NetworkFormSubmitter, {
  // 分组 1: 基础连接
  buttonLabel: {
    label: "触发按钮 (Aria-Label)",
    type: "string",
    defaultValue: "LoginButton",
  },
  formContainerLabel: {
    label: "表单容器 (Aria-Label)",
    type: "string",
    defaultValue: "LoginFormArea",
  },

  // 分组 2: 模式选择
  submitMode: {
    label: "运行模式",
    type: "string",
    control: "select",
    options: [
      { label: "🟢 演示模拟 (Mock)", value: "mock" },
      { label: "🔴 真实请求 (Real)", value: "real" },
    ],
    defaultValue: "mock",
  },

  // 分组 3: API 设置 (仅 Real 模式有用)
  apiUrl: {
    label: "API 接口地址",
    type: "string",
    defaultValue: "https://httpbin.org/post", // 一个常用的测试接口
    description: "后端接收数据的完整 URL",
  },
  httpMethod: {
    label: "请求方法",
    type: "string",
    control: "select",
    options: [
      { label: "POST (新建/提交)", value: "POST" },
      { label: "PUT (更新)", value: "PUT" },
      { label: "GET (查询)", value: "GET" },
    ],
    defaultValue: "POST",
  },
  authToken: {
    label: "Auth Token (可选)",
    type: "string",
    defaultValue: "",
    description: "如果接口需要登录态，填入 Bearer Token",
  },

  // 分组 4: 反馈文案
  successMessage: {
    label: "成功提示",
    type: "string",
    defaultValue: "提交成功！",
  },
  errorMessage: {
    label: "失败提示",
    type: "string",
    defaultValue: "系统繁忙，请稍后再试。",
  },
});