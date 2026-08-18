<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { renderFormulaHtml } from "@chenyomi/leafer-htmltext-formula";
import { formulaLibrary, type FormulaItem } from "../formulaLibrary";

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
  pick: [tex: string];
}>();

const keyword = ref("");
const customLatex = ref("");
const activeCategoryId = ref(formulaLibrary[0]?.id ?? "common");
const searchInputRef = ref<HTMLInputElement | null>(null);
const previewCache = new Map<string, string>();

const activeCategory = computed(
  () => formulaLibrary.find((item) => item.id === activeCategoryId.value) ?? formulaLibrary[0],
);

const filteredItems = computed<FormulaItem[]>(() => {
  const query = keyword.value.trim().toLowerCase();
  if (!query) return activeCategory.value?.items ?? [];
  return formulaLibrary.flatMap((category) =>
    category.items.filter(
      (item) =>
        item.label.toLowerCase().includes(query) ||
        item.tex.toLowerCase().includes(query) ||
        category.name.toLowerCase().includes(query),
    ),
  );
});

const previewHtml = (tex: string) => {
  const cached = previewCache.get(tex);
  if (cached) return cached;
  const html = renderFormulaHtml(`\\displaystyle ${tex}`);
  previewCache.set(tex, html);
  return html;
};

const pick = (tex: string) => {
  const value = tex.trim();
  if (!value) return;
  emit("pick", value);
};

const pickCustom = () => pick(customLatex.value);

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape") emit("close");
};

watch(
  () => props.open,
  async (open) => {
    if (!open) return;
    keyword.value = "";
    await nextTick();
    searchInputRef.value?.focus();
  },
);

onMounted(() => window.addEventListener("keydown", onKeydown));
onUnmounted(() => window.removeEventListener("keydown", onKeydown));
</script>

<template>
  <div v-if="open" class="formula-picker-overlay" @click.self="emit('close')">
    <div class="formula-picker" role="dialog" aria-modal="true" aria-labelledby="formula-picker-title">
      <header class="formula-picker-header">
        <div>
          <h3 id="formula-picker-title">公式库</h3>
          <p>覆盖 KaTeX 常用结构、符号与经典公式。选中后插入到当前文本，未选中则新建公式文本。</p>
        </div>
        <button class="formula-picker-close" type="button" aria-label="关闭" @click="emit('close')">×</button>
      </header>

      <div class="formula-picker-toolbar">
        <input
          ref="searchInputRef"
          v-model="keyword"
          class="formula-search"
          type="search"
          placeholder="搜索名称或 LaTeX，如 积分、frac、sigma"
        />
        <div class="formula-cats" v-show="!keyword.trim()">
          <button
            v-for="category in formulaLibrary"
            :key="category.id"
            type="button"
            class="formula-cat"
            :class="{ active: category.id === activeCategoryId }"
            @click="activeCategoryId = category.id"
          >
            {{ category.name }}
          </button>
        </div>
      </div>

      <div class="formula-grid-wrap">
        <p v-if="keyword.trim()" class="formula-result-hint">搜索结果 {{ filteredItems.length }} 项</p>
        <div class="formula-grid">
          <button
            v-for="item in filteredItems"
            :key="`${item.label}-${item.tex}`"
            type="button"
            class="formula-tile"
            :class="{ wide: item.wide }"
            :title="`${item.label}\n${item.tex}`"
            @click="pick(item.tex)"
          >
            <span class="formula-preview" v-html="previewHtml(item.tex)"></span>
            <span class="formula-caption">{{ item.label }}</span>
          </button>
        </div>
        <p v-if="!filteredItems.length" class="formula-empty">没有匹配的公式，可在下方输入自定义 LaTeX</p>
      </div>

      <footer class="formula-picker-footer">
        <label class="formula-custom-label" for="custom-latex">自定义 LaTeX</label>
        <input
          id="custom-latex"
          v-model="customLatex"
          class="formula-custom-input"
          type="text"
          placeholder="例如 E=mc^2 或 \frac{a}{b}"
          @keydown.enter.prevent="pickCustom"
        />
        <button class="formula-custom-btn" type="button" @click="pickCustom">插入</button>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.formula-picker-overlay {
  position: fixed;
  inset: 0;
  z-index: 220;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(0, 0, 0, 0.72);
  backdrop-filter: blur(10px);
  z-index: 10002;
}
.formula-picker {
  display: flex;
  flex-direction: column;
  width: min(960px, 100%);
  height: min(680px, 92vh);
  border: 1px solid rgba(91, 91, 214, 0.45);
  border-radius: 16px;
  background: rgba(18, 18, 24, 0.98);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.55);
  overflow: hidden;
}
.formula-picker-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.formula-picker-header h3 {
  margin: 0 0 6px;
  color: #9999ff;
  font-size: 18px;
  font-weight: 700;
}
.formula-picker-header p {
  margin: 0;
  color: #888;
  font-size: 12px;
  line-height: 1.55;
}
.formula-picker-close {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.78);
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
}
.formula-picker-close:hover {
  color: #fff;
  border-color: rgba(91, 91, 214, 0.6);
}
.formula-picker-toolbar {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 20px 0;
}
.formula-search {
  width: 100%;
  box-sizing: border-box;
  padding: 8px 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  color: #eee;
  font-size: 13px;
  outline: none;
}
.formula-search:focus {
  border-color: rgba(91, 91, 214, 0.7);
}
.formula-cats {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 8px;
  scrollbar-width: thin;
}
.formula-cat {
  flex-shrink: 0;
  padding: 5px 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.04);
  color: #bbb;
  font-size: 12px;
  cursor: pointer;
}
.formula-cat.active,
.formula-cat:hover {
  background: rgba(47, 115, 184, 0.28);
  border-color: rgba(47, 115, 184, 0.6);
  color: #fff;
}
.formula-grid-wrap {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 8px 20px 12px;
}
.formula-result-hint,
.formula-empty {
  margin: 0 0 8px;
  color: #777;
  font-size: 12px;
}
.formula-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(108px, 1fr));
  gap: 8px;
}
.formula-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 78px;
  padding: 8px 6px 6px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  background: #f4f5f8;
  color: #222;
  cursor: pointer;
}
.formula-tile.wide {
  grid-column: span 2;
}
.formula-tile:hover {
  border-color: rgba(47, 115, 184, 0.7);
  box-shadow: 0 0 0 2px rgba(47, 115, 184, 0.25);
}
.formula-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 36px;
  overflow: hidden;
}
.formula-preview :deep(.ql-formula) {
  display: inline-block;
  max-width: 100%;
}
.formula-preview :deep(.katex) {
  font-size: 1.05em;
  color: #1b1b1f;
}
.formula-caption {
  color: #666;
  font-size: 11px;
  line-height: 1.2;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.formula-picker-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}
.formula-custom-label {
  flex-shrink: 0;
  color: #888;
  font-size: 12px;
}
.formula-custom-input {
  flex: 1;
  min-width: 0;
  padding: 8px 10px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  color: #eee;
  font-family: "SF Mono", ui-monospace, monospace;
  font-size: 12px;
  outline: none;
}
.formula-custom-input:focus {
  border-color: rgba(91, 91, 214, 0.7);
}
.formula-custom-btn {
  flex-shrink: 0;
  padding: 8px 14px;
  border: 1px solid rgba(47, 115, 184, 0.5);
  border-radius: 8px;
  background: rgba(47, 115, 184, 0.28);
  color: #7bc0ff;
  font-size: 12px;
  cursor: pointer;
}
.formula-custom-btn:hover {
  background: rgba(47, 115, 184, 0.45);
  color: #fff;
}

@media (max-width: 720px) {
  .formula-tile.wide {
    grid-column: span 1;
  }
  .formula-picker-footer {
    flex-wrap: wrap;
  }
  .formula-custom-label {
    width: 100%;
  }
}
</style>
