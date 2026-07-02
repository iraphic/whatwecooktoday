// ===== Settings Page =====
import { settings, showToast } from '../store.js';
import { icons } from '../icons.js';

export function renderSettings(container) {
  const current = settings.get();

  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-info">
        <h1>⚙️ Pengaturan</h1>
        <p>Konfigurasi aplikasi WhatWeCookToday</p>
      </div>
    </div>

    <div class="settings-section">
      <h3>👤 Profil</h3>
      <p>Informasi dasar pengguna</p>
      <div class="settings-row">
        <div class="settings-row-info">
          <h4>Nama</h4>
          <p>Nama yang ditampilkan di dashboard</p>
        </div>
        <div style="display: flex; gap: var(--space-2); align-items: center;">
          <input type="text" class="input-field" id="set-name" value="${current.userName || 'Chef'}" style="width: 200px;" />
          <button class="btn btn-sm btn-primary" id="save-name">Simpan</button>
        </div>
      </div>
    </div>

    <div class="settings-section">
      <h3>🤖 AI Configuration</h3>
      <p>Konfigurasi integrasi dengan Gemini AI untuk generate resep</p>
      <div class="settings-row" style="flex-direction: column; align-items: flex-start;">
        <div class="settings-row-info">
          <h4>Gemini API Key</h4>
          <p>Masukkan API key dari Google AI Studio. Tanpa API key, aplikasi akan menggunakan data demo.</p>
        </div>
        <div class="api-key-input" style="width: 100%; margin-top: var(--space-3);">
          <input type="password" class="input-field" id="set-api-key" value="${current.apiKey || ''}" placeholder="AIzaSy..." />
          <button class="btn btn-sm btn-secondary" id="toggle-key">
            ${icons.eye}
          </button>
          <button class="btn btn-sm btn-primary" id="save-key">Simpan</button>
        </div>
        <div style="margin-top: var(--space-3);">
          <span class="status-badge ${current.apiKey ? 'aman' : 'hampir'}">
            ${current.apiKey ? 'API Key Tersimpan' : 'Belum Diset (Mode Demo)'}
          </span>
        </div>
      </div>
    </div>

    <div class="settings-section">
      <h3>📊 Data & Storage</h3>
      <p>Kelola data aplikasi</p>
      <div class="settings-row">
        <div class="settings-row-info">
          <h4>Reset Semua Data</h4>
          <p>Hapus semua data termasuk pantry, resep, favorites, dan meal plan. Tindakan ini tidak bisa dibatalkan.</p>
        </div>
        <button class="btn btn-sm btn-danger" id="btn-reset">
          ${icons.trash} Reset Data
        </button>
      </div>
      <div class="settings-row">
        <div class="settings-row-info">
          <h4>Export Data</h4>
          <p>Download backup data dalam format JSON</p>
        </div>
        <button class="btn btn-sm btn-secondary" id="btn-export">
          ${icons.download} Export
        </button>
      </div>
    </div>

    <div class="settings-section">
      <h3>ℹ️ Tentang Aplikasi</h3>
      <p>Informasi tentang WhatWeCookToday</p>
      <div style="padding: var(--space-4) 0;">
        <div style="display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-4);">
          <span style="font-size: 2.5rem;">🍳</span>
          <div>
            <h4 style="font-size: var(--font-size-lg); font-weight: var(--font-weight-bold); color: var(--color-primary-800);">WhatWeCookToday</h4>
            <p style="font-size: var(--font-size-sm); color: var(--color-neutral-500);">v1.0.0 — Asisten Dapur Pribadi Berbasis AI</p>
          </div>
        </div>
        <p style="font-size: var(--font-size-sm); color: var(--color-neutral-600); line-height: 1.6;">
          WhatWeCookToday membantu kamu menemukan ide masakan berdasarkan bahan yang tersedia di dapurmu.
          Dengan bantuan AI, kamu bisa generate resep lengkap, merencanakan menu mingguan, dan mengelola stok bahan makanan.
        </p>
      </div>
    </div>
  `;

  // ── Events ──
  container.querySelector('#save-name').addEventListener('click', () => {
    const name = container.querySelector('#set-name').value.trim() || 'Chef';
    settings.update({ userName: name });
    showToast('Nama berhasil disimpan');
    // Update header avatar
    const avatar = document.querySelector('.header-avatar');
    if (avatar) avatar.textContent = name[0].toUpperCase();
  });

  let keyVisible = false;
  container.querySelector('#toggle-key').addEventListener('click', () => {
    const inp = container.querySelector('#set-api-key');
    keyVisible = !keyVisible;
    inp.type = keyVisible ? 'text' : 'password';
  });

  container.querySelector('#save-key').addEventListener('click', () => {
    const key = container.querySelector('#set-api-key').value.trim();
    settings.update({ apiKey: key });
    showToast(key ? 'API Key berhasil disimpan' : 'API Key dihapus (Mode Demo)');
    renderSettings(container); // re-render to update status badge
  });

  container.querySelector('#btn-reset').addEventListener('click', () => {
    if (confirm('Yakin hapus SEMUA data? Tindakan ini tidak bisa dibatalkan.')) {
      const keysToRemove = ['wwct_pantry', 'wwct_recipes', 'wwct_favorites', 'wwct_meal_plan', 'wwct_shopping', 'wwct_history'];
      keysToRemove.forEach(k => localStorage.removeItem(k));
      showToast('Semua data berhasil direset');
      renderSettings(container);
    }
  });

  container.querySelector('#btn-export').addEventListener('click', () => {
    const data = {};
    ['wwct_pantry', 'wwct_recipes', 'wwct_favorites', 'wwct_meal_plan', 'wwct_shopping', 'wwct_history', 'wwct_settings'].forEach(k => {
      const val = localStorage.getItem(k);
      if (val) data[k] = JSON.parse(val);
    });

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `whatwecooktoday_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data berhasil di-export');
  });
}
