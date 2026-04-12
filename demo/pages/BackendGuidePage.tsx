import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function BackendGuidePage() {
  const [md, setMd] = useState("");

  useEffect(() => {
    fetch("/backend-guide.md")
      .then((r) => r.text())
      .then(setMd)
      .catch(() => setMd("# Failed to load document"));
  }, []);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-7xl mx-auto px-6 py-8 sm:px-8 lg:px-12">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">后端对接开发手册</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            HTTP 接口规范、SSE 事件协议、消息存储格式、System Prompt 最佳实践。
          </p>
          <p className="mt-2 inline-flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            <span>AI / 机器可读版本：</span>
            <a href="/backend-guide.md" target="_blank" className="font-mono text-primary hover:underline">/backend-guide.md</a>
          </p>
        </div>
        <article className="prose prose-base dark:prose-invert max-w-none prose-table:w-full prose-pre:max-w-full prose-pre:overflow-x-auto">
          {md ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{md}</ReactMarkdown> : (
            <p className="text-muted-foreground text-sm animate-pulse">Loading…</p>
          )}
        </article>
      </div>
    </div>
  );
}
