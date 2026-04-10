/**
 * Production server for chat.skill.pet
 * Serves Vite build output + Mock SSE API endpoints.
 */
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const DIST = join(__dirname, "dist");
const PORT = parseInt(process.env.PORT || "3300", 10);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".webp": "image/webp",
  ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

// ─── Mock SSE helpers ─────────────────────────────────────────────────────────

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
async function randomDelay() { await delay(30 + Math.floor(Math.random() * 51)); }

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", c => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function isLikelyEnglish(msg) { return !/[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/.test(msg); }

function sseHeaders(res) {
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
}
function sseWrite(res, event, data) { res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`); }

async function streamTextAsTokens(res, text, granularity) {
  const tokens = granularity === "char"
    ? [...text]
    : text.split(/(\s+)/).filter(s => s.length > 0);
  for (const chunk of tokens) { await randomDelay(); sseWrite(res, "token", { content: chunk }); }
}

function detectScenario(msg) {
  const m = msg.toLowerCase(), t = msg.trim();
  if (m.includes("工具") || /\btool\b/.test(m)) return "tool";
  if (m.includes("方案") || /\bplan\b/.test(m)) return "plan";
  if (m.includes("表单") || /\bform\b/.test(m)) return "form";
  if (m.includes("选择") || /\bchoose\b/i.test(m) || /^\s*ask\s*$/i.test(t)) return "ask";
  return "default";
}

async function runDefaultStream(res, msg) {
  const en = isLikelyEnglish(msg);
  sseWrite(res, "status", { message: en ? "Thinking…" : "正在思考…" });
  const tp = en ? ["1. Clarify the user's goal.\n","2. List constraints and assumptions.\n","3. Draft a concise answer in Markdown.\n"]
    : ["1. 理解用户意图与上下文。\n","2. 列出关键约束与假设。\n","3. 用 Markdown 组织可读回复。\n"];
  for (const p of tp) { await randomDelay(); sseWrite(res, "thinking", { content: p }); }
  sseWrite(res, "thinking_done", {});
  const body = en
    ? `Here is a **demo** reply from the mock server.\n\n- Bullet one\n- Bullet two\n\nInline \`code\` and a [link](https://example.com).\n\n> The stream uses \`token\` events so Markdown renders progressively.\n\nTry keywords **tool**, **plan**, **choose** (or a lone **ask**), **form**, or **选择** / **方案** / **工具** / **表单** for other scenarios.`
    : `这是 **Mock SSE** 返回的演示回复。\n\n- 要点一\n- 要点二\n\n行内 \`代码\` 与 [链接示例](https://example.com)。\n\n> 流式 \`token\` 会逐步拼接，便于观察 Markdown 渲染。\n\n试试输入 **工具**、**方案**、**选择**、**表单** 等关键词体验其它场景；英文可单独输入 **ask** 或 **form** 触发提问/表单演示。`;
  await streamTextAsTokens(res, body, en ? "word" : "char");
  sseWrite(res, "done", {});
}

async function runToolScenario(res, msg) {
  const en = isLikelyEnglish(msg);
  sseWrite(res, "status", { message: en ? "Analyzing…" : "分析中…" });
  sseWrite(res, "tool_start", { id: "t1", name: "analyze_data", label: en ? "Data analysis" : "数据分析" });
  await delay(400 + Math.floor(Math.random() * 200));
  sseWrite(res, "tool_result", { id: "t1", name: "analyze_data", label: en ? "Data analysis" : "数据分析", mode: "auto", status: "completed", message: en ? "Analysis complete: trend is stable; 3 anomalies flagged for review." : "分析完成：整体趋势平稳，发现 3 处异常点建议复核。" });
  const tail = en ? "\n\n**Summary:** the mock tool finished successfully; this text follows `tool_result` with `mode: \"auto\"`." : "\n\n**小结：** 工具已结束（`mode: \"auto\"`），此处为后续自然语言总结。";
  await streamTextAsTokens(res, tail, en ? "word" : "char");
  sseWrite(res, "done", {});
}

async function runAskScenario(res, msg) {
  const en = isLikelyEnglish(msg);
  await streamTextAsTokens(res, en ? "Please pick one option below (demo `ask_user`)." : "请从下列选项中选择一项（演示 `ask_user`）。", en ? "word" : "char");
  const questions = en
    ? [{ id: "q1", prompt: "Which follow-up do you want?", options: [{ id: "a", label: "Explain trade-offs" },{ id: "b", label: "Give a checklist" },{ id: "c", label: "Short summary only" }] }]
    : [{ id: "q1", prompt: "你希望我接下来做什么？", options: [{ id: "a", label: "展开利弊分析" },{ id: "b", label: "给出可执行清单" },{ id: "c", label: "只要一句话结论" }] }];
  sseWrite(res, "ask_user", { questions });
}

async function runFormScenario(res, msg) {
  const en = isLikelyEnglish(msg);
  await streamTextAsTokens(res, en ? "I have a few questions to help refine the direction. Please fill in the form below." : "我需要确认几个问题来明确方向，请填写下方表单。", en ? "word" : "char");
  const questions = en
    ? [{ id: "q-genre", prompt: "What genre do you prefer?", allowMultiple: true, options: [{ id: "fantasy", label: "Fantasy" },{ id: "scifi", label: "Sci-Fi" },{ id: "mystery", label: "Mystery" },{ id: "romance", label: "Romance" },{ id: "adventure", label: "Adventure" }] },{ id: "q-audience", prompt: "Target audience?", options: [{ id: "children", label: "Children (6-12)" },{ id: "teen", label: "Young Adult" },{ id: "adult", label: "Adult" }] },{ id: "q-extra", prompt: "Any special requirements?", allowFreeText: true, allowMultiple: true, freeTextPlaceholder: "e.g. keep it under 500 words, include a plot twist…", options: [{ id: "humor", label: "Add humor" },{ id: "suspense", label: "Build suspense" }] }]
    : [{ id: "q-genre", prompt: "你偏好什么题材？", allowMultiple: true, options: [{ id: "fantasy", label: "奇幻" },{ id: "scifi", label: "科幻" },{ id: "mystery", label: "悬疑" },{ id: "romance", label: "言情" },{ id: "adventure", label: "冒险" }] },{ id: "q-audience", prompt: "目标读者群体？", options: [{ id: "children", label: "儿童 (6-12岁)" },{ id: "teen", label: "青少年" },{ id: "adult", label: "成人" }] },{ id: "q-extra", prompt: "其他特殊要求？", allowFreeText: true, allowMultiple: true, freeTextPlaceholder: "例如：控制在 500 字以内、加入反转情节…", options: [{ id: "humor", label: "加入幽默元素" },{ id: "suspense", label: "营造悬念感" }] }];
  sseWrite(res, "ask_user", { questions });
}

async function runPlanScenario(res, msg) {
  const en = isLikelyEnglish(msg);
  sseWrite(res, "tool_result", { id: "plan-mock", name: "propose_plan", label: en ? "Plan options" : "方案候选", status: "awaiting_user", message: en ? "Pick one implementation plan (demo options)." : "请选择一个落地方案（演示可点选选项）。",
    options: en ? [{ id: "A", label: "Plan A — fast iteration", description: "Ship MVP first, iterate weekly." },{ id: "B", label: "Plan B — quality first", description: "Harden core paths before scaling." },{ id: "C", label: "Plan C — hybrid", description: "Balance speed with guardrails." }]
      : [{ id: "A", label: "方案 A — 快速迭代", description: "先上线 MVP，按周迭代。" },{ id: "B", label: "方案 B — 质量优先", description: "核心链路加固后再扩量。" },{ id: "C", label: "方案 C — 折中路线", description: "在速度与风控之间取平衡。" }] });
}

async function handleStreamPost(req, res) {
  const raw = await readBody(req);
  let message = "";
  try { message = JSON.parse(raw).message || ""; } catch { message = ""; }
  sseHeaders(res); res.statusCode = 200; res.flushHeaders?.();
  try {
    const s = detectScenario(message);
    if (s === "tool") await runToolScenario(res, message);
    else if (s === "ask") await runAskScenario(res, message);
    else if (s === "form") await runFormScenario(res, message);
    else if (s === "plan") await runPlanScenario(res, message);
    else await runDefaultStream(res, message);
  } catch (e) { sseWrite(res, "error", { message: e?.message || "MOCK_ERROR" }); sseWrite(res, "done", {}); }
  res.end();
}

async function handleToolResponsePost(req, res) {
  const raw = await readBody(req);
  let optionId = "";
  try { optionId = JSON.parse(raw).optionId || ""; } catch { optionId = ""; }
  sseHeaders(res); res.statusCode = 200; res.flushHeaders?.();
  const reply = ["A","B","C"].includes(optionId)
    ? `你已选择 **${optionId}**。Mock 流继续：接下来可按该方案拆分里程碑与验收标准。\n\n*(If you typed in English: you chose plan ${optionId} — next, define milestones and acceptance criteria.)*`
    : `已收到选择 **${optionId || "（空）"}**，这是一条 Mock 续写回复。`;
  try { await streamTextAsTokens(res, reply, "char"); sseWrite(res, "done", {}); } catch (e) { sseWrite(res, "error", { message: e?.message || "MOCK_ERROR" }); sseWrite(res, "done", {}); }
  res.end();
}

function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
}

// ─── Static file server ───────────────────────────────────────────────────────

const indexHtml = readFileSync(join(DIST, "index.html"), "utf8");

function serveStatic(req, res) {
  const url = new URL(req.url, "http://localhost");
  let filePath = join(DIST, url.pathname);

  if (existsSync(filePath) && statSync(filePath).isFile()) {
    const ext = extname(filePath);
    const mime = MIME[ext] || "application/octet-stream";
    res.setHeader("Content-Type", mime);
    if (url.pathname.startsWith("/assets/")) {
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    }
    res.statusCode = 200;
    res.end(readFileSync(filePath));
    return true;
  }
  return false;
}

// ─── Request router ───────────────────────────────────────────────────────────

const server = createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  const pathname = url.pathname;
  const method = (req.method || "GET").toUpperCase();

  if (method === "GET" && pathname === "/api/mock-chat/init/demo") {
    sendJson(res, 200, {
      agent: { id: "main-bot", name: "SkillPet Demo", avatarUrl: "https://api.dicebear.com/9.x/bottts/svg?seed=skillpet", description: "演示用主智能体" },
      capabilities: {
        thinking: { enabled: true, defaultOn: true },
        search: { enabled: true, defaultOn: false },
        attachment: { enabled: true, accept: "image/*,.pdf,.doc,.docx,.txt", maxFileSize: 10485760, maxCount: 5, uploadUrl: "/api/mock-chat/upload", deleteUrl: "/api/mock-chat/attachment/{attachmentId}" },
        reset: { enabled: true, clearUrl: "/api/mock-chat/conversation/{projectId}" },
      },
      subAgents: [
        { id: "sub-research", name: "Research Agent", avatarUrl: "https://api.dicebear.com/9.x/bottts/svg?seed=research" },
        { id: "sub-code", name: "Code Agent", avatarUrl: "https://api.dicebear.com/9.x/bottts/svg?seed=code" },
      ],
      userAvatarUrl: "https://api.dicebear.com/9.x/thumbs/svg?seed=user",
      messages: [],
    });
    return;
  }
  if (method === "POST" && pathname === "/api/mock-chat/upload") {
    const chunks = [];
    req.on("data", c => chunks.push(c));
    req.on("end", () => {
      const id = `att-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      sendJson(res, 200, { id, name: "uploaded-file", size: Buffer.concat(chunks).length, type: "application/octet-stream", url: `https://mock.example.com/files/${id}`, processedData: { description: "Mock processed result" } });
    });
    return;
  }
  if (method === "POST" && pathname === "/api/mock-chat/stream") {
    handleStreamPost(req, res).catch(() => res.end());
    return;
  }
  if (method === "POST" && pathname === "/api/mock-chat/tool-response") {
    handleToolResponsePost(req, res).catch(() => res.end());
    return;
  }
  if (method === "DELETE" && pathname === "/api/mock-chat/conversation/demo") {
    sendJson(res, 200, { success: true });
    return;
  }
  if (method === "DELETE" && pathname.startsWith("/api/mock-chat/attachment/")) {
    sendJson(res, 200, { success: true });
    return;
  }

  if (serveStatic(req, res)) return;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.statusCode = 200;
  res.end(indexHtml);
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`chat-site running at http://127.0.0.1:${PORT}`);
});
