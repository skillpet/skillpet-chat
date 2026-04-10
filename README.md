# @skillpet/chat Examples

<p align="center">
  <strong>SSE 流式 AI 对话面板组件库 — React & Vue 3 使用示例。</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@skillpet/chat-react"><img src="https://img.shields.io/npm/v/@skillpet/chat-react.svg?label=react" alt="react version"></a>
  <a href="https://www.npmjs.com/package/@skillpet/chat-vue"><img src="https://img.shields.io/npm/v/@skillpet/chat-vue.svg?label=vue" alt="vue version"></a>
  <a href="https://chat.skill.pet"><img src="https://img.shields.io/badge/demo-chat.skill.pet-blue" alt="demo"></a>
</p>

---

## 在线演示

**https://chat.skill.pet**

## 包安装

```bash
# React 项目
npm install @skillpet/chat-react

# Vue 项目
npm install @skillpet/chat-vue

# 仅 Core（框架无关：SSE、i18n、类型）
npm install @skillpet/chat-core
```

## React 示例

本仓库 `demo/` 目录包含完整的 React 示例应用：

```bash
git clone https://github.com/skillpet/skillpet-chat.git
cd skillpet-chat/demo
npm install
npm run dev
# 打开 http://localhost:5400
```

### 最简用法

```tsx
import { ChatPanel } from "@skillpet/chat-react";
import "@skillpet/chat-core/styles.css";

function App() {
  return (
    <ChatPanel
      projectId="my-project"
      config={{
        api: {
          baseUrl: "/api/chat",
          deleteConversationUrl: "/api/chat/conversation",
        },
        getAccessToken: () => localStorage.getItem("token"),
      }}
    />
  );
}
```

### 示例包含

- **欢迎页** — 产品介绍、多语言切换
- **对话演示** — Mock SSE 流式对话（支持工具调用、表单交互、方案选择）
- **API 文档** — 完整接口参考

## 功能特性

- SSE 流式对话，实时显示 AI 思考过程与工具调用
- React & Vue 3 双框架完全对等
- 子智能体（consult agent）多轮对话与工具步骤展示
- 结构化提问（ask_user）表单交互
- 斜杠指令面板
- 内置 7 种语言（zh-CN、zh-TW、en、ja、ko、es、fr）
- 蓝色品牌色默认主题，支持深色/浅色模式
- CSS 变量完全自定义配色
- UMD 全局打包，支持 CDN 引入

## CDN 使用

```html
<script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
<script src="https://unpkg.com/@skillpet/chat-react/dist/index.umd.js"></script>
<link rel="stylesheet" href="https://unpkg.com/@skillpet/chat-core/dist/skillpet-chat.css" />
```

## 相关链接

- [npm @skillpet/chat-react](https://www.npmjs.com/package/@skillpet/chat-react)
- [npm @skillpet/chat-vue](https://www.npmjs.com/package/@skillpet/chat-vue)
- [npm @skillpet/chat-core](https://www.npmjs.com/package/@skillpet/chat-core)

## License

MIT
