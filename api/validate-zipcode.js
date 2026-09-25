// Endpoint Serverless: Validación de Código Postal y Colonias con Envia Geocodes API
const GEOCODES_BASE = 'https://geocodes.envia.com';

// Cache en memoria para respuestas ultra-rápidas
const zipCache = new Map();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas

export default async function handler(req, res) {
  // CORS
  const allowedOrigins = [
    'https://edvictory.com',
    'https://www.edvictory.com'
  ];
  const origin = req.headers?.origin;
  if (origin && (allowedOrigins.includes(origin) || (process.env.NODE_ENV !== 'production' && origin.includes('localhost')))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const rawZip = req.method === 'GET' 
    ? (req.query?.zipcode || req.query?.postalCode) 
    : req.body?.postalCode;

  if (!rawZip || typeof rawZip !== 'string') {
    return res.status(400).json({ valid: false, message: 'Se requiere código postal.' });
  }

  const cleanZip = rawZip.trim();
  if (!/^\d{5}$/.test(cleanZip)) {
    return res.status(400).json({ valid: false, message: 'El código postal debe contener 5 dígitos numéricos.' });
  }

  // Revisar caché en memoria
  const cached = zipCache.get(cleanZip);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    return res.status(200).json(cached.data);
  }

  try {
    const response = await fetch(`${GEOCODES_BASE}/zipcode/MX/${cleanZip}`, {
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      return res.status(200).json({
        valid: false,
        message: 'No fue posible validar el código postal en este momento.'
      });
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(200).json({
        valid: false,
        postalCode: cleanZip,
        message: 'Código postal no encontrado en México.'
      });
    }

    const place = data[0];
    const stateName = place.state?.name || place.regions?.region_1 || '';
    const stateCode = place.state?.code?.['2digit'] || place.state?.code?.['3digit'] || '';
    const city = place.locality || place.regions?.region_2 || place.regions?.region_1 || '';
    const colonias = Array.isArray(place.suburbs) 
      ? Array.from(new Set(place.suburbs.map(s => String(s).trim()))).filter(Boolean).sort()
      : [];

    const resultData = {
      valid: true,
      postalCode: cleanZip,
      country: 'MX',
      state: stateName,
      stateCode: stateCode,
      city: city,
      municipality: place.regions?.region_2 || city,
      colonias: colonias,
      coordinates: place.coordinates || null
    };

    zipCache.set(cleanZip, { data: resultData, timestamp: Date.now() });

    return res.status(200).json(resultData);

  } catch (error) {
    console.error('Error validando CP en Geocodes:', error.message);
    return res.status(200).json({
      valid: false,
      message: 'Error conectando con el servicio de validación de direcciones.'
    });
  }
}
