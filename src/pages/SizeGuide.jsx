import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SEOHead } from '../components/seo/SEOHead';

const SIZE_DATA = [
  { size: 'XS', chest: '86-90', waist: '72-76', shoulder: '42', sleeve: '83', height: '160-165' },
  { size: 'S',  chest: '90-96', waist: '76-82', shoulder: '44', sleeve: '85', height: '165-170' },
  { size: 'M',  chest: '96-102', waist: '82-88', shoulder: '46', sleeve: '87', height: '170-175' },
  { size: 'L',  chest: '102-108', waist: '88-94', shoulder: '48', sleeve: '89', height: '175-180' },
  { size: 'XL', chest: '108-116', waist: '94-102', shoulder: '50', sleeve: '91', height: '180-185' },
  { size: 'XXL', chest: '116-124', waist: '102-110', shoulder: '52', sleeve: '93', height: '185-190' },
];

const FAQS = [
  { q: '¿Qué talla debo elegir si estoy entre dos tallas?', a: 'Si eres talla entre dos medidas, te recomendamos elegir la talla mayor para mayor comodidad y movilidad. Nuestras camisas tienen un corte slim-fit que se adapta bien al cuerpo.' },
  { q: '¿El corte Slim Fit es muy ajustado?', a: 'Nuestro Slim Fit está diseñado para ser estructurado sin ser incómodo. Sigue las medidas de la tabla: si tu pecho entra en la talla pero la cintura no, sube una talla.' },
  { q: '¿Las camisas de lino encogen con el lavado?', a: 'Los linos de alta calidad pueden encoger ligeramente (1-3%) con el primer lavado. Recomendamos siempre lavado en seco o a mano en frío para mantener la forma original.' },
  { q: '¿Cómo mido correctamente el pecho?', a: 'Pasa la cinta métrica por la parte más ancha del pecho, a la altura de las axilas, manteniendo la cinta horizontal y sin apretar. Respira normalmente y toma la medida.' },
  { q: '¿Puedo cambiar mi talla si me queda mal?', a: 'Sí. Aceptamos cambios de talla dentro de los 14 días naturales de recibido el pedido, con la prenda sin usar y con sus etiquetas originales. Ver nuestra política de devoluciones.' },
];

export function SizeGuide() {
  const [unit, setUnit] = useState('cm');
  const [myChest, setMyChest] = useState('');
  const [recommendation, setRecommendation] = useState('');

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': FAQS.map(f => ({
      '@type': 'Question',
      'name': f.q,
      'acceptedAnswer': { '@type': 'Answer', 'text': f.a },
    })),
  };

  const handleFindSize = () => {
    const val = parseFloat(myChest);
    if (!val) { setRecommendation(''); return; }
    const chest = unit === 'in' ? val * 2.54 : val;
    const match = SIZE_DATA.find(s => {
      const [min, max] = s.chest.split('-').map(Number);
      return chest >= min && chest <= max;
    });
    if (match) {
      setRecommendation(`Tu talla recomendada es **${match.size}** (pecho ${match.chest} cm).`);
    } else if (chest < 86) {
      setRecommendation('Tu medida está por debajo de XS. Contáctanos para opciones de medida personalizada.');
    } else {
      setRecommendation('Tu medida está por encima de XXL. Contáctanos para opciones de medida personalizada.');
    }
  };

  return (
    <>
      <SEOHead
        title="Guía de Tallas — Encuentra tu Medida Perfecta"
        description="Guía de tallas y medidas OV33: tabla en centímetros, calculadora por medida corporal y consejos prácticos para elegir tu talla ideal en ropa y calzado."
        url="/size-guide"
        schema={[faqSchema]}
      />

      <main className="pt-24 md:pt-[120px] max-w-5xl mx-auto px-4 md:px-12 pb-24 min-h-screen">
        {/* Breadcrumb */}
        <nav aria-label="Ruta de navegación" className="mb-10">
          <ol className="flex items-center gap-2 font-label-caps text-[10px] tracking-widest uppercase text-neutral-400">
            <li><Link to="/" className="hover:text-amber-600 transition-colors">Inicio</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link to="/catalog" className="hover:text-amber-600 transition-colors">Colección</Link></li>
            <li aria-hidden="true">/</li>
            <li><span className="text-neutral-700" aria-current="page">Guía de Tallas</span></li>
          </ol>
        </nav>

        <header className="mb-16 border-b border-neutral-200 pb-8">
          <h1 className="font-display-xl text-display-xl uppercase mb-4">Guía de Tallas</h1>
          <p className="font-body-lg text-secondary max-w-2xl">La talla perfecta hace la diferencia. Usa esta guía para encontrar la medida ideal antes de realizar tu pedido.</p>
        </header>

        {/* Calculadora interactiva */}
        <section className="mb-16 bg-neutral-50 border border-neutral-100 p-8" aria-labelledby="calculadora-titulo">
          <h2 id="calculadora-titulo" className="font-headline-md text-[22px] uppercase mb-6 tracking-wide">Calculadora de Talla</h2>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label htmlFor="chest-input" className="block font-label-caps text-[10px] tracking-widest uppercase text-neutral-600 mb-2">
                Mi medida de pecho ({unit})
              </label>
              <input
                id="chest-input"
                type="number"
                value={myChest}
                onChange={e => setMyChest(e.target.value)}
                placeholder={unit === 'cm' ? 'Ej: 98' : 'Ej: 38.5'}
                className="w-full border-b border-neutral-300 bg-transparent py-3 px-2 font-body-md text-sm outline-none focus:border-black transition-colors"
                min="60"
                max="160"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setUnit('cm')}
                className={`px-4 py-3 font-label-caps text-[10px] uppercase tracking-widest border transition-colors ${unit === 'cm' ? 'bg-black text-white border-black' : 'border-neutral-200 text-neutral-600 hover:bg-neutral-100'}`}
                aria-pressed={unit === 'cm'}
              >cm</button>
              <button
                onClick={() => setUnit('in')}
                className={`px-4 py-3 font-label-caps text-[10px] uppercase tracking-widest border transition-colors ${unit === 'in' ? 'bg-black text-white border-black' : 'border-neutral-200 text-neutral-600 hover:bg-neutral-100'}`}
                aria-pressed={unit === 'in'}
              >in</button>
            </div>
            <button
              onClick={handleFindSize}
              className="bg-black text-white px-8 py-3 font-button text-button uppercase tracking-widest hover:bg-neutral-800 transition-colors"
            >
              Encontrar Talla
            </button>
          </div>
          {recommendation && (
            <div className="mt-6 bg-emerald-50 border-l-4 border-emerald-500 px-6 py-4 font-body-md text-emerald-800 text-sm" role="status" aria-live="polite">
              {recommendation.replace(/\*\*(.*?)\*\*/g, '$1')}
            </div>
          )}
        </section>

        {/* Tabla de tallas */}
        <section className="mb-16" aria-labelledby="tabla-titulo">
          <h2 id="tabla-titulo" className="font-headline-md text-[22px] uppercase mb-6 tracking-wide">Tabla de Medidas</h2>
          <p className="font-body-md text-secondary text-sm mb-6">Todas las medidas están en centímetros (cm). Las medidas son del cuerpo, no de la prenda.</p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse font-body-md text-sm" role="table" aria-label="Tabla de tallas de moda y prendas OV33">
              <thead>
                <tr className="bg-black text-white">
                  <th scope="col" className="font-label-caps text-[10px] tracking-widest uppercase text-left px-4 py-3">Talla</th>
                  <th scope="col" className="font-label-caps text-[10px] tracking-widest uppercase text-left px-4 py-3">Pecho (cm)</th>
                  <th scope="col" className="font-label-caps text-[10px] tracking-widest uppercase text-left px-4 py-3">Cintura (cm)</th>
                  <th scope="col" className="font-label-caps text-[10px] tracking-widest uppercase text-left px-4 py-3">Hombro (cm)</th>
                  <th scope="col" className="font-label-caps text-[10px] tracking-widest uppercase text-left px-4 py-3">Manga (cm)</th>
                  <th scope="col" className="font-label-caps text-[10px] tracking-widest uppercase text-left px-4 py-3">Estatura (cm)</th>
                </tr>
              </thead>
              <tbody>
                {SIZE_DATA.map((row, i) => (
                  <tr key={row.size} className={i % 2 === 0 ? 'bg-white' : 'bg-neutral-50'}>
                    <td className="px-4 py-3 font-bold font-label-caps">{row.size}</td>
                    <td className="px-4 py-3">{row.chest}</td>
                    <td className="px-4 py-3">{row.waist}</td>
                    <td className="px-4 py-3">{row.shoulder}</td>
                    <td className="px-4 py-3">{row.sleeve}</td>
                    <td className="px-4 py-3">{row.height}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Cómo medir */}
        <section className="mb-16" aria-labelledby="como-medir-titulo">
          <h2 id="como-medir-titulo" className="font-headline-md text-[22px] uppercase mb-8 tracking-wide">¿Cómo Tomar tus Medidas?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { icon: 'straighten', title: 'Pecho', desc: 'Pasa la cinta por la parte más ancha del pecho, a la altura de las axilas. Mantén la cinta horizontal, sin apretar.' },
              { icon: 'rotate_right', title: 'Cintura', desc: 'Mide alrededor de la parte más estrecha del torso, generalmente 2-3 cm por encima del ombligo.' },
              { icon: 'width', title: 'Hombro', desc: 'Mide de punta a punta de los hombros en la parte superior, pasando por la nuca.' },
              { icon: 'height', title: 'Manga', desc: 'Con el brazo ligeramente doblado, mide desde el hombro hasta la muñeca.' },
            ].map(item => (
              <div key={item.title} className="flex items-start gap-4 border border-neutral-100 p-6">
                <span className="material-symbols-outlined text-[28px] text-amber-600 flex-shrink-0" aria-hidden="true">{item.icon}</span>
                <div>
                  <h3 className="font-label-caps text-label-caps font-bold mb-2">{item.title}</h3>
                  <p className="font-body-md text-secondary text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section aria-labelledby="faq-tallas-titulo">
          <h2 id="faq-tallas-titulo" className="font-headline-md text-[22px] uppercase mb-8 tracking-wide">Preguntas Frecuentes sobre Tallas</h2>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <details key={i} className="group border border-neutral-100">
                <summary className="font-label-caps text-[11px] tracking-widest flex justify-between items-center list-none outline-none px-6 py-4 cursor-pointer hover:bg-neutral-50 transition-colors">
                  {faq.q}
                  <span className="material-symbols-outlined transition-transform group-open:rotate-180 text-[18px] flex-shrink-0 ml-4" aria-hidden="true">expand_more</span>
                </summary>
                <p className="font-body-md text-secondary text-sm leading-relaxed px-6 pb-5 pt-2">{faq.a}</p>
              </details>
            ))}
          </div>
          <p className="mt-8 font-body-md text-sm text-secondary">
            ¿Aún tienes dudas? <a href="mailto:hola@edvictory.com" className="underline hover:text-amber-600 transition-colors">Contáctanos</a> y te ayudamos a elegir tu talla perfecta. También puedes ver nuestra{' '}
            <Link to="/shipping" className="underline hover:text-amber-600 transition-colors">política de cambios y devoluciones</Link>.
          </p>
        </section>
      </main>
    </>
  );
}
