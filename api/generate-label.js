// Endpoint Serverless: Generación de Guía de Envío en Envia.com (Protegido con Rol Admin)
const isSandbox = process.env.ENVIA_ENVIRONMENT === 'sandbox';
const ENVIA_BASE = isSandbox ? 'https://api-test.envia.com' : 'https://api.envia.com';
const ENVIA_TOKEN = process.env.ENVIA_PRODUCTION_TOKEN || process.env.ENVIA_TOKEN || process.env.ENVIA_SANDBOX_TOKEN;

const STATE_CODES_MX = {
  'Aguascalientes': 'AG', 'Baja California': 'BC', 'Baja California Sur': 'BS', 'Campeche': 'CM',
  'Chiapas': 'CS', 'Chihuahua': 'CH', 'Coahuila': 'CO', 'Colima': 'CL', 'Ciudad de México': 'DF',
  'Durango': 'DG', 'Guanajuato': 'GT', 'Guerrero': 'GR', 'Hidalgo': 'HG', 'Jalisco': 'JA',
  'México': 'EM', 'Michoacán': 'MI', 'Morelos': 'MO', 'Nayarit': 'NA', 'Nuevo León': 'NL',
  'Oaxaca': 'OA', 'Puebla': 'PU', 'Querétaro': 'QT', 'Quintana Roo': 'QR', 'San Luis Potosí': 'SL',
  'Sinaloa': 'SI', 'Sonora': 'SO', 'Tabasco': 'TB', 'Tamaulipas': 'TM', 'Tlaxcala': 'TL',
  'Veracruz': 'VE', 'Yucatán': 'YU', 'Zacatecas': 'ZA'
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

  // ── Verificación de Autorización Administrativa ──────────────────────────────
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No autorizado. Se requiere token de sesión.' });
  }

  const token = authHeader.split(' ')[1];
  const FIREBASE_API_KEY = process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY;

  if (FIREBASE_API_KEY) {
    try {
      const verifyRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: token })
      });

      if (!verifyRes.ok) {
        return res.status(401).json({ success: false, message: 'Token de sesión inválido o expirado.' });
      }

      const verifyData = await verifyRes.json();
      const user = verifyData.users?.[0];
      if (!user) {
        return res.status(401).json({ success: false, message: 'Usuario no autenticado.' });
      }

      // Verificar rol admin (en claims o documento de Firestore)
      let isAdmin = false;
      if (user.customAttributes) {
        try {
          const claims = JSON.parse(user.customAttributes);
          if (claims.admin === true) isAdmin = true;
        } catch (e) {}
      }

      if (!isAdmin) {
        const userDocRes = await fetch(`https://firestore.googleapis.com/v1/projects/ed-victory/databases/(default)/documents/users/${user.localId}`);
        if (userDocRes.ok) {
          const userDoc = await userDocRes.json();
          if (userDoc.fields?.role?.stringValue === 'admin') {
            isAdmin = true;
          }
        }
      }

      if (!isAdmin) {
        return res.status(403).json({ success: false, message: 'Acceso denegado: Se requieren privilegios de administrador.' });
      }
    } catch (authErr) {
      console.error('Error validando token en generate-label:', authErr.message);
      return res.status(500).json({ success: false, message: 'Error interno verificando credenciales.' });
    }
  }

  if (!ENVIA_TOKEN) {
    return res.status(500).json({ success: false, message: 'Configuración de Envia.com incompleta en el servidor.' });
  }

  try {
    const { destination, packages, carrier = 'fedex', service = 'ground', orderId } = req.body || {};

    if (!destination || !destination.postalCode) {
      return res.status(400).json({ message: 'Destino incompleto.' });
    }

    const stateRaw = destination.state || 'Jalisco';
    const stateCode = STATE_CODES_MX[stateRaw] || (stateRaw.length === 2 ? stateRaw.toUpperCase() : 'JA');

    // Parse street and exterior number
    let streetName = destination.street || 'Calle Principal';
    let extNumber = destination.number || '1';
    const numberMatch = String(streetName).match(/(\d+)/);
    if (numberMatch && !destination.number) {
      extNumber = numberMatch[1];
    }

    const buildPayload = (selectedCarrier, selectedService) => ({
      origin: DEFAULT_ORIGIN,
      destination: {
        name: destination.name || 'Cliente ED Victory',
        company: destination.company || '',
        email: destination.email || 'cliente@edvictory.com',
        phone: String(destination.phone || '5500000000').replace(/\D/g, '').slice(-10),
        street: streetName,
        number: String(extNumber),
        district: destination.district || destination.colonia || destination.city || 'Centro',
        city: destination.city || 'Ciudad',
        state: stateCode,
        country: 'MX',
        postalCode: String(destination.postalCode).trim().padStart(5, '0')
      },
      packages: packages && packages.length > 0 ? packages : [{
        type: 'box',
        content: `Camisas ED Victory #${orderId || 'WEB'}`,
        amount: 1,
        declaredValue: 1000,
        lengthUnit: 'CM',
        weightUnit: 'KG',
        weight: 1.5,
        dimensions: { length: 30, width: 22, height: 10 }
      }],
      shipment: {
        type: 1,
        carrier: String(selectedCarrier).toLowerCase(),
        service: String(selectedService).toLowerCase()
      },
      settings: {
        currency: 'MXN',
        printFormat: 'PDF',
        printSize: 'STOCK_4X6',
        comments: `Pedido #${orderId || 'ED-VICTORY'}`
      }
    });

    let currentCarrier = carrier;
    let currentService = service;
    let payload = buildPayload(currentCarrier, currentService);

    let response = await fetch(`${ENVIA_BASE}/ship/generate/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ENVIA_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    let result = await response.json();

    // En sandbox, si la paquetería seleccionada solo permite cotizar, cambiar a fedex ground
    if (result.meta === 'error' && (result.error?.message === 'SERVICE_QUOTE_ONLY' || result.error?.code === 1172)) {
      console.log('Carrier es solo cotización en sandbox. Generando guía de prueba con FedEx...');
      currentCarrier = 'fedex';
      currentService = 'ground';
      payload = buildPayload(currentCarrier, currentService);

      response = await fetch(`${ENVIA_BASE}/ship/generate/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ENVIA_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      result = await response.json();
    }

    if (!response.ok || !result.data || result.data.length === 0) {
      console.error('Error Envia Generate:', result);
      
      let friendlyError = 'No fue posible generar la guía con Envia.com.';
      if (response.status === 402 || result.error?.message === 'Not Enough money' || result.error?.code === 1170) {
        friendlyError = 'Saldo insuficiente en tu cuenta de Envia.com para emitir la guía (Error 402). Por favor recarga saldo en tu cuenta de Envia.';
      } else if (response.status === 422 || result.error?.code === 422) {
        friendlyError = 'Error 422: Por favor verifica la dirección de envío (calle, número exterior y colonia).';
      } else if (result.error?.message) {
        friendlyError = `Envia.com: ${result.error.message}`;
      } else if (result.message) {
        friendlyError = result.message;
      }

      return res.status(response.status || 400).json({
        success: false,
        message: friendlyError,
        details: result
      });
    }

    const shipment = result.data[0];

    return res.status(200).json({
      success: true,
      shipmentId: shipment.shipmentId,
      trackingNumber: shipment.trackingNumber,
      labelUrl: shipment.label,
      trackUrl: shipment.trackUrl,
      carrier: shipment.carrier,
      service: shipment.service,
      totalPrice: shipment.totalPrice,
      currency: shipment.currency
    });

  } catch (error) {
    console.error('Error generate-label:', error);
    return res.status(500).json({
      message: error.message || 'Error interno generando guía.',
      error: error.message
    });
  }
}
