import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SEOHead } from '../components/seo/SEOHead';

export function About() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const orgSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': 'https://ov33.com/#organization',
    'name': 'OV33 MARKETPLACE',
    'url': 'https://ov33.com',
    'logo': 'https://ov33.com/logo.png',
    'description': 'Marketplace multimarca líder en México. Tecnología, moda, accesorios y hogar al mejor precio con envíos a toda la República.',
    'foundingDate': '2025',
    'address': {
      '@type': 'PostalAddress',
      'addressCountry': 'MX',
      'addressLocality': 'México',
    },
    'sameAs': [],
  };

  return (
    <>
      <SEOHead
        title="Sobre Nosotros — OV33 Marketplace Multimarca"
        description="Conoce la historia y visión de OV33. Conectamos a millones de compradores con las mejores marcas globales en tecnología, moda, gadgets y hogar a precios imbatibles."
        url="/about"
        schema={[orgSchema]}
      />

      <div className="bg-white min-h-screen pt-24">
        {/* 1. Hero / Manifiesto */}
        <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 py-20 px-6" aria-labelledby="manifiesto-titulo">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-[radial-gradient(#ff5000_1px,transparent_1px)] [background-size:24px_24px]"></div>
          </div>
          
          <div className="relative z-10 text-center px-4 max-w-4xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ff5000]/15 text-[#ff5000] border border-[#ff5000]/30 font-semibold text-xs tracking-wider uppercase">
              <span className="material-symbols-outlined text-sm">storefront</span>
              Marketplace Multimarca Oficial
            </div>
            
            <h1 id="manifiesto-titulo" className="font-display-xl text-4xl sm:text-6xl md:text-7xl text-white uppercase tracking-tight font-extrabold leading-none">
              Todo lo que buscas. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff5000] to-amber-400">
                Al mejor precio de México.
              </span>
            </h1>

            <p className="font-body-lg text-base md:text-xl text-neutral-300 max-w-2xl mx-auto font-light leading-relaxed">
              En <strong className="text-white font-medium">OV33</strong> creemos que la mejor tecnología, la moda de tendencia y los productos para tu estilo de vida deben ser accesibles para todos. Eliminamos intermediarios costosos para conectar marcas de prestigio mundial directamente con tus manos.
            </p>

            <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/catalog"
                className="bg-[#ff5000] hover:bg-[#e04500] text-white px-8 py-3.5 rounded-full font-bold text-sm tracking-wider uppercase transition-all shadow-lg shadow-[#ff5000]/30 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">shopping_bag</span>
                Explorar Catálogo
              </Link>
              <Link
                to="/ofertas"
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-8 py-3.5 rounded-full font-bold text-sm tracking-wider uppercase transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg text-amber-400">bolt</span>
                Ver Ofertas Flash
              </Link>
            </div>
          </div>
        </section>

        {/* 2. Métricas / Impacto */}
        <section className="bg-neutral-900 border-t border-neutral-800 py-10 px-6 text-white">
          <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-black text-[#ff5000] mb-1">+50</div>
              <div className="text-xs uppercase tracking-wider text-neutral-400 font-semibold">Marcas Oficiales</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-black text-amber-400 mb-1">100%</div>
              <div className="text-xs uppercase tracking-wider text-neutral-400 font-semibold">Productos Originales</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-black text-emerald-400 mb-1">2 a 5 días</div>
              <div className="text-xs uppercase tracking-wider text-neutral-400 font-semibold">Entrega Nacional</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-black text-blue-400 mb-1">30 días</div>
              <div className="text-xs uppercase tracking-wider text-neutral-400 font-semibold">Garantía Protegida</div>
            </div>
          </div>
        </section>

        {/* 3. Los Pilares de OV33 */}
        <section className="py-20 md:py-28 px-6 lg:px-12 max-w-7xl mx-auto" aria-labelledby="pilares-titulo">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-[#ff5000] block mb-2">Por qué OV33</span>
            <h2 id="pilares-titulo" className="font-display-xl text-3xl md:text-5xl uppercase tracking-tight text-neutral-900 font-extrabold">
              La Experiencia de Compra Inteligente
            </h2>
            <p className="text-neutral-500 mt-4 text-sm md:text-base">
              Combinamos el dinamismo y los precios de los grandes marketplaces con la confianza de marcas verificadas y soporte local en México.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-neutral-50 p-8 rounded-2xl border border-neutral-100 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 rounded-2xl bg-[#ff5000]/10 flex items-center justify-center text-[#ff5000] mb-6">
                <span className="material-symbols-outlined text-3xl">verified</span>
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-3">Marcas Oficiales y Autenticidad</h3>
              <p className="text-neutral-600 text-sm leading-relaxed">
                Trabajamos con distribuidores directos de Apple, Nike, Xiaomi, Sony, Stanley, Casio y las firmas más buscadas. Cero imitaciones: todo respaldado por garantía de autenticidad.
              </p>
            </div>

            <div className="bg-neutral-50 p-8 rounded-2xl border border-neutral-100 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 mb-6">
                <span className="material-symbols-outlined text-3xl">local_shipping</span>
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-3">Logística Express con Envia.com</h3>
              <p className="text-neutral-600 text-sm leading-relaxed">
                Nuestra plataforma logística multi-paquetería despacha tus órdenes a través de FedEx, DHL, Estafeta y RedPack con seguimiento en vivo y envío gratis en compras mayores a $499 MXN.
              </p>
            </div>

            <div className="bg-neutral-50 p-8 rounded-2xl border border-neutral-100 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 mb-6">
                <span className="material-symbols-outlined text-3xl">lock</span>
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-3">Compra 100% Protegida</h3>
              <p className="text-neutral-600 text-sm leading-relaxed">
                Tus pagos son procesados de forma cifrada mediante Mercado Pago. Cuentas con 30 días de garantía de satisfacción para cambios o reembolsos directos.
              </p>
            </div>
          </div>
        </section>

        {/* 4. Categorías Principales */}
        <section className="py-16 bg-neutral-50 border-t border-neutral-200/60 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#ff5000]">Variedad sin Límites</span>
                <h2 className="font-display-xl text-3xl font-extrabold text-neutral-900 uppercase tracking-tight mt-1">
                  Nuestros Departamentos
                </h2>
              </div>
              <Link to="/catalog" className="text-xs font-bold uppercase tracking-wider text-[#ff5000] hover:text-[#e04500] flex items-center gap-1">
                Ver todos los departamentos <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: 'Tecnología & Gadgets', items: 'Smartphones, Audio, Wearables', icon: 'devices', href: '/catalog?category=Tecnología' },
                { title: 'Moda & Sneakers', items: 'Calzado, Hoodies, Urbanwear', icon: 'apparel', href: '/catalog?category=Moda' },
                { title: 'Relojes & Accesorios', items: 'Smartwatches, Vintage, Mochilas', icon: 'watch', href: '/catalog?category=Accesorios' },
                { title: 'Hogar & Hidratación', items: 'Termos, Decoración, Smart Home', icon: 'water_drop', href: '/catalog?category=Hogar' },
              ].map((dep, idx) => (
                <Link
                  key={idx}
                  to={dep.href}
                  className="bg-white p-6 rounded-2xl border border-neutral-200/70 hover:border-[#ff5000] hover:shadow-lg transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-neutral-100 group-hover:bg-[#ff5000] text-neutral-700 group-hover:text-white flex items-center justify-center transition-colors mb-4">
                    <span className="material-symbols-outlined text-2xl">{dep.icon}</span>
                  </div>
                  <h3 className="font-bold text-neutral-900 group-hover:text-[#ff5000] transition-colors text-base mb-1">
                    {dep.title}
                  </h3>
                  <p className="text-xs text-neutral-500">{dep.items}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* 5. CTA Final */}
        <section className="py-20 px-6 max-w-5xl mx-auto text-center">
          <h2 className="font-display-xl text-3xl md:text-5xl uppercase font-black tracking-tight text-neutral-900 mb-6">
            ¿Listo para descubrir las mejores ofertas?
          </h2>
          <p className="font-body-lg text-neutral-600 max-w-xl mx-auto mb-8 text-base">
            Únete a los miles de clientes que ahorran todos los días con las promociones y cupones de OV33 Marketplace.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/catalog"
              className="bg-[#ff5000] hover:bg-[#e04500] text-white font-bold text-sm tracking-wider uppercase py-4 px-10 rounded-full transition-all shadow-lg shadow-[#ff5000]/25"
            >
              Comenzar a Comprar
            </Link>
            <Link
              to="/mayoristas"
              className="bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-sm tracking-wider uppercase py-4 px-8 rounded-full transition-all"
            >
              Programa de Mayoristas y Proveedores
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
