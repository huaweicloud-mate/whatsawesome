<template>
  <div class="hall">
    <section class="hero">
      <h1 class="hero-title">技能大厅 <span class="hero-sub">Skills Arena</span></h1>
      <p class="hero-desc">发现 AI 时代最值得掌握的能力 —— 点亮它,你就是这个技能的 Boss 猎手。</p>
      <div class="hero-stats">
        <el-tag type="info" effect="dark" round>技能总数 {{ total }}</el-tag>
        <el-tag v-if="activeStage" :color="activeStage.color" effect="dark" round>
          {{ activeStage.icon }} {{ activeStage.name }} · Lv {{ activeStage.min_lv }}-{{ activeStage.max_lv }}
        </el-tag>
      </div>
    </section>

    <section class="toolbar">
      <el-input
        v-model="keyword"
        placeholder="搜索技能 / 厂商 / 简介…"
        clearable
        class="search"
        :prefix-icon="'Search'"
      />
      <div class="stage-filter">
        <span class="filter-label">境界</span>
        <button
          v-for="s in stages"
          :key="s.stage"
          class="stage-btn"
          :class="{ active: activeStage === s.stage }"
          :style="activeStage === s.stage ? { borderColor: s.color, color: s.color } : {}"
          @click="toggleStage(s.stage)"
        >
          {{ s.icon }} {{ s.name }}
        </button>
        <button v-if="activeStage" class="stage-btn clear" @click="activeStage = ''">✕ 清除</button>
      </div>
      <div class="tag-filter">
        <span class="filter-label">领域</span>
        <el-select v-model="activeTag" placeholder="全部领域" clearable class="tag-select">
          <el-option v-for="l in labels" :key="l.key" :label="l.label" :value="l.key" />
        </el-select>
      </div>
    </section>

    <el-empty v-if="!filtered.length" description="没有符合条件的技能,换个筛选试试" />
    <div class="grid" v-else>
      <div
        v-for="s in filtered"
        :key="s.slug"
        class="skill-card"
        @click="$router.push(`/skills/${s.slug}`)"
      >
        <div class="card-top">
          <img class="logo" :src="s.logo_url" :alt="s.vendor_name" loading="lazy" />
          <div class="vendor">{{ s.vendor_name }}</div>
          <div class="stage-chip" :style="{ color: s.stage.color, borderColor: s.stage.color, background: s.stage.color + '1a' }">
            {{ s.stage.icon }} Boss Lv.{{ s.difficulty_lv }} {{ s.stage.name }}
          </div>
        </div>
        <h3 class="card-name">{{ s.name }}</h3>
        <p class="card-summary">{{ s.summary }}</p>
        <div class="card-tags">
          <el-tag v-for="t in s.category_tags" :key="t.key" size="small" type="info" effect="plain" class="tag">
            {{ t.label }}
          </el-tag>
        </div>
        <div class="card-foot">
          <div class="importance" :title="s.importance.basis">
            <span class="imp-label">重要性</span>
            <el-rate
              :model-value="s.importance.score / 2"
              disabled
              :max="5"
              show-score
              score-template="{value}"
              class="imp-rate"
            />
            <span class="imp-score">{{ s.importance.score.toFixed(1) }}/10</span>
          </div>
          <el-button type="primary" size="small" text>查看 →</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { fetchSkills, fetchStages, fetchLabels } from '../api';

const skills = ref([]);
const stages = ref([]);
const labels = ref([]);
const keyword = ref('');
const activeTag = ref('');
const activeStage = ref('');

const total = computed(() => skills.value.length);

const filtered = computed(() => {
  let list = skills.value;
  if (activeStage.value) {
    const st = stages.value.find(s => s.stage === activeStage.value);
    if (st) list = list.filter(s => s.difficulty_lv >= st.min_lv && s.difficulty_lv <= st.max_lv);
  }
  if (activeTag.value) list = list.filter(s => s.category_tags.some(t => t.key === activeTag.value));
  const kw = keyword.value.trim().toLowerCase();
  if (kw) {
    list = list.filter(s =>
      s.name.toLowerCase().includes(kw) ||
      s.vendor_name.toLowerCase().includes(kw) ||
      s.summary.toLowerCase().includes(kw)
    );
  }
  return list;
});

function toggleStage(name) {
  activeStage.value = activeStage.value === name ? '' : name;
}

onMounted(async () => {
  const [s, st, l] = await Promise.all([fetchSkills(), fetchStages(), fetchLabels()]);
  skills.value = s.items;
  stages.value = st;
  labels.value = l;
});
</script>

<style scoped>
.hero { text-align: center; padding: 24px 0 28px; }
.hero-title { font-size: 34px; font-weight: 700; color: #f8fafc; letter-spacing: 1px; }
.hero-sub { font-size: 16px; color: #38bdf8; font-weight: 500; margin-left: 8px; }
.hero-desc { margin-top: 10px; color: #94a3b8; font-size: 15px; }
.hero-stats { margin-top: 14px; display: flex; gap: 10px; justify-content: center; }

.toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 14px; margin-bottom: 24px; padding: 16px; background: rgba(30, 41, 59, 0.6); border-radius: 14px; border: 1px solid rgba(148, 163, 184, 0.12); }
.search { width: 260px; }
.stage-filter { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.filter-label { font-size: 12px; color: #64748b; }
.stage-btn {
  background: transparent; border: 1px solid #334155; color: #94a3b8;
  padding: 4px 10px; border-radius: 999px; font-size: 12px; cursor: pointer; transition: all .2s;
}
.stage-btn:hover { border-color: #38bdf8; color: #38bdf8; }
.stage-btn.active { background: rgba(56, 189, 248, 0.08); }
.stage-btn.clear { border-style: dashed; }
.tag-select { width: 160px; }

.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 18px; }
.skill-card {
  background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 16px; padding: 18px; cursor: pointer; transition: transform .2s, box-shadow .2s, border-color .2s;
  display: flex; flex-direction: column; gap: 10px;
}
.skill-card:hover { transform: translateY(-4px); border-color: #38bdf8; box-shadow: 0 12px 32px rgba(56, 189, 248, 0.15); }
.card-top { display: flex; align-items: center; gap: 10px; }
.logo { width: 42px; height: 42px; border-radius: 10px; object-fit: cover; border: 1px solid #334155; }
.vendor { font-size: 13px; color: #94a3b8; flex: 1; }
.stage-chip { font-size: 11px; padding: 3px 10px; border-radius: 999px; border: 1px solid; white-space: nowrap; }
.card-name { font-size: 18px; font-weight: 600; color: #f8fafc; }
.card-summary { font-size: 13px; color: #94a3b8; line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 42px; }
.card-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.card-foot { display: flex; align-items: center; justify-content: space-between; margin-top: auto; }
.importance { display: flex; align-items: center; gap: 6px; }
.imp-label { font-size: 12px; color: #64748b; }
.imp-rate { transform: scale(0.8); transform-origin: left center; }
.imp-score { font-size: 12px; color: #fbbf24; font-weight: 600; }
</style>
