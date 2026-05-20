require('dotenv').config();
const { query, pool } = require('../db');

const templates = [
  // 5 builders (free, on-site) — point to builder slugs
  { slug: 'modern',   name: 'Modern',      description: 'Barre latérale colorée, design contemporain', category: 'Universel', style: 'modern',   preview_url: null, builder_id: 'modern',   is_premium: false, price: 0, order: 1 },
  { slug: 'classic',  name: 'Classique',   description: 'Sobre, ATS-friendly, parfait pour candidatures classiques', category: 'Universel', style: 'classic',  preview_url: null, builder_id: 'classic',  is_premium: false, price: 0, order: 2 },
  { slug: 'creative', name: 'Créatif',     description: 'Header coloré + timeline visuelle', category: 'Créatif',  style: 'creative', preview_url: null, builder_id: 'creative', is_premium: false, price: 0, order: 3 },
  { slug: 'minimal',  name: 'Minimaliste', description: 'Très épuré, typographie soignée', category: 'Universel', style: 'minimal',  preview_url: null, builder_id: 'minimal',  is_premium: false, price: 0, order: 4 },
  { slug: 'tech',     name: 'Tech / Dev',  description: 'Style terminal pour développeurs', category: 'Tech', style: 'tech',     preview_url: null, builder_id: 'tech',     is_premium: false, price: 0, order: 5 },

  // 12 Canva premium designs
  { slug: 'canva-tech-1',     name: 'Tech Pro - Dark',         description: 'Modèle moderne pour développeur, barre latérale sombre avec accents néon', category: 'Tech', style: 'canva', preview_url: 'https://design.canva.ai/nv9ZPimZJKyazZl', edit_url: 'https://www.canva.com/d/cvC-KCyWSPyNi15', is_premium: true, price: 4.99, tags: ['tech','développeur','moderne','sombre'], order: 10 },
  { slug: 'canva-tech-2',     name: 'Tech Pro - Clean Blue',   description: 'CV professionnel avec accents bleus, fond blanc, parfait pour ingénieurs', category: 'Tech', style: 'canva', preview_url: 'https://design.canva.ai/MUBaZR1Wsa33tAp', edit_url: 'https://www.canva.com/d/5fGGYV7cRy4Wxui', is_premium: true, price: 4.99, tags: ['tech','propre','bleu','ingénieur'], order: 11 },
  { slug: 'canva-tech-3',     name: 'Tech Pro - Minimal Dev',  description: 'CV minimaliste pour développeur, espacement généreux', category: 'Tech', style: 'canva', preview_url: 'https://design.canva.ai/vjMNV51GEm9At0q', edit_url: 'https://www.canva.com/d/ptiL_mkPHmAkc0J', is_premium: true, price: 4.99, tags: ['tech','minimaliste','développeur'], order: 12 },
  { slug: 'canva-tech-4',     name: 'Tech Pro - Bold Orange',  description: 'CV tech audacieux avec accents orange et formes géométriques', category: 'Tech', style: 'canva', preview_url: 'https://design.canva.ai/_lZrUzlGar5l8LT', edit_url: 'https://www.canva.com/d/f0uycpB0sUng3ir', is_premium: true, price: 4.99, tags: ['tech','audacieux','orange'], order: 13 },

  { slug: 'canva-creative-1', name: 'Créatif Magazine',        description: 'Layout magazine avec grande typographie pour marketers et designers', category: 'Créatif', style: 'canva', preview_url: 'https://design.canva.ai/ulqMdPn9ncCvbMn', edit_url: 'https://www.canva.com/d/IauuvsGkDEqFbVf', is_premium: true, price: 4.99, tags: ['créatif','marketing','magazine'], order: 20 },
  { slug: 'canva-creative-2', name: 'Créatif Pastel',          description: 'Palette pastel élégante, typographie serif raffinée', category: 'Créatif', style: 'canva', preview_url: 'https://design.canva.ai/MZjobhiEiAFeK5_', edit_url: 'https://www.canva.com/d/DIN_FUHTMbywCMu', is_premium: true, price: 4.99, tags: ['créatif','pastel','élégant'], order: 21 },
  { slug: 'canva-creative-3', name: 'Créatif Editorial',       description: 'Style éditorial avec vitrine portfolio intégrée', category: 'Créatif', style: 'canva', preview_url: 'https://design.canva.ai/nMEj1kzv_Nl10nr', edit_url: 'https://www.canva.com/d/nxbS0MCpSFF1U91', is_premium: true, price: 4.99, tags: ['créatif','portfolio','éditorial'], order: 22 },
  { slug: 'canva-creative-4', name: 'Créatif Géométrique',     description: 'Formes géométriques colorées, parfait pour designers', category: 'Créatif', style: 'canva', preview_url: 'https://design.canva.ai/EZZuANhoFFvqp8K', edit_url: 'https://www.canva.com/d/2jW2Pj01iQ8zmRZ', is_premium: true, price: 4.99, tags: ['créatif','géométrique','designer'], order: 23 },

  { slug: 'canva-corp-1',     name: 'Executive Classic',       description: 'CV cadre dirigeant avec typographie serif et accents navy', category: 'Corporate', style: 'canva', preview_url: 'https://design.canva.ai/PBLqoiLnjIl7gVt', edit_url: 'https://www.canva.com/d/AYqTEj-ixKgJMtt', is_premium: true, price: 6.99, tags: ['corporate','dirigeant','classique'], order: 30 },
  { slug: 'canva-corp-2',     name: 'Executive Modern Navy',   description: 'CV cadre moderne, palette marine, ATS-friendly', category: 'Corporate', style: 'canva', preview_url: 'https://design.canva.ai/ucKQTHLaU3RiNrV', edit_url: 'https://www.canva.com/d/r-63YAR1Zkjx0wT', is_premium: true, price: 6.99, tags: ['corporate','moderne','navy'], order: 31 },
  { slug: 'canva-corp-3',     name: 'Consulting Refined',      description: 'CV consulting raffiné, palette grise sophistiquée', category: 'Corporate', style: 'canva', preview_url: 'https://design.canva.ai/uaNM9xoHkzOu1vg', edit_url: 'https://www.canva.com/d/biJSGJY2A-MrDdg', is_premium: true, price: 6.99, tags: ['corporate','consulting','gris'], order: 32 },
  { slug: 'canva-corp-4',     name: 'Executive Black & White', description: 'CV cadre noir et blanc minimaliste, intemporel', category: 'Corporate', style: 'canva', preview_url: 'https://design.canva.ai/YHrvmDRYRtn4kRe', edit_url: 'https://www.canva.com/d/ty-q2EG1mOxdOlm', is_premium: true, price: 6.99, tags: ['corporate','intemporel','noir et blanc'], order: 33 },
];

(async () => {
  try {
    await query('DELETE FROM cv_templates');
    for (const t of templates) {
      await query(
        `INSERT INTO cv_templates (slug, name, description, category, style, preview_url, edit_url, builder_id, is_premium, price, tags, display_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [t.slug, t.name, t.description, t.category, t.style, t.preview_url, t.edit_url || null, t.builder_id || null, t.is_premium, t.price, t.tags || [], t.order]
      );
    }
    const { rows } = await query('SELECT COUNT(*)::int AS n FROM cv_templates');
    console.log('✓ Templates seeded:', rows[0].n);
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
})();
