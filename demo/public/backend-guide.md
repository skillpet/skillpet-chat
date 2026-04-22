# @skillpet/chat 后端对接开发手册

> 本文档面向接入 `@skillpet/chat-react`（或 `@skillpet/chat-vue`）组件的后端开发者，详细说明组件期望的 HTTP 接口规范、SSE 事件协议、消息存储格式以及智能体系统提示词建议。
>
> 组件版本：`@skillpet/chat-core@0.8.0` / `@skillpet/chat-react@0.8.0`（v0.8 起支持 `resource` 事件与历史 `parts` 中的 resource 片段；v0.7 图片生成等能力仍适用）

## Related Docs

- **This document**: Backend HTTP API spec, SSE event protocol, message storage schema
- [Frontend API Reference](https://chat.skill.pet/api.md): Component API — types, props, hooks, queued send, attachment handling
- [llms.txt](https://chat.skill.pet/llms.txt): Document index for AI agents

---

## 1. 整体架构

```
┌──────────────────────────────────────────────────────────────┐
│  前端 ChatPanel 组件                                          │
│                                                              │
│  1. GET  {baseUrl}/init/{projectId}     → 初始化数据           │
│  2. POST {baseUrl}/stream               → SSE 流式对话        │
│  3. POST {baseUrl}/tool-response        → 交互工具选项回传     │
│  4. DELETE {clearUrl}                   → 清空对话历史         │
└──────────────────────┬───────────────────────────────────────┘
                       │ HTTP
┌──────────────────────▼───────────────────────────────────────┐
│  后端 API Server                                              │
│                                                              │
│  ┌─────────┐   ┌──────────────┐   ┌────────────────────────┐ │
│  │ Auth    │──▶│ Chat Router  │──▶│ LLM (OpenAI/自定义)    │ │
│  │ 中间件   │   │ (SSE 输出)   │   │ 流式 tokens + 工具调用  │ │
│  └─────────┘   └──────────────┘   └────────────────────────┘ │
│                       │                                      │
│                ┌──────▼──────┐                                │
│                │ 数据库/存储  │                                │
│                │ (会话+消息)  │                                │
│                └─────────────┘                                │
└──────────────────────────────────────────────────────────────┘
```

### 请求流程

1. 用户进入项目页，组件调用 `GET /init/{projectId}` 获取智能体信息、能力配置和历史消息
2. 用户发送消息，组件调用 `POST /stream`，后端返回 SSE 事件流
3. 若 AI 调用了交互式工具（带 `options` 的 `tool_result`），用户选择后组件调用 `POST /tool-response`
4. 若 AI 调用了 `ask_user` 工具，用户填写表单后组件将答案格式化为文本，再次调用 `POST /stream`
5. 用户点击重置按钮，组件调用 `DELETE {clearUrl}` 清空历史

---

## 2. API 端点规范

### 2.1 鉴权

所有请求在有 token 时携带 Header：

```
Authorization: Bearer <accessToken>
```

token 由 `ChatPanelConfig.getAccessToken()` 提供（支持同步/异步）。

---

### 2.2 GET `{baseUrl}/init/{projectId}`

返回项目的初始化数据，包括智能体信息、能力配置、子智能体列表和历史消息。

**响应 JSON — `ChatInitData`：**

```typescript
interface ChatInitData {
  agent: {
    id: string;           // 智能体标识
    name: string;         // 显示名称
    avatarUrl?: string;   // 头像 URL
    description?: string; // 简介
  };
  capabilities: {
    thinking: CapToggle;       // 深度思考
    search: CapToggle;         // 联网搜索
    imageGeneration?: {         // 图片生成能力（v0.7）
      enabled: boolean;
    };
    reset?: ResetCap;          // 清空对话
    attachment?: AttachmentCap; // 附件上传
    queuedSend?: QueuedSendCap; // 排队发送
  };
  subAgents?: AgentInfo[];      // 子智能体列表
  userAvatarUrl?: string;       // 用户头像
  messages?: HistoryMessage[];  // 历史消息
}

interface CapToggle {
  enabled: boolean;   // 是否启用（决定 UI 是否显示开关）
  defaultOn: boolean; // 默认是否开启
}

interface ResetCap {
  enabled: boolean;
  clearUrl: string;  // DELETE 地址，支持 {projectId} 占位符
}

interface AttachmentCap {
  enabled: boolean;
  accept?: string;       // 文件类型限制，如 "image/*,.pdf"
  maxFileSize?: number;  // 单文件最大字节数
  maxCount?: number;     // 最大附件数
  uploadUrl: string;     // POST FormData 上传地址
  deleteUrl?: string;    // DELETE 地址，支持 {attachmentId} 占位符
}

interface QueuedSendCap {
  enabled: boolean;
  maxQueueSize: number;
}

interface AgentInfo {
  id: string;   // 子智能体 code
  name: string; // 子智能体名称
}

interface HistoryMessage {
  id: string;
  role: string;   // "user" | "assistant" | "tool"
  content: string; // 存储格式，见第 4 节
}
```

**参考实现：**

```typescript
router.get('/init/:projectId', async (req, res) => {
  const project = await db.project.findUnique({ where: { id: req.params.projectId } });
  if (!project) return res.status(404).json({ error: 'NOT_FOUND' });

  const agent = await db.agent.findFirst({ where: { code: 'my-agent' } });

  const messages = project.conversationId
    ? await db.message.findMany({
        where: { conversationId: project.conversationId },
        orderBy: { createdAt: 'asc' },
      })
    : [];

  res.json({
    agent: {
      id: 'my-agent',
      name: agent?.name ?? 'AI 助手',
      ...(agent?.avatar ? { avatarUrl: agent.avatar } : {}),
      description: agent?.description || 'AI 助手',
    },
    capabilities: {
      thinking: { enabled: true, defaultOn: false },
      search: { enabled: true, defaultOn: false },
      imageGeneration: { enabled: true },
      reset: {
        enabled: true,
        clearUrl: '/api/projects/{projectId}/conversation',
      },
    },
    subAgents: [], // 如有子智能体则填入
    messages: messages.map(m => ({ id: m.id, role: m.role, content: m.content })),
  });
});
```

---

### 2.3 POST `{baseUrl}/stream`

发起流式对话，后端返回 SSE 事件流。

**请求 Body（JSON）：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `projectId` | string | 是 | 项目 ID |
| `message` | string | 是 | 用户消息（ask_user 提交时为格式化后的答案文本） |
| `enableThinking` | boolean | 否 | 是否启用深度思考 |
| `enableSearch` | boolean | 否 | 是否启用联网搜索 |
| `attachments` | array | 否 | 附件列表，每项 `{ id, name, size, type, url, processedData? }` |

**响应 Headers：**

```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
X-Accel-Buffering: no
```

**响应 Body**：SSE 事件流，格式见第 3 节。

**错误响应（非 SSE）：**

- `400 { error: 'MISSING_PARAMS' }` — 缺少必填参数
- `404 { error: 'NOT_FOUND' }` — 项目不存在
- `403 { error: 'FORBIDDEN' }` — 无权访问
- `500 { error: 'CHAT_FAILED', message: '...' }` — 内部错误（未开始 SSE 时）

**SSE 中的错误**：若已开始发送 SSE 事件后出错，应发送 `error` 事件后 `res.end()`。

---

### 2.4 POST `{baseUrl}/tool-response`

用户在交互式工具（`tool_result` 中 `status: "awaiting_user"` + `options`）中选择了选项后，组件调用此端点继续对话。

**请求 Body（JSON）：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `projectId` | string | 是 | 项目 ID |
| `toolCallId` | string | 是 | 原 `tool_result` 的 `id` |
| `toolName` | string | 是 | 原 `tool_result` 的 `name` |
| `optionId` | string | 是 | 用户选择的选项 ID |
| `enableThinking` | boolean | 否 | 是否启用深度思考 |
| `enableSearch` | boolean | 否 | 是否启用联网搜索 |

**响应**：同 `/stream`，返回 SSE 事件流。

> **注意**：`ask_user` 表单提交**不走** `/tool-response`。用户填写表单后，答案被格式化为自然语言字符串，通过 `POST /stream` 的 `message` 字段发送。

---

### 2.5 DELETE `{clearUrl}`

清空项目的对话历史。URL 由 `init` 返回的 `capabilities.reset.clearUrl` 决定，其中 `{projectId}` 会被组件自动替换为实际值。

**示例**：若 `clearUrl` 为 `/api/projects/{projectId}/conversation`，实际请求为 `DELETE /api/projects/abc123/conversation`。

**响应**：`200` 即可（组件只检查 `res.ok`）。

---

### 2.6 POST `{baseUrl}/image-select/{projectId}`（v0.7）

接收用户的图片选择结果。详见「3.7 图片生成事件」。

---

## 3. SSE 事件协议

### 3.1 传输格式

标准 Server-Sent Events 格式，每个事件由 `event:` 行 + `data:` 行 + 空行组成：

```
event: token
data: {"content":"你好"}

event: done
data: {"conversationId":"conv_123"}

```

`data` 行为**单行 JSON**（`JSON.stringify` 输出，不含换行）。

**发送工具函数示例：**

```typescript
function sendSSE(res: Response, event: string, data: unknown) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}
```

---

### 3.2 基础流事件

#### `token` — 文本片段

```json
{ "content": "你好，" }
```

AI 生成的文本内容，前端逐步拼接显示。

#### `thinking` — 思考过程片段

```json
{ "content": "让我分析一下用户的需求..." }
```

仅在 `enableThinking: true` 时发送。前端在折叠面板中展示思考过程。

#### `thinking_done` — 思考结束

```json
{}
```

标志思考阶段结束，后续 `token` 为正式回复。若未发送过 `thinking` 事件则无需发送此事件。

> **注意**：`@skillpet/chat-core@0.6.0` 的 SSE 解析器中**未处理**此事件（会被忽略），但后端仍建议发送以保持协议完整性，未来版本可能使用。

#### `status` — 状态提示

```json
{ "message": "正在查询知识库..." }
```

在聊天气泡中显示临时状态文本，下一个 `token` 到来时自动清除。

#### `round_start` — 新一轮工具循环

```json
{ "round": 2 }
```

当 AI 需要多轮工具调用时，在第 2 轮及以后发送。前端会将之前的文本/思考 flush 到消息的 `parts` 中。

---

### 3.3 工具事件

#### `tool_start` — 工具开始执行

```json
{
  "id": "call_abc123",
  "name": "search_knowledge",
  "label": "搜索知识库",
  "args": { "query": "..." }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 工具调用 ID（来自 LLM 的 tool_call_id） |
| `name` | string | 工具名称 |
| `label` | string | 工具中文显示名称 |
| `args` | object | 工具参数（可选，用于调试） |

若 `name` 为 `consult_agent`（委托子智能体），可额外包含：
- `agentId`: string — 子智能体 code
- `agentAvatarUrl`: string — 子智能体头像

> **`ask_user` 工具不发送 `tool_start`**，直接发送 `ask_user` 事件。

#### `tool_result` — 工具执行结果

**基本格式：**

```json
{
  "id": "call_abc123",
  "name": "search_knowledge",
  "label": "搜索知识库",
  "mode": "auto",
  "status": "completed",
  "message": "找到 3 条相关结果"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 对应 `tool_start` 的 `id` |
| `name` | string | 工具名称 |
| `label` | string | 工具中文显示名称 |
| `mode` | string | `"auto"` 自动执行 / `"interactive"` 需用户选择 / `"ask_user"` 表单 |
| `status` | string | `"completed"` / `"error"` / `"awaiting_user"` |
| `message` | string | 结果摘要或错误信息 |

**交互式工具**（`status: "awaiting_user"` + `options`）：

```json
{
  "id": "call_abc123",
  "name": "feasibility_decision",
  "label": "创意评估决策",
  "mode": "interactive",
  "status": "awaiting_user",
  "message": "请确认创意方向",
  "options": [
    { "id": "approve", "label": "确认可行", "description": "继续推进到设计阶段" },
    { "id": "revise", "label": "需要调整", "description": "返回讨论继续修改" }
  ]
}
```

用户选择后，前端调用 `POST /tool-response`。

#### `tool_args_heartbeat` — 工具参数生成中

```json
{ "status": "generating_tool_args" }
```

当 LLM 正在生成工具调用参数（较长时间）时发送，前端显示"准备工具..."提示。

---

### 3.4 ask_user 表单事件

#### `ask_user` — 向用户提问

```json
{
  "questions": [
    {
      "id": "genre",
      "prompt": "你的故事是什么题材？",
      "options": [
        { "id": "fantasy", "label": "玄幻/修仙" },
        { "id": "scifi", "label": "科幻/未来" },
        { "id": "urban", "label": "都市/现实" },
        { "id": "other", "label": "其他" }
      ],
      "allowFreeText": true,
      "freeTextPlaceholder": "输入其他题材..."
    },
    {
      "id": "length",
      "prompt": "目标篇幅",
      "options": [
        { "id": "short", "label": "短篇 5-10万字" },
        { "id": "medium", "label": "中篇 30-50万字" },
        { "id": "long", "label": "长篇 100万字+" }
      ]
    }
  ]
}
```

**`AskUserQuestion` 结构：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `id` | string | 是 | 问题唯一标识 |
| `prompt` | string | 是 | 问题文本 |
| `options` | `{ id: string, label: string }[]` | 条件必填 | 选项列表（`allowFreeText` 为 false 时必须非空） |
| `allowMultiple` | boolean | 否 | 是否允许多选（默认 false） |
| `allowFreeText` | boolean | 否 | 是否显示自由文本输入框（默认 false） |
| `freeTextPlaceholder` | string | 否 | 文本输入框占位符 |

**前端归一化兼容**：组件会容错处理以下别名字段：
- `prompt` ← `prompt` / `question` / `text` / `title`
- `options` ← `options` / `choices`
- 选项可以是纯字符串数组：`["玄幻", "科幻"]` → 自动生成 `{ id: "opt-0", label: "玄幻" }`
- 选项对象的 `label` ← `label` / `text` / `name` / `title`
- 选项对象的 `id` ← `id` / `value` / 自动生成
- `allowFreeText` ← `allowFreeText` / `allow_free_text` / `freeText`
- `allowMultiple` ← `allowMultiple` / `allow_multiple`
- `freeTextPlaceholder` ← `freeTextPlaceholder` / `free_text_placeholder`

**用户提交流程**：用户填写表单后，答案被格式化为自然语言字符串（如 `"题材方向：玄幻/修仙\n目标篇幅：短篇 5-10万字"`），作为 `POST /stream` 的 `message` 发送。

**存储约定**：`ask_user` 的 tool 消息应以 `[ask_user] ` 为前缀存储 questions JSON，以便历史解析还原（见第 4 节）。

---

### 3.5 子智能体事件

当主智能体委托子智能体（如 `consult_agent`）执行任务时，使用以下事件传递子智能体的流式输出。

#### `agent_thinking` — 子智能体思考

```json
{
  "id": "call_abc123",
  "t": "让我分析一下...",
  "agentName": "创意分析师",
  "agentId": "story-analyst"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 子智能体调用 ID（与 `tool_start` 中 `consult_agent` 的 `id` 对应） |
| `t` | string | 思考文本片段（**注意：字段名是 `t`，不是 `content`**） |
| `agentName` | string | 子智能体名称 |
| `agentId` | string | 子智能体 code |

#### `agent_token` — 子智能体文本片段

```json
{
  "id": "call_abc123",
  "t": "经过分析，",
  "agentName": "创意分析师",
  "agentId": "story-analyst"
}
```

字段同 `agent_thinking`。当 `status` 为 `"generating_tool_args"` 时可附加 `preview` 字段。

#### `agent_tool_start` — 子智能体开始调用工具

```json
{
  "parentId": "call_abc123",
  "name": "save_feasibility_report",
  "label": "保存分析报告"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `parentId` | string | 父级子智能体调用 ID |
| `name` | string | 工具名称 |
| `label` | string | 工具中文显示名称 |

#### `agent_tool_result` — 子智能体工具执行结果

```json
{
  "parentId": "call_abc123",
  "name": "save_feasibility_report",
  "summary": "报告已保存",
  "status": "completed"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `parentId` | string | 父级子智能体调用 ID |
| `name` | string | 工具名称 |
| `summary` | string | 结果摘要 |
| `status` | string | `"completed"` / `"error"` |

#### `agent_round` — 子智能体新一轮（可选）

```json
{ "id": "call_abc123" }
```

子智能体多轮工具循环时发送，作用类似主流程的 `round_start`。

---

### 3.6 控制事件

#### `resource_updated` — 资源变更通知

```json
{
  "key": "bookPlan",
  "snapshot": {
    "status": "planning",
    "bookTitle": "星辰诀",
    "proposal": { "bookPlan": "..." }
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `key` | string | 变更的资源标识（业务自定义，如 `"status"`、`"bookPlan"`、`"units"` 等） |
| `snapshot` | object? | 变更后的资源快照（可选） |

前端通过 `ChatPanel` 的 `onResourceUpdated` 回调接收此事件，用于实时刷新侧边栏等 UI。

#### `done` — 对话完成

```json
{ "conversationId": "conv_abc123" }
```

**必须在 SSE 流结束前发送**。前端据此结束流式状态并触发 `onStatusChange` 回调。

#### `error` — 错误

```json
{ "message": "与 AI 模型的网络连接中断，请稍后重试" }
```

在 SSE 流中发送错误信息。发送后应调用 `res.end()` 结束流。

---

### 3.7 图片生成事件（v0.7）

当后端需要向用户展示 AI 生成的图片时，使用以下两个事件：

#### `image_generating`

图片正在生成时推送，前端展示加载骨架屏。

```typescript
sendSSE(res, 'image_generating', {
  id: 'img-gen-001',          // 图片生成块唯一 ID
  prompt: '一只可爱的猫',      // 可选：生成提示词
});
```

#### `image_generation`

图片生成完成时推送。`id` 需与 `image_generating` 的 `id` 匹配，前端会自动替换骨架屏。

```typescript
sendSSE(res, 'image_generation', {
  id: 'img-gen-001',
  prompt: '一只可爱的猫',
  images: [
    {
      id: 'img-0',
      url: 'https://cdn.example.com/full/img-0.png',
      thumbnailUrl: 'https://cdn.example.com/thumb/img-0.png',  // 可选
      label: '方案 A',     // 可选：图片标签
      width: 512,          // 可选
      height: 512,         // 可选
    },
    // ... 更多图片
  ],
  mode: 'single_select',  // 'display' | 'single_select' | 'multi_select'
  minSelect: 1,           // 仅选择模式，最少选择数
  maxSelect: 1,           // 仅选择模式，最多选择数
  actions: [              // 可选：操作按钮
    { id: 'regenerate', label: '重新生成' },
    { id: 'download', label: '下载', variant: 'default' },
  ],
});
```

**展示模式说明**：

| mode | 说明 | 用户交互 |
|------|------|---------|
| `display` | 纯展示 | 点击放大预览，无需用户选择 |
| `single_select` | 单选 | 用户选择一张后点击确认 |
| `multi_select` | 多选 | 用户选择 min~max 张后点击确认 |

- `display` 模式不需要 `minSelect` / `maxSelect` / `actions`
- 选择模式下用户确认后，前端会 POST 选择结果到 `{baseUrl}/image-select/{projectId}`

**流式顺序**：`delta`（thinking → content）→ `image_generating` → 等待生成 → `image_generation` → `done`

#### POST `{baseUrl}/image-select/{projectId}`

用户在图片选择模式下确认选择后，前端发送：

```
POST {baseUrl}/image-select/{projectId}
Content-Type: application/json
Authorization: Bearer <token>

{
  "blockId": "img-gen-001",
  "selectedImageIds": ["img-0", "img-2"],
  "actionId": "regenerate"    // 可选：用户点击的操作按钮 ID
}
```

- `actionId` 为 `download` 时前端不会发送请求（由浏览器处理下载）
- 后端应返回 `200` 和 `{ "success": true }`

#### 历史消息存储

图片生成消息建议以 `role: "tool"` 存储，body 前缀 `[image_generation]`：

```json
{
  "role": "tool",
  "content": "[image_generation] {\"id\":\"img-gen-001\",\"prompt\":\"一只可爱的猫\",\"images\":[...],\"mode\":\"single_select\",\"status\":\"selected\",\"selectedImageIds\":[\"img-0\"]}"
}
```

前端 `parseHistoryMessages` 会自动识别该格式并还原为图片展示 UI。

---

### 3.8 结构化资源事件 `resource`（v0.8）

后端可在 AI 正文流的任意位置推送 `resource` 事件；前后均可夹杂 `token` / `delta` 等事件。前端将其作为**当前 assistant 消息**中的一个 `resource` **part** 插入，**不产生**新的 `tool` 消息。

**SSE 示例：**

```
event: resource
data: {"resourceType":"characters","data":[{"name":"叶无锋","role":"protagonist"}],"fallbackText":"已提取 3 个角色：叶无锋、苏婉儿、老管家"}
```

#### 历史存储格式（方案 A）

存储 assistant 消息时，若同一条消息需保留文本与 resource 的先后顺序，在 `_pub_asst` JSON 中补充 `parts` 数组（与仅 `text` 字段并存时，以 `parts` 为准还原多段内容）：

```json
{
  "_t": "_pub_asst",
  "text": "最后一段文字",
  "parts": [
    { "type": "text", "content": "已从故事中提取了 3 个角色：" },
    {
      "type": "resource",
      "resource": {
        "resourceType": "characters",
        "data": [{"name": "叶无锋", "role": "protagonist"}, ...],
        "fallbackText": "已提取 3 个角色：叶无锋、苏婉儿、老管家"
      }
    },
    { "type": "text", "content": "每个角色的性格和背景已整理完毕。" }
  ]
}
```

前端 `parseHistoryMessages` 会识别 `parts` 并还原为带 `resource` 片段的 assistant 消息。

#### 前端展示与降级

- 若宿主未传入 `renderResource`（或回调返回 `null`），UI 显示 `fallbackText`。
- 若 `fallbackText` 也为空，前端**静默跳过**该 resource 片段（不占位报错）。

#### `autoSendAfterImageSelect` 与续写流

当宿主为 `ChatPanel` 配置 `autoSendAfterImageSelect` 时：`POST {baseUrl}/image-select/{projectId}` 成功返回后，前端会**自动再发起一轮** `POST /stream` 的 SSE 请求，且**不展示用户气泡**（`suppressUserBubble`）。`true` 时消息体为 `"__continue__"`，为 `string` 时为自定义续写提示。后端应据此继续下一轮生成（例如结合已选图片 ID 与会话上下文）。

---

### 3.9 事件发送顺序参考

一次典型的对话 SSE 流：

```
event: thinking
data: {"content":"让我思考一下..."}

event: thinking
data: {"content":"用户想要写一个玄幻故事"}

event: thinking_done
data: {}

event: token
data: {"content":"你好！"}

event: token
data: {"content":"让我了解一下你的创作意图。"}

event: ask_user
data: {"questions":[{"id":"genre","prompt":"题材方向","options":[...]}]}

event: done
data: {"conversationId":"conv_123"}
```

带工具调用的流：

```
event: token
data: {"content":"让我帮你分析一下。"}

event: tool_start
data: {"id":"call_1","name":"consult_agent","label":"委托分析师","agentId":"story-analyst"}

event: agent_thinking
data: {"id":"call_1","t":"分析中...","agentName":"创意分析师","agentId":"story-analyst"}

event: agent_token
data: {"id":"call_1","t":"分析结果如下...","agentName":"创意分析师","agentId":"story-analyst"}

event: agent_tool_start
data: {"parentId":"call_1","name":"save_report","label":"保存报告"}

event: agent_tool_result
data: {"parentId":"call_1","name":"save_report","summary":"已保存","status":"completed"}

event: tool_result
data: {"id":"call_1","name":"consult_agent","label":"委托分析师","mode":"auto","status":"completed","message":"分析已完成"}

event: resource_updated
data: {"key":"feasibility","snapshot":{...}}

event: token
data: {"content":"分析报告已完成，请查看。"}

event: done
data: {"conversationId":"conv_123"}
```

---

## 4. 消息存储与历史解析

组件通过 `init` 接口获取原始消息后，使用 `parseHistoryMessages` 解析。后端需按以下约定存储消息，以确保历史正确还原。

### 4.1 标记常量

```typescript
const ASST_MARKER = '_pub_asst'; // assistant 消息标记
const TOOL_MARKER = '_pub_tool'; // tool 消息标记
```

### 4.2 Assistant 消息

存储格式：

```json
{
  "_t": "_pub_asst",
  "text": "你好！让我了解一下你的创作意图。",
  "tool_calls": [...]
}
```

- `_t` 必须为 `"_pub_asst"`
- `text` 为用户可见的文本内容
- `tool_calls` 存储 LLM 返回的工具调用（用于后续上下文）

解析逻辑：检测到 `_t === "_pub_asst"` 时提取 `text` 字段作为显示内容；否则整段 `content` 当纯文本。

### 4.3 Tool 消息

存储格式：

```json
{
  "_t": "_pub_tool",
  "toolCallId": "call_abc123",
  "body": "搜索结果：找到 3 条..."
}
```

- `_t` 必须为 `"_pub_tool"`
- `toolCallId` 对应工具调用 ID
- `body` 为工具执行结果文本

### 4.4 ask_user 消息的特殊存储

当工具为 `ask_user` 时，`body` 必须以 `[ask_user] ` 为前缀，后跟 questions 的 JSON：

```json
{
  "_t": "_pub_tool",
  "toolCallId": "call_abc123",
  "body": "[ask_user] [{\"id\":\"genre\",\"prompt\":\"题材方向\",\"options\":[...]}]"
}
```

解析逻辑：
1. 检测到 `body` 以 `[ask_user]` 开头
2. 去掉前缀后 `JSON.parse` 得到 `questions` 数组
3. 渲染为 `askUser: { questions, status: "answered" }`（历史消息固定为 `answered` 状态）

### 4.5 交互式工具的存储

带 `options` 的工具结果：`body` 以 `[等待用户选择] ` 为前缀，后跟描述文本。

---

## 5. normalizeAskUserQuestions 参考实现

后端在发送 `ask_user` SSE 事件前，建议对 LLM 返回的 questions 进行规范化处理（LLM 可能输出不规范的字段名）：

```typescript
interface NormalizedQuestion {
  id: string;
  prompt: string;
  options: Array<{ id: string; label: string }>;
  allowMultiple?: boolean;
  allowFreeText?: boolean;
  freeTextPlaceholder?: string;
}

function normalizeAskUserQuestions(raw: unknown[]): NormalizedQuestion[] {
  const result: NormalizedQuestion[] = [];
  for (let i = 0; i < raw.length; i++) {
    const q = raw[i] as Record<string, unknown>;
    if (!q || typeof q !== 'object') continue;

    const prompt = String(q.prompt || q.question || q.text || q.title || '');
    if (!prompt) continue;

    const id = String(q.id || `q-${i}`);
    const allowFreeText = !!(q.allowFreeText || q.allow_free_text || q.freeText);

    let rawOpts = (q.options || q.choices || []) as unknown[];
    if (!Array.isArray(rawOpts)) rawOpts = [];

    const options = rawOpts
      .map((o, j) => {
        if (typeof o === 'string') return { id: `opt-${j}`, label: o };
        if (o && typeof o === 'object') {
          const obj = o as Record<string, unknown>;
          const label = String(obj.label || obj.text || obj.name || obj.title || '');
          return label ? { id: String(obj.id || obj.value || `opt-${j}`), label } : null;
        }
        return null;
      })
      .filter((o): o is { id: string; label: string } => o !== null);

    // 无选项且不允许自由输入 → 跳过
    if (options.length === 0 && !allowFreeText) continue;

    result.push({
      id,
      prompt,
      options,
      ...(q.allowMultiple || q.allow_multiple ? { allowMultiple: true } : {}),
      ...(allowFreeText ? { allowFreeText: true } : {}),
      ...(q.freeTextPlaceholder || q.free_text_placeholder
        ? { freeTextPlaceholder: String(q.freeTextPlaceholder || q.free_text_placeholder) }
        : {}),
    });
  }
  return result;
}
```

---

## 6. ask_user 工具定义（LLM Function Calling）

提供给 LLM 的工具定义 JSON Schema：

```json
{
  "type": "function",
  "function": {
    "name": "ask_user",
    "description": "当需要用户做出选择或回答问题时，必须调用此工具渲染可交互的表单 UI。支持单选、多选和自由文本输入。绝对禁止在对话文本中用 A/B/C/D 编号列表代替此工具！即使只有一个问题也必须调用。可以一次提交多个问题。",
    "parameters": {
      "type": "object",
      "properties": {
        "questions": {
          "type": "array",
          "description": "问题列表",
          "items": {
            "type": "object",
            "properties": {
              "id": { "type": "string", "description": "问题唯一 ID" },
              "prompt": { "type": "string", "description": "问题文本" },
              "options": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "id": { "type": "string", "description": "选项 ID" },
                    "label": { "type": "string", "description": "选项文本" }
                  },
                  "required": ["id", "label"]
                },
                "description": "可选选项列表"
              },
              "allowMultiple": { "type": "boolean", "description": "是否允许多选，默认 false" },
              "allowFreeText": { "type": "boolean", "description": "是否允许自由文本输入，默认 false" },
              "freeTextPlaceholder": { "type": "string", "description": "自由输入占位符文本" }
            },
            "required": ["id", "prompt"]
          }
        }
      },
      "required": ["questions"]
    }
  }
}
```

后端处理 `ask_user` 的流程：
1. LLM 返回 `ask_user` 工具调用
2. 提取 `questions` 参数，经 `normalizeAskUserQuestions` 规范化
3. 发送 `ask_user` SSE 事件（**不发** `tool_start`）
4. 将结果存储为 `[ask_user] JSON` 格式
5. 终止当前 SSE 流（发送 `done` 并 `res.end()`）
6. 等待用户提交后的 `POST /stream` 继续对话

---

## 7. 智能体系统提示词建议

基于 Taly 项目的实战经验，以下是让 AI 正确使用 `ask_user` 工具的提示词模板和最佳实践。

### 7.1 工具调用规范（建议放入 System Prompt）

```
## 工具调用规范（最高优先级）

你**必须**在需要时真正执行系统提供的工具——但不要在对话文本中提及工具名。

- **任何时候向用户提问或需要用户做选择，都必须调用 ask_user 工具渲染表单**。
  绝对禁止在对话文本中用列表、编号或问句代替！包括但不限于：追问创意细节、
  确认设定方向、选择角色身份、选择系统类型、确认核心冲突等。
  即使只有一个问题也必须走表单。

- **每个问题必须包含 options 选项数组（至少 3 个常见选项）**，同时设置
  allowFreeText=true 让用户补充。禁止发送 options 为空的纯文本问题！

- **禁止在文本中提问后等待用户回复**。只要需要用户输入信息，就必须调用
  ask_user。你的文本消息只用于总结、确认和引导，不用于提问。
```

### 7.2 关键经验总结

#### 问题：AI 在文本中用列表提问

**症状**：AI 输出"你更喜欢哪种风格？A. 热血 B. 轻松 C. 暗黑"，没有调用 `ask_user`。

**解决**：在 System Prompt 中反复强调以下约束：
1. "绝对禁止在对话文本中用 A/B/C/D 列表或编号列表代替"
2. "你的文本消息只用于总结、确认和引导，不用于提问"
3. "任何时候向用户提问都必须调用 ask_user"

#### 问题：AI 发送 options 为空的纯文本问题

**症状**：`ask_user` 表单只有一个文本输入框，没有选项按钮。

**解决**：
1. 提示词中明确要求 "每个问题必须包含 options 选项数组（至少 3 个常见选项）"
2. 后端 `normalizeAskUserQuestions` 在 `options.length === 0 && !allowFreeText` 时过滤掉该问题
3. 如果可能，在提示词中给出具体的选项示例

#### 问题：AI 不知道何时该用表单

**症状**：AI 知道有 `ask_user` 工具但不主动使用。

**解决**：在阶段性指令中明确列出需要用表单的场景，并给出具体的问题和选项模板。例如：

```
当项目处于 draft 状态时，你必须通过 ask_user 工具一次性提出 5 个结构化问题：
1. 题材方向 — options: ["玄幻/修仙", "科幻/未来", "都市/现实", "穿越/重生", "其他"]
2. 叙事基调 — options: ["热血爽文", "沉稳厚重", "悬疑烧脑", "轻松幽默", "其他"]
3. 目标篇幅 — options: ["短篇 5-10万字", "中篇 30-50万字", "长篇 100万字+"]
...
```

### 7.3 子智能体协作提示词模板

若使用子智能体（通过 `consult_agent` 工具委托），建议在总监智能体的 System Prompt 中说明协作规范：

```
## 子智能体协作

编写、可行性分析、架构设计等专业任务须通过委托子智能体完成；
你负责编排与确认，不代替子智能体直接执行其专属工具链。

委托时需要在 question 参数中明确传达用户已确认的信息，
如：「用户已选定书名为「xxx」，主角姓名为「xxx」」。
```

### 7.4 提示词架构建议

推荐将提示词分为两层：

| 层级 | 存储位置 | 内容 | 特点 |
|------|---------|------|------|
| **基础人设** | 数据库（智能体 systemPrompt） | 角色定义、核心能力、工具调用规范、工作流程、各阶段行为规范 | 稳定，通过后台可编辑 |
| **动态上下文** | 代码中拼接 | 当前项目信息、阶段指令提醒、资源摘要、子智能体列表 | 每次请求动态构建 |

最终发送给 LLM 的 system message：

```
{数据库 systemPrompt} + {动态项目上下文} + {子智能体列表}
```

---

## 8. 完整端点实现模板

以下是一个最小可运行的后端模板（Express + TypeScript），展示核心流程：

```typescript
import express from 'express';

const router = express.Router();

// --- 工具函数 ---

function sendSSE(res: express.Response, event: string, data: unknown) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

// --- 路由 ---

// 初始化
router.get('/init/:projectId', async (req, res) => {
  const { projectId } = req.params;
  // 1. 查询项目、验证权限
  // 2. 查询智能体配置
  // 3. 查询历史消息

  res.json({
    agent: { id: 'my-agent', name: 'AI 助手' },
    capabilities: {
      thinking: { enabled: true, defaultOn: false },
      search: { enabled: false, defaultOn: false },
      imageGeneration: { enabled: true },
      reset: { enabled: true, clearUrl: '/api/projects/{projectId}/conversation' },
    },
    messages: [], // { id, role, content }[]
  });
});

// 流式对话
router.post('/stream', async (req, res) => {
  const { projectId, message, enableThinking, enableSearch } = req.body;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  try {
    // 1. 构建 system prompt + 历史消息
    // 2. 调用 LLM 流式 API
    // 3. 逐 chunk 解析并发送 SSE 事件

    // 示例：发送思考 → 文本 → ask_user → done
    if (enableThinking) {
      sendSSE(res, 'thinking', { content: '让我思考...' });
      sendSSE(res, 'thinking_done', {});
    }

    sendSSE(res, 'token', { content: '你好！请告诉我你的需求。' });

    // 若 LLM 调用了 ask_user 工具
    sendSSE(res, 'ask_user', {
      questions: [
        {
          id: 'genre',
          prompt: '你想创作什么题材的故事？',
          options: [
            { id: 'fantasy', label: '玄幻/修仙' },
            { id: 'scifi', label: '科幻/未来' },
            { id: 'urban', label: '都市/现实' },
          ],
          allowFreeText: true,
          freeTextPlaceholder: '输入其他题材...',
        },
      ],
    });

    sendSSE(res, 'done', { conversationId: 'conv_123' });
    res.end();
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ error: 'CHAT_FAILED' });
    } else {
      sendSSE(res, 'error', { message: '服务异常，请稍后重试' });
      res.end();
    }
  }
});

// 工具响应
router.post('/tool-response', async (req, res) => {
  const { projectId, toolCallId, toolName, optionId, enableThinking, enableSearch } = req.body;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  try {
    // 1. 根据 toolName + optionId 处理业务逻辑
    // 2. 将结果作为 tool message 追加到历史
    // 3. 继续调用 LLM 并返回 SSE 流

    sendSSE(res, 'token', { content: '已收到你的选择，继续推进...' });
    sendSSE(res, 'done', { conversationId: 'conv_123' });
    res.end();
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ error: 'TOOL_RESPONSE_FAILED' });
    } else {
      sendSSE(res, 'error', { message: '操作失败' });
      res.end();
    }
  }
});

export default router;
```

---

## 附录：SSE 事件速查表

| 事件名 | data 关键字段 | 说明 |
|--------|-------------|------|
| `token` | `content: string` | 文本片段 |
| `thinking` | `content: string` | 思考片段 |
| `thinking_done` | `{}` | 思考结束 |
| `status` | `message: string` | 状态提示 |
| `round_start` | `{ round: number }` | 新一轮工具循环 |
| `tool_start` | `id, name, label` | 工具开始 |
| `tool_result` | `id, name, label, mode, status, message, options?` | 工具结果 |
| `tool_args_heartbeat` | `{ status: "generating_tool_args" }` | 工具参数生成中 |
| `ask_user` | `{ questions: AskUserQuestion[] }` | 表单提问 |
| `agent_thinking` | `id, t, agentName, agentId` | 子智能体思考 |
| `agent_token` | `id, t, agentName, agentId` | 子智能体文本 |
| `agent_tool_start` | `parentId, name, label` | 子智能体工具开始 |
| `agent_tool_result` | `parentId, name, summary, status` | 子智能体工具结果 |
| `agent_round` | `{ id: string }` | 子智能体新一轮 |
| `resource_updated` | `key: string, snapshot?: object` | 资源变更 |
| `image_generating` | `id, prompt?` | 图片生成中（v0.7） |
| `image_generation` | `id, prompt?, images, mode, minSelect?, maxSelect?, actions?` | 图片生成完成（v0.7） |
| `resource` | `resourceType, data, fallbackText?` | 结构化资源块（v0.8），插入 assistant `parts` |
| `done` | `{ conversationId: string }` | 对话完成 |
| `error` | `{ message: string }` | 错误 |

---

### readOnly 模式（v0.9+）

设置 `readOnly` prop 后，`<ChatPanel>` 只渲染消息流，不渲染输入框、quickStarter 按钮和排队区。
宿主通过 `handleSend(payload, undefined, { suppressUserBubble: true })` 程序化启动流程。

适用场景：工作流运行态进度展示、历史回放、只读访客视图。
后端接口无需变更，`readOnly` 为纯前端展示控制。
