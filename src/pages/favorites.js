// ===== Favorites Page =====
import { favorites, showToast } from '../store.js';
import { icons } from '../icons.js';
import { navigateTo } from '../router.js';
import { showRecipeModal } from '../components/recipeModal.js';

export function renderFavorites(container) {
  render(container);
}

function render(container) {
  const favs = favorites.getAll();

  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-info">
        <h1>❤️ Resep Favorit</h1>
        <p>Resep yang kamu simpan</p>
      </div>
    </div>

    ${favs.length > 0 ? `
      <div style="margin-bottom: var(--space-4); display: flex; align-items: center; gap: var(--space-3);">
        <span style="font-size: var(--font-size-sm); color: var(--color-neutral-500);">${favs.length} resep disimpan</span>
      </div>
      <div class="cards-grid">
        ${favs.map(recipe => `
          <div class="fav-recipe-card" data-id="${recipe.id}">
            <div class="frc-image">
              ${recipe.emoji || '🍽️'}
              <div class="ai-match-badge" style="position:absolute; top: 12px; left: 12px;">AI MATCH <span>${recipe.matchScore || '?'}%</span></div>
            </div>
            <div class="frc-content">
              <div class="frc-name">${recipe.name}</div>
              <div class="frc-meta">
                <span>⏱️ ${recipe.cookTime || '?'} mnt</span>
                <span>🔥 ${recipe.calories || '?'} kkal</span>
                <span>📊 ${recipe.difficulty || '-'}</span>
              </div>
            </div>
            <div class="frc-actions">
              <button class="btn btn-sm btn-ghost" data-cook="${recipe.id}">
                ${icons.play} Masak
              </button>
              <button class="btn btn-sm btn-ghost" data-unfav="${recipe.id}" style="color: var(--color-danger);">
                ${icons.trash} Hapus
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    ` : `
      <div class="empty-state">
        <div class="empty-state-icon">❤️</div>
        <h3>Belum Ada Favorit</h3>
        <p>Simpan resep dari AI Resep untuk menemukannya di sini.</p>
        <button class="btn btn-primary" id="go-ai">
          ${icons.sparkles} Generate Resep
        </button>
      </div>
    `}
  `;

  container.querySelector('#go-ai')?.addEventListener('click', () => navigateTo('/ai-resep'));

  container.querySelectorAll('[data-unfav]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      favorites.remove(btn.dataset.unfav);
      showToast('Dihapus dari favorit');
      render(container);
    });
  });

  container.querySelectorAll('[data-cook]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const recipe = favs.find(r => r.id === btn.dataset.cook);
      if (recipe) {
        showRecipeModal(recipe);
      }
    });
  });
}
