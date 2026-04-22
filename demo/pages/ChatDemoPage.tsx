import { useEffect, useMemo, useRef, useState } from "react";
import { BotMessageSquare, Palette } from "lucide-react";
import {
  ChatPanel,
  type ChatPanelConfig,
  type ChatPanelEmptyState,
  type ResourceBlock,
} from "@skillpet/chat-react";
import { useLang } from "../App";

const QUICK_STARTERS_BY_LANG: Record<string, string[]> = {
  "zh-CN": [
    "请根据当前项目上下文，给出三条可执行建议。",
    "用要点列表总结我们上次讨论的结论。",
    "帮我检查文案中的错别字与语气是否一致。",
    "如果资源不足，给出优先级排序与理由。",
  ],
  "zh-TW": [
    "請根據目前專案脈絡，給出三條可執行建議。",
    "用重點列表總結我們上次討論的結論。",
    "幫我檢查文案中的錯字與語氣是否一致。",
    "若資源不足，請給出優先順序與理由。",
  ],
  en: [
    "Give three actionable suggestions based on the current project context.",
    "Summarize our last discussion as a bullet list.",
    "Check the copy for typos and tone consistency.",
    "If resources are tight, propose priorities with rationale.",
  ],
  ja: [
    "現在のプロジェクト文脈に基づき、実行可能な提案を3つください。",
    "前回の議論を箇条書きで要約してください。",
    "文案の誤字とトーンの一貫性を確認してください。",
    "リソースが不足している場合、優先順位と理由を示してください。",
  ],
  ko: [
    "현재 프로젝트 맥락을 바탕으로 실행 가능한 제안 세 가지를 주세요.",
    "지난 논의를 글머리 기호로 요약해 주세요.",
    "문구의 오타와 톤 일관성을 검토해 주세요.",
    "리소스가 부족하면 우선순위와 이유를 제시해 주세요.",
  ],
  es: [
    "Da tres sugerencias accionables según el contexto del proyecto.",
    "Resume nuestra última conversación en viñetas.",
    "Revisa el texto en busca de erratas y coherencia de tono.",
    "Si faltan recursos, propón prioridades con justificación.",
  ],
  fr: [
    "Propose trois actions concrètes selon le contexte du projet.",
    "Résume notre dernière discussion en puces.",
    "Vérifie les fautes et la cohérence du ton du texte.",
    "Si les ressources manquent, propose des priorités avec justification.",
  ],
};

const THEME_PRESETS = [
  { name: "Blue",   color: "#3b82f6", light: "oklch(0.55 0.2 255)",   dark: "oklch(0.65 0.2 255)" },
  { name: "Purple", color: "#7c3aed", light: "oklch(0.50 0.24 285)",  dark: "oklch(0.62 0.24 285)" },
  { name: "Green",  color: "#10b981", light: "oklch(0.60 0.18 160)",  dark: "oklch(0.68 0.18 160)" },
  { name: "Rose",   color: "#f43f5e", light: "oklch(0.55 0.22 15)",   dark: "oklch(0.62 0.22 15)" },
  { name: "Orange", color: "#f97316", light: "oklch(0.62 0.20 55)",   dark: "oklch(0.68 0.20 55)" },
  { name: "Teal",   color: "#14b8a6", light: "oklch(0.60 0.15 180)",  dark: "oklch(0.68 0.15 180)" },
];

const STORAGE_THEME_COLOR = "skillpet-chat-theme-color";

const ALL_CAPS = ["thinking", "search", "attachment", "reset", "queuedSend", "imageGeneration"] as const;

const CAP_LABELS: Record<string, Record<string, string>> = {
  thinking: { "zh-CN": "深度思考", en: "Thinking" },
  search: { "zh-CN": "联网搜索", en: "Search" },
  attachment: { "zh-CN": "附件", en: "Attachment" },
  reset: { "zh-CN": "重置", en: "Reset" },
  queuedSend: { "zh-CN": "排队发送", en: "Queued Send" },
  imageGeneration: { "zh-CN": "图片生成", en: "Image Generation" },
};

export default function ChatDemoPage() {
  const lang = useLang();
  const [capOverride, setCapOverride] = useState<string[]>([...ALL_CAPS]);
  const [readOnly, setReadOnly] = useState(false);
  const [activeTheme, setActiveTheme] = useState(() => {
    try { return localStorage.getItem(STORAGE_THEME_COLOR) ?? ""; } catch { return ""; }
  });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current?.querySelector(".skillpet-chat") as HTMLElement | null;
    if (!el) return;
    if (!activeTheme) {
      el.style.removeProperty("--skillpet-chat-primary");
      return;
    }
    const preset = THEME_PRESETS.find((p) => p.color === activeTheme);
    if (preset) {
      const isDark = document.documentElement.classList.contains("dark");
      el.style.setProperty("--skillpet-chat-primary", isDark ? preset.dark : preset.light);
    }
    try { localStorage.setItem(STORAGE_THEME_COLOR, activeTheme); } catch {}
  }, [activeTheme]);

  useEffect(() => {
    if (!activeTheme) return;
    const observer = new MutationObserver(() => {
      const el = containerRef.current?.querySelector(".skillpet-chat") as HTMLElement | null;
      if (!el) return;
      const preset = THEME_PRESETS.find((p) => p.color === activeTheme);
      if (preset) {
        const isDark = document.documentElement.classList.contains("dark");
        el.style.setProperty("--skillpet-chat-primary", isDark ? preset.dark : preset.light);
      }
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, [activeTheme]);

  const toggleCap = (cap: string) =>
    setCapOverride((prev) =>
      prev.includes(cap) ? prev.filter((c) => c !== cap) : [...prev, cap]
    );

  const chatConfig: ChatPanelConfig = useMemo(
    () => ({
      api: { baseUrl: "/api/mock-chat" },
      getAccessToken: () => "mock-token",
      accessToken: "mock-token",
      lang,
    }),
    [lang]
  );

  const quickStarters = useMemo(
    () => QUICK_STARTERS_BY_LANG[lang] ?? QUICK_STARTERS_BY_LANG.en!,
    [lang]
  );

  const EMPTY_STATE_I18N: Record<string, { title: string; subtitle: string }> = {
    "zh-CN": { title: "有什么我可以帮你的？", subtitle: "描述你的需求，AI 将协助你完成" },
    "zh-TW": { title: "有什麼我可以幫你的？", subtitle: "描述你的需求，AI 將協助你完成" },
    en: { title: "What can I help you with?", subtitle: "Describe your needs and AI will assist you" },
    ja: { title: "何かお手伝いできますか？", subtitle: "ご要望を入力してください。AIがサポートします" },
    ko: { title: "무엇을 도와드릴까요?", subtitle: "필요한 것을 설명해 주세요. AI가 도와드립니다" },
    es: { title: "¿En qué puedo ayudarte?", subtitle: "Describe lo que necesitas y la IA te asistirá" },
    fr: { title: "Comment puis-je vous aider ?", subtitle: "Décrivez vos besoins, l'IA vous assistera" },
  };

  const emptyState: ChatPanelEmptyState = useMemo(() => {
    const i = EMPTY_STATE_I18N[lang] ?? EMPTY_STATE_I18N.en;
    return {
      icon: (
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <BotMessageSquare className="h-8 w-8" />
        </div>
      ),
      title: i.title,
      subtitle: i.subtitle,
    };
  }, [lang]);

  return (
    <main className="flex min-h-0 flex-1 flex-col p-4" ref={containerRef}>
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="text-xs text-muted-foreground mr-1">{lang.startsWith("zh") ? "功能开关：" : "Capabilities:"}</span>
        {ALL_CAPS.map((cap) => (
          <button
            key={cap}
            type="button"
            onClick={() => toggleCap(cap)}
            className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-all ${
              capOverride.includes(cap)
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border bg-transparent text-muted-foreground line-through opacity-60"
            }`}
          >
            {CAP_LABELS[cap]?.[lang.startsWith("zh") ? "zh-CN" : "en"] ?? cap}
          </button>
        ))}

        <span className="hidden sm:block h-4 w-px bg-border mx-1" />

        <button
          type="button"
          onClick={() => setReadOnly((v) => !v)}
          className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-all ${
            readOnly
              ? "border-amber-400/60 bg-amber-400/15 text-amber-600 dark:text-amber-400"
              : "border-border bg-transparent text-muted-foreground opacity-60"
          }`}
        >
          {lang.startsWith("zh") ? (readOnly ? "只读 ON" : "只读 OFF") : (readOnly ? "ReadOnly ON" : "ReadOnly OFF")}
        </button>

        <span className="hidden sm:block h-4 w-px bg-border mx-1" />

        <span className="text-xs text-muted-foreground mr-1 flex items-center gap-1">
          <Palette className="h-3 w-3" />
          {lang.startsWith("zh") ? "主题色：" : "Theme:"}
        </span>
        {THEME_PRESETS.map((preset) => (
          <button
            key={preset.color}
            type="button"
            onClick={() => setActiveTheme(activeTheme === preset.color ? "" : preset.color)}
            title={preset.name}
            className="relative h-5 w-5 rounded-full border-2 transition-all hover:scale-110"
            style={{
              backgroundColor: preset.color,
              borderColor: activeTheme === preset.color ? preset.color : "transparent",
              boxShadow: activeTheme === preset.color ? `0 0 0 2px ${preset.color}40` : "none",
            }}
          >
            {activeTheme === preset.color && (
              <span className="absolute inset-0 flex items-center justify-center text-white text-[10px] font-bold">✓</span>
            )}
          </button>
        ))}
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <ChatPanel
          projectId="demo"
          config={chatConfig}
          quickStarters={quickStarters}
          emptyState={emptyState}
          capVisibleOverride={capOverride}
          readOnly={readOnly}
          className="min-h-0 flex-1"
          renderResource={(resource: ResourceBlock) => (
            <div className="rounded-lg border border-dashed border-border bg-muted/30 p-3 mt-1.5">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {resource.resourceType}
                </span>
              </div>
              <pre className="text-xs text-foreground/70 overflow-auto max-h-48 whitespace-pre-wrap">
                {JSON.stringify(resource.data, null, 2)}
              </pre>
            </div>
          )}
        />
      </div>
    </main>
  );
}
