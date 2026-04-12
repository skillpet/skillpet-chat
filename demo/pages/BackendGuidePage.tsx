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
      <article className="prose prose-sm dark:prose-invert max-w-4xl mx-auto px-6 py-8 sm:px-8">
        {md ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{md}</ReactMarkdown> : (
          <p className="text-muted-foreground text-sm animate-pulse">Loading…</p>
        )}
      </article>
    </div>
  );
}
