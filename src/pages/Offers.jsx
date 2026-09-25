import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useProducts, isProductOnSale } from '../context/ProductContext';
import { SEOHead } from '../components/seo/SEOHead';
import { ProductCard } from '../components/ui/ProductCard';

export function Offers() {
  const { products, brands = [] } = useProducts();
  const [selectedBrand, setSelectedBrand] = useState('TODAS');

  // Temporizador regresivo en vivo
  const [timeLeft, setTimeLeft] = useState({ hours: 7, minutes: 23, seconds: 45 });
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 12, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const saleProducts = products.filter(p => isProductOnSale(p) || p.isFlashDeal);

  const filtered = selectedBrand === 'TODAS'
    ? saleProducts
    : saleProducts.filter(p => (p.brand || '').toLowerCase() === selectedBrand.toLowerCase());

  return (
    <>
      <SEOHead
        title="Ofertas Relámpago & Liquidación Flash — OV33 Marketplace"
        description="Aprovecha las mejores ofertas relámpago con hasta 50% de descuento en marcas oficiales: Apple, Nike, Xiaomi, Casio, Stanley en OV33 Market."
        url="/ofertas"
        type="website"
      />

      <main className="pt-32 sm:pt-36 pb-20 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 min-h-screen">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8">
          
          {/* Banner de Ofertas Relámpago */}
          <div className="bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 rounded-3xl p-6 sm:p-10 text-white shadow-xl mb-8 relative overflow-hidden">
            <div className="relative z-10 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 bg-black/30 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-3 text-amber-300">
                <span>🔥</span>
                <span>ZONA DE LIQUIDACIÓN Y FLASH DEALS</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight mb-2">
                Hasta 50% OFF en Marcas Oficiales
              </h1>
              <p className="text-xs sm:text-sm text-white/90 font-medium mb-6">
                Aprovecha precios con descuento directo antes de que se agote el stock de temporada. Envío gratis en pedidos desde $499 MXN.
              </p>

              {/* Contador */}
              <div className="inline-flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20">
                <span className="text-xs font-bold text-amber-300">La ronda termina en:</span>
                <div className="flex items-center gap-1 font-mono font-black text-sm sm:text-base">
                  <span className="bg-white/20 px-2 py-0.5 rounded-md">{String(timeLeft.hours).padStart(2, '0')}</span>
                  <span>:</span>
                  <span className="bg-white/20 px-2 py-0.5 rounded-md">{String(timeLeft.minutes).padStart(2, '0')}</span>
                  <span>:</span>
                  <span className="bg-white/20 px-2 py-0.5 rounded-md">{String(timeLeft.seconds).padStart(2, '0')}</span>
                </div>
              </div>
            </div>

            <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          </div>

          {/* Pastillas de filtro por Marca */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 mb-6">
            <span className="text-xs font-bold text-slate-400 shrink-0">Filtrar por marca:</span>
            <button
              onClick={() => setSelectedBrand('TODAS')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedBrand === 'TODAS'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              Todas las marcas ({saleProducts.length})
            </button>
            {brands.map(b => {
              const count = saleProducts.filter(p => (p.brand || '').toLowerCase() === b.name.toLowerCase()).length;
              if (count === 0) return null;
              return (
                <button
                  key={b.id || b.name}
                  onClick={() => setSelectedBrand(b.name)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    selectedBrand === b.name
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {b.name} ({count})
                </button>
              );
            })}
          </div>

          {/* Grid de Productos en Oferta */}
          {filtered.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800">
              <p className="text-slate-500 text-sm">No hay ofertas disponibles para esta marca en este momento.</p>
              <button
                onClick={() => setSelectedBrand('TODAS')}
                className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-full text-xs font-bold"
              >
                Ver todas las ofertas
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
              {filtered.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

        </div>
      </main>
    </>
  );
}
