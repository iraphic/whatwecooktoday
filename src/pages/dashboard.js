// ===== Dashboard Page =====
import { pantry, favorites, recipes, shopping, mealPlan, settings } from '../store.js';
import { navigateTo } from '../router.js';

export function renderDashboard(container) {
  const { userName } = settings.get();
  const pantryItems = pantry.getAll();
  const favCount = favorites.getAll().length;
  const historyCount = recipes.getAll().length;
  const shopStats = shopping.getStats();
  const expiring = pantry.getExpiringSoon(5);

  // Get today's meal plan
  const today = new Date().toISOString().split('T')[0];
  const todayMeals = mealPlan.getForDate(today);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Selamat Pagi' : hour < 17 ? 'Selamat Siang' : 'Selamat Malam';

  container.innerHTML = `
    <div class="dashboard-welcome">
      <h2>${greeting}, ${userName}! 👋</h2>
      <p>Mau masak apa hari ini? Cek bahan di pantry kamu atau minta AI bantu carikan resep yang cocok.</p>
      <div class="welcome-emoji">🍳</div>
    </div>

    <div class="stats-grid">
      <div class="stats-card">
        <div class="stats-card-icon green">📦</div>
        <div class="stats-card-info">
          <h3>${pantryItems.length}<span class="stats-unit">item</span></h3>
          <p>Bahan di Pantry</p>
        </div>
      </div>
      <div class="stats-card">
        <div class="stats-card-icon orange">${expiring.length > 0 ? '⚠️' : '✅'}</div>
        <div class="stats-card-info">
          <h3>${expiring.length}<span class="stats-unit">item</span></h3>
          <p>Segera Kedaluwarsa</p>
        </div>
      </div>
      <div class="stats-card">
        <div class="stats-card-icon red">❤️</div>
        <div class="stats-card-info">
          <h3>${favCount}<span class="stats-unit">resep</span></h3>
          <p>Resep Favorit</p>
        </div>
      </div>
      <div class="stats-card">
        <div class="stats-card-icon blue">🛒</div>
        <div class="stats-card-info">
          <h3>${shopStats.remaining}<span class="stats-unit">item</span></h3>
          <p>Perlu Dibeli</p>
        </div>
      </div>
    </div>

    <h2 class="dashboard-section-title">⚡ Aksi Cepat</h2>
    <div class="dashboard-quick-actions">
      <div class="quick-action-card" data-action="ai-resep">
        <div class="qa-icon" style="background: var(--color-primary-50);">🤖</div>
        <h3>Generate Resep AI</h3>
        <p>Buat resep dari bahan yang ada</p>
      </div>
      <div class="quick-action-card" data-action="pantry">
        <div class="qa-icon" style="background: #FFF3E0;">📦</div>
        <h3>Tambah Bahan</h3>
        <p>Update stok bahan makanan</p>
      </div>
      <div class="quick-action-card" data-action="meal-planner">
        <div class="qa-icon" style="background: #E3F2FD;">📅</div>
        <h3>Meal Planner</h3>
        <p>Rencanakan menu mingguan</p>
      </div>
      <div class="quick-action-card" data-action="shopping">
        <div class="qa-icon" style="background: #FCE4EC;">🛒</div>
        <h3>Daftar Belanja</h3>
        <p>Cek yang perlu dibeli</p>
      </div>
    </div>

    ${expiring.length > 0 ? `
      <h2 class="dashboard-section-title">⏰ Segera Kedaluwarsa</h2>
      <div class="card" style="margin-bottom: var(--space-6);">
        ${expiring.slice(0, 5).map(item => {
          const daysLeft = Math.ceil((new Date(item.expiry) - new Date()) / (1000 * 60 * 60 * 24));
          const urgency = daysLeft <= 1 ? 'urgent' : daysLeft <= 3 ? 'soon' : 'safe';
          return `
            <div class="expiry-item">
              <span class="expiry-dot ${urgency}"></span>
              <div class="expiry-info">
                <span class="expiry-name">${item.emoji || '🥘'} ${item.name}</span>
                <span class="expiry-date">${formatDate(item.expiry)}</span>
              </div>
              <span class="expiry-days ${urgency}">${daysLeft <= 0 ? 'Hari ini!' : daysLeft + ' hari'}</span>
            </div>
          `;
        }).join('')}
      </div>
    ` : ''}

    ${historyCount > 0 ? `
      <h2 class="dashboard-section-title">📋 Resep Terakhir</h2>
      <div class="cards-grid">
        ${recipes.getAll().slice(0, 4).map(r => `
          <div class="fav-recipe-card" data-recipe-id="${r.id}">
            <div class="frc-image">${r.emoji || '🍽️'}</div>
            <div class="frc-content">
              <div class="frc-name">${r.name}</div>
              <div class="frc-meta">
                <span>⏱️ ${r.cookTime || '?'} mnt</span>
                <span>🔥 ${r.calories || '?'} kkal</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    ` : ''}
  `;

  // Quick action handlers
  container.querySelectorAll('.quick-action-card').forEach(card => {
    card.addEventListener('click', () => {
      const action = card.dataset.action;
      navigateTo('/' + action);
    });
  });
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}
