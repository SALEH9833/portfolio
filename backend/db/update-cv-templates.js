require('dotenv').config();
const { query, pool } = require('../db');

const newTemplates = [
  // 4 LUXURY (9,99€)
  { slug: 'canva-lux-1', name: 'Executive Luxury - Emerald & Gold', description: 'CV ultra-premium pour dirigeants, palette émeraude et or, typographie éditoriale', category: 'Corporate', style: 'canva', preview_url: 'https://design.canva.ai/xzdHD16MCECg0m0', edit_url: 'https://www.canva.com/d/F5iLSfkuqxh1em7', is_premium: true, price: 9.99, tags: ['luxe','dirigeant','éditorial','or'], order: 40 },
  { slug: 'canva-lux-2', name: 'Executive Luxury - Burgundy', description: 'Design éditorial bordeaux et crème, qualité magazine pour cadres senior', category: 'Corporate', style: 'canva', preview_url: 'https://design.canva.ai/jH9G4BnswLY5O--', edit_url: 'https://www.canva.com/d/RX6c5uHjSaXhbv8', is_premium: true, price: 9.99, tags: ['luxe','éditorial','bordeaux','senior'], order: 41 },
  { slug: 'canva-lux-3', name: 'Executive Luxury - Rose Gold', description: 'Anthracite et or rose, raffinement absolu', category: 'Corporate', style: 'canva', preview_url: 'https://design.canva.ai/tEYOk0iHQ5GnA2X', edit_url: 'https://www.canva.com/d/m4jQvdHIU87tbsY', is_premium: true, price: 9.99, tags: ['luxe','or rose','raffiné','consultant'], order: 42 },
  { slug: 'canva-lux-4', name: 'Executive Luxury - Navy & Silver', description: 'Marine et argent, élégance Monocle/Economist pour direction', category: 'Corporate', style: 'canva', preview_url: 'https://design.canva.ai/XzBUV3tBuqgBYHz', edit_url: 'https://www.canva.com/d/FDKZp3tZ4uH2TeJ', is_premium: true, price: 9.99, tags: ['luxe','marine','élégant','direction'], order: 43 },

  // 4 NICHE (7,99€)
  { slug: 'canva-medical',     name: 'Médical / Santé',     description: 'CV pour médecins, infirmiers, professions de santé. Bleus apaisants, sections cliniques structurées', category: 'Santé', style: 'canva', preview_url: 'https://design.canva.ai/Ii-6iqqb8eoYZez', edit_url: 'https://www.canva.com/d/4FaMk--pSwR_4pJ', is_premium: true, price: 7.99, tags: ['médical','santé','clinique','hôpital'], order: 50 },
  { slug: 'canva-legal',       name: 'Juridique / Avocat',  description: 'CV classique raffiné pour avocats, juristes. Marine et bordeaux, typographie sérigraphique', category: 'Juridique', style: 'canva', preview_url: 'https://design.canva.ai/ybbDZMNKGvkqakU', edit_url: 'https://www.canva.com/d/8O3LpFsxZRQFfof', is_premium: true, price: 7.99, tags: ['juridique','avocat','classique','barreau'], order: 51 },
  { slug: 'canva-architecture',name: 'Architecte / Designer',description: 'Grille architecturale minimaliste, monochrome avec accent unique', category: 'Architecture', style: 'canva', preview_url: 'https://design.canva.ai/uZh0I2XBbmm1GE1', edit_url: 'https://www.canva.com/d/JguI7i0uA1hK3qp', is_premium: true, price: 7.99, tags: ['architecte','designer','minimaliste','géométrique'], order: 52 },
  { slug: 'canva-academic',    name: 'Académique / Doctorat',description: 'CV scientifique pour chercheurs, doctorants, enseignants. Sections publications, conférences, recherche', category: 'Académique', style: 'canva', preview_url: 'https://design.canva.ai/7RgVaunroDCGSjd', edit_url: 'https://www.canva.com/d/I4VXE5R67q59jPs', is_premium: true, price: 7.99, tags: ['académique','recherche','doctorat','publications'], order: 53 },
];

(async () => {
  try {
    // 1. Remove the Tech Pro - Dark template (user requested)
    const del = await query("DELETE FROM cv_templates WHERE slug = 'canva-tech-1' RETURNING name");
    if (del.rowCount) console.log('✗ Supprimé:', del.rows[0].name);

    // 2. Insert new luxury + niche templates
    for (const t of newTemplates) {
      await query(
        `INSERT INTO cv_templates (slug, name, description, category, style, preview_url, edit_url, is_premium, price, tags, display_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, preview_url=EXCLUDED.preview_url, edit_url=EXCLUDED.edit_url, price=EXCLUDED.price`,
        [t.slug, t.name, t.description, t.category, t.style, t.preview_url, t.edit_url, t.is_premium, t.price, t.tags, t.order]
      );
      console.log('✓ Ajouté:', t.name, '·', t.price + '€');
    }

    const { rows } = await query('SELECT COUNT(*)::int AS n FROM cv_templates');
    console.log('\nTotal templates en BDD:', rows[0].n);
  } catch (e) { console.error(e); }
  finally { await pool.end(); }
})();
