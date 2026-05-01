<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { Check, Loader2, Download, ImageIcon, ZoomIn } from "lucide-vue-next";
import type { ImageGenerationBlock as ImageGenBlock } from "@skillpet/chat-core";
import { cn } from "@skillpet/chat-core";
import { useChatTranslation } from "../i18n";

function selectedIdsFromBlock(block: ImageGenBlock): Set<string> {
  const valid = new Set(block.images.map((img) => img.id));
  return new Set((block.selectedImageIds ?? []).filter((id: string) => valid.has(id)));
}

const props = defineProps<{
  block: ImageGenBlock;
}>();

const emit = defineEmits<{
  submit: [blockId: string, selectedImageIds: string[]];
  action: [blockId: string, actionId: string];
  preview: [url: string];
}>();

const { t } = useChatTranslation();

const selectedIds = ref(selectedIdsFromBlock(props.block));

const isCompleted = computed(
  () => props.block.status === "selected" || props.block.status === "actioned",
);

const completedSelectedCount = computed(() =>
  selectedIds.value.size > 0 ? selectedIds.value.size : props.block.selectedImageIds?.length ?? 0,
);

const selectable = computed(
  () => !isCompleted.value && props.block.mode !== "display",
);

const selectionRole = computed((): "radio" | "checkbox" | undefined => {
  if (!selectable.value) return undefined;
  if (props.block.mode === "single_select") return "radio";
  if (props.block.mode === "multi_select") return "checkbox";
  return undefined;
});

/** 每项 96–200px 宽，列数随容器自动换行 */
const imageGridStyle = {
  gridTemplateColumns: "repeat(auto-fill, minmax(96px, 200px))",
} as const;

watch(
  () => [props.block.id, props.block.selectedImageIds] as const,
  () => {
    selectedIds.value = selectedIdsFromBlock(props.block);
  },
);

function onImageClick(img: ImageGenBlock["images"][number]) {
  if (props.block.mode === "display" || isCompleted.value) {
    emit("preview", img.url);
  } else if (props.block.mode === "single_select") {
    selectedIds.value = new Set([img.id]);
  } else {
    const next = new Set(selectedIds.value);
    if (next.has(img.id)) next.delete(img.id);
    else if (!props.block.maxSelect || next.size < props.block.maxSelect) next.add(img.id);
    selectedIds.value = next;
  }
}

function onSubmitClick() {
  emit("submit", props.block.id, Array.from(selectedIds.value));
}
</script>

<template>
  <div v-if="block.status === 'generating'" class="rounded-xl border border-border bg-muted/30 p-4">
    <div class="flex items-center gap-2 text-sm text-muted-foreground">
      <ImageIcon class="h-4 w-4 shrink-0 opacity-70" aria-hidden="true" />
      <Loader2 class="h-4 w-4 animate-spin" />
      <span>{{ t("chat.imageGenerating") }}</span>
    </div>
    <div v-if="block.prompt" class="mt-2 space-y-0.5">
      <p class="text-[11px] font-medium text-muted-foreground">{{ t("chat.imageGenPrompt") }}</p>
      <p class="text-xs text-muted-foreground/70 italic">"{{ block.prompt }}"</p>
    </div>
    <div
      class="mt-3 grid w-full gap-2"
      :style="imageGridStyle"
      role="group"
      :aria-label="t('chat.imageChoiceGrid')"
    >
      <div
        v-for="i in [0, 1, 2, 3]"
        :key="i"
        class="aspect-square rounded-lg bg-muted animate-pulse"
        aria-hidden="true"
      />
    </div>
  </div>

  <div v-else class="rounded-xl border border-border bg-muted/30 p-2.5">
    <div v-if="block.prompt" class="mb-2 space-y-0.5 px-1">
      <p class="text-[11px] font-medium text-muted-foreground">{{ t("chat.imageGenPrompt") }}</p>
      <p class="text-xs text-muted-foreground/70 italic">"{{ block.prompt }}"</p>
    </div>

    <div
      class="grid w-full gap-2"
      :style="imageGridStyle"
      role="group"
      :aria-label="t('chat.imageChoiceGrid')"
    >
      <div
        v-for="img in block.images"
        :key="img.id"
        :role="selectionRole || 'img'"
        :aria-checked="selectionRole ? selectedIds.has(img.id) : undefined"
        tabindex="0"
        :class="
          cn(
            'relative cursor-pointer rounded-lg',
            selectedIds.has(img.id)
              ? 'ring-2 ring-primary ring-offset-2'
              : '',
            block.mode !== 'display' && isCompleted && !selectedIds.has(img.id)
              ? 'opacity-70'
              : '',
          )
        "
        :style="{ borderStyle: 'none' }"
        @click="onImageClick(img)"
        @keydown.enter.prevent="($event.currentTarget as HTMLElement)?.click()"
        @keydown.space.prevent="($event.currentTarget as HTMLElement)?.click()"
      >
        <button
          v-if="selectable"
          type="button"
          class="absolute left-1 top-1 z-10 flex h-7 w-7 items-center justify-center rounded-md border border-border bg-card/95 text-foreground shadow-sm backdrop-blur-sm hover:bg-muted"
          :title="t('chat.expandImagePreview')"
          :aria-label="t('chat.expandImagePreview')"
          @click.stop="emit('preview', img.url)"
        >
          <ZoomIn class="h-3.5 w-3.5" aria-hidden="true" />
        </button>
        <img
          :src="img.url"
          :alt="img.label || ''"
          :style="{
            width: '100%',
            aspectRatio: '1/1',
            objectFit: 'cover',
            borderRadius: 'var(--skillpet-chat-radius)',
            display: 'block',
            border: 'none',
          }"
        />
        <div
          v-if="selectedIds.has(img.id)"
          class="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow"
        >
          <Check class="h-3 w-3" />
        </div>
        <div
          v-if="img.label"
          class="absolute bottom-0 left-0 right-0 rounded-b-md bg-gradient-to-t from-black/50 via-black/20 to-transparent px-2 pb-1.5 pt-5 pointer-events-none"
        >
          <span class="text-[11px] text-white/90 line-clamp-1">{{ img.label }}</span>
        </div>
      </div>
    </div>

    <div
      v-if="block.mode !== 'display' && !isCompleted"
      class="mt-3 flex items-center justify-between gap-2"
    >
      <span class="text-xs text-muted-foreground">
        <template v-if="block.mode === 'single_select'">{{ t("chat.imageSelectSingle") }}</template>
        <template v-else>
          {{
            t("chat.imageSelectHint")
              .replace("{min}", String(block.minSelect ?? 1))
              .replace("{max}", String(block.maxSelect ?? block.images.length))
          }}
        </template>
      </span>
      <button
        type="button"
        :disabled="
          selectedIds.size === 0 || (block.minSelect != null && selectedIds.size < block.minSelect)
        "
        class="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
        @click="onSubmitClick"
      >
        <Check class="h-3.5 w-3.5" />
        {{ t("chat.imageSelectConfirm") }}
      </button>
    </div>

    <div
      v-if="isCompleted && block.mode !== 'display'"
      class="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400"
    >
      <Check class="h-3.5 w-3.5" />
      <span v-if="completedSelectedCount > 0">
        {{ t("chat.imageSelected") }} ({{ completedSelectedCount }})
      </span>
      <span v-else>{{ t("chat.imageSelected") }}</span>
    </div>

    <div v-if="block.actions?.length" class="mt-2 flex flex-wrap gap-2">
      <button
        v-for="action in block.actions"
        :key="action.id"
        type="button"
        :title="action.id === 'download' ? t('chat.imageDownload') : undefined"
        :aria-label="action.id === 'download' ? t('chat.imageDownload') : action.label"
        :class="
          cn(
            'inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors',
            action.variant === 'destructive'
              ? 'border-destructive/30 text-destructive hover:bg-destructive/10'
              : 'border-border text-foreground hover:bg-muted',
          )
        "
        @click="emit('action', block.id, action.id)"
      >
        <Download v-if="action.id === 'download'" class="h-3 w-3" />
        {{ action.label }}
      </button>
    </div>
  </div>
</template>
