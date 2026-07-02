// ===== Bottom Navigation (Mobile) =====
import { icons } from '../icons.js';
import { navigateTo, getCurrentRoute } from '../router.js';

const BOTTOM_NAV_ITEMS = [
  { label: 'Home', icon: 'home', route: '/dashboard' },
  { label: 'Pantry', icon: 'package', route: '/pantry' },
  { label: 'AI Resep', icon: 'sparkles', route: '/ai-resep' },
  { label: 'Planner', icon: 'calendar', route: '/meal-planner' },
  { label: 'Lainnya', icon: 'grid', route: '/more' },
];

export function renderBottomNav() {
  const nav = document.getElementById('bottom-nav');
  const current = getCurrentRoute() || '/dashboard';

  // Check if current route is in the "more" category
  const moreRoutes = ['/shopping', '/favorites', '/history', '/settings'];
  const isMore = moreRoutes.includes(current);

  nav.innerHTML = `
    <div class="bottom-nav-inner">
      ${BOTTOM_NAV_ITEMS.map(item => {
        const isActive = item.route === '/more'
          ? isMore
          : current === item.route;
        return `
          <div class="bottom-nav-item ${isActive ? 'active' : ''}" data-route="${item.route}" role="button" tabindex="0">
            ${icons[item.icon]}
            <span>${item.label}</span>
          </div>
        `;
      }).join('')}
    </div>
  `;

  nav.querySelectorAll('.bottom-nav-item').forEach(el => {
    el.addEventListener('click', () => {
      if (el.dataset.route === '/more') {
        showMoreMenu();
      } else {
        navigateTo(el.dataset.route);
      }
    });
  });
}

function showMoreMenu() {
  // Remove existing
  document.querySelector('.more-menu-overlay')?.remove();

  const overlay = document.createElement('div');
  overlay.className = 'more-menu-overlay';
  overlay.style.cssText = `
    position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 200;
    display: flex; align-items: flex-end; justify-content: center;
    backdrop-filter: blur(2px);
  `;

  const menu = document.createElement('div');
  menu.style.cssText = `
    background: white; border-radius: 20px 20px 0 0; padding: 24px 16px;
    width: 100%; max-width: 480px;
    padding-bottom: calc(24px + env(safe-area-inset-bottom, 0));
    animation: slideUp 0.25s ease forwards;
  `;

  const moreItems = [
    { label: 'Belanja', icon: '🛒', route: '/shopping' },
    { label: 'Favorit', icon: '❤️', route: '/favorites' },
    { label: 'Riwayat', icon: '📋', route: '/history' },
    { label: 'Pengaturan', icon: '⚙️', route: '/settings' },
  ];

  menu.innerHTML = `
    <div style="width: 40px; height: 4px; background: #ddd; border-radius: 2px; margin: 0 auto 20px;"></div>
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;">
      ${moreItems.map(item => `
        <button class="more-menu-item" data-route="${item.route}" style="
          display: flex; flex-direction: column; align-items: center; gap: 8px;
          padding: 16px 8px; border-radius: 12px; background: #f5f5f5;
          border: none; font-size: 14px; font-weight: 500; cursor: pointer;
          font-family: inherit; transition: background 0.15s;
        ">
          <span style="font-size: 28px;">${item.icon}</span>
          <span>${item.label}</span>
        </button>
      `).join('')}
    </div>
  `;

  overlay.appendChild(menu);
  document.body.appendChild(overlay);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });

  menu.querySelectorAll('.more-menu-item').forEach(el => {
    el.addEventListener('click', () => {
      navigateTo(el.dataset.route);
      overlay.remove();
    });
  });
}
