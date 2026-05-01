# Changelog

## v0.11.4 — 2026-05-02

### Fixed

- **图片网格单列显示**：修复图片（display）、单选图片（single_select）、多选图片（multi_select）三种模式下
  图片网格每张图单独一行的问题。根因是 MessageBubble 中助手消息和工具消息的 flex 容器缺少确定宽度，
  导致 CSS Grid 的 `auto-fill` 无法计算列数。现已为容器添加 `flex-1`，使 `repeat(auto-fill, minmax(96px, 200px))`
  正确自适应多列排布。
- ImageGenerationBlock 外层容器添加 `w-full` 确保宽度填满父容器。

---

## v0.11.0 — 2026-05-01

### Added

- `AskUserQuestion.options[].description`（可选 string）：选项描述字段。当任一选项含 description 时，
  UI 自动切换为纵向卡片布局（label 加粗 + description 小字灰色 line-clamp-3）。
  无 description 的选项保持原有按钮流布局。

### Fixed

- **图片不清晰**：
  - 已选择确认后的未选中图片从 `opacity-40` 改为 `opacity-60 saturate-[0.3]`（灰淡但清晰）
  - 预览 modal 最大尺寸从 400×400px 改为 90vw×85vh（大图全屏可看清）
  - 网格图片直接使用 `img.url` 高清原图（不再优先加载 thumbnailUrl）

---

## v0.10.0 — 2026-04-09

### Added

- `ChatPanelHandle` interface（新增至 `@skillpet/chat-core`）：通过 `forwardRef`（React）和
  `defineExpose`（Vue）向宿主暴露命令式 API，包含 `handleSend`、`setMessages`、
  `stopGeneration`、`scrollToBottom`、`getMessages`。
- 结合 `readOnly` prop 使用，宿主可在不显示输入框的情况下程序化派发消息 / 同步进度。

### Changed

- 无 breaking change；`ChatPanel` 默认行为与 v0.9.0 完全一致。
  `ref` 为可选参数，不传时功能无变化。

---

## v0.9.0 — 2026-04-09

### Added

- `ChatPanel` 新增 `readOnly` prop（boolean，默认 false）。启用后隐藏底部输入区、quickStarter
  按钮、排队区，仅保留消息流渲染。适用于"运行态进度展示""历史回放""只读访客"等场景。
  宿主可通过 `useChatPanel(...).handleSend(payload, undefined, { suppressUserBubble: true })`
  程序化派发首条消息。

### Changed

- 无 breaking change；现有调用方不受影响。
