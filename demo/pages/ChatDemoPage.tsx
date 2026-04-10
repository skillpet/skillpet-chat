import { useMemo, useState } from "react";
import { BotMessageSquare } from "lucide-react";
import {
  ChatPanel,
  type ChatPanelConfig,
  type ChatPanelEmptyState,
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

const ALL_CAPS = ["thinking", "search", "attachment", "reset"] as const;

const CAP_LABELS: Record<string, Record<string, string>> = {
  thinking: { "zh-CN": "深度思考", en: "Thinking" },
  search: { "zh-CN": "联网搜索", en: "Search" },
  attachment: { "zh-CN": "附件", en: "Attachment" },
  reset: { "zh-CN": "重置", en: "Reset" },
};

export default function ChatDemoPage() {
  const lang = useLang();
  const [capOverride, setCapOverride] = useState<string[]>([...ALL_CAPS]);

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
    <main className="flex min-h-0 flex-1 flex-col p-4">
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
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <ChatPanel
          projectId="demo"
          config={chatConfig}
          quickStarters={quickStarters}
          emptyState={emptyState}
          capVisibleOverride={capOverride}
          className="min-h-0 flex-1"
        />
      </div>
    </main>
  );
}
