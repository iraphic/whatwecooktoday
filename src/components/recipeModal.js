import { favorites, showToast } from '../store.js';
import { icons } from '../icons.js';

export function showRecipeModal(recipe) {
  const isFav = favorites.isFavorite(recipe.id);
  const difficultyClass = recipe.difficulty === 'Mudah' ? 'easy' : recipe.difficulty === 'Sedang' ? 'medium' : 'hard';

  const dialog = document.createElement('dialog');
  dialog.className = 'modal-dialog recipe-detail-modal';
  
  // Custom styling to make the modal fullscreen and centered
  dialog.style.maxWidth = '1200px';
  dialog.style.width = '95vw';
  dialog.style.height = '90vh';
  dialog.style.margin = 'auto';
  dialog.style.display = 'flex';
  dialog.style.flexDirection = 'column';

  dialog.innerHTML = `
    <div class="modal-header">
      <h2>${recipe.emoji || '🍽️'} ${recipe.name}</h2>
      <button class="modal-close">${icons.x}</button>
    </div>
    <div class="modal-body" style="flex: 1; padding: 0; overflow-y: auto; background: var(--color-neutral-50);">
      
      <div class="recipe-result" style="margin: 0; padding: var(--space-4); background: transparent; box-shadow: none;">
        <div class="two-col-layout" style="gap: var(--space-5);">
          <div>
            <div class="recipe-result-card" style="box-shadow: var(--shadow-sm);">
              <div class="recipe-hero">
                <div class="recipe-hero-image">
                  <div class="ai-match-badge">AI MATCH <span>${recipe.matchScore || '?'}%</span></div>
                  <span class="recipe-placeholder-icon">${recipe.emoji || '🍽️'}</span>
                </div>
                <div class="recipe-hero-content">
                  <div class="recipe-title">
                    <span>${recipe.name}</span>
                    <button class="fav-btn ${isFav ? 'favorited' : ''}" id="modal-fav-toggle" title="${isFav ? 'Hapus dari Favorit' : 'Simpan ke Favorit'}">
                      ${icons.heart}
                    </button>
                  </div>
                  <p class="recipe-desc">${recipe.description}</p>

                  <div class="recipe-meta-grid">
                    <div class="recipe-meta-item">
                      <div class="meta-icon">⏱️</div>
                      <div class="meta-value">${recipe.prepTime} mnt</div>
                      <div class="meta-label">Prep Time</div>
                    </div>
                    <div class="recipe-meta-item">
                      <div class="meta-icon">🍳</div>
                      <div class="meta-value">${recipe.cookTime} mnt</div>
                      <div class="meta-label">Cook Time</div>
                    </div>
                    <div class="recipe-meta-item">
                      <div class="meta-icon">🍽️</div>
                      <div class="meta-value">${recipe.servings}</div>
                      <div class="meta-label">Porsi</div>
                    </div>
                    <div class="recipe-meta-item">
                      <div class="meta-icon">📊</div>
                      <div class="meta-value ${difficultyClass}">${recipe.difficulty}</div>
                      <div class="meta-label">Kesulitan</div>
                    </div>
                    <div class="recipe-meta-item">
                      <div class="meta-icon">🔥</div>
                      <div class="meta-value">${recipe.calories}</div>
                      <div class="meta-label">kkal/porsi</div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="recipe-body">
                <div class="recipe-section">
                  <h3><span class="section-icon">🥘</span> Bahan Utama</h3>
                  <div class="ingredient-list">
                    ${(recipe.ingredients || []).map(ing => `
                      <div class="ingredient-list-item">
                        <span class="il-check">✓</span>
                        <span>${ing.name}</span>
                        <span style="margin-left:auto; color: var(--color-neutral-500); font-size: var(--font-size-sm);">${ing.amount}</span>
                      </div>
                    `).join('')}
                  </div>

                  ${recipe.extraIngredients?.length > 0 ? `
                    <h3 style="margin-top: var(--space-5);"><span class="section-icon">🛒</span> Bahan Tambahan</h3>
                    <div class="ingredient-list">
                      ${recipe.extraIngredients.map(ing => `
                        <div class="ingredient-list-item extra">
                          <span class="il-check">+</span>
                          <span>${ing.name}</span>
                          <span style="margin-left:auto; color: var(--color-neutral-500); font-size: var(--font-size-sm);">${ing.amount}</span>
                        </div>
                      `).join('')}
                    </div>
                  ` : ''}
                </div>

                <div class="recipe-section">
                  <h3><span class="section-icon">📝</span> Langkah Memasak</h3>
                  <div class="recipe-steps">
                    ${(recipe.steps || []).map((step, i) => `
                      <div class="recipe-step">
                        <span class="step-number">${i + 1}</span>
                        <span class="step-text">${step}</span>
                      </div>
                    `).join('')}
                  </div>

                  ${recipe.tips ? `
                    <div style="margin-top: var(--space-5); padding: var(--space-4); background: var(--color-info-light); border-radius: var(--radius-lg); border-left: 3px solid var(--color-info);">
                      <strong style="font-size: var(--font-size-sm);">💡 Tips:</strong>
                      <p style="font-size: var(--font-size-sm); margin-top: var(--space-1); color: var(--color-neutral-700);">${recipe.tips}</p>
                    </div>
                  ` : ''}
                </div>
              </div>

              ${recipe.variations?.length > 0 ? `
                <div class="recipe-variations">
                  <h3 style="font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold); display: flex; align-items: center; gap: var(--space-2);">
                    <span>💡</span> Ide Variasi Menu
                  </h3>
                  <div class="variations-grid">
                    ${recipe.variations.map(v => `
                      <div class="variation-card">
                        <h4>${v.name}</h4>
                        <p>${v.description}</p>
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
            </div>
          </div>

          <div>
            <div class="nutrition-panel" style="box-shadow: var(--shadow-sm);">
              <h3>
                Informasi Gizi
                <span style="font-size: var(--font-size-sm); color: var(--color-neutral-500);">(per porsi)</span>
              </h3>
              <div class="total-cal">${recipe.calories} kkal</div>
              <div class="nutrition-list">
                <div class="nutrition-item">
                  <span class="ni-label">Kalori</span>
                  <span class="ni-value">${recipe.calories} kkal</span>
                </div>
                ${recipe.nutrition ? `
                  <div class="nutrition-item">
                    <span class="ni-label">Protein</span>
                    <span class="ni-value">${recipe.nutrition.protein}</span>
                  </div>
                  <div class="nutrition-item">
                    <span class="ni-label">Karbohidrat</span>
                    <span class="ni-value">${recipe.nutrition.carbs}</span>
                  </div>
                  <div class="nutrition-item">
                    <span class="ni-label">Lemak</span>
                    <span class="ni-value">${recipe.nutrition.fat}</span>
                  </div>
                  ${recipe.nutrition.fiber ? `
                    <div class="nutrition-item">
                      <span class="ni-label">Serat</span>
                      <span class="ni-value">${recipe.nutrition.fiber}</span>
                    </div>
                  ` : ''}
                ` : ''}
              </div>
              <p style="font-size: var(--font-size-xs); color: var(--color-neutral-400); margin-top: var(--space-3);">
                Informasi nutrisi adalah estimasi. Pastikan semua bahan masih layak konsumsi sebelum dimasak.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('modal-root').appendChild(dialog);
  dialog.showModal();

  // Close Handlers
  const close = () => {
    dialog.close();
    dialog.remove();
  };

  dialog.querySelector('.modal-close').addEventListener('click', close);
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) close();
  });

  // Action Handlers
  dialog.querySelector('#modal-fav-toggle')?.addEventListener('click', (e) => {
    const btn = e.currentTarget;
    const isNowFav = favorites.toggle(recipe);
    if (isNowFav) {
      btn.classList.add('favorited');
      btn.title = 'Hapus dari Favorit';
      showToast('Ditambahkan ke Favorit ❤️');
    } else {
      btn.classList.remove('favorited');
      btn.title = 'Simpan ke Favorit';
      showToast('Dihapus dari Favorit');
    }
    
    // We should trigger a re-render on the favorites page if we are there
    // For simplicity, if we unfavorite, we don't automatically close the modal, 
    // but the underlying page might need to be refreshed by the user if they close it.
    // The easiest way is to dispatch a custom event that the page can listen to, or just let them refresh.
    window.dispatchEvent(new CustomEvent('recipe-fav-toggled'));
  });
}
