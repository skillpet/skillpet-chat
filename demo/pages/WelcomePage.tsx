import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  MessageSquare,
  Zap,
  Globe,
  Layers,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useLang } from "../App";

interface WelcomeStrings {
  tagline: string;
  desc: string;
  badge: string;
  enterDemo: string;
  apiDoc: string;
  tipTool: [string, string];
  tipForm: [string, string];
  tipPlan: [string, string];
  features: { title: string; desc: string }[];
}

const ICON_MAP = [Layers, Zap, Globe, MessageSquare] as const;

const I18N: Record<string, WelcomeStrings> = {
  "zh-CN": {
    tagline: "SSE 流式 AI 对话面板组件库 — 支持 React & Vue 3，",
    desc: "开箱即用、可深度定制。",
    badge: "v0.3 · Mock SSE Demo",
    enterDemo: "进入演示",
    apiDoc: "API 文档",
    tipTool: ["工具", "tool"],
    tipForm: ["表单", "form"],
    tipPlan: ["方案", "plan"],
    features: [
      { title: "React + Vue 3", desc: "单包多入口，两套框架完全对等的 UI 组件" },
      { title: "SSE 流式传输", desc: "实时流式 token 输出、工具调用、子智能体" },
      { title: "i18n 七语言", desc: "内置简/繁中、英、日、韩、西、法语支持" },
      { title: "丰富交互", desc: "表单提问、方案选择、斜杠指令、Markdown 渲染" },
    ],
  },
  "zh-TW": {
    tagline: "SSE 串流 AI 對話面板元件庫 — 支援 React & Vue 3，",
    desc: "開箱即用、可深度自訂。",
    badge: "v0.3 · Mock SSE Demo",
    enterDemo: "進入演示",
    apiDoc: "API 文件",
    tipTool: ["工具", "tool"],
    tipForm: ["表單", "form"],
    tipPlan: ["方案", "plan"],
    features: [
      { title: "React + Vue 3", desc: "單包多入口，兩套框架完全對等的 UI 元件" },
      { title: "SSE 串流傳輸", desc: "即時串流 token 輸出、工具呼叫、子智能體" },
      { title: "i18n 七語言", desc: "內建簡/繁中、英、日、韓、西、法語支援" },
      { title: "豐富互動", desc: "表單提問、方案選擇、斜線指令、Markdown 渲染" },
    ],
  },
  en: {
    tagline: "SSE streaming AI chat panel component library — React & Vue 3,",
    desc: "ready to use, fully customizable.",
    badge: "v0.3 · Mock SSE Demo",
    enterDemo: "Enter Demo",
    apiDoc: "API Docs",
    tipTool: ["tool", "工具"],
    tipForm: ["form", "表单"],
    tipPlan: ["plan", "方案"],
    features: [
      { title: "React + Vue 3", desc: "Single package, dual-framework UI components" },
      { title: "SSE Streaming", desc: "Real-time token streaming, tool calls, sub-agents" },
      { title: "i18n 7 Languages", desc: "Built-in zh-CN/TW, en, ja, ko, es, fr" },
      { title: "Rich Interaction", desc: "Form questions, plan selection, slash commands, Markdown" },
    ],
  },
  ja: {
    tagline: "SSE ストリーミング AI チャットパネルコンポーネント — React & Vue 3 対応、",
    desc: "すぐ使える、高度にカスタマイズ可能。",
    badge: "v0.3 · Mock SSE Demo",
    enterDemo: "デモへ",
    apiDoc: "API ドキュメント",
    tipTool: ["ツール", "tool"],
    tipForm: ["フォーム", "form"],
    tipPlan: ["プラン", "plan"],
    features: [
      { title: "React + Vue 3", desc: "1パッケージで両フレームワーク対応の UI" },
      { title: "SSE ストリーミング", desc: "リアルタイムトークン出力、ツール呼び出し、サブエージェント" },
      { title: "i18n 7言語", desc: "中(簡/繁)・英・日・韓・西・仏を内蔵" },
      { title: "リッチな操作", desc: "フォーム質問、プラン選択、スラッシュコマンド、Markdown" },
    ],
  },
  ko: {
    tagline: "SSE 스트리밍 AI 채팅 패널 컴포넌트 — React & Vue 3 지원,",
    desc: "바로 사용 가능, 완전 커스터마이징.",
    badge: "v0.3 · Mock SSE Demo",
    enterDemo: "데모 시작",
    apiDoc: "API 문서",
    tipTool: ["도구", "tool"],
    tipForm: ["양식", "form"],
    tipPlan: ["플랜", "plan"],
    features: [
      { title: "React + Vue 3", desc: "하나의 패키지로 두 프레임워크 UI 지원" },
      { title: "SSE 스트리밍", desc: "실시간 토큰 출력, 도구 호출, 서브 에이전트" },
      { title: "i18n 7개 언어", desc: "중(간/번)·영·일·한·서·불 내장" },
      { title: "풍부한 인터랙션", desc: "양식 질문, 플랜 선택, 슬래시 명령, Markdown" },
    ],
  },
  es: {
    tagline: "Biblioteca de componentes de chat AI con SSE — React & Vue 3,",
    desc: "lista para usar, totalmente personalizable.",
    badge: "v0.3 · Mock SSE Demo",
    enterDemo: "Entrar al Demo",
    apiDoc: "Documentación API",
    tipTool: ["herramienta", "tool"],
    tipForm: ["formulario", "form"],
    tipPlan: ["plan", "plan"],
    features: [
      { title: "React + Vue 3", desc: "Un paquete, componentes UI para ambos frameworks" },
      { title: "SSE Streaming", desc: "Salida de tokens en tiempo real, llamadas a herramientas, sub-agentes" },
      { title: "i18n 7 Idiomas", desc: "zh-CN/TW, en, ja, ko, es, fr integrados" },
      { title: "Interacción Rica", desc: "Formularios, selección de plan, comandos slash, Markdown" },
    ],
  },
  fr: {
    tagline: "Bibliothèque de composants de chat IA SSE — React & Vue 3,",
    desc: "prête à l'emploi, entièrement personnalisable.",
    badge: "v0.3 · Mock SSE Demo",
    enterDemo: "Entrer dans la Démo",
    apiDoc: "Documentation API",
    tipTool: ["outil", "tool"],
    tipForm: ["formulaire", "form"],
    tipPlan: ["plan", "plan"],
    features: [
      { title: "React + Vue 3", desc: "Un package, composants UI pour les deux frameworks" },
      { title: "SSE Streaming", desc: "Sortie de tokens en temps réel, appels d'outils, sous-agents" },
      { title: "i18n 7 Langues", desc: "zh-CN/TW, en, ja, ko, es, fr intégrés" },
      { title: "Interaction Riche", desc: "Formulaires, sélection de plan, commandes slash, Markdown" },
    ],
  },
};

function getTip(label: string, keyword: string) {
  return (
    <span>
      输入{" "}
      <code className="rounded bg-muted px-1 py-0.5 font-mono text-foreground/70">
        {keyword}
      </code>{" "}
      或{" "}
      <code className="rounded bg-muted px-1 py-0.5 font-mono text-foreground/70">
        {label}
      </code>
    </span>
  );
}

export default function WelcomePage() {
  const lang = useLang();

  const t = useMemo(() => I18N[lang] ?? I18N.en!, [lang]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-12 overflow-y-auto">
      <div className="relative flex flex-col items-center gap-3 text-center">
        <div className="absolute -top-6 -left-6 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
        <div className="absolute -bottom-4 -right-8 h-20 w-20 rounded-full bg-primary/15 blur-xl" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 shadow-lg shadow-primary/10">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <h1 className="relative text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          @skillpet/chat
        </h1>
        <p className="max-w-md text-base text-muted-foreground leading-relaxed">
          {t.tagline}
          <br className="hidden sm:inline" />
          {t.desc}
        </p>
        <span className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {t.badge}
        </span>
      </div>

      <div className="grid w-full max-w-lg grid-cols-1 gap-3 sm:grid-cols-2">
        {t.features.map((f, i) => {
          const Icon = ICON_MAP[i]!;
          return (
            <div
              key={f.title}
              className="group flex items-start gap-3 rounded-xl border border-border/60 bg-card/50 p-4 transition-colors hover:border-primary/30 hover:bg-card"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                <Icon className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{f.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                  {f.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/demo"
          className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30 hover:brightness-110 active:scale-[0.97]"
        >
          {t.enterDemo}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
        <Link
          to="/api"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-6 py-3 text-sm font-medium text-foreground shadow-sm transition-all hover:bg-muted active:scale-[0.97]"
        >
          {t.apiDoc}
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground/60">
        {getTip(t.tipTool[1], t.tipTool[0])}
        <span>·</span>
        {getTip(t.tipForm[1], t.tipForm[0])}
        <span>·</span>
        {getTip(t.tipPlan[1], t.tipPlan[0])}
      </div>
    </div>
  );
}
