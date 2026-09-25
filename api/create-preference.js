import { MercadoPagoConfig, Preference } from 'mercadopago';

// ── Rate Limiting en Memoria ──────────────────────────────────────────────────
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 10;

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
  // ── CORS Restringido ──────────────────────────────────────────────────────
  const allowedOrigins = [
    'https://edvictory.com',
    'https://www.edvictory.com',
  ];

  const origin = req.headers.origin;
  if (origin && (allowedOrigins.includes(origin) || (process.env.NODE_ENV !== 'production' && origin.includes('localhost')))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // ── Rate Limiting ─────────────────────────────────────────────────────────
  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket?.remoteAddress || 'unknown';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ message: 'Demasiadas solicitudes. Inténtalo en un minuto.' });
  }

  const { items, discountCode, orderId, email, shippingCost = 0, shippingTitle = 'Envío Nacional' } = req.body || {};

  if (!items || !orderId || !email) {
    return res.status(400).json({ message: 'Faltan parámetros requeridos.' });
  }

  // ── Validación de inputs ──────────────────────────────────────────────────
  if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
    return res.status(400).json({ message: 'Lista de productos inválida.' });
  }

  for (const item of items) {
    if (!item.id) {
      return res.status(400).json({ message: 'ID de producto faltante.' });
    }
    if (typeof item.quantity !== 'number' || item.quantity <= 0 || item.quantity > 100) {
      return res.status(400).json({ message: 'Cantidad de producto inválida.' });
    }
  }

  try {
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || '';
    if (!accessToken) {
      console.error('MERCADO_PAGO_ACCESS_TOKEN no está configurado en el servidor.');
      return res.status(500).json({ message: 'Configuración de pagos incompleta.' });
    }

    // ── Obtener precios oficiales desde Firestore ─────────────────────────────
    const PROJECT_ID = 'ed-victory';
    const mpItems = [];
    let subtotal = 0;

    for (const item of items) {
      // Hacemos fetch a la API REST de Firestore
      const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/products/${encodeURIComponent(item.id)}`;
      const response = await fetch(firestoreUrl);
      
      if (!response.ok) {
        return res.status(404).json({ message: `El producto con ID ${item.id} no existe o no está disponible.` });
      }

      const data = await response.json();
      const fields = data.fields || {};
      const name = fields.name?.stringValue || 'Producto ED';
      
      // El precio se almacena como string o numérico
      const rawPrice = fields.price?.stringValue || fields.price?.integerValue || fields.price?.doubleValue || '0';
      const priceStr = String(rawPrice).replace(/,/g, '');
      const officialPrice = Number(priceStr) || 0;

      if (officialPrice <= 0) {
        return res.status(400).json({ message: `El producto ${name} no tiene un precio válido asignado.` });
      }

      // ── Validar stock oficial en Firestore ─────────────────────────────────
      const targetSize = item.selectedSize || 'M';
      const targetColor = item.selectedColor || null;
      let availableStock = 0;

      if (fields.variants?.arrayValue?.values) {
        const variants = fields.variants.arrayValue.values;
        let matchedVar = null;
        if (targetColor) {
          matchedVar = variants.find(v => 
            (v.mapValue?.fields?.colorName?.stringValue || '').trim().toLowerCase() === String(targetColor).trim().toLowerCase()
          );
        }
        if (!matchedVar) matchedVar = variants[0];
        const stockMap = matchedVar?.mapValue?.fields?.stock?.mapValue?.fields || {};
        const szVal = stockMap[targetSize]?.integerValue ?? stockMap[targetSize]?.doubleValue;
        availableStock = szVal !== undefined ? parseInt(szVal, 10) : 0;
      } else if (fields.stock?.mapValue?.fields) {
        const topStockMap = fields.stock.mapValue.fields;
        const szVal = topStockMap[targetSize]?.integerValue ?? topStockMap[targetSize]?.doubleValue;
        availableStock = szVal !== undefined ? parseInt(szVal, 10) : 0;
      } else if (fields.stock?.integerValue) {
        availableStock = parseInt(fields.stock.integerValue, 10);
      }

      if (availableStock <= 0) {
        return res.status(400).json({ 
          message: `El producto "${name}" en talla ${targetSize} se encuentra actualmente agotado.` 
        });
      }

      if (item.quantity > availableStock) {
        return res.status(400).json({ 
          message: `Stock insuficiente para "${name}" (Talla: ${targetSize}). Unidades disponibles: ${availableStock}, solicitadas: ${item.quantity}.` 
        });
      }

      subtotal += officialPrice * item.quantity;

      mpItems.push({
        id: String(item.id),
        title: `${name} (Talla: ${item.selectedSize || 'M'})`,
        unit_price: officialPrice,
        quantity: Number(item.quantity),
        currency_id: 'MXN'
      });
    }

    // ── Calcular descuento del cupón en servidor ──────────────────────────────
    let discount = 0;
    if (discountCode && String(discountCode).trim().toUpperCase() === 'VICTORY10') {
      discount = Math.round(subtotal * 0.10);
      mpItems.push({
        id: 'coupon-discount',
        title: 'Descuento de Cupón Aplicado (10%)',
        unit_price: -Number(discount),
        quantity: 1,
        currency_id: 'MXN'
      });
    }

    // ── Validar y agregar costo de envío ─────────────────────────────────────
    let validShippingCost = Number(shippingCost);
    if (isNaN(validShippingCost) || validShippingCost < 0 || validShippingCost > 5000) {
      validShippingCost = 150; // Tarifa estándar segura en caso de alteración
    }

    if (validShippingCost > 0) {
      mpItems.push({
        id: 'shipping-charge',
        title: String(shippingTitle || 'Envío de Pedido').slice(0, 100),
        unit_price: validShippingCost,
        quantity: 1,
        currency_id: 'MXN'
      });
    }

    const client = new MercadoPagoConfig({ accessToken });
    const preference = new Preference(client);

    // ── URL Base Segura (Protección contra Host Header Injection) ────────────
    const siteUrl = process.env.SITE_URL || 'https://edvictory.com';

    const response = await preference.create({
      body: {
        items: mpItems,
        statement_descriptor: 'ED VICTORY',
        notification_url: `${siteUrl}/api/mercadopago-webhook`,
        back_urls: {
          success: `${siteUrl}/checkout?payment_status=approved&orderId=${encodeURIComponent(orderId)}`,
          failure: `${siteUrl}/checkout?payment_status=rejected&orderId=${encodeURIComponent(orderId)}`,
          pending: `${siteUrl}/checkout?payment_status=pending&orderId=${encodeURIComponent(orderId)}`
        },
        auto_return: 'approved',
        external_reference: String(orderId),
        payer: {
          email: String(email).trim().toLowerCase()
        }
      }
    });

    return res.status(200).json({
      id: response.id,
      initPoint: response.init_point
    });
  } catch (error) {
    console.error('Error creating preference:', error.message);
    return res.status(500).json({ message: 'Error al procesar el pago. Inténtelo de nuevo.' });
  }
}
