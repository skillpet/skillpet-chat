import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowUp } from "lucide-react";

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="scroll-mt-20 text-xl font-bold text-foreground border-b border-border pb-2 mb-4">
      {children}
    </h2>
  );
}

function SubHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h3 id={id} className="scroll-mt-20 text-base font-semibold text-foreground mt-6 mb-3">
      {children}
    </h3>
  );
}

function Badge({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "required" | "optional" }) {
  const cls =
    variant === "required"
      ? "bg-primary/10 text-primary border-primary/20"
      : variant === "optional"
        ? "bg-muted text-muted-foreground border-border"
        : "bg-primary/10 text-primary border-primary/20";
  return (
    <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${cls}`}>
      {children}
    </span>
  );
}

function TypeTag({ children }: { children: React.ReactNode }) {
  return <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground/80">{children}</code>;
}

function PropTable({ rows }: { rows: { name: string; type: string; required?: boolean; desc: string }[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border mb-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="px-3 py-2 text-left font-medium text-foreground">字段</th>
            <th className="px-3 py-2 text-left font-medium text-foreground">类型</th>
            <th className="px-3 py-2 text-left font-medium text-foreground">必选</th>
            <th className="px-3 py-2 text-left font-medium text-foreground">说明</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name} className="border-b border-border/50 last:border-0">
              <td className="px-3 py-2 font-mono text-xs text-primary">{r.name}</td>
              <td className="px-3 py-2"><TypeTag>{r.type}</TypeTag></td>
              <td className="px-3 py-2">
                {r.required
                  ? <Badge variant="required">required</Badge>
                  : <Badge variant="optional">optional</Badge>}
              </td>
              <td className="px-3 py-2 text-muted-foreground text-xs">{r.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ExportList({ items }: { items: { name: string; kind: string; desc: string }[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border mb-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="px-3 py-2 text-left font-medium text-foreground">导出名</th>
            <th className="px-3 py-2 text-left font-medium text-foreground">类别</th>
            <th className="px-3 py-2 text-left font-medium text-foreground">说明</th>
          </tr>
        </thead>
        <tbody>
          {items.map((r) => (
            <tr key={r.name} className="border-b border-border/50 last:border-0">
              <td className="px-3 py-2 font-mono text-xs text-primary">{r.name}</td>
              <td className="px-3 py-2"><Badge>{r.kind}</Badge></td>
              <td className="px-3 py-2 text-muted-foreground text-xs">{r.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="rounded-lg border border-border bg-muted/30 p-3 text-xs font-mono text-foreground overflow-x-auto mb-4">
      <code>{children}</code>
    </pre>
  );
}

const TOC = [
  { id: "install", label: "安装" },
  { id: "quick-start", label: "快速开始" },
  { id: "layer-1", label: "Layer 1: 开箱即用" },
  { id: "layer-2", label: "Layer 2: 自定义组合" },
  { id: "layer-3", label: "Layer 3: 底层原语" },
  { id: "types", label: "类型定义" },
  { id: "vue-entry", label: "Vue 入口" },
  { id: "core-entry", label: "Core 入口" },
];

export default function ApiDocPage() {
  useEffect(() => {
    if (window.location.hash) {
      const el = document.getElementById(window.location.hash.slice(1));
      el?.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      {/* 侧边目录 */}
      <aside className="hidden lg:flex w-48 shrink-0 flex-col border-r border-border bg-card/50 p-4 overflow-y-auto">
        <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">目录</p>
        <nav className="flex flex-col gap-1">
          {TOC.map((t) => (
            <a
              key={t.id}
              href={`#${t.id}`}
              className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              {t.label}
            </a>
          ))}
        </nav>
      </aside>

      {/* 主内容 */}
      <main className="flex-1 overflow-y-auto p-6 sm:p-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">API 接口文档</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground/80">@skillpet/chat-react</code> — React 入口完整参考，Vue 与 Core 入口简要索引。
          </p>
          <p className="mt-2 inline-flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            <span>AI / 机器可读版本：</span>
            <a href="/api.md" target="_blank" className="font-mono text-primary hover:underline">/api.md</a>
            <span className="text-border">|</span>
            <a href="/llms.txt" target="_blank" className="font-mono text-primary hover:underline">/llms.txt</a>
          </p>
        </div>

        {/* ── 安装 ── */}
        <SectionHeading id="install">安装</SectionHeading>
        <CodeBlock>{`# React 项目（自动安装 core + 渲染依赖）
npm install @skillpet/chat-react

# Vue 项目（自动安装 core + 渲染依赖）
npm install @skillpet/chat-vue

# 仅 Core（框架无关：SSE、i18n、类型）
npm install @skillpet/chat-core`}</CodeBlock>

        {/* ── 快速开始 ── */}
        <SectionHeading id="quick-start">快速开始</SectionHeading>
        <CodeBlock>{`import { ChatPanel } from '@skillpet/chat-react';
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
}`}</CodeBlock>

        {/* ── Layer 1 ── */}
        <SectionHeading id="layer-1">Layer 1: 开箱即用</SectionHeading>

        <SubHeading id="chatpanel">ChatPanel</SubHeading>
        <p className="text-sm text-muted-foreground mb-3">主组件，包含完整的聊天 UI、输入框、消息列表、工具交互。</p>
        <PropTable rows={[
          { name: "projectId", type: "string", required: true, desc: "项目 / 会话 ID" },
          { name: "config", type: "ChatPanelConfig", desc: "API 地址、鉴权等配置；也可通过 ChatProvider 注入" },
          { name: "onStatusChange", type: "() => void", desc: "SSE 流结束时回调" },
          { name: "onResourceUpdated", type: "(key, snapshot?) => void", desc: "资源更新事件回调" },
          { name: "extraSlashCommands", type: "SlashCommand[]", desc: "追加的斜杠指令" },
          { name: "quickStarters", type: "string[]", desc: "空状态快捷开场文案列表，默认使用 i18n" },
          { name: "emptyState", type: "ChatPanelEmptyState", desc: "自定义空状态图标、标题、副标题" },
          { name: "className", type: "string", desc: "追加到根元素的 CSS 类名" },
        ]} />

        <SubHeading id="chatprovider">ChatProvider</SubHeading>
        <p className="text-sm text-muted-foreground mb-3">
          通过 React Context 向子组件提供 <TypeTag>ChatPanelConfig</TypeTag>，适合多个 ChatPanel 共享配置的场景。
        </p>
        <CodeBlock>{`import { ChatProvider, ChatPanel } from '@skillpet/chat-react';

<ChatProvider config={config}>
  <ChatPanel projectId="a" />
  <ChatPanel projectId="b" />
</ChatProvider>`}</CodeBlock>

        <SubHeading id="usechatconfig">useChatConfig</SubHeading>
        <p className="text-sm text-muted-foreground mb-3">
          从 Context 中读取配置。接受可选的 <TypeTag>propsConfig</TypeTag> 参数，存在时优先使用 props。
        </p>

        <SubHeading id="setchatlanguage">setChatLanguage</SubHeading>
        <p className="text-sm text-muted-foreground mb-3">
          切换内置 i18n 语言。支持 <TypeTag>zh-CN</TypeTag> <TypeTag>zh-TW</TypeTag> <TypeTag>en</TypeTag> <TypeTag>ja</TypeTag> <TypeTag>ko</TypeTag> <TypeTag>es</TypeTag> <TypeTag>fr</TypeTag>。
        </p>
        <CodeBlock>{`setChatLanguage('en');`}</CodeBlock>

        {/* ── Layer 2 ── */}
        <SectionHeading id="layer-2">Layer 2: 自定义组合</SectionHeading>

        <SubHeading id="usechatpanel">useChatPanel(options)</SubHeading>
        <p className="text-sm text-muted-foreground mb-3">Headless hook，返回聊天面板所有状态和操作函数，用于完全自定义 UI。</p>
        <p className="text-xs font-semibold text-foreground mb-2">Options</p>
        <PropTable rows={[
          { name: "projectId", type: "string", required: true, desc: "项目 / 会话 ID" },
          { name: "config", type: "ChatPanelConfig", required: true, desc: "API 与鉴权配置" },
          { name: "onStatusChange", type: "() => void", desc: "状态变更回调" },
          { name: "onResourceUpdated", type: "(key, snapshot?) => void", desc: "资源更新回调" },
          { name: "extraSlashCommands", type: "SlashCommand[]", desc: "追加斜杠指令" },
        ]} />
        <p className="text-xs font-semibold text-foreground mb-2">Return</p>
        <PropTable rows={[
          { name: "messages", type: "ChatMessage[]", required: true, desc: "当前消息列表" },
          { name: "setMessages", type: "Dispatch<SetStateAction>", required: true, desc: "更新消息" },
          { name: "input", type: "string", required: true, desc: "输入框文本" },
          { name: "setInput", type: "Dispatch<SetStateAction>", required: true, desc: "设置输入框" },
          { name: "isLoading", type: "boolean", required: true, desc: "是否正在加载 / 流式输出" },
          { name: "enableThinking", type: "boolean", required: true, desc: "深度思考开关" },
          { name: "setEnableThinking", type: "Dispatch<SetStateAction>", required: true, desc: "切换深度思考" },
          { name: "enableSearch", type: "boolean", required: true, desc: "联网搜索开关" },
          { name: "setEnableSearch", type: "Dispatch<SetStateAction>", required: true, desc: "切换联网搜索" },
          { name: "capVisible", type: "string[]", required: true, desc: "后端返回的可见能力列表" },
          { name: "isLoadingHistory", type: "boolean", required: true, desc: "是否正在加载历史" },
          { name: "showSlashCommands", type: "boolean", required: true, desc: "是否显示斜杠面板" },
          { name: "slashCommands", type: "SlashCommand[]", required: true, desc: "合并后的斜杠指令列表" },
          { name: "handleSend", type: "(msg?) => Promise", required: true, desc: "发送消息" },
          { name: "handleSlashCommand", type: "(cmd) => void", required: true, desc: "执行斜杠指令" },
          { name: "handleOptionClick", type: "(id, name, optId) => Promise", required: true, desc: "工具选项点击" },
          { name: "handleResetConversation", type: "() => Promise", required: true, desc: "重置对话" },
          { name: "stopGeneration", type: "() => void", required: true, desc: "中止流式生成" },
          { name: "handleKeyDown", type: "(e) => void", required: true, desc: "键盘事件处理" },
          { name: "handleChatScroll", type: "() => void", required: true, desc: "滚动事件处理" },
          { name: "scrollToMessage", type: "(msgId) => void", required: true, desc: "滚动到指定消息" },
          { name: "setMessageElementRef", type: "(id, el) => void", required: true, desc: "注册消息 DOM 引用" },
          { name: "navMessages", type: "ChatMessage[]", required: true, desc: "导航用消息列表" },
          { name: "containerRef", type: "RefObject<HTMLDivElement>", required: true, desc: "滚动容器引用" },
          { name: "showScrollButton", type: "boolean", required: true, desc: "是否显示回到底部按钮" },
          { name: "scrollToBottom", type: "(force?) => void", required: true, desc: "滚动到底部" },
        ]} />

        <SubHeading id="messagebubble">MessageBubble</SubHeading>
        <p className="text-sm text-muted-foreground mb-3">单条消息气泡组件，支持用户/助手/工具三种角色。</p>
        <PropTable rows={[
          { name: "msg", type: "ChatMessage", required: true, desc: "消息数据" },
          { name: "onEditMessage", type: "(id, content) => void", desc: "编辑消息回调" },
          { name: "setMessageElementRef", type: "(id, el) => void", desc: "DOM 引用注册" },
          { name: "onToolOptionClick", type: "(callId, name, optId) => void", desc: "工具选项点击" },
          { name: "onAskUserSubmit", type: "(msgId, answers) => void", desc: "表单提交回调" },
          { name: "isLoading", type: "boolean", desc: "是否处于加载状态" },
        ]} />

        <SubHeading id="askuserblock">AskUserBlock</SubHeading>
        <p className="text-sm text-muted-foreground mb-3">结构化表单交互组件，支持单选、多选和自由文本输入。</p>
        <PropTable rows={[
          { name: "questions", type: "AskUserQuestion[]", required: true, desc: "问题列表" },
          { name: "status", type: "'pending' | 'answered'", required: true, desc: "表单状态" },
          { name: "onSubmit", type: "(answers) => void", required: true, desc: "提交回调" },
        ]} />

        <SubHeading id="thinkingblock">ThinkingBlock</SubHeading>
        <p className="text-sm text-muted-foreground mb-3">AI 思考过程展示组件，可折叠，支持流式滚动。</p>
        <PropTable rows={[
          { name: "content", type: "string", required: true, desc: "思考内容文本" },
          { name: "isStreaming", type: "boolean", desc: "是否正在流式输出" },
        ]} />

        <SubHeading id="slashcommandpalette">SlashCommandPalette</SubHeading>
        <p className="text-sm text-muted-foreground mb-3">斜杠指令面板，键盘导航 + 模糊过滤。</p>
        <PropTable rows={[
          { name: "commands", type: "SlashCommand[]", required: true, desc: "指令列表" },
          { name: "filter", type: "string", required: true, desc: "当前过滤文本" },
          { name: "onSelect", type: "(cmd) => void", required: true, desc: "选中回调" },
          { name: "onClose", type: "() => void", required: true, desc: "关闭面板回调" },
        ]} />

        {/* ── Layer 3 ── */}
        <SectionHeading id="layer-3">Layer 3: 底层原语</SectionHeading>

        <SubHeading id="processSSEStream">processSSEStream(options)</SubHeading>
        <p className="text-sm text-muted-foreground mb-3">发起 POST 请求并解析 SSE 流，通过回调更新消息状态。</p>
        <PropTable rows={[
          { name: "url", type: "string", required: true, desc: "SSE 流端点 URL" },
          { name: "body", type: "Record<string, unknown>", required: true, desc: "POST body" },
          { name: "token", type: "string | null", required: true, desc: "Bearer token" },
          { name: "signal", type: "AbortSignal", desc: "用于取消请求" },
          { name: "callbacks", type: "SSECallbacks", required: true, desc: "状态更新回调集合" },
          { name: "uiStrings", type: "Partial<SSEStreamUiStrings>", desc: "覆盖内置文案" },
        ]} />

        <SubHeading id="parseHistoryMessages">parseHistoryMessages(messages, uiStrings?)</SubHeading>
        <p className="text-sm text-muted-foreground mb-3">
          将后端历史接口返回的原始消息数组还原为 <TypeTag>ChatMessage[]</TypeTag>，处理 ask_user、工具结果等特殊格式。
        </p>

        {/* ── 类型定义 ── */}
        <SectionHeading id="types">类型定义</SectionHeading>

        <SubHeading id="type-chatpanelconfig">ChatPanelConfig</SubHeading>
        <PropTable rows={[
          { name: "api.baseUrl", type: "string", required: true, desc: "SSE / 历史接口基础 URL" },
          { name: "api.deleteConversationUrl", type: "string", required: true, desc: "删除对话 URL（支持 {projectId} 占位符）" },
          { name: "getAccessToken", type: "() => string | null | Promise", required: true, desc: "获取 Bearer token" },
          { name: "accessToken", type: "string | null", desc: "token 标识（变化时重新加载历史）" },
          { name: "lang", type: "string", desc: "语言代码（zh-CN / en / ja / ...）" },
          { name: "components", type: "ChatPanelComponents", desc: "UI 组件开关" },
        ]} />

        <SubHeading id="type-chatpanelcomponents">ChatPanelComponents</SubHeading>
        <PropTable rows={[
          { name: "showMessageNav", type: "boolean", desc: "是否显示消息导航点阵，默认 true" },
        ]} />

        <SubHeading id="type-chatpanelemptystate">ChatPanelEmptyState</SubHeading>
        <PropTable rows={[
          { name: "icon", type: "ReactNode", desc: "顶部图标" },
          { name: "title", type: "string", desc: "标题文案" },
          { name: "subtitle", type: "string", desc: "副标题文案" },
        ]} />

        <SubHeading id="type-slashcommand">SlashCommand</SubHeading>
        <PropTable rows={[
          { name: "command", type: "string", required: true, desc: "指令文本（如 /help）" },
          { name: "label", type: "string", required: true, desc: "显示标签" },
          { name: "description", type: "string", required: true, desc: "描述文本" },
          { name: "icon", type: "ReactNode", required: true, desc: "图标" },
        ]} />

        <SubHeading id="type-chatmessage">ChatMessage</SubHeading>
        <PropTable rows={[
          { name: "id", type: "string", required: true, desc: "消息唯一 ID" },
          { name: "role", type: "'user' | 'assistant' | 'tool'", required: true, desc: "消息角色" },
          { name: "content", type: "string", required: true, desc: "消息正文" },
          { name: "thinking", type: "string", desc: "AI 思考过程" },
          { name: "toolResult", type: "object", desc: "工具调用结果" },
          { name: "askUser", type: "{ questions, status }", desc: "结构化提问数据" },
          { name: "parts", type: "MessagePart[]", desc: "多段消息（工具、子智能体等）" },
          { name: "isStreaming", type: "boolean", desc: "是否正在流式输出" },
          { name: "statusText", type: "string", desc: "状态提示文本" },
        ]} />

        <SubHeading id="type-askuserquestion">AskUserQuestion</SubHeading>
        <PropTable rows={[
          { name: "id", type: "string", required: true, desc: "问题 ID" },
          { name: "prompt", type: "string", required: true, desc: "问题文本" },
          { name: "options", type: "{ id, label }[]", required: true, desc: "选项列表" },
          { name: "allowMultiple", type: "boolean", desc: "允许多选" },
          { name: "allowFreeText", type: "boolean", desc: "允许自由文本输入" },
          { name: "freeTextPlaceholder", type: "string", desc: "自由文本占位符" },
        ]} />

        <SubHeading id="type-ssecallbacks">SSECallbacks</SubHeading>
        <PropTable rows={[
          { name: "updateMessages", type: "(updater) => void", required: true, desc: "消息状态更新函数" },
          { name: "onResourceUpdated", type: "(key, snapshot?) => void", desc: "资源更新回调" },
          { name: "onStatusChange", type: "() => void", desc: "状态变更回调" },
          { name: "onNoReader", type: "() => void", desc: "response.body 无 reader 时" },
          { name: "onFinally", type: "() => void", desc: "流结束或中断后的清理" },
        ]} />

        <SubHeading id="type-ssestremuistrings">SSEStreamUiStrings</SubHeading>
        <PropTable rows={[
          { name: "preparingToolHeartbeat", type: "string", required: true, desc: "工具心跳提示" },
          { name: "sseUnknownError", type: "string", required: true, desc: "未知错误文案" },
          { name: "connectionLost", type: "string", required: true, desc: "连接中断文案" },
          { name: "requestFailed", type: "string", required: true, desc: "请求失败文案" },
        ]} />

        <SubHeading id="type-parsehistoryuistrings">ParseHistoryUiStrings</SubHeading>
        <PropTable rows={[
          { name: "askUserErrorLabel", type: "string", required: true, desc: "解析失败工具名" },
          { name: "askUserErrorMessage", type: "string", required: true, desc: "解析失败提示" },
        ]} />

        <SubHeading id="type-messagepart">MessagePart</SubHeading>
        <PropTable rows={[
          { name: "type", type: "'text' | 'tool' | 'agent-text' | 'agent-tools'", required: true, desc: "段落类型" },
          { name: "content", type: "string", desc: "文本内容" },
          { name: "thinking", type: "string", desc: "思考内容" },
          { name: "toolResult", type: "ToolInlineResult", desc: "工具内联结果" },
          { name: "agentName", type: "string", desc: "子智能体名称" },
          { name: "agentCallId", type: "string", desc: "子智能体调用 ID" },
          { name: "agentStatus", type: "string", desc: "子智能体状态" },
          { name: "isAgentStreaming", type: "boolean", desc: "子智能体是否正在流式输出" },
          { name: "agentToolSteps", type: "AgentToolStep[]", desc: "子智能体工具步骤" },
          { name: "preview", type: "string", desc: "工具参数预览" },
        ]} />

        <SubHeading id="type-agenttoolstep">AgentToolStep</SubHeading>
        <PropTable rows={[
          { name: "name", type: "string", required: true, desc: "工具名称" },
          { name: "label", type: "string", required: true, desc: "显示标签" },
          { name: "status", type: "'running' | 'completed' | 'error'", required: true, desc: "执行状态" },
          { name: "summary", type: "string", desc: "执行摘要" },
        ]} />

        <SubHeading id="type-toolinlineresult">ToolInlineResult</SubHeading>
        <PropTable rows={[
          { name: "name", type: "string", required: true, desc: "工具名称" },
          { name: "label", type: "string", required: true, desc: "显示标签" },
          { name: "status", type: "string", required: true, desc: "执行状态" },
          { name: "message", type: "string", required: true, desc: "结果消息" },
          { name: "id", type: "string", desc: "工具调用 ID" },
        ]} />

        {/* ── Vue 入口 ── */}
        <SectionHeading id="vue-entry">Vue 入口 — @skillpet/chat-vue</SectionHeading>
        <CodeBlock>{`import { ChatPanel } from '@skillpet/chat-vue';
import '@skillpet/chat-core/styles.css';`}</CodeBlock>
        <p className="text-sm text-muted-foreground mb-3">API 与 React 版完全对等，仅框架范式不同：</p>
        <ExportList items={[
          { name: "ChatPanel", kind: "Component", desc: "Vue 3 SFC 主组件，Props 与 React 版一致" },
          { name: "provideChatConfig", kind: "Function", desc: "通过 provide/inject 注入配置（替代 ChatProvider）" },
          { name: "useChatConfig", kind: "Composable", desc: "读取注入的配置" },
          { name: "setChatLanguage", kind: "Function", desc: "切换 i18n 语言" },
          { name: "useChatPanel", kind: "Composable", desc: "Headless composable，返回 ref/computed 响应式状态" },
          { name: "MessageBubble", kind: "Component", desc: "消息气泡 SFC" },
          { name: "AskUserBlock", kind: "Component", desc: "表单交互 SFC" },
          { name: "ThinkingBlock", kind: "Component", desc: "思考过程 SFC" },
          { name: "SlashCommandPalette", kind: "Component", desc: "斜杠指令面板 SFC" },
          { name: "processSSEStream", kind: "Function", desc: "SSE 流处理（同 React 版）" },
          { name: "parseHistoryMessages", kind: "Function", desc: "历史消息解析（同 React 版）" },
        ]} />

        {/* ── Core 入口 ── */}
        <SectionHeading id="core-entry">Core 入口 — @skillpet/chat-core</SectionHeading>
        <CodeBlock>{`import { processSSEStream, parseHistoryMessages, setChatLanguage } from '@skillpet/chat-core';
import '@skillpet/chat-core/styles.css';`}</CodeBlock>
        <p className="text-sm text-muted-foreground mb-3">框架无关的核心逻辑：SSE 客户端、消息解析、i18n、类型定义和 CSS 主题。React/Vue 包自动依赖此包。</p>
        <ExportList items={[
          { name: "processSSEStream", kind: "Function", desc: "SSE 流处理" },
          { name: "parseHistoryMessages", kind: "Function", desc: "历史消息解析" },
          { name: "setChatLanguage", kind: "Function", desc: "切换 i18n 语言" },
          { name: "cn", kind: "Function", desc: "Tailwind class 合并工具（clsx + tailwind-merge）" },
          { name: "所有类型定义", kind: "Type", desc: "ChatMessage, ChatPanelConfig, SSECallbacks 等全部类型" },
          { name: "styles.css", kind: "CSS", desc: "内置品牌色主题 + Tailwind 组件样式" },
        ]} />

        {/* 回到顶部 */}
        <div className="mt-12 mb-8 flex justify-center">
          <a
            href="#install"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <ArrowUp className="h-3 w-3" />
            回到顶部
          </a>
        </div>
      </main>
    </div>
  );
}
