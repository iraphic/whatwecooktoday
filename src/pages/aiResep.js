// ===== AI Resep Page =====
import { pantry, recipes, favorites, showToast } from '../store.js';
import { generateRecipe } from '../ai.js';
import { icons } from '../icons.js';

let selectedIngredients = [];
let currentRecipe = null;
let isLoading = false;

export function renderAiResep(container) {
  // Pre-populate with pantry items
  if (selectedIngredients.length === 0) {
    const pantryItems = pantry.getAll();
    selectedIngredients = pantryItems.slice(0, 6).map(i => i.name);
  }

  render(container);
}

function render(container) {
  const pantryItems = pantry.getAll();

  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-info">
        <h1>🤖 AI Resep</h1>
        <p>Generate resep berdasarkan bahan yang kamu punya</p>
      </div>
    </div>

    <div class="ai-resep-input-area">
      <div class="card" style="margin-bottom: var(--space-4);">
        <div style="margin-bottom: var(--space-3);">
          <strong style="font-size: var(--font-size-md);">Bahan yang tersedia</strong>
          <p style="font-size: var(--font-size-sm); color: var(--color-neutral-500); margin-top: 2px;">Ketik nama bahan lalu tekan Enter, atau klik bahan dari pantry</p>
        </div>
        <div class="ai-tags-container" id="tags-container">
          ${selectedIngredients.map((ing, i) => `
            <span class="tag">
              <span class="tag-letter" style="background: ${getTagColor(ing)}">${ing[0].toUpperCase()}</span>
              ${ing}
              <span class="tag-remove" data-remove="${i}">${icons.x}</span>
            </span>
          `).join('')}
          <input type="text" class="tag-input" id="tag-input" placeholder="${selectedIngredients.length === 0 ? 'Ketik bahan (misal: Ayam, Telur, Bawang)...' : 'Tambah bahan...'}" />
        </div>

        ${pantryItems.length > 0 ? `
          <div style="margin-top: var(--space-3);">
            <span style="font-size: var(--font-size-sm); color: var(--color-neutral-500);">Dari Pantry:</span>
            <div style="display: flex; flex-wrap: wrap; gap: var(--space-2); margin-top: var(--space-2);">
              ${pantryItems.filter(p => !selectedIngredients.includes(p.name)).slice(0, 12).map(p => `
                <button class="btn btn-sm btn-secondary pantry-add-btn" data-name="${p.name}">
                  ${p.emoji || '🥘'} ${p.name}
                </button>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <div class="ai-generate-bar">
          <button class="btn btn-primary btn-lg" id="btn-generate" ${isLoading ? 'disabled' : ''}>
            ${isLoading ? '<span class="spinner" style="width:20px;height:20px;border-width:2px;"></span>' : `${icons.sparkles}`}
            ${isLoading ? 'Generating...' : 'Buat Resep AI'}
          </button>
          <span class="ingredient-count">${selectedIngredients.length} bahan dipilih</span>
        </div>
      </div>
    </div>

    <div id="recipe-result-area">
      ${currentRecipe ? renderRecipeResult(currentRecipe) : ''}
    </div>
  `;

  // ── Event Listeners ──
  const tagInput = container.querySelector('#tag-input');
  const tagsContainer = container.querySelector('#tags-container');

  tagsContainer.addEventListener('click', () => tagInput.focus());

  tagInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && tagInput.value.trim()) {
      e.preventDefault();
      const val = tagInput.value.trim();
      if (!selectedIngredients.includes(val)) {
        selectedIngredients.push(val);
        render(container);
      }
      tagInput.value = '';
    }
    if (e.key === 'Backspace' && !tagInput.value && selectedIngredients.length > 0) {
      selectedIngredients.pop();
      render(container);
    }
  });

  container.querySelectorAll('.tag-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      selectedIngredients.splice(Number(btn.dataset.remove), 1);
      render(container);
    });
  });

  container.querySelectorAll('.pantry-add-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!selectedIngredients.includes(btn.dataset.name)) {
        selectedIngredients.push(btn.dataset.name);
        render(container);
      }
    });
  });

  container.querySelector('#btn-generate')?.addEventListener('click', async () => {
    if (selectedIngredients.length === 0) {
      showToast('Tambahkan minimal 1 bahan', 'warning');
      return;
    }
    isLoading = true;
    render(container);

    try {
      const generated = await generateRecipe(selectedIngredients);
      currentRecipe = recipes.add(generated);
      isLoading = false;
      render(container);
      showToast('Resep berhasil di-generate! 🎉');
      // Scroll to result
      setTimeout(() => {
        container.querySelector('#recipe-result-area')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      isLoading = false;
      render(container);
      showToast(err.message || 'Gagal generate resep', 'error');
    }
  });

  // Recipe result event handlers
  setupRecipeEvents(container);
}

function renderRecipeResult(recipe) {
  const isFav = favorites.isFavorite(recipe.id);
  const difficultyClass = recipe.difficulty === 'Mudah' ? 'easy' : recipe.difficulty === 'Sedang' ? 'medium' : 'hard';

  return `
    <div class="recipe-result">
      <div class="two-col-layout" style="gap: var(--space-5);">
        <div>
          <div class="recipe-result-card">
            <div class="recipe-hero">
              <div class="recipe-hero-image">
                <div class="ai-match-badge">AI MATCH <span>${recipe.matchScore}%</span></div>
                <span class="recipe-placeholder-icon">${recipe.emoji || '🍽️'}</span>
              </div>
              <div class="recipe-hero-content">
                <div class="recipe-title">
                  <span>${recipe.name}</span>
                  <button class="fav-btn ${isFav ? 'favorited' : ''}" id="fav-toggle" title="${isFav ? 'Hapus dari Favorit' : 'Simpan ke Favorit'}">
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

                <div class="recipe-hero-actions">
                  <button class="btn btn-secondary" id="btn-save-recipe">
                    ${icons.bookmark} Simpan Resep
                  </button>
                  <button class="btn btn-success btn-lg" id="btn-cook-now">
                    ${icons.play} Masak Sekarang
                  </button>
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

          <div style="margin-top: var(--space-4); text-align: center;">
            <button class="btn btn-secondary" id="btn-regenerate">
              ${icons.refresh} Generate Ulang
            </button>
          </div>
        </div>

        <div>
          <div class="nutrition-panel">
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
  `;
}

function setupRecipeEvents(container) {
  container.querySelector('#fav-toggle')?.addEventListener('click', () => {
    if (!currentRecipe) return;
    const isFav = favorites.toggle(currentRecipe);
    showToast(isFav ? 'Ditambahkan ke Favorit ❤️' : 'Dihapus dari Favorit');
    render(container);
  });

  container.querySelector('#btn-save-recipe')?.addEventListener('click', () => {
    if (!currentRecipe) return;
    favorites.add(currentRecipe);
    showToast('Resep disimpan ke Favorit ❤️');
    render(container);
  });

  container.querySelector('#btn-cook-now')?.addEventListener('click', () => {
    showToast('Selamat memasak! 🍳');
  });

  container.querySelector('#btn-regenerate')?.addEventListener('click', async () => {
    if (selectedIngredients.length === 0) return;
    isLoading = true;
    currentRecipe = null;
    render(container);

    try {
      const generated = await generateRecipe(selectedIngredients);
      currentRecipe = recipes.add(generated);
      isLoading = false;
      render(container);
      showToast('Resep baru berhasil di-generate! 🎉');
    } catch (err) {
      isLoading = false;
      render(container);
      showToast(err.message || 'Gagal generate resep', 'error');
    }
  });
}

function getTagColor(name) {
  const colors = ['#2E7D32', '#E65100', '#6A1B9A', '#0277BD', '#C62828', '#F9A825', '#00695C', '#4527A0'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}
