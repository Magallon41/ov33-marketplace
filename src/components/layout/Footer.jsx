import React from 'react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 w-full border-t border-slate-800 mt-auto" role="contentinfo">
      
      {/* Barra de Propuesta de Valor y Confianza (Marketplace Trust Bar) */}
      <div className="border-b border-slate-800 bg-slate-950/80 py-8 px-4 md:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center sm:text-left">
          
          <div className="flex items-center gap-4 justify-center sm:justify-start">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[28px]">local_shipping</span>
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Envíos Rápidos</h4>
              <p className="text-xs text-slate-400">Rastreo garantizado con Envia.com</p>
            </div>
          </div>

          <div className="flex items-center gap-4 justify-center sm:justify-start">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[28px]">verified_user</span>
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Compra Protegida</h4>
              <p className="text-xs text-slate-400">30 días de garantía y devolución fácil</p>
            </div>
          </div>

          <div className="flex items-center gap-4 justify-center sm:justify-start">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[28px]">payments</span>
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Pagos 100% Seguros</h4>
              <p className="text-xs text-slate-400">Mercado Pago, Tarjetas, SPEI y OXXO</p>
            </div>
          </div>

          <div className="flex items-center gap-4 justify-center sm:justify-start">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[28px]">support_agent</span>
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
              <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black text-xl px-2.5 py-1 rounded-xl shadow-md">
                OV33
              </div>
              <span className="text-lg font-black tracking-tight text-white">MARKET</span>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed mb-5 max-w-sm">
              Tu marketplace multimarca favorito en México. Descubre miles de productos de marcas oficiales como Nike, Apple, Xiaomi, Casio y Stanley con las mejores ofertas del mercado.
            </p>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300 block">Recibe cupones y ofertas exclusivas:</span>
              <div className="flex items-center max-w-md">
                <input
                  type="email"
                  placeholder="Tu correo electrónico..."
                  className="bg-slate-800 text-xs text-white px-3.5 py-2.5 rounded-l-xl outline-none border border-slate-700 focus:border-orange-500 flex-1 placeholder-slate-500"
                />
                <button
                  type="button"
                  className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-4 py-2.5 rounded-r-xl transition-colors cursor-pointer"
                >
                  Suscribirme
                </button>
              </div>
            </div>
          </div>

          {/* Columna Departamentos */}
          <div>
            <h5 className="font-bold text-white text-xs uppercase tracking-wider mb-4">
              Departamentos
            </h5>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/catalog?category=Tecnología %26 Gadgets" className="text-slate-400 hover:text-orange-400 transition-colors">
                  Tecnología & Gadgets
                </Link>
              </li>
              <li>
                <Link to="/catalog?category=Moda %26 Sneakers" className="text-slate-400 hover:text-orange-400 transition-colors">
                  Moda & Sneakers
                </Link>
              </li>
              <li>
                <Link to="/catalog?category=Relojes %26 Accesorios" className="text-slate-400 hover:text-orange-400 transition-colors">
                  Relojes & Accesorios
                </Link>
              </li>
              <li>
                <Link to="/catalog?category=Hogar %26 Estilo de Vida" className="text-slate-400 hover:text-orange-400 transition-colors">
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
            <h5 className="font-bold text-white text-xs uppercase tracking-wider mb-4">
              Atención a Clientes
            </h5>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/tracking" className="text-slate-400 hover:text-orange-400 transition-colors flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">local_shipping</span>
                  <span>Rastrear mi pedido</span>
                </Link>
              </li>
              <li>
                <Link to="/shipping" className="text-slate-400 hover:text-orange-400 transition-colors">
                  Políticas de Envío
                </Link>
              </li>
              <li>
                <Link to="/shipping" className="text-slate-400 hover:text-orange-400 transition-colors">
                  Garantía y Devoluciones
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-slate-400 hover:text-orange-400 transition-colors">
                  Preguntas Frecuentes
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-slate-400 hover:text-orange-400 transition-colors">
                  Aviso de Privacidad
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna Métodos de Pago & Contacto */}
          <div>
            <h5 className="font-bold text-white text-xs uppercase tracking-wider mb-4">
              Pagos & B2B
            </h5>
            <div className="space-y-3 text-xs text-slate-400">
              <p>Aceptamos todas las tarjetas de crédito, débito, transferencias y pagos en efectivo:</p>
              
              <div className="flex flex-wrap gap-2 text-[10px] font-bold">
                <span className="bg-slate-800 px-2 py-1 rounded text-slate-300 border border-slate-700">Mercado Pago</span>
                <span className="bg-slate-800 px-2 py-1 rounded text-slate-300 border border-slate-700">Visa / Mastercard</span>
                <span className="bg-slate-800 px-2 py-1 rounded text-slate-300 border border-slate-700">OXXO Pay</span>
                <span className="bg-slate-800 px-2 py-1 rounded text-slate-300 border border-slate-700">SPEI</span>
              </div>

              <div className="pt-2">
                <Link
                  to="/mayoristas"
                  className="inline-flex items-center gap-1 text-orange-400 hover:text-orange-300 font-bold"
                >
                  <span>¿Eres mayorista o proveedor?</span>
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </Link>
              </div>
            </div>
          </div>

        </div>

        {/* Fila final de Copyright */}
        <div className="border-t border-slate-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} OV33 MARKETPLACE. Todos los derechos reservados.</p>
          <div className="flex items-center gap-4">
            <span>Envíos a toda la República Mexicana 🇲🇽</span>
            <span>•</span>
            <span>Plataforma Segura SSL</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
