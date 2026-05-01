import { useEffect, useState, type CSSProperties } from "react";
import { Check, Loader2, Download, ImageIcon, ZoomIn } from "lucide-react";
import type { ImageGenerationBlock as ImageGenBlock } from "@skillpet/chat-core";
import { cn } from "@skillpet/chat-core";
import { useChatTranslation } from "../i18n";

function selectedIdsFromBlock(block: ImageGenBlock): Set<string> {
  const valid = new Set(block.images.map((img) => img.id));
  return new Set((block.selectedImageIds ?? []).filter((id: string) => valid.has(id)));
}

/** 缩略图网格：每项 96–200px 宽，列数随容器自动换行 */
const imageGridStyle: CSSProperties = {
  gridTemplateColumns: "repeat(auto-fill, minmax(96px, 200px))",
};

export interface ImageGenerationBlockProps {
  block: ImageGenBlock;
  onSubmit?: (blockId: string, selectedImageIds: string[]) => void;
  onAction?: (blockId: string, actionId: string) => void;
  onPreview?: (url: string) => void;
}

export function ImageGenerationBlock({
  block,
  onSubmit,
  onAction,
  onPreview,
}: ImageGenerationBlockProps) {
  const { t } = useChatTranslation();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => selectedIdsFromBlock(block));
  const isCompleted = block.status === "selected" || block.status === "actioned";
  const completedSelectedCount =
    selectedIds.size > 0 ? selectedIds.size : block.selectedImageIds?.length ?? 0;

  useEffect(() => {
    setSelectedIds(selectedIdsFromBlock(block));
  }, [block.id, block.selectedImageIds]);

  if (block.status === "generating") {
    return (
      <div className="w-full min-w-0 rounded-xl border border-border bg-muted/30 p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ImageIcon className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{t("chat.imageGenerating")}</span>
        </div>
        {block.prompt ? (
          <div className="mt-2 space-y-0.5">
            <p className="text-[11px] font-medium text-muted-foreground">{t("chat.imageGenPrompt")}</p>
            <p className="text-xs text-muted-foreground/70 italic">
              {'"'}{block.prompt}{'"'}
            </p>
          </div>
        ) : null}
        <div
          className="mt-3 grid w-full min-w-0 gap-2"
          style={imageGridStyle}
          role="group"
          aria-label={t("chat.imageChoiceGrid")}
        >
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="aspect-square min-w-0 rounded-lg bg-muted animate-pulse" aria-hidden />
          ))}
        </div>
      </div>
    );
  }

  const selectable = !isCompleted && block.mode !== "display";
  const selectionRole =
    selectable && block.mode === "single_select"
      ? "radio"
      : selectable && block.mode === "multi_select"
        ? "checkbox"
        : undefined;

  return (
    <div className="w-full min-w-0 rounded-xl border border-border bg-muted/30 p-2.5">
      {block.prompt ? (
        <div className="mb-2 space-y-0.5 px-1">
          <p className="text-[11px] font-medium text-muted-foreground">{t("chat.imageGenPrompt")}</p>
          <p className="text-xs text-muted-foreground/70 italic">
            {'"'}{block.prompt}{'"'}
          </p>
        </div>
      ) : null}

      <div
        className="grid w-full min-w-0 gap-2"
        style={imageGridStyle}
        role="group"
        aria-label={t("chat.imageChoiceGrid")}
      >
        {block.images.map((img) => {
          const isSelected = selectedIds.has(img.id);
          return (
            <div
              key={img.id}
              role={selectionRole || "img"}
              aria-checked={selectionRole ? isSelected : undefined}
              tabIndex={0}
              onClick={() => {
                if (block.mode === "display" || isCompleted) {
                  onPreview?.(img.url);
                } else if (block.mode === "single_select") {
                  setSelectedIds(new Set([img.id]));
                } else {
                  setSelectedIds((prev) => {
                    const next = new Set(prev);
                    if (next.has(img.id)) next.delete(img.id);
                    else if (!block.maxSelect || next.size < block.maxSelect) next.add(img.id);
                    return next;
                  });
                }
              }}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.currentTarget.click(); } }}
              className={cn(
                "relative min-w-0 cursor-pointer rounded-lg",
                isSelected ? "ring-2 ring-primary ring-offset-2" : "",
                block.mode !== "display" && isCompleted && !isSelected ? "opacity-70" : "",
              )}
              style={{ borderStyle: "none" }}
            >
              {selectable ? (
                <button
                  type="button"
                  className="absolute left-1 top-1 z-10 flex h-7 w-7 items-center justify-center rounded-md border border-border bg-card/95 text-foreground shadow-sm backdrop-blur-sm hover:bg-muted"
                  title={t("chat.expandImagePreview")}
                  aria-label={t("chat.expandImagePreview")}
                  onClick={(e) => {
                    e.stopPropagation();
                    onPreview?.(img.url);
                  }}
                >
                  <ZoomIn className="h-3.5 w-3.5" aria-hidden />
                </button>
              ) : null}
              <img
                src={img.url}
                alt={img.label || ""}
                style={{
                  width: "100%",
                  maxWidth: "100%",
                  minWidth: 0,
                  aspectRatio: "1/1",
                  objectFit: "cover",
                  borderRadius: "var(--skillpet-chat-radius)",
                  display: "block",
                  border: "none",
                }}
              />
              {isSelected ? (
                <div className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                  <Check className="h-3 w-3" />
                </div>
              ) : null}
              {img.label ? (
                <div className="absolute bottom-0 left-0 right-0 rounded-b-md bg-gradient-to-t from-black/50 via-black/20 to-transparent px-2 pb-1.5 pt-5 pointer-events-none">
                  <span className="text-[11px] text-white/90 line-clamp-1">{img.label}</span>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {block.mode !== "display" && !isCompleted ? (
        <div className="mt-3 flex items-center justify-between gap-2 px-1">
          <span className="text-xs text-muted-foreground">
            {block.mode === "single_select"
              ? t("chat.imageSelectSingle")
              : t("chat.imageSelectHint")
                  .replace("{min}", String(block.minSelect ?? 1))
                  .replace("{max}", String(block.maxSelect ?? block.images.length))}
          </span>
          <button
            type="button"
            disabled={
              selectedIds.size === 0 ||
              (block.minSelect != null && selectedIds.size < block.minSelect)
            }
            onClick={() => onSubmit?.(block.id, Array.from(selectedIds))}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
          >
            <Check className="h-3.5 w-3.5" />
            {t("chat.imageSelectConfirm")}
          </button>
        </div>
      ) : null}

      {isCompleted && block.mode !== "display" ? (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 px-1">
          <Check className="h-3.5 w-3.5" />
          {completedSelectedCount > 0 ? (
            <>
              {t("chat.imageSelected")} ({completedSelectedCount})
            </>
          ) : (
            t("chat.imageSelected")
          )}
        </div>
      ) : null}

      {block.actions?.length ? (
        <div className="mt-2 flex flex-wrap gap-2 px-1">
          {block.actions.map((action) => (
            <button
              key={action.id}
              type="button"
              title={action.id === "download" ? t("chat.imageDownload") : undefined}
              aria-label={action.id === "download" ? t("chat.imageDownload") : action.label}
              onClick={() => onAction?.(block.id, action.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                action.variant === "destructive"
                  ? "border-destructive/30 text-destructive hover:bg-destructive/10"
                  : "border-border text-foreground hover:bg-muted",
              )}
            >
              {action.id === "download" ? <Download className="h-3 w-3" /> : null}
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
