import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Outlet, NavLink, Link } from "react-router-dom";
import { Moon, Sun, Github, ExternalLink } from "lucide-react";
import { setChatLanguage } from "@skillpet/chat-react";

const STORAGE_LANG = "skillpet-chat-test-lang";
const STORAGE_THEME = "skillpet-chat-test-theme";

const LANG_OPTIONS: { value: string; label: string }[] = [
  { value: "zh-CN", label: "简体中文 (zh-CN)" },
  { value: "zh-TW", label: "繁體中文 (zh-TW)" },
  { value: "en", label: "English (en)" },
  { value: "ja", label: "日本語 (ja)" },
  { value: "ko", label: "한국어 (ko)" },
  { value: "es", label: "Español (es)" },
  { value: "fr", label: "Français (fr)" },
];

interface AppStrings {
  navDemo: string;
  navApi: string;
  langLabel: string;
  lightMode: string;
  darkMode: string;
}

const APP_I18N: Record<string, AppStrings> = {
  "zh-CN": { navDemo: "演示", navApi: "API", langLabel: "语言", lightMode: "切换为浅色", darkMode: "切换为深色" },
  "zh-TW": { navDemo: "演示", navApi: "API", langLabel: "語言", lightMode: "切換為淺色", darkMode: "切換為深色" },
  en:      { navDemo: "Demo", navApi: "API", langLabel: "Lang", lightMode: "Switch to light", darkMode: "Switch to dark" },
  ja:      { navDemo: "デモ", navApi: "API", langLabel: "言語", lightMode: "ライトモード", darkMode: "ダークモード" },
  ko:      { navDemo: "데모", navApi: "API", langLabel: "언어", lightMode: "라이트 모드", darkMode: "다크 모드" },
  es:      { navDemo: "Demo", navApi: "API", langLabel: "Idioma", lightMode: "Modo claro", darkMode: "Modo oscuro" },
  fr:      { navDemo: "Démo", navApi: "API", langLabel: "Langue", lightMode: "Mode clair", darkMode: "Mode sombre" },
};

function readStorage(key: string, fallback: string): string {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

const LangContext = createContext<string>("zh-CN");
export function useLang() {
  return useContext(LangContext);
}

function navCls({ isActive }: { isActive: boolean }) {
  return [
    "rounded-md px-2.5 py-1 text-sm font-medium transition-colors",
    isActive
      ? "bg-primary/10 text-primary"
      : "text-muted-foreground hover:bg-muted hover:text-foreground",
  ].join(" ");
}

export default function App() {
  const [lang, setLang] = useState(() => readStorage(STORAGE_LANG, "zh-CN"));
  const [dark, setDark] = useState(
    () => readStorage(STORAGE_THEME, "light") === "dark"
  );

  const t = useMemo(() => APP_I18N[lang] ?? APP_I18N.en!, [lang]);

  useEffect(() => {
    setChatLanguage(lang);
    document.documentElement.lang = lang;
    writeStorage(STORAGE_LANG, lang);
  }, [lang]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    writeStorage(STORAGE_THEME, dark ? "dark" : "light");
  }, [dark]);

  const toggleTheme = useCallback(() => setDark((d) => !d), []);

  return (
    <LangContext.Provider value={lang}>
      <div className="skillpet-chat flex h-screen flex-col bg-background text-foreground">
        <header className="flex shrink-0 flex-wrap items-center gap-3 border-b border-border bg-card/80 px-4 py-3 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="rounded-md border border-border bg-muted/50 px-2.5 py-1 font-mono text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              @skillpet/chat
            </Link>
          </div>

          <nav className="flex items-center gap-1">
            <NavLink to="/demo" className={navCls}>{t.navDemo}</NavLink>
            <NavLink to="/api" className={navCls}>{t.navApi}</NavLink>
          </nav>

          <div className="flex flex-1 flex-wrap items-center justify-end gap-2 sm:gap-3">
            <a
              href="https://github.com/skillpet/skillpet-chat"
              target="_blank"
              rel="noopener noreferrer"
              title="GitHub"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Github className="h-4 w-4" />
              <span className="sr-only">GitHub</span>
            </a>
            <a
              href="https://www.npmjs.com/package/@skillpet/chat-react"
              target="_blank"
              rel="noopener noreferrer"
              title="npm"
              className="inline-flex h-9 items-center gap-1 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <svg viewBox="0 0 780 250" className="h-3.5 w-auto" fill="currentColor" aria-hidden>
                <path d="M240 250h100V50h100v200h340V0H0v250h240" />
              </svg>
              <ExternalLink className="h-3 w-3" />
              <span className="sr-only">npm</span>
            </a>

            <div className="hidden sm:block h-5 w-px bg-border" />

            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="whitespace-nowrap">{t.langLabel}</span>
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                className="rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground shadow-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {LANG_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={toggleTheme}
              title={dark ? t.lightMode : t.darkMode}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {dark ? (
                <Sun className="h-4 w-4" aria-hidden />
              ) : (
                <Moon className="h-4 w-4" aria-hidden />
              )}
              <span className="sr-only">
                {dark ? t.lightMode : t.darkMode}
              </span>
            </button>
          </div>
        </header>

        <Outlet />
      </div>
    </LangContext.Provider>
  );
}
