# Changelog

## v0.9.0 — 2026-04-09

### Added

- `ChatPanel` 新增 `readOnly` prop（boolean，默认 false）。启用后隐藏底部输入区、quickStarter
  按钮、排队区，仅保留消息流渲染。适用于"运行态进度展示""历史回放""只读访客"等场景。
  宿主可通过 `useChatPanel(...).handleSend(payload, undefined, { suppressUserBubble: true })`
  程序化派发首条消息。

### Changed

- 无 breaking change；现有调用方不受影响。
