// ===== Meal Planner Page =====
import { mealPlan, pantry, favorites, recipes, showToast } from '../store.js';
import { generateMealPlanAI } from '../ai.js';
import { icons } from '../icons.js';
import { showRecipeModal } from '../components/recipeModal.js';

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
                  <div class="meal-slot-card" data-date="${day.date}" data-meal="${mt}" title="${meal.name}" style="position: relative;">
                    <div class="msc-image">${meal.emoji || '🍽️'}</div>
                    <div class="msc-name">${meal.name}</div>
                    <div class="msc-meta">${meal.cookTime || '?'} mnt · ${meal.calories || '?'} kkal</div>
                    <button class="btn btn-icon-sm btn-ghost msc-delete" data-date="${day.date}" data-meal="${mt}" style="position: absolute; top: 4px; right: 4px; color: var(--color-danger); padding: 4px;" title="Hapus">
                      ${icons.x}
                    </button>
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
    slot.addEventListener('click', (e) => {
      // Ignore click if it was on the delete button
      if (e.target.closest('.msc-delete')) return;
      
      const date = slot.dataset.date;
      const mt = slot.dataset.meal;
      const meal = mealPlan.getForDate(date)[mt];
      if (meal) {
        showRecipeModal(meal);
      }
    });
  });

  container.querySelectorAll('.msc-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const date = btn.dataset.date;
      const mt = btn.dataset.meal;
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
  const history = recipes.getAll();

  const dialog = document.createElement('dialog');
  dialog.className = 'modal-dialog';
  dialog.style.maxWidth = '600px';
  dialog.innerHTML = `
    <div class="modal-header">
      <h2>Pilih Menu — ${mealType.charAt(0).toUpperCase() + mealType.slice(1)}</h2>
      <button class="modal-close">${icons.x}</button>
    </div>
    <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
      <p style="margin-bottom: var(--space-4); color: var(--color-neutral-500); font-size: var(--font-size-sm);">
        Pilih salah satu resep dari riwayat generate AI kamu:
      </p>
      
      ${history.length > 0 ? `
        <div style="display: flex; flex-direction: column; gap: var(--space-3);">
          ${history.map(r => `
            <div class="history-pick-item" data-id="${r.id}" style="display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3); border: 1px solid var(--color-neutral-200); border-radius: var(--radius-md); cursor: pointer; transition: background 0.2s;">
              <div style="font-size: 1.5rem;">${r.emoji || '🍽️'}</div>
              <div style="flex: 1;">
                <div style="font-weight: var(--font-weight-medium); color: var(--color-neutral-900);">${r.name}</div>
                <div style="font-size: var(--font-size-xs); color: var(--color-neutral-500); margin-top: 2px;">
                  ⏱️ ${r.cookTime || '?'} mnt &nbsp;•&nbsp; 🔥 ${r.calories || '?'} kkal
                </div>
              </div>
              <div style="color: var(--color-primary-600);">+ Pilih</div>
            </div>
          `).join('')}
        </div>
      ` : `
        <div style="text-align: center; padding: var(--space-6) 0;">
          <div style="font-size: 2rem; margin-bottom: var(--space-2);">📋</div>
          <p style="color: var(--color-neutral-500);">Riwayat resep masih kosong.</p>
        </div>
      `}
    </div>
  `;

  document.getElementById('modal-root').appendChild(dialog);
  dialog.showModal();

  dialog.querySelector('.modal-close').addEventListener('click', () => { dialog.close(); dialog.remove(); });
  dialog.addEventListener('click', (e) => { if (e.target === dialog) { dialog.close(); dialog.remove(); } });

  // Add hover effect via JS since it's inline
  dialog.querySelectorAll('.history-pick-item').forEach(item => {
    item.addEventListener('mouseenter', () => {
      item.style.background = 'var(--color-primary-50)';
      item.style.borderColor = 'var(--color-primary-200)';
    });
    item.addEventListener('mouseleave', () => {
      item.style.background = 'transparent';
      item.style.borderColor = 'var(--color-neutral-200)';
    });
    
    item.addEventListener('click', () => {
      const recipe = history.find(r => r.id === item.dataset.id);
      if (recipe) {
        mealPlan.setMeal(date, mealType, recipe);
        showToast('Menu berhasil ditambahkan');
        dialog.close();
        dialog.remove();
        render(container);
      }
    });
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
