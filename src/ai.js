// ===== AI Module — Gemini API + Mock Fallback =====

import { settings } from './store.js';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'poolside/laguna-m.1:free';

// ── Generate recipe from ingredients ──
export async function generateRecipe(ingredients) {
  const { apiKey } = settings.get();

  if (!apiKey) {
    // Use mock data when no API key is set
    return getMockRecipe(ingredients);
  }

  const prompt = `Kamu adalah chef profesional Indonesia. Berdasarkan bahan-bahan berikut: ${ingredients.join(', ')}.

Buatkan SATU resep masakan Indonesia yang bisa dibuat dari bahan tersebut.

Berikan output dalam format JSON berikut (HANYA JSON, tanpa markdown):
{
  "name": "Nama Resep",
  "description": "Deskripsi singkat resep (1-2 kalimat)",
  "matchScore": 95,
  "prepTime": 15,
  "cookTime": 25,
  "servings": 4,
  "difficulty": "Mudah",
  "calories": 450,
  "ingredients": [
    { "name": "Nama bahan", "amount": "Jumlah", "fromPantry": true }
  ],
  "extraIngredients": [
    { "name": "Bahan tambahan", "amount": "Jumlah" }
  ],
  "steps": [
    "Langkah 1...",
    "Langkah 2..."
  ],
  "tips": "Tips memasak",
  "nutrition": {
    "protein": "35g",
    "carbs": "5g",
    "fat": "30g",
    "fiber": "2g"
  },
  "variations": [
    { "name": "Variasi 1", "description": "Deskripsi singkat" },
    { "name": "Variasi 2", "description": "Deskripsi singkat" },
    { "name": "Variasi 3", "description": "Deskripsi singkat" }
  ]
}

difficulty hanya boleh: "Mudah", "Sedang", atau "Sulit".
matchScore adalah persentase kesesuaian bahan yang tersedia (0-100).
fromPantry true jika bahan ada di daftar input, false jika bahan tambahan.`;

  try {
    const res = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'WhatWeCookToday'
      },
      body: JSON.stringify({
        models: [DEFAULT_MODEL, 'openrouter/free'],
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8
      })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `API error: ${res.status}`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content;

    if (!text) throw new Error('Empty response from API');

    // Extract JSON from response robustly
    let jsonString = text;
    if (jsonString.includes('```json')) {
      jsonString = jsonString.split('```json')[1].split('```')[0];
    } else if (jsonString.includes('```')) {
      jsonString = jsonString.split('```')[1].split('```')[0];
    }

    const firstBrace = jsonString.indexOf('{');
    const lastBrace = jsonString.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1) {
      console.error('Raw AI Output:', text);
      throw new Error('Could not parse recipe JSON');
    }

    try {
      return JSON.parse(jsonString.substring(firstBrace, lastBrace + 1));
    } catch (e) {
      console.error('Raw AI Output:', text);
      throw new Error('Invalid JSON format from AI');
    }
  } catch (err) {
    console.error('AI Generation error:', err);
    throw err;
  }
}

// ── Generate meal plan ──
export async function generateMealPlanAI(ingredients, days = 7) {
  const { apiKey } = settings.get();

  if (!apiKey) {
    return getMockMealPlan(days);
  }

  const prompt = `Kamu adalah chef profesional dan ahli gizi Indonesia. Berdasarkan bahan-bahan berikut: ${ingredients.join(', ')}.

Buatkan meal plan untuk ${days} hari. Setiap hari ada 3 menu: sarapan, makan siang, makan malam.

Berikan output dalam format JSON (HANYA JSON, tanpa markdown):
{
  "days": [
    {
      "day": 1,
      "sarapan": { "name": "Nama", "cookTime": 15, "calories": 300, "emoji": "🍳" },
      "siang": { "name": "Nama", "cookTime": 30, "calories": 500, "emoji": "🍛" },
      "malam": { "name": "Nama", "cookTime": 25, "calories": 400, "emoji": "🥘" }
    }
  ]
}`;

  try {
    const res = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'WhatWeCookToday'
      },
      body: JSON.stringify({
        models: [DEFAULT_MODEL, 'openrouter/free'],
        messages: [{ role: "user", content: prompt }],
        temperature: 0.9
      })
    });

    if (!res.ok) throw new Error(`API error: ${res.status}`);

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content;
    let jsonString = text;
    if (jsonString.includes('```json')) {
      jsonString = jsonString.split('```json')[1].split('```')[0];
    } else if (jsonString.includes('```')) {
      jsonString = jsonString.split('```')[1].split('```')[0];
    }

    const firstBrace = jsonString.indexOf('{');
    const lastBrace = jsonString.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1) {
      console.error('Raw AI Output:', text);
      throw new Error('Could not parse meal plan JSON');
    }

    try {
      return JSON.parse(jsonString.substring(firstBrace, lastBrace + 1));
    } catch (e) {
      console.error('Raw AI Output:', text);
      throw new Error('Invalid JSON format from AI');
    }
  } catch (err) {
    console.error('Meal Plan AI error:', err);
    throw err;
  }
}


// ═══════════════════════════════════════════
// ── Mock Data (used when no API key) ──
// ═══════════════════════════════════════════

const MOCK_RECIPES_DB = [
  {
    name: 'Ayam Goreng Bumbu Kuning',
    description: 'Resep ayam goreng bumbu kuning yang lezat dan gurih, menonjolkan rasa rempah alami ayam.',
    matchScore: 95,
    prepTime: 15,
    cookTime: 25,
    servings: 4,
    difficulty: 'Mudah',
    calories: 450,
    emoji: '🍗',
    ingredients: [
      { name: 'Ayam', amount: '500 gram', fromPantry: true },
      { name: 'Kunyit', amount: '3 ruas', fromPantry: true },
      { name: 'Bawang Merah', amount: '5 siung', fromPantry: true },
      { name: 'Bawang Putih', amount: '3 siung', fromPantry: true },
      { name: 'Minyak Goreng', amount: 'secukupnya', fromPantry: true },
    ],
    extraIngredients: [
      { name: 'Garam', amount: '1 sdt' },
      { name: 'Ketumbar bubuk', amount: '1/2 sdt' },
      { name: 'Lengkuas', amount: '2 ruas' },
      { name: 'Daun salam', amount: '2 lembar' },
    ],
    steps: [
      'Haluskan kunyit, bawang merah, bawang putih, dan ketumbar menjadi bumbu halus.',
      'Lumuri ayam dengan bumbu halus, garam, dan sedikit air jeruk nipis. Marinasi minimal 30 menit.',
      'Panaskan minyak goreng dalam wajan dengan api sedang.',
      'Goreng ayam hingga kuning kecoklatan dan matang merata, sekitar 15-20 menit.',
      'Angkat dan tiriskan. Sajikan dengan nasi putih hangat dan sambal.',
    ],
    tips: 'Untuk hasil lebih renyah, goreng dua kali: pertama api kecil sampai matang, lalu api besar sebentar untuk kerenyahan.',
    nutrition: { protein: '35g', carbs: '5g', fat: '30g', fiber: '1g' },
    variations: [
      { name: 'Ayam Goreng Lengkuas', description: 'Tambahkan parutan lengkuas ke bumbu untuk aroma khas.' },
      { name: 'Ayam Goreng Serundeng', description: 'Taburi kelapa parut sangrai di atas ayam goreng.' },
      { name: 'Ayam Bumbu Kuning Bakar', description: 'Ganti goreng dengan panggang untuk versi lebih sehat.' },
    ],
  },
  {
    name: 'Telur Dadar Padang',
    description: 'Telur dadar tebal ala Padang yang kaya rasa dengan irisan cabai dan daun bawang.',
    matchScore: 90,
    prepTime: 10,
    cookTime: 15,
    servings: 2,
    difficulty: 'Mudah',
    calories: 280,
    emoji: '🥚',
    ingredients: [
      { name: 'Telur', amount: '4 butir', fromPantry: true },
      { name: 'Bawang Merah', amount: '3 siung', fromPantry: true },
      { name: 'Cabai Merah', amount: '3 buah', fromPantry: true },
      { name: 'Minyak Goreng', amount: '3 sdm', fromPantry: true },
    ],
    extraIngredients: [
      { name: 'Daun bawang', amount: '2 batang' },
      { name: 'Garam', amount: '1/2 sdt' },
      { name: 'Merica', amount: 'secukupnya' },
    ],
    steps: [
      'Kocok telur dalam mangkuk besar, tambahkan garam dan merica.',
      'Iris tipis bawang merah, cabai merah, dan daun bawang. Campurkan ke kocokan telur.',
      'Panaskan minyak goreng agak banyak dalam wajan anti lengket.',
      'Tuang adonan telur, masak api sedang hingga bagian bawah set.',
      'Balik telur dadar dan masak sisi lainnya hingga kecoklatan.',
      'Angkat, potong-potong, dan sajikan.',
    ],
    tips: 'Kunci telur dadar Padang yang tebal adalah minyak yang cukup banyak dan api sedang.',
    nutrition: { protein: '20g', carbs: '3g', fat: '22g', fiber: '1g' },
    variations: [
      { name: 'Telur Dadar Kornet', description: 'Tambahkan kornet untuk rasa lebih gurih.' },
      { name: 'Telur Dadar Sayur', description: 'Tambahkan wortel dan kol iris halus.' },
      { name: 'Telur Dadar Jamur', description: 'Campurkan jamur kancing iris tipis.' },
    ],
  },
  {
    name: 'Capcay Sayur Sederhana',
    description: 'Tumisan sayuran segar ala Chinese-Indonesian yang sehat dan cepat dibuat.',
    matchScore: 85,
    prepTime: 15,
    cookTime: 10,
    servings: 3,
    difficulty: 'Mudah',
    calories: 180,
    emoji: '🥬',
    ingredients: [
      { name: 'Wortel', amount: '2 buah', fromPantry: true },
      { name: 'Bawang Putih', amount: '4 siung', fromPantry: true },
      { name: 'Bawang Merah', amount: '3 siung', fromPantry: true },
      { name: 'Minyak Goreng', amount: '2 sdm', fromPantry: true },
    ],
    extraIngredients: [
      { name: 'Sawi putih', amount: '200 gram' },
      { name: 'Kembang kol', amount: '100 gram' },
      { name: 'Saus tiram', amount: '2 sdm' },
      { name: 'Maizena', amount: '1 sdm' },
      { name: 'Air', amount: '100 ml' },
      { name: 'Garam & gula', amount: 'secukupnya' },
    ],
    steps: [
      'Potong semua sayuran sesuai selera. Iris tipis bawang merah dan bawang putih.',
      'Panaskan minyak, tumis bawang merah dan bawang putih hingga harum.',
      'Masukkan wortel terlebih dahulu karena butuh waktu lebih lama matang.',
      'Tambahkan sayuran lain, aduk rata. Tuang air dan saus tiram.',
      'Larutkan maizena dengan sedikit air, tuang ke tumisan sambil diaduk.',
      'Masak hingga sayuran matang tapi masih renyah. Angkat dan sajikan.',
    ],
    tips: 'Jangan terlalu lama memasak sayuran agar tetap renyah dan nutrisinya terjaga.',
    nutrition: { protein: '5g', carbs: '20g', fat: '8g', fiber: '5g' },
    variations: [
      { name: 'Capcay Seafood', description: 'Tambahkan udang dan cumi untuk variasi protein.' },
      { name: 'Capcay Ayam', description: 'Tambahkan potongan dada ayam fillet.' },
      { name: 'Capcay Tahu Telur', description: 'Tambahkan tahu goreng dan telur orak-arik.' },
    ],
  },
  {
    name: 'Nasi Goreng Spesial',
    description: 'Nasi goreng rumahan dengan bumbu sederhana tapi cita rasa restoran.',
    matchScore: 88,
    prepTime: 10,
    cookTime: 15,
    servings: 2,
    difficulty: 'Mudah',
    calories: 520,
    emoji: '🍛',
    ingredients: [
      { name: 'Beras', amount: '2 piring nasi', fromPantry: true },
      { name: 'Telur', amount: '2 butir', fromPantry: true },
      { name: 'Bawang Merah', amount: '4 siung', fromPantry: true },
      { name: 'Bawang Putih', amount: '2 siung', fromPantry: true },
      { name: 'Cabai Merah', amount: '5 buah', fromPantry: true },
      { name: 'Minyak Goreng', amount: '3 sdm', fromPantry: true },
    ],
    extraIngredients: [
      { name: 'Kecap manis', amount: '2 sdm' },
      { name: 'Garam', amount: 'secukupnya' },
      { name: 'Kaldu ayam bubuk', amount: '1/2 sdt' },
    ],
    steps: [
      'Haluskan bawang merah, bawang putih, dan cabai.',
      'Panaskan minyak, tumis bumbu halus hingga harum dan matang.',
      'Sisihkan bumbu ke pinggir, masukkan telur dan orak-arik.',
      'Masukkan nasi, aduk rata dengan bumbu dan telur.',
      'Tambahkan kecap manis, garam, dan kaldu bubuk. Aduk hingga rata.',
      'Masak dengan api besar sambil terus diaduk hingga nasi kering dan harum.',
      'Sajikan dengan pelengkap: acar, kerupuk, dan irisan timun.',
    ],
    tips: 'Gunakan nasi yang sudah dingin (sisa semalam) agar hasilnya lebih pera dan tidak lembek.',
    nutrition: { protein: '15g', carbs: '65g', fat: '18g', fiber: '3g' },
    variations: [
      { name: 'Nasi Goreng Kampung', description: 'Tambahkan petai dan teri medan.' },
      { name: 'Nasi Goreng Rendang', description: 'Campurkan sisa rendang ke nasi goreng.' },
      { name: 'Nasi Goreng Ijo', description: 'Gunakan cabai hijau dan daun kemangi.' },
    ],
  },
  {
    name: 'Sup Wortel Ayam',
    description: 'Sup hangat berisi potongan ayam dan wortel, cocok untuk cuaca dingin.',
    matchScore: 92,
    prepTime: 15,
    cookTime: 30,
    servings: 4,
    difficulty: 'Mudah',
    calories: 220,
    emoji: '🍲',
    ingredients: [
      { name: 'Ayam', amount: '300 gram', fromPantry: true },
      { name: 'Wortel', amount: '2 buah', fromPantry: true },
      { name: 'Bawang Putih', amount: '3 siung', fromPantry: true },
      { name: 'Bawang Merah', amount: '3 siung', fromPantry: true },
    ],
    extraIngredients: [
      { name: 'Kentang', amount: '2 buah' },
      { name: 'Daun bawang', amount: '2 batang' },
      { name: 'Seledri', amount: '2 batang' },
      { name: 'Garam & merica', amount: 'secukupnya' },
      { name: 'Air', amount: '1 liter' },
    ],
    steps: [
      'Potong ayam sesuai selera, rebus hingga empuk. Buang busa yang muncul.',
      'Potong wortel dan kentang bentuk dadu.',
      'Goreng bawang merah dan bawang putih hingga harum, masukkan ke rebusan ayam.',
      'Tambahkan wortel dan kentang, masak hingga empuk.',
      'Bumbui dengan garam dan merica. Koreksi rasa.',
      'Tambahkan irisan daun bawang dan seledri. Sajikan hangat.',
    ],
    tips: 'Tambahkan perasan jeruk nipis saat penyajian untuk kesegaran ekstra.',
    nutrition: { protein: '25g', carbs: '15g', fat: '8g', fiber: '3g' },
    variations: [
      { name: 'Sup Krim Wortel', description: 'Blender wortel dengan krim untuk tekstur creamy.' },
      { name: 'Soto Ayam', description: 'Tambahkan kunyit dan santan tipis ala soto.' },
      { name: 'Sup Makaroni Ayam', description: 'Tambahkan makaroni rebus ke dalam sup.' },
    ],
  },
  {
    name: 'Tahu Goreng Crispy',
    description: 'Tahu goreng dengan lapisan luar yang renyah dan bagian dalam yang lembut.',
    matchScore: 87,
    prepTime: 10,
    cookTime: 15,
    servings: 3,
    difficulty: 'Mudah',
    calories: 200,
    emoji: '🟫',
    ingredients: [
      { name: 'Tahu', amount: '4 buah', fromPantry: true },
      { name: 'Bawang Putih', amount: '3 siung', fromPantry: true },
      { name: 'Minyak Goreng', amount: 'secukupnya', fromPantry: true },
    ],
    extraIngredients: [
      { name: 'Tepung terigu', amount: '5 sdm' },
      { name: 'Tepung beras', amount: '2 sdm' },
      { name: 'Garam', amount: '1/2 sdt' },
      { name: 'Air', amount: '100 ml' },
    ],
    steps: [
      'Potong tahu menjadi bentuk kotak atau segitiga.',
      'Haluskan bawang putih dengan garam.',
      'Campurkan tepung terigu, tepung beras, bawang putih halus, dan air. Aduk rata.',
      'Celupkan tahu ke dalam adonan tepung.',
      'Goreng dalam minyak panas hingga kuning keemasan dan renyah.',
      'Angkat dan tiriskan. Sajikan dengan saus sambal atau kecap.',
    ],
    tips: 'Campur tepung beras dalam adonan untuk tekstur yang lebih renyah.',
    nutrition: { protein: '12g', carbs: '15g', fat: '10g', fiber: '2g' },
    variations: [
      { name: 'Tahu Isi', description: 'Isi tahu dengan sayuran sebelum digoreng.' },
      { name: 'Tahu Telur', description: 'Celupkan tahu dalam kocokan telur sebelum digoreng.' },
      { name: 'Tahu Bumbu Rujak', description: 'Sajikan dengan bumbu rujak kacang.' },
    ],
  }
];

function getMockRecipe(ingredients) {
  // Simulate delay
  return new Promise((resolve) => {
    setTimeout(() => {
      const ingredientNames = ingredients.map(i => i.toLowerCase());
      // Simple matching: pick recipe with most matching ingredients
      let bestMatch = MOCK_RECIPES_DB[0];
      let bestScore = 0;

      for (const recipe of MOCK_RECIPES_DB) {
        let score = 0;
        for (const ri of recipe.ingredients) {
          if (ingredientNames.some(i => ri.name.toLowerCase().includes(i) || i.includes(ri.name.toLowerCase()))) {
            score++;
          }
        }
        if (score > bestScore) {
          bestScore = score;
          bestMatch = recipe;
        }
      }

      // Adjust match score based on actual matching
      const totalNeeded = bestMatch.ingredients.length;
      const matchPercent = Math.round((bestScore / totalNeeded) * 100);

      resolve({
        ...bestMatch,
        matchScore: Math.max(matchPercent, 60 + Math.floor(Math.random() * 30)),
      });
    }, 1500 + Math.random() * 1000);
  });
}

function getMockMealPlan(days) {
  const meals = [
    { name: 'Nasi Goreng Spesial', cookTime: 15, calories: 520, emoji: '🍛' },
    { name: 'Telur Dadar Padang', cookTime: 15, calories: 280, emoji: '🥚' },
    { name: 'Sup Wortel Ayam', cookTime: 30, calories: 220, emoji: '🍲' },
    { name: 'Ayam Goreng Bumbu Kuning', cookTime: 25, calories: 450, emoji: '🍗' },
    { name: 'Capcay Sayur', cookTime: 10, calories: 180, emoji: '🥬' },
    { name: 'Tahu Goreng Crispy', cookTime: 15, calories: 200, emoji: '🟫' },
    { name: 'Soto Ayam', cookTime: 45, calories: 350, emoji: '🍜' },
    { name: 'Tumis Kangkung', cookTime: 10, calories: 120, emoji: '🥗' },
    { name: 'Pecel Lele', cookTime: 20, calories: 400, emoji: '🐟' },
  ];

  return new Promise((resolve) => {
    setTimeout(() => {
      const result = { days: [] };
      for (let i = 0; i < days; i++) {
        result.days.push({
          day: i + 1,
          sarapan: meals[Math.floor(Math.random() * meals.length)],
          siang: meals[Math.floor(Math.random() * meals.length)],
          malam: meals[Math.floor(Math.random() * meals.length)],
        });
      }
      resolve(result);
    }, 2000);
  });
}
