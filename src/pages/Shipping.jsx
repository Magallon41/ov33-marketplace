import React from 'react';
import { Link } from 'react-router-dom';
import { SEOHead } from '../components/seo/SEOHead';

export function Shipping() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': [
      {
        '@type': 'Question',
        'name': '¿Cuánto tarda el envío?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'El envío estándar tarda de 2 a 5 días hábiles a nivel nacional. Para envíos prioritarios o en zonas metropolitanas suele entregarse en 1 a 2 días hábiles.',
        },
      },
      {
        '@type': 'Question',
        'name': '¿El envío es gratuito?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Sí, el envío es 100% gratuito en todos los pedidos mayores a $499 MXN a cualquier parte de México. En compras menores, la tarifa plana es de solo $99 MXN.',
        },
      },
      {
        '@type': 'Question',
        'name': '¿Qué garantía tengo y cómo funcionan las devoluciones?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Cuentas con la Garantía del Comprador OV33: 30 días naturales desde la entrega para solicitar cambio o devolución sin costo si el artículo presenta fallas, no coincide con la descripción o no cumple tus expectativas.',
        },
      },
      {
        '@type': 'Question',
        'name': '¿A qué estados de México hacen envíos?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Hacemos envíos a los 32 estados de la República Mexicana mediante nuestra integración logística con Envia.com (FedEx, DHL, Estafeta y RedPack).',
        },
      },
    ],
  };

  return (
    <>
      <SEOHead
        title="Política de Envíos y Devoluciones — OV33 Marketplace"
        description="Envíos gratis en pedidos mayores a $499 MXN a todo México con Envia.com. Entregas en 2 a 5 días hábiles y 30 días de Garantía del Comprador con devolución protegida."
        url="/shipping"
        schema={[faqSchema]}
      />

      <main className="pt-24 md:pt-[120px] max-w-4xl mx-auto px-4 md:px-12 pb-24 min-h-screen">
        {/* Breadcrumb */}
        <nav aria-label="Ruta de navegación" className="mb-10">
          <ol className="flex items-center gap-2 font-label-caps text-[10px] tracking-widest uppercase text-neutral-400">
            <li><Link to="/" className="hover:text-[#ff5000] transition-colors">Inicio</Link></li>
            <li aria-hidden="true">/</li>
            <li><span className="text-neutral-700 font-semibold" aria-current="page">Envíos y Devoluciones</span></li>
          </ol>
        </nav>

        <header className="mb-14 border-b border-neutral-200 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold uppercase tracking-wider mb-4">
            <span className="material-symbols-outlined text-sm">local_shipping</span>
            Envíos Nacionales con Envia.com
          </div>
          <h1 className="font-display-xl text-3xl md:text-5xl font-extrabold uppercase tracking-tight text-neutral-900 mb-3">
            Envíos y Garantía del Comprador
          </h1>
          <p className="font-body-lg text-neutral-500 text-sm">Última actualización: 2026</p>
        </header>

        {/* Envíos */}
        <section className="mb-16" aria-labelledby="envios-titulo">
          <h2 id="envios-titulo" className="text-xl md:text-2xl font-bold uppercase mb-6 tracking-wide text-neutral-900">
            Política y Tarifas de Envío
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="border border-neutral-200 p-6 bg-neutral-50 rounded-2xl">
              <span className="material-symbols-outlined text-[32px] mb-3 block text-neutral-700" aria-hidden="true">local_shipping</span>
              <h3 className="text-xs uppercase tracking-wider font-bold mb-2">Envío Estándar</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                2 a 5 días hábiles<br />
                <strong className="text-neutral-900">$99 MXN</strong> (pedidos menores a $499)
              </p>
            </div>

            <div className="border-2 border-[#ff5000] p-6 bg-gradient-to-br from-[#ff5000] to-[#e04500] text-white rounded-2xl shadow-lg shadow-[#ff5000]/20">
              <span className="material-symbols-outlined text-[32px] mb-3 block text-amber-300" aria-hidden="true">bolt</span>
              <h3 className="text-xs uppercase tracking-wider font-bold mb-2">Envío GRATIS</h3>
              <p className="text-xs leading-relaxed text-white/90">
                1 a 4 días hábiles<br />
                <strong className="text-white text-sm">GRATIS en pedidos +$499 MXN</strong>
              </p>
            </div>

            <div className="border border-neutral-200 p-6 bg-neutral-50 rounded-2xl">
              <span className="material-symbols-outlined text-[32px] mb-3 block text-emerald-600" aria-hidden="true">map</span>
              <h3 className="text-xs uppercase tracking-wider font-bold mb-2">Cobertura Total</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Los 32 estados de México<br />
                Multi-paquetería con Envia.com
              </p>
            </div>
          </div>

          <div className="space-y-4 text-sm text-neutral-600 leading-relaxed">
            <p>
              Todos los pedidos son despachados en un lapso de <strong>24 a 48 horas hábiles</strong> tras la validación del pago por Mercado Pago. Los pedidos realizados en fin de semana se procesan el siguiente día hábil.
            </p>
            <p>
              Una vez despachado tu paquete, recibirás una <strong>notificación con tu guía de rastreo oficial</strong> para seguir el trayecto minuto a minuto desde nuestra sección de <Link to="/tracking" className="text-[#ff5000] font-bold underline hover:text-[#e04500]">rastreo de pedidos</Link>.
            </p>
            <p>
              Operamos con la infraestructura logística de <strong>Envia.com</strong>, coordinando despachos automatizados vía <strong>FedEx, DHL, Estafeta y RedPack</strong> con embalaje seguro y seguro de tránsito incluido.
            </p>
          </div>
        </section>

        <div className="border-t border-neutral-200 my-12"></div>

        {/* Devoluciones y Garantía */}
        <section className="mb-16" aria-labelledby="devoluciones-titulo">
          <h2 id="devoluciones-titulo" className="text-xl md:text-2xl font-bold uppercase mb-6 tracking-wide text-neutral-900">
            Garantía de Satisfacción de 30 Días
          </h2>
          
          <p className="text-neutral-600 text-sm mb-6 leading-relaxed">
            Tu satisfacción es nuestra máxima prioridad. Si tu producto llega dañado, incompleto, con defecto o no coincide con lo especificado, nuestra garantía te respalda:
          </p>

          <ul className="space-y-3 mb-8" role="list">
            {[
              { icon: 'check_circle', text: '30 días naturales desde la fecha de recepción para solicitar cambio o reembolso completo.' },
              { icon: 'check_circle', text: 'Guía de retorno prepagada sin costo adicional para productos con garantía aprobada.' },
              { icon: 'check_circle', text: 'El producto debe conservar sus accesorios, manuales y empaque en el mejor estado posible.' },
              { icon: 'cancel', text: 'No aplica en consumibles con sellos rotos o software con licencias activadas.' },
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-neutral-700">
                <span className={`material-symbols-outlined text-[20px] mt-0.5 shrink-0 ${item.icon === 'check_circle' ? 'text-emerald-600' : 'text-red-500'}`} aria-hidden="true">{item.icon}</span>
                <span>{item.text}</span>
              </li>
            ))}
          </ul>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
            <h3 className="text-xs uppercase tracking-wider font-bold mb-3 text-amber-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-lg text-amber-600">help</span>
              ¿Cómo iniciar una devolución o reclamo de garantía?
            </h3>
            <ol className="space-y-2 text-neutral-700 text-xs md:text-sm" role="list">
              <li><strong>1.</strong> Ingresa a tu <Link to="/account" className="underline text-amber-800 font-semibold">Cuenta Personal</Link> y selecciona el pedido a devolver, o escríbenos a <a href="mailto:soporte@ov33.com" className="underline text-amber-800 font-semibold">soporte@ov33.com</a>.</li>
              <li><strong>2.</strong> Nuestro equipo generará tu guía de devolución electrónica sin costo en menos de 24 horas.</li>
              <li><strong>3.</strong> Pega la etiqueta en la caja y déjala en cualquier sucursal de la paquetería designada.</li>
              <li><strong>4.</strong> Tu reembolso o cambio se procesa de 48 a 72 horas después de recibir el paquete.</li>
            </ol>
          </div>
        </section>

        <div className="border-t border-neutral-200 my-12"></div>

        {/* FAQ */}
        <section aria-labelledby="faq-titulo">
          <h2 id="faq-titulo" className="text-xl md:text-2xl font-bold uppercase mb-6 tracking-wide text-neutral-900">
            Preguntas Frecuentes
          </h2>
          <div className="space-y-3">
            {faqSchema.mainEntity.map((item, i) => (
              <details key={i} className="group border border-neutral-200 rounded-xl overflow-hidden">
                <summary className="text-xs font-bold uppercase tracking-wider flex justify-between items-center list-none outline-none px-6 py-4 cursor-pointer hover:bg-neutral-50 transition-colors">
                  {item.name}
                  <span className="material-symbols-outlined transition-transform group-open:rotate-180 text-[18px] text-neutral-400" aria-hidden="true">expand_more</span>
                </summary>
                <p className="text-neutral-600 text-xs md:text-sm leading-relaxed px-6 pb-5 pt-1 border-t border-neutral-100">{item.acceptedAnswer.text}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}

export default Shipping;
