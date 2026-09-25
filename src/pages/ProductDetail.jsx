import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useProducts, isProductOnSale, getDiscountPercentage } from '../context/ProductContext';
import { SEOHead } from '../components/seo/SEOHead';
import { ProductCard } from '../components/ui/ProductCard';

const SEED_REVIEWS = {
  101: [
    { name: "Carlos R.", rating: 5, date: "2026-09-18T10:30:00Z", comment: "Totalmente originales, la cancelación de ruido de los AirPods Pro es insuperable. Llegaron en 24 horas a Guadalajara." },
    { name: "Sofía M.", rating: 5, date: "2026-09-21T18:22:00Z", comment: "Excelente compra en OV33. El conector USB-C es súper cómodo y la batería dura días." }
  ],
  102: [
    { name: "Daniel K.", rating: 5, date: "2026-09-20T14:45:00Z", comment: "Los sneakers Nike Air Max más cómodos que he tenido. Ajuste perfecto a la talla." }
  ],
  103: [
    { name: "Fernanda L.", rating: 5, date: "2026-09-22T08:00:00Z", comment: "El termo Stanley original conserva el hielo intacto por más de un día. El color verde eucalipto es bellísimo." }
  ]
};

export function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem, items, setIsOpen } = useCart();
  const { currentUser } = useAuth();
  const { products, getProductStock } = useProducts();
  
  const product = products.find(p => String(p.id) === String(id)) || products[0];

  const [activeVariantIndex, setActiveVariantIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [activeImage, setActiveImage] = useState('');
  const [qtyToBuy, setQtyToBuy] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  // Magnifier Loupe Zoom states
  const [zoomOrigin, setZoomOrigin] = useState('50% 50%');

  // Reviews states
  const [reviews, setReviews] = useState([]);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  useEffect(() => {
    if (product) {
      setActiveVariantIndex(0);
      setReviewSuccess('');
      setNewComment('');
      setNewRating(5);
      setQtyToBuy(1);

      const storedAllReviews = localStorage.getItem('ov33_reviews');
      const allReviews = storedAllReviews ? JSON.parse(storedAllReviews) : SEED_REVIEWS;
      setReviews(allReviews[product.id] || SEED_REVIEWS[product.id] || [
        { name: "Cliente Verificado", rating: 5, date: "2026-09-15T12:00:00Z", comment: "Excelente artículo 100% original, envío súper rápido y empaque intacto." }
      ]);
    }
  }, [product]);

  useEffect(() => {
    if (product) {
      const hasVariants = product.variants && product.variants.length > 0;
      const activeVar = hasVariants ? product.variants[activeVariantIndex] : null;
      
      const defaultImg = activeVar ? (activeVar.images && activeVar.images[0] ? activeVar.images[0] : product.image) : product.image;
      setActiveImage(defaultImg);

      const productSizes = product.sizes || ["Talla Única"];
      const firstAvailableSize = productSizes.find(size => {
        const stockCount = getProductStock(product, size, activeVar ? activeVar.colorName : null);
        return stockCount > 0;
      });

      setSelectedSize(firstAvailableSize || productSizes[0]);
      setQtyToBuy(1);
    }
  }, [activeVariantIndex, product]);

  if (!product) {
    return (
      <main className="pt-36 max-w-7xl mx-auto px-4 py-20 text-center min-h-screen">
        <h1 className="text-2xl font-black mb-4">Producto No Encontrado</h1>
        <button
          onClick={() => navigate('/catalog')}
          className="bg-orange-500 text-white font-bold px-6 py-2.5 rounded-full"
        >
          Volver al Catálogo
        </button>
      </main>
    );
  }

  const hasVariants = product.variants && product.variants.length > 0;
  const activeVar = hasVariants ? product.variants[activeVariantIndex] : null;

  const productSizes = product.sizes || ["Talla Única"];
  const currentSize = selectedSize || productSizes[0];
  const currentColor = activeVar ? activeVar.colorName : null;

  const currentSizeStock = getProductStock(product, currentSize, currentColor);

  const inCartItem = (items || []).find(
    i => String(i.id) === String(product.id) && 
         i.selectedSize === currentSize && 
         i.selectedColor === currentColor
  );
  const inCartQty = inCartItem ? (inCartItem.quantity || 0) : 0;
  const remainingStock = Math.max(0, currentSizeStock - inCartQty);

  const handleAddToCart = (openDrawer = false) => {
    if (remainingStock <= 0 || currentSizeStock <= 0) return;
    
    const countToAdd = Math.min(qtyToBuy, remainingStock);
    addItem({
      ...product,
      selectedSize: currentSize,
      selectedColor: currentColor,
      selectedColorHex: activeVar ? activeVar.colorHex : null,
      image: activeVar && activeVar.images && activeVar.images[0] ? activeVar.images[0] : product.image
    }, countToAdd);

    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
      if (openDrawer) setIsOpen(true);
    }, 400);
  };

  const handleBuyNow = () => {
    handleAddToCart(false);
    navigate('/checkout');
  };

  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomOrigin(`${x}% ${y}%`);
  };

  const handleMouseLeave = () => {
    setZoomOrigin('50% 50%');
  };

  const handleSubmitReview = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const newRev = {
      name: currentUser ? currentUser.name : 'Comprador Verificado',
      rating: newRating,
      date: new Date().toISOString(),
      comment: newComment.trim()
    };

    const updatedReviews = [newRev, ...reviews];
    setReviews(updatedReviews);

    const storedAllReviews = localStorage.getItem('ov33_reviews');
    const allReviews = storedAllReviews ? JSON.parse(storedAllReviews) : SEED_REVIEWS;
    allReviews[product.id] = updatedReviews;
    localStorage.setItem('ov33_reviews', JSON.stringify(allReviews));

    setNewComment('');
    setReviewSuccess('¡Gracias! Tu reseña ha sido publicada y agregada a la valoración.');
  };

  const avgRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : (product.rating || '4.8');

  const galleryImages = activeVar && activeVar.images && activeVar.images.length > 0 
    ? activeVar.images 
    : (product.images && product.images.length > 0 ? product.images : [product.image]);

  const onSale = isProductOnSale(product);
  const discount = onSale ? (product.discountPercentage || getDiscountPercentage(product.originalPrice, product.price)) : 0;

  // Productos relacionados de la misma categoría o marca
  const relatedProducts = products
    .filter(p => String(p.id) !== String(product.id) && (p.brand === product.brand || p.category === product.category))
    .slice(0, 4);

  return (
    <>
      <SEOHead
        title={`${product.name} — ${product.brand} | OV33 Market`}
        description={product.description || `Compra ${product.name} original en OV33 Marketplace. Envíos a todo México con seguimiento en tiempo real.`}
        image={product.image}
        url={`/product/${product.id}`}
        type="product"
      />

      <main className="pt-32 sm:pt-36 pb-20 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 min-h-screen">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8">
          
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs text-slate-400 mb-6 flex-wrap">
            <Link to="/" className="hover:text-orange-500">Inicio</Link>
            <span>/</span>
            <Link to={`/catalog?category=${encodeURIComponent(product.category || '')}`} className="hover:text-orange-500">
              {product.category}
            </Link>
            <span>/</span>
            <Link to={`/catalog?brand=${encodeURIComponent(product.brand || '')}`} className="hover:text-orange-500 font-bold text-orange-600">
              {product.brand}
            </Link>
            <span>/</span>
            <span className="text-slate-700 dark:text-slate-300 font-medium truncate max-w-[200px] sm:max-w-md">
              {product.name}
            </span>
          </nav>

          {/* Ficha Principal de Producto */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-12">
            
            {/* ── Galería de Imágenes (7 columnas en desktop) ── */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div 
                className="bg-slate-100 dark:bg-slate-800 rounded-2xl aspect-square overflow-hidden relative cursor-zoom-in flex items-center justify-center border border-slate-200/60 dark:border-slate-700"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
                <img 
                  src={activeImage || product.image} 
                  alt={product.name}
                  style={{ transformOrigin: zoomOrigin }}
                  className="w-full h-full object-contain p-4 transition-transform duration-75 ease-out hover:scale-[1.8]"
                  fetchpriority="high"
                />

                {/* Badges superiores */}
                <div className="absolute top-4 left-4 flex flex-col gap-2 z-10 pointer-events-none">
                  {discount > 0 && (
                    <span className="bg-gradient-to-r from-red-600 to-orange-600 text-white text-xs font-black px-3 py-1 rounded-lg shadow-md">
                      -{discount}% OFF
                    </span>
                  )}
                  {product.isFlashDeal && (
                    <span className="bg-amber-500 text-slate-950 text-xs font-black px-3 py-1 rounded-lg shadow-sm flex items-center gap-1">
                      <span>⚡</span> OFERTA RELÁMPAGO
                    </span>
                  )}
                </div>

                <div className="absolute bottom-3 right-3 bg-black/60 text-white text-[10px] font-semibold px-2.5 py-1 rounded-md pointer-events-none select-none backdrop-blur-xs flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">zoom_in</span>
                  <span>Pasa el cursor para ampliar</span>
                </div>
              </div>

              {/* Thumbnails */}
              {galleryImages.length > 1 && (
                <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1">
                  {galleryImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(img)}
                      className={`w-16 h-16 rounded-xl overflow-hidden border-2 bg-slate-100 dark:bg-slate-800 shrink-0 transition-all p-1 ${
                        activeImage === img
                          ? 'border-orange-500 ring-2 ring-orange-500/20 shadow-sm'
                          : 'border-slate-200 dark:border-slate-700 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt={`Vista ${idx + 1}`} className="w-full h-full object-contain" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Detalles, Precios & Acciones de Compra (5 columnas en desktop) ── */}
            <div className="lg:col-span-5 flex flex-col justify-between">
              <div>
                
                {/* Marca & Verificación */}
                <div className="flex items-center justify-between mb-2">
                  <Link
                    to={`/catalog?brand=${encodeURIComponent(product.brand || '')}`}
                    className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-orange-600 hover:underline"
                  >
                    <span>{product.brand}</span>
                    <span className="material-symbols-outlined text-[14px] text-blue-500 font-bold" title="Tienda Oficial Verificada">
                      verified
                    </span>
                  </Link>

                  {product.freeShipping && (
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                      🚚 Envío Gratis Inmediato
                    </span>
                  )}
                </div>

                {/* Título de Producto */}
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-snug mb-3">
                  {product.name}
                </h1>

                {/* Reseñas & Ventas */}
                <div className="flex items-center gap-3 text-xs mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1 text-amber-500 font-black">
                    <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      star
                    </span>
                    <span>{avgRating}</span>
                  </div>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-600 dark:text-slate-400 underline">
                    {reviews.length} opiniones
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-800 dark:text-slate-200 font-bold">
                    {product.salesCount || '+1.2k vendidos'}
                  </span>
                </div>

                {/* Bloque de Precios estilo TEMU / AliExpress */}
                <div className="bg-orange-50/70 dark:bg-orange-950/30 rounded-2xl p-4 mb-6 border border-orange-200/60 dark:border-orange-800/40">
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <span className="text-3xl font-black text-orange-600 dark:text-orange-400 tracking-tight">
                      ${product.price} <span className="text-sm font-semibold text-slate-500">MXN</span>
                    </span>
                    {product.originalPrice && (
                      <span className="text-sm text-slate-400 line-through">
                        ${product.originalPrice} MXN
                      </span>
                    )}
                    {discount > 0 && (
                      <span className="bg-red-600 text-white text-[11px] font-black px-2 py-0.5 rounded-md">
                        -{discount}% OFF
                      </span>
                    )}
                  </div>
                  {onSale && product.originalPrice && (
                    <p className="text-xs text-red-600 dark:text-red-400 font-bold mt-1">
                      ¡Ahorras ${(Number(String(product.originalPrice).replace(/,/g, '')) - Number(String(product.price).replace(/,/g, ''))).toLocaleString()} MXN!
                    </p>
                  )}
                </div>

                {/* Selector de Variantes (Colores) */}
                {hasVariants && (
                  <div className="mb-6">
                    <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5">
                      Color / Versión: <strong className="text-orange-600">{product.variants[activeVariantIndex].colorName}</strong>
                    </span>
                    <div className="flex flex-wrap gap-2.5">
                      {product.variants.map((v, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveVariantIndex(idx)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            activeVariantIndex === idx
                              ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/40 text-orange-600 ring-2 ring-orange-500/20'
                              : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                          }`}
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0"
                            style={{ backgroundColor: v.colorHex || '#ccc' }}
                          />
                          <span>{v.colorName}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Selector de Tallas / Opciones */}
                <div className="mb-6">
                  <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5">
                    Talla / Opción:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {productSizes.map(size => {
                      const stockVal = getProductStock(product, size, currentColor);
                      const isOutOfStock = stockVal === 0;

                      return (
                        <button
                          key={size}
                          onClick={() => !isOutOfStock && setSelectedSize(size)}
                          disabled={isOutOfStock}
                          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isOutOfStock
                              ? 'bg-slate-100 text-slate-300 line-through cursor-not-allowed border border-slate-200'
                              : currentSize === size
                              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-orange-500'
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>

                  {/* Urgencia de stock */}
                  <div className="mt-2 text-xs">
                    {currentSizeStock <= 4 && currentSizeStock > 0 && (
                      <span className="text-amber-600 font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">warning</span>
                        ¡Solo quedan {currentSizeStock} unidades en stock!
                      </span>
                    )}
                  </div>
                </div>

                {/* Selector de Cantidad */}
                {currentSizeStock > 0 && (
                  <div className="mb-6 flex items-center gap-4">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Cantidad:
                    </span>
                    <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800">
                      <button
                        type="button"
                        onClick={() => setQtyToBuy(q => Math.max(1, q - 1))}
                        disabled={qtyToBuy <= 1}
                        className="px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
                      >
                        -
                      </button>
                      <span className="px-4 py-1.5 text-xs font-bold">{qtyToBuy}</span>
                      <button
                        type="button"
                        onClick={() => setQtyToBuy(q => Math.min(remainingStock, q + 1))}
                        disabled={qtyToBuy >= remainingStock}
                        className="px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}

              </div>

              {/* Botones de Acción de Compra */}
              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => handleAddToCart(true)}
                    disabled={currentSizeStock === 0}
                    className="w-full py-3.5 px-4 bg-orange-100 hover:bg-orange-200 dark:bg-orange-950/60 dark:hover:bg-orange-950 text-orange-600 dark:text-orange-400 font-black text-xs rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
                    <span>{isAdded ? '¡Agregado!' : 'Agregar al Carrito'}</span>
                  </button>

                  <button
                    onClick={handleBuyNow}
                    disabled={currentSizeStock === 0}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30 transition-all cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-[18px]">bolt</span>
                    <span>Comprar Ahora</span>
                  </button>
                </div>

                {/* Sellos de Confianza y Garantía */}
                <div className="grid grid-cols-3 gap-2 pt-3 text-[11px] text-slate-500 dark:text-slate-400 text-center">
                  <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <span className="material-symbols-outlined text-[20px] text-emerald-500 block mb-0.5">verified_user</span>
                    <span className="font-bold block text-slate-700 dark:text-slate-300">100% Original</span>
                    <span>Marca Certificada</span>
                  </div>
                  <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <span className="material-symbols-outlined text-[20px] text-blue-500 block mb-0.5">local_shipping</span>
                    <span className="font-bold block text-slate-700 dark:text-slate-300">Envío Rápido</span>
                    <span>Rastreo Envia.com</span>
                  </div>
                  <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <span className="material-symbols-outlined text-[20px] text-orange-500 block mb-0.5">replay</span>
                    <span className="font-bold block text-slate-700 dark:text-slate-300">30 Días</span>
                    <span>Garantía de Devolución</span>
                  </div>
                </div>

              </div>

            </div>

          </div>

          {/* ── Características & Descripción ── */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm mb-12">
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 uppercase tracking-wider">
              Descripción & Especificaciones
            </h3>
            
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6 font-medium">
              {product.description}
            </p>

            {product.features && product.features.length > 0 && (
              <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
                  Puntos Destacados
                </h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
                  {product.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-orange-500 font-bold">✓</span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* ── Reseñas de Clientes ── */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm mb-12">
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6 uppercase tracking-wider">
              Opiniones de Compradores ({reviews.length})
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
              {/* Resumen */}
              <div className="lg:col-span-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-6 text-center flex flex-col items-center justify-center">
                <span className="text-5xl font-black text-slate-900 dark:text-white">{avgRating}</span>
                <div className="flex text-amber-500 my-2">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <span key={idx} className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      star
                    </span>
                  ))}
                </div>
                <span className="text-xs font-bold text-slate-500">Valoración promedio del producto</span>
              </div>

              {/* Formulario */}
              <div className="lg:col-span-8">
                {reviewSuccess && (
                  <div className="p-3 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl mb-4">
                    {reviewSuccess}
                  </div>
                )}
                <form onSubmit={handleSubmitReview} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold">Tu calificación:</span>
                    <div className="flex gap-1 text-amber-500 cursor-pointer">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewRating(star)}
                          className="hover:scale-110 transition-transform"
                        >
                          <span className={`material-symbols-outlined text-[20px] ${star <= newRating ? 'fill-current' : 'text-slate-300'}`} style={star <= newRating ? { fontVariationSettings: "'FILL' 1" } : {}}>
                            star
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea
                    rows="3"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Escribe tu opinión sobre el producto..."
                    className="w-full text-xs p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:border-orange-500"
                    required
                  />

                  <button
                    type="submit"
                    className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                  >
                    Publicar Opinión
                  </button>
                </form>
              </div>
            </div>

            {/* Lista de reseñas */}
            <div className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-6">
              {reviews.map((rev, idx) => (
                <div key={idx} className="border-b border-slate-100 dark:border-slate-800 pb-4 last:border-none">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">{rev.name}</span>
                      <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.2 rounded">Comprador Verificado</span>
                    </div>
                    <div className="flex text-amber-500">
                      {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                        <span key={i} className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                          star
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">{rev.comment}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Productos Relacionados ── */}
          {relatedProducts.length > 0 && (
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6 uppercase tracking-wider">
                También te podría interesar
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {relatedProducts.map(p => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          )}

        </div>
      </main>
    </>
  );
}
