import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getArticleBySlug, getRelatedArticles } from '../data/articles';
import { SEOHead } from '../components/seo/SEOHead';

export function ArticleDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const article = getArticleBySlug(slug);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (!article) {
    return (
      <>
        <SEOHead title="Artículo no encontrado" noIndex={true} />
        <main className="pt-24 min-h-screen flex flex-col items-center justify-center text-center px-4">
          <h1 className="font-display-xl text-3xl uppercase mb-6">Artículo No Encontrado</h1>
          <Link to="/revista" className="bg-black text-white px-8 py-3 uppercase tracking-widest font-button text-button hover:bg-neutral-800 transition-colors">
            Volver a la Revista
          </Link>
        </main>
      </>
    );
  }

  const related = getRelatedArticles(article.slug, 2);
  const publishDate = new Date(article.date).toLocaleDateString('es-MX', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  // Schema.org: BlogPosting
  const blogPostingSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    'headline': article.title,
    'alternativeHeadline': article.subtitle,
    'image': article.image,
    'award': 'OV33 Editorial',
    'editor': 'Equipo Editorial OV33',
    'genre': article.category,
    'keywords': article.tags.join(' '),
    'wordcount': article.content.reduce((acc, curr) => acc + (curr.text?.split(' ').length || 0), 0),
    'publisher': {
      '@type': 'Organization',
      'name': 'OV33 MARKETPLACE',
      'logo': 'https://ov33.com/logo.png'
    },
    'url': `https://ov33.com/revista/${article.slug}`,
    'datePublished': article.date,
    'dateCreated': article.date,
    'author': {
      '@type': 'Organization',
      'name': 'Equipo Editorial OV33'
    },
    'description': article.excerpt,
    'articleBody': article.content.map(c => c.text).filter(Boolean).join('\n\n')
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      { '@type': 'ListItem', 'position': 1, 'name': 'Inicio', 'item': 'https://edvictory.com/' },
      { '@type': 'ListItem', 'position': 2, 'name': 'Revista', 'item': 'https://edvictory.com/revista' },
      { '@type': 'ListItem', 'position': 3, 'name': article.title, 'item': `https://edvictory.com/revista/${article.slug}` },
    ],
  };

  return (
    <>
      <SEOHead
        title={article.title}
        description={article.excerpt}
        image={article.image}
        url={`/revista/${article.slug}`}
        type="article"
        schema={[blogPostingSchema, breadcrumbSchema]}
      />

      <main className="pt-24 md:pt-[120px] pb-24 min-h-screen">
        {/* Article Header */}
        <article className="max-w-3xl mx-auto px-4">
          <nav aria-label="Ruta de navegación" className="mb-8">
            <ol className="flex items-center gap-2 font-label-caps text-[10px] tracking-widest uppercase text-neutral-400">
              <li><Link to="/" className="hover:text-amber-600 transition-colors">Inicio</Link></li>
              <li aria-hidden="true">/</li>
              <li><Link to="/revista" className="hover:text-amber-600 transition-colors">Revista</Link></li>
              <li aria-hidden="true">/</li>
              <li><span className="text-neutral-700" aria-current="page">{article.category}</span></li>
            </ol>
          </nav>

          <header className="mb-12">
            <span className="font-label-caps text-[10px] tracking-[0.2em] uppercase text-amber-600 font-bold block mb-4">
              {article.category}
            </span>
            <h1 className="font-display-xl text-3xl md:text-5xl uppercase leading-tight mb-6">
              {article.title}
            </h1>
            <p className="font-body-lg text-lg text-secondary mb-8 leading-relaxed font-light italic">
              {article.subtitle}
            </p>
            
            <div className="flex items-center justify-between border-y border-neutral-100 py-4 font-label-caps text-[10px] text-neutral-400 uppercase tracking-widest">
              <div>
                <span>Por </span>
                <strong className="text-neutral-800">{article.author}</strong>
              </div>
              <div>
                <time dateTime={article.date}>{publishDate}</time>
                <span className="mx-2">·</span>
                <span>{article.readTime} de lectura</span>
              </div>
            </div>
          </header>

          {/* Hero Image */}
          <div className="aspect-[16/9] overflow-hidden bg-neutral-150 mb-12 border border-neutral-100">
            <img
              src={article.image}
              alt={article.imageAlt}
              className="w-full h-full object-cover"
              fetchpriority="high"
              width="800"
              height="450"
            />
          </div>

          {/* Article Content */}
          <div className="space-y-6 font-body-base text-neutral-800 leading-relaxed text-[15px]">
            {article.content.map((block, idx) => {
              switch (block.type) {
                case 'lead':
                  return (
                    <p key={idx} className="font-body-lg text-lg leading-relaxed text-neutral-900 font-medium pb-4">
                      {block.text}
                    </p>
                  );
                case 'paragraph':
                  return <p key={idx}>{block.text}</p>;
                case 'h2':
                  return (
                    <h2 key={idx} className="font-display-lg text-2xl uppercase pt-8 pb-2 tracking-tight text-neutral-900 border-b border-neutral-100">
                      {block.text}
                    </h2>
                  );
                case 'tip':
                  return (
                    <div key={idx} className="bg-amber-50/60 border-l-4 border-[#ff5000] p-6 my-8 text-neutral-800 font-light italic text-sm">
                      <strong>Consejo OV33:</strong> {block.text}
                    </div>
                  );
                case 'list':
                  return (
                    <ul key={idx} className="space-y-3 pl-6 list-disc my-6" role="list">
                      {block.items.map((item, i) => (
                        <li key={i} className="font-light">{item}</li>
                      ))}
                    </ul>
                  );
                case 'cta':
                  return (
                    <div key={idx} className="border border-neutral-200 p-8 my-12 text-center bg-neutral-50/50 space-y-4">
                      <p className="font-label-caps text-xs tracking-wider uppercase text-neutral-600">{block.text}</p>
                      <Link
                        to={block.link}
                        className="inline-block bg-black text-white px-8 py-3.5 font-button text-[10px] uppercase tracking-widest hover:bg-neutral-800 transition-colors"
                      >
                        {block.label}
                      </Link>
                    </div>
                  );
                default:
                  return null;
              }
            })}
          </div>

          {/* Share/Tags */}
          <footer className="mt-16 pt-8 border-t border-neutral-100">
            <div className="flex flex-wrap gap-2 mb-8">
              {article.tags.map(tag => (
                <span key={tag} className="font-label-caps text-[9px] tracking-wider uppercase bg-neutral-100 text-neutral-600 px-3 py-1.5 rounded-none">
                  #{tag.replace(/\s+/g, '')}
                </span>
              ))}
            </div>
            <div className="flex items-center justify-between bg-neutral-50 p-6 border border-neutral-150">
              <span className="font-label-caps text-[10px] tracking-wider uppercase text-neutral-600 font-bold">¿Te gustó el artículo?</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert('¡Enlace de artículo copiado al portapapeles!');
                }}
                className="flex items-center gap-2 font-label-caps text-[10px] tracking-wider uppercase text-neutral-800 hover:text-amber-600 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]" aria-hidden="true">link</span>
                Copiar Enlace
              </button>
            </div>
          </footer>
        </article>

        {/* Related articles */}
        {related.length > 0 && (
          <section className="bg-neutral-50 border-t border-b border-neutral-100 mt-24 py-20" aria-labelledby="relacionados-titulo">
            <div className="max-w-5xl mx-auto px-4">
              <h2 id="relacionados-titulo" className="font-display-lg text-xl uppercase mb-10 tracking-wider text-center">Lecturas Recomendadas</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {related.map(art => (
                  <article key={art.slug} className="bg-white border border-neutral-150 hover:border-neutral-300 transition-all duration-300 flex flex-col md:flex-row gap-6 p-6">
                    <Link to={`/revista/${art.slug}`} className="w-full md:w-32 h-32 overflow-hidden block shrink-0">
                      <img src={art.image} alt={art.imageAlt} className="w-full h-full object-cover" loading="lazy" />
                    </Link>
                    <div className="flex flex-col justify-between">
                      <div>
                        <span className="font-label-caps text-[8px] tracking-widest uppercase text-amber-600 font-bold mb-1.5 block">{art.category}</span>
                        <Link to={`/revista/${art.slug}`}>
                          <h3 className="font-headline-md text-base uppercase leading-snug hover:text-amber-700 transition-colors mb-2">{art.title}</h3>
                        </Link>
                        <p className="font-body-md text-xs text-secondary line-clamp-2">{art.excerpt}</p>
                      </div>
                      <Link to={`/revista/${art.slug}`} className="font-label-caps text-[9px] uppercase tracking-widest text-neutral-600 hover:text-black transition-colors mt-4 block">Leer artículo →</Link>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </>
  );
}
