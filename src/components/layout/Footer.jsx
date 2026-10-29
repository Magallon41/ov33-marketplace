import React from 'react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-[#070D17] text-slate-300 w-full border-t border-[#C5A869]/25 mt-auto" role="contentinfo">
      
      {/* Barra de Propuesta de Valor y Confianza (Marketplace Trust Bar — Midnight & Gold) */}
      <div className="border-b border-[#C5A869]/15 bg-[#0A111A] py-8 px-4 md:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center sm:text-left">
          
          <div className="flex items-center gap-4 justify-center sm:justify-start">
            <div className="w-12 h-12 rounded-2xl bg-[#C5A869]/10 text-[#DFBE78] border border-[#C5A869]/30 flex items-center justify-center shrink-0 shadow-xs">
              <span className="material-symbols-outlined text-[26px]">local_shipping</span>
            </div>
            <div>
              <h4 className="font-bold text-white text-sm flex items-center gap-1.5 justify-center sm:justify-start">
                <span>Envíos Rápidos</span>
              </h4>
              <p className="text-xs text-slate-400">Rastreo garantizado con Envia.com</p>
            </div>
          </div>

          <div className="flex items-center gap-4 justify-center sm:justify-start">
            <div className="w-12 h-12 rounded-2xl bg-[#C5A869]/10 text-[#DFBE78] border border-[#C5A869]/30 flex items-center justify-center shrink-0 shadow-xs">
              <span className="material-symbols-outlined text-[26px]">verified_user</span>
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Compra Protegida</h4>
              <p className="text-xs text-slate-400">30 días de garantía y devolución fácil</p>
            </div>
          </div>

          <div className="flex items-center gap-4 justify-center sm:justify-start">
            <div className="w-12 h-12 rounded-2xl bg-[#C5A869]/10 text-[#DFBE78] border border-[#C5A869]/30 flex items-center justify-center shrink-0 shadow-xs">
              <span className="material-symbols-outlined text-[26px]">payments</span>
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Pagos 100% Seguros</h4>
              <p className="text-xs text-slate-400">Mercado Pago, Tarjetas, SPEI y OXXO</p>
            </div>
          </div>

          <div className="flex items-center gap-4 justify-center sm:justify-start">
            <div className="w-12 h-12 rounded-2xl bg-[#C5A869]/10 text-[#DFBE78] border border-[#C5A869]/30 flex items-center justify-center shrink-0 shadow-xs">
              <span className="material-symbols-outlined text-[26px]">support_agent</span>
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Soporte Dedicado</h4>
              <p className="text-xs text-slate-400">Atención personalizada para tus compras</p>
            </div>
          </div>

        </div>
      </div>

      {/* Contenido Principal del Footer */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          
          {/* Columna Marca & Newsletter */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="relative bg-gradient-to-r from-red-600 via-orange-500 to-[#C5A869] text-white font-black text-xl px-2.5 py-1 rounded-xl shadow-md border border-[#DFBE78]/40">
                OV33
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-lg font-black tracking-tight text-white flex items-center gap-1">
                  MARKET
                  <span className="text-[#C5A869] text-xs">✦</span>
                </span>
                <span className="text-[9px] font-black text-[#C5A869] tracking-widest uppercase">
                  Multimarca Oficial
                </span>
              </div>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed mb-5 max-w-sm">
              Tu marketplace multimarca favorito en México. Descubre miles de productos de marcas oficiales como Nike, Apple, Xiaomi, Casio y Stanley con las mejores ofertas del mercado.
            </p>

            <div className="space-y-2">
              <span className="text-xs font-bold text-[#DFBE78] block">Recibe cupones y ofertas exclusivas:</span>
              <div className="flex items-center max-w-md">
                <input
                  type="email"
                  placeholder="Tu correo electrónico..."
                  className="bg-[#0E1624] text-xs text-white px-3.5 py-2.5 rounded-l-xl outline-none border border-[#C5A869]/30 focus:border-[#C5A869] flex-1 placeholder-slate-500"
                />
                <button
                  type="button"
                  className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold px-4 py-2.5 rounded-r-xl transition-all shadow-sm cursor-pointer"
                >
                  Suscribirme
                </button>
              </div>
            </div>
          </div>

          {/* Columna Departamentos */}
          <div>
            <h5 className="font-bold text-[#DFBE78] text-xs uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <span>Departamentos</span>
            </h5>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/catalog?category=Tecnología %26 Gadgets" className="text-slate-400 hover:text-[#DFBE78] transition-colors">
                  Tecnología & Gadgets
                </Link>
              </li>
              <li>
                <Link to="/catalog?category=Moda %26 Sneakers" className="text-slate-400 hover:text-[#DFBE78] transition-colors">
                  Moda & Sneakers
                </Link>
              </li>
              <li>
                <Link to="/catalog?category=Relojes %26 Accesorios" className="text-slate-400 hover:text-[#DFBE78] transition-colors">
                  Relojes & Accesorios
                </Link>
              </li>
              <li>
                <Link to="/catalog?category=Hogar %26 Estilo de Vida" className="text-slate-400 hover:text-[#DFBE78] transition-colors">
                  Hogar & Hidratación
                </Link>
              </li>
              <li>
                <Link to="/ofertas" className="text-red-400 font-bold hover:text-red-300 transition-colors flex items-center gap-1">
                  <span>🔥 Ofertas Flash</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna Servicio al Cliente */}
          <div>
            <h5 className="font-bold text-[#DFBE78] text-xs uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <span>Atención a Clientes</span>
            </h5>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/tracking" className="text-slate-400 hover:text-[#DFBE78] transition-colors flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-[#C5A869]">local_shipping</span>
                  <span>Rastrear mi pedido</span>
                </Link>
              </li>
              <li>
                <Link to="/shipping" className="text-slate-400 hover:text-[#DFBE78] transition-colors">
                  Políticas de Envío
                </Link>
              </li>
              <li>
                <Link to="/shipping" className="text-slate-400 hover:text-[#DFBE78] transition-colors">
                  Garantía y Devoluciones
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-slate-400 hover:text-[#DFBE78] transition-colors">
                  Preguntas Frecuentes
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-slate-400 hover:text-[#DFBE78] transition-colors">
                  Aviso de Privacidad
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna Métodos de Pago & Contacto */}
          <div>
            <h5 className="font-bold text-[#DFBE78] text-xs uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <span>Pagos & B2B</span>
            </h5>
            <div className="space-y-3 text-xs text-slate-400">
              <p>Aceptamos todas las tarjetas de crédito, débito, transferencias y pagos en efectivo:</p>
              
              <div className="flex flex-wrap gap-2 text-[10px] font-bold">
                <span className="bg-[#0E1624] px-2.5 py-1 rounded text-slate-300 border border-[#C5A869]/30">Mercado Pago</span>
                <span className="bg-[#0E1624] px-2.5 py-1 rounded text-slate-300 border border-[#C5A869]/30">Visa / Mastercard</span>
                <span className="bg-[#0E1624] px-2.5 py-1 rounded text-slate-300 border border-[#C5A869]/30">OXXO Pay</span>
                <span className="bg-[#0E1624] px-2.5 py-1 rounded text-slate-300 border border-[#C5A869]/30">SPEI</span>
              </div>

              <div className="pt-2">
                <Link
                  to="/mayoristas"
                  className="inline-flex items-center gap-1.5 text-[#DFBE78] hover:text-[#C5A869] font-bold bg-[#C5A869]/10 px-3 py-1.5 rounded-lg border border-[#C5A869]/30 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px] text-[#C5A869]">storefront</span>
                  <span>¿Eres mayorista o proveedor?</span>
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </Link>
              </div>
            </div>
          </div>

        </div>

        {/* Fila final de Copyright */}
        <div className="border-t border-[#C5A869]/20 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} OV33 MARKETPLACE. Todos los derechos reservados.</p>
          <div className="flex items-center gap-4">
            <span className="text-[#DFBE78]">Envíos a toda la República Mexicana 🇲🇽</span>
            <span className="text-[#C5A869]/40">•</span>
            <span className="text-slate-400">Plataforma Segura SSL</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
