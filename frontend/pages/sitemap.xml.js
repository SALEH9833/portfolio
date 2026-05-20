// Dynamic sitemap.xml — includes static pages + all CV templates
const BASE = 'https://saleh-portfolio.com';

function generateSiteMap(templates) {
  const today = new Date().toISOString().split('T')[0];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${BASE}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${BASE}/cv-templates</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${BASE}/cv-builder</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  ${templates.map(t => `<url>
    <loc>${BASE}/cv-templates#${t.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`).join('\n  ')}
</urlset>`;
}

export async function getServerSideProps({ res }) {
  let templates = [];
  try {
    const axios = require('axios');
    const r = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/cv-templates`, { timeout: 5000 });
    templates = r.data?.data || [];
  } catch {}
  const xml = generateSiteMap(templates);
  res.setHeader('Content-Type', 'text/xml');
  res.write(xml);
  res.end();
  return { props: {} };
}

export default function Sitemap() { return null; }
