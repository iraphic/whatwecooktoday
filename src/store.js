// ===== Data Store — localStorage management =====

const STORAGE_KEYS = {
  PANTRY: 'wwct_pantry',
  RECIPES: 'wwct_recipes',
  FAVORITES: 'wwct_favorites',
  MEAL_PLAN: 'wwct_meal_plan',
  SHOPPING: 'wwct_shopping',
  HISTORY: 'wwct_history',
  SETTINGS: 'wwct_settings',
};

// ── Helpers ──
function load(key, fallback = []) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ── Pantry ──
export const pantry = {
  getAll() {
    return load(STORAGE_KEYS.PANTRY, getSamplePantry());
  },
  add(item) {
    const items = this.getAll();
    const newItem = { id: generateId(), createdAt: new Date().toISOString(), ...item };
    items.push(newItem);
    save(STORAGE_KEYS.PANTRY, items);
    return newItem;
  },
  update(id, updates) {
    const items = this.getAll();
    const idx = items.findIndex(i => i.id === id);
    if (idx !== -1) {
      items[idx] = { ...items[idx], ...updates };
      save(STORAGE_KEYS.PANTRY, items);
    }
    return items[idx];
  },
  remove(id) {
    const items = this.getAll().filter(i => String(i.id) !== String(id));
    save(STORAGE_KEYS.PANTRY, items);
  },
  getByCategory(cat) {
    if (!cat || cat === 'Semua') return this.getAll();
    return this.getAll().filter(i => i.category === cat);
  },
  getExpiringSoon(days = 7) {
    const now = new Date();
    return this.getAll().filter(i => {
      if (!i.expiry) return false;
      const exp = new Date(i.expiry);
      const diff = (exp - now) / (1000 * 60 * 60 * 24);
      return diff <= days && diff >= -1;
    }).sort((a, b) => new Date(a.expiry) - new Date(b.expiry));
  },
  getLowStock() {
    return this.getAll().filter(i => i.quantity <= (i.minStock || 2));
  }
};

// ── Recipes / History ──
export const recipes = {
  getAll() {
    return load(STORAGE_KEYS.HISTORY, []);
  },
  add(recipe) {
    const items = this.getAll();
    const newRecipe = { id: generateId(), createdAt: new Date().toISOString(), ...recipe };
    items.unshift(newRecipe);
    save(STORAGE_KEYS.HISTORY, items);
    return newRecipe;
  },
  getById(id) {
    return this.getAll().find(r => r.id === id);
  },
  remove(id) {
    const items = this.getAll().filter(r => String(r.id) !== String(id));
    save(STORAGE_KEYS.HISTORY, items);
  }
};

// ── Favorites ──
export const favorites = {
  getAll() {
    return load(STORAGE_KEYS.FAVORITES, []);
  },
  add(recipe) {
    const items = this.getAll();
    if (items.find(r => r.id === recipe.id)) return; // already exists
    items.unshift({ ...recipe, favoritedAt: new Date().toISOString() });
    save(STORAGE_KEYS.FAVORITES, items);
  },
  remove(id) {
    const items = this.getAll().filter(r => String(r.id) !== String(id));
    save(STORAGE_KEYS.FAVORITES, items);
  },
  isFavorite(id) {
    return this.getAll().some(r => r.id === id);
  },
  toggle(recipe) {
    if (this.isFavorite(recipe.id)) {
      this.remove(recipe.id);
      return false;
    } else {
      this.add(recipe);
      return true;
    }
  }
};

// ── Meal Plan ──
export const mealPlan = {
  getAll() {
    return load(STORAGE_KEYS.MEAL_PLAN, {});
  },
  getForDate(dateStr) {
    const plans = this.getAll();
    return plans[dateStr] || { sarapan: null, siang: null, malam: null, snack: null };
  },
  setMeal(dateStr, mealType, recipe) {
    const plans = this.getAll();
    if (!plans[dateStr]) plans[dateStr] = {};
    plans[dateStr][mealType] = recipe ? { ...recipe, assignedAt: new Date().toISOString() } : null;
    save(STORAGE_KEYS.MEAL_PLAN, plans);
  },
  removeMeal(dateStr, mealType) {
    this.setMeal(dateStr, mealType, null);
  },
  getWeek(startDate) {
    const result = [];
    const d = new Date(startDate);
    for (let i = 0; i < 7; i++) {
      const dateStr = d.toISOString().split('T')[0];
      result.push({ date: dateStr, meals: this.getForDate(dateStr) });
      d.setDate(d.getDate() + 1);
    }
    return result;
  }
};

// ── Shopping List ──
export const shopping = {
  getAll() {
    return load(STORAGE_KEYS.SHOPPING, []);
  },
  add(item) {
    const items = this.getAll();
    const newItem = { id: generateId(), bought: false, createdAt: new Date().toISOString(), ...item };
    items.push(newItem);
    save(STORAGE_KEYS.SHOPPING, items);
    return newItem;
  },
  toggleBought(id) {
    const items = this.getAll();
    const idx = items.findIndex(i => i.id === id);
    if (idx !== -1) {
      items[idx].bought = !items[idx].bought;
      save(STORAGE_KEYS.SHOPPING, items);
    }
    return items[idx];
  },
  remove(id) {
    const items = this.getAll().filter(i => String(i.id) !== String(id));
    save(STORAGE_KEYS.SHOPPING, items);
  },
  clearBought() {
    const items = this.getAll().filter(i => !i.bought);
    save(STORAGE_KEYS.SHOPPING, items);
  },
  getStats() {
    const items = this.getAll();
    return {
      total: items.length,
      bought: items.filter(i => i.bought).length,
      remaining: items.filter(i => !i.bought).length,
    };
  }
};

// ── Settings ──
export const settings = {
  get() {
    return load(STORAGE_KEYS.SETTINGS, {
      apiKey: '',
      language: 'id',
      userName: 'Chef',
    });
  },
  update(updates) {
    const current = this.get();
    save(STORAGE_KEYS.SETTINGS, { ...current, ...updates });
  }
};

// ── Sample Data (loaded on first launch) ──
function getSamplePantry() {
  const sample = [
    { id: 'sp1', name: 'Telur', category: 'Protein', quantity: 12, unit: 'butir', emoji: '🥚', expiry: getFutureDate(14), createdAt: new Date().toISOString() },
    { id: 'sp2', name: 'Ayam', category: 'Protein', quantity: 500, unit: 'gram', emoji: '🍗', expiry: getFutureDate(3), createdAt: new Date().toISOString() },
    { id: 'sp3', name: 'Bawang Merah', category: 'Bumbu', quantity: 10, unit: 'siung', emoji: '🧅', expiry: getFutureDate(21), createdAt: new Date().toISOString() },
    { id: 'sp4', name: 'Bawang Putih', category: 'Bumbu', quantity: 8, unit: 'siung', emoji: '🧄', expiry: getFutureDate(30), createdAt: new Date().toISOString() },
    { id: 'sp5', name: 'Wortel', category: 'Sayur', quantity: 3, unit: 'buah', emoji: '🥕', expiry: getFutureDate(7), createdAt: new Date().toISOString() },
    { id: 'sp6', name: 'Beras', category: 'Karbo', quantity: 5, unit: 'kg', emoji: '🍚', expiry: getFutureDate(90), createdAt: new Date().toISOString() },
    { id: 'sp7', name: 'Minyak Goreng', category: 'Lainnya', quantity: 2, unit: 'liter', emoji: '🫗', expiry: getFutureDate(180), createdAt: new Date().toISOString() },
    { id: 'sp8', name: 'Kunyit', category: 'Bumbu', quantity: 5, unit: 'ruas', emoji: '🟡', expiry: getFutureDate(60), createdAt: new Date().toISOString() },
    { id: 'sp9', name: 'Tahu', category: 'Protein', quantity: 4, unit: 'buah', emoji: '🟫', expiry: getFutureDate(5), createdAt: new Date().toISOString() },
    { id: 'sp10', name: 'Cabai Merah', category: 'Bumbu', quantity: 15, unit: 'buah', emoji: '🌶️', expiry: getFutureDate(10), createdAt: new Date().toISOString() },
  ];
  save(STORAGE_KEYS.PANTRY, sample);
  return sample;
}

function getFutureDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

// ── Toast helper ──
export function showToast(message, type = 'success', duration = 3000) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}</span>
    <span>${message}</span>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('out');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ── Export utility ──
export { generateId };
