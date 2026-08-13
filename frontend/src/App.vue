<template>
  <div class="app-shell">
    <header class="app-header">
      <div class="brand" @click="$router.push('/')">
        <span class="brand-icon">⚡</span>
        <span class="brand-name">Whats <b>Awesome</b></span>
        <span class="brand-tag">AI 时代技能闯关</span>
      </div>
      <nav class="nav">
        <router-link to="/" class="nav-link">技能大厅</router-link>
      </nav>
    </header>
    <main class="app-main">
      <router-view />
    </main>
    <footer class="app-footer">
      <span>迭代一 · 技能对象预览 — 登录 / 管理面 / 玩家将在后续迭代开放</span>
    </footer>
  </div>
</template>

<script setup>
</script>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif;
  background: linear-gradient(160deg, #0f172a 0%, #1e293b 55%, #0f172a 100%);
  min-height: 100vh;
  color: #e2e8f0;
}
.app-shell { display: flex; flex-direction: column; min-height: 100vh; }
.app-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 40px; background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(148, 163, 184, 0.15); position: sticky; top: 0; z-index: 10;
}
.brand { display: flex; align-items: center; gap: 10px; cursor: pointer; }
.brand-icon { font-size: 26px; }
.brand-name { font-size: 22px; font-weight: 600; color: #f8fafc; letter-spacing: 0.5px; }
.brand-name b { color: #38bdf8; }
.brand-tag { font-size: 12px; color: #94a3b8; border: 1px solid #334155; padding: 2px 8px; border-radius: 999px; }
.nav .nav-link {
  color: #94a3b8; text-decoration: none; font-size: 14px; padding: 8px 14px; border-radius: 8px;
  transition: all .2s;
}
.nav .nav-link:hover, .nav .nav-link.router-link-active { color: #38bdf8; background: rgba(56, 189, 248, 0.1); }
.app-main { flex: 1; width: 100%; max-width: 1280px; margin: 0 auto; padding: 28px 24px 48px; }
.app-footer { text-align: center; padding: 18px; color: #475569; font-size: 12px; border-top: 1px solid rgba(148, 163, 184, 0.1); }
</style>
