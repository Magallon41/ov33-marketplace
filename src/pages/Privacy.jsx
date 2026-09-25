import React from 'react';
import { Link } from 'react-router-dom';
import { SEOHead } from '../components/seo/SEOHead';

export function Privacy() {
  return (
    <>
      <SEOHead
        title="Aviso de Privacidad — OV33 Marketplace"
        description="Aviso de Privacidad de OV33 Marketplace. Conoce cómo protegemos y tratamos tus datos personales conforme a la Ley Federal de Protección de Datos Personales (LFPDPPP)."
        url="/privacy"
        noIndex={false}
      />

      <main className="pt-24 md:pt-[120px] max-w-4xl mx-auto px-4 md:px-12 pb-24 min-h-screen">
        {/* Breadcrumb */}
        <nav aria-label="Ruta de navegación" className="mb-10">
          <ol className="flex items-center gap-2 font-label-caps text-[10px] tracking-widest uppercase text-neutral-400">
            <li><Link to="/" className="hover:text-[#ff5000] transition-colors">Inicio</Link></li>
            <li aria-hidden="true">/</li>
            <li><span className="text-neutral-700 font-semibold" aria-current="page">Aviso de Privacidad</span></li>
          </ol>
        </nav>

        <header className="mb-16 border-b border-neutral-200 pb-8">
          <h1 className="font-display-xl text-3xl md:text-5xl font-extrabold uppercase mb-4 text-neutral-900">
            Aviso de Privacidad
          </h1>
          <p className="font-body-lg text-neutral-500 text-sm">Última actualización: 2026</p>
        </header>

        <div className="space-y-12 text-sm text-neutral-700 leading-relaxed">

          <section aria-labelledby="responsable-titulo">
            <h2 id="responsable-titulo" className="text-xl uppercase font-bold mb-4 tracking-wide text-neutral-900">1. Responsable del Tratamiento</h2>
            <p>
              <strong>OV33 MARKETPLACE</strong> (en adelante, "OV33"), con domicilio de operaciones en México, es responsable del tratamiento de los datos personales que nos proporciones conforme a lo establecido en la <strong>Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP)</strong> y su Reglamento.
            </p>
            <p className="mt-4">Para cualquier duda o gestión referente a este Aviso de Privacidad, puedes escribirnos a: <a href="mailto:privacidad@ov33.com" className="text-[#ff5000] font-semibold underline hover:text-[#e04500]">privacidad@ov33.com</a></p>
          </section>

          <div className="border-t border-neutral-200"></div>

          <section aria-labelledby="datos-titulo">
            <h2 id="datos-titulo" className="text-xl uppercase font-bold mb-4 tracking-wide text-neutral-900">2. Datos Personales que Recabamos</h2>
            <p className="mb-4">OV33 recaba las siguientes categorías de datos personales:</p>
            <ul className="space-y-2 pl-4 list-disc" role="list">
              <li><strong>Datos de identificación:</strong> nombre completo, correo electrónico.</li>
              <li><strong>Datos de contacto:</strong> dirección física de entrega, código postal, número de teléfono o WhatsApp.</li>
              <li><strong>Datos de transacción:</strong> historial de compras, método de pago seleccionado y comprobantes de facturación (no almacenamos directamente números de tarjeta de crédito; todo el procesamiento seguro lo ejecuta Mercado Pago).</li>
              <li><strong>Datos de navegación:</strong> dirección IP, tipo de navegador, páginas visitadas y tiempos de sesión (recopilados de manera agregada mediante cookies y Firebase Analytics).</li>
            </ul>
          </section>

          <div className="border-t border-neutral-200"></div>

          <section aria-labelledby="finalidades-titulo">
            <h2 id="finalidades-titulo" className="text-xl uppercase font-bold mb-4 tracking-wide text-neutral-900">3. Finalidades del Tratamiento</h2>
            <p className="mb-4"><strong>Finalidades primarias (necesarias para el servicio):</strong></p>
            <ul className="space-y-2 pl-4 mb-6 list-disc" role="list">
              <li>Procesar, preparar y entregar tus compras multimarca en territorio nacional con Envia.com.</li>
              <li>Enviar confirmaciones de pedido, comprobantes de pago y números de seguimiento logístico.</li>
              <li>Administrar tu cuenta de usuario y tus preferencias de compra.</li>
              <li>Atender reclamos, garantías del comprador y solicitudes de devolución.</li>
            </ul>
            <p className="mb-4"><strong>Finalidades secundarias (opcionales):</strong></p>
            <ul className="space-y-2 pl-4 list-disc" role="list">
              <li>Enviarte cupones de descuento, ventas flash y promociones especiales (solo con tu consentimiento expreso).</li>
              <li>Elaborar métricas agregadas para optimizar la oferta comercial del marketplace.</li>
            </ul>
          </section>

          <div className="border-t border-neutral-200"></div>

          <section aria-labelledby="cookies-titulo">
            <h2 id="cookies-titulo" className="text-xl uppercase font-bold mb-4 tracking-wide text-neutral-900">4. Uso de Cookies</h2>
            <p>
              OV33 utiliza cookies técnicas necesarias para el funcionamiento del carrito de compras y la sesión activa, así como cookies analíticas para mejorar la navegación.
            </p>
            <p className="mt-4">Puedes deshabilitar las cookies desde las preferencias de tu navegador web sin impedir la navegación básica.</p>
          </section>

          <div className="border-t border-neutral-200"></div>

          <section aria-labelledby="derechos-titulo">
            <h2 id="derechos-titulo" className="text-xl uppercase font-bold mb-4 tracking-wide text-neutral-900">5. Derechos ARCO</h2>
            <p className="mb-6">Tienes derecho a <strong>Acceder, Rectificar, Cancelar u Oponerte</strong> al uso de tus datos personales (derechos ARCO). Para ejercer cualquiera de ellos:</p>
            <div className="bg-neutral-50 rounded-2xl border border-neutral-200 p-6">
              <p className="mb-2">Envía un mensaje a <a href="mailto:privacidad@ov33.com" className="text-[#ff5000] font-semibold underline">privacidad@ov33.com</a> con el asunto <strong>"Solicitud Derechos ARCO"</strong> detallando:</p>
              <ul className="space-y-1 text-xs pl-4 list-disc" role="list">
                <li>Nombre completo del titular y correo asociado a la cuenta en OV33.</li>
                <li>Derecho específico que deseas ejercer (Acceso, Rectificación, Cancelación u Oposición).</li>
                <li>Identificación oficial o documento que acredite la identidad.</li>
              </ul>
              <p className="mt-4 text-xs text-neutral-500">Daremos respuesta formal en un plazo máximo de <strong>20 días hábiles</strong>.</p>
            </div>
          </section>

          <div className="border-t border-neutral-200"></div>

          <section aria-labelledby="cambios-titulo">
            <h2 id="cambios-titulo" className="text-xl uppercase font-bold mb-4 tracking-wide text-neutral-900">6. Actualizaciones de este Aviso</h2>
            <p>
              OV33 se reserva el derecho de efectuar modificaciones a este Aviso de Privacidad para adecuarlo a reformas legislativas o mejoras operativas del marketplace. Cualquier cambio será publicado oportunamente en esta sección.
            </p>
          </section>
        </div>
      </main>
    </>
  );
}

export default Privacy;
