import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { getDiscountPercentage, isProductOnSale } from '../../context/ProductContext';

export function ProductCard({ product, compact = false }) {
  const { addItem, setIsOpen } = useCart();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  if (!product) return null;

  const onSale = isProductOnSale(product);
  const discount = onSale 
    ? (product.discountPercentage || getDiscountPercentage(product.originalPrice, product.price)) 
    : 0;

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Si tiene variantes de tamaño, toma la primera disponible
    const size = product.sizes && product.sizes.length > 0 ? product.sizes[0] : 'Talla Única';
    const color = product.variants && product.variants.length > 0 ? product.variants[0].colorName : null;

    addItem({
      ...product,
      selectedSize: size,
      selectedColor: color
    }, 1);

    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
      setIsOpen(true);
    }, 600);
  };

  const toggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
  };

  return (
    <div className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-orange-300 dark:hover:border-orange-500/50 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden h-full">
      {/* Imagen & Badges */}
      <div className="relative aspect-square w-full overflow-hidden bg-slate-100 dark:bg-slate-800/50">
        <Link to={`/product/${product.id}`} className="block w-full h-full">
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        </Link>

        {/* Badges superiores */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          {discount > 0 && (
            <span className="bg-gradient-to-r from-red-600 to-orange-600 text-white text-[11px] font-extrabold px-2 py-0.5 rounded-md shadow-md tracking-tight">
              -{discount}%
            </span>
          )}
          {product.isFlashDeal && (
            <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-md shadow-sm flex items-center gap-1 tracking-tight">
              <span>⚡</span> FLASH
            </span>
          )}
          {product.badge && !product.isFlashDeal && (
            <span className="bg-slate-900/85 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-0.5 rounded-md shadow-sm">
              {product.badge}
            </span>
          )}
        </div>

        {/* Botón Wishlist */}
        <button
          onClick={toggleWishlist}
          aria-label="Guardar en favoritos"
          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs text-slate-400 hover:text-red-500 dark:text-slate-300 dark:hover:text-red-400 flex items-center justify-center shadow-md transition-transform duration-200 active:scale-90 cursor-pointer z-10"
        >
          <span className={`material-symbols-outlined text-[18px] ${isWishlisted ? 'text-red-500 fill-1' : ''}`} style={isWishlisted ? { fontVariationSettings: "'FILL' 1" } : {}}>
            favorite
          </span>
        </button>

        {/* Botón flotante para agregar rápido (Desktop hover) */}
        <div className="absolute inset-x-2 bottom-2 hidden sm:block opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 z-10">
          <button
            onClick={handleQuickAdd}
            disabled={isAdded}
            className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg transition-all duration-200 cursor-pointer ${
              isAdded 
                ? 'bg-emerald-600 text-white' 
                : 'bg-orange-500 hover:bg-orange-600 text-white active:scale-98'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {isAdded ? 'check' : 'add_shopping_cart'}
            </span>
            <span>{isAdded ? '¡Agregado!' : 'Agregar al carrito'}</span>
          </button>
        </div>
      </div>

      {/* Contenido / Info de Producto */}
      <div className="p-3.5 flex flex-col flex-1 justify-between">
        <div>
          {/* Marca & Envío Gratis */}
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <span>{product.brand || 'OV33'}</span>
              <span className="material-symbols-outlined text-[12px] text-blue-500 font-bold" title="Marca Verificada">
                verified
              </span>
            </span>

            {product.freeShipping && (
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-sm">
                Envío Gratis
              </span>
            )}
          </div>

          {/* Título */}
          <Link to={`/product/${product.id}`} className="block group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
            <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white line-clamp-2 leading-snug">
              {product.name}
            </h3>
          </Link>

          {/* Calificación y ventas (Social Proof) */}
          <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <div className="flex items-center text-amber-500 font-bold gap-0.5">
              <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                star
              </span>
              <span>{product.rating || '4.8'}</span>
            </div>
            <span>•</span>
            <span className="font-medium text-slate-600 dark:text-slate-300">
              {product.salesCount || '+500 vendidos'}
            </span>
          </div>
        </div>

        {/* Precios y Botón móvil */}
        <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-base sm:text-lg font-black text-orange-600 dark:text-orange-400 tracking-tight">
              ${product.price}
            </span>
            {product.originalPrice && (
              <span className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-500 line-through">
                ${product.originalPrice}
              </span>
            )}
          </div>

          {/* Botón agregar móvil siempre visible */}
          <button
            onClick={handleQuickAdd}
            disabled={isAdded}
            className={`sm:hidden mt-2 w-full py-1.5 px-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer ${
              isAdded 
                ? 'bg-emerald-600 text-white' 
                : 'bg-orange-500 hover:bg-orange-600 text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {isAdded ? 'check' : 'shopping_bag'}
            </span>
            <span>{isAdded ? 'Agregado' : 'Comprar'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
