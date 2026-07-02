// ===== Shopping List Page =====
import { shopping, showToast } from '../store.js';
import { icons } from '../icons.js';

const SHOP_CATEGORIES = ['Protein', 'Sayur', 'Bumbu', 'Karbo', 'Dairy', 'Buah', 'Lainnya'];

export function renderShopping(container) {
  render(container);
}

function render(container) {
  const items = shopping.getAll();
  const stats = shopping.getStats();
  const progressPercent = stats.total > 0 ? Math.round((stats.bought / stats.total) * 100) : 0;

  // Group by category
  const grouped = {};
  items.forEach(item => {
    const cat = item.category || 'Lainnya';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  });

  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-info">
        <h1>🛒 Daftar Belanja</h1>
        <p>Kelola kebutuhan belanja kamu</p>
      </div>
      <div class="page-header-actions">
        <button class="btn btn-secondary" id="btn-clear-bought" ${stats.bought === 0 ? 'disabled' : ''}>
          ${icons.check} Hapus Sudah Dibeli
        </button>
        <button class="btn btn-primary" id="btn-add-shop">
          ${icons.plus} Tambah Item
        </button>
      </div>
    </div>

    ${items.length > 0 ? `
      <div class="shopping-progress card" style="margin-bottom: var(--space-6);">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: var(--font-weight-semibold);">Progress Belanja</span>
          <span style="font-size: var(--font-size-sm); color: var(--color-neutral-500);">${stats.bought} / ${stats.total} item (${progressPercent}%)</span>
        </div>
        <div class="shopping-progress-bar">
          <div class="shopping-progress-fill" style="width: ${progressPercent}%"></div>
        </div>
      </div>

      ${Object.entries(grouped).map(([cat, catItems]) => `
        <div class="shopping-category-group">
          <div class="shopping-category-header">
            <h3>${getCatEmoji(cat)} ${cat}</h3>
            <span class="cat-count">${catItems.length}</span>
          </div>
          <div class="shopping-items">
            ${catItems.map(item => `
              <div class="shopping-item ${item.bought ? 'bought' : ''}">
                <div class="checkbox-wrapper ${item.bought ? 'checked' : ''}">
                  <input type="checkbox" ${item.bought ? 'checked' : ''} data-toggle="${item.id}" />
                </div>
                <span class="si-name">${item.name}</span>
                <span class="si-qty">${item.quantity || ''} ${item.unit || ''}</span>
                <button class="btn btn-icon-sm btn-ghost si-delete" data-del="${item.id}" style="color: var(--color-danger);">
                  ${icons.trash}
                </button>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}
    ` : `
      <div class="empty-state">
        <div class="empty-state-icon">🛒</div>
        <h3>Daftar Belanja Kosong</h3>
        <p>Tambahkan item yang perlu dibeli atau sinkron dari Meal Planner.</p>
        <button class="btn btn-primary" id="btn-add-empty">
          ${icons.plus} Tambah Item
        </button>
      </div>
    `}
  `;

  // ── Events ──
  container.querySelectorAll('[data-toggle]').forEach(cb => {
    cb.addEventListener('change', () => {
      shopping.toggleBought(cb.dataset.toggle);
      render(container);
    });
  });

  container.querySelectorAll('[data-del]').forEach(btn => {
    btn.addEventListener('click', () => {
      shopping.remove(btn.dataset.del);
      showToast('Item dihapus');
      render(container);
    });
  });

  container.querySelector('#btn-clear-bought')?.addEventListener('click', () => {
    shopping.clearBought();
    showToast('Item yang sudah dibeli dihapus');
    render(container);
  });

  const addBtn = container.querySelector('#btn-add-shop') || container.querySelector('#btn-add-empty');
  addBtn?.addEventListener('click', () => showAddShopModal(container));
}

function showAddShopModal(container) {
  const dialog = document.createElement('dialog');
  dialog.className = 'modal-dialog';
  dialog.innerHTML = `
    <div class="modal-header">
      <h2>Tambah Item Belanja</h2>
      <button class="modal-close">${icons.x}</button>
    </div>
    <div class="modal-body">
      <div class="input-group" style="margin-bottom: var(--space-4);">
        <label>Nama Item</label>
        <input type="text" class="input-field" id="shop-name" placeholder="Contoh: Saus Tiram" autofocus />
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); margin-bottom: var(--space-4);">
        <div class="input-group">
          <label>Jumlah</label>
          <input type="text" class="input-field" id="shop-qty" placeholder="1" />
        </div>
        <div class="input-group">
          <label>Satuan</label>
          <input type="text" class="input-field" id="shop-unit" placeholder="botol" />
        </div>
      </div>
      <div class="input-group">
        <label>Kategori</label>
        <select class="input-field" id="shop-cat">
          ${SHOP_CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary modal-cancel">Batal</button>
      <button class="btn btn-primary" id="shop-save">Tambah</button>
    </div>
  `;

  document.getElementById('modal-root').appendChild(dialog);
  dialog.showModal();

  dialog.querySelector('.modal-close').addEventListener('click', () => { dialog.close(); dialog.remove(); });
  dialog.querySelector('.modal-cancel').addEventListener('click', () => { dialog.close(); dialog.remove(); });
  dialog.addEventListener('click', (e) => { if (e.target === dialog) { dialog.close(); dialog.remove(); } });

  dialog.querySelector('#shop-save').addEventListener('click', () => {
    const name = dialog.querySelector('#shop-name').value.trim();
    if (!name) { showToast('Nama item harus diisi', 'error'); return; }

    shopping.add({
      name,
      quantity: dialog.querySelector('#shop-qty').value || '',
      unit: dialog.querySelector('#shop-unit').value || '',
      category: dialog.querySelector('#shop-cat').value,
    });

    dialog.close();
    dialog.remove();
    showToast('Item ditambahkan ke daftar belanja');
    render(container);
  });
}

function getCatEmoji(cat) {
  const map = { Protein: '🥩', Sayur: '🥬', Bumbu: '🌶️', Karbo: '🍚', Dairy: '🥛', Buah: '🍎', Lainnya: '📦' };
  return map[cat] || '📦';
}
