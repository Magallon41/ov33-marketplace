import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useProducts } from '../../context/ProductContext';

export function Navbar() {
  const { totalItems, setIsOpen, subtotal } = useCart();
  const { currentUser, logout } = useAuth();
  const { isUsingFallback, categoryTree = [], brands = [] } = useProducts();
  const navigate = useNavigate();

  const [showDropdown, setShowDropdown] = useState(false);
  const [showCategoriesMenu, setShowCategoriesMenu] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSearchCat, setSelectedSearchCat] = useState('TODAS');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (selectedSearchCat !== 'TODAS') params.set('category', selectedSearchCat);
    navigate(`/catalog?${params.toString()}`);
  };

  const handleQuickTagClick = (tag) => {
    setSearchQuery(tag);
    navigate(`/catalog?q=${encodeURIComponent(tag)}`);
  };

  const handleAccountClick = () => {
    if (currentUser) {
      setShowDropdown(!showDropdown);
    } else {
      navigate('/auth');
    }
  };

  const handleLogoutClick = () => {
    logout();
    setShowDropdown(false);
    navigate('/');
  };

  const adminBannerActive = currentUser && currentUser.role === 'admin';
  const fallbackBannerActive = isUsingFallback && adminBannerActive;

  let headerTopClass = 'top-0';
  if (adminBannerActive && fallbackBannerActive) {
    headerTopClass = 'top-16';
  } else if (adminBannerActive || fallbackBannerActive) {
    headerTopClass = 'top-8';
  }

  const trendingTags = ['AirPods Pro', 'Nike Air Max', 'Stanley 40oz', 'Casio Gold', 'Xiaomi Band', 'Levi\'s 501'];

  return (
    <>
      {/* Admin Mode Top Banner */}
      {adminBannerActive && (
        <div className="bg-amber-600 text-white text-[11px] font-bold py-1.5 text-center fixed w-full top-0 z-[60] flex items-center justify-center gap-3 shadow-sm select-none h-8">
          <span className="material-symbols-outlined text-[15px]">admin_panel_settings</span>
          <span>MODO ADMINISTRADOR OV33 ACTIVO</span>
          <Link to="/admin" className="underline font-black hover:text-amber-100 transition-colors">
            PANEL DE CONTROL
          </Link>
        </div>
      )}

      {/* Local Fallback Warning Top Banner */}
      {fallbackBannerActive && (
        <div className={`bg-red-700 text-white text-[11px] font-bold py-1.5 text-center fixed w-full z-[60] flex items-center justify-center gap-2 shadow-sm select-none h-8 ${
          adminBannerActive ? 'top-8' : 'top-0'
        }`}>
          <span className="material-symbols-outlined text-[15px] animate-pulse">cloud_off</span>
          <span>BASE DE DATOS EN MODO LOCAL (OFFLINE)</span>
        </div>
      )}

      <header className={`bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 fixed w-full z-50 border-b border-slate-200 dark:border-slate-800 shadow-xs transition-all duration-300 ${headerTopClass}`}>
        
        {/* Barra superior de anuncios y beneficios (Marketplace Top Bar) */}
        <div className="bg-slate-950 text-slate-300 text-[11px] py-1.5 px-4 md:px-8 border-b border-slate-800">
          <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-1">
            <div className="flex items-center gap-2 font-medium">
              <span className="bg-orange-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-wide">
                GRATIS
              </span>
              <span>¡Envío GRATIS a todo México en compras mayores a $499 MXN!</span>
              <span className="hidden md:inline text-slate-500">•</span>
              <span className="hidden md:inline text-amber-400 font-semibold">Cupón nuevo usuario: OV33BIENVENIDO</span>
            </div>

            <div className="hidden sm:flex items-center gap-4 text-slate-400">
              <Link to="/tracking" className="hover:text-white flex items-center gap-1 transition-colors">
                <span className="material-symbols-outlined text-[14px]">local_shipping</span>
                <span>Rastrear Pedido</span>
              </Link>
              <Link to="/about" className="hover:text-white flex items-center gap-1 transition-colors">
                <span className="material-symbols-outlined text-[14px]">help_outline</span>
                <span>Centro de Ayuda</span>
              </Link>
              <div className="flex items-center gap-1 text-slate-300 font-semibold">
                <span>🇲🇽</span>
                <span>MXN ($)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Fila principal del Header (Logo + Buscador + Acciones) */}
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-3 flex items-center justify-between gap-4 lg:gap-8">
          
          {/* Mobile Menu Button & Logo */}
          <div className="flex items-center gap-3">
            <button 
              className="lg:hidden p-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              onClick={() => setIsMenuOpen(true)}
              aria-label="Abrir menú"
            >
              <span className="material-symbols-outlined text-[26px]">menu</span>
            </button>

            <Link to="/" className="flex items-center gap-2 group">
              <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black text-xl md:text-2xl px-2.5 py-1 rounded-xl shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
                OV33
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-base md:text-lg font-black tracking-tight text-slate-900 dark:text-white">
                  MARKET
                </span>
                <span className="text-[9px] font-bold text-orange-600 dark:text-orange-400 tracking-wider uppercase">
                  Multimarca Oficial
                </span>
              </div>
            </Link>
          </div>

          {/* Mega Barra de Búsqueda estilo TEMU / AliExpress (Desktop & Tablet) */}
          <div className="hidden sm:flex flex-1 max-w-2xl mx-auto flex-col">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full">
              <div className="flex items-center w-full bg-slate-100 dark:bg-slate-800 rounded-full border-2 border-orange-500/80 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 shadow-xs overflow-hidden transition-all">
                
                {/* Selector de Categoría integrado */}
                <select
                  value={selectedSearchCat}
                  onChange={(e) => setSelectedSearchCat(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-600 dark:text-slate-300 py-2.5 pl-3.5 pr-2 outline-none border-r border-slate-200 dark:border-slate-700 cursor-pointer hidden md:block"
                >
                  <option value="TODAS">Todas las categorías</option>
                  {categoryTree.map((cat) => (
                    <option key={cat.id || cat.name} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>

                {/* Input de búsqueda */}
                <input
                  type="text"
                  placeholder="Busca por marca (Nike, Apple, Casio...), modelo o producto..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 py-2.5 px-4 text-xs md:text-sm bg-transparent outline-none text-slate-900 dark:text-white placeholder-slate-400 font-medium"
                />

                {/* Botón buscar */}
                <button
                  type="submit"
                  className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-5 py-2.5 flex items-center justify-center font-bold text-xs gap-1.5 transition-all cursor-pointer active:scale-95"
                >
                  <span className="material-symbols-outlined text-[18px]">search</span>
                  <span className="hidden lg:inline">Buscar</span>
                </button>
              </div>
            </form>

            {/* Trending Tags debajo de la barra */}
            <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 overflow-hidden whitespace-nowrap">
              <span className="font-semibold text-slate-400 dark:text-slate-500">Tendencias:</span>
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                {trendingTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleQuickTagClick(tag)}
                    className="hover:text-orange-500 dark:hover:text-orange-400 transition-colors cursor-pointer"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Acciones del Usuario (Cuenta, Favoritos, Carrito) */}
          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* Rastrear rápido (Desktop) */}
            <Link
              to="/tracking"
              className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold transition-colors"
            >
              <span className="material-symbols-outlined text-[20px] text-orange-500">local_shipping</span>
              <span>Rastreo</span>
            </Link>

            {/* Favoritos */}
            <Link
              to="/catalog"
              aria-label="Mis Favoritos"
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors hidden sm:flex items-center justify-center"
              title="Favoritos"
            >
              <span className="material-symbols-outlined text-[22px]">favorite_border</span>
            </Link>

            {/* Cuenta / Iniciar Sesión */}
            <div className="relative">
              <button
                onClick={handleAccountClick}
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-slate-700 dark:text-slate-200"
                aria-label="Mi Cuenta"
              >
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold text-xs relative">
                  <span className="material-symbols-outlined text-[20px]">person</span>
                  {currentUser && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
                  )}
                </div>
                <div className="hidden lg:flex flex-col text-left leading-tight">
                  <span className="text-[10px] text-slate-400 font-medium">
                    {currentUser ? 'Hola,' : 'Bienvenido'}
                  </span>
                  <span className="text-xs font-bold truncate max-w-[100px]">
                    {currentUser ? currentUser.name.split(' ')[0] : 'Mi Cuenta'}
                  </span>
                </div>
              </button>

              {/* Popover Menú de Cuenta */}
              {showDropdown && currentUser && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setShowDropdown(false)} />
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-30 animate-in fade-in zoom-in-95">
                    <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-700">
                      <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{currentUser.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{currentUser.email}</p>
                    </div>
                    <Link
                      to="/account"
                      onClick={() => setShowDropdown(false)}
                      className="px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-2.5 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px] text-orange-500">account_circle</span>
                      Mi Perfil y Pedidos
                    </Link>
                    <Link
                      to="/tracking"
                      onClick={() => setShowDropdown(false)}
                      className="px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-2.5 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px] text-blue-500">local_shipping</span>
                      Rastrear Envío
                    </Link>
                    {currentUser.role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setShowDropdown(false)}
                        className="px-4 py-2 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center gap-2.5 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
                        Panel de Administración
                      </Link>
                    )}
                    <button
                      onClick={handleLogoutClick}
                      className="w-full text-left px-4 py-2 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2.5 border-t border-slate-100 dark:border-slate-700 mt-1 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">logout</span>
                      Cerrar Sesión
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Carrito de Compras (Botón destacado estilo marketplace) */}
            <button
              onClick={() => setIsOpen(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white px-3 sm:px-4 py-2 rounded-full font-bold text-xs flex items-center gap-2 shadow-md shadow-orange-500/20 active:scale-95 transition-all cursor-pointer"
              aria-label="Abrir Carrito"
            >
              <div className="relative flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">shopping_cart</span>
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-slate-950 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white">
                    {totalItems}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline">Carrito</span>
            </button>
          </div>
        </div>

        {/* Barra de Búsqueda Móvil (visible solo en pantallas pequeñas) */}
        <div className="sm:hidden px-4 pb-2.5">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full">
            <input
              type="text"
              placeholder="Buscar marcas, productos, ofertas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-2 pl-4 pr-10 text-xs bg-slate-100 dark:bg-slate-800 rounded-full border border-orange-500/50 outline-none text-slate-900 dark:text-white"
            />
            <button
              type="submit"
              className="absolute right-1 w-7 h-7 bg-orange-500 text-white rounded-full flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-[16px]">search</span>
            </button>
          </form>
        </div>

        {/* Cinta de Categorías y Ofertas (Ribbon Marketplace) */}
        <nav className="border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold">
          <div className="max-w-[1440px] mx-auto px-4 md:px-8 flex items-center justify-between overflow-x-auto no-scrollbar py-2">
            
            <div className="flex items-center gap-1 md:gap-3 flex-nowrap">
              {/* Botón de Todas las Categorías */}
              <div className="relative">
                <button
                  onClick={() => setShowCategoriesMenu(!showCategoriesMenu)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-bold transition-colors cursor-pointer whitespace-nowrap"
                >
                  <span className="material-symbols-outlined text-[18px] text-orange-500">grid_view</span>
                  <span>Todas las Categorías</span>
                  <span className="material-symbols-outlined text-[14px]">expand_more</span>
                </button>

                {/* Dropdown de Categorías */}
                {showCategoriesMenu && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setShowCategoriesMenu(false)} />
                    <div className="absolute left-0 mt-2 w-72 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 py-3 z-30">
                      <p className="px-4 pb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700">
                        Departamentos OV33
                      </p>
                      <div className="max-h-96 overflow-y-auto py-1">
                        {categoryTree.map((cat) => (
                          <Link
                            key={cat.id || cat.name}
                            to={`/catalog?category=${encodeURIComponent(cat.name)}`}
                            onClick={() => setShowCategoriesMenu(false)}
                            className="flex items-center justify-between px-4 py-2.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-orange-50 dark:hover:bg-slate-700 hover:text-orange-600 transition-colors"
                          >
                            <span className="font-semibold">{cat.name}</span>
                            <span className="text-[10px] text-slate-400">
                              {(cat.subcategories || []).length} subs
                            </span>
                          </Link>
                        ))}
                      </div>
                      <div className="px-4 pt-2 border-t border-slate-100 dark:border-slate-700">
                        <Link
                          to="/catalog"
                          onClick={() => setShowCategoriesMenu(false)}
                          className="block text-center text-xs font-bold text-orange-600 hover:underline py-1"
                        >
                          Ver Todo el Catálogo →
                        </Link>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Ofertas Flash */}
              <NavLink
                to="/ofertas"
                className={({ isActive }) =>
                  `flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? 'text-red-600 bg-red-50 dark:bg-red-950/60'
                      : 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40'
                  }`
                }
              >
                <span className="text-base animate-pulse">🔥</span>
                <span>Ofertas Flash</span>
                <span className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase ml-1">
                  HOT
                </span>
              </NavLink>

              {/* Marcas Oficiales */}
              <NavLink
                to="/catalog?filter=brands"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:text-orange-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-[16px] text-blue-500">verified</span>
                <span>Marcas Oficiales</span>
              </NavLink>

              {/* Enlaces a Categorías Principales */}
              {categoryTree.slice(0, 4).map((cat) => (
                <NavLink
                  key={cat.id || cat.name}
                  to={`/catalog?category=${encodeURIComponent(cat.name)}`}
                  className={({ isActive }) =>
                    `px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                      isActive
                        ? 'text-orange-600 font-bold bg-orange-50 dark:bg-orange-950/40'
                        : 'text-slate-600 dark:text-slate-300 hover:text-orange-600 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`
                  }
                >
                  {cat.name}
                </NavLink>
              ))}

              <NavLink
                to="/catalog?sort=sales"
                className="hidden xl:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-orange-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
              >
                <span>⭐ Lo Más Vendido</span>
              </NavLink>
            </div>

            {/* Cupón rápido derecho */}
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-orange-600 font-bold bg-orange-50 dark:bg-orange-950/50 px-3 py-1 rounded-full border border-orange-200 dark:border-orange-800 whitespace-nowrap">
              <span>🎟️</span>
              <span>10% OFF EXTRA con código:</span>
              <span className="font-mono bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-orange-300 text-orange-700 font-black">
                OV33NEW
              </span>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile Navigation Drawer */}
      {isMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-[70] lg:hidden"
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="fixed top-0 left-0 h-full w-full max-w-[320px] bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 z-[80] shadow-2xl p-5 flex flex-col justify-between overflow-y-auto lg:hidden">
            <div>
              {/* Header del Drawer */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <span className="bg-orange-500 text-white font-black text-xl px-2 py-0.5 rounded-lg">
                    OV33
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">MARKET</span>
                </div>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-1 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {/* Enlaces Principales */}
              <div className="space-y-1 mb-6">
                <NavLink
                  to="/"
                  end
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-bold text-slate-900 dark:text-white hover:bg-orange-50 dark:hover:bg-slate-800"
                >
                  <span className="material-symbols-outlined text-[20px] text-orange-500">home</span>
                  <span>Inicio</span>
                </NavLink>

                <NavLink
                  to="/ofertas"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[20px]">local_fire_department</span>
                    <span>Ofertas Relámpago</span>
                  </div>
                  <span className="bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                    HOT
                  </span>
                </NavLink>

                <NavLink
                  to="/catalog"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-bold text-slate-900 dark:text-white hover:bg-orange-50 dark:hover:bg-slate-800"
                >
                  <span className="material-symbols-outlined text-[20px] text-orange-500">storefront</span>
                  <span>Catálogo Completo</span>
                </NavLink>

                <NavLink
                  to="/tracking"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-bold text-slate-900 dark:text-white hover:bg-orange-50 dark:hover:bg-slate-800"
                >
                  <span className="material-symbols-outlined text-[20px] text-blue-500">local_shipping</span>
                  <span>Rastreo de Envíos</span>
                </NavLink>
              </div>

              {/* Categorías en Móvil */}
              <div className="border-t border-slate-200 dark:border-slate-800 pt-4 mb-4">
                <p className="px-3 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                  Departamentos
                </p>
                <div className="space-y-1">
                  {categoryTree.map((cat) => (
                    <NavLink
                      key={cat.id || cat.name}
                      to={`/catalog?category=${encodeURIComponent(cat.name)}`}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <span>{cat.name}</span>
                      <span className="material-symbols-outlined text-[16px] text-slate-400">chevron_right</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            </div>

            {/* Perfil en Drawer */}
            <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
              {currentUser ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3 px-2">
                    <div className="w-9 h-9 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                      {currentUser.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold truncate">{currentUser.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{currentUser.email}</p>
                    </div>
                  </div>
                  <Link
                    to="/account"
                    onClick={() => setIsMenuOpen(false)}
                    className="block w-full py-2 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white text-center rounded-xl text-xs font-bold"
                  >
                    Mi Cuenta
                  </Link>
                  <button
                    onClick={() => { handleLogoutClick(); setIsMenuOpen(false); }}
                    className="block w-full py-2 text-red-600 text-center rounded-xl text-xs font-bold hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              ) : (
                <Link
                  to="/auth"
                  onClick={() => setIsMenuOpen(false)}
                  className="block w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-center rounded-xl text-xs font-bold shadow-md shadow-orange-500/20"
                >
                  Iniciar Sesión / Registrarse
                </Link>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
