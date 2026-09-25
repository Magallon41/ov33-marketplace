import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useProducts, isProductOnSale, getDiscountPercentage } from '../context/ProductContext';
import { SEOHead } from '../components/seo/SEOHead';
import { ProductCard } from '../components/ui/ProductCard';

export function Home() {
  const { products, categoryTree = [], brands = [] } = useProducts();
  const navigate = useNavigate();

  // Estado para el slider de Hero Banners
  const [currentSlide, setCurrentSlide] = useState(0);

  // Estado para el temporizador de Ofertas Relámpago (Flash Deals)
  const [timeLeft, setTimeLeft] = useState({
    hours: 5,
    minutes: 42,
    seconds: 18
  });

  // Temporizador regresivo en vivo
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: 59, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 12, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Slider de banners automáticos
  const heroBanners = [
    {
      id: 1,
      badge: "FESTIVAL DE MARCAS",
      title: "Hasta 50% OFF en Marcas Oficiales",
      subtitle: "Apple, Nike, Xiaomi, Sony, Stanley y más con Envío Gratis Inmediato.",
      cta: "Explorar Ofertas",
      link: "/catalog?offers=true",
      bgGradient: "from-orange-600 via-amber-600 to-red-600",
      image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1000&auto=format&fit=crop&q=80"
    },
    {
      id: 2,
      badge: "SUPER FLASH DEALS",
      title: "Tecnología & Gadgets en Liquidación",
      subtitle: "Smartwatches, audífonos Noise Cancelling, bocinas y accesorios al mejor precio.",
      cta: "Ver Gadgets",
      link: "/catalog?category=Tecnología %26 Gadgets",
      bgGradient: "from-blue-700 via-indigo-700 to-slate-900",
      image: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=1000&auto=format&fit=crop&q=80"
    },
    {
      id: 3,
      badge: "TENDENCIAS GLOBALES",
      title: "Sneakers & Moda Urbana",
      subtitle: "Nike Air Max, hoodies oversize y jeans Levi's listos para entrega express.",
      cta: "Ver Sneakers",
      link: "/catalog?category=Moda %26 Sneakers",
      bgGradient: "from-emerald-700 via-teal-800 to-slate-900",
      image: "https://images.unsplash.com/photo-1556906781-9a412961c28c?w=1000&auto=format&fit=crop&q=80"
    }
  ];

  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % heroBanners.length);
    }, 6000);
    return () => clearInterval(slideInterval);
  }, [heroBanners.length]);

  // Filtro de categorías para la sección "Para Ti"
  const [activeTab, setActiveTab] = useState('TODOS');

  // Productos de ofertas relámpago
  const flashDealProducts = products.filter(p => p.isFlashDeal || isProductOnSale(p)).slice(0, 6);

  // Productos más vendidos
  const bestSellerProducts = [...products].sort((a, b) => (b.reviewsCount || 0) - (a.reviewsCount || 0)).slice(0, 4);

  // Productos filtrados para el feed inferior
  const feedProducts = products.filter(p => {
    if (activeTab === 'TODOS') return true;
    if (activeTab === 'OFERTAS') return isProductOnSale(p);
    if (activeTab === 'UNDER_1000') {
      const priceNum = Number(String(p.price).replace(/,/g, ''));
      return priceNum <= 1000;
    }
    return p.category === activeTab;
  });

  const quickCategories = [
    { name: "Tecnología", icon: "devices", query: "Tecnología & Gadgets", color: "from-blue-500 to-cyan-500" },
    { name: "Sneakers & Moda", icon: "apparel", query: "Moda & Sneakers", color: "from-orange-500 to-amber-500" },
    { name: "Relojes", icon: "watch", query: "Relojes & Accesorios", color: "from-purple-500 to-pink-500" },
    { name: "Hogar & Termos", icon: "home", query: "Hogar & Estilo de Vida", color: "from-emerald-500 to-teal-500" },
    { name: "Ofertas Flash", icon: "local_fire_department", query: "offers", isSpecial: true, color: "from-red-500 to-rose-600" },
    { name: "Marcas Top", icon: "verified", query: "brands", color: "from-slate-700 to-slate-900" }
  ];

  return (
    <>
      <SEOHead
        title="OV33 Market — Tu Marketplace Multimarca | Ofertas, Moda y Tecnología"
        description="Explora miles de productos de marcas reconocidas como Apple, Nike, Xiaomi, Casio y Stanley en OV33 Market. Ofertas relámpago, envíos rápidos y pago protegido."
        url="/"
        type="website"
      />

      <main className="pt-32 sm:pt-36 pb-16 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
        
        {/* ── 1. HERO BANNER SLIDER & PROMO CARDS (Estilo TEMU / AliExpress) ── */}
        <section className="max-w-[1440px] mx-auto px-4 md:px-8 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            
            {/* Banner Slider Principal (3 columnas en desktop) */}
            <div className="lg:col-span-3 relative h-[360px] sm:h-[420px] rounded-3xl overflow-hidden shadow-lg">
              {heroBanners.map((banner, idx) => (
                <div
                  key={banner.id}
                  className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                    idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                  }`}
                >
                  <img
                    src={banner.image}
                    alt={banner.title}
                    className="w-full h-full object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-transparent flex items-center p-6 sm:p-12">
                    <div className="max-w-lg text-white">
                      <span className="inline-block bg-orange-500 text-white text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider mb-3 shadow-md">
                        {banner.badge}
                      </span>
                      <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight mb-3">
                        {banner.title}
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-200 mb-6 font-medium leading-relaxed">
                        {banner.subtitle}
                      </p>
                      <Link
                        to={banner.link}
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs sm:text-sm px-6 py-3.5 rounded-full shadow-lg shadow-orange-500/30 transition-all active:scale-95"
                      >
                        <span>{banner.cta}</span>
                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}

              {/* Botones de navegación slider */}
              <div className="absolute bottom-4 right-6 z-20 flex items-center gap-2">
                {heroBanners.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    className={`h-2.5 rounded-full transition-all cursor-pointer ${
                      i === currentSlide ? 'w-8 bg-orange-500' : 'w-2.5 bg-white/50 hover:bg-white'
                    }`}
                    aria-label={`Ir al slide ${i + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Tarjetas laterales de Cupones y Garantías (Estilo Marketplace) */}
            <div className="flex flex-col gap-4">
              
              {/* Card 1: Cupón de Bienvenida */}
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-5 text-white shadow-md flex flex-col justify-between relative overflow-hidden flex-1">
                <div className="relative z-10">
                  <span className="text-[10px] font-black tracking-wider uppercase bg-white/20 px-2 py-0.5 rounded-md">
                    CUPÓN BIENVENIDA
                  </span>
                  <h3 className="text-xl font-black mt-2 leading-tight">
                    10% OFF EXTRA
                  </h3>
                  <p className="text-xs text-amber-100 mt-1">
                    En tu primer pedido de cualquier marca.
                  </p>
                </div>
                
                <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between relative z-10">
                  <span className="font-mono text-xs font-black bg-white text-orange-600 px-2 py-1 rounded-md shadow-xs">
                    OV33NEW
                  </span>
                  <Link
                    to="/catalog"
                    className="text-xs font-bold underline hover:text-amber-100 flex items-center gap-0.5"
                  >
                    <span>Aplicar</span>
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </Link>
                </div>
                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
              </div>

              {/* Card 2: Compra Segura y Envío Rápido */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex flex-col justify-between flex-1">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">verified</span>
                    </span>
                    <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                      Garantía OV33
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Artículos verificados de marcas originales con cotización de envío en tiempo real vía Envia.com.
                  </p>
                </div>

                <div className="mt-4 flex items-center gap-2 text-xs font-bold text-orange-600 dark:text-orange-400">
                  <span className="material-symbols-outlined text-[16px]">local_shipping</span>
                  <span>Envío Gratis desde $499 MXN</span>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* ── 2. BURBUJAS DE CATEGORÍA RÁPIDAS (TEMU / SHEIN Category Icons) ── */}
        <section className="max-w-[1440px] mx-auto px-4 md:px-8 mb-10">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Explorar Departamentos
              </h3>
              <Link to="/catalog" className="text-xs font-bold text-orange-600 hover:underline">
                Ver todos →
              </Link>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-4">
              {quickCategories.map((cat, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (cat.query === 'offers') navigate('/ofertas');
                    else if (cat.query === 'brands') navigate('/catalog?filter=brands');
                    else navigate(`/catalog?category=${encodeURIComponent(cat.query)}`);
                  }}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all group cursor-pointer text-center"
                >
                  <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr ${cat.color} text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                    <span className="material-symbols-outlined text-[28px] sm:text-[32px]">
                      {cat.icon}
                    </span>
                  </div>
                  <span className="text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-200 group-hover:text-orange-600 transition-colors leading-tight">
                    {cat.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── 3. OFERTAS RELÁMPAGO (FLASH DEALS CON CRONÓMETRO) ── */}
        <section className="max-w-[1440px] mx-auto px-4 md:px-8 mb-12">
          <div className="bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 rounded-3xl p-5 sm:p-7 text-white shadow-xl">
            
            {/* Header de Ofertas Relámpago con Contador */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-2xl animate-pulse">
                  🔥
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                      OFERTAS RELÁMPAGO
                    </h2>
                    <span className="bg-white text-red-600 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                      FLASH
                    </span>
                  </div>
                  <p className="text-xs text-white/80">
                    Precios de liquidación por tiempo y existencias limitadas.
                  </p>
                </div>
              </div>

              {/* Cronómetro en vivo */}
              <div className="flex items-center gap-2 self-start md:self-auto bg-black/30 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  Termina en:
                </span>
                <div className="flex items-center gap-1 font-mono text-sm sm:text-base font-black">
                  <span className="bg-white/20 px-2 py-0.5 rounded-md">
                    {String(timeLeft.hours).padStart(2, '0')}
                  </span>
                  <span>:</span>
                  <span className="bg-white/20 px-2 py-0.5 rounded-md">
                    {String(timeLeft.minutes).padStart(2, '0')}
                  </span>
                  <span>:</span>
                  <span className="bg-white/20 px-2 py-0.5 rounded-md">
                    {String(timeLeft.seconds).padStart(2, '0')}
                  </span>
                </div>
              </div>
            </div>

            {/* Grid de Productos Flash */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {flashDealProducts.map((prod) => (
                <div key={prod.id} className="text-slate-900 dark:text-white">
                  <ProductCard product={prod} compact={true} />
                </div>
              ))}
            </div>

            <div className="mt-6 text-center">
              <Link
                to="/ofertas"
                className="inline-flex items-center gap-2 bg-white text-orange-600 hover:bg-orange-50 font-black text-xs sm:text-sm px-6 py-2.5 rounded-full shadow-md transition-all active:scale-95"
              >
                <span>Ver Todas las Ofertas Flash</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>

          </div>
        </section>

        {/* ── 4. MURO DE MARCAS OFICIALES DESTACADAS (Brand Wall) ── */}
        <section className="max-w-[1440px] mx-auto px-4 md:px-8 mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-500 text-[24px]">verified</span>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Marcas Oficiales en OV33
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Productos 100% auténticos garantizados directamente de distribuidores oficiales.
              </p>
            </div>

            <Link
              to="/catalog"
              className="text-xs font-bold text-orange-600 hover:underline flex items-center gap-1"
            >
              <span>Ver todas las marcas</span>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {brands.slice(0, 12).map((brand) => (
              <button
                key={brand.id || brand.name}
                onClick={() => navigate(`/catalog?brand=${encodeURIComponent(brand.name)}`)}
                className="group bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-orange-500 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 transition-all hover:shadow-md cursor-pointer text-center"
              >
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-900 dark:text-white font-black text-lg group-hover:scale-110 transition-transform">
                  {brand.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-white group-hover:text-orange-600 transition-colors">
                    {brand.name}
                  </h4>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {brand.category || 'Catálogo Oficial'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* ── 5. SECCIÓN "LO MÁS VENDIDO" (Top Sellers Ranking #1, #2, #3, #4) ── */}
        <section className="max-w-[1440px] mx-auto px-4 md:px-8 mb-12">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⭐</span>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                    Lo Más Vendido de la Semana
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Los productos con mayor número de pedidos y mejores reseñas.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {bestSellerProducts.map((prod, idx) => (
                <div key={prod.id} className="relative">
                  <div className="absolute top-2 left-2 z-20 w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 font-black text-xs flex items-center justify-center shadow-md">
                    #{idx + 1}
                  </div>
                  <ProductCard product={prod} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 6. FEED "PARA TI - DESCUBRE EL CATÁLOGO" CON TABS RÁPIDOS ── */}
        <section className="max-w-[1440px] mx-auto px-4 md:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Recomendados Para Ti
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Selección de artículos con descuento y envío express a todo México.
              </p>
            </div>

            {/* Pastillas de filtro rápido */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {[
                { id: 'TODOS', label: 'Todos' },
                { id: 'OFERTAS', label: '🔥 En Oferta' },
                { id: 'Tecnología & Gadgets', label: '🎧 Tecnología' },
                { id: 'Moda & Sneakers', label: '👟 Moda' },
                { id: 'UNDER_1000', label: '🏷️ Menos de $1,000' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grid de productos */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {feedProducts.map(prod => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>

          {/* Botón de ver todo */}
          <div className="mt-10 text-center">
            <Link
              to="/catalog"
              className="inline-flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-orange-600 dark:hover:bg-orange-400 dark:hover:text-white font-black text-xs sm:text-sm px-8 py-3.5 rounded-full shadow-lg transition-all active:scale-95"
            >
              <span>Explorar Catálogo Completo ({products.length} productos)</span>
              <span className="material-symbols-outlined text-[18px]">storefront</span>
            </Link>
          </div>
        </section>

      </main>
    </>
  );
}
