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

test('creates a player profile from GitCode identity', async () => {
  await withServer(async ({ baseUrl }) => {
    const { response, body } = await request(baseUrl, '/api/players', {
      method: 'POST',
      body: JSON.stringify({
        gitcode_id: 'gitcode-user-1',
        gitcode_username: 'beyond',
        avatar_url: 'https://example.com/avatar.png',
      }),
    });

    assert.equal(response.status, 201);
    assert.equal(body.player.gitcode_id, 'gitcode-user-1');
    assert.equal(body.player.role, 'player');
    assert.equal(body.player.growth.realm, '炼气期');
    assert.deepEqual(body.player.badges, []);
  });
});

test('keeps published skill list and detail endpoints compatible', async () => {
  await withServer(async ({ baseUrl }) => {
    const list = await request(baseUrl, '/api/skills');
    assert.equal(list.response.status, 200);
    assert.equal(list.body.total, 14);
    assert.ok(list.body.items.some(item => item.slug === 'mcp'));

    const detail = await request(baseUrl, '/api/skills/mcp');
    assert.equal(detail.response.status, 200);
    assert.equal(detail.body.slug, 'mcp');
    assert.equal(detail.body.doc.learning_prompt.includes('MCP'), true);
  });
});

test('submits and approves a manual skill quest, then grants first-light badge', async () => {
  await withServer(async ({ baseUrl }) => {
    const created = await request(baseUrl, '/api/players', {
      method: 'POST',
      body: JSON.stringify({
        gitcode_id: 'gitcode-user-2',
        gitcode_username: 'skill-runner',
      }),
    });
    const playerId = created.body.player.id;

    const submitted = await request(baseUrl, '/api/quests/manual', {
      method: 'POST',
      body: JSON.stringify({
        player_id: playerId,
        target_type: 'skill',
        target_slug: 'huawei-functiongraph',
        evidence: {
          description: '完成 HTTP 函数 Hello World，并上传运行日志。',
          file_url: 'obs://whatsawesome-evidence/demo/functiongraph-log.txt',
        },
      }),
    });

    assert.equal(submitted.response.status, 201);
    assert.equal(submitted.body.quest.judge_status, 'pending');

    const approved = await request(baseUrl, `/api/admin/quests/${submitted.body.quest.id}/review`, {
      method: 'POST',
      headers: { 'x-admin-id': 'admin-founder' },
      body: JSON.stringify({
        decision: 'approved',
        judge_note: '日志完整，判定通过。',
      }),
    });

    assert.equal(approved.response.status, 200);
    assert.equal(approved.body.quest.judge_status, 'approved');
    assert.equal(approved.body.granted_badges.length, 1);
    assert.equal(approved.body.granted_badges[0].key, 'first_light');

    const profile = await request(baseUrl, `/api/players/${playerId}/profile`);
    assert.equal(profile.response.status, 200);
    assert.equal(profile.body.lit_skills.length, 1);
    assert.equal(profile.body.lit_skills[0].slug, 'huawei-functiongraph');
    assert.equal(profile.body.badges[0].title, '筑基初成');
  });
});

test('lists cases and supports manual case quest approval', async () => {
  await withServer(async ({ baseUrl }) => {
    const cases = await request(baseUrl, '/api/cases');
    assert.equal(cases.response.status, 200);
    assert.ok(cases.body.total >= 1);
    assert.equal(cases.body.items[0].status, 'published');

    const player = await request(baseUrl, '/api/players', {
      method: 'POST',
      body: JSON.stringify({
        gitcode_id: 'gitcode-user-3',
        gitcode_username: 'case-runner',
      }),
    });

    const submitted = await request(baseUrl, '/api/quests/manual', {
      method: 'POST',
      body: JSON.stringify({
        player_id: player.body.player.id,
        target_type: 'case',
        target_slug: cases.body.items[0].slug,
        evidence: {
          description: '完成案例串联实现，提交部署说明。',
          artifact_url: 'https://example.com/demo',
        },
      }),
    });

    const reviewed = await request(baseUrl, `/api/admin/quests/${submitted.body.quest.id}/review`, {
      method: 'POST',
      headers: { 'x-admin-id': 'admin-founder' },
      body: JSON.stringify({
        decision: 'approved',
        judge_note: '案例链路可复现。',
      }),
    });

    assert.equal(reviewed.response.status, 200);

    const profile = await request(baseUrl, `/api/players/${player.body.player.id}/profile`);
    assert.equal(profile.body.lit_cases.length, 1);
    assert.equal(profile.body.lit_cases[0].slug, cases.body.items[0].slug);
  });
});
