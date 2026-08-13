<template>
  <div class="detail" v-if="skill">
    <el-button class="back" text @click="$router.push('/')">
      <el-icon><ArrowLeft /></el-icon> 返回技能大厅
    </el-button>

    <section class="head">
      <img class="logo" :src="skill.logo_url" :alt="skill.vendor_name" />
      <div class="head-info">
        <div class="head-row">
          <h1 class="name">{{ skill.name }}</h1>
          <div class="stage-chip" :style="{ color: skill.stage.color, borderColor: skill.stage.color, background: skill.stage.color + '1a' }">
            {{ skill.stage.icon }} Boss Lv.{{ skill.difficulty_lv }} · {{ skill.stage.name }}
          </div>
        </div>
        <div class="meta">
          <span class="vendor">{{ skill.vendor_name }}</span>
          <span class="dot">·</span>
          <span>重要性</span>
          <span class="imp">{{ skill.importance.score.toFixed(1) }}/10</span>
          <span class="dot">·</span>
          <span>{{ skill.stage.desc }}</span>
        </div>
        <div class="tags">
          <el-tag v-for="t in skill.category_tags" :key="t.key" type="info" effect="plain" size="small">{{ t.label }}</el-tag>
        </div>
      </div>
    </section>

    <section class="doc">
      <div class="doc-card">
        <h2 class="doc-title">📌 技能简介</h2>
        <p class="doc-text">{{ skill.doc.summary }}</p>
      </div>

      <div class="doc-card">
        <h2 class="doc-title">🔗 官方入口与生态</h2>
        <div class="links">
          <el-button type="primary" tag="a" :href="skill.doc.official_url" target="_blank" rel="noopener">
            <el-icon style="margin-right:4px"><Link /></el-icon> 官方文档
          </el-button>
          <el-button tag="a" :href="skill.doc.repo_url" target="_blank" rel="noopener">
            <el-icon style="margin-right:4px"><Share /></el-icon> 开源地址
          </el-button>
        </div>
        <p class="doc-text eco">{{ skill.doc.ecosystem }}</p>
      </div>

      <div class="doc-card">
        <h2 class="doc-title">🚀 Hello World 入门</h2>
        <pre class="code-block">{{ skill.doc.hello_world }}</pre>
      </div>

      <div class="doc-card prompt-card">
        <div class="prompt-head">
          <h2 class="doc-title">✨ 学习提示词(复制后交给你的 AI)</h2>
          <el-button type="warning" size="small" :icon="'CopyDocument'" @click="copyPrompt">复制提示词</el-button>
        </div>
        <p class="prompt-text">{{ skill.doc.learning_prompt }}</p>
        <el-alert type="success" :closable="false" show-icon title="提示:把这段提示词发给任何 AI 助手,即可获得本技能的个性化陪练。" class="prompt-tip" />
      </div>

      <div class="doc-card" v-if="skill.related_news && skill.related_news.length">
        <h2 class="doc-title">📰 相关资讯</h2>
        <ul class="news-list">
          <li v-for="(n, i) in skill.related_news" :key="i">
            <a :href="n.url" target="_blank" rel="noopener">{{ n.title }}</a>
            <span class="news-date">{{ n.date }}</span>
          </li>
        </ul>
      </div>
    </section>

    <el-alert v-if="copied" type="success" show-icon :closable="true" title="提示词已复制到剪贴板!" class="copied-tip" />
  </div>
  <el-empty v-else description="技能不存在或已下架" />
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { fetchSkill } from '../api';

const route = useRoute();
const skill = ref(null);
const copied = ref(false);

async function copyPrompt() {
  try {
    await navigator.clipboard.writeText(skill.value.doc.learning_prompt);
    copied.value = true;
    ElMessage.success('提示词已复制');
    setTimeout(() => (copied.value = false), 3000);
  } catch (e) {
    ElMessage.error('复制失败,请手动选择复制');
  }
}

onMounted(async () => {
  try {
    skill.value = await fetchSkill(route.params.slug);
  } catch (e) {
    skill.value = null;
  }
});
</script>

<style scoped>
.detail { max-width: 900px; margin: 0 auto; }
.back { color: #94a3b8; margin-bottom: 16px; }

.head { display: flex; gap: 20px; align-items: flex-start; padding: 20px; background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(148, 163, 184, 0.14); border-radius: 16px; }
.logo { width: 72px; height: 72px; border-radius: 14px; object-fit: cover; border: 1px solid #334155; }
.head-info { flex: 1; }
.head-row { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
.name { font-size: 26px; font-weight: 700; color: #f8fafc; }
.stage-chip { font-size: 13px; padding: 4px 12px; border-radius: 999px; border: 1px solid; }
.meta { margin-top: 10px; color: #94a3b8; font-size: 14px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.dot { color: #475569; }
.imp { color: #fbbf24; font-weight: 700; font-size: 15px; }
.tags { margin-top: 12px; display: flex; gap: 8px; flex-wrap: wrap; }

.doc { margin-top: 20px; display: flex; flex-direction: column; gap: 16px; }
.doc-card { background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(148, 163, 184, 0.14); border-radius: 16px; padding: 20px; }
.doc-title { font-size: 16px; color: #f8fafc; margin-bottom: 12px; }
.doc-text { font-size: 14px; line-height: 1.8; color: #cbd5e1; }
.eco { color: #94a3b8; margin-top: 12px; }
.links { display: flex; gap: 10px; }
.code-block {
  background: #0b1120; border: 1px solid #1e293b; border-radius: 10px; padding: 16px;
  font-family: 'JetBrains Mono', Consolas, monospace; font-size: 13px; line-height: 1.7; color: #7dd3fc;
  overflow-x: auto; white-space: pre;
}
.prompt-card { border-color: rgba(245, 158, 11, 0.3); }
.prompt-head { display: flex; align-items: center; justify-content: space-between; }
.prompt-text { font-size: 14px; line-height: 1.9; color: #fde68a; background: rgba(245, 158, 11, 0.06); border-radius: 10px; padding: 14px; }
.prompt-tip { margin-top: 12px; }
.news-list { list-style: none; }
.news-list li { padding: 8px 0; border-bottom: 1px solid rgba(148, 163, 184, 0.1); display: flex; justify-content: space-between; }
.news-list a { color: #38bdf8; text-decoration: none; }
.news-date { color: #64748b; font-size: 12px; }
.copied-tip { position: fixed; top: 80px; right: 24px; z-index: 99; width: 300px; }
</style>
