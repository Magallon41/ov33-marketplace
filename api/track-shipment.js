// Endpoint Serverless: Rastreo de envíos en tiempo real con Envia.com (Blindado)
const ENVIA_BASE = 'https://api.envia.com';
const ENVIA_TOKEN = process.env.ENVIA_PRODUCTION_TOKEN || process.env.ENVIA_TOKEN;

// Rate limiting en memoria (20 consultas por minuto por IP)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 20;

function checkRateLimit(ip) {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now - record.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { windowStart: now, count: 1 });
    return true;
  }
  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  record.count++;
  return true;
}

export default async function handler(req, res) {
  // CORS Restringido
  const allowedOrigins = [
    'https://edvictory.com',
    'https://www.edvictory.com'
  ];
  const origin = req.headers.origin;
  if (origin && (allowedOrigins.includes(origin) || (process.env.NODE_ENV !== 'production' && origin.includes('localhost')))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST,GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Rate Limiting
  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket?.remoteAddress || 'unknown';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ message: 'Demasiadas consultas de rastreo. Intente más tarde.' });
  }

  const rawTrackingNumber = req.method === 'GET' 
    ? req.query?.trackingNumber 
    : req.body?.trackingNumber;

  if (!rawTrackingNumber || typeof rawTrackingNumber !== 'string') {
    return res.status(400).json({ message: 'Número de rastreo requerido.' });
  }

  const trackingNumber = rawTrackingNumber.trim();
  // Validación de formato alfanumérico seguro para evitar inyecciones
  if (!/^[A-Za-z0-9_-]{5,60}$/.test(trackingNumber)) {
    return res.status(400).json({ message: 'Formato de número de guía no válido.' });
  }

  if (!ENVIA_TOKEN) {
    return res.status(500).json({ message: 'Servicio de rastreo no configurado en el servidor.' });
  }

  try {
    const response = await fetch(`${ENVIA_BASE}/ship/generaltrack/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ENVIA_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        trackingNumbers: [trackingNumber]
      })
    });

    const result = await response.json();

    if (!response.ok || !result.data || result.data.length === 0) {
      return res.status(200).json({
        found: false,
        trackingNumber,
        message: 'No se encontraron eventos activos para este número de guía todavía.'
      });
    }

    const trackingData = result.data[0];

    return res.status(200).json({
      found: true,
      trackingNumber: trackingData.trackingNumber,
      status: trackingData.status || 'En tránsito',
      carrier: trackingData.carrier,
      events: trackingData.events || [],
      trackUrl: `https://tracking.envia.com/${encodeURIComponent(trackingData.trackingNumber)}`
    });

  } catch (error) {
    console.error('Error tracking shipment:', error.message);
    return res.status(500).json({
      message: 'Error al consultar rastreo.',
      error: error.message
    });
  }
}
