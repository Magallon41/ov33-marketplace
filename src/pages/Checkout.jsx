import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useProducts } from '../context/ProductContext';
import { printReceipt, printInvoice } from '../utils/invoice';
import { STATE_CODES_MX } from '../utils/envia';

export function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const { currentUser } = useAuth();
  const { orders = [], addOrder, updateOrderStatus, products = [], getProductStock } = useProducts();
  const navigate = useNavigate();
  const location = useLocation();
  const processedOrderIdRef = useRef(null);

  // Form fields
  const [email, setEmail] = useState(currentUser?.email || '');
  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [address, setAddress] = useState('');
  const [colonia, setColonia] = useState('');
  const [coloniasList, setColoniasList] = useState([]);
  const [isValidatingZip, setIsValidatingZip] = useState(false);
  const [zipValidationStatus, setZipValidationStatus] = useState('idle'); // idle, valid, invalid
  const [zipValidationMsg, setZipValidationMsg] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Jalisco');
  const [zip, setZip] = useState('');
  const [country, setCountry] = useState('México');
  
  // Shipping rates from Envia.com
  const [shippingRates, setShippingRates] = useState([]);
  const [selectedShippingRate, setSelectedShippingRate] = useState(null);
  const [loadingShipping, setLoadingShipping] = useState(false);
  const [shippingError, setShippingError] = useState('');

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState('mercadopago');

  // Tax/Billing fields
  const [requiresInvoice, setRequiresInvoice] = useState(false);
  const [rfc, setRfc] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [regimenFiscal, setRegimenFiscal] = useState('601 - General de Ley Personas Morales');
  const [cfdiUse, setCfdiUse] = useState('G03 - Gastos en general');

  // Discount code
  const [discountCode, setDiscountCode] = useState('');
  const [discountValue, setDiscountValue] = useState(0); // in percent
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  // States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [formError, setFormError] = useState('');

  // Cost calculations
  const hasFreeShipping = subtotal >= 499;
  const rawShippingCost = selectedShippingRate ? selectedShippingRate.price : 150;
  const shippingCost = hasFreeShipping ? 0 : rawShippingCost;
  const discountAmount = Math.round((subtotal * discountValue) / 100);
  const grandTotal = subtotal - discountAmount + shippingCost;

  // Validación de CP con Envia Geocodes API y Cotización en Vivo
  const validatePostalCode = async (postalCode) => {
    const cleanZip = String(postalCode).trim();
    if (!/^\d{5}$/.test(cleanZip)) {
      setZipValidationStatus('idle');
      setColoniasList([]);
      return;
    }

    setIsValidatingZip(true);
    setZipValidationStatus('idle');
    setZipValidationMsg('');

    try {
      const res = await fetch(`/api/validate-zipcode?zipcode=${cleanZip}`);
      const data = await res.json();

      if (data.valid) {
        setZipValidationStatus('valid');
        if (data.state) setState(data.state);
        if (data.city) setCity(data.city);
        if (Array.isArray(data.colonias) && data.colonias.length > 0) {
          setColoniasList(data.colonias);
          setColonia(prev => (prev && data.colonias.includes(prev)) ? prev : data.colonias[0]);
        } else {
          setColoniasList([]);
        }
        setZipValidationMsg(`✓ ${data.city ? `${data.city}, ` : ''}${data.state}`);
        
        // Cotizar de inmediato con los datos validados
        fetchShippingRates(cleanZip, data.stateCode || data.state, data.city, (data.colonias && data.colonias[0]) || colonia);
      } else {
        setZipValidationStatus('invalid');
        setZipValidationMsg(data.message || 'Código postal no encontrado en México.');
        setColoniasList([]);
        setShippingRates([]);
        setShippingError('No hay cobertura de paquetería para este código postal.');
      }
    } catch (err) {
      console.warn('Aviso validando CP con Geocodes:', err);
      fetchShippingRates(cleanZip, state, city, colonia);
    } finally {
      setIsValidatingZip(false);
    }
  };

  useEffect(() => {
    const cleanZip = zip.trim();
    if (cleanZip.length === 5) {
      const timer = setTimeout(() => {
        validatePostalCode(cleanZip);
      }, 350);
      return () => clearTimeout(timer);
    } else {
      setZipValidationStatus('idle');
      setZipValidationMsg('');
      setColoniasList([]);
    }
  }, [zip]);

  useEffect(() => {
    const cleanZip = zip.trim();
    if (cleanZip.length === 5 && zipValidationStatus === 'valid') {
      fetchShippingRates(cleanZip, state, city, colonia);
    }
  }, [items]);

  const fetchShippingRates = async (postalCode, stateName, cityName, coloniaName) => {
    if (!postalCode || postalCode.trim().length < 5) return;
    setLoadingShipping(true);
    setShippingError('');
    try {
      const res = await fetch('/api/shipping-rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: {
            postalCode: postalCode.trim(),
            state: stateName || state,
            city: cityName || city || 'Ciudad',
            district: coloniaName || colonia || 'Centro',
            street: address || 'Domicilio Entrega',
            number: '1'
          },
          items
        })
      });
      const data = await res.json();
      if (res.ok && data.rates && data.rates.length > 0) {
        setShippingRates(data.rates);
        setSelectedShippingRate(prev => {
          if (prev && data.rates.some(r => r.carrier === prev.carrier && r.service === prev.service)) {
            return data.rates.find(r => r.carrier === prev.carrier && r.service === prev.service);
          }
          return data.rates[0];
        });
      } else {
        setShippingRates([]);
        setShippingError(data.message || 'No se obtuvieron tarifas para este código postal.');
      }
    } catch (err) {
      console.error('Error fetching shipping rates:', err);
      setShippingError('No fue posible conectar con el cotizador de envíos.');
    } finally {
      setLoadingShipping(false);
    }
  };

  const sendConfirmationEmail = (order) => {
    if (!order || !order.customerEmail) return;
    const sentKey = `ed_victory_email_sent_${order.id}`;
    if (sessionStorage.getItem(sentKey)) return;
    sessionStorage.setItem(sentKey, 'true');

    fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'order_confirmation',
        to: order.customerEmail,
        order
      })
    }).catch(err => console.warn("Resend email confirmation notice:", err));
  };

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const paymentStatus = queryParams.get('payment_status');
    const orderId = queryParams.get('orderId');

    if (!paymentStatus || !orderId) return;

    // Candado estricto contra bucles de escritura infinitos
    const sessionKey = `ed_victory_processed_${orderId}_${paymentStatus}`;
    if (processedOrderIdRef.current === orderId || sessionStorage.getItem(sessionKey)) {
      return;
    }
    processedOrderIdRef.current = orderId;
    sessionStorage.setItem(sessionKey, 'true');

    // Limpiar de inmediato los parametros de la URL para que no vuelvan a disparar el efecto
    navigate('/checkout', { replace: true });

    if (paymentStatus === 'approved' || paymentStatus === 'success') {
      const storedOrder = localStorage.getItem(`ed_victory_pending_order_${orderId}`);
      let finalOrder = null;
      if (storedOrder) {
        try {
          const parsedOrder = JSON.parse(storedOrder);
          finalOrder = { ...parsedOrder, status: 'Procesando' };
          localStorage.removeItem(`ed_victory_pending_order_${orderId}`);
        } catch (e) {
          console.error("Error restoring pending order:", e);
        }
      } else {
        const existing = orders.find(o => o.id === orderId);
        finalOrder = existing ? { ...existing, status: 'Procesando' } : { 
          id: orderId, 
          status: 'Procesando', 
          customerName: name || 'Cliente ED',
          customerEmail: email || 'cliente@edvictory.com',
          total: grandTotal,
          shippingAddress: { address, colonia, city, state, zip, country }
        };
      }
      clearCart();
      if (finalOrder) {
        setOrderSuccess(finalOrder);
        sendConfirmationEmail(finalOrder);
      }
    } else if (paymentStatus === 'rejected' || paymentStatus === 'failure') {
      setFormError("El pago seguro de Mercado Pago fue rechazado o cancelado. Inténtelo de nuevo o use otro método.");
    } else if (paymentStatus === 'pending') {
      const storedOrder = localStorage.getItem(`ed_victory_pending_order_${orderId}`);
      if (storedOrder) {
        try {
          const parsedOrder = JSON.parse(storedOrder);
          clearCart();
          setOrderSuccess({ ...parsedOrder, status: 'Pendiente de Pago' });
          localStorage.removeItem(`ed_victory_pending_order_${orderId}`);
        } catch (e) {
          console.error(e);
        }
      } else {
        clearCart();
        setOrderSuccess({ id: orderId, status: 'Pendiente de Pago', total: grandTotal });
      }
    }
  }, [location.search]);

  if (items.length === 0 && !orderSuccess) {
    return (
      <main className="pt-[120px] max-w-[1440px] mx-auto px-4 md:px-12 pb-16 md:pb-24 min-h-screen text-center flex flex-col justify-center items-center">
        <span className="material-symbols-outlined text-[48px] text-neutral-300 mb-6">shopping_bag</span>
        <h1 className="font-display-xl text-[24px] uppercase mb-4">Su Bolsa está Vacía</h1>
        <p className="font-body-md text-secondary mb-8">Debe añadir productos a su bolsa de compras para proceder al pago.</p>
        <button 
          onClick={() => navigate('/catalog')} 
          className="bg-black text-white px-8 py-3 uppercase tracking-widest font-button text-button hover:bg-neutral-800 transition-colors"
        >
          Volver a Colecciones
        </button>
      </main>
    );
  }

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    setCouponError('');
    setCouponSuccess('');

    if (!discountCode) return;

    const code = discountCode.trim().toUpperCase();
    if (code === 'OV33NEW' || code === 'OV33BIENVENIDO' || code === 'OV33' || code === 'VICTORY10') {
      setDiscountValue(10);
      setAppliedCoupon(code);
      setCouponSuccess(`Cupón ${code} aplicado (10% de descuento).`);
    } else if (code === 'FLASH20') {
      setDiscountValue(20);
      setAppliedCoupon('FLASH20');
      setCouponSuccess('Cupón FLASH20 aplicado (20% de descuento).');
    } else {
      setCouponError('Cupón inválido o expirado.');
    }
  };

  const handleRemoveCoupon = () => {
    setDiscountValue(0);
    setAppliedCoupon('');
    setDiscountCode('');
    setCouponSuccess('');
  };

  const processOrder = async (payerName, paymentType, selectedInstallments = '1', initialStatus = 'Procesando') => {
    const orderData = {
      customerEmail: email,
      customerName: name,
      customerPhone: phone,
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        category: item.category,
        image: item.image,
        selectedSize: item.selectedSize || "M",
        selectedColor: item.selectedColor,
        selectedColorHex: item.selectedColorHex
      })),
      subtotal,
      discount: discountAmount,
      shippingCost,
      shippingDetails: selectedShippingRate ? {
        carrier: selectedShippingRate.carrier,
        carrierName: selectedShippingRate.carrierName,
        service: selectedShippingRate.service,
        serviceName: selectedShippingRate.serviceName,
        deliveryEstimate: selectedShippingRate.deliveryEstimate,
        price: shippingCost
      } : {
        carrier: 'fedex',
        carrierName: 'FedEx Nacional',
        service: 'ground',
        serviceName: 'Estándar Terrestre',
        deliveryEstimate: '2-4 días hábiles',
        price: shippingCost
      },
      total: grandTotal,
      status: initialStatus,
      shippingAddress: {
        address,
        colonia,
        city,
        state,
        zip,
        country
      },
      billing: requiresInvoice ? {
        rfc: rfc.trim().toUpperCase(),
        razonSocial: razonSocial.trim().toUpperCase(),
        regimenFiscal,
        cfdiUse
      } : null,
      paymentDetails: {
        type: paymentType,
        payer: payerName,
        installments: selectedInstallments
      }
    };

    const createdOrder = await addOrder(orderData);
    
    // Only clear the cart if it's NOT Mercado Pago (since MP clears it on success redirect)
    if (paymentType !== 'Mercado Pago Pro') {
      clearCart();
    }
    
    return createdOrder;
  };

  // Validación de disponibilidad de stock para cada artículo de la bolsa
  const stockIssues = (items || []).map(item => {
    const realProduct = (products && products.length > 0) ? products.find(p => p.id === item.id) : null;
    const availableStock = realProduct ? getProductStock(realProduct, item.selectedSize, item.selectedColor) : 10;
    return {
      ...item,
      availableStock,
      isOutOfStock: availableStock <= 0,
      isOverStock: item.quantity > availableStock
    };
  });
  const hasStockError = stockIssues.some(i => i.isOutOfStock || i.isOverStock);

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setFormError('');

    // 0. Validar inventario
    if (hasStockError) {
      const firstProblem = stockIssues.find(i => i.isOutOfStock || i.isOverStock);
      if (firstProblem) {
        if (firstProblem.isOutOfStock) {
          setFormError(`El producto "${firstProblem.name}" (${firstProblem.selectedSize || 'M'}) está agotado. Por favor retíralo de tu bolsa.`);
        } else {
          setFormError(`El producto "${firstProblem.name}" (${firstProblem.selectedSize || 'M'}) solo cuenta con ${firstProblem.availableStock} pieza(s) disponible(s). Actualmente tienes ${firstProblem.quantity} en tu bolsa.`);
        }
      }
      return;
    }

    if (!email || !name || !address || !city || !zip) {
      setFormError('Por favor complete todos los campos de envío requeridos.');
      return;
    }

    if (zipValidationStatus === 'invalid') {
      setFormError('Por favor ingrese un código postal válido con cobertura en México.');
      return;
    }

    if (requiresInvoice && (!rfc || !razonSocial)) {
      setFormError('Por favor complete la Razón Social y RFC para poder facturar su pedido.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Crear una orden pendiente en la base de datos
      const pendingOrder = await processOrder(name, 'Mercado Pago Pro', '1', 'Pendiente de Pago');
      
      // 2. Guardar en localStorage para restaurar al regresar del redirect
      localStorage.setItem(`ed_victory_pending_order_${pendingOrder.id}`, JSON.stringify(pendingOrder));
      
      // 3. Crear preferencia de Mercado Pago via función serverless de Vercel
      const shippingLabelText = selectedShippingRate 
        ? `Envío ${selectedShippingRate.carrierName} (${selectedShippingRate.serviceName})`
        : 'Envío de Pedido';

      const response = await fetch('/api/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(item => ({
            id: item.id,
            quantity: item.quantity,
            selectedSize: item.selectedSize || "M",
            selectedColor: item.selectedColor || null
          })),
          discountCode: appliedCoupon,
          shippingCost: shippingCost,
          shippingTitle: shippingLabelText,
          orderId: pendingOrder.id,
          email: email
        })
      });
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Error al conectar con la pasarela de pagos');
      }
      
      const { initPoint } = await response.json();
      
      // 4. Redirigir a la pantalla segura de Mercado Pago
      window.location.href = initPoint;
    } catch (err) {
      setFormError(err.message || 'Ocurrió un error al iniciar Mercado Pago. Inténtelo más tarde.');
      setIsSubmitting(false);
    }
  };

  if (orderSuccess) {
    return (
      <main className="pt-[120px] max-w-[800px] mx-auto px-4 md:px-12 pb-16 md:pb-24 min-h-screen flex flex-col justify-center items-center text-center">
        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-200 mb-8 animate-[scaleIn_0.5s_ease]">
          <span className="material-symbols-outlined text-[48px] text-emerald-600">check_circle</span>
        </div>
        
        <span className="font-label-caps text-xs text-amber-600 tracking-[0.25em] uppercase block mb-2">PAGO EXITOSO</span>
        <h1 className="font-display-xl text-[36px] uppercase leading-tight mb-4">¡GRACIAS POR SU COMPRA!</h1>
        <p className="font-body-lg text-secondary max-w-md mx-auto mb-8 font-light">
          Hemos recibido su pedido con éxito. Se ha enviado una confirmación a <strong>{orderSuccess.customerEmail}</strong> con los detalles.
        </p>

        <div className="w-full bg-white border border-neutral-100 p-8 text-left mb-10 space-y-4">
          <div className="flex justify-between border-b border-neutral-100 pb-3">
            <span className="font-label-caps text-[10px] text-neutral-400">NÚMERO DE PEDIDO:</span>
            <span className="font-headline-md text-sm font-bold">{orderSuccess.id}</span>
          </div>
          <div className="flex justify-between border-b border-neutral-100 pb-3">
            <span className="font-label-caps text-[10px] text-neutral-400">TOTAL:</span>
            <span className="font-headline-md text-sm font-bold">${(orderSuccess.total || 0).toLocaleString()} MXN</span>
          </div>
          <div className="flex justify-between border-b border-neutral-100 pb-3">
            <span className="font-label-caps text-[10px] text-neutral-400">DIRECCIÓN DE ENVÍO:</span>
            <span className="font-body-md text-xs text-right text-neutral-600">
              {orderSuccess.shippingAddress?.address || 'Domicilio registrado'}
              {orderSuccess.shippingAddress?.colonia ? `, Col. ${orderSuccess.shippingAddress.colonia}` : ''}
              {orderSuccess.shippingAddress?.city ? `, ${orderSuccess.shippingAddress.city}` : ''}
              {orderSuccess.shippingAddress?.state ? `, ${orderSuccess.shippingAddress.state}` : ''}
              {orderSuccess.shippingAddress?.zip ? ` (CP ${orderSuccess.shippingAddress.zip})` : ''}
            </span>
          </div>
          {orderSuccess.billing && (
            <div className="flex justify-between">
              <span className="font-label-caps text-[10px] text-neutral-400 font-bold text-amber-700">FACTURA SOLICITADA A:</span>
              <span className="font-body-md text-xs text-right text-amber-800 font-bold">
                {orderSuccess.billing.rfc} | {orderSuccess.billing.razonSocial}
              </span>
            </div>
          )}
        </div>

        {/* Action buttons (Including printing) */}
        <div className="flex flex-wrap gap-4 w-full justify-center mb-8">
          <button 
            onClick={() => printReceipt(orderSuccess)}
            className="border border-neutral-300 text-neutral-800 px-6 py-4 font-button text-xs uppercase tracking-widest hover:bg-neutral-50 transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[16px]">print</span>
            IMPRIMIR COMPROBANTE
          </button>
          
          {orderSuccess.billing && (
            <button 
              onClick={() => printInvoice(orderSuccess)}
              className="border border-amber-600 text-amber-700 px-6 py-4 font-button text-xs uppercase tracking-widest hover:bg-amber-50 transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]">receipt</span>
              IMPRIMIR FACTURA CFDI
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Link 
            to={currentUser ? "/account" : "/tracking"}
            className="bg-black text-white px-8 py-4 font-button text-button uppercase tracking-widest hover:bg-neutral-800 transition-colors inline-flex items-center justify-center gap-2 text-center"
          >
            <span className="material-symbols-outlined text-[16px]">local_shipping</span>
            {currentUser ? 'VER MIS PEDIDOS' : 'RASTREAR MI PEDIDO'}
          </Link>
          <Link 
            to="/catalog"
            className="border border-black text-black px-8 py-4 font-button text-button uppercase tracking-widest hover:bg-black hover:text-white transition-colors inline-flex items-center justify-center gap-2 text-center"
          >
            <span className="material-symbols-outlined text-[16px]">storefront</span>
            SEGUIR COMPRANDO
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="pt-[120px] max-w-[1440px] mx-auto px-4 md:px-12 pb-16 md:pb-24 min-h-screen">
      <header className="mb-12">
        <span className="font-label-caps text-xs text-neutral-400 tracking-[0.2em] uppercase block mb-2">PROCESO DE PAGO</span>
        <h1 className="font-display-xl text-display-xl uppercase leading-tight">CHECKOUT</h1>
        <div className="hairline-divider w-full mt-6"></div>
      </header>

      {formError && (
        <div className="bg-red-50 text-red-700 text-xs py-4 px-6 mb-8 border-l-2 border-red-500 font-body-md flex justify-between items-center">
          <span>{formError}</span>
          <button onClick={() => setFormError('')} className="font-bold">×</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        {/* Checkout Forms (8 cols) */}
        <form onSubmit={handlePlaceOrder} className="lg:col-span-7 space-y-12">
          {/* Shipping Address Section */}
          <div className="space-y-6">
            <h2 className="font-display-xl text-[20px] uppercase border-b border-neutral-100 pb-3">1. DIRECCIÓN DE ENVÍO</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative border-b border-neutral-200 focus-within:border-black transition-colors col-span-2 md:col-span-1">
                <label className="block font-label-caps text-[9px] text-neutral-400 tracking-wider uppercase mb-1">Nombre Completo *</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-transparent border-none outline-none py-2 text-sm font-body-md"
                  placeholder="Ej. Jesús Martínez"
                  required
                />
              </div>

              <div className="relative border-b border-neutral-200 focus-within:border-black transition-colors col-span-2 md:col-span-1">
                <label className="block font-label-caps text-[9px] text-neutral-400 tracking-wider uppercase mb-1">Teléfono Móvil (Para paquetería) *</label>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-transparent border-none outline-none py-2 text-sm font-body-md"
                  placeholder="Ej. 33 1234 5678"
                  required
                />
              </div>

              <div className="relative border-b border-neutral-200 focus-within:border-black transition-colors col-span-2">
                <label className="block font-label-caps text-[9px] text-neutral-400 tracking-wider uppercase mb-1">Correo Electrónico (Para confirmación y guía) *</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent border-none outline-none py-2 text-sm font-body-md"
                  placeholder="Ej. jesus@ejemplo.com"
                  required
                />
              </div>

              <div className="relative border-b border-neutral-200 focus-within:border-black transition-colors col-span-2">
                <label className="block font-label-caps text-[9px] text-neutral-400 tracking-wider uppercase mb-1">Calle, Número Exterior e Interior / Depto *</label>
                <input 
                  type="text" 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-transparent border-none outline-none py-2 text-sm font-body-md"
                  placeholder="Ej. Av. de la Reforma 250, Int 4B, Col. Juárez"
                  required
                />
              </div>

              <div className="relative border-b border-neutral-200 focus-within:border-black transition-colors">
                <div className="flex justify-between items-center mb-1">
                  <label className="block font-label-caps text-[9px] text-neutral-400 tracking-wider uppercase">Código Postal (5 dígitos) *</label>
                  {isValidatingZip && (
                    <span className="text-[10px] text-neutral-500 font-label-caps flex items-center gap-1 animate-pulse">
                      <span className="material-symbols-outlined text-[12px] animate-spin">sync</span> Validando...
                    </span>
                  )}
                  {!isValidatingZip && zipValidationStatus === 'valid' && (
                    <span className="text-[10px] text-emerald-600 font-label-caps font-semibold flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[13px]">check_circle</span> Verificado
                    </span>
                  )}
                  {!isValidatingZip && zipValidationStatus === 'invalid' && (
                    <span className="text-[10px] text-rose-600 font-label-caps font-semibold flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[13px]">error</span> Inválido
                    </span>
                  )}
                </div>
                <input 
                  type="text" 
                  maxLength="5"
                  value={zip}
                  onChange={(e) => setZip(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-transparent border-none outline-none py-2 text-sm font-body-md font-bold tracking-wider"
                  placeholder="Ej. 06600"
                  required
                />
                {zipValidationMsg && zipValidationStatus === 'invalid' && (
                  <p className="text-[11px] text-rose-600 mt-1">{zipValidationMsg}</p>
                )}
              </div>

              <div className="relative border-b border-neutral-200 focus-within:border-black transition-colors">
                <label className="block font-label-caps text-[9px] text-neutral-400 tracking-wider uppercase mb-1">Colonia / Asentamiento *</label>
                {coloniasList && coloniasList.length > 0 ? (
                  <select
                    value={colonia}
                    onChange={(e) => {
                      setColonia(e.target.value);
                      fetchShippingRates(zip, state, city, e.target.value);
                    }}
                    className="w-full bg-transparent border-none outline-none py-2 text-sm font-body-md cursor-pointer"
                  >
                    {coloniasList.map((col, idx) => (
                      <option key={idx} value={col}>{col}</option>
                    ))}
                  </select>
                ) : (
                  <input 
                    type="text" 
                    value={colonia}
                    onChange={(e) => setColonia(e.target.value)}
                    className="w-full bg-transparent border-none outline-none py-2 text-sm font-body-md"
                    placeholder="Ej. Juárez / Centro"
                    required
                  />
                )}
              </div>

              <div className="relative border-b border-neutral-200 focus-within:border-black transition-colors">
                <label className="block font-label-caps text-[9px] text-neutral-400 tracking-wider uppercase mb-1">Municipio / Alcaldía / Ciudad *</label>
                <input 
                  type="text" 
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-transparent border-none outline-none py-2 text-sm font-body-md"
                  placeholder="Ej. Cuauhtémoc / Ciudad de México"
                  required
                />
              </div>

              <div className="relative border-b border-neutral-200 focus-within:border-black transition-colors">
                <label className="block font-label-caps text-[9px] text-neutral-400 tracking-wider uppercase mb-1">Estado de la República *</label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full bg-transparent border-none outline-none py-2 text-sm font-body-md cursor-pointer uppercase"
                >
                  {Object.keys(STATE_CODES_MX).map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Shipping Method Section (Envia.com live rates) */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-neutral-100 pb-3 gap-2">
              <h2 className="font-display-xl text-[20px] uppercase flex items-center gap-2">
                2. SERVICIO DE ENVÍO & LOGÍSTICA
              </h2>
              <span className="font-label-caps text-[9px] text-neutral-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                ENVIA.COM MULTI-CARRIER
              </span>
            </div>

            {loadingShipping ? (
              <div className="p-8 border border-neutral-200 bg-neutral-50 text-center space-y-3 animate-[pulse_1.5s_infinite]">
                <span className="material-symbols-outlined text-[32px] text-amber-600 animate-spin">sync</span>
                <p className="font-label-caps text-xs text-neutral-700 uppercase tracking-wider">
                  Cotizando paqueterías en tiempo real (FedEx, DHL, Estafeta, Paquetexpress)...
                </p>
                <p className="font-body-md text-[11px] text-neutral-400">Calculando mejor ruta para CP {zip} ({state})</p>
              </div>
            ) : shippingRates.length > 0 ? (
              <div className="space-y-3">
                <p className="font-body-md text-xs text-neutral-500 mb-4">
                  Seleccione la paquetería y modalidad de entrega preferida para su pedido:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {shippingRates.map((rate, idx) => {
                    const isSelected = selectedShippingRate?.carrier === rate.carrier && selectedShippingRate?.service === rate.service;
                    const effectivePrice = hasFreeShipping ? 0 : rate.price;

                    return (
                      <button
                        key={`${rate.carrier}-${rate.service}-${idx}`}
                        type="button"
                        onClick={() => setSelectedShippingRate(rate)}
                        className={`flex flex-col text-left p-4 border transition-all relative ${
                          isSelected
                            ? 'border-black bg-neutral-50 ring-1 ring-black shadow-xs'
                            : 'border-neutral-200 hover:border-neutral-400 bg-white'
                        }`}
                      >
                        <div className="flex justify-between items-start w-full mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-label-caps text-xs font-bold uppercase tracking-wider text-black">
                              {rate.carrierName}
                            </span>
                          </div>
                          <div className="text-right">
                            {hasFreeShipping ? (
                              <div className="flex flex-col items-end">
                                <span className="font-label-caps text-xs text-emerald-700 font-bold uppercase">GRATIS</span>
                                <span className="text-[10px] text-neutral-400 line-through">${rate.price} MXN</span>
                              </div>
                            ) : (
                              <span className="font-headline-md text-sm font-bold text-black">
                                ${rate.price.toLocaleString()} MXN
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="font-body-md text-xs text-neutral-700 font-medium">
                          {rate.serviceName}
                        </p>

                        <div className="flex items-center gap-1.5 mt-2 text-[11px] text-neutral-500">
                          <span className="material-symbols-outlined text-[14px] text-amber-600">schedule</span>
                          <span>Entrega estimada: <strong>{rate.deliveryEstimate}</strong></span>
                        </div>

                        {isSelected && (
                          <span className="absolute top-2 right-2 w-3.5 h-3.5 rounded-full bg-black flex items-center justify-center text-white text-[9px] font-bold">
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {hasFreeShipping && (
                  <div className="bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 font-body-md flex items-center gap-2 mt-3">
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                    <span>¡Felicidades! Su pedido califica para <strong>Envío Gratuito</strong> a todo México (compras +$2,000 MXN).</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 border border-dashed border-neutral-300 bg-[#fdfdfd] text-center space-y-2">
                <span className="material-symbols-outlined text-[28px] text-neutral-400">local_shipping</span>
                <p className="font-body-md text-xs text-neutral-600">
                  {zip.length < 5 
                    ? 'Ingrese su Código Postal de 5 dígitos para calcular las opciones de paquetería disponibles.'
                    : (shippingError || 'Tarifa estándar nacional calculada.')}
                </p>
                {zip.length === 5 && (
                  <button 
                    type="button" 
                    onClick={() => fetchShippingRates(zip, state, city)}
                    className="font-label-caps text-[10px] border border-black px-4 py-2 uppercase tracking-widest hover:bg-black hover:text-white transition-colors mt-2"
                  >
                    Recalcular Paqueterías
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Payment Section */}
          <div className="space-y-6">
            <h2 className="font-display-xl text-[20px] uppercase border-b border-neutral-100 pb-3">3. MÉTODO DE PAGO SEGURO</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option A: Mercado Pago */}
              <button
                type="button"
                onClick={() => setPaymentMethod('mercadopago')}
                className={`flex flex-col text-left p-5 border transition-all rounded-none relative outline-none focus:outline-none ${
                  paymentMethod === 'mercadopago'
                    ? 'border-amber-600 bg-amber-50/10 ring-1 ring-amber-600'
                    : 'border-neutral-200 hover:border-neutral-400 bg-white'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-neutral-800">payments</span>
                    <strong className="font-label-caps text-xs text-neutral-900 tracking-wider">MERCADO PAGO</strong>
                  </div>
                  <span className="text-[10px] bg-[#009EE3]/15 text-[#009EE3] px-2 py-0.5 rounded font-bold uppercase tracking-widest font-label-caps">
                    PRO
                  </span>
                </div>
                <p className="font-body-md text-[11px] text-neutral-500 leading-normal mb-2">
                  Paga con Tarjeta (hasta 12 MSI), SPEI interbancario o efectivo en OXXO de manera 100% segura.
                </p>
                <div className="flex flex-wrap gap-2.5 mt-2 opacity-80">
                  <span className="text-[9px] font-label-caps bg-neutral-100 text-neutral-600 px-1.5 py-0.5 uppercase">Tarjeta</span>
                  <span className="text-[9px] font-label-caps bg-emerald-50 text-emerald-700 px-1.5 py-0.5 font-bold uppercase">MSI</span>
                  <span className="text-[9px] font-label-caps bg-neutral-100 text-neutral-600 px-1.5 py-0.5 uppercase">SPEI</span>
                  <span className="text-[9px] font-label-caps bg-neutral-100 text-neutral-600 px-1.5 py-0.5 uppercase">OXXO</span>
                </div>
                
                {paymentMethod === 'mercadopago' && (
                  <span className="absolute top-2 right-2 w-3.5 h-3.5 rounded-full bg-amber-600 flex items-center justify-center text-white text-[9px] font-bold">
                    ✓
                  </span>
                )}
              </button>

            </div>

            {/* Mercado Pago Info Box */}
            <div className="bg-neutral-50 p-6 border border-neutral-200 animate-[fadeIn_0.3s_ease] rounded-none flex items-start gap-4">
              <span className="material-symbols-outlined text-[32px] text-[#009EE3] shrink-0 mt-0.5">lock_open_right</span>
              <div>
                <h4 className="font-label-caps text-[11px] text-neutral-800 uppercase font-bold tracking-wider mb-1.5 flex items-center gap-1.5">
                  MERCADO PAGO CHECKOUT PRO
                </h4>
                <p className="font-body-md text-xs text-neutral-500 leading-relaxed font-light">
                  Al confirmar tu pedido, se abrirá la pasarela segura e interactiva de Mercado Pago. Podrás pagar mediante tu cuenta, transferencia SPEI, efectivo OXXO o tarjetas de crédito a meses sin intereses.
                </p>
              </div>
            </div>
          </div>

          {/* Billing Section (Mexican CFDI) */}
          <div className="space-y-6 pt-4">
            <div className="flex items-center gap-3">
              <input 
                type="checkbox" 
                id="requiresInvoice" 
                checked={requiresInvoice}
                onChange={(e) => setRequiresInvoice(e.target.checked)}
                className="w-4 h-4 accent-black cursor-pointer"
              />
              <label htmlFor="requiresInvoice" className="font-label-caps text-xs text-neutral-800 tracking-wider cursor-pointer select-none">
                ¿Requiere Factura Fiscal CFDI (México)?
              </label>
            </div>

            {requiresInvoice && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#fafafa] p-6 border border-neutral-100 animate-[fadeIn_0.3s_ease] rounded-none">
                <div className="relative border-b border-neutral-200 focus-within:border-black transition-colors col-span-2 md:col-span-1">
                  <label className="block font-label-caps text-[9px] text-neutral-400 tracking-wider uppercase mb-1">Razón Social *</label>
                  <input 
                    type="text" 
                    value={razonSocial}
                    onChange={(e) => setRazonSocial(e.target.value)}
                    className="w-full bg-transparent border-none outline-none py-2 text-sm font-body-md uppercase"
                    placeholder="Ej. COCA COLA S.A. DE C.V."
                    required={requiresInvoice}
                  />
                </div>

                <div className="relative border-b border-neutral-200 focus-within:border-black transition-colors col-span-2 md:col-span-1">
                  <label className="block font-label-caps text-[9px] text-neutral-400 tracking-wider uppercase mb-1">RFC Receptor *</label>
                  <input 
                    type="text" 
                    value={rfc}
                    maxLength="13"
                    onChange={(e) => setRfc(e.target.value)}
                    className="w-full bg-transparent border-none outline-none py-2 text-sm font-body-md uppercase font-bold"
                    placeholder="Ej. EVS2601017A4"
                    required={requiresInvoice}
                  />
                </div>

                <div>
                  <label className="block font-label-caps text-[9px] text-neutral-400 tracking-wider uppercase mb-2">Régimen Fiscal *</label>
                  <select
                    value={regimenFiscal}
                    onChange={(e) => setRegimenFiscal(e.target.value)}
                    className="w-full border border-neutral-200 py-3 px-3 font-label-caps text-[10px] focus:border-black outline-none bg-white uppercase"
                  >
                    <option value="601 - General de Ley Personas Morales">601 - General de Ley Personas Morales</option>
                    <option value="605 - Sueldos y Salarios e Ingresos Asimilados a Salarios">605 - Sueldos y Salarios</option>
                    <option value="612 - Personas Físicas con Actividades Empresariales y Profesionales">612 - Personas Físicas Act. Empresariales</option>
                    <option value="626 - Régimen Simplificado de Confianza (RESICO)">626 - RESICO (Simplificado)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-label-caps text-[9px] text-neutral-400 tracking-wider uppercase mb-2">Uso del CFDI *</label>
                  <select
                    value={cfdiUse}
                    onChange={(e) => setCfdiUse(e.target.value)}
                    className="w-full border border-neutral-200 py-3 px-3 font-label-caps text-[10px] focus:border-black outline-none bg-white uppercase"
                  >
                    <option value="G03 - Gastos en general">G03 - Gastos en general</option>
                    <option value="D01 - Honorarios médicos, dentales y gastos hospitalarios">D01 - Honorarios médicos</option>
                    <option value="S01 - Sin efectos fiscales">S01 - Sin efectos fiscales</option>
                    <option value="CP01 - Pagos">CP01 - Pagos</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting || hasStockError}
            className={`w-full py-5 font-button text-button uppercase tracking-widest transition-colors shadow-md flex items-center justify-center gap-3 ${
              hasStockError
                ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                : 'bg-black text-white hover:bg-neutral-800 disabled:bg-neutral-400'
            }`}
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin border-2 border-t-transparent border-white w-4 h-4 rounded-full"></span>
                PROCESANDO PAGO...
              </>
            ) : hasStockError ? (
              'STOCK INSUFICIENTE EN BOLSA'
            ) : (
              `REALIZAR PEDIDO (${(grandTotal).toLocaleString()} MXN)`
            )}
          </button>
        </form>

        {/* Order Summary (5 cols) */}
        <div className="lg:col-span-5">
          <div className="bg-[#fcfcfc] border border-neutral-100 p-8 sticky top-[140px] shadow-sm">
            <h3 className="font-display-xl text-[18px] uppercase mb-6 pb-2 border-b border-neutral-200">Resumen del Pedido</h3>
            
            {/* Items list */}
            <div className="space-y-6 max-h-[300px] overflow-y-auto pr-2 hide-scrollbar mb-8 border-b border-neutral-200 pb-6">
              {stockIssues.map(item => (
                <div key={`${item.id}-${item.selectedSize || ''}-${item.selectedColor || ''}`} className="flex gap-4">
                  <div className="w-14 aspect-[3/4] bg-neutral-100 shrink-0 border border-neutral-200 relative">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    {item.isOutOfStock && (
                      <span className="absolute inset-0 bg-black/60 text-white font-label-caps text-[7px] uppercase flex items-center justify-center text-center p-0.5">
                        Agotado
                      </span>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <h4 className="font-headline-md text-xs uppercase text-neutral-800 leading-tight">{item.name}</h4>
                    <span className="font-label-caps text-[9px] text-neutral-400 mt-1">
                      TALLA: {item.selectedSize || "M"} | CANT: {item.quantity}
                    </span>
                    {item.isOutOfStock ? (
                      <span className="text-red-600 font-bold text-[9px] uppercase mt-0.5">Agotado en existencia</span>
                    ) : item.isOverStock ? (
                      <span className="text-amber-700 font-bold text-[9px] uppercase mt-0.5">Solo quedan {item.availableStock} piezas</span>
                    ) : null}
                  </div>
                  <div className="text-right flex items-center">
                    <span className="font-body-md text-xs font-bold">${item.price} MXN</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Promo Code Form */}
            <div className="mb-8 border-b border-neutral-200 pb-6">
              <span className="block font-label-caps text-[9px] text-neutral-400 mb-2 uppercase tracking-wider">CÓDIGO DE DESCUENTO</span>
              {appliedCoupon ? (
                <div className="flex justify-between items-center bg-emerald-50 border border-emerald-200 px-4 py-2 text-xs text-emerald-800 font-body-md">
                  <span>Cupón <strong>{appliedCoupon}</strong> (-10%)</span>
                  <button type="button" onClick={handleRemoveCoupon} className="font-bold text-emerald-950 hover:underline">Eliminar</button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input 
                    type="text" 
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    className="flex-1 bg-white border border-neutral-300 py-2.5 px-3 font-label-caps text-xs focus:border-black outline-none uppercase"
                    placeholder="INGRESAR CÓDIGO"
                  />
                  <button 
                    type="submit" 
                    className="bg-black text-white px-4 py-2.5 font-button text-xs uppercase hover:bg-neutral-800 transition-colors"
                  >
                    APLICAR
                  </button>
                </form>
              )}
              {couponError && <p className="text-[11px] text-red-600 mt-2 font-body-md">{couponError}</p>}
              {couponSuccess && <p className="text-[11px] text-emerald-600 mt-2 font-body-md">{couponSuccess}</p>}
            </div>

            {/* Calculations */}
            <div className="space-y-4 font-body-md text-sm border-b border-neutral-200 pb-6 mb-6">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal</span>
                <span>${subtotal.toLocaleString()} MXN</span>
              </div>
              
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Descuento ({discountValue}%)</span>
                  <span>-${discountAmount.toLocaleString()} MXN</span>
                </div>
              )}

              <div className="flex justify-between items-start text-neutral-600">
                <div>
                  <span className="block">Envío</span>
                  {selectedShippingRate && (
                    <span className="text-[10px] text-neutral-400 block font-label-caps">
                      {selectedShippingRate.carrierName} ({selectedShippingRate.deliveryEstimate})
                    </span>
                  )}
                </div>
                <div>
                  {shippingCost === 0 ? (
                    <span className="text-emerald-600 font-bold uppercase text-xs">Gratis</span>
                  ) : (
                    <span>${shippingCost.toLocaleString()} MXN</span>
                  )}
                </div>
              </div>
              
              {!hasFreeShipping && (
                <p className="text-[10px] text-neutral-400 text-right mt-1 italic">
                  Añada ${(2000 - subtotal).toLocaleString()} MXN más para obtener envío exprés gratis.
                </p>
              )}
            </div>

            {/* Grand Total */}
            <div className="flex justify-between items-end">
              <span className="font-label-caps text-label-caps text-neutral-700">Total a Pagar</span>
              <div className="text-right">
                <span className="font-headline-md text-[22px] font-bold">${grandTotal.toLocaleString()} MXN</span>
                <span className="block text-[10px] text-neutral-400 uppercase tracking-widest mt-1">IVA Incluido</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
