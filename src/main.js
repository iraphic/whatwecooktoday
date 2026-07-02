// ===== WhatWeCookToday — Main Entry Point =====
import { registerRoute, initRouter } from './router.js';
import { renderSidebar } from './components/sidebar.js';
import { renderBottomNav } from './components/bottomNav.js';
import { renderHeader } from './components/header.js';

// Pages
import { renderDashboard } from './pages/dashboard.js';
import { renderPantry } from './pages/pantry.js';
import { renderAiResep } from './pages/aiResep.js';
import { renderMealPlanner } from './pages/mealPlanner.js';
import { renderShopping } from './pages/shopping.js';
import { renderFavorites } from './pages/favorites.js';
import { renderHistory } from './pages/history.js';
import { renderSettings } from './pages/settings.js';

// ── Register Routes ──
registerRoute('/dashboard', renderDashboard);
registerRoute('/pantry', renderPantry);
registerRoute('/ai-resep', renderAiResep);
registerRoute('/meal-planner', renderMealPlanner);
registerRoute('/shopping', renderShopping);
registerRoute('/favorites', renderFavorites);
registerRoute('/history', renderHistory);
registerRoute('/settings', renderSettings);

// ── Initialize App ──
function init() {
  renderSidebar();
  renderHeader();
  renderBottomNav();
  initRouter();

  // Re-render sidebar & bottom nav on hash change to update active states
  window.addEventListener('hashchange', () => {
    renderSidebar();
    renderBottomNav();
  });
}

// Start the app
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
