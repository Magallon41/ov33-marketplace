import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SEOHead } from '../components/seo/SEOHead';
import { db, isFirebaseEnabled } from '../utils/firebase';
import { doc, setDoc } from 'firebase/firestore';

const WHATSAPP_PHONE = import.meta.env.VITE_WHATSAPP_NUMBER || "5213300000000";

const TIERS = [
  {
    tierNumber: "01",
    name: "Emprendedor / Pequeño Comercio",
    subtitle: "Para nuevos distribuidores y tiendas de reventa",
    range: "10 a 25 piezas / unidades",
    minPieces: 10,
    discountBadge: "25% DESCUENTO",
    benefits: [
      "Márgenes estimados de ganancia: 40% a 55%",
      "Surtido multimarca libre en gadgets, moda y accesorios",
      "Guías de envío preferencial con Envia.com",
      "Facturación fiscal CFDI deducible",
      "Empaque sellado con certificación original"
    ],
    highlight: false
  },
  {
    tierNumber: "02",
    name: "Distribuidor Consolidado",
    subtitle: "El volumen preferido por retailers y comercios",
    range: "26 a 60 piezas / unidades",
    minPieces: 26,
    discountBadge: "35% DESCUENTO",
    benefits: [
      "Márgenes estimados de ganancia: 55% a 70%",
      "Envío Express Asegurado 100% GRATIS a todo México",
      "Acceso prioritario a liquidaciones y lotes Flash",
      "Asesor comercial dedicado vía WhatsApp",
      "Garantía de reposición inmediata ante mermas"
    ],
    highlight: true,
    badgeText: "MÁS POPULAR"
  },
  {
    tierNumber: "03",
    name: "Mayorista Master & Cadenas",
    subtitle: "Para distribuidores mayoristas y alto volumen",
    range: "60+ unidades / pallets",
    minPieces: 60,
    discountBadge: "45% DESCUENTO",
    benefits: [
      "Precio directo de importación y distribución matriz",
      "Ejecutivo de cuenta B2B exclusivo para tu negocio",
      "Logística coordinada de carga consolidada",
      "Línea de crédito comercial (previa evaluación)",
      "Catálogo maestro en Excel/CSV con actualización diaria"
    ],
    highlight: false
  }
];

const FAQS = [
  {
    q: "¿Cuál es el pedido mínimo para acceder a precios de mayoreo?",
    a: "El pedido mínimo es de solo 10 piezas o unidades. Puedes combinar libremente diferentes departamentos (Tecnología, Moda, Sneakers, Relojes, Hogar) y marcas de nuestro catálogo."
  },
  {
    q: "¿Cómo se realizan los envíos mayoristas y cuánto tardan?",
    a: "Trabajamos con Envia.com y las principales paqueterías (FedEx, DHL, Estafeta, RedPack y fleteras de carga consolidada). Los pedidos se despachan en 24 a 48 horas y la entrega toma entre 2 y 5 días hábiles en toda la República Mexicana."
  },
  {
    q: "¿Todos los productos son originales y cuentan con garantía?",
    a: "100% garantizado. En OV33 solo comercializamos productos originales provenientes de distribuidores autorizados y canales oficiales de cada marca. Cuentas con 30 días de garantía directa contra cualquier defecto de fábrica."
  },
  {
    q: "¿Cuáles son las formas de pago y emiten factura?",
    a: "Sí, todos los precios pueden ser facturados (CFDI de adquisición de mercancías con desglose de IVA). Aceptamos transferencia bancaria directa (SPEI) sin comisiones, tarjetas de débito/crédito y pago con Mercado Pago."
  },
  {
    q: "¿Puedo vender mis propios productos en OV33 Marketplace?",
    a: "¡Sí! Contamos con un programa para marcas y proveedores verificados. Puedes dar de alta tu stock con comisiones preferenciales y acceder a nuestra red de compradores en todo el país."
  }
];

export function Wholesale() {
  const [formData, setFormData] = useState({
    name: '',
    businessName: '',
    city: '',
    state: '',
    phone: '',
    email: '',
    estimatedPieces: '12-24',
    categories: ['Tecnología', 'Moda & Sneakers', 'Relojes & Accesorios'],
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submittedLead, setSubmittedLead] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleCategoryToggle = (cat) => {
    setFormData(prev => {
      const exists = prev.categories.includes(cat);
      if (exists) {
        if (prev.categories.length <= 1) return prev;
        return { ...prev, categories: prev.categories.filter(c => c !== cat) };
      } else {
        return { ...prev, categories: [...prev.categories, cat] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.businessName) {
      alert("Por favor completa los campos requeridos.");
      return;
    }

    try {
      setLoading(true);
      const leadId = `B2B-${Date.now().toString(36).toUpperCase()}`;
      const newLead = {
        id: leadId,
        ...formData,
        status: 'Nuevo',
        createdAt: new Date().toISOString()
      };

      if (isFirebaseEnabled && db) {
        await setDoc(doc(db, "wholesale_leads", leadId), newLead);
      }

      // Guardar también en localStorage para no depender exclusivamente de la red
      try {
        const stored = JSON.parse(localStorage.getItem('ov33_wholesale_leads') || '[]');
        localStorage.setItem('ov33_wholesale_leads', JSON.stringify([newLead, ...stored]));
      } catch (err) {
        console.warn("No se pudo cachear lead en localStorage:", err);
      }

      setSubmittedLead(newLead);
      setSuccess(true);
    } catch (error) {
      console.error("Error al registrar solicitud de mayoreo:", error);
      alert("Ocurrió un error al procesar tu solicitud. Puedes comunicarte directamente por WhatsApp.");
    } finally {
      setLoading(false);
    }
  };

  // Construir mensaje directo de WhatsApp
  const generateWhatsAppUrl = (data = formData) => {
    const cats = Array.isArray(data.categories) ? data.categories.join(', ') : 'Tecnología, Moda, Accesorios';
    const text = `Hola OV33 B2B, me interesa comprar mercancía multimarca al mayoreo para mi negocio.

*Solicitud de Cotización B2B:*
- *Nombre:* ${data.name || 'Interesado'}
- *Negocio / Comercio:* ${data.businessName || 'Comercio'}
- *Ubicación:* ${data.city ? `${data.city}, ${data.state}` : 'México'}
- *Volumen estimado:* ${data.estimatedPieces} unidades
- *Departamentos de interés:* ${cats}
${data.notes ? `- *Notas:* ${data.notes}` : ''}

¿Podrían compartirme el catálogo mayorista con precios preferenciales y condiciones de envío? Gracias.`;

    return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(text)}`;
  };

  return (
    <>
      <SEOHead 
        title="Venta a Mayoristas y Programa B2B — OV33 Marketplace"
        description="Conviértete en distribuidor de OV33. Accede a precios de mayoreo en tecnología, moda, sneakers, relojes y gadgets. Envíos asegurados a todo México con Envia.com y factura CFDI."
        url="/mayoristas"
      />

      <div className="bg-[#fcfbf9] text-neutral-900 min-h-screen pt-28 pb-20">
        
        {/* 1. Hero Section Editorial */}
        <section className="relative bg-gradient-to-br from-neutral-950 via-neutral-900 to-black text-white py-24 md:py-32 px-6 lg:px-12 overflow-hidden">
          <div className="absolute inset-0 z-0 opacity-20">
            <div className="absolute inset-0 bg-[radial-gradient(#ff5000_1px,transparent_1px)] [background-size:24px_24px]"></div>
          </div>

          <div className="relative z-10 max-w-5xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#ff5000]/40 bg-[#ff5000]/15 text-[#ff5000] text-xs font-bold tracking-wider uppercase">
              <span className="material-symbols-outlined text-[16px]">domain</span>
              Canal B2B & Distribución Multimarca Nacional
            </div>

            <h1 className="font-display-xl text-4xl md:text-6xl lg:text-7xl font-extrabold uppercase tracking-tight leading-tight text-white">
              Mayoreo & Surtido <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff5000] to-amber-400">
                para tu Tienda o Negocio
              </span>
            </h1>

            <p className="font-body-lg text-neutral-300 max-w-2xl mx-auto text-sm md:text-base font-light leading-relaxed">
              Surte las marcas más cotizadas en tecnología, moda, sneakers, gadgets y hogar con <strong className="text-white font-medium">descuentos de hasta 45%</strong>. Mínimos accesibles desde 10 piezas, facturación CFDI completa y logística express asegurada con Envia.com.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a 
                href="#cotizador" 
                className="w-full sm:w-auto bg-[#ff5000] hover:bg-[#e04500] text-white font-bold text-xs uppercase tracking-wider px-8 py-4 rounded-full transition-all shadow-lg shadow-[#ff5000]/30 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">request_quote</span>
                Cotizar Pedido de Mayoreo
              </a>
              <a 
                href={generateWhatsAppUrl()} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full sm:w-auto border border-white/30 hover:border-white text-white font-bold text-xs uppercase tracking-wider px-8 py-4 rounded-full transition-colors flex items-center justify-center gap-2 hover:bg-white/10"
              >
                <span className="material-symbols-outlined text-[18px] text-green-400">chat</span>
                Hablar con Asesor B2B
              </a>
            </div>
          </div>
        </section>

        {/* 2. Pilares de Valor para el Mayorista */}
        <section className="py-20 px-6 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-[#ff5000] block">
              Ventajas Competitivas
            </span>
            <h2 className="font-display-xl text-2xl md:text-4xl uppercase tracking-wider font-extrabold text-neutral-900">
              Por qué elegir OV33 para abastecer tu negocio
            </h2>
            <p className="text-neutral-500 font-body-md text-sm leading-relaxed">
              Elimina intermediarios y sobrecostos. Conéctate a un catálogo dinámico con marcas top mundiales y alta rotación comercial comprobada.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-8 rounded-2xl border border-neutral-200/80 shadow-xs hover:border-[#ff5000] hover:shadow-md transition-all space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#ff5000]/10 flex items-center justify-center text-[#ff5000]">
                <span className="material-symbols-outlined text-2xl">trending_up</span>
              </div>
              <h3 className="text-base uppercase tracking-wider font-bold text-neutral-900">Márgenes Atractivos</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Descuentos del 25% al 45% sobre precio de venta, permitiendo un retorno de inversión rápido y competitividad en tu plaza local.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-neutral-200/80 shadow-xs hover:border-[#ff5000] hover:shadow-md transition-all space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                <span className="material-symbols-outlined text-2xl">verified</span>
              </div>
              <h3 className="text-base uppercase tracking-wider font-bold text-neutral-900">100% Originales</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Stock original y verificado de marcas globales: Apple, Nike, Xiaomi, Sony, Stanley, Casio, JBL y más. Cero réplicas ni riesgos legales.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-neutral-200/80 shadow-xs hover:border-[#ff5000] hover:shadow-md transition-all space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                <span className="material-symbols-outlined text-2xl">local_shipping</span>
              </div>
              <h3 className="text-base uppercase tracking-wider font-bold text-neutral-900">Logística Envia.com</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Envíos asegurados a toda la República Mexicana. Cajas reforzadas, rastreo en vivo y opciones de flete consolidado para pedidos masivos.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-neutral-200/80 shadow-xs hover:border-[#ff5000] hover:shadow-md transition-all space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                <span className="material-symbols-outlined text-2xl">tune</span>
              </div>
              <h3 className="text-base uppercase tracking-wider font-bold text-neutral-900">Surtido Flexible</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Sin cajas ciegas ni pedidos forzados. Puedes armar tu lote eligiendo los modelos, gadgets, tallas y accesorios que tus clientes demandan.
              </p>
            </div>
          </div>
        </section>

        {/* 3. Escala de Precios y Niveles de Mayoreo (Tiers) */}
        <section className="py-20 bg-neutral-900 text-white px-6">
          <div className="max-w-7xl mx-auto space-y-16">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-[#ff5000] block">
                Escala de Mayoreo
              </span>
              <h2 className="font-display-xl text-3xl md:text-5xl uppercase tracking-wider text-white font-extrabold">
                Niveles para cada etapa comercial
              </h2>
              <p className="text-neutral-400 font-body-md text-sm leading-relaxed">
                Precios transparentes y sin letras pequeñas. Desbloquea mayores beneficios conforme aumenta tu volumen de compra.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
              {TIERS.map((tier) => (
                <div 
                  key={tier.tierNumber}
                  className={`relative flex flex-col justify-between p-8 md:p-10 rounded-2xl border transition-all ${
                    tier.highlight 
                      ? 'bg-neutral-950 border-[#ff5000] shadow-2xl scale-[1.02] z-10' 
                      : 'bg-black/40 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  {tier.badgeText && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#ff5000] text-white text-[10px] font-bold tracking-widest uppercase py-1 px-4 rounded-full shadow-md">
                      {tier.badgeText}
                    </div>
                  )}

                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-xs tracking-widest text-[#ff5000] font-bold uppercase">NIVEL {tier.tierNumber}</span>
                      <span className="bg-white/10 text-white text-[10px] font-semibold tracking-wider uppercase px-3 py-1 rounded-full border border-white/10">
                        {tier.range}
                      </span>
                    </div>

                    <h3 className="font-display-xl text-2xl uppercase tracking-wide mb-2 text-white font-bold">{tier.name}</h3>
                    <p className="text-neutral-400 text-xs mb-6">{tier.subtitle}</p>

                    <div className="py-4 px-5 bg-white/5 border border-white/10 rounded-xl mb-8 text-center">
                      <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold block mb-1">Beneficio de Margen</span>
                      <span className="font-display-xl text-3xl text-[#ff5000] font-extrabold">{tier.discountBadge}</span>
                    </div>

                    <ul className="space-y-3 mb-8">
                      {tier.benefits.map((benefit, i) => (
                        <li key={i} className="flex items-start gap-3 text-xs text-neutral-300">
                          <span className="material-symbols-outlined text-[16px] text-[#ff5000] shrink-0 mt-0.5">check_circle</span>
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <a 
                    href="#cotizador" 
                    onClick={() => {
                      const sel = tier.tierNumber === '01' ? '12-24' : tier.tierNumber === '02' ? '25-49' : '50-100';
                      setFormData(prev => ({ ...prev, estimatedPieces: sel }));
                    }}
                    className={`w-full py-3.5 text-center font-bold text-xs uppercase tracking-wider rounded-xl transition-all block ${
                      tier.highlight 
                        ? 'bg-[#ff5000] text-white hover:bg-[#e04500] shadow-lg shadow-[#ff5000]/30' 
                        : 'border border-neutral-700 text-white hover:border-white'
                    }`}
                  >
                    Seleccionar Nivel {tier.tierNumber}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. Cotizador Interactivo & Formulario de Solicitud */}
        <section id="cotizador" className="py-24 px-6 max-w-5xl mx-auto">
          <div className="bg-white rounded-3xl border border-neutral-200/90 shadow-xl p-8 md:p-14">
            <div className="max-w-3xl mx-auto">
              
              {!success ? (
                <>
                  <div className="text-center space-y-3 mb-12">
                    <span className="text-xs font-bold tracking-widest uppercase text-[#ff5000] block">
                      Solicitud Oficial
                    </span>
                    <h2 className="font-display-xl text-2xl md:text-4xl uppercase tracking-wider font-extrabold text-neutral-900">
                      Cotizador de Mayoreo y Distribución
                    </h2>
                    <p className="text-neutral-500 font-body-md text-xs md:text-sm leading-relaxed">
                      Completa los detalles de tu comercio. Un asesor comercial de OV33 te contactará en menos de 24 horas con el catálogo en alta resolución y la lista de precios mayorista.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Nombre completo */}
                      <div>
                        <label className="block text-[11px] uppercase tracking-wider text-neutral-700 mb-2 font-bold">
                          Nombre y Apellidos *
                        </label>
                        <input 
                          type="text" 
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Ej. Carlos Mendoza"
                          className="w-full bg-[#f9f9f9] border border-neutral-300 rounded-xl px-4 py-3.5 text-sm text-neutral-900 focus:bg-white focus:outline-none focus:border-[#ff5000] transition-colors"
                        />
                      </div>

                      {/* Nombre del Negocio */}
                      <div>
                        <label className="block text-[11px] uppercase tracking-wider text-neutral-700 mb-2 font-bold">
                          Nombre de tu Tienda o Comercio *
                        </label>
                        <input 
                          type="text" 
                          required
                          value={formData.businessName}
                          onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                          placeholder="Ej. TechStore México / Ropa & Sneakers"
                          className="w-full bg-[#f9f9f9] border border-neutral-300 rounded-xl px-4 py-3.5 text-sm text-neutral-900 focus:bg-white focus:outline-none focus:border-[#ff5000] transition-colors"
                        />
                      </div>

                      {/* Teléfono / WhatsApp */}
                      <div>
                        <label className="block text-[11px] uppercase tracking-wider text-neutral-700 mb-2 font-bold">
                          WhatsApp / Teléfono de Contacto *
                        </label>
                        <input 
                          type="tel" 
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="Ej. 33 1234 5678"
                          className="w-full bg-[#f9f9f9] border border-neutral-300 rounded-xl px-4 py-3.5 text-sm text-neutral-900 focus:bg-white focus:outline-none focus:border-[#ff5000] transition-colors"
                        />
                      </div>

                      {/* Correo electrónico */}
                      <div>
                        <label className="block text-[11px] uppercase tracking-wider text-neutral-700 mb-2 font-bold">
                          Correo Electrónico
                        </label>
                        <input 
                          type="email" 
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="contacto@tunegocio.com"
                          className="w-full bg-[#f9f9f9] border border-neutral-300 rounded-xl px-4 py-3.5 text-sm text-neutral-900 focus:bg-white focus:outline-none focus:border-[#ff5000] transition-colors"
                        />
                      </div>

                      {/* Ciudad */}
                      <div>
                        <label className="block text-[11px] uppercase tracking-wider text-neutral-700 mb-2 font-bold">
                          Ciudad
                        </label>
                        <input 
                          type="text" 
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          placeholder="Ej. Guadalajara, Monterrey, CDMX..."
                          className="w-full bg-[#f9f9f9] border border-neutral-300 rounded-xl px-4 py-3.5 text-sm text-neutral-900 focus:bg-white focus:outline-none focus:border-[#ff5000] transition-colors"
                        />
                      </div>

                      {/* Estado */}
                      <div>
                        <label className="block text-[11px] uppercase tracking-wider text-neutral-700 mb-2 font-bold">
                          Estado
                        </label>
                        <input 
                          type="text" 
                          value={formData.state}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                          placeholder="Ej. Jalisco, Nuevo León, CDMX..."
                          className="w-full bg-[#f9f9f9] border border-neutral-300 rounded-xl px-4 py-3.5 text-sm text-neutral-900 focus:bg-white focus:outline-none focus:border-[#ff5000] transition-colors"
                        />
                      </div>
                    </div>

                    {/* Volumen estimado */}
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-neutral-700 mb-3 font-bold">
                        Volumen Inicial Estimado de Compra
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                          { id: '12-24', label: '10 - 25 Piezas', sub: 'Emprendedor' },
                          { id: '25-49', label: '26 - 60 Piezas', sub: 'Distribuidor' },
                          { id: '50-100', label: '60 - 150 Piezas', sub: 'Mayorista' },
                          { id: '100+', label: '+150 Piezas', sub: 'Pallet / Gran Escala' }
                        ].map(opt => (
                          <button
                            type="button"
                            key={opt.id}
                            onClick={() => setFormData({ ...formData, estimatedPieces: opt.id })}
                            className={`p-3.5 text-left rounded-xl border transition-all ${
                              formData.estimatedPieces === opt.id 
                                ? 'border-[#ff5000] bg-[#ff5000]/10 text-neutral-900 font-bold' 
                                : 'border-neutral-200 bg-[#fafafa] hover:border-neutral-400 text-neutral-800'
                            }`}
                          >
                            <span className="block text-xs font-bold">{opt.label}</span>
                            <span className={`text-[10px] block ${formData.estimatedPieces === opt.id ? 'text-[#ff5000]' : 'text-neutral-500'}`}>{opt.sub}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Categorías de interés */}
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-neutral-700 mb-3 font-bold">
                        Departamentos de Interés (Selecciona los que apliquen)
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {['Tecnología & Gadgets', 'Moda & Sneakers', 'Relojes & Accesorios', 'Hogar & Hidratación'].map(cat => {
                          const isSelected = formData.categories.includes(cat);
                          return (
                            <button
                              type="button"
                              key={cat}
                              onClick={() => handleCategoryToggle(cat)}
                              className={`p-3 text-center rounded-xl border flex items-center justify-center gap-2 text-xs uppercase tracking-wider transition-all ${
                                isSelected 
                                  ? 'border-[#ff5000] bg-[#ff5000]/10 text-[#ff5000] font-bold' 
                                  : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[16px]">
                                {isSelected ? 'check_box' : 'check_box_outline_blank'}
                              </span>
                              {cat}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Comentarios o preguntas */}
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-neutral-700 mb-2 font-bold">
                        Comentarios adicionales o marcas de interés específico
                      </label>
                      <textarea 
                        rows={3}
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Ej. Me interesan marcas como Xiaomi, Apple o Stanley; requiero factura CFDI y entrega en Monterrey..."
                        className="w-full bg-[#f9f9f9] border border-neutral-300 rounded-xl px-4 py-3.5 text-sm text-neutral-900 focus:bg-white focus:outline-none focus:border-[#ff5000] transition-colors"
                      />
                    </div>

                    {/* Botón de Enviar */}
                    <div className="pt-2 flex flex-col sm:flex-row items-center gap-4">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full sm:flex-1 bg-[#ff5000] hover:bg-[#e04500] text-white font-bold text-xs uppercase tracking-wider py-4 rounded-xl transition-all shadow-lg shadow-[#ff5000]/25 flex items-center justify-center gap-3 disabled:opacity-50"
                      >
                        {loading ? (
                          <>
                            <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                            Procesando solicitud...
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-[18px]">send</span>
                            Enviar Solicitud de Mayoreo
                          </>
                        )}
                      </button>

                      <a
                        href={generateWhatsAppUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto border border-neutral-300 hover:border-green-600 text-neutral-800 hover:text-green-700 font-bold text-xs uppercase tracking-wider py-4 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[18px] text-green-600">chat</span>
                        Cotizar por WhatsApp
                      </a>
                    </div>
                  </form>
                </>
              ) : (
                /* Estado de Éxito */
                <div className="text-center py-12 space-y-6 animate-[fadeIn_0.4s_ease]">
                  <div className="w-16 h-16 bg-green-100 text-green-700 mx-auto flex items-center justify-center rounded-full">
                    <span className="material-symbols-outlined text-[32px]">verified</span>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-bold tracking-widest uppercase text-emerald-600 block">
                      Solicitud Recibida con Éxito
                    </span>
                    <h3 className="font-display-xl text-3xl uppercase tracking-wider font-extrabold text-neutral-900">
                      ¡Gracias, {submittedLead?.name}!
                    </h3>
                    <p className="text-neutral-600 font-body-md text-sm max-w-lg mx-auto leading-relaxed">
                      Hemos registrado la solicitud para tu comercio <strong className="text-black">{submittedLead?.businessName}</strong>. 
                      Tu folio de seguimiento B2B es: <span className="font-mono font-bold text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">{submittedLead?.id}</span>.
                    </p>
                  </div>

                  <div className="bg-neutral-50 rounded-2xl border border-neutral-200 p-6 max-w-md mx-auto text-left text-xs space-y-2">
                    <p><strong className="text-neutral-900">Volumen solicitado:</strong> {submittedLead?.estimatedPieces} unidades</p>
                    <p><strong className="text-neutral-900">Departamentos:</strong> {submittedLead?.categories.join(', ')}</p>
                    <p><strong className="text-neutral-900">Ciudad de entrega:</strong> {submittedLead?.city || 'México'}</p>
                  </div>

                  <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                    <a 
                      href={generateWhatsAppUrl(submittedLead)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-bold text-xs uppercase tracking-wider px-8 py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md"
                    >
                      <span className="material-symbols-outlined text-[20px]">chat</span>
                      Abrir WhatsApp con Asesor Ahora
                    </a>

                    <button
                      onClick={() => {
                        setSuccess(false);
                        setSubmittedLead(null);
                        setFormData({
                          name: '',
                          businessName: '',
                          city: '',
                          state: '',
                          phone: '',
                          email: '',
                          estimatedPieces: '12-24',
                          categories: ['Tecnología & Gadgets', 'Moda & Sneakers'],
                          notes: ''
                        });
                      }}
                      className="w-full sm:w-auto border border-neutral-300 text-neutral-700 hover:text-black hover:border-black font-bold text-xs uppercase tracking-wider px-6 py-4 rounded-xl transition-colors"
                    >
                      Enviar otra solicitud
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </section>

        {/* 5. Preguntas Frecuentes de Mayoristas */}
        <section className="py-20 px-6 max-w-4xl mx-auto border-t border-neutral-200">
          <div className="text-center space-y-3 mb-12">
            <span className="text-xs font-bold tracking-widest uppercase text-[#ff5000] block">
              Resolución de Dudas
            </span>
            <h2 className="font-display-xl text-2xl md:text-3xl uppercase tracking-wider font-extrabold text-neutral-900">
              Preguntas Frecuentes sobre Mayoreo
            </h2>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div 
                  key={index}
                  className="border border-neutral-200 bg-white rounded-xl overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full py-5 px-6 flex justify-between items-center text-left gap-4 text-xs uppercase tracking-wider text-neutral-900 font-bold hover:text-[#ff5000] transition-colors"
                  >
                    <span>{faq.q}</span>
                    <span className="material-symbols-outlined text-[20px] shrink-0 text-neutral-400">
                      {isOpen ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-6 pt-1 text-xs text-neutral-600 font-body-md leading-relaxed border-t border-neutral-100 animate-[fadeIn_0.2s_ease]">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

      </div>
    </>
  );
}

export default Wholesale;
