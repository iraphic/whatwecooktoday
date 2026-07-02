// ===== History Page =====
import { recipes, favorites, showToast } from '../store.js';
import { icons } from '../icons.js';
import { navigateTo } from '../router.js';

export function renderHistory(container) {
  render(container);
}

function render(container) {
  const all = recipes.getAll();

  // Group by date
  const grouped = {};
  all.forEach(recipe => {
    const dateStr = recipe.createdAt ? new Date(recipe.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Tanpa Tanggal';
    if (!grouped[dateStr]) grouped[dateStr] = [];
    grouped[dateStr].push(recipe);
  });

  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-info">
        <h1>📋 Riwayat Resep</h1>
        <p>Resep yang pernah di-generate oleh AI</p>
      </div>
      ${all.length > 0 ? `
        <div class="page-header-actions">
          <button class="btn btn-secondary" id="btn-clear-history">
            ${icons.trash} Hapus Semua
          </button>
        </div>
      ` : ''}
    </div>

    ${all.length > 0 ? `
      <div style="margin-bottom: var(--space-4);">
        <span style="font-size: var(--font-size-sm); color: var(--color-neutral-500);">${all.length} resep di riwayat</span>
      </div>
      <div class="history-timeline">
        ${Object.entries(grouped).map(([date, items]) => `
          <div class="history-date-group">
            <h3>${date}</h3>
            ${items.map(recipe => {
              const isFav = favorites.isFavorite(recipe.id);
              return `
                <div class="history-item" data-id="${recipe.id}">
                  <div class="hi-icon">${recipe.emoji || '🍽️'}</div>
                  <div class="hi-info">
                    <div class="hi-name">${recipe.name}</div>
                    <div class="hi-meta">
                      <span>⏱️ ${recipe.cookTime || '?'} mnt</span>
                      <span>🔥 ${recipe.calories || '?'} kkal</span>
                      <span>📊 ${recipe.difficulty || '-'}</span>
                    </div>
                  </div>
                  <div class="hi-actions">
                    <button class="btn btn-icon-sm btn-ghost ${isFav ? '' : ''}" data-fav="${recipe.id}" title="${isFav ? 'Hapus dari Favorit' : 'Simpan ke Favorit'}" style="${isFav ? 'color: var(--color-danger);' : ''}">
                      ${icons.heart}
                    </button>
                    <button class="btn btn-icon-sm btn-ghost" data-del="${recipe.id}" title="Hapus" style="color: var(--color-neutral-400);">
                      ${icons.trash}
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `).join('')}
      </div>
    ` : `
      <div class="empty-state">
        <div class="empty-state-icon">📋</div>
        <h3>Belum Ada Riwayat</h3>
        <p>Riwayat resep yang di-generate AI akan muncul di sini.</p>
        <button class="btn btn-primary" id="go-ai">
          ${icons.sparkles} Generate Resep
        </button>
      </div>
    `}
  `;

  container.querySelector('#go-ai')?.addEventListener('click', () => navigateTo('/ai-resep'));

  container.querySelector('#btn-clear-history')?.addEventListener('click', () => {
    if (confirm('Hapus semua riwayat resep?')) {
      localStorage.removeItem('wwct_history');
      showToast('Riwayat berhasil dihapus');
      render(container);
    }
  });

  container.querySelectorAll('[data-fav]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const recipe = all.find(r => r.id === btn.dataset.fav);
      if (recipe) {
        const added = favorites.toggle(recipe);
        showToast(added ? 'Ditambahkan ke Favorit ❤️' : 'Dihapus dari Favorit');
        render(container);
      }
    });
  });

  container.querySelectorAll('[data-del]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      recipes.remove(btn.dataset.del);
      showToast('Resep dihapus dari riwayat');
      render(container);
    });
  });
}
