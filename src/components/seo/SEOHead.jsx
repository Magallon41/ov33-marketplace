import React from 'react';
import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'ED VICTORY SHIRT BRAND';
const SITE_URL = 'https://edvictory.com';
const DEFAULT_IMAGE = `${SITE_URL}/logo.png`;
const DEFAULT_DESCRIPTION =
  'ED VICTORY — Camisas de lujo para el hombre moderno. Arquitectura textil con precisión, sobriedad y materiales de primera calidad. Envíos a toda México.';

/**
 * Componente SEO reutilizable.
 *
 * Props:
 *  - title        {string}  Título de la página (sin el sufijo de marca)
 *  - description  {string}  Meta description (160 chars máx recomendado)
 *  - image        {string}  URL absoluta de la imagen OG (1200x630 ideal)
 *  - url          {string}  URL canónica de la página (sin trailing slash)
 *  - type         {string}  og:type — 'website' | 'product' | 'article'
 *  - schema       {object|object[]}  JSON-LD schema(s) adicionales
 *  - noIndex      {boolean} Si true, añade noindex,nofollow
 */
export function SEOHead({
  title,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  url,
  type = 'website',
  schema,
  noIndex = false,
}) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const canonicalUrl = url ? `${SITE_URL}${url}` : SITE_URL;
  const absoluteImage = image?.startsWith('http') ? image : `${SITE_URL}${image}`;

  // Normalizar schema a array
  const schemas = schema ? (Array.isArray(schema) ? schema : [schema]) : [];

  return (
    <Helmet>
      {/* ── Básico ── */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={noIndex ? 'noindex,nofollow' : 'index,follow'} />
      <link rel="canonical" href={canonicalUrl} />

      {/* ── Open Graph ── */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={absoluteImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:locale" content="es_MX" />

      {/* ── Twitter Cards ── */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={absoluteImage} />
      <meta name="twitter:site" content="@edvictorybrand" />

      {/* ── JSON-LD Schemas adicionales ── */}
      {schemas.map((s, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(s)}
        </script>
      ))}
    </Helmet>
  );
}
