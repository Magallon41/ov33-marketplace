#!/usr/bin/env node
/**
 * scripts/generate-sitemap.js
 *
 * Genera un sitemap.xml dinámico que incluye todos los productos
 * activos de Firestore, combinados con las rutas estáticas del sitio.
 *
 * Uso:
 *   node scripts/generate-sitemap.js
 *
 * Configurar antes de ejecutar:
 *   - Asegúrate de que las variables de entorno de Firebase están definidas
 *     en el archivo .env en la raíz del proyecto.
 *   - Instalar firebase-admin: npm install firebase-admin --save-dev
 *
 * Integración con el build:
 *   En package.json:
 *     "build": "node scripts/generate-sitemap.js && vite build"
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = resolve(__dirname, '../public/sitemap.xml');
const SITE_URL = 'https://edvictory.com';
const TODAY = new Date().toISOString().split('T')[0];

// ── Rutas estáticas ──────────────────────────────────────────────────────────
const STATIC_URLS = [
  { loc: '/', changefreq: 'weekly', priority: '1.0' },
  { loc: '/catalog', changefreq: 'daily', priority: '0.9' },
  { loc: '/ofertas', changefreq: 'daily', priority: '0.9' },
  { loc: '/about', changefreq: 'monthly', priority: '0.7' },
  { loc: '/tracking', changefreq: 'monthly', priority: '0.6' },
  { loc: '/shipping', changefreq: 'monthly', priority: '0.5' },
  { loc: '/size-guide', changefreq: 'monthly', priority: '0.6' },
  { loc: '/privacy', changefreq: 'yearly', priority: '0.4' },
  { loc: '/revista', changefreq: 'weekly', priority: '0.8' },
  // Artículos locales de la revista
  { loc: '/revista/guia-camisa-oxford', changefreq: 'monthly', priority: '0.7' },
  { loc: '/revista/minimalismo-masculino', changefreq: 'monthly', priority: '0.7' },
  { loc: '/revista/como-planchar-camisa', changefreq: 'monthly', priority: '0.7' },
  { loc: '/revista/colores-camisa-piel-morena', changefreq: 'monthly', priority: '0.7' },
];

// ── Inicializar Firebase Admin ───────────────────────────────────────────────
function initFirebase() {
  if (getApps().length > 0) return getFirestore();

  // Opción 1: Usar Application Default Credentials (GCP / CI)
  // initializeApp();

  // Opción 2: Usar Service Account JSON (local)
  // Coloca tu service account en scripts/service-account.json
  // y asegúrate de que esté en .gitignore
  try {
    const serviceAccount = JSON.parse(
      process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '{}'
    );
    initializeApp({ credential: cert(serviceAccount) });
  } catch {
    console.warn('⚠️  No se pudo inicializar Firebase Admin. Generando sitemap solo con rutas estáticas.');
    return null;
  }

  return getFirestore();
}

// ── Generar XML ──────────────────────────────────────────────────────────────
function buildSitemap(urls) {
  const urlEntries = urls.map(u => `
  <url>
    <loc>${SITE_URL}${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
    <lastmod>${u.lastmod || TODAY}</lastmod>
  </url>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlEntries}
</urlset>`;
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🗺️  Generando sitemap.xml...');

  let productUrls = [];

  const db = initFirebase();

  if (db) {
    try {
      const snapshot = await db.collection('products').where('active', '!=', false).get();
      productUrls = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          loc: `/product/${doc.id}`,
          changefreq: 'weekly',
          priority: '0.8',
          lastmod: data.updatedAt?.toDate
            ? data.updatedAt.toDate().toISOString().split('T')[0]
            : TODAY,
        };
      });
      console.log(`   ✅ ${productUrls.length} productos obtenidos de Firestore.`);
    } catch (err) {
      console.warn('   ⚠️  Error al leer productos de Firestore:', err.message);
    }
  } else {
    console.log('   ℹ️  Firebase no disponible — se omiten URLs de productos.');
  }

  const allUrls = [...STATIC_URLS, ...productUrls];
  const xml = buildSitemap(allUrls);

  writeFileSync(OUTPUT_PATH, xml, 'utf8');
  console.log(`✅ sitemap.xml generado con ${allUrls.length} URLs → ${OUTPUT_PATH}`);
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error generando sitemap:', err);
  process.exit(1);
});
