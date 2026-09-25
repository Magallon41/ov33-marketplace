// Endpoint Serverless: Envío de Correos Transaccionales con Resend (Blindado)
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const PRIMARY_FROM = process.env.RESEND_FROM_EMAIL || 'ED VICTORY <pedidos@edvictory.com>';
const FALLBACK_FROM = 'ED VICTORY <onboarding@resend.dev>';

// Rate limiting en memoria (10 peticiones por minuto por IP)
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

// Función para sanitizar texto y prevenir inyección de HTML / XSS en plantillas de correo
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  // Rate Limiting
  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket?.remoteAddress || 'unknown';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ message: 'Demasiadas solicitudes. Intente más tarde.' });
  }

  try {
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY no está configurada en las variables de entorno.');
      return res.status(500).json({ message: 'Servicio de mensajería no configurado.' });
    }

    const { type, to, order, user } = req.body || {};

    if (!to || typeof to !== 'string' || !EMAIL_REGEX.test(to.trim())) {
      return res.status(400).json({ message: 'Destinatario de correo inválido.' });
    }

    const cleanTo = to.trim().toLowerCase();
    let subject = '';
    let html = '';

    if (type === 'order_confirmation') {
      if (!order || typeof order !== 'object' || !order.id) {
        return res.status(400).json({ message: 'Datos válidos de la orden requeridos.' });
      }

      subject = `Confirmación de Pedido #${escapeHtml(order.id)} - ED VICTORY`;
      html = generateOrderEmailHtml(order);

    } else if (type === 'welcome') {
      const userName = user?.name ? escapeHtml(user.name) : 'Cliente';
      subject = 'Bienvenido a ED VICTORY - Estética Camisera';
      html = generateWelcomeEmailHtml(userName);

    } else {
      return res.status(400).json({ message: 'Tipo de correo no soportado.' });
    }

    // 1. Intentar enviar con el remitente oficial del dominio verificado (@edvictory.com)
    let response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: PRIMARY_FROM,
        to: [cleanTo],
        subject,
        html
      })
    });

    let result = await response.json();

    // 2. Si el dominio aún no termina de propagarse en DNS, enviar fallback al buzón de respaldo
    if (!response.ok && (result.message?.includes('not verified') || result.statusCode === 403)) {
      console.warn('Dominio en proceso de verificación. Enviando respaldo via onboarding@resend.dev:', result);
      
      const fallbackRecipient = process.env.ADMIN_BACKUP_EMAIL || 'contacto@edvictory.com';
      const fallbackResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: FALLBACK_FROM,
          to: [fallbackRecipient],
          subject: `[COPIA RESPALDO] ${subject}`,
          html: `<div style="background:#fff3cd;padding:12px;margin-bottom:16px;font-family:sans-serif;font-size:12px;border:1px solid #ffeeba;"><strong>Nota:</strong> Este correo fue enviado a tu buzón de respaldo mientras termina de propagarse el dominio edvictory.com. Destinatario original: ${escapeHtml(cleanTo)}</div>` + html
        })
      });

      const fallbackResult = await fallbackResponse.json();
      return res.status(200).json({
        success: true,
        fallback: true,
        emailId: fallbackResult.id,
        note: 'Correo enviado a buzón de respaldo administrativo.'
      });
    }

    if (!response.ok) {
      console.error('Error Resend API:', result);
      return res.status(400).json({
        success: false,
        message: 'No fue posible despachar el correo.'
      });
    }

    return res.status(200).json({
      success: true,
      emailId: result.id
    });

  } catch (error) {
    console.error('Error send-email:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error interno enviando correo.'
    });
  }
}

// ── Plantilla HTML: Confirmación de Pedido ─────────────────────────────────────
function generateOrderEmailHtml(order) {
  const items = Array.isArray(order.items) ? order.items : [];
  const itemsHtml = items.map(item => {
    const safeName = escapeHtml(item.name || 'Prenda ED');
    const safeSize = item.selectedSize ? escapeHtml(item.selectedSize) : '';
    const safeColor = item.selectedColor ? escapeHtml(item.selectedColor) : '';
    const safeQty = Number(item.quantity) || 1;
    const rawPrice = Number(String(item.price || '0').replace(/,/g, '')) || 0;
    const itemTotal = (rawPrice * safeQty).toLocaleString('es-MX');

    return `
    <tr>
      <td style="padding: 16px 0; border-bottom: 1px solid #eeeeee;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td width="60" valign="top">
              <img src="${item.image ? escapeHtml(item.image) : 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=120'}" alt="${safeName}" width="50" style="border: 1px solid #eeeeee; display: block;" />
            </td>
            <td style="padding-left: 14px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13px; line-height: 1.4; color: #111111;" valign="top">
              <strong>${safeName}</strong><br />
              <span style="font-size: 11px; color: #777777; text-transform: uppercase;">
                ${safeSize ? 'Talla: ' + safeSize : ''}
                ${safeColor ? ' | Color: ' + safeColor : ''}
                | Cant: ${safeQty}
              </span>
            </td>
            <td align="right" valign="top" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13px; font-weight: bold; color: #111111;">
              $${itemTotal} MXN
            </td>
          </tr>
        </table>
      </td>
    </tr>
    `;
  }).join('');

  const shippingAddr = order.shippingAddress || {};
  const fullAddress = [
    shippingAddr.address,
    shippingAddr.city,
    shippingAddr.state,
    shippingAddr.zip,
    shippingAddr.country
  ].filter(Boolean).map(escapeHtml).join(', ');

  const safeCustomerName = escapeHtml(order.customerName || 'Cliente');
  const safeOrderId = escapeHtml(order.id);
  const safeStatus = escapeHtml(order.status || 'Procesando');
  const safeSubtotal = (Number(order.subtotal) || 0).toLocaleString('es-MX');
  const safeShippingCost = (Number(order.shippingCost) || 0).toLocaleString('es-MX');
  const safeCarrierName = escapeHtml(order.shippingDetails?.carrierName || 'Paquetería');
  const safeTotal = (Number(order.total) || 0).toLocaleString('es-MX');

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Confirmación de Pedido</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #f7f7f7; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f7f7f7; padding: 40px 10px;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border: 1px solid #e5e5e5; max-width: 600px; width: 100%;">
            <tr>
              <td align="center" style="padding: 35px 20px; background-color: #000000; color: #ffffff;">
                <h1 style="margin: 0; font-size: 22px; letter-spacing: 4px; text-transform: uppercase; font-weight: 300;">ED VICTORY</h1>
                <p style="margin: 6px 0 0 0; font-size: 9px; letter-spacing: 3px; text-transform: uppercase; color: #aaaaaa;">Estética Camisera de Autor</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 35px 40px 20px 40px;">
                <p style="font-size: 11px; letter-spacing: 2px; color: #888888; text-transform: uppercase; margin: 0 0 10px 0;">PAGO CONFIRMADO CON ÉXITO</p>
                <h2 style="margin: 0 0 15px 0; font-size: 20px; color: #111111; font-weight: 400;">¡Gracias por tu compra, ${safeCustomerName}!</h2>
                <p style="font-size: 14px; line-height: 1.6; color: #555555; margin: 0;">
                  Hemos recibido tu pedido correctamente y nuestro equipo ya está preparando tus prendas para ser empaquetadas con los más altos estándares de calidad.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 40px 20px 40px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fafafa; border: 1px solid #eeeeee; padding: 15px 20px;">
                  <tr>
                    <td style="font-size: 12px; color: #666666; font-family: monospace;">NÚMERO DE PEDIDO:</td>
                    <td align="right" style="font-size: 13px; font-weight: bold; color: #111111;">${safeOrderId}</td>
                  </tr>
                  <tr>
                    <td style="font-size: 12px; color: #666666; font-family: monospace; padding-top: 8px;">ESTADO:</td>
                    <td align="right" style="font-size: 12px; font-weight: bold; color: #10b981; padding-top: 8px; text-transform: uppercase;">${safeStatus}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 40px;">
                <h3 style="margin: 0 0 10px 0; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: #333333; border-bottom: 2px solid #111111; padding-bottom: 6px;">Prendas Adquiridas</h3>
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  ${itemsHtml}
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding: 15px 40px 30px 40px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 13px; color: #555555;">
                  <tr>
                    <td style="padding: 6px 0;">Subtotal:</td>
                    <td align="right" style="padding: 6px 0;">$${safeSubtotal} MXN</td>
                  </tr>
                  ${order.discount ? `
                  <tr>
                    <td style="padding: 6px 0; color: #10b981;">Descuento aplicable:</td>
                    <td align="right" style="padding: 6px 0; color: #10b981;">-$${(Number(order.discount) || 0).toLocaleString('es-MX')} MXN</td>
                  </tr>` : ''}
                  <tr>
                    <td style="padding: 6px 0;">Envío (${safeCarrierName}):</td>
                    <td align="right" style="padding: 6px 0;">$${safeShippingCost} MXN</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; border-top: 1px solid #111111; font-weight: bold; color: #111111; font-size: 16px;">TOTAL PAGADO:</td>
                    <td align="right" style="padding: 12px 0; border-top: 1px solid #111111; font-weight: bold; color: #111111; font-size: 16px;">$${safeTotal} MXN</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding: 0 40px 30px 40px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fafafa; border: 1px solid #eeeeee; padding: 15px 20px;">
                  <tr>
                    <td style="font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #888888; padding-bottom: 6px;">DIRECCIÓN DE ENTREGA:</td>
                  </tr>
                  <tr>
                    <td style="font-size: 13px; color: #222222; line-height: 1.4;">${fullAddress || 'Dirección registrada en pedido'}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding: 0 40px 40px 40px;">
                <a href="https://edvictory.com/tracking" style="display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; padding: 14px 32px; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; font-weight: bold;">
                  RASTREAR MI PEDIDO
                </a>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding: 25px 20px; background-color: #f2f2f2; border-top: 1px solid #e5e5e5; font-size: 11px; color: #777777;">
                <p style="margin: 0 0 6px 0;">¿Tienes dudas con tu pedido? Escríbenos a <a href="mailto:contacto@edvictory.com" style="color: #111111;">contacto@edvictory.com</a></p>
                <p style="margin: 0;">&copy; ${new Date().getFullYear()} ED VICTORY. Guadalajara, Jalisco, México.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
}

// ── Plantilla HTML: Bienvenida a Nuevo Usuario ─────────────────────────────────
function generateWelcomeEmailHtml(userName) {
  const safeName = escapeHtml(userName);
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Bienvenido a ED VICTORY</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #f7f7f7; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f7f7f7; padding: 40px 10px;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border: 1px solid #e5e5e5; max-width: 600px; width: 100%;">
            <tr>
              <td align="center" style="padding: 35px 20px; background-color: #000000; color: #ffffff;">
                <h1 style="margin: 0; font-size: 22px; letter-spacing: 4px; text-transform: uppercase; font-weight: 300;">ED VICTORY</h1>
                <p style="margin: 6px 0 0 0; font-size: 9px; letter-spacing: 3px; text-transform: uppercase; color: #aaaaaa;">Estética Camisera de Autor</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 40px 40px 25px 40px;">
                <h2 style="margin: 0 0 15px 0; font-size: 22px; color: #111111; font-weight: 400;">Bienvenido, ${safeName}</h2>
                <p style="font-size: 14px; line-height: 1.6; color: #555555; margin: 0 0 20px 0;">
                  Gracias por formar parte de la comunidad de <strong>ED VICTORY</strong>. Diseñamos cada una de nuestras piezas con el propósito de ofrecer elegancia atemporal, cortes impecables y los textiles más selectos.
                </p>
                <div style="background-color: #fafafa; border: 1px dashed #000000; padding: 20px; text-align: center; margin: 25px 0;">
                  <span style="font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #888888; display: block; margin-bottom: 6px;">REGALO DE BIENVENIDA</span>
                  <p style="font-size: 18px; font-weight: bold; letter-spacing: 3px; margin: 0; color: #111111;">VICTORY10</p>
                  <span style="font-size: 12px; color: #555555; display: block; margin-top: 6px;">Disfruta de un 10% de descuento en tu primer pedido.</span>
                </div>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding: 0 40px 40px 40px;">
                <a href="https://edvictory.com/catalog" style="display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; padding: 14px 32px; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; font-weight: bold;">
                  EXPLORAR COLECCIONES
                </a>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding: 25px 20px; background-color: #f2f2f2; border-top: 1px solid #e5e5e5; font-size: 11px; color: #777777;">
                <p style="margin: 0;">&copy; ${new Date().getFullYear()} ED VICTORY. Guadalajara, Jalisco, México.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
}
