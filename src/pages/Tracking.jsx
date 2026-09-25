import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';

export function Tracking() {
  const { orders, fetchOrderById } = useProducts();
  const navigate = useNavigate();

  const [orderId, setOrderId] = useState('');
  const [email, setEmail] = useState('');
  const [searched, setSearched] = useState(false);
  const [foundOrder, setFoundOrder] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [liveTracking, setLiveTracking] = useState(null);
  const [loadingLiveTracking, setLoadingLiveTracking] = useState(false);

  const fetchLiveTracking = async (trackingNum) => {
    if (!trackingNum) return;
    setLoadingLiveTracking(true);
    try {
      const res = await fetch(`/api/track-shipment?trackingNumber=${encodeURIComponent(trackingNum)}`);
      const data = await res.json();
      if (res.ok && data.found) {
        setLiveTracking(data);
      } else {
        setLiveTracking(null);
      }
    } catch (err) {
      console.error('Error fetching live tracking:', err);
      setLiveTracking(null);
    } finally {
      setLoadingLiveTracking(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSearched(true);
    setFoundOrder(null);
    setLiveTracking(null);

    if (!orderId || !email) {
      setErrorMsg('Por favor complete todos los campos.');
      return;
    }

    let order = orders.find(
      o => o.id?.toLowerCase() === orderId.trim().toLowerCase() && 
      o.customerEmail?.toLowerCase() === email.trim().toLowerCase()
    );

    if (!order && fetchOrderById) {
      const remoteOrder = await fetchOrderById(orderId.trim());
      if (remoteOrder && remoteOrder.customerEmail?.toLowerCase() === email.trim().toLowerCase()) {
        order = remoteOrder;
      }
    }

    if (order) {
      setFoundOrder(order);
      if (order.trackingNumber) {
        fetchLiveTracking(order.trackingNumber);
      }
    } else {
      setErrorMsg('No se encontró ningún pedido que coincida con ese ID y correo electrónico.');
    }
  };

  // Helper to compute tracking dates relative to order creation
  const getEventTime = (baseIsoString, hoursToAdd) => {
    const d = new Date(baseIsoString);
    d.setHours(d.getHours() + hoursToAdd);
    return d.toLocaleString('es-MX', { 
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
    });
  };

  return (
    <main className="pt-[120px] max-w-[900px] mx-auto px-4 md:px-12 pb-16 md:pb-24 min-h-screen">
      <header className="mb-12 text-center">
        <span className="font-label-caps text-xs text-neutral-400 tracking-[0.2em] uppercase block mb-2">OPERACIONES EN LÍNEA</span>
        <h1 className="font-display-xl text-[36px] uppercase leading-tight">Rastreo de Pedido</h1>
        <div className="hairline-divider w-24 mx-auto mt-6"></div>
      </header>

      {/* Search form Card */}
      {!foundOrder && (
        <div className="max-w-[500px] mx-auto bg-white p-10 border border-neutral-100 shadow-sm">
          <p className="font-body-md text-xs text-secondary text-center mb-8">
            Ingrese el número de pedido y el correo electrónico con el que realizó su compra para consultar el estado del envío en tiempo real.
          </p>

          {errorMsg && (
            <div className="bg-red-50 text-red-700 text-xs py-3 px-4 mb-6 border-l-2 border-red-500 font-body-md">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSearch} className="space-y-6">
            <div className="relative border-b border-neutral-200 focus-within:border-black transition-colors">
              <label className="block font-label-caps text-[9px] text-neutral-400 tracking-wider uppercase mb-1">NÚMERO DE PEDIDO</label>
              <input 
                type="text" 
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="w-full bg-transparent border-none outline-none py-2 text-sm font-bold uppercase tracking-wider font-body-md"
                placeholder="EJ. ORD-1234"
                required
              />
            </div>

            <div className="relative border-b border-neutral-200 focus-within:border-black transition-colors">
              <label className="block font-label-caps text-[9px] text-neutral-400 tracking-wider uppercase mb-1">CORREO ELECTRÓNICO</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent border-none outline-none py-2 text-sm font-body-md"
                placeholder="EJ. CLIENTE@EDVICTORY.COM"
                required
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-black text-white py-4 font-button text-button uppercase tracking-widest hover:bg-neutral-800 transition-colors shadow-sm"
            >
              RASTREAR PEDIDO
            </button>
          </form>
        </div>
      )}

      {/* Tracking Results Area */}
      {foundOrder && (
        <div className="space-y-12 animate-[fadeIn_0.4s_ease]">
          {/* Back button */}
          <button 
            onClick={() => { setFoundOrder(null); setSearched(false); setLiveTracking(null); }}
            className="font-label-caps text-label-caps flex items-center hover:text-amber-600 transition-colors bg-transparent border-none cursor-pointer outline-none"
          >
            <span className="material-symbols-outlined mr-2">arrow_back</span>
            BUSCAR OTRO PEDIDO
          </button>

          {/* Tracking Summary Block */}
          <div className="bg-white border border-neutral-150 p-8 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <span className="font-label-caps text-[10px] text-neutral-400 uppercase tracking-widest block mb-1">PEDIDO CONSULTADO</span>
              <h2 className="font-headline-md text-xl font-bold">{foundOrder.id}</h2>
              <span className="font-body-md text-xs text-neutral-400 block mt-1">Socio: {foundOrder.customerName} ({foundOrder.customerEmail})</span>
            </div>
            
            <div className="text-left md:text-right">
              <span className="font-label-caps text-[10px] text-neutral-400 uppercase tracking-widest block mb-1">ESTADO DEL ENVÍO</span>
              <span className={`inline-block font-label-caps text-[10px] px-3.5 py-1 font-bold tracking-widest uppercase rounded ${
                foundOrder.status === 'Entregado' 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {liveTracking?.status || foundOrder.status}
              </span>
            </div>

            <div className="text-left md:text-right">
              <span className="font-label-caps text-[10px] text-neutral-400 uppercase tracking-widest block mb-1">FECHA DE COMPRA</span>
              <span className="font-body-md text-sm text-neutral-800">
                {new Date(foundOrder.createdAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
          </div>

          {/* Graphical Progress Bar */}
          <div className="bg-white border border-neutral-100 p-8 shadow-xs">
            <h3 className="font-label-caps text-[12px] tracking-widest uppercase mb-8 border-b border-neutral-150 pb-3">Progreso de Entrega</h3>
            
            {/* Elegant Steps Line */}
            <div className="relative py-4 flex flex-col md:flex-row justify-between gap-8 md:gap-4 md:items-center">
              {/* Connector line behind */}
              <div className="hidden md:block absolute h-0.5 bg-neutral-200 left-[10%] right-[10%] top-1/2 -translate-y-1/2 z-0">
                <div className={`h-full bg-black transition-all duration-1000 ${
                  foundOrder.status === 'Entregado' ? 'w-full' : (foundOrder.status === 'Enviado' ? 'w-3/4' : 'w-1/2')
                }`}></div>
              </div>

              {[
                { label: 'Pedido Confirmado', desc: 'Pago aprobado y procesado', active: true, icon: 'receipt_long' },
                { label: 'En Preparación', desc: 'Corte artesanal y empaque', active: true, icon: 'design_services' },
                { label: 'Enviado', desc: foundOrder.shippingDetails?.carrierName || 'En tránsito', active: foundOrder.status === 'Enviado' || foundOrder.status === 'Entregado', icon: 'local_shipping' },
                { label: 'Entregado', desc: 'Recibido en domicilio', active: foundOrder.status === 'Entregado', icon: 'home' }
              ].map((step, idx) => (
                <div key={idx} className="relative z-10 flex md:flex-col items-center gap-4 md:gap-2 text-left md:text-center md:w-1/4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                    step.active 
                      ? 'bg-black border-black text-white shadow-sm' 
                      : 'bg-white border-neutral-200 text-neutral-400'
                  }`}>
                    <span className="material-symbols-outlined text-[20px]">
                      {step.icon}
                    </span>
                  </div>
                  <div>
                    <h4 className={`font-label-caps text-[10px] uppercase font-bold ${step.active ? 'text-black' : 'text-neutral-400'}`}>{step.label}</h4>
                    <p className="font-body-md text-[10px] text-neutral-400 font-light mt-0.5 leading-tight">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Shipping logs / carrier info (7 cols) */}
            <div className="lg:col-span-7 bg-white border border-neutral-100 p-8 shadow-xs">
              <div className="flex justify-between items-center border-b border-neutral-150 pb-3 mb-6">
                <h3 className="font-label-caps text-[12px] tracking-widest uppercase">Bitácora de Rastreo</h3>
                {foundOrder.trackingNumber && (
                  <span className="font-label-caps text-[9px] bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded">
                    ENVIA.COM TRACKING
                  </span>
                )}
              </div>
              
              {loadingLiveTracking ? (
                <p className="font-body-md text-xs text-neutral-400 py-4 text-center">Consultando eventos con la paquetería en tiempo real...</p>
              ) : liveTracking && liveTracking.events && liveTracking.events.length > 0 ? (
                <div className="space-y-6 relative pl-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-neutral-100">
                  {liveTracking.events.map((ev, idx) => (
                    <div key={idx} className="relative before:absolute before:-left-6 before:top-1.5 before:w-2 before:h-2 before:rounded-full before:bg-black">
                      <span className="font-label-caps text-[9px] text-neutral-400 block tracking-wider">
                        {new Date(ev.timestamp).toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} • {ev.location}
                      </span>
                      <strong className="font-body-md text-xs text-neutral-800 uppercase block">{ev.description}</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-6 relative pl-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-neutral-100">
                  {foundOrder.status === 'Entregado' && (
                    <div className="relative before:absolute before:-left-6 before:top-1.5 before:w-2 before:h-2 before:rounded-full before:bg-emerald-600">
                      <span className="font-label-caps text-[9px] text-neutral-400 block tracking-wider">
                        {getEventTime(foundOrder.createdAt, 24)}
                      </span>
                      <strong className="font-body-md text-xs text-neutral-800 uppercase block">Pedido Entregado con Éxito</strong>
                      <p className="font-body-md text-[11px] text-neutral-500 font-light mt-0.5">Recibido en puerta. Firmado y verificado por el destinatario titular.</p>
                    </div>
                  )}

                  {(foundOrder.status === 'Enviado' || foundOrder.status === 'Entregado') && (
                    <div className="relative before:absolute before:-left-6 before:top-1.5 before:w-2 before:h-2 before:rounded-full before:bg-black">
                      <span className="font-label-caps text-[9px] text-neutral-400 block tracking-wider">
                        {getEventTime(foundOrder.createdAt, 8)}
                      </span>
                      <strong className="font-body-md text-xs text-neutral-800 uppercase block">Envío recolectado por {foundOrder.shippingDetails?.carrierName || 'Paquetería'}</strong>
                      <p className="font-body-md text-[11px] text-neutral-500 font-light mt-0.5">
                        El paquete ha salido de nuestro centro de distribución logístico OV33. Guía de seguimiento: <strong>{foundOrder.trackingNumber || 'En asignación'}</strong>.
                      </p>
                    </div>
                  )}

                  <div className="relative before:absolute before:-left-6 before:top-1.5 before:w-2 before:h-2 before:rounded-full before:bg-black">
                    <span className="font-label-caps text-[9px] text-neutral-400 block tracking-wider">
                      {getEventTime(foundOrder.createdAt, 4)}
                    </span>
                    <strong className="font-body-md text-xs text-neutral-800 uppercase block">Control de Calidad y Embalaje Completado</strong>
                    <p className="font-body-md text-[11px] text-neutral-500 font-light mt-0.5">Los artículos fueron verificados, protegidos y preparados en caja de envío OV33 para despacho express.</p>
                  </div>

                  <div className="relative before:absolute before:-left-6 before:top-1.5 before:w-2 before:h-2 before:rounded-full before:bg-black">
                    <span className="font-label-caps text-[9px] text-neutral-400 block tracking-wider">
                      {new Date(foundOrder.createdAt).toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <strong className="font-body-md text-xs text-neutral-800 uppercase block">Pedido Confirmado y Aprobado</strong>
                    <p className="font-body-md text-[11px] text-neutral-500 font-light mt-0.5">Transacción procesada correctamente por Mercado Pago. Orden turnada al centro de distribución OV33.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Carrier Summary (5 cols) */}
            <div className="lg:col-span-5 bg-white border border-neutral-100 p-8 shadow-xs h-fit space-y-6">
              <h3 className="font-label-caps text-[12px] tracking-widest uppercase border-b border-neutral-150 pb-3">Detalle del Transporte</h3>
              
              <div className="space-y-4 font-body-md text-xs">
                <div className="flex justify-between">
                  <span className="text-neutral-400 font-label-caps text-[9px]">PAQUETERÍA:</span>
                  <strong className="text-neutral-800">{foundOrder.shippingDetails?.carrierName || foundOrder.carrier || 'FedEx Nacional'}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400 font-label-caps text-[9px]">NÚMERO DE GUÍA:</span>
                  <strong className="text-neutral-800 font-mono">{foundOrder.trackingNumber || 'Generándose en centro logístico'}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400 font-label-caps text-[9px]">TIPO DE SERVICIO:</span>
                  <strong className="text-neutral-800">{foundOrder.shippingDetails?.serviceName || 'Estándar Terrestre'}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400 font-label-caps text-[9px]">COSTO DE ENVÍO:</span>
                  <strong className="text-emerald-700 font-bold uppercase text-[10px]">
                    {foundOrder.shippingCost === 0 ? 'Cubierto (Gratuito)' : `$${foundOrder.shippingCost?.toLocaleString() || 150} MXN`}
                  </strong>
                </div>
              </div>

              {foundOrder.labelUrl && (
                <div className="pt-2">
                  <a
                    href={foundOrder.labelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full text-center bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-label-caps text-[10px] py-2.5 px-4 block uppercase tracking-wider transition-colors"
                  >
                    Ver Etiqueta de Paquetería (PDF)
                  </a>
                </div>
              )}

              <div className="hairline-divider"></div>

              <div>
                <span className="font-label-caps text-[9px] text-neutral-400 block mb-2">DIRECCIÓN DE ENTREGA</span>
                <p className="font-body-md text-xs text-neutral-700 leading-relaxed font-light">
                  {foundOrder.shippingAddress?.address}<br/>
                  {foundOrder.shippingAddress?.city}, {foundOrder.shippingAddress?.state || ''} CP {foundOrder.shippingAddress?.zip}<br/>
                  {foundOrder.shippingAddress?.country || 'México'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

