#!/usr/bin/env bash
# 同步代码到私有仓库 + 推送公有仓库
# 用法: ./sync-private.sh [commit message]

set -euo pipefail

PRIVATE_REPO="https://github.com/skillpet/skillpet-chat-src.git"
SRC_DIR="$(cd "$(dirname "$0")" && pwd)"
TMP_DIR="/tmp/skillpet-chat-src"
MSG="${1:-sync: $(date '+%Y-%m-%d %H:%M')}"

# ── 1. 公有仓库：提交 + 推送 ──
echo "🌐 [公有仓库] 检查变更..."
cd "$SRC_DIR"
git add -A
if git diff --cached --quiet; then
  echo "🌐 [公有仓库] 无变更，跳过。"
else
  git commit -m "$MSG"
  echo "🌐 [公有仓库] 已提交。"
fi

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main 2>/dev/null || echo "none")
if [ "$LOCAL" != "$REMOTE" ]; then
  git push origin main
  echo "🌐 [公有仓库] 已推送到 origin/main。"
else
  echo "🌐 [公有仓库] 已是最新，无需推送。"
fi

# ── 2. 私有仓库：全量同步 ──
echo ""
echo "📦 [私有仓库] 准备同步..."

if [ -d "$TMP_DIR/.git" ]; then
  echo "⬇️  拉取最新..."
  cd "$TMP_DIR"
  git fetch origin
  git reset --hard origin/main 2>/dev/null || true
else
  rm -rf "$TMP_DIR"
  echo "⬇️  克隆私有仓库..."
  git clone "$PRIVATE_REPO" "$TMP_DIR"
  cd "$TMP_DIR"
fi

find "$TMP_DIR" -mindepth 1 -maxdepth 1 ! -name '.git' -exec rm -rf {} +

rsync -a \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='dist' \
  --exclude='.DS_Store' \
  --exclude='.cursor' \
  "$SRC_DIR/" "$TMP_DIR/"

cat > "$TMP_DIR/.gitignore" << 'GITIGNORE'
node_modules/
dist/
*.log
.DS_Store
.cursor/
GITIGNORE

cd "$TMP_DIR"
git add -A

if git diff --cached --quiet; then
  echo "📦 [私有仓库] 无变更，无需同步。"
else
  git commit -m "$MSG"
  git push origin main
  echo "📦 [私有仓库] 已同步到 $PRIVATE_REPO"
fi

echo ""
echo "✅ 全部完成。"
