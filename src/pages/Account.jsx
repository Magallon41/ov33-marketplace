import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProducts } from '../context/ProductContext';
import { printReceipt, printInvoice } from '../utils/invoice';

export function Account() {
  const { currentUser, logout, resendVerificationEmail } = useAuth();
  const [verifSent, setVerifSent] = useState(false);
  const [verifError, setVerifError] = useState('');
  const [verifLoading, setVerifLoading] = useState(false);
  const { orders, updateOrderStatus, fetchOrders } = useProducts();
  const navigate = useNavigate();

  useEffect(() => {
    if (fetchOrders) fetchOrders();
  }, []);


  // Return & Exchange states
  const [returnOrder, setReturnOrder] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [reason, setReason] = useState('Talla incorrecta');
  const [returnType, setReturnType] = useState('reembolso'); // refund or exchange
  const [newSize, setNewSize] = useState('M');
  const [showLabel, setShowLabel] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');

  if (!currentUser) {
    return (
      <main className="pt-[120px] max-w-[1440px] mx-auto px-4 md:px-12 pb-16 md:pb-24 min-h-screen text-center flex flex-col justify-center items-center">
        <span className="material-symbols-outlined text-[48px] text-neutral-300 mb-6">lock</span>
        <h1 className="font-display-xl text-[24px] uppercase mb-4">Acceso Restringido</h1>
        <p className="font-body-md text-secondary mb-8">Inicia sesión para acceder a tu perfil y compras en OV33 Market.</p>
        <button 
          onClick={() => navigate('/auth')} 
          className="bg-black text-white px-8 py-3 uppercase tracking-widest font-button text-button hover:bg-neutral-800 transition-colors"
        >
          Iniciar Sesión
        </button>
      </main>
    );
  }

  // Filter orders for current user
  const myOrders = orders.filter(
    order => order.customerEmail.toLowerCase() === currentUser.email.toLowerCase()
  );

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Open Return Panel
  const handleOpenReturn = (order) => {
    setReturnOrder(order);
    setSelectedItems([order.items[0]?.id]); // Select first item by default
    setReason('Talla incorrecta');
    setReturnType('reembolso');
    setNewSize('M');
    setShowLabel(false);
  };

  // Toggle item selection for return
  const handleItemToggle = (itemId) => {
    if (selectedItems.includes(itemId)) {
      if (selectedItems.length > 1) {
        setSelectedItems(selectedItems.filter(id => id !== itemId));
      }
    } else {
      setSelectedItems([...selectedItems, itemId]);
    }
  };

  // Submit return request
  const handleSubmitReturn = (e) => {
    e.preventDefault();
    if (selectedItems.length === 0) return;

    // Fictional DHL Return Tracking Code
    const labelCode = "DHL-RET-" + Math.floor(10000000 + Math.random() * 90000000);
    setTrackingNumber(labelCode);

    // Update status in dynamic database
    const statusText = returnType === 'reembolso' ? 'Devolución Solicitada' : 'Cambio Solicitado';
    updateOrderStatus(returnOrder.id, statusText);
    
    setShowLabel(true);
  };

  // Trigger print printable label
  const handlePrintLabel = () => {
    const printWindow = window.open('', '_blank', 'width=700,height=500');
    const html = `
      <!doctype html>
      <html>
      <head>
        <title>Guía de Retorno - OV33 MARKETPLACE</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #000; }
          .label-box { border: 3px solid #000; padding: 20px; max-width: 500px; margin: auto; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 10px; }
          .logo { font-size: 20px; font-weight: bold; font-family: serif; letter-spacing: 2px; }
          .carrier { font-size: 24px; font-weight: 900; color: #ffcc00; -webkit-text-stroke: 1px #d30000; }
          .address-section { margin: 15px 0; font-size: 10px; line-height: 1.4; }
          .tracking { text-align: center; margin: 20px 0; border: 2px solid #000; padding: 10px; font-size: 14px; font-weight: bold; }
          .barcode { height: 60px; background: repeating-linear-gradient(90deg, #000, #000 2px, #fff 2px, #fff 8px); margin: 10px auto; width: 80%; }
        </style>
      </head>
      <body>
        <div class="label-box">
          <div class="header">
            <div>
              <span class="logo">OV33 MARKETPLACE</span><br>
              <span style="font-size: 8px;">RETORNO DE PRODUCTO / GARANTÍA</span>
            </div>
            <div class="carrier">ENVIA.COM / EXPRESS</div>
          </div>
          
          <div class="address-section" style="border-bottom: 1px dashed #ccc; padding-bottom: 10px;">
            <strong>DESDE (REMITENTE):</strong><br>
            ${currentUser.name.toUpperCase()}<br>
            ${returnOrder.shippingAddress.address}<br>
            ${returnOrder.shippingAddress.city}, CP ${returnOrder.shippingAddress.zip}<br>
            MÉXICO
          </div>

          <div class="address-section">
            <strong>PARA (DESTINATARIO):</strong><br>
            OV33 MARKETPLACE - CENTRO DE DEVOLUCIONES & GARANTÍAS<br>
            Av. López Mateos Sur 2077, Jardines de la Victoria<br>
            Guadalajara, CP 44540, Jalisco, México
          </div>

          <div class="tracking">
            GUÍA DE RETORNO EXPRESS<br>
            <span style="font-size: 18px; color: #ff5000;">${trackingNumber}</span>
            <div class="barcode"></div>
            <span style="font-size: 8px; font-weight: normal; color: #666;">(400) 82739182 (90) ${trackingNumber}</span>
          </div>

          <p style="font-size: 9px; color: #666; text-align: center; text-transform: uppercase; margin-top: 15px;">
            Imprima esta guía, péguela en el empaque de OV33 debidamente sellado y deposítela en cualquier sucursal de la paquetería designada.
          </p>
        </div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <main className="pt-[120px] max-w-[1440px] mx-auto px-4 md:px-12 pb-16 md:pb-24 min-h-screen">
      {/* Title */}
      <header className="mb-12">
        <span className="font-label-caps text-xs text-neutral-400 tracking-[0.2em] uppercase block mb-2">MI ESPACIO</span>
        <h1 className="font-display-xl text-display-xl uppercase leading-tight">CUENTA PERSONAL</h1>
        <div className="hairline-divider w-full mt-6"></div>
      </header>

      {currentUser && currentUser.emailVerified === false && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-6 mb-10 text-amber-900 font-body-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-[fadeIn_0.4s_ease]">
          <div>
            <span className="font-label-caps text-[10px] font-bold block uppercase tracking-wider mb-1 text-amber-800 font-bold">Dirección de correo no verificada</span>
            <p className="text-xs text-amber-700 leading-relaxed max-w-2xl font-light">
              Por favor, verifica tu dirección de correo electrónico haciendo clic en el enlace que te hemos enviado. Algunas funciones podrían estar limitadas hasta que verifiques tu cuenta.
            </p>
            {verifError && (
              <span className="text-[10px] text-red-600 block mt-2 font-bold">{verifError}</span>
            )}
            {verifSent && (
              <span className="text-[10px] text-emerald-700 block mt-2 font-bold">¡Enlace de verificación enviado! Revisa tu bandeja de entrada.</span>
            )}
          </div>
          <button 
            type="button"
            disabled={verifLoading || verifSent}
            onClick={async () => {
              setVerifError('');
              setVerifLoading(true);
              try {
                await resendVerificationEmail();
                setVerifSent(true);
              } catch (err) {
                setVerifError(err.message || 'Error al enviar enlace.');
              } finally {
                setVerifLoading(false);
              }
            }}
            className="bg-amber-600 text-white border border-transparent px-5 py-2.5 font-button text-[10px] uppercase tracking-widest hover:bg-amber-700 transition-colors disabled:opacity-50 shrink-0 self-start md:self-center"
          >
            {verifLoading ? 'Enviando...' : 'Reenviar Enlace'}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white p-8 border border-neutral-100 shadow-sm rounded-none">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-[#f5f5f5] rounded-full flex items-center justify-center border border-neutral-200">
                <span className="material-symbols-outlined text-[32px] text-neutral-500">person</span>
              </div>
              <div>
                <h3 className="font-headline-md text-[18px] uppercase">{currentUser.name}</h3>
                <span className="font-label-caps text-[9px] bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded tracking-widest uppercase">
                  {currentUser.role === 'admin' ? 'Administrador' : 'Socio'}
                </span>
              </div>
            </div>

            <div className="space-y-4 font-body-md text-sm text-secondary mb-8 border-t border-neutral-100 pt-6">
              <div>
                <span className="font-label-caps text-[9px] text-neutral-400 block tracking-wider uppercase">CORREO ELECTRÓNICO</span>
                <span className="text-neutral-800">{currentUser.email}</span>
              </div>
              <div>
                <span className="font-label-caps text-[9px] text-neutral-400 block tracking-wider uppercase">MIEMBRO DESDE</span>
                <span className="text-neutral-800">
                  {new Date(currentUser.createdAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {currentUser.role === 'admin' && (
                <button 
                  onClick={() => navigate('/admin')}
                  className="w-full bg-amber-600 text-white py-3.5 font-button text-xs uppercase tracking-widest hover:bg-amber-700 transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">dashboard</span>
                  PANEL DE ADMINISTRACIÓN
                </button>
              )}
              <button 
                onClick={handleLogout}
                className="w-full bg-black text-white py-3.5 font-button text-xs uppercase tracking-widest hover:bg-neutral-800 transition-colors"
              >
                CERRAR SESIÓN
              </button>
            </div>
          </div>
        </div>

        {/* Orders Card */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="font-display-xl text-[22px] uppercase mb-6 tracking-wide">HISTORIAL DE PEDIDOS ({myOrders.length})</h2>
          
          {myOrders.length === 0 ? (
            <div className="bg-white p-12 border border-neutral-100 text-center shadow-sm">
              <span className="material-symbols-outlined text-[36px] text-neutral-300 mb-4">receipt_long</span>
              <p className="font-body-md text-secondary mb-6">Aún no has realizado ningún pedido en OV33 Market.</p>
              <button 
                onClick={() => navigate('/catalog')}
                className="border border-black text-black px-6 py-3 font-button text-button uppercase tracking-widest hover:bg-black hover:text-white transition-colors"
              >
                Explorar Catálogo
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {myOrders.map(order => (
                <div key={order.id} className="bg-white border border-neutral-150 shadow-sm p-6 md:p-8 rounded-none">
                  {/* Order Header */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-neutral-100">
                    <div>
                      <span className="font-label-caps text-[10px] text-neutral-400 block uppercase tracking-widest">NÚMERO DE PEDIDO</span>
                      <span className="font-headline-md text-[16px] font-bold text-black">{order.id}</span>
                    </div>
                    <div>
                      <span className="font-label-caps text-[10px] text-neutral-400 block uppercase tracking-widest">FECHA</span>
                      <span className="font-body-md text-sm text-neutral-800">
                        {new Date(order.createdAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div>
                      <span className="font-label-caps text-[10px] text-neutral-400 block uppercase tracking-widest">ESTADO</span>
                      <span className={`inline-block font-label-caps text-[9px] px-3 py-1 font-bold tracking-widest uppercase rounded ${
                        order.status === 'Entregado' || order.status === 'Devolución Solicitada' || order.status === 'Cambio Solicitado'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="py-6 space-y-4">
                    {order.items.map(item => (
                      <div key={item.id} className="flex gap-4 items-center">
                        <div className="w-14 h-18 bg-neutral-100 shrink-0 border border-neutral-200">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-headline-md text-sm uppercase text-neutral-800">{item.name}</h4>
                          <p className="font-body-md text-xs text-neutral-500">
                            Categoría: {item.category} {item.selectedSize ? `| Talla: ${item.selectedSize}` : ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-body-md text-sm block">${item.price} MXN</span>
                          <span className="font-label-caps text-[10px] text-neutral-400">Cant: {item.quantity}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Footer / Total */}
                  <div className="pt-4 border-t border-neutral-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-neutral-100 pb-4 mb-4">
                    <div className="text-xs font-body-md text-neutral-500">
                      <span className="font-label-caps text-[9px] text-neutral-400 block uppercase tracking-widest font-bold">ENVÍO A</span>
                      <span>{order.shippingAddress.address}, {order.shippingAddress.city}</span>
                    </div>
                    <div className="text-right w-full md:w-auto">
                      {order.discount > 0 && (
                        <p className="font-body-md text-xs text-emerald-600 mb-1">
                          Descuento aplicado: -${order.discount.toLocaleString()} MXN
                        </p>
                      )}
                      <p className="font-headline-md text-[18px]">
                        <span className="font-label-caps text-[10px] text-neutral-400 mr-2 uppercase tracking-widest">TOTAL</span>
                        <span className="font-bold">${order.total.toLocaleString()} MXN</span>
                      </p>
                    </div>
                  </div>

                  {/* Operations Buttons (Returns, exchanges and PDF downloads) */}
                  <div className="flex flex-wrap gap-3">
                    {order.status === 'Entregado' && (
                      <button
                        onClick={() => handleOpenReturn(order)}
                        className="bg-black text-white px-4 py-2 font-button text-[10px] uppercase tracking-widest hover:bg-neutral-800 transition-colors flex items-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[14px]">assignment_return</span>
                        DEVOLUCIÓN O CAMBIO
                      </button>
                    )}

                    <button
                      onClick={() => printReceipt(order)}
                      className="border border-neutral-200 text-neutral-700 px-4 py-2 font-button text-[10px] uppercase tracking-widest hover:border-black hover:text-black transition-all flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[14px]">receipt_long</span>
                      COMPROBANTE
                    </button>

                    {order.billing && (
                      <button
                        onClick={() => printInvoice(order)}
                        className="border border-amber-600 text-amber-700 px-4 py-2 font-button text-[10px] uppercase tracking-widest hover:bg-amber-50 transition-all flex items-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[14px]">receipt</span>
                        FACTURA CFDI
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Return & Exchange Interactive Portal Overlay */}
      {returnOrder && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]" onClick={() => setReturnOrder(null)} />
          <div className="fixed top-0 right-0 h-full w-full max-w-[500px] bg-white z-[70] shadow-2xl p-8 flex flex-col overflow-y-auto animate-[slideInRight_0.4s_ease-out]">
            <header className="flex justify-between items-center mb-6 border-b border-neutral-100 pb-4">
              <h3 className="font-display-xl text-[18px] uppercase font-bold">
                Devoluciones y Cambios
              </h3>
              <button onClick={() => setReturnOrder(null)} className="hover:text-amber-600 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>

            {!showLabel ? (
              <form onSubmit={handleSubmitReturn} className="space-y-6 flex-1 flex flex-col justify-between">
                <div className="space-y-6">
                  <p className="font-body-md text-xs text-secondary leading-relaxed">
                    Seleccione los artículos de su pedido <strong>{returnOrder.id}</strong> que desea regresar y elija el motivo.
                  </p>

                  {/* Items selection checklist */}
                  <div>
                    <label className="block font-label-caps text-[9px] text-neutral-400 tracking-wider uppercase mb-3">ARTÍCULOS A REGRESAR *</label>
                    <div className="space-y-3">
                      {returnOrder.items.map(item => {
                        const isChecked = selectedItems.includes(item.id);
                        return (
                          <div 
                            key={item.id} 
                            onClick={() => handleItemToggle(item.id)}
                            className={`flex gap-3 p-3 border cursor-pointer select-none transition-all ${
                              isChecked ? 'border-black bg-neutral-50/55' : 'border-neutral-200 hover:border-neutral-300'
                            }`}
                          >
                            <div className="w-10 h-13 bg-neutral-100 border border-neutral-200 overflow-hidden shrink-0">
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 flex flex-col justify-center">
                              <span className="font-headline-md text-xs uppercase text-neutral-800 leading-tight">{item.name}</span>
                              <span className="font-label-caps text-[8px] text-neutral-400 mt-1">TALLA: {item.selectedSize}</span>
                            </div>
                            <div className="flex items-center">
                              <span className={`material-symbols-outlined text-[20px] ${
                                isChecked ? 'text-black' : 'text-neutral-300'
                              }`}>
                                {isChecked ? 'check_box' : 'check_box_outline_blank'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Reason select */}
                  <div>
                    <label className="block font-label-caps text-[9px] text-neutral-400 tracking-wider uppercase mb-2">MOTIVO DE DEVOLUCIÓN *</label>
                    <select
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full border border-neutral-200 py-3 px-3 font-label-caps text-xs focus:border-black outline-none bg-white uppercase"
                    >
                      <option value="Talla incorrecta">La talla no me quedó bien (Muy grande / pequeña)</option>
                      <option value="No me gustó el producto">El producto o color no cumple mis expectativas</option>
                      <option value="Defecto de fábrica">Defecto de fábrica, falla técnica o daño físico</option>
                      <option value="Paquete dañado">El empaque o producto llegaron maltratados</option>
                    </select>
                  </div>

                  {/* Return Type (Refund vs Exchange) */}
                  <div>
                    <label className="block font-label-caps text-[9px] text-neutral-400 tracking-wider uppercase mb-3">TIPO DE SOLICITUD *</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setReturnType('reembolso')}
                        className={`border py-3 px-3 font-button text-[10px] uppercase tracking-wider transition-all ${
                          returnType === 'reembolso' 
                            ? 'border-black bg-black text-white' 
                            : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                        }`}
                      >
                        REEMBOLSO TOTAL
                      </button>
                      <button
                        type="button"
                        onClick={() => setReturnType('cambio')}
                        className={`border py-3 px-3 font-button text-[10px] uppercase tracking-wider transition-all ${
                          returnType === 'cambio' 
                            ? 'border-black bg-black text-white' 
                            : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                        }`}
                      >
                        CAMBIO DE TALLA
                      </button>
                    </div>
                  </div>

                  {/* Size selection if Exchange */}
                  {returnType === 'cambio' && (
                    <div className="animate-[fadeIn_0.3s_ease]">
                      <label className="block font-label-caps text-[9px] text-neutral-400 tracking-wider uppercase mb-2">NUEVA TALLA DESEADA *</label>
                      <select
                        value={newSize}
                        onChange={(e) => setNewSize(e.target.value)}
                        className="w-full border border-neutral-200 py-3 px-3 font-label-caps text-xs focus:border-black outline-none bg-white"
                      >
                        <option value="S">Talla S</option>
                        <option value="M">Talla M</option>
                        <option value="L">Talla L</option>
                        <option value="XL">Talla XL</option>
                        <option value="XXL">Talla XXL</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="pt-8 border-t border-neutral-100 mt-8 space-y-3">
                  <button 
                    type="submit"
                    className="w-full bg-black text-white py-4 font-button text-button uppercase tracking-widest hover:bg-neutral-800 transition-colors"
                  >
                    PROCESAR SOLICITUD
                  </button>
                  <button 
                    type="button"
                    onClick={() => setReturnOrder(null)}
                    className="w-full border border-neutral-200 text-neutral-700 py-3.5 font-button text-xs uppercase tracking-widest hover:bg-neutral-50 transition-colors"
                  >
                    CANCELAR
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-8 animate-[fadeIn_0.3s_ease] text-center">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-200 mx-auto">
                  <span className="material-symbols-outlined text-[32px] text-emerald-600">task_alt</span>
                </div>
                
                <div>
                  <h4 className="font-headline-md text-lg uppercase mb-2">¡Solicitud Aprobada!</h4>
                  <p className="font-body-md text-xs text-secondary leading-relaxed max-w-sm mx-auto">
                    Tu solicitud de {returnType === 'reembolso' ? 'devolución' : 'cambio de talla'} ha sido procesada automáticamente. Hemos generado tu **Guía de Retorno DHL Express** sin costo.
                  </p>
                </div>

                {/* Printable Label Preview Card */}
                <div className="border border-neutral-200 p-6 bg-[#fafafa] text-left space-y-3">
                  <div className="flex justify-between items-center text-[10px] font-label-caps">
                    <span className="text-neutral-400">TRANSPORTISTA:</span>
                    <strong className="text-black">Envia.com / Paquetería Express</strong>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-label-caps">
                    <span className="text-neutral-400">NÚMERO DE GUÍA:</span>
                    <strong className="text-red-650 font-bold">{trackingNumber}</strong>
                  </div>
                  <div className="hairline-divider"></div>
                  <p className="font-body-md text-[10px] text-neutral-500 leading-normal font-light">
                    * Imprime la guía haciendo clic abajo.<br/>
                    * Coloca los artículos en su empaque de OV33 bien sellado.<br/>
                    * Pega la guía en el exterior y entrégala en la sucursal de la paquetería indicada.
                  </p>
                </div>

                <div className="space-y-3 pt-4">
                  <button 
                    onClick={handlePrintLabel}
                    className="w-full bg-amber-600 text-white py-4 font-button text-xs uppercase tracking-widest hover:bg-amber-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[16px]">print</span>
                    IMPRIMIR GUÍA DE RETORNO
                  </button>
                  <button 
                    onClick={() => setReturnOrder(null)}
                    className="w-full bg-black text-white py-4 font-button text-xs uppercase tracking-widest hover:bg-neutral-800 transition-colors"
                  >
                    CERRAR VENTANA
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </main>
  );
}
