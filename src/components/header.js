// ===== Header Component =====
import { icons } from '../icons.js';
import { settings } from '../store.js';

export function renderHeader() {
  const header = document.getElementById('header');
  const { userName } = settings.get();
  const initial = (userName || 'C')[0].toUpperCase();

  header.innerHTML = `
    <button class="header-menu-toggle" id="menu-toggle" aria-label="Toggle menu">
      ${icons.menu}
    </button>
    <div class="header-search">
      ${icons.search}
      <input type="search" placeholder="Cari resep, bahan..." aria-label="Cari" id="header-search-input" />
    </div>
    <div class="header-actions">
      <button class="header-btn" aria-label="Notifikasi" id="header-notif-btn">
        ${icons.bell}
        <span class="notification-dot"></span>
      </button>
      <div class="header-avatar" title="${userName}" id="header-avatar">${initial}</div>
    </div>
  `;

  // Mobile menu toggle
  document.getElementById('menu-toggle').addEventListener('click', () => {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('open');

    // Overlay
    let overlay = document.querySelector('.sidebar-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'sidebar-overlay';
      document.getElementById('app').appendChild(overlay);
      overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('show');
      });
    }
    overlay.classList.toggle('show', sidebar.classList.contains('open'));
  });
}
