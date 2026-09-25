import { MercadoPagoConfig, Payment } from 'mercadopago';
import crypto from 'crypto';

// Verificación opcional de firma criptográfica de Mercado Pago (x-signature)
function verifyMercadoPagoSignature(req) {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  if (!secret) return true; // Si no hay clave secreta configurada en Vercel, se omite

  const xSignature = req.headers['x-signature'];
  const xRequestId = req.headers['x-request-id'];
  if (!xSignature || !xRequestId) return false;

  const parts = Object.fromEntries(xSignature.split(',').map(part => part.split('=')));
  const ts = parts['ts'];
  const hash = parts['v1'];
  if (!ts || !hash) return false;

  const dataId = req.query?.['data.id'] || req.query?.id || req.body?.data?.id || req.body?.id || '';
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const calculatedHash = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
  return calculatedHash === hash;
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Mercado Pago envía POST o GET de verificación
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!accessToken) {
      console.warn('MERCADO_PAGO_ACCESS_TOKEN no configurado en Webhook.');
      return res.status(200).json({ received: true });
    }

    // Validar firma si el webhook secret está presente
    if (!verifyMercadoPagoSignature(req)) {
      console.warn('Alerta de seguridad: Firma de Webhook de Mercado Pago inválida.');
      return res.status(401).json({ message: 'Firma inválida' });
    }

    const client = new MercadoPagoConfig({ accessToken });
    const paymentClient = new Payment(client);

    // Extraer el ID de pago de query params o body
    const rawPaymentId = 
      req.query?.['data.id'] || 
      req.query?.id || 
      req.body?.data?.id || 
      req.body?.id;

    if (!rawPaymentId) {
      return res.status(200).json({ received: true, note: 'No payment ID in payload' });
    }

    const paymentId = String(rawPaymentId).trim();
    // Validar formato numérico seguro de paymentId
    if (!/^\d+$/.test(paymentId)) {
      return res.status(400).json({ message: 'ID de pago inválido.' });
    }

    // Consultar detalles oficiales del pago a la API de Mercado Pago
    let payment;
    try {
      payment = await paymentClient.get({ id: paymentId });
    } catch (fetchErr) {
      console.error(`Error consultando pago ${paymentId} en Mercado Pago:`, fetchErr.message);
      return res.status(200).json({ received: true, error: 'Could not fetch payment' });
    }

    if (!payment) {
      return res.status(200).json({ received: true });
    }

    const orderId = payment.external_reference;
    const paymentStatus = payment.status; // 'approved', 'pending', 'rejected', etc.

    console.log(`Webhook procesado: Pago ${paymentId} para Orden ${orderId}: Estado ${paymentStatus}`);

    if (orderId && typeof orderId === 'string') {
      const PROJECT_ID = 'ed-victory';
      
      // Mapear estado oficial de Mercado Pago a estado de tienda
      let storeStatus = 'Pendiente de Pago';
      if (paymentStatus === 'approved') {
        storeStatus = 'Procesando';
      } else if (paymentStatus === 'rejected' || paymentStatus === 'cancelled') {
        storeStatus = 'Cancelado';
      }

      // Validar monto para prevenir discrepancias o fraudes
      try {
        const orderRes = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/orders/${encodeURIComponent(orderId)}`);
        if (orderRes.ok) {
          const orderDoc = await orderRes.json();
          const rawTotal = orderDoc.fields?.total?.integerValue ?? orderDoc.fields?.total?.doubleValue;
          const orderTotal = Number(rawTotal) || 0;
          
          if (paymentStatus === 'approved' && orderTotal > 0) {
            const paidAmount = Number(payment.transaction_amount) || 0;
            // Tolerancia de $2 pesos por redondeo en descuentos
            if (paidAmount < (orderTotal - 2)) {
              console.error(`Alerta de discrepancia de pago: Orden ${orderId} por $${orderTotal}, pero el pago fue de $${paidAmount}`);
              return res.status(200).json({ received: true, warning: 'Payment amount mismatch' });
            }
          }
        }
      } catch (checkErr) {
        console.warn('Aviso verificando total de orden en Firestore:', checkErr.message);
      }

      // Actualizar el documento de la orden en Firestore via REST API
      const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/orders/${encodeURIComponent(orderId)}?updateMask.fieldPaths=status&updateMask.fieldPaths=paymentDetails.status&updateMask.fieldPaths=paymentDetails.paymentId&updateMask.fieldPaths=paymentDetails.dateApproved`;
      
      await fetch(firestoreUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            status: { stringValue: storeStatus },
            paymentDetails: {
              mapValue: {
                fields: {
                  status: { stringValue: paymentStatus },
                  paymentId: { stringValue: String(paymentId) },
                  dateApproved: { stringValue: payment.date_approved || new Date().toISOString() }
                }
              }
            }
          }
        })
      });
    }

    return res.status(200).json({ received: true, status: paymentStatus, orderId });
  } catch (error) {
    console.error('Error general en mercadopago-webhook:', error.message);
    // Siempre responder 200 a Mercado Pago para evitar bucles de reintentos
    return res.status(200).json({ received: true, error: error.message });
  }
}
