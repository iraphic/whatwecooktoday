// ===== Sidebar Component =====
import { icons } from '../icons.js';
import { navigateTo, getCurrentRoute } from '../router.js';
import { shopping, pantry } from '../store.js';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: 'home', route: '/dashboard' },
  { section: 'Dapur' },
  { label: 'Pantry', icon: 'package', route: '/pantry' },
  { label: 'AI Resep', icon: 'sparkles', route: '/ai-resep' },
  { label: 'Meal Planner', icon: 'calendar', route: '/meal-planner' },
  { section: 'Lainnya' },
  { label: 'Belanja', icon: 'shoppingCart', route: '/shopping', badge: () => shopping.getStats().remaining || 0 },
  { label: 'Favorit', icon: 'heart', route: '/favorites' },
  { label: 'Riwayat', icon: 'clock', route: '/history' },
  { section: 'Sistem' },
  { label: 'Pengaturan', icon: 'settings', route: '/settings' },
];

export function renderSidebar() {
  const sidebar = document.getElementById('sidebar');
  const currentRoute = getCurrentRoute() || '/dashboard';

  sidebar.innerHTML = `
    <div class="sidebar-brand">
      <h1><span class="brand-icon">🍳</span> WhatWeCookToday</h1>
      <p>Asisten Dapur Pribadimu</p>
    </div>
    <nav class="sidebar-nav">
      ${NAV_ITEMS.map(item => {
        if (item.section) {
          return `<div class="sidebar-section-label">${item.section}</div>`;
        }
        const isActive = currentRoute === item.route;
        const badgeCount = item.badge ? item.badge() : 0;
        return `
          <div class="sidebar-nav-item ${isActive ? 'active' : ''}" data-route="${item.route}" role="button" tabindex="0">
            ${icons[item.icon]}
            <span>${item.label}</span>
            ${badgeCount > 0 ? `<span class="nav-badge">${badgeCount}</span>` : ''}
          </div>
        `;
      }).join('')}
    </nav>
  `;

  // Click handlers
  sidebar.querySelectorAll('.sidebar-nav-item').forEach(el => {
    el.addEventListener('click', () => {
      navigateTo(el.dataset.route);
    });
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        navigateTo(el.dataset.route);
      }
    });
  });
}
