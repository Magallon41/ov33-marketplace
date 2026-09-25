import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ARTICLES, CATEGORIES } from '../data/articles';
import { SEOHead } from '../components/seo/SEOHead';

const CATEGORY_COLORS = {
  ESTILO: 'bg-amber-100 text-amber-800',
  FILOSOFÍA: 'bg-neutral-100 text-neutral-700',
  CUIDADO: 'bg-emerald-50 text-emerald-800',
};

function ArticleCard({ article, featured = false }) {
  const categoryStyle = CATEGORY_COLORS[article.category] || 'bg-neutral-100 text-neutral-700';
  const date = new Date(article.date).toLocaleDateString('es-MX', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  if (featured) {
    return (
      <article className="group grid grid-cols-1 lg:grid-cols-2 gap-0 border border-neutral-100 hover:border-neutral-300 transition-all duration-300">
        <Link to={`/revista/${article.slug}`} className="overflow-hidden block" aria-label={`Leer artículo: ${article.title}`}>
          <div className="aspect-[16/10] lg:aspect-auto lg:h-full overflow-hidden bg-neutral-100">
            <img
              src={article.image}
              alt={article.imageAlt}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              fetchpriority="high"
              width="800"
              height="500"
            />
          </div>
        </Link>
        <div className="flex flex-col justify-between p-8 md:p-12 bg-white">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <span className={`font-label-caps text-[9px] tracking-widest uppercase px-3 py-1 ${categoryStyle}`}>
                {article.category}
              </span>
              <span className="font-label-caps text-[9px] text-neutral-400 uppercase tracking-widest">DESTACADO</span>
            </div>
            <Link to={`/revista/${article.slug}`}>
              <h2 className="font-display-xl text-[28px] md:text-[36px] uppercase leading-tight mb-4 hover:text-amber-700 transition-colors">{article.title}</h2>
            </Link>
            <p className="font-body-lg text-secondary leading-relaxed mb-8">{article.excerpt}</p>
          </div>
          <div className="flex items-center justify-between pt-6 border-t border-neutral-100">
            <div className="font-label-caps text-[9px] text-neutral-400 uppercase tracking-widest">
              <time dateTime={article.date}>{date}</time>
              <span className="mx-2">·</span>
              {article.readTime} de lectura
            </div>
            <Link
              to={`/revista/${article.slug}`}
              className="font-button text-[10px] uppercase tracking-widest border-b border-black pb-1 hover:text-amber-600 hover:border-amber-600 transition-colors"
            >
              Leer Artículo →
            </Link>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group flex flex-col border border-neutral-100 hover:border-neutral-300 transition-all duration-300 hover:shadow-sm">
      <Link to={`/revista/${article.slug}`} className="overflow-hidden block" aria-label={`Leer artículo: ${article.title}`}>
        <div className="aspect-[16/10] overflow-hidden bg-neutral-100">
          <img
            src={article.image}
            alt={article.imageAlt}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            loading="lazy"
            width="600"
            height="375"
          />
        </div>
      </Link>
      <div className="flex flex-col flex-1 p-6">
        <span className={`self-start font-label-caps text-[9px] tracking-widest uppercase px-2 py-1 mb-4 ${categoryStyle}`}>
          {article.category}
        </span>
        <Link to={`/revista/${article.slug}`}>
          <h2 className="font-headline-md text-[18px] uppercase leading-snug mb-3 hover:text-amber-700 transition-colors line-clamp-3">
            {article.title}
          </h2>
        </Link>
        <p className="font-body-md text-secondary text-sm leading-relaxed line-clamp-3 flex-1 mb-6">{article.excerpt}</p>
        <div className="flex items-center justify-between pt-4 border-t border-neutral-100 mt-auto">
          <time
            className="font-label-caps text-[9px] text-neutral-400 uppercase tracking-widest"
            dateTime={article.date}
          >
            {date} · {article.readTime}
          </time>
          <Link
            to={`/revista/${article.slug}`}
            className="font-label-caps text-[9px] uppercase tracking-widest text-neutral-600 hover:text-amber-600 transition-colors"
          >
            Leer →
          </Link>
        </div>
      </div>
    </article>
  );
}

export function Magazine() {
  const [activeCategory, setActiveCategory] = useState('TODOS');

  const filtered = activeCategory === 'TODOS'
    ? ARTICLES
    : ARTICLES.filter(a => a.category === activeCategory);

  const featured = filtered[0];
  const rest = filtered.slice(1);

  // Schema.org: Blog
  const blogSchema = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    'name': 'Blog & Tendencias OV33',
    'description': 'Guías de compra, comparativas tecnológicas, estilo urbano y tendencias por OV33 Marketplace.',
    'url': 'https://ov33.com/revista',
    'publisher': {
      '@type': 'Organization',
      'name': 'OV33 MARKETPLACE',
      'logo': 'https://ov33.com/logo.png',
    },
    'blogPost': ARTICLES.map(a => ({
      '@type': 'BlogPosting',
      'headline': a.title,
      'description': a.excerpt,
      'image': a.image,
      'url': `https://ov33.com/revista/${a.slug}`,
      'datePublished': a.date,
      'author': { '@type': 'Organization', 'name': 'Equipo Editorial OV33' },
    })),
  };

  return (
    <>
      <SEOHead
        title="Tendencias & Guías de Compra — OV33 Marketplace"
        description="Artículos, reseñas de gadgets, comparativas multimarca y guías de compra de OV33 Marketplace. Todo lo que necesitas saber antes de comprar."
        url="/revista"
        schema={[blogSchema]}
      />

      <main className="pt-24 md:pt-[120px] pb-24 min-h-screen">
        {/* Hero header */}
        <header className="px-4 md:px-12 max-w-[1440px] mx-auto mb-16">
          <div className="border-b border-neutral-200 pb-8">
            <p className="font-label-caps text-[10px] tracking-widest uppercase text-[#ff5000] mb-3">OV33 TRENDS</p>
            <h1 className="font-display-xl text-display-xl uppercase leading-none mb-4">Blog & Tendencias</h1>
            <p className="font-body-lg text-secondary max-w-2xl">
              Guías de compra, comparativas de tecnología, moda urbana y las novedades de tus marcas preferidas.
            </p>
          </div>
        </header>

        {/* Category filter */}
        <div className="px-4 md:px-12 max-w-[1440px] mx-auto mb-12">
          <nav aria-label="Filtrar artículos por categoría" className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`font-label-caps text-[10px] tracking-widest uppercase px-5 py-2.5 border transition-all ${
                  activeCategory === cat
                    ? 'bg-black text-white border-black'
                    : 'border-neutral-200 text-neutral-600 hover:border-neutral-400 hover:bg-neutral-50'
                }`}
                aria-pressed={activeCategory === cat}
              >
                {cat}
              </button>
            ))}
          </nav>
        </div>

        <div className="px-4 md:px-12 max-w-[1440px] mx-auto space-y-16">
          {/* Featured article */}
          {featured && (
            <section aria-labelledby="destacado-titulo">
              <h2 id="destacado-titulo" className="sr-only">Artículo Destacado</h2>
              <ArticleCard article={featured} featured={true} />
            </section>
          )}

          {/* Rest of articles */}
          {rest.length > 0 && (
            <section aria-labelledby="mas-articulos-titulo">
              <h2 id="mas-articulos-titulo" className="font-label-caps text-[10px] tracking-widest uppercase text-neutral-400 mb-8 border-b border-neutral-100 pb-4">
                Más Artículos
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {rest.map(article => (
                  <ArticleCard key={article.slug} article={article} />
                ))}
              </div>
            </section>
          )}

          {filtered.length === 0 && (
            <div className="text-center py-24">
              <p className="font-body-md text-secondary">No hay artículos en esta categoría aún.</p>
            </div>
          )}

          {/* Newsletter CTA */}
          <section className="bg-black text-white p-12 md:p-16 text-center" aria-labelledby="revista-newsletter-titulo">
            <h2 id="revista-newsletter-titulo" className="font-display-xl text-[28px] md:text-[36px] uppercase mb-4">Nuevo artículo cada semana</h2>
            <p className="font-body-lg text-white/70 mb-8 max-w-xl mx-auto">Suscríbete y recibe nuestras guías de estilo directamente en tu correo. Sin spam, solo contenido de valor.</p>
            <Link
              to="/#newsletter"
              className="inline-block border border-white text-white px-10 py-4 font-button text-button uppercase tracking-widest hover:bg-white hover:text-black transition-all"
            >
              Suscribirse a la Revista
            </Link>
          </section>
        </div>
      </main>
    </>
  );
}
