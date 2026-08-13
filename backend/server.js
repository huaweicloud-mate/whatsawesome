import express from 'express';
import cors from 'cors';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dataDir = join(__dirname, 'data');

const skillsSeed = JSON.parse(readFileSync(join(dataDir, 'skills.json'), 'utf-8')).skills;
const stagesSeed = JSON.parse(readFileSync(join(dataDir, 'difficulty_stage.json'), 'utf-8')).stages;
const labelsSeed = JSON.parse(readFileSync(join(dataDir, 'label_dict.json'), 'utf-8')).labels;
const casesSeed = JSON.parse(readFileSync(join(dataDir, 'cases.json'), 'utf-8')).cases;
const badgeDefsSeed = JSON.parse(readFileSync(join(dataDir, 'badge_defs.json'), 'utf-8')).badges;

const ADMIN_IDS = new Set(['admin-founder', 'admin-secretary']);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function stageOf(stages, lv) {
  return stages.find(s => lv >= s.min_lv && lv <= s.max_lv) || null;
}

function toStageView(stage) {
  return stage ? { name: stage.stage, icon: stage.icon, color: stage.color, desc: stage.desc } : null;
}

function toSkillCard(store, skill) {
  const stage = stageOf(store.stages, skill.difficulty_lv);
  return {
    slug: skill.slug,
    name: skill.name,
    vendor_name: skill.vendor_name,
    vendor_type: skill.vendor_type,
    logo_url: skill.logo_url,
    category_tags: skill.category_tags,
    difficulty_lv: skill.difficulty_lv,
    stage: toStageView(stage),
    importance: skill.importance,
    summary: skill.doc.summary,
    status: skill.status,
  };
}

function toCaseCard(store, item) {
  const stage = stageOf(store.stages, item.difficulty_lv);
  return {
    slug: item.slug,
    name: item.name,
    scenario_desc: item.scenario_desc,
    source: item.source,
    skill_slugs: item.skill_slugs,
    category_tags: item.category_tags,
    difficulty_lv: item.difficulty_lv,
    stage: toStageView(stage),
    importance: item.importance,
    status: item.status,
  };
}

function realmForExp(exp) {
  if (exp >= 700) return '神魔期';
  if (exp >= 610) return '登仙期';
  if (exp >= 510) return '羽化期';
  if (exp >= 410) return '悟道期';
  if (exp >= 310) return '具灵期';
  if (exp >= 210) return '结晶期';
  if (exp >= 110) return '筑基期';
  return '炼气期';
}

function nowIso() {
  return new Date().toISOString();
}

export function createMemoryStore(seed = {}) {
  return {
    skills: clone(seed.skills || skillsSeed),
    stages: clone(seed.stages || stagesSeed),
    labels: clone(seed.labels || labelsSeed),
    cases: clone(seed.cases || casesSeed),
    badgeDefs: clone(seed.badgeDefs || badgeDefsSeed),
    players: [],
    quests: [],
    nextPlayerId: 1,
    nextQuestId: 1,
  };
}

function makeError(status, message, code = 'bad_request') {
  return { status, body: { error: code, message } };
}

function findPublishedTarget(store, targetType, targetSlug) {
  if (targetType === 'skill') {
    return store.skills.find(s => s.slug === targetSlug && s.status === 'published') || null;
  }
  if (targetType === 'case') {
    return store.cases.find(c => c.slug === targetSlug && c.status === 'published') || null;
  }
  return null;
}

function createPlayer(store, payload) {
  const gitcodeId = String(payload.gitcode_id || '').trim();
  const username = String(payload.gitcode_username || '').trim();

  if (!gitcodeId) return makeError(400, 'gitcode_id is required', 'validation_error');
  if (!username) return makeError(400, 'gitcode_username is required', 'validation_error');

  const existing = store.players.find(p => p.gitcode_id === gitcodeId);
  if (existing) {
    existing.gitcode_username = username;
    existing.avatar_url = payload.avatar_url || existing.avatar_url || '';
    existing.updated_at = nowIso();
    return { status: 200, body: { player: existing } };
  }

  const timestamp = nowIso();
  const player = {
    id: `player_${store.nextPlayerId++}`,
    gitcode_id: gitcodeId,
    gitcode_username: username,
    avatar_url: payload.avatar_url || '',
    role: ADMIN_IDS.has(gitcodeId) ? 'admin' : 'player',
    badges: [],
    growth: {
      realm: '炼气期',
      exp: 0,
      total_lit: 0,
      lit_skill_slugs: [],
      lit_case_slugs: [],
    },
    created_at: timestamp,
    updated_at: timestamp,
  };

  store.players.push(player);
  return { status: 201, body: { player } };
}

function submitManualQuest(store, payload) {
  const player = store.players.find(p => p.id === payload.player_id);
  if (!player) return makeError(404, 'player not found', 'not_found');

  const targetType = String(payload.target_type || '').trim();
  const targetSlug = String(payload.target_slug || '').trim();
  const target = findPublishedTarget(store, targetType, targetSlug);
  if (!target) return makeError(404, 'target not found or unpublished', 'not_found');

  const evidence = payload.evidence || {};
  if (!String(evidence.description || '').trim()) {
    return makeError(400, 'evidence.description is required', 'validation_error');
  }

  const timestamp = nowIso();
  const quest = {
    id: `quest_${store.nextQuestId++}`,
    player_id: player.id,
    target_type: targetType,
    target_slug: targetSlug,
    method: 'manual_upload',
    evidence,
    judge_status: 'pending',
    judged_by: '',
    judge_note: '',
    lit_at: '',
    created_at: timestamp,
    updated_at: timestamp,
  };

  store.quests.push(quest);
  return { status: 201, body: { quest } };
}

function computeExp(store, player) {
  const skillExp = player.growth.lit_skill_slugs.reduce((sum, slug) => {
    const skill = store.skills.find(s => s.slug === slug);
    return sum + (skill?.difficulty_lv || 0);
  }, 0);
  const caseExp = player.growth.lit_case_slugs.reduce((sum, slug) => {
    const item = store.cases.find(c => c.slug === slug);
    return sum + (item?.difficulty_lv || 0) + 20;
  }, 0);
  return skillExp + caseExp;
}

function badgeAlreadyGranted(player, badgeKey) {
  return player.badges.some(b => b.key === badgeKey);
}

function vendorCoverage(store, player, vendorName) {
  const vendorSkills = store.skills.filter(s => s.status === 'published' && s.vendor_name === vendorName);
  if (!vendorSkills.length) return 0;
  const litCount = vendorSkills.filter(s => player.growth.lit_skill_slugs.includes(s.slug)).length;
  return litCount / vendorSkills.length;
}

function evaluateBadges(store, player) {
  const granted = [];
  const totalLit = player.growth.lit_skill_slugs.length + player.growth.lit_case_slugs.length;

  for (const def of store.badgeDefs) {
    if (badgeAlreadyGranted(player, def.key)) continue;

    let matched = false;
    if (def.rule.type === 'total_lit') {
      matched = totalLit >= def.rule.threshold;
    }
    if (def.rule.type === 'skill_count') {
      matched = player.growth.lit_skill_slugs.length >= def.rule.threshold;
    }
    if (def.rule.type === 'vendor_coverage') {
      matched = vendorCoverage(store, player, def.rule.vendor_name) >= def.rule.threshold;
    }

    if (matched) {
      const badge = {
        key: def.key,
        name: def.name,
        title: def.title,
        icon: def.icon,
        description: def.description,
        granted_at: nowIso(),
      };
      player.badges.push(badge);
      granted.push(badge);
    }
  }

  return granted;
}

function applyApprovedQuest(store, quest) {
  const player = store.players.find(p => p.id === quest.player_id);
  if (!player) return [];

  if (quest.target_type === 'skill' && !player.growth.lit_skill_slugs.includes(quest.target_slug)) {
    player.growth.lit_skill_slugs.push(quest.target_slug);
  }
  if (quest.target_type === 'case' && !player.growth.lit_case_slugs.includes(quest.target_slug)) {
    player.growth.lit_case_slugs.push(quest.target_slug);
  }

  player.growth.total_lit = player.growth.lit_skill_slugs.length + player.growth.lit_case_slugs.length;
  player.growth.exp = computeExp(store, player);
  player.growth.realm = realmForExp(player.growth.exp);
  player.updated_at = nowIso();

  return evaluateBadges(store, player);
}

function reviewQuest(store, questId, adminId, payload) {
  if (!ADMIN_IDS.has(adminId)) return makeError(403, 'admin permission required', 'forbidden');

  const quest = store.quests.find(q => q.id === questId);
  if (!quest) return makeError(404, 'quest not found', 'not_found');
  if (quest.judge_status !== 'pending') return makeError(409, 'quest already reviewed', 'conflict');

  const decision = String(payload.decision || '').trim();
  if (!['approved', 'rejected'].includes(decision)) {
    return makeError(400, 'decision must be approved or rejected', 'validation_error');
  }

  quest.judge_status = decision;
  quest.judged_by = adminId;
  quest.judge_note = payload.judge_note || '';
  quest.updated_at = nowIso();
  if (decision === 'approved') quest.lit_at = nowIso();

  const grantedBadges = decision === 'approved' ? applyApprovedQuest(store, quest) : [];
  return { status: 200, body: { quest, granted_badges: grantedBadges } };
}

function buildProfile(store, playerId) {
  const player = store.players.find(p => p.id === playerId);
  if (!player) return null;

  const litSkills = player.growth.lit_skill_slugs
    .map(slug => store.skills.find(s => s.slug === slug))
    .filter(Boolean)
    .map(skill => toSkillCard(store, skill));
  const litCases = player.growth.lit_case_slugs
    .map(slug => store.cases.find(c => c.slug === slug))
    .filter(Boolean)
    .map(item => toCaseCard(store, item));

  return {
    player,
    growth: player.growth,
    badges: player.badges,
    lit_skills: litSkills,
    lit_cases: litCases,
    recent_quests: store.quests
      .filter(q => q.player_id === player.id)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 10),
  };
}

export function createApp({ store = createMemoryStore() } = {}) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'whatsawesome-api' }));

  app.get('/api/meta/stages', (_req, res) => res.json({ stages: store.stages }));
  app.get('/api/meta/labels', (_req, res) => res.json({ labels: store.labels }));

  app.get('/api/skills', (req, res) => {
    const { tag, min_lv, max_lv, q } = req.query;
    let list = store.skills.filter(s => s.status === 'published');

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
      items: list.map(skill => toSkillCard(store, skill)),
    });
  });

  app.get('/api/skills/:slug', (req, res) => {
    const skill = store.skills.find(s => s.slug === req.params.slug && s.status === 'published');
    if (!skill) return res.status(404).json({ error: 'not_found', message: 'skill not found' });
    const stage = stageOf(store.stages, skill.difficulty_lv);
    res.json({
      ...skill,
      stage: toStageView(stage),
    });
  });

  app.get('/api/cases', (req, res) => {
    const { tag, q } = req.query;
    let list = store.cases.filter(c => c.status === 'published');

    if (tag) list = list.filter(c => c.category_tags.some(t => t.key === tag));
    if (q) {
      const kw = String(q).toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(kw) ||
        c.scenario_desc.toLowerCase().includes(kw)
      );
    }

    res.json({
      total: list.length,
      items: list.map(item => toCaseCard(store, item)),
    });
  });

  app.get('/api/cases/:slug', (req, res) => {
    const item = store.cases.find(c => c.slug === req.params.slug && c.status === 'published');
    if (!item) return res.status(404).json({ error: 'not_found', message: 'case not found' });
    const stage = stageOf(store.stages, item.difficulty_lv);
    const skills = item.skill_slugs
      .map(slug => store.skills.find(s => s.slug === slug))
      .filter(Boolean)
      .map(skill => toSkillCard(store, skill));
    res.json({ ...item, stage: toStageView(stage), skills });
  });

  app.post('/api/players', (req, res) => {
    const result = createPlayer(store, req.body);
    res.status(result.status).json(result.body);
  });

  app.get('/api/players/:id/profile', (req, res) => {
    const profile = buildProfile(store, req.params.id);
    if (!profile) return res.status(404).json({ error: 'not_found', message: 'player not found' });
    res.json(profile);
  });

  app.get('/api/quests', (req, res) => {
    const { player_id, status } = req.query;
    let list = [...store.quests];
    if (player_id) list = list.filter(q => q.player_id === player_id);
    if (status) list = list.filter(q => q.judge_status === status);
    res.json({ total: list.length, items: list });
  });

  app.post('/api/quests/manual', (req, res) => {
    const result = submitManualQuest(store, req.body);
    res.status(result.status).json(result.body);
  });

  app.post('/api/admin/quests/:id/review', (req, res) => {
    const result = reviewQuest(store, req.params.id, req.header('x-admin-id') || '', req.body);
    res.status(result.status).json(result.body);
  });

  return app;
}

if (process.argv[1] === __filename) {
  const PORT = process.env.PORT || 8000;
  createApp().listen(PORT, () => {
    console.log(`whatsawesome-api listening on http://localhost:${PORT}`);
  });
}
