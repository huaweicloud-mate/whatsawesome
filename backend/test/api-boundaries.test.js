import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp, createMemoryStore } from '../server.js';

async function withServer(fn) {
  const store = createMemoryStore();
  const app = createApp({ store });
  const server = await new Promise(resolve => {
    const instance = app.listen(0, () => resolve(instance));
  });
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    await fn({ baseUrl, store });
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}

async function request(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'content-type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const body = await response.json();
  return { response, body };
}

const adminAgentHeaders = {
  'x-admin-agent-id': 'skill-agent',
  'x-admin-agent-signature': 'local-dev-signature',
  'x-idempotency-key': 'crawl-20260813-skill-001',
};

test('portal APIs are available under /api/portal for human user surfaces', async () => {
  await withServer(async ({ baseUrl }) => {
    const skills = await request(baseUrl, '/api/portal/skills');
    assert.equal(skills.response.status, 200);
    assert.equal(skills.body.total, 14);

    const player = await request(baseUrl, '/api/portal/players', {
      method: 'POST',
      body: JSON.stringify({
        gitcode_id: 'portal-user-1',
        gitcode_username: 'portal-human',
      }),
    });
    assert.equal(player.response.status, 201);

    const quest = await request(baseUrl, '/api/portal/quests/manual', {
      method: 'POST',
      body: JSON.stringify({
        player_id: player.body.player.id,
        target_type: 'skill',
        target_slug: 'mcp',
        evidence: {
          description: '通过用户面提交 MCP 学习截图。',
        },
      }),
    });
    assert.equal(quest.response.status, 201);
    assert.equal(quest.body.quest.judge_status, 'pending');
  });
});

test('admin and admin-agent APIs reject unauthenticated portal callers', async () => {
  await withServer(async ({ baseUrl }) => {
    const adminCandidates = await request(baseUrl, '/api/admin/skill-candidates');
    assert.equal(adminCandidates.response.status, 403);
    assert.equal(adminCandidates.body.error, 'forbidden');

    const adminAgentSubmit = await request(baseUrl, '/api/admin-agent/skill-candidates', {
      method: 'POST',
      headers: { 'x-idempotency-key': 'portal-user-cannot-submit-admin-candidate' },
      body: JSON.stringify({
        name: '越权技能',
        slug: 'forbidden-skill',
        vendor_name: 'Unknown',
        difficulty_lv: 1,
        importance: { score: 1, basis: 'forbidden' },
        doc: {
          summary: 'forbidden',
          official_url: 'https://example.com',
          repo_url: 'https://example.com/repo',
          ecosystem: 'forbidden',
          hello_world: 'forbidden',
          learning_prompt: 'forbidden',
        },
        provenance: {
          source_url: 'https://example.com',
          source_vendor: 'Unknown',
          crawl_run_id: 'crawl_forbidden',
        },
      }),
    });
    assert.equal(adminAgentSubmit.response.status, 403);
    assert.equal(adminAgentSubmit.body.error, 'forbidden');
  });
});

test('admin-agent submits skill candidates, admin reviews, portal sees published skill', async () => {
  await withServer(async ({ baseUrl }) => {
    const submitted = await request(baseUrl, '/api/admin-agent/skill-candidates', {
      method: 'POST',
      headers: adminAgentHeaders,
      body: JSON.stringify({
        name: '华为云 CodeArts Snap',
        slug: 'huawei-codearts-snap',
        vendor_name: 'Huawei Cloud',
        vendor_type: 'devtool',
        logo_url: 'https://picsum.photos/seed/huawei-codearts-snap/200/200',
        category_tags: [
          { key: 'ai-coding', label: 'AI 编程' },
          { key: 'ide', label: '开发工具' },
        ],
        difficulty_lv: 18,
        importance: {
          score: 8.6,
          basis: 'AI 编程助手是团队研发效率的基础能力。',
          evaluated_at: '2026-08-13',
        },
        doc: {
          summary: 'CodeArts Snap 是华为云面向开发者的 AI 编程助手。',
          official_url: 'https://www.huaweicloud.com/product/codeartside/snap.html',
          repo_url: 'https://github.com/huaweicloud',
          ecosystem: 'CodeArts IDE、代码补全、单测生成、研发协同。',
          hello_world: '打开 CodeArts Snap，输入一个函数说明并生成代码。',
          learning_prompt: '请作为 AI 编程导师，带我用 CodeArts Snap 完成一个接口开发练习。',
        },
        provenance: {
          source_url: 'https://www.huaweicloud.com/product/codeartside/snap.html',
          source_vendor: 'Huawei Cloud',
          crawl_run_id: 'crawl_20260813',
          confidence: 0.88,
          model_meta: {
            provider: 'Huawei Cloud Pangu',
            model: 'pangu',
            prompt_version: 'skill-candidate-v1',
            generated_at: '2026-08-13T00:00:00.000Z',
          },
        },
      }),
    });

    assert.equal(submitted.response.status, 201);
    assert.equal(submitted.body.status, 'pending_review');

    const candidates = await request(baseUrl, '/api/admin/skill-candidates?status=pending_review', {
      headers: { 'x-admin-id': 'admin-founder' },
    });
    assert.equal(candidates.response.status, 200);
    assert.equal(candidates.body.total, 1);

    const approved = await request(baseUrl, `/api/admin/skill-candidates/${submitted.body.id}/approve`, {
      method: 'POST',
      headers: { 'x-admin-id': 'admin-founder' },
      body: JSON.stringify({ review_note: '今日露出，适合 AI 编程方向。' }),
    });
    assert.equal(approved.response.status, 200);
    assert.equal(approved.body.status, 'approved');
    assert.equal(approved.body.published_slug, 'huawei-codearts-snap');

    const detail = await request(baseUrl, '/api/portal/skills/huawei-codearts-snap');
    assert.equal(detail.response.status, 200);
    assert.equal(detail.body.status, 'published');
  });
});

test('admin-agent submits news candidates, admin publishes, portal sees news', async () => {
  await withServer(async ({ baseUrl }) => {
    const submitted = await request(baseUrl, '/api/admin-agent/news-candidates', {
      method: 'POST',
      headers: {
        ...adminAgentHeaders,
        'x-idempotency-key': 'crawl-20260813-news-001',
      },
      body: JSON.stringify({
        title: '华为云发布 AI 编程助手新能力',
        summary: 'CodeArts Snap 增强上下文理解与单测生成能力。',
        source_url: 'https://www.huaweicloud.com/news/codearts-snap.html',
        published_at: '2026-08-13T00:00:00.000Z',
        related_skill_slug: 'huawei-codearts-snap',
        provenance: {
          source_url: 'https://www.huaweicloud.com/news/codearts-snap.html',
          source_vendor: 'Huawei Cloud',
          crawl_run_id: 'crawl_20260813',
          confidence: 0.82,
          model_meta: {
            provider: 'Huawei Cloud Pangu',
            model: 'pangu',
            prompt_version: 'news-candidate-v1',
            generated_at: '2026-08-13T00:00:00.000Z',
          },
        },
      }),
    });

    assert.equal(submitted.response.status, 201);
    assert.equal(submitted.body.status, 'pending_review');

    const candidates = await request(baseUrl, '/api/admin/news-candidates?status=pending_review', {
      headers: { 'x-admin-id': 'admin-founder' },
    });
    assert.equal(candidates.response.status, 200);
    assert.equal(candidates.body.total, 1);

    const published = await request(baseUrl, `/api/admin/news-candidates/${submitted.body.id}/publish`, {
      method: 'POST',
      headers: { 'x-admin-id': 'admin-founder' },
      body: JSON.stringify({ review_note: '今日资讯发布。' }),
    });
    assert.equal(published.response.status, 200);
    assert.equal(published.body.status, 'approved');

    const news = await request(baseUrl, '/api/portal/news');
    assert.equal(news.response.status, 200);
    assert.equal(news.body.total, 1);
    assert.equal(news.body.items[0].title, '华为云发布 AI 编程助手新能力');
  });
});
