// ===== Meal Planner Page =====
import { mealPlan, pantry, favorites, showToast } from '../store.js';
import { generateMealPlanAI } from '../ai.js';
import { icons } from '../icons.js';

let viewMode = 'mingguan';
let currentWeekStart = getMonday(new Date());
let selectedMealType = 'Semua';
let isGenerating = false;

export function renderMealPlanner(container) {
  render(container);
}

function render(container) {
  const weekData = mealPlan.getWeek(currentWeekStart);
  const weekLabel = formatWeekRange(currentWeekStart);

  // Stats
  let totalFilled = 0;
  let totalSlots = weekData.length * 3;
  let totalCalories = 0;
  weekData.forEach(day => {
    ['sarapan', 'siang', 'malam'].forEach(m => {
      if (day.meals[m]) {
        totalFilled++;
        totalCalories += day.meals[m].calories || 0;
      }
    });
  });
  const fillPercent = Math.round((totalFilled / totalSlots) * 100);

  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-info">
        <h1>📅 Meal Planner</h1>
        <p style="color: var(--color-primary-600); font-style: italic;">Rencanakan menu harian dan mingguan dengan AI</p>
      </div>
      <div class="page-header-actions">
        <button class="btn btn-primary" id="btn-gen-plan" ${isGenerating ? 'disabled' : ''}>
          ${isGenerating ? '<span class="spinner" style="width:18px;height:18px;border-width:2px;"></span>' : `${icons.sparkles}`}
          ${isGenerating ? 'Generating...' : 'Generate Plan AI'}
        </button>
      </div>
    </div>

    <div class="meal-planner-controls">
      <div class="toggle-tabs">
        <button class="toggle-tab ${viewMode === 'harian' ? 'active' : ''}" data-view="harian">Harian</button>
        <button class="toggle-tab ${viewMode === 'mingguan' ? 'active' : ''}" data-view="mingguan">Mingguan</button>
      </div>
      <div class="date-nav">
        <button id="nav-prev">${icons.chevronLeft}</button>
        <span class="date-label">📅 ${weekLabel}</span>
        <button id="nav-next">${icons.chevronRight}</button>
      </div>
      <select class="meal-type-select" id="meal-type-filter">
        <option value="Semua" ${selectedMealType === 'Semua' ? 'selected' : ''}>Semua</option>
        <option value="sarapan" ${selectedMealType === 'sarapan' ? 'selected' : ''}>Sarapan</option>
        <option value="siang" ${selectedMealType === 'siang' ? 'selected' : ''}>Makan Siang</option>
        <option value="malam" ${selectedMealType === 'malam' ? 'selected' : ''}>Makan Malam</option>
      </select>
    </div>

    <div class="stats-grid" style="margin-bottom: var(--space-6);">
      <div class="stats-card">
        <div class="stats-card-icon green">🍽️</div>
        <div class="stats-card-info">
          <h3>${totalFilled}<span class="stats-unit">/ ${totalSlots}</span></h3>
          <p>Total Menu Minggu Ini</p>
        </div>
      </div>
      <div class="stats-card">
        <div class="stats-card-icon blue">📊</div>
        <div class="stats-card-info">
          <h3>${fillPercent}<span class="stats-unit">%</span></h3>
          <p>Menu Terisi</p>
        </div>
      </div>
      <div class="stats-card">
        <div class="stats-card-icon orange">🔥</div>
        <div class="stats-card-info">
          <h3>${totalCalories.toLocaleString()}<span class="stats-unit">kkal</span></h3>
          <p>Estimasi Kalori / Minggu</p>
        </div>
      </div>
    </div>

    <div class="week-grid">
      ${weekData.map((day, idx) => {
        const d = new Date(day.date);
        const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
        const isToday = day.date === new Date().toISOString().split('T')[0];
        const mealTypes = selectedMealType === 'Semua' ? ['sarapan', 'siang', 'malam'] : [selectedMealType];

        return `
          <div class="week-day-col">
            <div class="week-day-header ${isToday ? 'today' : ''}">
              <div class="day-name">${dayNames[d.getDay()]}</div>
              <div class="day-date">${d.getDate()} ${d.toLocaleDateString('id-ID', { month: 'short' })}</div>
            </div>
            ${mealTypes.map(mt => {
              const meal = day.meals[mt];
              if (meal) {
                return `
                  <div class="meal-slot-card" data-date="${day.date}" data-meal="${mt}" title="${meal.name}">
                    <div class="msc-image">${meal.emoji || '🍽️'}</div>
                    <div class="msc-name">${meal.name}</div>
                    <div class="msc-meta">${meal.cookTime || '?'} mnt · ${meal.calories || '?'} kkal</div>
                  </div>
                `;
              }
              return `
                <div class="meal-slot-empty" data-date="${day.date}" data-meal="${mt}" title="Tambah ${mt}">+</div>
              `;
            }).join('')}
          </div>
        `;
      }).join('')}
    </div>
  `;

  // ── Event Listeners ──
  container.querySelectorAll('.toggle-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      viewMode = tab.dataset.view;
      render(container);
    });
  });

  container.querySelector('#nav-prev').addEventListener('click', () => {
    currentWeekStart.setDate(currentWeekStart.getDate() - 7);
    render(container);
  });

  container.querySelector('#nav-next').addEventListener('click', () => {
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    render(container);
  });

  container.querySelector('#meal-type-filter').addEventListener('change', (e) => {
    selectedMealType = e.target.value;
    render(container);
  });

  // Click meal slot to assign
  container.querySelectorAll('.meal-slot-empty').forEach(slot => {
    slot.addEventListener('click', () => {
      showAssignModal(container, slot.dataset.date, slot.dataset.meal);
    });
  });

  container.querySelectorAll('.meal-slot-card').forEach(slot => {
    slot.addEventListener('click', () => {
      const date = slot.dataset.date;
      const mt = slot.dataset.meal;
      if (confirm('Hapus menu ini?')) {
        mealPlan.removeMeal(date, mt);
        showToast('Menu dihapus');
        render(container);
      }
    });
  });

  // Generate AI plan
  container.querySelector('#btn-gen-plan')?.addEventListener('click', async () => {
    isGenerating = true;
    render(container);

    try {
      const ingredients = pantry.getAll().map(i => i.name);
      const plan = await generateMealPlanAI(ingredients, 7);

      // Assign to meal plan
      plan.days.forEach((day, i) => {
        const d = new Date(currentWeekStart);
        d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];

        if (day.sarapan) mealPlan.setMeal(dateStr, 'sarapan', day.sarapan);
        if (day.siang) mealPlan.setMeal(dateStr, 'siang', day.siang);
        if (day.malam) mealPlan.setMeal(dateStr, 'malam', day.malam);
      });

      isGenerating = false;
      render(container);
      showToast('Meal plan berhasil di-generate! 🎉');
    } catch (err) {
      isGenerating = false;
      render(container);
      showToast('Gagal generate meal plan', 'error');
    }
  });
}

function showAssignModal(container, date, mealType) {
  const favs = favorites.getAll();
  const history = (await_nothing(), []);

  const dialog = document.createElement('dialog');
  dialog.className = 'modal-dialog';
  dialog.innerHTML = `
    <div class="modal-header">
      <h2>Pilih Menu — ${mealType.charAt(0).toUpperCase() + mealType.slice(1)}</h2>
      <button class="modal-close">${icons.x}</button>
    </div>
    <div class="modal-body">
      <div class="input-group" style="margin-bottom: var(--space-4);">
        <label>Nama Menu</label>
        <input type="text" class="input-field" id="assign-name" placeholder="Contoh: Nasi Goreng" />
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); margin-bottom: var(--space-4);">
        <div class="input-group">
          <label>Waktu Masak (menit)</label>
          <input type="number" class="input-field" id="assign-time" placeholder="30" />
        </div>
        <div class="input-group">
          <label>Kalori</label>
          <input type="number" class="input-field" id="assign-cal" placeholder="400" />
        </div>
      </div>
      <div class="input-group">
        <label>Emoji</label>
        <select class="input-field" id="assign-emoji">
          <option value="🍽️">🍽️ Default</option>
          <option value="🍳">🍳 Telur</option>
          <option value="🍛">🍛 Nasi</option>
          <option value="🍗">🍗 Ayam</option>
          <option value="🥘">🥘 Semur</option>
          <option value="🍲">🍲 Sup</option>
          <option value="🥗">🥗 Salad</option>
          <option value="🍜">🍜 Mie</option>
        </select>
      </div>
      ${favs.length > 0 ? `
        <div style="margin-top: var(--space-5); border-top: 1px solid var(--color-neutral-100); padding-top: var(--space-4);">
          <strong style="font-size: var(--font-size-sm);">Dari Favorit:</strong>
          <div style="display: flex; flex-wrap: wrap; gap: var(--space-2); margin-top: var(--space-2);">
            ${favs.slice(0, 6).map(f => `
              <button class="btn btn-sm btn-secondary fav-pick" data-name="${f.name}" data-time="${f.cookTime||30}" data-cal="${f.calories||400}" data-emoji="${f.emoji||'🍽️'}">
                ${f.emoji || '🍽️'} ${f.name}
              </button>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary modal-cancel-btn">Batal</button>
      <button class="btn btn-primary" id="assign-save">Simpan</button>
    </div>
  `;

  document.getElementById('modal-root').appendChild(dialog);
  dialog.showModal();

  dialog.querySelector('.modal-close').addEventListener('click', () => { dialog.close(); dialog.remove(); });
  dialog.querySelector('.modal-cancel-btn').addEventListener('click', () => { dialog.close(); dialog.remove(); });
  dialog.addEventListener('click', (e) => { if (e.target === dialog) { dialog.close(); dialog.remove(); } });

  dialog.querySelectorAll('.fav-pick').forEach(btn => {
    btn.addEventListener('click', () => {
      dialog.querySelector('#assign-name').value = btn.dataset.name;
      dialog.querySelector('#assign-time').value = btn.dataset.time;
      dialog.querySelector('#assign-cal').value = btn.dataset.cal;
      dialog.querySelector('#assign-emoji').value = btn.dataset.emoji;
    });
  });

  dialog.querySelector('#assign-save').addEventListener('click', () => {
    const name = dialog.querySelector('#assign-name').value.trim();
    if (!name) { showToast('Nama menu harus diisi', 'error'); return; }

    mealPlan.setMeal(date, mealType, {
      name,
      cookTime: Number(dialog.querySelector('#assign-time').value) || 30,
      calories: Number(dialog.querySelector('#assign-cal').value) || 400,
      emoji: dialog.querySelector('#assign-emoji').value,
    });

    dialog.close();
    dialog.remove();
    showToast('Menu berhasil ditambahkan');
    render(container);
  });
}

function await_nothing() {} // placeholder

function getMonday(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatWeekRange(start) {
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const opts = { day: 'numeric', month: 'short' };
  return `${start.toLocaleDateString('id-ID', opts)} — ${end.toLocaleDateString('id-ID', { ...opts, year: 'numeric' })}`;
}
