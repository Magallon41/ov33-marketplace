/**
 * Utility to generate a beautifully structured, corporate, print-friendly
 * layout for invoices and receipts, invoking the browser's native print-to-PDF.
 */

export function printReceipt(order) {
  const printWindow = window.open('', '_blank', 'width=800,height=900');
  if (!printWindow) {
    alert('Por favor permita las ventanas emergentes (popups) para descargar su comprobante.');
    return;
  }

  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding: 12px 0; border-b: 1px solid #eee;">
        <strong style="text-transform: uppercase; font-size: 11px;">${item.name}</strong><br>
        <span style="font-size: 9px; color: #666; text-transform: uppercase;">Categoría: ${item.category} | Talla: ${item.selectedSize || 'M'}</span>
      </td>
      <td style="padding: 12px 0; border-b: 1px solid #eee; text-align: center; font-size: 11px;">${item.quantity}</td>
      <td style="padding: 12px 0; border-b: 1px solid #eee; text-align: right; font-size: 11px;">$${item.price} MXN</td>
      <td style="padding: 12px 0; border-b: 1px solid #eee; text-align: right; font-size: 11px; font-weight: bold;">$${(Number(item.price.replace(/,/g, '')) * item.quantity).toLocaleString()} MXN</td>
    </tr>
  `).join('');

  const html = `
    <!doctype html>
    <html>
    <head>
      <title>Comprobante de Compra - ${order.id}</title>
      <style>
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          color: #1a1a1a;
          margin: 40px;
          line-height: 1.5;
        }
        .header {
          display: flex;
          justify-content: space-between;
          border-bottom: 2px solid #000;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .logo {
          font-family: Georgia, serif;
          font-size: 24px;
          font-weight: bold;
          letter-spacing: 0.1em;
        }
        .info-grid {
          display: flex;
          justify-content: space-between;
          margin-bottom: 40px;
          font-size: 11px;
        }
        .info-col {
          width: 30%;
        }
        .info-title {
          font-weight: bold;
          font-size: 9px;
          color: #888;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 5px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 40px;
        }
        th {
          font-size: 9px;
          color: #888;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          border-bottom: 1px solid #000;
          padding-bottom: 10px;
          text-align: left;
        }
        .totals {
          margin-left: auto;
          width: 40%;
          font-size: 12px;
        }
        .totals-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #eee;
        }
        .totals-grand {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-top: 1px solid #000;
          font-weight: bold;
          font-size: 15px;
        }
        .footer {
          margin-top: 60px;
          text-align: center;
          font-size: 9px;
          color: #888;
          border-top: 1px solid #eee;
          padding-top: 20px;
          text-transform: uppercase;
          letter-spacing: 0.15em;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="logo">OV33 MARKET</div>
          <span style="font-size: 9px; color: #ff5000; font-weight: bold; letter-spacing: 0.15em;">MARKETPLACE MULTIMARCA</span>
        </div>
        <div style="text-align: right;">
          <h2 style="margin: 0; font-size: 18px; letter-spacing: 0.05em; text-transform: uppercase;">Nota de Compra</h2>
          <span style="font-size: 11px; font-weight: bold; color: #ff5000;">${order.id}</span>
        </div>
      </div>

      <div class="info-grid">
        <div class="info-col">
          <div class="info-title">EMISOR</div>
          <strong>OV33 MARKETPLACE MÉXICO S.A.P.I. DE C.V.</strong><br>
          Av. Chapultepec 220<br>
          Guadalajara, Jalisco, CP 44160<br>
          México
        </div>
        <div class="info-col">
          <div class="info-title">CLIENTE</div>
          <strong>${order.customerName}</strong><br>
          ${order.customerEmail}<br>
          Tel: (Simulado)
        </div>
        <div class="info-col">
          <div class="info-title">ENVÍO A</div>
          ${order.shippingAddress.address}<br>
          ${order.shippingAddress.city}, CP ${order.shippingAddress.zip}<br>
          ${order.shippingAddress.country}
        </div>
      </div>

      <div class="info-grid" style="margin-top: -20px; margin-bottom: 30px;">
        <div class="info-col">
          <div class="info-title">FECHA DE EMISIÓN</div>
          ${new Date(order.createdAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
        <div class="info-col">
          <div class="info-title">MÉTODO DE PAGO</div>
          Tarjeta Bancaria (Simulado)
        </div>
        <div class="info-col">
          <div class="info-title">ESTADO DE TRANSACCIÓN</div>
          PAGADO
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 50%;">ARTÍCULO</th>
            <th style="width: 10%; text-align: center;">CANT</th>
            <th style="width: 20%; text-align: right;">PRECIO UNITARIO</th>
            <th style="width: 20%; text-align: right;">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div class="totals">
        <div class="totals-row">
          <span>Subtotal</span>
          <span>$${order.subtotal.toLocaleString()} MXN</span>
        </div>
        ${order.discount > 0 ? `
          <div class="totals-row" style="color: #10b981; font-weight: bold;">
            <span>Descuento Aplicado</span>
            <span>-$${order.discount.toLocaleString()} MXN</span>
          </div>
        ` : ''}
        <div class="totals-row">
          <span>Envío Exprés</span>
          <span>${order.total - order.subtotal + order.discount === 0 ? 'Gratis' : `$${(order.total - order.subtotal + order.discount).toLocaleString()} MXN`}</span>
        </div>
        <div class="totals-grand">
          <span>Total Pagado</span>
          <span>$${order.total.toLocaleString()} MXN</span>
        </div>
      </div>

      <div class="footer">
        Gracias por tu compra en OV33 Marketplace.<br>
        Este documento sirve como comprobante simplificado de compra.
      </div>

      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

export function printInvoice(order) {
  if (!order.billing) {
    alert('Este pedido no fue registrado con requerimiento de factura fiscal.');
    return;
  }

  const printWindow = window.open('', '_blank', 'width=800,height=900');
  if (!printWindow) {
    alert('Por favor permita las ventanas emergentes (popups) para descargar su factura fiscal.');
    return;
  }

  const itemsHtml = order.items.map(item => {
    const unitPrice = Number(item.price.replace(/,/g, ''));
    // CFDI invoices represent amounts before tax
    const priceBeforeTax = unitPrice / 1.16;
    const subtotalBeforeTax = priceBeforeTax * item.quantity;
    
    return `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-size: 10px;">
          <strong>53101602 - ${item.name}</strong><br>
          <span style="font-size: 9px; color: #666; text-transform: uppercase;">TALLA: ${item.selectedSize || 'M'} | Confección Algodón Premium</span>
        </td>
        <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: center; font-size: 10px;">${item.quantity}</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: center; font-size: 10px;">H87 - Pieza</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right; font-size: 10px;">$${priceBeforeTax.toFixed(2)}</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right; font-size: 10px;">$${subtotalBeforeTax.toFixed(2)}</td>
      </tr>
    `;
  }).join('');

  // Tax calculations
  const totalWithTax = order.total;
  const subtotalBeforeTaxTotal = totalWithTax / 1.16;
  const taxAmount = totalWithTax - subtotalBeforeTaxTotal;

  const html = `
    <!doctype html>
    <html>
    <head>
      <title>Factura Fiscal CFDI - ${order.id}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          color: #333;
          margin: 30px;
          font-size: 11px;
          line-height: 1.4;
        }
        .invoice-box {
          border: 1px solid #ccc;
          padding: 20px;
        }
        .header-table {
          width: 100%;
          border-bottom: 2px solid #555;
          padding-bottom: 15px;
          margin-bottom: 20px;
        }
        .section-title {
          font-size: 9px;
          background: #f0f0f0;
          font-weight: bold;
          padding: 4px 8px;
          text-transform: uppercase;
          margin: 15px 0 8px 0;
          letter-spacing: 0.05em;
        }
        .details-table {
          width: 100%;
          margin-bottom: 15px;
        }
        .details-table td {
          vertical-align: top;
          padding: 3px 0;
        }
        table.items-table {
          width: 100%;
          border-collapse: collapse;
        }
        table.items-table th {
          font-size: 9px;
          background: #333;
          color: #white;
          padding: 6px;
          text-align: left;
        }
        .totals-table {
          width: 40%;
          margin-left: auto;
          margin-top: 15px;
          border-collapse: collapse;
        }
        .totals-table td {
          padding: 5px;
          border-bottom: 1px solid #eee;
        }
        .sat-info {
          display: flex;
          gap: 20px;
          margin-top: 25px;
          border: 1px solid #ddd;
          padding: 12px;
          background: #fafafa;
          font-size: 8px;
          word-break: break-all;
        }
        .qr-mock {
          width: 80px;
          height: 80px;
          background: #333;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          text-align: center;
          font-size: 9px;
          shrink: 0;
        }
      </style>
    </head>
    <body>
      <div class="invoice-box">
        <table class="header-table">
          <tr>
            <td style="width: 50%;">
              <span style="font-size: 22px; font-weight: bold; font-family: sans-serif; color: #ff5000;">OV33 MARKET</span><br>
              <span style="font-size: 8px; color: #666; letter-spacing: 0.1em;">OV33 MARKETPLACE MÉXICO S.A.P.I. DE C.V.</span><br>
              <span style="font-size: 9px;">OMM2601017A4</span><br>
              <span style="font-size: 9px; color: #666;">Régimen Fiscal: 601 - General de Ley Personas Morales</span>
            </td>
            <td style="text-align: right; width: 50%; font-size: 10px;">
              <strong style="font-size: 13px; color: #a1783b;">FACTURA DIGITAL (CFDI v4.0)</strong><br>
              <strong>Folio Fiscal UUID:</strong><br>
              <span style="font-size: 9px; color: #555;">ED7B8391-2947-49F1-8B0C-1A87D0925BC8</span><br>
              <strong>No. de Serie del CSD:</strong> 00001000000508928174<br>
              <strong>Fecha y Hora de Certificación:</strong> ${new Date(order.createdAt).toISOString()}<br>
              <strong>Lugar y Fecha de Emisión:</strong> CP 11560, ${new Date(order.createdAt).toLocaleDateString('es-MX')}
            </td>
          </tr>
        </table>

        <div class="section-title">DATOS DEL RECEPTOR</div>
        <table class="details-table">
          <tr>
            <td style="width: 50%;">
              <strong>Razón Social:</strong> ${order.billing.razonSocial.toUpperCase()}<br>
              <strong>RFC:</strong> ${order.billing.rfc.toUpperCase()}<br>
              <strong>Domicilio Fiscal CP:</strong> ${order.shippingAddress.zip}
            </td>
            <td style="width: 50%;">
              <strong>Régimen Fiscal Receptor:</strong> ${order.billing.regimenFiscal}<br>
              <strong>Uso del CFDI:</strong> ${order.billing.cfdiUse}<br>
              <strong>Tipo de Comprobante:</strong> I - Ingreso
            </td>
          </tr>
        </table>

        <div class="section-title">CONCEPTOS FACTURADOS</div>
        <table class="items-table">
          <thead>
            <tr style="background-color: #333; color: white;">
              <th style="padding: 6px; color: white;">Clave Prod / Serv - Descripción</th>
              <th style="padding: 6px; color: white; text-align: center;">Cantidad</th>
              <th style="padding: 6px; color: white; text-align: center;">Clave Unidad</th>
              <th style="padding: 6px; color: white; text-align: right;">Valor Unitario</th>
              <th style="padding: 6px; color: white; text-align: right;">Importe Neto</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <table class="totals-table">
          <tr>
            <td><strong>Subtotal Neto</strong></td>
            <td style="text-align: right;">$${subtotalBeforeTaxTotal.toFixed(2)} MXN</td>
          </tr>
          ${order.discount > 0 ? `
            <tr>
              <td style="color: #10b981;"><strong>Descuento (-10%)</strong></td>
              <td style="text-align: right; color: #10b981;">-$${(order.discount / 1.16).toFixed(2)} MXN</td>
            </tr>
          ` : ''}
          <tr>
            <td><strong>IVA Trasladado (16.00%)</strong></td>
            <td style="text-align: right;">$${taxAmount.toFixed(2)} MXN</td>
          </tr>
          <tr style="font-size: 13px; font-weight: bold; background: #fafafa;">
            <td><strong>Total Facturado</strong></td>
            <td style="text-align: right; border-top: 1px solid #333;">$${totalWithTax.toLocaleString()}.00 MXN</td>
          </tr>
        </table>

        <div class="sat-info">
          <div class="qr-mock">
            SAT<br>CFDI 4.0<br>QR MOCK
          </div>
          <div>
            <strong>Sello Digital del Emisor:</strong><br>
            eVT/y98uJn71A/aXyB273oKda927sJn9287Hds8271has97271haJhs8210asJka89281aHjshka982Hja871aHJs719287haJks891827hAJs89187aHJk==<br>
            <strong>Sello Digital del SAT:</strong><br>
            kJas89187aHkjas89182haJska8271haKjhas98271hAJs819287aHjshka98271hAJsa92871haJks891827hAJs89187aHJkja89182haJska8271ha==<br>
            <strong>Cadena Original del Complemento de Certificación Digital del SAT:</strong><br>
            ||1.1|ED7B8391-2947-49F1-8B0C-1A87D0925BC8|${new Date(order.createdAt).toISOString()}|EVS2601017A4|eVT/y98uJn71A/aXyB273oKda927sJn9287Hds8271has97271haJhs8210asJka89281aHjshka982Hja871aHJs719287haJks891827hAJs89187aHJk==|00001000000508928174||
          </div>
        </div>

        <p style="text-align: center; font-size: 8px; color: #888; margin-top: 20px; text-transform: uppercase;">
          Este documento es una representación impresa de un CFDI simulado.
        </p>
      </div>

      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
