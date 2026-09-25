// Endpoint Serverless: Webhook Receptor de Eventos y Rastreo de Envia.com (Guía Oficial)
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Envia envía GET para verificar el webhook o POST con el evento
  if (req.method === 'GET') {
    return res.status(200).json({ status: 'ok', service: 'ED Victory Envia Webhook' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const payload = req.body || {};
    console.log('Envia Webhook recibido:', JSON.stringify(payload).slice(0, 500));

    // Extraer datos de la guía
    const trackingNumber = payload.trackingNumber || payload.tracking_number || payload.data?.trackingNumber;
    const rawStatus = (payload.status || payload.statusDescription || payload.data?.status || '').toLowerCase();
    const carrier = payload.carrier || payload.data?.carrier || '';

    if (!trackingNumber) {
      return res.status(200).json({ received: true, note: 'No tracking number found' });
    }

    // Mapeo a estados de la tienda ED VICTORY
    let storeStatus = 'En tránsito';
    if (rawStatus.includes('delivered') || rawStatus.includes('entregado')) {
      storeStatus = 'Entregado';
    } else if (rawStatus.includes('out for delivery') || rawStatus.includes('en reparto')) {
      storeStatus = 'En reparto';
    } else if (rawStatus.includes('picked up') || rawStatus.includes('recolectado')) {
      storeStatus = 'En tránsito';
    } else if (rawStatus.includes('exception') || rawStatus.includes('incidencia')) {
      storeStatus = 'Incidencia en Envío';
    }

    // Actualizar en Firestore via REST API
    const PROJECT_ID = 'ed-victory';
    
    // Buscar la orden asociada a este trackingNumber
    try {
      const queryRes = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: 'orders' }],
            where: {
              fieldFilter: {
                field: { fieldPath: 'trackingNumber' },
                op: 'EQUAL',
                value: { stringValue: String(trackingNumber) }
              }
            },
            limit: 1
          }
        })
      });

      if (queryRes.ok) {
        const queryResults = await queryRes.json();
        const matchedDoc = queryResults?.[0]?.document;

        if (matchedDoc && matchedDoc.name) {
          const updateUrl = `https://firestore.googleapis.com/v1/${matchedDoc.name}?updateMask.fieldPaths=status&updateMask.fieldPaths=shippingStatus&updateMask.fieldPaths=lastTrackingUpdate`;

          await fetch(updateUrl, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fields: {
                status: { stringValue: storeStatus },
                shippingStatus: { stringValue: rawStatus || storeStatus },
                lastTrackingUpdate: { stringValue: new Date().toISOString() }
              }
            })
          });

          console.log(`Orden actualizada por webhook de Envia: ${matchedDoc.name} -> ${storeStatus}`);
        }
      }
    } catch (dbErr) {
      console.warn('Aviso actualizando orden desde Envia Webhook:', dbErr.message);
    }

    return res.status(200).json({
      received: true,
      trackingNumber,
      carrier,
      mappedStatus: storeStatus
    });

  } catch (error) {
    console.error('Error procesando Envia Webhook:', error.message);
    return res.status(200).json({ received: true, error: error.message });
  }
}
