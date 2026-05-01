/**
 * Vite 开发服务器中间件：拦截 /api/mock-chat/*，提供自包含 Demo 的 Mock SSE。
 */
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Connect, Plugin } from "vite";

const MAX_UPLOAD_SIZE = 10 * 1024 * 1024; // 10MB

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function randomDelay(): Promise<void> {
  await delay(30 + Math.floor(Math.random() * 51));
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function parsePath(url: string | undefined): string {
  if (!url) return "";
  const q = url.indexOf("?");
  return q >= 0 ? url.slice(0, q) : url;
}

function isLikelyEnglish(message: string): boolean {
  return !/[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/.test(message);
}

function sseHeaders(res: ServerResponse): void {
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
}

function sseWrite(res: ServerResponse, event: string, data: unknown): void {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

async function streamTextAsTokens(
  res: ServerResponse,
  text: string,
  granularity: "char" | "word"
): Promise<void> {
  const tokens =
    granularity === "char"
      ? [...text]
      : (text.split(/(\s+)/).filter((s) => s.length > 0) as string[]);
  for (const chunk of tokens) {
    await randomDelay();
    sseWrite(res, "token", { content: chunk });
  }
}

type Scenario = "default" | "tool" | "ask" | "plan" | "form" | "resource";

function detectScenario(message: string): Scenario {
  const m = message.toLowerCase();
  const trimmed = message.trim();
  if (m.includes("工具") || /\btool\b/.test(m)) return "tool";
  if (
    /^\s*(方案|选择|style|choose|ask)\s*$/i.test(trimmed) ||
    (m.includes("方案") && !m.includes("：") && !m.includes(":")) ||
    (m.includes("选择") && !m.includes("：") && !m.includes(":"))
  ) {
    return "ask";
  }
  if (m.includes("计划") || /\bplan\b/.test(m)) return "plan";
  if (m.includes("表单") || /\bform\b/.test(m)) return "form";
  if (
    m.includes("角色") ||
    m.includes("资源") ||
    /\bcharacters\b/.test(m) ||
    /\bresource\b/.test(m)
  ) {
    return "resource";
  }
  return "default";
}

async function runDefaultStream(res: ServerResponse, message: string): Promise<void> {
  const en = isLikelyEnglish(message);
  sseWrite(res, "status", { message: en ? "Thinking…" : "正在思考…" });

  const thinkingParts = en
    ? [
        "1. Clarify the user's goal.\n",
        "2. List constraints and assumptions.\n",
        "3. Draft a concise answer in Markdown.\n",
      ]
    : [
        "1. 理解用户意图与上下文。\n",
        "2. 列出关键约束与假设。\n",
        "3. 用 Markdown 组织可读回复。\n",
      ];
  for (const part of thinkingParts) {
    await randomDelay();
    sseWrite(res, "thinking", { content: part });
  }
  sseWrite(res, "thinking_done", {});

  const body = en
    ? `Here is a **demo** reply from the mock server.\n\n- Bullet one\n- Bullet two\n\n` +
      `Inline \`code\` and a [link](https://example.com).\n\n` +
      `> The stream uses \`token\` events so Markdown renders progressively.\n\n` +
      `Try keywords **tool**, **plan**, **style** / **choose** / **ask**, **form** for other scenarios; type **characters** or **resource** to see the structured \`resource\` SSE demo; **image** for single display, **select image** for selection, **multi select image** for multi-select.`
    : `这是 **Mock SSE** 返回的演示回复。\n\n- 要点一\n- 要点二\n\n` +
      `行内 \`代码\` 与 [链接示例](https://example.com)。\n\n` +
      `> 流式 \`token\` 会逐步拼接，便于观察 Markdown 渲染。\n\n` +
      `试试单独输入 **工具**、**计划**（或英文 **plan**）、**方案** / **选择** / **style**、**表单** 等关键词体验其它场景；输入 **角色** 或 **characters** 查看结构化 \`resource\` 演示（也可输入 **resource** / **资源**）；输入 **图片** 查看单图展示，**选图片** 单选，**多选图片** 多选；英文可输入 **ask** 或 **form** 触发提问/表单，**image** 触发图片生成。`;

  await streamTextAsTokens(res, body, en ? "word" : "char");
  sseWrite(res, "done", {});
}

async function runToolScenario(res: ServerResponse, message: string): Promise<void> {
  const en = isLikelyEnglish(message);
  sseWrite(res, "status", { message: en ? "Analyzing…" : "分析中…" });
  sseWrite(res, "tool_start", {
    id: "t1",
    name: "analyze_data",
    label: en ? "Data analysis" : "数据分析",
  });
  await delay(400 + Math.floor(Math.random() * 200));
  sseWrite(res, "tool_result", {
    id: "t1",
    name: "analyze_data",
    label: en ? "Data analysis" : "数据分析",
    mode: "auto",
    status: "completed",
    message: en
      ? "Analysis complete: trend is stable; 3 anomalies flagged for review."
      : "分析完成：整体趋势平稳，发现 3 处异常点建议复核。",
  });
  const tail = en
    ? "\n\n**Summary:** the mock tool finished successfully; this text follows `tool_result` with `mode: \"auto\"`."
    : "\n\n**小结：** 工具已结束（`mode: \"auto\"`），此处为后续自然语言总结。";
  await streamTextAsTokens(res, tail, en ? "word" : "char");
  sseWrite(res, "done", {});
}

async function runAskScenario(res: ServerResponse, message: string): Promise<void> {
  const en = isLikelyEnglish(message);
  const intro = en
    ? "Pick a visual style for the demo (`ask_user` with option descriptions)."
    : "请选择一个视觉风格方案（演示带 `description` 的 `ask_user`，卡片布局）。";
  await streamTextAsTokens(res, intro, en ? "word" : "char");

  const questions = en
    ? [
        {
          id: "style-select",
          prompt: "Choose a visual style direction:",
          allowMultiple: false,
          options: [
            {
              id: "opt-1",
              label: "Neo-Chinese aesthetic",
              description:
                "Ink-wash and classical Chinese motifs behind the product; emphasizes Eastern elegance for domestic-brand positioning.",
            },
            {
              id: "opt-2",
              label: "Minimal premium",
              description:
                "Solid or gradient backgrounds with generous whitespace; highlights product texture and lines—suited for premium tech or luxury.",
            },
            {
              id: "opt-3",
              label: "Lifestyle context",
              description:
                "Product in everyday scenes (desk, kitchen, outdoors) to spark real-use association—great for FMCG and daily goods.",
            },
          ],
        },
      ]
    : [
        {
          id: "style-select",
          prompt: "请选择一个视觉风格方案：",
          allowMultiple: false,
          options: [
            {
              id: "opt-1",
              label: "轻国风之美",
              description:
                "以中国传统水墨/国风元素为背景，产品置于古典场景中，强调东方美学质感，适合国货品牌定位。",
            },
            {
              id: "opt-2",
              label: "极简高级感",
              description:
                "纯色或渐变背景，大量留白，突出产品本身质感与线条，适合高端定位、科技/奢侈品类。",
            },
            {
              id: "opt-3",
              label: "自然生活场景",
              description:
                "将产品融入生活化场景（如桌面、厨房、户外），让消费者产生真实使用联想，适合快消日用品。",
            },
          ],
        },
      ];

  sseWrite(res, "ask_user", { questions });
  // 故意不发 done：等待用户作答后由新请求继续（走 /stream）
}

async function runFormScenario(res: ServerResponse, message: string): Promise<void> {
  const en = isLikelyEnglish(message);
  const intro = en
    ? "I have a few questions to help refine the direction. Please fill in the form below."
    : "我需要确认几个问题来明确方向，请填写下方表单。";
  await streamTextAsTokens(res, intro, en ? "word" : "char");

  const questions = en
    ? [
        {
          id: "q-genre",
          prompt: "What genre do you prefer?",
          allowMultiple: true,
          options: [
            { id: "fantasy", label: "Fantasy" },
            { id: "scifi", label: "Sci-Fi" },
            { id: "mystery", label: "Mystery" },
            { id: "romance", label: "Romance" },
            { id: "adventure", label: "Adventure" },
          ],
        },
        {
          id: "q-audience",
          prompt: "Target audience?",
          options: [
            { id: "children", label: "Children (6-12)" },
            { id: "teen", label: "Young Adult" },
            { id: "adult", label: "Adult" },
          ],
        },
        {
          id: "q-extra",
          prompt: "Any special requirements?",
          allowFreeText: true,
          allowMultiple: true,
          freeTextPlaceholder: "e.g. keep it under 500 words, include a plot twist…",
          options: [
            { id: "humor", label: "Add humor" },
            { id: "suspense", label: "Build suspense" },
          ],
        },
      ]
    : [
        {
          id: "q-genre",
          prompt: "你偏好什么题材？",
          allowMultiple: true,
          options: [
            { id: "fantasy", label: "奇幻" },
            { id: "scifi", label: "科幻" },
            { id: "mystery", label: "悬疑" },
            { id: "romance", label: "言情" },
            { id: "adventure", label: "冒险" },
          ],
        },
        {
          id: "q-audience",
          prompt: "目标读者群体？",
          options: [
            { id: "children", label: "儿童 (6-12岁)" },
            { id: "teen", label: "青少年" },
            { id: "adult", label: "成人" },
          ],
        },
        {
          id: "q-extra",
          prompt: "其他特殊要求？",
          allowFreeText: true,
          allowMultiple: true,
          freeTextPlaceholder: "例如：控制在 500 字以内、加入反转情节…",
          options: [
            { id: "humor", label: "加入幽默元素" },
            { id: "suspense", label: "营造悬念感" },
          ],
        },
      ];

  sseWrite(res, "ask_user", { questions });
}

async function runResourceScenario(res: ServerResponse): Promise<void> {
  await randomDelay();
  sseWrite(res, "token", { content: "已从故事中提取了 3 个角色：" });
  sseWrite(res, "resource", {
    resourceType: "characters",
    data: [
      { name: "叶无锋", role: "protagonist", gender: "male" },
      { name: "苏婉儿", role: "lead", gender: "female" },
      { name: "老管家", role: "supporting", gender: "male" },
    ],
    fallbackText: "已提取 3 个角色：叶无锋、苏婉儿、老管家",
  });
  await randomDelay();
  sseWrite(res, "token", {
    content: "\n\n每个角色的性格和背景已整理完毕，可以继续分析场景。",
  });
  sseWrite(res, "done", {});
}

async function runPlanScenario(res: ServerResponse, message: string): Promise<void> {
  const en = isLikelyEnglish(message);
  sseWrite(res, "tool_result", {
    id: "plan-mock",
    name: "propose_plan",
    label: en ? "Plan options" : "方案候选",
    status: "awaiting_user",
    message: en
      ? "Pick one implementation plan (demo options)."
      : "请选择一个落地方案（演示可点选选项）。",
    options: en
      ? [
          { id: "A", label: "Plan A — fast iteration", description: "Ship MVP first, iterate weekly." },
          { id: "B", label: "Plan B — quality first", description: "Harden core paths before scaling." },
          { id: "C", label: "Plan C — hybrid", description: "Balance speed with guardrails." },
        ]
      : [
          { id: "A", label: "方案 A — 快速迭代", description: "先上线 MVP，按周迭代。" },
          { id: "B", label: "方案 B — 质量优先", description: "核心链路加固后再扩量。" },
          { id: "C", label: "方案 C — 折中路线", description: "在速度与风控之间取平衡。" },
        ],
  });
  // 不发 done：等待 `tool-response`
}

async function handleStreamPost(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const raw = await readBody(req);
  let message = "";
  try {
    const body = JSON.parse(raw) as { message?: string };
    message = typeof body.message === "string" ? body.message : "";
  } catch {
    message = "";
  }

  sseHeaders(res);
  res.statusCode = 200;
  res.flushHeaders?.();

  const content = message;
  const lowerContent = content.toLowerCase();
  const isImageGen =
    lowerContent.includes("图片") ||
    lowerContent.includes("image") ||
    lowerContent.includes("生成图");

  if (isImageGen) {
    let mode: "display" | "single_select" | "multi_select" = "display";
    let imageCount = 4;
    if (lowerContent.includes("选") || lowerContent.includes("select")) {
      if (lowerContent.includes("多选") || lowerContent.includes("multi")) {
        mode = "multi_select";
        imageCount = 6;
      } else {
        mode = "single_select";
        imageCount = 4;
      }
    }

    const blockId = `img-gen-${Date.now()}`;

    res.write(
      `event: delta\ndata: ${JSON.stringify({ type: "thinking", content: "正在为您生成图片..." })}\n\n`,
    );

    await delay(500);
    res.write(
      `event: delta\ndata: ${JSON.stringify({ type: "content", content: "好的，我来为您生成图片。\n\n" })}\n\n`,
    );

    await delay(500);
    res.write(`event: image_generating\ndata: ${JSON.stringify({ id: blockId, prompt: content })}\n\n`);

    await delay(2000);

    const images = Array.from({ length: imageCount }, (_, i) => ({
      id: `img-${i}`,
      url: `https://picsum.photos/seed/${blockId}-${i}/1024/1024`,
      width: 1024,
      height: 1024,
    }));

    const genData: Record<string, unknown> = {
      id: blockId,
      prompt: content,
      images,
      mode,
    };
    if (mode === "multi_select") {
      genData.minSelect = 1;
      genData.maxSelect = 3;
    }
    if (mode !== "display") {
      genData.actions = [
        { id: "regenerate", label: "重新生成" },
        { id: "download", label: "下载" },
      ];
    }

    res.write(`event: image_generation\ndata: ${JSON.stringify(genData)}\n\n`);
    await delay(300);
    res.write(`event: done\ndata: {}\n\n`);
    res.end();
    return;
  }

  const scenario = detectScenario(message);
  try {
    switch (scenario) {
      case "tool":
        await runToolScenario(res, message);
        break;
      case "ask":
        await runAskScenario(res, message);
        break;
      case "form":
        await runFormScenario(res, message);
        break;
      case "plan":
        await runPlanScenario(res, message);
        break;
      case "resource":
        await runResourceScenario(res);
        break;
      default:
        await runDefaultStream(res, message);
        break;
    }
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : "MOCK_ERROR";
    sseWrite(res, "error", { message: errMsg });
    sseWrite(res, "done", {});
  }
  res.end();
}

async function handleToolResponsePost(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const raw = await readBody(req);
  let optionId = "";
  try {
    const body = JSON.parse(raw) as { optionId?: string };
    optionId = typeof body.optionId === "string" ? body.optionId : "";
  } catch {
    optionId = "";
  }

  sseHeaders(res);
  res.statusCode = 200;
  res.flushHeaders?.();

  const reply =
    optionId === "A" || optionId === "B" || optionId === "C"
      ? `你已选择 **${optionId}**。Mock 流继续：接下来可按该方案拆分里程碑与验收标准。\n\n*(If you typed in English: you chose plan ${optionId} — next, define milestones and acceptance criteria.)*`
      : `已收到选择 **${optionId || "（空）"}**，这是一条 Mock 续写回复。\n\n*(EN) Selection received for option **${optionId || "∅"}**.*`;

  try {
    await streamTextAsTokens(res, reply, "char");
    sseWrite(res, "done", {});
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : "MOCK_ERROR";
    sseWrite(res, "error", { message: errMsg });
    sseWrite(res, "done", {});
  }
  res.end();
}

function sendJson(res: ServerResponse, status: number, data: unknown): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
}

function mockChatMiddleware(): Connect.NextHandleFunction {
  return (req, res, next) => {
    void (async () => {
      const pathname = parsePath(req.url);
      const method = (req.method ?? "GET").toUpperCase();

      if (method === "GET" && pathname === "/api/mock-chat/init/demo") {
        sendJson(res, 200, {
          agent: {
            id: "main-bot",
            name: "SkillPet Demo",
            avatarUrl: "https://api.dicebear.com/9.x/bottts/svg?seed=skillpet",
            description: "演示用主智能体",
          },
          capabilities: {
            thinking: { enabled: true, defaultOn: true },
            search: { enabled: true, defaultOn: false },
            imageGeneration: { enabled: true },
            attachment: {
              enabled: true,
              accept: "image/*,.pdf,.doc,.docx,.txt",
              maxFileSize: 10485760,
              maxCount: 5,
              uploadUrl: "/api/mock-chat/upload",
              deleteUrl: "/api/mock-chat/attachment/{attachmentId}",
            },
            reset: {
              enabled: true,
              clearUrl: "/api/mock-chat/conversation/{projectId}",
            },
            queuedSend: { enabled: true, maxQueueSize: 5 },
          },
          subAgents: [
            { id: "sub-research", name: "Research Agent", avatarUrl: "https://api.dicebear.com/9.x/bottts/svg?seed=research" },
            { id: "sub-code", name: "Code Agent", avatarUrl: "https://api.dicebear.com/9.x/bottts/svg?seed=code" },
          ],
          userAvatarUrl: "https://api.dicebear.com/9.x/thumbs/svg?seed=user",
          messages: [],
          hint:
            "单独输入 **方案**、**选择** 或 **style** 体验带描述的 `ask_user` 卡片选项；**计划** / **plan** 体验方案点选工具；**工具**、**表单** 等见默认回复说明。输入 **角色** / **characters** / **resource** 查看 resource 演示。",
        });
        return;
      }

      if (method === "POST" && pathname === "/api/mock-chat/stream") {
        await handleStreamPost(req, res);
        return;
      }

      if (method === "POST" && pathname === "/api/mock-chat/tool-response") {
        await handleToolResponsePost(req, res);
        return;
      }

      if (method === "POST" && pathname.startsWith("/api/mock-chat/image-select/")) {
        sendJson(res, 200, { success: true });
        return;
      }

      if (method === "POST" && pathname === "/api/mock-chat/upload") {
        const contentLength = req.headers["content-length"];
        if (contentLength) {
          const n = Number(contentLength);
          if (Number.isFinite(n) && n > MAX_UPLOAD_SIZE) {
            sendJson(res, 413, { error: "File too large", maxSize: "10MB" });
            return;
          }
        }
        const chunks: Buffer[] = [];
        let totalSize = 0;
        let aborted = false;
        req.on("data", (c: Buffer) => {
          if (aborted) return;
          totalSize += c.length;
          if (totalSize > MAX_UPLOAD_SIZE) {
            aborted = true;
            sendJson(res, 413, { error: "File too large", maxSize: "10MB" });
            req.destroy();
            return;
          }
          chunks.push(c);
        });
        req.on("end", () => {
          if (aborted) return;
          const body = Buffer.concat(chunks);
          const header = body.subarray(0, Math.min(body.length, 1024)).toString("binary");
          const nameMatch = header.match(/filename="([^"]+)"/);
          const ctMatch = header.match(/Content-Type:\s*(\S+)/i);
          const fileName = nameMatch ? nameMatch[1] : "uploaded-file";
          const mimeType = ctMatch ? ctMatch[1].replace(/[\r\n]+$/, "") : "application/octet-stream";
          const id = `att-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          sendJson(res, 200, {
            id,
            name: fileName,
            size: body.length,
            type: mimeType,
            url: `https://mock.example.com/files/${id}`,
            processedData: { description: "Mock processed result: file content analyzed." },
          });
        });
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

      next();
    })();
  };
}

export function mockServerPlugin(): Plugin {
  const mount = mockChatMiddleware();
  return {
    name: "skillpet-chat-mock-server",
    configureServer(server) {
      server.middlewares.use(mount);
    },
    configurePreviewServer(server) {
      server.middlewares.use(mount);
    },
  };
}
