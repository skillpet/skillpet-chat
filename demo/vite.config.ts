import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { mockServerPlugin } from "./mock-server";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const chatCoreRoot = path.resolve(__dirname, "..", "packages", "core");
const chatReactRoot = path.resolve(__dirname, "..", "packages", "react");

function coreEntry(): string {
  for (const f of ["src/index.ts", "src/index.tsx"]) {
    const p = path.join(chatCoreRoot, f);
    if (fs.existsSync(p)) return p;
  }
  const distMjs = path.join(chatCoreRoot, "dist/index.mjs");
  if (fs.existsSync(distMjs)) return distMjs;
  return path.join(chatCoreRoot, "src/index.ts");
}

function reactEntry(): string {
  for (const f of ["src/index.ts", "src/index.tsx"]) {
    const p = path.join(chatReactRoot, f);
    if (fs.existsSync(p)) return p;
  }
  const distMjs = path.join(chatReactRoot, "dist/index.mjs");
  if (fs.existsSync(distMjs)) return distMjs;
  return path.join(chatReactRoot, "src/index.ts");
}

/** 与 package exports 一致：优先已构建的 CSS，否则退回源码入口（需先 pnpm build:core） */
function coreStyles(): string {
  const distCss = path.join(chatCoreRoot, "dist/skillpet-chat.css");
  if (fs.existsSync(distCss)) return distCss;
  return path.join(chatCoreRoot, "src/styles/build-entry.css");
}

/**
 * 补齐 workspace 解析，且满足子路径（如 styles.css）与包根导入。
 * 开发前建议在仓库根执行：`pnpm install`；若 core 未构建，可执行 `pnpm build:core`。
 */
export default defineConfig({
  plugins: [react(), tailwindcss(), mockServerPlugin()],
  server: { port: 5400 },
  resolve: {
    alias: [
      { find: /^@skillpet\/chat-core\/styles\.css$/, replacement: coreStyles() },
      { find: /^@skillpet\/chat-core$/, replacement: coreEntry() },
      { find: /^@skillpet\/chat-react$/, replacement: reactEntry() },
    ],
  },
});
