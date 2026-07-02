// ===== Pantry Page =====
import { pantry, showToast } from '../store.js';
import { icons } from '../icons.js';

const CATEGORIES = ['Semua', 'Protein', 'Sayur', 'Bumbu', 'Karbo', 'Dairy', 'Buah', 'Lainnya'];
const UNITS = ['gram', 'kg', 'liter', 'ml', 'butir', 'buah', 'siung', 'ruas', 'batang', 'lembar', 'pcs', 'bungkus', 'botol'];
const EMOJIS = ['🥚', '🍗', '🥩', '🐟', '🧅', '🧄', '🥕', '🌶️', '🥬', '🍅', '🥔', '🍚', '🫗', '🟡', '🟫', '🥛', '🧈', '🍌', '🥑', '🌽', '🫘', '🥘'];

let currentFilter = 'Semua';
let searchQuery = '';

export function renderPantry(container) {
  render(container);
}

function render(container) {
  const allItems = pantry.getAll();
  const filtered = allItems.filter(item => {
    const matchCat = currentFilter === 'Semua' || item.category === currentFilter;
    const matchSearch = !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const expiring = pantry.getExpiringSoon(7);
  const lowStock = pantry.getLowStock();
  const categories = [...new Set(allItems.map(i => i.category))];

  container.innerHTML = `
    <div class="two-col-layout">
      <div>
        <div class="page-header">
          <div class="page-header-info">
            <h1>Pantry Saya</h1>
            <p>Kelola bahan makanan</p>
          </div>
          <div class="page-header-actions">
            <button class="btn btn-primary" id="btn-add-ingredient">
              ${icons.plus} Tambah Bahan
            </button>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stats-card">
            <div class="stats-card-icon green">📦</div>
            <div class="stats-card-info">
              <h3>${allItems.length}<span class="stats-unit">item</span></h3>
              <p>Total Bahan</p>
            </div>
          </div>
          <div class="stats-card">
            <div class="stats-card-icon orange">⚠️</div>
            <div class="stats-card-info">
              <h3>${lowStock.length}<span class="stats-unit">item</span></h3>
              <p>Stok Rendah</p>
            </div>
          </div>
          <div class="stats-card">
            <div class="stats-card-icon red">📅</div>
            <div class="stats-card-info">
              <h3>${expiring.length}<span class="stats-unit">item</span></h3>
              <p>Segera Kedaluwarsa</p>
            </div>
          </div>
          <div class="stats-card">
            <div class="stats-card-icon blue">📂</div>
            <div class="stats-card-info">
              <h3>${categories.length}<span class="stats-unit">jenis</span></h3>
              <p>Kategori</p>
            </div>
          </div>
        </div>

        <div class="pantry-filters">
          <div class="pantry-search">
            ${icons.search}
            <input type="text" placeholder="Cari bahan di pantry..." id="pantry-search" value="${searchQuery}" />
          </div>
          <div class="filter-tabs">
            ${CATEGORIES.map(cat => `
              <button class="filter-tab ${currentFilter === cat ? 'active' : ''}" data-cat="${cat}">${cat}</button>
            `).join('')}
          </div>
        </div>

        <div class="pantry-table-wrapper">
          ${filtered.length > 0 ? `
            <table class="data-table">
              <thead>
                <tr>
                  <th>Bahan</th>
                  <th>Kategori</th>
                  <th>Jumlah</th>
                  <th>Satuan</th>
                  <th>Kedaluwarsa</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                ${filtered.map(item => {
                  const daysLeft = item.expiry ? Math.ceil((new Date(item.expiry) - new Date()) / (1000*60*60*24)) : null;
                  const statusClass = daysLeft === null ? 'aman' : daysLeft <= 1 ? 'habis' : daysLeft <= 5 ? 'hampir' : 'aman';
                  const statusText = daysLeft === null ? 'Aman' : daysLeft <= 0 ? 'Kadaluwarsa' : daysLeft <= 5 ? 'Hampir' : 'Aman';
                  return `
                    <tr>
                      <td>
                        <span class="pantry-item-icon" style="background: var(--color-neutral-100);">${item.emoji || '🥘'}</span>
                        <span style="font-weight: 500;">${item.name}</span>
                      </td>
                      <td><span class="category-badge ${(item.category || 'lainnya').toLowerCase()}">${item.category}</span></td>
                      <td><strong>${item.quantity}</strong></td>
                      <td>${item.unit}</td>
                      <td>${item.expiry ? formatDate(item.expiry) : '-'}</td>
                      <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                      <td>
                        <div class="pantry-actions">
                          <button class="btn btn-icon-sm btn-ghost" data-edit="${item.id}" title="Edit">
                            ${icons.edit}
                          </button>
                          <button class="btn btn-icon-sm btn-ghost" data-delete="${item.id}" title="Hapus" style="color: var(--color-danger);">
                            ${icons.trash}
                          </button>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          ` : `
            <div class="empty-state">
              <div class="empty-state-icon">📦</div>
              <h3>Pantry Kosong</h3>
              <p>${searchQuery ? 'Tidak ada bahan yang cocok dengan pencarian.' : 'Tambahkan bahan makanan pertamamu!'}</p>
              ${!searchQuery ? `<button class="btn btn-primary" id="btn-add-empty">
                ${icons.plus} Tambah Bahan
              </button>` : ''}
            </div>
          `}
        </div>
      </div>

      <div class="pantry-sidebar-col">
        <div class="pantry-sidebar-card">
          <h3>
            ⏰ Pengingat Kedaluwarsa
            <span style="font-size: var(--font-size-sm); color: var(--color-neutral-500); font-weight: 400;">Lihat Semua</span>
          </h3>
          ${expiring.length > 0 ? expiring.slice(0, 5).map(item => {
            const daysLeft = Math.ceil((new Date(item.expiry) - new Date()) / (1000*60*60*24));
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
          }).join('') : '<p style="font-size: var(--font-size-sm); color: var(--color-neutral-500);">Tidak ada bahan yang akan segera kedaluwarsa 🎉</p>'}
        </div>

        <div class="pantry-sidebar-card">
          <h3>
            ⚠️ Stok Rendah
            <span style="font-size: var(--font-size-sm); color: var(--color-neutral-500); font-weight: 400;">Lihat Semua</span>
          </h3>
          ${lowStock.length > 0 ? lowStock.slice(0, 5).map(item => `
            <div class="expiry-item">
              <span class="expiry-dot urgent"></span>
              <div class="expiry-info">
                <span class="expiry-name">${item.emoji || '🥘'} ${item.name}</span>
                <span class="expiry-date">Sisa: ${item.quantity} ${item.unit}</span>
              </div>
            </div>
          `).join('') : '<p style="font-size: var(--font-size-sm); color: var(--color-neutral-500);">Semua stok masih aman 👍</p>'}
        </div>
      </div>
    </div>
  `;

  // ── Event Listeners ──
  container.querySelector('#pantry-search')?.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    render(container);
  });

  container.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      currentFilter = tab.dataset.cat;
      render(container);
    });
  });

  container.querySelector('#btn-add-ingredient')?.addEventListener('click', () => showAddModal(container));
  container.querySelector('#btn-add-empty')?.addEventListener('click', () => showAddModal(container));

  container.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('Hapus bahan ini?')) {
        pantry.remove(btn.dataset.delete);
        showToast('Bahan berhasil dihapus');
        render(container);
      }
    });
  });

  container.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = pantry.getAll().find(i => i.id === btn.dataset.edit);
      if (item) showAddModal(container, item);
    });
  });
}

function showAddModal(container, editItem = null) {
  const existing = document.querySelector('.modal-dialog');
  if (existing) existing.remove();

  const dialog = document.createElement('dialog');
  dialog.className = 'modal-dialog';
  dialog.innerHTML = `
    <div class="modal-header">
      <h2>${editItem ? 'Edit Bahan' : 'Tambah Bahan'}</h2>
      <button class="modal-close" id="modal-close">${icons.x}</button>
    </div>
    <div class="modal-body">
      <div class="input-group" style="margin-bottom: var(--space-4);">
        <label>Nama Bahan</label>
        <input type="text" class="input-field" id="inp-name" placeholder="Contoh: Ayam" value="${editItem?.name || ''}" />
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); margin-bottom: var(--space-4);">
        <div class="input-group">
          <label>Kategori</label>
          <select class="input-field" id="inp-category">
            ${CATEGORIES.filter(c => c !== 'Semua').map(c => `<option value="${c}" ${editItem?.category === c ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
        </div>
        <div class="input-group">
          <label>Emoji</label>
          <select class="input-field" id="inp-emoji">
            ${EMOJIS.map(e => `<option value="${e}" ${editItem?.emoji === e ? 'selected' : ''}>${e}</option>`).join('')}
          </select>
        </div>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); margin-bottom: var(--space-4);">
        <div class="input-group">
          <label>Jumlah</label>
          <input type="number" class="input-field" id="inp-qty" placeholder="0" min="0" value="${editItem?.quantity || ''}" />
        </div>
        <div class="input-group">
          <label>Satuan</label>
          <select class="input-field" id="inp-unit">
            ${UNITS.map(u => `<option value="${u}" ${editItem?.unit === u ? 'selected' : ''}>${u}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="input-group">
        <label>Tanggal Kedaluwarsa</label>
        <input type="date" class="input-field" id="inp-expiry" value="${editItem?.expiry || ''}" />
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" id="modal-cancel">Batal</button>
      <button class="btn btn-primary" id="modal-save">${editItem ? 'Simpan' : 'Tambah'}</button>
    </div>
  `;

  document.getElementById('modal-root').appendChild(dialog);
  dialog.showModal();

  dialog.querySelector('#modal-close').addEventListener('click', () => { dialog.close(); dialog.remove(); });
  dialog.querySelector('#modal-cancel').addEventListener('click', () => { dialog.close(); dialog.remove(); });

  dialog.querySelector('#modal-save').addEventListener('click', () => {
    const name = dialog.querySelector('#inp-name').value.trim();
    if (!name) { showToast('Nama bahan harus diisi', 'error'); return; }

    const data = {
      name,
      category: dialog.querySelector('#inp-category').value,
      emoji: dialog.querySelector('#inp-emoji').value,
      quantity: Number(dialog.querySelector('#inp-qty').value) || 0,
      unit: dialog.querySelector('#inp-unit').value,
      expiry: dialog.querySelector('#inp-expiry').value || null,
    };

    if (editItem) {
      pantry.update(editItem.id, data);
      showToast('Bahan berhasil diupdate');
    } else {
      pantry.add(data);
      showToast('Bahan berhasil ditambahkan');
    }

    dialog.close();
    dialog.remove();
    render(container);
  });

  // Close on backdrop click
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) { dialog.close(); dialog.remove(); }
  });
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}
