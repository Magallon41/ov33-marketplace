// Endpoint Serverless: Cotizador Multi-Carrier en Paralelo con Envia.com (Guía Oficial)
const isSandbox = process.env.ENVIA_ENVIRONMENT === 'sandbox';
const ENVIA_BASE = isSandbox ? 'https://api-test.envia.com' : 'https://api.envia.com';
const ENVIA_TOKEN = process.env.ENVIA_PRODUCTION_TOKEN || process.env.ENVIA_TOKEN || process.env.ENVIA_SANDBOX_TOKEN;

const CARRIERS_TO_QUOTE = ['fedex', 'dhl', 'estafeta', 'redpack', 'paquetexpress'];

const STATE_CODES_MX = {
  'Aguascalientes': 'AG', 'Baja California': 'BC', 'Baja California Sur': 'BS', 'Campeche': 'CM',
  'Chiapas': 'CS', 'Chihuahua': 'CH', 'Coahuila': 'CO', 'Colima': 'CL', 'Ciudad de México': 'CX',
  'CDMX': 'CX', 'Durango': 'DG', 'Guanajuato': 'GT', 'Guerrero': 'GR', 'Hidalgo': 'HG', 'Jalisco': 'JA',
  'México': 'EM', 'Estado de México': 'EM', 'Michoacán': 'MI', 'Morelos': 'MO', 'Nayarit': 'NA',
  'Nuevo León': 'NL', 'Oaxaca': 'OA', 'Puebla': 'PU', 'Querétaro': 'QT', 'Quintana Roo': 'QR',
  'San Luis Potosí': 'SL', 'Sinaloa': 'SI', 'Sonora': 'SO', 'Tabasco': 'TB', 'Tamaulipas': 'TM',
  'Tlaxcala': 'TL', 'Veracruz': 'VE', 'Yucatán': 'YU', 'Zacatecas': 'ZA'
};

const DEFAULT_ORIGIN = {
  name: process.env.ENVIA_ORIGIN_NAME || 'ED Victory Almacén',
  company: process.env.ENVIA_ORIGIN_COMPANY || 'ED VICTORY SHIRTS',
  email: process.env.ENVIA_ORIGIN_EMAIL || 'contacto@edvictory.com',
  phone: process.env.ENVIA_ORIGIN_PHONE || '3531234567',
  street: process.env.ENVIA_ORIGIN_STREET || 'Centro',
  number: process.env.ENVIA_ORIGIN_NUMBER || '100',
  district: process.env.ENVIA_ORIGIN_DISTRICT || 'Centro',
  city: process.env.ENVIA_ORIGIN_CITY || 'Sahuayo',
  state: process.env.ENVIA_ORIGIN_STATE || 'MI',
  country: 'MX',
  postalCode: process.env.ENVIA_ORIGIN_POSTAL_CODE || '59000'
};

const FALLBACK_RATES = [
  {
    carrier: 'estafeta',
    carrierName: 'Estafeta Terrestre',
    service: 'ground',
    serviceName: 'Terrestre Estándar',
    deliveryEstimate: '2-4 días hábiles',
    price: 160,
    currency: 'MXN'
  },
  {
    carrier: 'fedex',
    carrierName: 'FedEx Nacional',
    service: 'ground',
    serviceName: 'Nacional Económico',
    deliveryEstimate: '3-5 días hábiles',
    price: 170,
    currency: 'MXN'
  },
  {
    carrier: 'dhl',
    carrierName: 'DHL Express',
    service: 'express',
    serviceName: 'Express Día Siguiente',
    deliveryEstimate: '1-2 días hábiles',
    price: 225,
    currency: 'MXN'
  }
];

export default async function handler(req, res) {
  // CORS Restringido
  const allowedOrigins = [
    'https://edvictory.com',
    'https://www.edvictory.com'
  ];
  const origin = req.headers?.origin;
  if (origin && (allowedOrigins.includes(origin) || (process.env.NODE_ENV !== 'production' && origin.includes('localhost')))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    const { destination, items = [] } = req.body || {};

    if (!destination || !destination.postalCode) {
      return res.status(400).json({ message: 'Se requiere código postal de destino.' });
    }

    const cleanZip = String(destination.postalCode).trim();
    if (!/^\d{5}$/.test(cleanZip)) {
      return res.status(400).json({ message: 'El código postal debe contener 5 dígitos numéricos.' });
    }

    if (!ENVIA_TOKEN) {
      console.warn('ENVIA_TOKEN no encontrado, usando tarifas estimadas de respaldo.');
      return res.status(200).json({
        success: true,
        rates: FALLBACK_RATES
      });
    }

    // Normalizar código de estado de 2 letras
    const stateRaw = destination.stateCode || destination.state || 'Jalisco';
    const stateCode = STATE_CODES_MX[stateRaw] || (stateRaw.length === 2 ? stateRaw.toUpperCase() : 'JA');

    // Calcular dimensiones y peso de la caja
    const totalQty = Array.isArray(items) 
      ? items.reduce((sum, item) => sum + (Math.max(1, Number(item.quantity) || 1)), 0) 
      : 1;
    const totalWeight = Math.max(0.5, totalQty * 0.35 + 0.15);
    const boxHeight = Math.min(45, Math.max(8, totalQty * 3.5));

    const packages = [{
      type: 'box',
      content: `Camisas ED Victory (${totalQty} ${totalQty === 1 ? 'prenda' : 'prendas'})`,
      amount: 1,
      declaredValue: Math.max(800, totalQty * 600),
      lengthUnit: 'CM',
      weightUnit: 'KG',
      weight: parseFloat(totalWeight.toFixed(2)),
      dimensions: {
        length: 30,
        width: 22,
        height: Math.round(boxHeight)
      }
    }];

    const destinationPayload = {
      name: destination.name || 'Cliente ED Victory',
      company: destination.company || '',
      email: destination.email || 'cliente@edvictory.com',
      phone: destination.phone ? String(destination.phone).replace(/\D/g, '').slice(-10) : '5500000000',
      street: destination.street || 'Domicilio Entrega',
      number: destination.number || '1',
      district: destination.district || destination.colonia || 'Centro',
      city: destination.city || 'Ciudad',
      state: stateCode,
      country: 'MX',
      postalCode: cleanZip
    };

    // Paso 2 Oficial de Envia: Petición en paralelo por cada carrier
    const ratePromises = CARRIERS_TO_QUOTE.map(carrier => 
      fetch(`${ENVIA_BASE}/ship/rate/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ENVIA_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          origin: DEFAULT_ORIGIN,
          destination: destinationPayload,
          packages,
          shipment: { type: 1, carrier }
        })
      })
      .then(async (r) => {
        if (!r.ok) {
          const errBody = await r.text().catch(() => '');
          return { status: r.status, data: [], error: errBody };
        }
        return r.json();
      })
      .catch(err => ({ status: 500, data: [], error: err.message }))
    );

    const settledResults = await Promise.allSettled(ratePromises);

    // Aplanar y formatear las tarifas obtenidas
    const rawRates = settledResults
      .filter(r => r.status === 'fulfilled' && Array.isArray(r.value?.data) && r.value.data.length > 0)
      .flatMap(r => r.value.data);

    if (rawRates.length === 0) {
      console.warn('Envia API no retornó tarifas activas para el CP', cleanZip, 'usando respaldo.');
      return res.status(200).json({
        success: true,
        rates: FALLBACK_RATES,
        isFallback: true
      });
    }

    // Filtrar opciones "Ocurre" para priorizar entrega a domicilio de tiendas online
    const homeDeliveryRates = rawRates.filter(r => {
      const desc = (r.serviceDescription || r.service || '').toLowerCase();
      return !desc.includes('ocurre');
    });

    const candidateRates = homeDeliveryRates.length > 0 ? homeDeliveryRates : rawRates;

    // Normalizar datos legibles para el frontend
    const rates = candidateRates.map(rate => {
      let carrierDisplayName = rate.carrier ? String(rate.carrier).toUpperCase() : 'PAQUETERÍA';
      if (rate.carrier === 'fedex') carrierDisplayName = 'FedEx';
      if (rate.carrier === 'dhl') carrierDisplayName = 'DHL Express';
      if (rate.carrier === 'estafeta') carrierDisplayName = 'Estafeta';
      if (rate.carrier === 'redpack') carrierDisplayName = 'Redpack';
      if (rate.carrier === 'paquetexpress') carrierDisplayName = 'Paquetexpress';

      let cleanEstimate = rate.deliveryEstimate || '';
      if (!cleanEstimate && rate.deliveryTime) {
        cleanEstimate = `${rate.deliveryTime} días hábiles`;
      }
      if (!cleanEstimate) {
        cleanEstimate = rate.carrier === 'dhl' ? 'Día siguiente' : '2-4 días hábiles';
      }

      return {
        carrier: rate.carrier,
        carrierName: carrierDisplayName,
        service: rate.service,
        serviceName: rate.serviceDescription || rate.service,
        deliveryEstimate: cleanEstimate,
        price: Math.max(100, Math.round(rate.totalPrice || 150)),
        currency: rate.currency || 'MXN',
        logoUrl: rate.carrierLogo || null
      };
    });

    // Ordenar ascendentemente por precio
    rates.sort((a, b) => a.price - b.price);

    // Deduplicar servicios muy similares por carrier
    const seen = new Set();
    const uniqueRates = [];
    for (const r of rates) {
      const key = `${r.carrier}_${r.service}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueRates.push(r);
      }
    }

    return res.status(200).json({
      success: true,
      rates: uniqueRates.length > 0 ? uniqueRates : FALLBACK_RATES
    });

  } catch (error) {
    console.error('Error crítico en shipping-rates:', error.message);
    return res.status(200).json({
      success: true,
      rates: FALLBACK_RATES,
      isFallback: true
    });
  }
}
