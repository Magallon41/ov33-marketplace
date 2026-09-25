import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useProducts, isProductOnSale, getDiscountPercentage } from '../context/ProductContext';
import { SEOHead } from '../components/seo/SEOHead';
import { ProductCard } from '../components/ui/ProductCard';

const normalizeStr = (s) => (s || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

export function Catalog() {
  const { products, categoryTree = [], brands = [] } = useProducts();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL parameters
  const queryParam = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category') || 'TODAS';
  const subcategoryParam = searchParams.get('subcategory') || 'TODAS';
  const brandParam = searchParams.get('brand') || 'TODAS';
  const offersParam = searchParams.get('offers') === 'true';
  const sortParam = searchParams.get('sort') || 'relevance';

  // Local filter states
  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [selectedSubcategory, setSelectedSubcategory] = useState(subcategoryParam);
  const [selectedBrand, setSelectedBrand] = useState(brandParam);
  const [onlyOffers, setOnlyOffers] = useState(offersParam);
  const [onlyFreeShipping, setOnlyFreeShipping] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [maxPrice, setMaxPrice] = useState(25000);
  const [sortBy, setSortBy] = useState(sortParam);
  const [brandSearch, setBrandSearch] = useState('');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [gridColumns, setGridColumns] = useState(4); // 4 or 6

  // Sync state with URL params
  useEffect(() => {
    setSearchQuery(searchParams.get('q') || '');
    setSelectedCategory(searchParams.get('category') || 'TODAS');
    setSelectedSubcategory(searchParams.get('subcategory') || 'TODAS');
    setSelectedBrand(searchParams.get('brand') || 'TODAS');
    setOnlyOffers(searchParams.get('offers') === 'true');
    setSortBy(searchParams.get('sort') || 'relevance');
  }, [searchParams]);

  // Update URL helper
  const updateURLParam = (key, value) => {
    const nextParams = new URLSearchParams(searchParams);
    if (!value || value === 'TODAS' || value === false) {
      nextParams.delete(key);
    } else {
      nextParams.set(key, String(value));
    }
    setSearchParams(nextParams);
  };

  const handleCategorySelect = (catName) => {
    setSelectedCategory(catName);
    setSelectedSubcategory('TODAS');
    const nextParams = new URLSearchParams(searchParams);
    if (catName === 'TODAS') {
      nextParams.delete('category');
    } else {
      nextParams.set('category', catName);
    }
    nextParams.delete('subcategory');
    setSearchParams(nextParams);
  };

  const handleSubcategorySelect = (subName) => {
    setSelectedSubcategory(subName);
    updateURLParam('subcategory', subName);
  };

  const handleBrandSelect = (bName) => {
    const next = selectedBrand === bName ? 'TODAS' : bName;
    setSelectedBrand(next);
    updateURLParam('brand', next);
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('TODAS');
    setSelectedSubcategory('TODAS');
    setSelectedBrand('TODAS');
    setOnlyOffers(false);
    setOnlyFreeShipping(false);
    setMinRating(0);
    setMaxPrice(25000);
    setSortBy('relevance');
    setSearchParams(new URLSearchParams());
  };

  // Subcategorías disponibles para la categoría seleccionada
  const activeCategoryObject = categoryTree.find(
    c => normalizeStr(c.name) === normalizeStr(selectedCategory)
  );
  const availableSubcategories = activeCategoryObject?.subcategories || [];

  // Marcas filtradas para el buscador de marcas del sidebar
  const filteredSidebarBrands = useMemo(() => {
    return brands.filter(b => normalizeStr(b.name).includes(normalizeStr(brandSearch)));
  }, [brands, brandSearch]);

  // Filtrado exhaustivo de productos
  const filteredProducts = useMemo(() => {
    let result = products.filter(product => {
      // 1. Búsqueda por texto (query)
      if (searchQuery.trim()) {
        const q = normalizeStr(searchQuery);
        const nameMatch = normalizeStr(product.name).includes(q);
        const brandMatch = normalizeStr(product.brand).includes(q);
        const catMatch = normalizeStr(product.category).includes(q);
        const subcatMatch = normalizeStr(product.subcategory).includes(q);
        const descMatch = normalizeStr(product.description).includes(q);
        if (!nameMatch && !brandMatch && !catMatch && !subcatMatch && !descMatch) {
          return false;
        }
      }

      // 2. Filtro de Categoría
      if (selectedCategory !== 'TODAS') {
        if (normalizeStr(product.category) !== normalizeStr(selectedCategory)) {
          return false;
        }
      }

      // 3. Filtro de Subcategoría
      if (selectedSubcategory !== 'TODAS') {
        if (normalizeStr(product.subcategory) !== normalizeStr(selectedSubcategory)) {
          return false;
        }
      }

      // 4. Filtro de Marca
      if (selectedBrand !== 'TODAS') {
        if (normalizeStr(product.brand) !== normalizeStr(selectedBrand)) {
          return false;
        }
      }

      // 5. Solo ofertas
      if (onlyOffers && !isProductOnSale(product)) {
        return false;
      }

      // 6. Solo envío gratis
      if (onlyFreeShipping && !product.freeShipping) {
        return false;
      }

      // 7. Calificación mínima
      if (minRating > 0 && (product.rating || 0) < minRating) {
        return false;
      }

      // 8. Precio máximo
      const numericPrice = Number(String(product.price).replace(/,/g, ''));
      if (numericPrice > maxPrice) {
        return false;
      }

      return true;
    });

    // Ordenamiento
    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => Number(String(a.price).replace(/,/g, '')) - Number(String(b.price).replace(/,/g, '')));
        break;
      case 'price-desc':
        result.sort((a, b) => Number(String(b.price).replace(/,/g, '')) - Number(String(a.price).replace(/,/g, '')));
        break;
      case 'discount':
        result.sort((a, b) => {
          const discA = getDiscountPercentage(a.originalPrice, a.price);
          const discB = getDiscountPercentage(b.originalPrice, b.price);
          return discB - discA;
        });
        break;
      case 'rating':
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'sales':
        result.sort((a, b) => (b.reviewsCount || 0) - (a.reviewsCount || 0));
        break;
      default:
        // 'relevance'
        break;
    }

    return result;
  }, [products, searchQuery, selectedCategory, selectedSubcategory, selectedBrand, onlyOffers, onlyFreeShipping, minRating, maxPrice, sortBy]);

  const activeFiltersCount = [
    selectedCategory !== 'TODAS',
    selectedSubcategory !== 'TODAS',
    selectedBrand !== 'TODAS',
    onlyOffers,
    onlyFreeShipping,
    minRating > 0,
    maxPrice < 25000,
    searchQuery.trim().length > 0
  ].filter(Boolean).length;

  return (
    <>
      <SEOHead
        title="Catálogo Multimarca OV33 — Ofertas en Electrónica, Moda, Calzado y Hogar"
        description="Explora todo el catálogo de OV33 Marketplace con filtros por marca oficial, departamentos, ofertas flash y envíos express a todo México."
        url="/catalog"
        type="website"
      />

      <main className="pt-32 sm:pt-36 pb-20 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 min-h-screen">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8">
          
          {/* Breadcrumbs & Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                <Link to="/" className="hover:text-orange-500">Inicio</Link>
                <span>/</span>
                <span className="text-slate-700 dark:text-slate-300 font-semibold">Catálogo</span>
                {selectedCategory !== 'TODAS' && (
                  <>
                    <span>/</span>
                    <span className="text-slate-700 dark:text-slate-300">{selectedCategory}</span>
                  </>
                )}
                {selectedBrand !== 'TODAS' && (
                  <>
                    <span>/</span>
                    <span className="text-orange-500 font-bold">{selectedBrand}</span>
                  </>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {selectedBrand !== 'TODAS'
                  ? `Productos ${selectedBrand}`
                  : selectedCategory !== 'TODAS'
                  ? selectedCategory
                  : searchQuery
                  ? `Resultados para "${searchQuery}"`
                  : 'Catálogo Multimarca OV33'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Mostrando <span className="font-bold text-slate-900 dark:text-white">{filteredProducts.length}</span> artículos disponibles
              </p>
            </div>

            {/* Barra de Ordenamiento y switch de vista */}
            <div className="flex items-center gap-3">
              {/* Botón de filtros móvil */}
              <button
                onClick={() => setIsMobileFilterOpen(true)}
                className="lg:hidden flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white shadow-xs"
              >
                <span className="material-symbols-outlined text-[18px]">tune</span>
                <span>Filtros {activeFiltersCount > 0 && `(${activeFiltersCount})`}</span>
              </button>

              {/* Selector de ordenamiento */}
              <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline">Ordenar por:</span>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    updateURLParam('sort', e.target.value);
                  }}
                  className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-100 outline-none cursor-pointer"
                >
                  <option value="relevance">Relevancia</option>
                  <option value="sales">Más Vendidos</option>
                  <option value="price-asc">Precio: Menor a Mayor</option>
                  <option value="price-desc">Precio: Mayor a Menor</option>
                  <option value="discount">Mayor Descuento</option>
                  <option value="rating">Mejor Calificados</option>
                </select>
              </div>

              {/* Switch de columnas Desktop (4 vs 6) */}
              <div className="hidden xl:flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1 shadow-xs">
                <button
                  onClick={() => setGridColumns(4)}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    gridColumns === 4 ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'
                  }`}
                  title="Vista 4 columnas"
                >
                  <span className="material-symbols-outlined text-[18px]">grid_view</span>
                </button>
                <button
                  onClick={() => setGridColumns(6)}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    gridColumns === 6 ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'
                  }`}
                  title="Vista compacta 6 columnas"
                >
                  <span className="material-symbols-outlined text-[18px]">apps</span>
                </button>
              </div>
            </div>
          </div>

          {/* Chips de filtros activos */}
          {activeFiltersCount > 0 && (
            <div className="flex items-center gap-2 flex-wrap mb-6 pb-2">
              <span className="text-xs font-bold text-slate-400">Filtros aplicados:</span>
              
              {searchQuery && (
                <span className="inline-flex items-center gap-1 bg-orange-50 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300 text-xs font-semibold px-2.5 py-1 rounded-full">
                  <span>Búsqueda: "{searchQuery}"</span>
                  <button onClick={() => { setSearchQuery(''); updateURLParam('q', ''); }} className="hover:text-red-500">×</button>
                </span>
              )}

              {selectedCategory !== 'TODAS' && (
                <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold px-2.5 py-1 rounded-full">
                  <span>Cat: {selectedCategory}</span>
                  <button onClick={() => handleCategorySelect('TODAS')} className="hover:text-red-500">×</button>
                </span>
              )}

              {selectedSubcategory !== 'TODAS' && (
                <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold px-2.5 py-1 rounded-full">
                  <span>Sub: {selectedSubcategory}</span>
                  <button onClick={() => handleSubcategorySelect('TODAS')} className="hover:text-red-500">×</button>
                </span>
              )}

              {selectedBrand !== 'TODAS' && (
                <span className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold px-2.5 py-1 rounded-full">
                  <span>Marca: {selectedBrand}</span>
                  <button onClick={() => handleBrandSelect(selectedBrand)} className="hover:text-red-500">×</button>
                </span>
              )}

              {onlyOffers && (
                <span className="inline-flex items-center gap-1 bg-red-50 dark:bg-red-950/60 text-red-600 text-xs font-bold px-2.5 py-1 rounded-full border border-red-200">
                  <span>Solo Ofertas</span>
                  <button onClick={() => { setOnlyOffers(false); updateURLParam('offers', false); }} className="hover:text-red-700">×</button>
                </span>
              )}

              {onlyFreeShipping && (
                <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 text-xs font-bold px-2.5 py-1 rounded-full border border-emerald-200">
                  <span>Envío Gratis</span>
                  <button onClick={() => setOnlyFreeShipping(false)} className="hover:text-emerald-700">×</button>
                </span>
              )}

              <button
                onClick={clearAllFilters}
                className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline ml-1 cursor-pointer"
              >
                Limpiar todos
              </button>
            </div>
          )}

          {/* Layout Principal: Sidebar de Filtros + Grid de Productos */}
          <div className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            
            {/* ── SIDEBAR DE FILTROS DESKTOP ── */}
            <aside className="hidden lg:block lg:col-span-1 space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm sticky top-40 space-y-6 max-h-[calc(100vh-180px)] overflow-y-auto no-scrollbar">
                
                {/* 1. Categorías */}
                <div>
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider mb-3">
                    Departamentos
                  </h4>
                  <ul className="space-y-1.5 text-xs">
                    <li>
                      <button
                        onClick={() => handleCategorySelect('TODAS')}
                        className={`w-full text-left py-1 px-2 rounded-lg font-bold transition-colors cursor-pointer ${
                          selectedCategory === 'TODAS'
                            ? 'bg-orange-50 dark:bg-orange-950/60 text-orange-600'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        Todos los Departamentos
                      </button>
                    </li>
                    {categoryTree.map((cat) => (
                      <li key={cat.id || cat.name}>
                        <button
                          onClick={() => handleCategorySelect(cat.name)}
                          className={`w-full text-left py-1 px-2 rounded-lg font-semibold transition-colors cursor-pointer flex items-center justify-between ${
                            selectedCategory === cat.name
                              ? 'bg-orange-50 dark:bg-orange-950/60 text-orange-600 font-bold'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          <span>{cat.name}</span>
                          <span className="text-[10px] text-slate-400">
                            {products.filter(p => p.category === cat.name).length}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 2. Subcategorías (si hay categoría activa) */}
                {availableSubcategories.length > 0 && (
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                    <h4 className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                      Subcategorías
                    </h4>
                    <div className="space-y-1 text-xs">
                      {availableSubcategories.map((sub) => (
                        <button
                          key={sub}
                          onClick={() => handleSubcategorySelect(sub)}
                          className={`w-full text-left py-1 px-2 rounded-lg transition-colors cursor-pointer ${
                            selectedSubcategory === sub
                              ? 'bg-orange-50 dark:bg-orange-950/60 text-orange-600 font-bold'
                              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          • {sub}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Filtro por Marcas Oficiales (con buscador) */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Marcas</span>
                    <span className="text-[10px] text-slate-400 font-normal">({brands.length})</span>
                  </h4>

                  {/* Input búsqueda marca */}
                  <input
                    type="text"
                    placeholder="Buscar marca..."
                    value={brandSearch}
                    onChange={(e) => setBrandSearch(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none mb-2"
                  />

                  <div className="max-h-48 overflow-y-auto space-y-1.5 text-xs">
                    {filteredSidebarBrands.map((b) => {
                      const count = products.filter(p => normalizeStr(p.brand) === normalizeStr(b.name)).length;
                      const isChecked = selectedBrand === b.name;
                      return (
                        <label
                          key={b.id || b.name}
                          onClick={() => handleBrandSelect(b.name)}
                          className="flex items-center justify-between py-1 px-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer select-none"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              readOnly
                              className="rounded text-orange-500 focus:ring-orange-500 cursor-pointer"
                            />
                            <span className={`font-semibold ${isChecked ? 'text-orange-600 dark:text-orange-400' : 'text-slate-700 dark:text-slate-300'}`}>
                              {b.name}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400">{count}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Rango de Precio */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                    Precio Máximo
                  </h4>
                  <div className="flex items-center justify-between text-xs font-bold text-orange-600 mb-2">
                    <span>Hasta ${maxPrice.toLocaleString()} MXN</span>
                  </div>
                  <input
                    type="range"
                    min="500"
                    max="25000"
                    step="500"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-full accent-orange-500 cursor-pointer"
                  />
                </div>

                {/* 5. Toggles Rápidos (Ofertas, Envío Gratis) */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={onlyOffers}
                      onChange={(e) => {
                        setOnlyOffers(e.target.checked);
                        updateURLParam('offers', e.target.checked);
                      }}
                      className="rounded text-orange-500 cursor-pointer"
                    />
                    <span className="font-bold text-red-600">🔥 Solo Ofertas y Descuentos</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={onlyFreeShipping}
                      onChange={(e) => setOnlyFreeShipping(e.target.checked)}
                      className="rounded text-orange-500 cursor-pointer"
                    />
                    <span className="font-bold text-emerald-600">🚚 Solo Envío Gratis</span>
                  </label>
                </div>

                {/* 6. Calificación Mínima */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                    Calificación
                  </h4>
                  <div className="space-y-1 text-xs">
                    {[4, 3, 0].map((star) => (
                      <button
                        key={star}
                        onClick={() => setMinRating(star)}
                        className={`w-full text-left py-1 px-2 rounded-lg flex items-center gap-1.5 cursor-pointer ${
                          minRating === star
                            ? 'bg-amber-50 dark:bg-amber-950/60 font-bold text-amber-700 dark:text-amber-400'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        {star > 0 ? (
                          <>
                            <span className="material-symbols-outlined text-[16px] text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>
                              star
                            </span>
                            <span>{star} estrellas o más</span>
                          </>
                        ) : (
                          <span>Cualquier calificación</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </aside>

            {/* ── GRID DE PRODUCTOS ── */}
            <div className="lg:col-span-3 xl:col-span-4">
              {filteredProducts.length === 0 ? (
                /* Estado Vacío (No results) */
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200/80 dark:border-slate-800 shadow-sm">
                  <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-600 flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-[32px]">search_off</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">
                    No encontramos artículos con esos filtros
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
                    Prueba cambiando los términos de búsqueda o eliminando los filtros aplicados.
                  </p>
                  <button
                    onClick={clearAllFilters}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-6 py-2.5 rounded-full transition-all cursor-pointer"
                  >
                    Restablecer Filtros
                  </button>
                </div>
              ) : (
                /* Grid de tarjetas estilo Marketplace */
                <div
                  className={`grid gap-3 sm:gap-4 ${
                    gridColumns === 6
                      ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6'
                      : 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4'
                  }`}
                >
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* ── DRAWER DE FILTROS MÓVIL ── */}
        {isMobileFilterOpen && (
          <>
            <div
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-[70] lg:hidden"
              onClick={() => setIsMobileFilterOpen(false)}
            />
            <div className="fixed inset-y-0 right-0 w-full max-w-xs bg-white dark:bg-slate-900 z-[80] shadow-2xl p-6 flex flex-col justify-between overflow-y-auto lg:hidden">
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <h3 className="font-black text-sm uppercase tracking-wider">Filtros de Búsqueda</h3>
                  <button onClick={() => setIsMobileFilterOpen(false)} className="p-1">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                {/* Categorías Móvil */}
                <div>
                  <h4 className="font-extrabold text-xs uppercase mb-2">Departamentos</h4>
                  <div className="space-y-1 text-xs">
                    <button
                      onClick={() => { handleCategorySelect('TODAS'); setIsMobileFilterOpen(false); }}
                      className={`block w-full text-left py-1.5 px-2 rounded-lg ${selectedCategory === 'TODAS' ? 'font-bold text-orange-600 bg-orange-50' : ''}`}
                    >
                      Todos
                    </button>
                    {categoryTree.map(cat => (
                      <button
                        key={cat.id || cat.name}
                        onClick={() => { handleCategorySelect(cat.name); setIsMobileFilterOpen(false); }}
                        className={`block w-full text-left py-1.5 px-2 rounded-lg ${selectedCategory === cat.name ? 'font-bold text-orange-600 bg-orange-50' : ''}`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Marcas Móvil */}
                <div>
                  <h4 className="font-extrabold text-xs uppercase mb-2">Marcas</h4>
                  <div className="max-h-40 overflow-y-auto space-y-1 text-xs">
                    {brands.map(b => (
                      <button
                        key={b.id || b.name}
                        onClick={() => { handleBrandSelect(b.name); setIsMobileFilterOpen(false); }}
                        className={`block w-full text-left py-1 px-2 rounded-lg ${selectedBrand === b.name ? 'font-bold text-orange-600 bg-orange-50' : ''}`}
                      >
                        {b.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold text-xs shadow-md"
                >
                  Ver {filteredProducts.length} Resultados
                </button>
                <button
                  onClick={clearAllFilters}
                  className="w-full py-2 text-slate-500 text-xs font-semibold"
                >
                  Limpiar Filtros
                </button>
              </div>
            </div>
          </>
        )}

      </main>
    </>
  );
}
