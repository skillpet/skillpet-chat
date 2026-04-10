# @skillpet/chat API Reference

SSE streaming AI chat panel component library — React & Vue 3 dual-framework, i18n 7 languages, fully customizable.

- npm: [@skillpet/chat-react](https://www.npmjs.com/package/@skillpet/chat-react)
- npm: [@skillpet/chat-vue](https://www.npmjs.com/package/@skillpet/chat-vue)
- npm: [@skillpet/chat-core](https://www.npmjs.com/package/@skillpet/chat-core)
- Demo: [chat.skill.pet](https://chat.skill.pet)

---

## Installation

```bash
# React (auto-installs core + render deps)
npm install @skillpet/chat-react

# Vue (auto-installs core + render deps)
npm install @skillpet/chat-vue

# Core only (framework-agnostic: SSE, i18n, types)
npm install @skillpet/chat-core
```

## Quick Start

### React

```tsx
import { ChatPanel } from '@skillpet/chat-react';
import '@skillpet/chat-core/styles.css';

function App() {
  return (
    <ChatPanel
      projectId="my-project"
      config={{
        api: {
          baseUrl: '/api/chat',
          deleteConversationUrl: '/api/chat/conversation/{projectId}',
        },
        getAccessToken: () => localStorage.getItem('token'),
      }}
    />
  );
}
```

### Vue

```vue
<script setup lang="ts">
import { ChatPanel } from '@skillpet/chat-vue';
import '@skillpet/chat-core/styles.css';

const config = {
  api: {
    baseUrl: '/api/chat',
    deleteConversationUrl: '/api/chat/conversation/{projectId}',
  },
  getAccessToken: () => localStorage.getItem('token'),
};
</script>

<template>
  <ChatPanel project-id="my-project" :config="config" />
</template>
```

### CDN (UMD)

```html
<script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
<script src="https://unpkg.com/@skillpet/chat-react/dist/index.umd.js"></script>
<link rel="stylesheet" href="https://unpkg.com/@skillpet/chat-core/dist/skillpet-chat.css" />
```

UMD globals: `SkillpetChatCore`, `SkillpetChatReact`, `SkillpetChatVue`.

---

## Layer 1: Ready-to-Use

### ChatPanel

Main component with full chat UI, input box, message list, and tool interaction.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `projectId` | `string` | Yes | Project / conversation ID |
| `config` | `ChatPanelConfig` | No | API endpoints, auth; can also be injected via ChatProvider |
| `onStatusChange` | `() => void` | No | Callback when SSE stream ends |
| `onResourceUpdated` | `(key: string, snapshot?: string) => void` | No | Resource update event callback |
| `extraSlashCommands` | `SlashCommand[]` | No | Additional slash commands |
| `quickStarters` | `string[]` | No | Quick starter prompts for empty state |
| `emptyState` | `ChatPanelEmptyState` | No | Custom empty state icon, title, subtitle |
| `className` | `string` | No | CSS class for root element |

### ChatProvider (React) / provideChatConfig (Vue)

Injects `ChatPanelConfig` via Context / provide-inject so multiple ChatPanel instances share one config.

```tsx
// React
import { ChatProvider, ChatPanel } from '@skillpet/chat-react';

<ChatProvider config={config}>
  <ChatPanel projectId="a" />
  <ChatPanel projectId="b" />
</ChatProvider>
```

```ts
// Vue
import { provideChatConfig } from '@skillpet/chat-vue';
provideChatConfig(config);
```

### useChatConfig

Reads config from Context. Accepts optional `propsConfig` that takes priority.

### setChatLanguage(lang: string)

Switch built-in i18n language. Supported: `zh-CN`, `zh-TW`, `en`, `ja`, `ko`, `es`, `fr`.

```ts
setChatLanguage('en');
```

---

## Layer 2: Custom Composition

### useChatPanel(options) — React Hook / Vue Composable

Headless hook that returns all chat panel state and actions for fully custom UI.

#### Options

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `projectId` | `string` | Yes | Project / conversation ID |
| `config` | `ChatPanelConfig` | Yes | API and auth config |
| `onStatusChange` | `() => void` | No | Status change callback |
| `onResourceUpdated` | `(key: string, snapshot?: string) => void` | No | Resource update callback |
| `extraSlashCommands` | `SlashCommand[]` | No | Additional slash commands |

#### Return Values

| Field | Type | Description |
|-------|------|-------------|
| `messages` | `ChatMessage[]` | Current message list |
| `setMessages` | `Dispatch<SetStateAction>` | Update messages |
| `input` | `string` | Input text |
| `setInput` | `Dispatch<SetStateAction>` | Set input text |
| `isLoading` | `boolean` | Whether loading / streaming |
| `enableThinking` | `boolean` | Deep thinking toggle |
| `setEnableThinking` | `Dispatch<SetStateAction>` | Toggle deep thinking |
| `enableSearch` | `boolean` | Web search toggle |
| `setEnableSearch` | `Dispatch<SetStateAction>` | Toggle web search |
| `capVisible` | `string[]` | Backend-reported visible capabilities |
| `isLoadingHistory` | `boolean` | Whether loading history |
| `showSlashCommands` | `boolean` | Whether showing slash panel |
| `slashCommands` | `SlashCommand[]` | Merged slash command list |
| `handleSend` | `(msg?: string) => Promise<void>` | Send message |
| `handleSlashCommand` | `(cmd: SlashCommand) => void` | Execute slash command |
| `handleOptionClick` | `(callId: string, name: string, optId: string) => Promise<void>` | Tool option click |
| `handleResetConversation` | `() => Promise<void>` | Reset conversation |
| `stopGeneration` | `() => void` | Abort streaming |
| `handleKeyDown` | `(e: KeyboardEvent) => void` | Keyboard handler |
| `handleChatScroll` | `() => void` | Scroll handler |
| `scrollToMessage` | `(msgId: string) => void` | Scroll to specific message |
| `setMessageElementRef` | `(id: string, el: HTMLElement \| null) => void` | Register message DOM ref |
| `navMessages` | `ChatMessage[]` | Navigation message list |
| `containerRef` | `RefObject<HTMLDivElement>` | Scroll container ref |
| `showScrollButton` | `boolean` | Whether to show scroll-to-bottom |
| `scrollToBottom` | `(force?: boolean) => void` | Scroll to bottom |

### MessageBubble

Single message bubble component supporting user / assistant / tool roles.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `msg` | `ChatMessage` | Yes | Message data |
| `onEditMessage` | `(id: string, content: string) => void` | No | Edit message callback |
| `setMessageElementRef` | `(id: string, el: HTMLElement \| null) => void` | No | DOM ref registration |
| `onToolOptionClick` | `(callId: string, name: string, optId: string) => void` | No | Tool option click |
| `onAskUserSubmit` | `(msgId: string, answers: Record<string, string[]>) => void` | No | Form submit callback |
| `isLoading` | `boolean` | No | Loading state |

### AskUserBlock

Structured form interaction component with single-select, multi-select, and free-text input.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `questions` | `AskUserQuestion[]` | Yes | Question list |
| `status` | `'pending' \| 'answered'` | Yes | Form status |
| `onSubmit` | `(answers: Record<string, string[]>) => void` | Yes | Submit callback |

### ThinkingBlock

AI thinking process display, collapsible, with streaming scroll.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `content` | `string` | Yes | Thinking content text |
| `isStreaming` | `boolean` | No | Whether streaming output |

### SlashCommandPalette

Slash command panel with keyboard navigation and fuzzy filter.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `commands` | `SlashCommand[]` | Yes | Command list |
| `filter` | `string` | Yes | Current filter text |
| `onSelect` | `(cmd: SlashCommand) => void` | Yes | Select callback |
| `onClose` | `() => void` | Yes | Close panel callback |

---

## Layer 3: Low-Level Primitives

### processSSEStream(options)

Sends a POST request and parses the SSE stream, updating message state via callbacks.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `url` | `string` | Yes | SSE stream endpoint URL |
| `body` | `Record<string, unknown>` | Yes | POST body |
| `token` | `string \| null` | Yes | Bearer token |
| `signal` | `AbortSignal` | No | For cancelling the request |
| `callbacks` | `SSECallbacks` | Yes | State update callback set |
| `uiStrings` | `Partial<SSEStreamUiStrings>` | No | Override built-in UI strings |

### parseHistoryMessages(messages, uiStrings?)

Converts backend history API raw messages into `ChatMessage[]`, handling ask_user, tool results, and other special formats.

---

## Type Definitions

### ChatPanelConfig

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `api.baseUrl` | `string` | Yes | SSE / history API base URL |
| `api.deleteConversationUrl` | `string` | Yes | Delete conversation URL (supports `{projectId}` placeholder) |
| `getAccessToken` | `() => string \| null \| Promise<string \| null>` | Yes | Get Bearer token |
| `accessToken` | `string \| null` | No | Token identifier (history reloads when changed) |
| `lang` | `string` | No | Language code (zh-CN / en / ja / ...) |
| `components` | `ChatPanelComponents` | No | UI component toggles |

### ChatPanelComponents

| Field | Type | Description |
|-------|------|-------------|
| `showMessageNav` | `boolean` | Whether to show message navigation dots (default: true) |

### ChatPanelEmptyState

| Field | Type | Description |
|-------|------|-------------|
| `icon` | `ReactNode` | Top icon |
| `title` | `string` | Title text |
| `subtitle` | `string` | Subtitle text |

### SlashCommand

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `command` | `string` | Yes | Command text (e.g. `/help`) |
| `label` | `string` | Yes | Display label |
| `description` | `string` | Yes | Description text |
| `icon` | `ReactNode` | Yes | Icon |

### ChatMessage

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | Unique message ID |
| `role` | `'user' \| 'assistant' \| 'tool'` | Yes | Message role |
| `content` | `string` | Yes | Message body |
| `thinking` | `string` | No | AI thinking process |
| `toolResult` | `object` | No | Tool call result |
| `askUser` | `{ questions: AskUserQuestion[], status: 'pending' \| 'answered' }` | No | Structured question data |
| `parts` | `MessagePart[]` | No | Multi-part message (tools, sub-agents, etc.) |
| `isStreaming` | `boolean` | No | Whether streaming output |
| `statusText` | `string` | No | Status hint text |

### AskUserQuestion

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | Question ID |
| `prompt` | `string` | Yes | Question text |
| `options` | `{ id: string, label: string }[]` | Yes | Option list |
| `allowMultiple` | `boolean` | No | Allow multi-select |
| `allowFreeText` | `boolean` | No | Allow free text input |
| `freeTextPlaceholder` | `string` | No | Free text placeholder |

### SSECallbacks

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `updateMessages` | `(updater: (prev: ChatMessage[]) => ChatMessage[]) => void` | Yes | Message state updater |
| `onResourceUpdated` | `(key: string, snapshot?: string) => void` | No | Resource update callback |
| `onStatusChange` | `() => void` | No | Status change callback |
| `onNoReader` | `() => void` | No | When response.body has no reader |
| `onFinally` | `() => void` | No | Cleanup after stream ends or aborts |

### SSEStreamUiStrings

| Field | Type | Description |
|-------|------|-------------|
| `preparingToolHeartbeat` | `string` | Tool heartbeat hint |
| `sseUnknownError` | `string` | Unknown error text |
| `connectionLost` | `string` | Connection lost text |
| `requestFailed` | `string` | Request failed text |

### ParseHistoryUiStrings

| Field | Type | Description |
|-------|------|-------------|
| `askUserErrorLabel` | `string` | Parse failure tool name |
| `askUserErrorMessage` | `string` | Parse failure hint |

### MessagePart

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | `'text' \| 'tool' \| 'agent-text' \| 'agent-tools'` | Yes | Part type |
| `content` | `string` | No | Text content |
| `thinking` | `string` | No | Thinking content |
| `toolResult` | `ToolInlineResult` | No | Tool inline result |
| `agentName` | `string` | No | Sub-agent name |
| `agentCallId` | `string` | No | Sub-agent call ID |
| `agentStatus` | `string` | No | Sub-agent status |
| `isAgentStreaming` | `boolean` | No | Whether sub-agent is streaming |
| `agentToolSteps` | `AgentToolStep[]` | No | Sub-agent tool steps |
| `preview` | `string` | No | Tool arguments preview |

### AgentToolStep

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | Yes | Tool name |
| `label` | `string` | Yes | Display label |
| `status` | `'running' \| 'completed' \| 'error'` | Yes | Execution status |
| `summary` | `string` | No | Execution summary |

### ToolInlineResult

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | Yes | Tool name |
| `label` | `string` | Yes | Display label |
| `status` | `string` | Yes | Execution status |
| `message` | `string` | Yes | Result message |
| `id` | `string` | No | Tool call ID |

---

## Vue Entry — @skillpet/chat-vue

API is fully equivalent to the React version, only framework paradigms differ:

| Export | Kind | Description |
|--------|------|-------------|
| `ChatPanel` | Component | Vue 3 SFC main component, props identical to React |
| `provideChatConfig` | Function | Inject config via provide/inject (replaces ChatProvider) |
| `useChatConfig` | Composable | Read injected config |
| `setChatLanguage` | Function | Switch i18n language |
| `useChatPanel` | Composable | Headless composable, returns ref/computed reactive state |
| `MessageBubble` | Component | Message bubble SFC |
| `AskUserBlock` | Component | Form interaction SFC |
| `ThinkingBlock` | Component | Thinking process SFC |
| `SlashCommandPalette` | Component | Slash command panel SFC |
| `processSSEStream` | Function | SSE stream processing (same as React) |
| `parseHistoryMessages` | Function | History message parsing (same as React) |

## Core Entry — @skillpet/chat-core

Framework-agnostic core: SSE client, message parser, i18n, type definitions, CSS theme.

```ts
import { processSSEStream, parseHistoryMessages, setChatLanguage } from '@skillpet/chat-core';
import '@skillpet/chat-core/styles.css';
```

| Export | Kind | Description |
|--------|------|-------------|
| `processSSEStream` | Function | SSE stream processing |
| `parseHistoryMessages` | Function | History message parsing |
| `setChatLanguage` | Function | Switch i18n language |
| `chatI18n` | Object | i18next instance for advanced use |
| `cn` | Function | Tailwind class merge utility (clsx + tailwind-merge) |
| `SSE_STREAM_UI_DEFAULT_ZH` | Constant | Default Chinese UI strings for SSE |
| `SSE_STREAM_UI_DEFAULT_EN` | Constant | Default English UI strings for SSE |
| `PARSE_HISTORY_UI_DEFAULT_ZH` | Constant | Default Chinese UI strings for history parsing |
| `PARSE_HISTORY_UI_DEFAULT_EN` | Constant | Default English UI strings for history parsing |
| `styles.css` | CSS | Built-in brand theme + Tailwind component styles |
| All type definitions | Type | ChatMessage, ChatPanelConfig, SSECallbacks, etc. |

---

## SSE Event Protocol

The SSE stream expects the following event types from the server:

| Event | Data | Description |
|-------|------|-------------|
| `status` | `{ message: string }` | Status text update |
| `thinking` | `{ content: string }` | AI thinking token |
| `thinking_done` | `{}` | Thinking phase complete |
| `token` | `{ content: string }` | Response text token |
| `tool_start` | `{ id, name, label }` | Tool execution started |
| `tool_result` | `{ id, name, label, status, message, mode?, options? }` | Tool execution result |
| `ask_user` | `{ questions: AskUserQuestion[] }` | Structured user question |
| `consult_start` | `{ call_id, agent_name }` | Sub-agent started |
| `consult_token` | `{ call_id, content }` | Sub-agent response token |
| `consult_tool_start` | `{ call_id, name, label }` | Sub-agent tool started |
| `consult_tool_end` | `{ call_id, name, label, status, summary? }` | Sub-agent tool ended |
| `consult_end` | `{ call_id, agent_name, status }` | Sub-agent ended |
| `done` | `{}` | Stream complete |
| `error` | `{ message: string }` | Error occurred |

## Features

- SSE streaming with real-time AI thinking process and tool calls
- React & Vue 3 fully equivalent components
- Sub-agent (consult agent) multi-turn conversations
- Structured questions (ask_user) with form interaction
- Slash command palette
- Built-in 7 languages: zh-CN, zh-TW, en, ja, ko, es, fr
- Blue brand color default theme, dark/light mode
- CSS variables for full color customization
- UMD builds for CDN usage
