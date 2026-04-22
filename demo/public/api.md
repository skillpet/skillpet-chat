# @skillpet/chat API Reference

SSE streaming AI chat panel component library — React & Vue 3 dual-framework, i18n 7 languages, fully customizable.

## Related Docs

- **This document**: Frontend component API reference
- [Backend Integration Guide](https://chat.skill.pet/backend-guide.md): HTTP API spec, SSE event protocol, message storage schema, System Prompt best practices
- [llms.txt](https://chat.skill.pet/llms.txt): Document index for AI agents

## Links

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
        api: { baseUrl: '/api/chat' },
        getAccessToken: () => localStorage.getItem('token'),
      }}
    />
  );
}
```

> **v0.5**: `deleteConversationUrl` and `uploadUrl` are now returned by the server via `GET /init/{projectId}`. You only need `baseUrl`.

### Vue

```vue
<script setup lang="ts">
import { ChatPanel } from '@skillpet/chat-vue';
import '@skillpet/chat-core/styles.css';

const config = {
  api: { baseUrl: '/api/chat' },
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
| `onResourceUpdated` | `(key: string, snapshot?: Record<string, unknown>) => void` | No | Resource update event callback |
| `extraSlashCommands` | `SlashCommand[]` | No | Additional slash commands |
| `quickStarters` | `string[]` | No | Quick starter prompts for empty state |
| `emptyState` | `ChatPanelEmptyState` | No | Custom empty state icon, title, subtitle |
| `onUploadAttachment` | `(file: File) => Promise<ChatAttachment>` | No | Custom upload callback (takes priority over init uploadUrl) |
| `onDeleteAttachment` | `(attachmentId: string) => Promise<void>` | No | Custom delete callback (paired with `onUploadAttachment`) |
| `capVisibleOverride` | `string[]` | No | Override init capabilities visibility (replaces entirely when set) |
| `avatars` | `AvatarConfig` | No | Avatar overrides (takes priority over init-returned avatars) |
| `className` | `string` | No | CSS class for root element |
| `renderResource` | `(resource: ResourceBlock) => ReactNode \| null` | No | **v0.8** — Custom renderer for structured resource parts; see「结构化资源块」 |
| `autoSendAfterImageSelect` | `boolean \| string` | No | **v0.8** — After successful `POST /image-select/{projectId}`, auto-start a new SSE stream (see「结构化资源块」) |
| `readOnly` | `boolean` | No | **v0.9** — 只读模式，隐藏底部输入区和 quickStarter 按钮，仅展示消息流 |

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
| `onResourceUpdated` | `(key: string, snapshot?: Record<string, unknown>) => void` | No | Resource update callback |
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
| `handleSend` | `(messageOverride?: string, attachments?: ChatAttachment[], opts?: { suppressUserBubble?: boolean }) => Promise<void>` | Send message (optional attachments); **v0.8** `suppressUserBubble: true` omits the user bubble but still sends the HTTP request |
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
| `subAgentMap` | `Record<string, AgentInfo>` | Sub-agent metadata map (from init) |
| `attachmentCap` | `AttachmentCap \| null` | Attachment capability config (from init) |
| `agentInfo` | `AgentInfo \| null` | Main agent info (from init) |
| `userAvatarUrl` | `string \| undefined` | User avatar URL (from init) |
| `resetClearUrl` | `string \| undefined` | Reset conversation URL (from init) |
| `initError` | `string \| null` | Initialization error message |
| `retryInit` | `() => void` | Retry init request |
| `queuedSendEnabled` | `boolean` | 排队发送是否启用 |
| `maxQueueSize` | `number` | 队列最大消息数 |
| `messageQueue` | `QueuedMessage[]` | 当前排队中的消息列表 |
| `enqueueMessage` | `(content: string, attachments?: ChatAttachment[]) => boolean` | 将消息加入队列，返回是否成功 |
| `removeQueuedMessage` | `(id: string) => void` | 移除指定排队消息（同时清理附件） |
| `popQueuedMessage` | `(id: string) => QueuedMessage \| null` | 从队列中取出消息（不清理附件，用于编辑回填） |
| `reorderQueue` | `(fromIndex: number, toIndex: number) => void` | 拖拽排序：将队列中 fromIndex 位置的消息移到 toIndex |
| `clearQueue` | `() => void` | 清空队列 |
| `handleImageSelect` | `(blockId: string, selectedImageIds: string[], actionId?: string) => Promise<void>` | 提交图片块选择结果（见「图片生成」） |

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
| `api.baseUrl` | `string` | Yes | API base URL (used for `init`, `stream`, `tool-response`) |
| `api.deleteConversationUrl` | `string` | No | **@deprecated v0.5** — now returned by init `capabilities.reset.clearUrl`; kept as fallback |
| `api.uploadUrl` | `string` | No | **@deprecated v0.5** — now returned by init `capabilities.attachment.uploadUrl`; kept as fallback |
| `getAccessToken` | `() => string \| null \| Promise<string \| null>` | Yes | Get Bearer token |
| `accessToken` | `string \| null` | No | Token identifier |
| `lang` | `string` | No | Language code (zh-CN / en / ja / ...) |
| `components` | `ChatPanelComponents` | No | UI component toggles |
| `attachmentConfig` | `AttachmentConfig` | No | **@deprecated v0.5** — now returned by init `capabilities.attachment`; kept as fallback |
| `theme` | `ChatTheme` | No | Custom theme color overrides |

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

### ChatAttachment

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | Unique attachment identifier |
| `name` | `string` | Yes | Display file name |
| `size` | `number` | Yes | File size in bytes |
| `type` | `string` | Yes | MIME type |
| `url` | `string` | Yes | Upload URL (sent to backend) |
| `processedData` | `unknown` | No | Extra data returned by backend (e.g. OCR result) |
| `previewUrl` | `string` | No | Local preview URL (frontend-only, not sent to backend) |

### AttachmentConfig

> **@deprecated v0.5** — replaced by `AttachmentCap` (returned by init API). Kept as fallback during v0.5 transition.

| Field | Type | Description |
|-------|------|-------------|
| `maxFileSize` | `number` | Max file size in bytes (default: 10MB) |
| `maxCount` | `number` | Max number of simultaneous attachments (default: 5) |
| `accept` | `string` | MIME filter, e.g. `"image/*"` |

### ChatTheme

| Field | Type | Description |
|-------|------|-------------|
| `primaryColor` | `string` | Brand color (buttons, highlights), e.g. `"#7c3aed"` |
| `primaryForeground` | `string` | Text color on primary elements (default: white) |

### AvatarConfig

| Field | Type | Description |
|-------|------|-------------|
| `botAvatarUrl` | `string` | Main assistant bot avatar image URL |
| `userAvatarUrl` | `string` | User avatar image URL |
| `agentAvatarMap` | `Record<string, string>` | Sub-agent name → avatar image URL mapping |

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
| `imageGeneration` | `ImageGenerationBlock` | No | 图片生成块（独立 tool 消息或历史还原） |
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
| `onResourceUpdated` | `(key: string, snapshot?: Record<string, unknown>) => void` | No | Resource update callback |
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
| `errorPrefix` | `string` | 错误文案前缀（与 `message` 拼接展示） |

### ParseHistoryUiStrings

| Field | Type | Description |
|-------|------|-------------|
| `askUserErrorLabel` | `string` | Parse failure tool name |
| `askUserErrorMessage` | `string` | Parse failure hint |
| `awaitingUserMarker` | `string` | 历史消息中标记「等待用户」的占位文案 |

### MessagePart

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | `'text' \| 'tool' \| 'agent-text' \| 'agent-tools' \| 'image-generation' \| 'resource'` | Yes | Part type (**v0.8**: `'resource'` for structured resource blocks) |
| `content` | `string` | No | Text content |
| `thinking` | `string` | No | Thinking content |
| `toolResult` | `ToolInlineResult` | No | Tool inline result |
| `agentName` | `string` | No | Sub-agent name |
| `agentCallId` | `string` | No | Sub-agent call ID |
| `agentStatus` | `string` | No | Sub-agent status |
| `isAgentStreaming` | `boolean` | No | Whether sub-agent is streaming |
| `agentToolSteps` | `AgentToolStep[]` | No | Sub-agent tool steps |
| `preview` | `string` | No | Tool arguments preview |
| `agentId` | `string` | No | **v0.5** Sub-agent ID (use with `subAgentMap` for metadata lookup) |
| `agentAvatarUrl` | `string` | No | **@deprecated v0.5** — use `agentId` + `subAgentMap` instead |
| `imageGeneration` | `ImageGenerationBlock` | No | 图片生成块（`type === 'image-generation'` 时使用） |
| `resource` | `ResourceBlock` | No | **v0.8** — Structured resource payload（`type === 'resource'` 时使用） |

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

### AgentInfo (v0.5)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | Agent unique ID |
| `name` | `string` | Yes | Display name |
| `avatarUrl` | `string` | No | Avatar image URL |
| `description` | `string` | No | Description |

### CapToggle (v0.5)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `enabled` | `boolean` | Yes | Whether this capability is enabled |
| `defaultOn` | `boolean` | Yes | Whether it defaults to on |

### AttachmentCap (v0.5)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `enabled` | `boolean` | Yes | Whether attachment is enabled |
| `accept` | `string` | No | Allowed MIME types |
| `maxFileSize` | `number` | No | Max file size in bytes (default 10MB) |
| `maxCount` | `number` | No | Max simultaneous attachments (default 5) |
| `uploadUrl` | `string` | Yes | Upload endpoint (POST multipart/form-data) |
| `deleteUrl` | `string` | No | Delete URL template with `{attachmentId}` placeholder |

### ResetCap (v0.5)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `enabled` | `boolean` | Yes | Whether reset is enabled |
| `clearUrl` | `string` | Yes | DELETE URL template with `{projectId}` placeholder |

### QueuedSendCap (v0.6)

排队发送配置（由 init 接口返回）。

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `enabled` | `boolean` | Yes | 是否启用排队发送 |
| `maxQueueSize` | `number` | Yes | 队列最大消息数（建议 1~10） |

### QueuedMessage (v0.6)

队列中的待发送消息（客户端状态，不传给服务端）。

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | 唯一标识（用于删除和 UI key） |
| `content` | `string` | 消息文本内容 |
| `attachments` | `ChatAttachment[]` | 已上传的附件列表 |
| `createdAt` | `number` | 入队时间戳（ms） |

### InitCapabilities (v0.5)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `thinking` | `CapToggle` | Yes | Deep thinking capability |
| `search` | `CapToggle` | Yes | Web search capability |
| `imageGeneration` | `{ enabled: boolean }` | No | 图片生成能力开关（`enabled: false` 时前端隐藏相关 UI） |
| `attachment` | `AttachmentCap` | No | Attachment capability |
| `reset` | `ResetCap` | No | Reset conversation capability |
| `queuedSend` | `QueuedSendCap` | No | 排队发送配置；未提供或 `enabled: false` 时禁用排队 |

### ChatInitData (v0.5)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `agent` | `AgentInfo` | Yes | Main agent info |
| `capabilities` | `InitCapabilities` | Yes | All capabilities |
| `subAgents` | `AgentInfo[]` | No | Sub-agent list for metadata pre-loading |
| `userAvatarUrl` | `string` | No | Current user avatar URL |
| `messages` | `Array<{id, role, content}>` | No | Conversation history |

---

## 图片生成 (Image Generation)

### SSE 事件

#### `image_generating`

图片正在生成时推送，前端展示 loading 骨架屏。

```
event: image_generating
data: { "id": "img-gen-001", "prompt": "一只可爱的猫" }
```

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 图片生成块唯一 ID |
| prompt | string? | 生成提示词 |

#### `image_generation`

图片生成完成时推送。

```
event: image_generation
data: {
  "id": "img-gen-001",
  "prompt": "一只可爱的猫",
  "images": [
    { "id": "img-0", "url": "https://...", "thumbnailUrl": "https://...", "label": "方案 A", "width": 512, "height": 512 }
  ],
  "mode": "single_select",
  "minSelect": 1,
  "maxSelect": 1,
  "actions": [
    { "id": "regenerate", "label": "重新生成" },
    { "id": "download", "label": "下载" }
  ]
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 与 image_generating 的 id 对应 |
| prompt | string? | 生成提示词 |
| images | GeneratedImage[] | 生成的图片列表 |
| mode | "display" \| "single_select" \| "multi_select" | 展示模式 |
| minSelect | number? | 最少选择数（选择模式） |
| maxSelect | number? | 最多选择数（选择模式） |
| actions | ImageGenerationAction[]? | 操作按钮 |

Demo Mock 行为：`multi_select` 时下发 `minSelect: 1`、`maxSelect: 3`；`display` / `single_select` 时不带 `minSelect` / `maxSelect`。流式顺序为 `delta`（thinking → content）→ `image_generating` → 等待生成 → `image_generation` → `done`。

### 类型定义

```typescript
interface GeneratedImage {
  id: string;
  url: string;
  thumbnailUrl?: string;
  label?: string;
  width?: number;
  height?: number;
}

interface ImageGenerationAction {
  id: string;
  label: string;
  variant?: "default" | "destructive";
}

interface ImageGenerationBlock {
  id: string;
  prompt?: string;
  images: GeneratedImage[];
  mode: "display" | "single_select" | "multi_select";
  minSelect?: number;
  maxSelect?: number;
  actions?: ImageGenerationAction[];
  selectedImageIds?: string[];
  /** 客户端状态；SSE `image_generation` 事件可不包含，由前端写入 */
  status?: "generating" | "pending" | "selected" | "actioned";
}
```

### 展示模式

| 模式 | 说明 | 用户交互 |
|------|------|---------|
| display | 纯展示 | 点击放大预览 |
| single_select | 单选 | 选择一张后点确认 |
| multi_select | 多选 | 选择 min~max 张后点确认 |

### Hook / Composable 新增返回值

| 字段 | 类型 | 说明 |
|------|------|------|
| handleImageSelect | (blockId, selectedImageIds, actionId?) => Promise<void> | 提交图片选择结果 |

### POST `{baseUrl}/image-select/{projectId}`

客户端在用户确认选择或点击非 `download` 操作按钮时调用。请求体 JSON：

```json
{ "blockId": "img-gen-001", "selectedImageIds": ["img-0"], "actionId": "regenerate" }
```

- `actionId` 为 `download` 时前端不发送请求（由浏览器处理下载）。
- Demo Mock：`POST /api/mock-chat/image-select/{projectId}` 返回 `200` 与 `{ "success": true }`。

---

## 结构化资源块 (Resource Block)（v0.8）

宿主可通过 SSE `resource` 事件推送任意结构化 JSON，由 `renderResource` 自定义渲染；无自定义渲染时使用 `fallbackText` 降级展示。

### SSE 事件：`resource`

```
event: resource
data: {
  "resourceType": "characters",
  "data": [{"name": "叶无锋", "role": "protagonist"}, ...],
  "fallbackText": "已提取 3 个角色：叶无锋、苏婉儿、老管家"
}
```

### TypeScript 类型

```typescript
interface ResourceBlock {
  resourceType: string;  // 宿主自定义标识，如 "characters", "scenes"
  data: unknown;         // 任意 JSON，由宿主 renderResource 处理
  fallbackText?: string; // 无 renderResource 时的降级展示文本
}
```

### `MessagePart` 变更

- `MessagePart.type` 新增 `"resource"`。
- 当 `type === "resource"` 时，part 可携带 `resource?: ResourceBlock`（与 `text` / `image-generation` 等并列的片段字段）。

### `ChatPanel` 相关 props

| Prop | 类型 | 说明 |
|------|------|------|
| `renderResource` | `(resource: ResourceBlock) => ReactNode \| null` | 渲染资源块的回调；返回 `null` 或未传时显示 `fallbackText` |
| `autoSendAfterImageSelect` | `boolean \| string` | `POST /image-select/{projectId}` 成功后是否自动续接流式请求：`true` 时发送 `"__continue__"`；`string` 时发送自定义内容；均不显示用户气泡 |

### `handleSend` 签名（v0.8）

```typescript
handleSend(
  messageOverride?: string,
  attachments?: ChatAttachment[],
  opts?: { suppressUserBubble?: boolean }
): Promise<void>;
```

当 `opts.suppressUserBubble === true` 时，不在消息列表追加用户气泡，但仍照常发起 HTTP 流式请求（用于图片选择后的隐式续写等场景）。

---

## Server API Endpoints (v0.5)

### GET `{baseUrl}/init/{projectId}`

Unified initialization endpoint. Returns agent metadata, capabilities, sub-agents, and conversation history in a single request.

**Request:**
```
GET {baseUrl}/init/{projectId}
Authorization: Bearer <token>
```

**Response 200:** `ChatInitData` (see type definition above)

**Fallback:** If the server returns 404, the client automatically falls back to `GET {baseUrl}/history/{projectId}` (legacy format) and converts the response.

#### 排队发送（Queued Send）

当服务端在 init 响应中返回 `capabilities.queuedSend.enabled: true` 时，启用排队发送功能。

**行为**：

- 用户在 AI 流式回复期间可以继续输入并发送消息
- 这些消息加入 FIFO 队列，在当前 AI 回复结束后按序自动发送
- 每条排队消息触发一轮独立的 SSE 流
- 附件在入队时即完成上传，从队列删除消息时会清理对应附件

**队列交互**：

- **编辑**：点击队列项的铅笔图标，将该消息的内容和附件回填到输入框供修改（使用 `popQueuedMessage`，不会删除已上传的附件）
- **删除**：点击 × 按钮移除该消息并清理附件（使用 `removeQueuedMessage`）
- **拖拽排序**：通过左侧拖拽手柄（`GripVertical`）拖动队列项调整发送顺序（使用 `reorderQueue`）
- **拖放目标高亮**：拖拽过程中目标位置边框变为主题色

**附件输入方式**：

- 点击附件按钮选择文件
- 粘贴剪贴板中的图片（`Ctrl/Cmd+V`）
- 拖放文件到输入框区域（边框变色提示可放置）

**限制**：

- 队列最大容量由 `maxQueueSize` 控制
- 当存在 `ask_user` 或 `tool_result (awaiting_user)` 交互时，自动排空暂停
- 停止当前生成后，队列中的下一条消息将自动发送

### DELETE `{deleteUrl}`

Attachment deletion endpoint (fire-and-forget). Called when users manually remove an unsent attachment.

**URL:** Resolved from `ChatInitData.capabilities.attachment.deleteUrl` by replacing `{attachmentId}` placeholder.

**Response 200:**
```json
{ "success": true }
```

### DELETE `{clearUrl}`

Reset conversation endpoint. Called when users confirm conversation reset.

**URL:** Resolved from `ChatInitData.capabilities.reset.clearUrl` by replacing `{projectId}` placeholder.

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
| `resolveUrlTemplate` | Function | URL template resolver with placeholder replacement (v0.5) |
| `SSE_STREAM_UI_DEFAULT_ZH` | Constant | Default Chinese UI strings for SSE |
| `SSE_STREAM_UI_DEFAULT_EN` | Constant | Default English UI strings for SSE |
| `PARSE_HISTORY_UI_DEFAULT_ZH` | Constant | Default Chinese UI strings for history parsing |
| `PARSE_HISTORY_UI_DEFAULT_EN` | Constant | Default English UI strings for history parsing |
| `styles.css` | CSS | Built-in brand theme + Tailwind component styles |
| All type definitions | Type | ChatMessage, ChatPanelConfig, SSECallbacks, AgentInfo, ChatInitData, etc. |

---

## SSE Event Protocol

The SSE stream expects the following event types from the server:

| Event | Data | Description |
|-------|------|-------------|
| `status` | `{ message: string }` | Status text update |
| `thinking` | `{ content: string }` | AI thinking token |
| `thinking_done` | `{}` | Thinking phase complete |
| `token` | `{ content: string }` | Response text token |
| `delta` | `{ type: "thinking" \| "content", content: string }` | 增量片段（如图片生成前的思考/正文） |
| `image_generating` | `{ id: string, prompt?: string }` | 图片生成中（展示 loading） |
| `image_generation` | `{ id, prompt?, images, mode, minSelect?, maxSelect?, actions? }` | 图片生成完成（字段见「图片生成」） |
| `resource` | `{ resourceType, data, fallbackText? }` | **v0.8** 结构化资源块（见「结构化资源块」） |
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
