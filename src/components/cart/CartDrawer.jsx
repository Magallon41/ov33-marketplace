import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useProducts } from '../../context/ProductContext';

export function CartDrawer() {
  const { items, isOpen, setIsOpen, updateQuantity, removeItem, subtotal, cartNotice } = useCart();
  const { products, getProductStock } = useProducts();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const stockIssues = (items || []).map(item => {
    const realProduct = (products && products.length > 0) ? products.find(p => String(p.id) === String(item.id)) : null;
    const availableStock = realProduct ? getProductStock(realProduct, item.selectedSize, item.selectedColor) : 10;
    return {
      ...item,
      availableStock,
      isOutOfStock: availableStock <= 0,
      isOverStock: item.quantity > availableStock,
      isMaxReached: item.quantity >= availableStock
    };
  });

  const hasAnyStockIssue = stockIssues.some(i => i.isOutOfStock || i.isOverStock);
  const FREE_SHIPPING_THRESHOLD = 499;
  const missingAmount = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progressPct = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-[60] transition-opacity"
        onClick={() => setIsOpen(false)}
      />
      
      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-[450px] bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 z-[70] shadow-2xl transform transition-transform duration-300 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-orange-500 text-[22px]">shopping_cart</span>
            <h2 className="text-sm font-black uppercase tracking-wider">
              Mi Carrito ({items.reduce((sum, i) => sum + i.quantity, 0)})
            </h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white"
            aria-label="Cerrar carrito"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Barra de progreso de Envío Gratis */}
        {items.length > 0 && (
          <div className="bg-orange-50/70 dark:bg-orange-950/40 border-b border-orange-200/60 dark:border-orange-800/40 px-6 py-3">
            <div className="flex justify-between items-center text-xs font-bold mb-1.5">
              {missingAmount > 0 ? (
                <span className="text-slate-700 dark:text-slate-300">
                  Agrega <strong className="text-orange-600 dark:text-orange-400">${missingAmount.toLocaleString()} MXN</strong> más para <span className="text-emerald-600 font-extrabold">¡Envío Gratis!</span>
                </span>
              ) : (
                <span className="text-emerald-600 font-black flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  <span>¡Felicidades! Calificas para Envío Gratis</span>
                </span>
              )}
              <span className="text-slate-500 font-mono text-[11px]">{Math.round(progressPct)}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 overflow-hidden rounded-full">
              <div 
                className="transition-all duration-500 ease-out h-full rounded-full bg-gradient-to-r from-orange-500 to-emerald-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Global Cart Notice */}
        {cartNotice && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 text-xs text-amber-900 flex items-center gap-2 font-medium">
            <span className="material-symbols-outlined text-[16px] text-amber-700">warning</span>
            <span>{cartNotice}</span>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 no-scrollbar">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16">
              <div className="w-16 h-16 rounded-full bg-orange-50 dark:bg-orange-950/60 text-orange-500 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-[32px]">shopping_cart</span>
              </div>
              <h3 className="font-bold text-base mb-1">Tu carrito está vacío</h3>
              <p className="text-xs text-slate-400 mb-6">Explora ofertas y productos de grandes marcas en OV33.</p>
              <button 
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-full font-bold text-xs shadow-md transition-all cursor-pointer"
                onClick={() => setIsOpen(false)}
              >
                Comenzar a Comprar
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {stockIssues.map(item => (
                <div key={`${item.id}-${item.selectedSize || ''}-${item.selectedColor || ''}`} className="flex gap-3 pb-4 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <div className="w-20 h-20 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200/60 dark:border-slate-700 overflow-hidden relative p-1">
                    <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-1">
                        <span className="text-[10px] font-black uppercase text-orange-600 tracking-wider">
                          {item.brand || 'OV33'}
                        </span>
                        <button
                          onClick={() => removeItem(item.id, item.selectedSize, item.selectedColor)}
                          className="text-slate-400 hover:text-red-600 p-0.5"
                          title="Eliminar del carrito"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                      <h4 className="text-xs font-bold line-clamp-1 text-slate-900 dark:text-white">
                        {item.name}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {item.selectedSize && `Opción: ${item.selectedSize}`}
                        {item.selectedColor && ` | Color: ${item.selectedColor}`}
                      </p>
                    </div>

                    <div className="flex justify-between items-end mt-2">
                      <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-800">
                        <button 
                          onClick={() => updateQuantity(item.id, item.selectedSize, item.selectedColor, item.quantity - 1)} 
                          className="px-2.5 py-1 text-xs hover:bg-slate-200 dark:hover:bg-slate-700"
                        >
                          -
                        </button>
                        <span className="px-2 text-xs font-bold">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.selectedSize, item.selectedColor, item.quantity + 1)} 
                          disabled={item.isMaxReached}
                          className="px-2.5 py-1 text-xs hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30"
                        >
                          +
                        </button>
                      </div>
                      <span className="font-black text-sm text-orange-600 dark:text-orange-400">
                        ${item.price}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-slate-500">Subtotal</span>
              <span className="text-xl font-black text-slate-900 dark:text-white">
                ${subtotal.toLocaleString()} MXN
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-4">
              {subtotal >= FREE_SHIPPING_THRESHOLD ? '🚚 Envío Gratis incluido a todo México' : 'Costos de envío calculados al finalizar compra'}
            </p>

            <button 
              disabled={hasAnyStockIssue}
              className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer ${
                hasAnyStockIssue
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-orange-500/25 active:scale-98'
              }`}
              onClick={() => {
                if (hasAnyStockIssue) return;
                setIsOpen(false);
                navigate('/checkout');
              }}
            >
              {hasAnyStockIssue ? 'Ajusta el stock para continuar' : 'Finalizar Pedido'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
