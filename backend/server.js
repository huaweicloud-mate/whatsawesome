import express from 'express';
import cors from 'cors';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, 'data');

const skills = JSON.parse(readFileSync(join(dataDir, 'skills.json'), 'utf-8')).skills;
const stages = JSON.parse(readFileSync(join(dataDir, 'difficulty_stage.json'), 'utf-8')).stages;
const labels = JSON.parse(readFileSync(join(dataDir, 'label_dict.json'), 'utf-8')).labels;

/** 根据难度等级映射境界 */
function stageOf(lv) {
  return stages.find(s => lv >= s.min_lv && lv <= s.max_lv) || null;
}

/** 列表视图:去掉过重的 doc 富内容,保留卡片信息 */
function toCard(skill) {
  const stage = stageOf(skill.difficulty_lv);
  return {
    slug: skill.slug,
    name: skill.name,
    vendor_name: skill.vendor_name,
    vendor_type: skill.vendor_type,
    logo_url: skill.logo_url,
    category_tags: skill.category_tags,
    difficulty_lv: skill.difficulty_lv,
    stage: stage ? { name: stage.stage, icon: stage.icon, color: stage.color, desc: stage.desc } : null,
    importance: skill.importance,
    summary: skill.doc.summary,
    status: skill.status,
  };
}

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'whatsawesome-api' }));

app.get('/api/meta/stages', (_req, res) => res.json({ stages }));
app.get('/api/meta/labels', (_req, res) => res.json({ labels }));

/** 技能列表:支持 tag / min_lv / max_lv / q 筛选 */
app.get('/api/skills', (req, res) => {
  const { tag, min_lv, max_lv, q } = req.query;
  let list = skills.filter(s => s.status === 'published');

  if (tag) list = list.filter(s => s.category_tags.some(t => t.key === tag));
  if (min_lv) list = list.filter(s => s.difficulty_lv >= Number(min_lv));
  if (max_lv) list = list.filter(s => s.difficulty_lv <= Number(max_lv));
  if (q) {
    const kw = String(q).toLowerCase();
    list = list.filter(s =>
      s.name.toLowerCase().includes(kw) ||
      s.vendor_name.toLowerCase().includes(kw) ||
      s.doc.summary.toLowerCase().includes(kw)
    );
  }

  res.json({
    total: list.length,
    items: list.map(toCard),
  });
});

/** 技能详情(含完整 Doc) */
app.get('/api/skills/:slug', (req, res) => {
  const skill = skills.find(s => s.slug === req.params.slug && s.status === 'published');
  if (!skill) return res.status(404).json({ error: 'skill not found' });
  const stage = stageOf(skill.difficulty_lv);
  res.json({
    ...skill,
    stage: stage ? { name: stage.stage, icon: stage.icon, color: stage.color, desc: stage.desc } : null,
  });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`whatsawesome-api listening on http://localhost:${PORT}`);
});
