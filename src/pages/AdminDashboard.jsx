import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProducts } from '../context/ProductContext';
import { auth, db } from '../utils/firebase';

// Función para redimensionar y comprimir imágenes a JPEG en Base64 en el cliente
const compressImage = (file, maxWidth = 1200, maxHeight = 1600, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Mantener relación de aspecto y ajustar si supera los límites
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Exportar a WebP con calidad reducida
        const dataUrl = canvas.toDataURL('image/webp', quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

// Helper para sanitizar inputs y prevenir ataques XSS / inyección de HTML
const sanitizeInput = (text) => {
  if (typeof text !== 'string') return text;
  // Elimina etiquetas <script> y su contenido
  let cleaned = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  // Elimina cualquier otra etiqueta HTML
  cleaned = cleaned.replace(/<[^>]*>/g, '');
  return cleaned.trim();
};

// Función para re-comprimir imágenes Base64 existentes si es necesario para no exceder límites de Firestore
const compressBase64Image = (base64Str, maxWidth = 600, maxHeight = 800, quality = 0.5) => {
  if (!base64Str || !base64Str.startsWith('data:image/')) {
    // Si no es un base64 de imagen (por ejemplo, una URL de internet), se deja intacto
    return Promise.resolve(base64Str);
  }
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Redimensionamiento y mantención de relación de aspecto
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Exportación en JPG optimizado
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(dataUrl);
    };
    img.onerror = () => {
      // Retornar la cadena original en caso de error
      resolve(base64Str);
    };
  });
};

// Función para comprimir una imagen base64 con parámetros específicos
const compressSingleBase64 = (base64Str, maxWidth, maxHeight, quality) => {
  if (!base64Str || !base64Str.startsWith('data:image/')) {
    return Promise.resolve(base64Str);
  }
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(dataUrl);
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
};

// Función para subir imagen base64 a ImgBB y obtener la URL pública directa
const uploadToImgBB = async (base64Str) => {
  if (!base64Str || !base64Str.startsWith('data:image/')) {
    return base64Str; // Si ya es una URL, no hacemos nada
  }
  try {
    const apiKey = import.meta.env.VITE_IMGBB_API_KEY;
    if (!apiKey) {
      throw new Error('VITE_IMGBB_API_KEY no está configurada en las variables de entorno.');
    }
    const url = `https://api.imgbb.com/1/upload?key=${apiKey}`;
    
    // Limpiar el prefijo data:image/xxx;base64,
    const cleanBase64 = base64Str.split(',')[1];
    
    const formData = new FormData();
    formData.append('image', cleanBase64);
    
    const response = await fetch(url, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    
    const result = await response.json();
    if (result.success && result.data && result.data.url) {
      return result.data.url;
    } else {
      throw new Error('Respuesta inválida de ImgBB');
    }
  } catch (error) {
    console.error("Error subiendo a ImgBB:", error);
    throw error;
  }
};

export function AdminDashboard() {
  const { currentUser, users, subscribers, updateUserRole, deleteUser, deleteSubscriber, fetchAdminData } = useAuth();
  const { 
    products, categories, categoryTree = [], orders, isFirebaseEnabled, isUsingFallback,
    addProduct, updateProduct, deleteProduct, 
    addCategory, deleteCategory, updateCategory, 
    addSubcategory, updateSubcategory, deleteSubcategory,
    updateOrderStatus, resetToDefaults, fetchOrders
  } = useProducts();
  
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const variantFileInputRef = useRef(null);

  // Active Tab

  const [activeTab, setActiveTab] = useState('dashboard');

  // Wholesale Leads states
  const [wholesaleLeads, setWholesaleLeads] = useState([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [leadSearch, setLeadSearch] = useState('');
  const [leadStatusFilter, setLeadStatusFilter] = useState('all');

  const fetchWholesaleLeads = async () => {
    setLoadingLeads(true);
    let loaded = [];
    if (isFirebaseEnabled && db) {
      try {
        const { collection, getDocs } = await import('firebase/firestore');
        const snap = await getDocs(collection(db, 'wholesale_leads'));
        snap.forEach(d => loaded.push({ id: d.id, ...d.data() }));
      } catch (err) {
        console.warn("Aviso cargando prospectos de Firestore:", err);
      }
    }
    try {
      const stored = localStorage.getItem('ov33_wholesale_leads') || localStorage.getItem('ed_victory_wholesale_leads');
      if (stored) {
        const local = JSON.parse(stored);
        const ids = new Set(loaded.map(l => l.id));
        local.forEach(l => {
          if (!ids.has(l.id)) loaded.push(l);
        });
      }
    } catch (e) {
      console.warn("Error leyendo leads de localStorage:", e);
    }

    loaded.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    setWholesaleLeads(loaded);
    setLoadingLeads(false);
  };

  useEffect(() => {
    if (fetchOrders) fetchOrders();
    if (fetchAdminData) fetchAdminData();
    fetchWholesaleLeads();
  }, []);

  // Search & Filter state for catalog
  const [productSearch, setProductSearch] = useState('');
  
  // Product Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formName, setFormName] = useState('');
  const [formBrand, setFormBrand] = useState('OV33');
  const [formCategory, setFormCategory] = useState('');
  const [formSubcategory, setFormSubcategory] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formOriginalPrice, setFormOriginalPrice] = useState('');
  const [formIsOnSale, setFormIsOnSale] = useState(false);
  const [formIsFlashDeal, setFormIsFlashDeal] = useState(false);
  const [formBadge, setFormBadge] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formSizes, setFormSizes] = useState(['S', 'M', 'L', 'XL']);
  
  // Stock by size state (for single product mode)
  const [formStock, setFormStock] = useState({ S: 10, M: 10, L: 10, XL: 10 });
  
  // Images array state (for single product mode)
  const [formImages, setFormImages] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [imageError, setImageError] = useState('');

  // Variants management states
  const [formVariants, setFormVariants] = useState([]);
  const [showVariantForm, setShowVariantForm] = useState(false);
  const [varEditIdx, setVarEditIdx] = useState(null); // index of variant being created/edited
  const [varName, setVarName] = useState('');
  const [varHex, setVarHex] = useState('#FFFFFF');
  const [varStock, setVarStock] = useState({ S: 10, M: 10, L: 10, XL: 10 });
  const [varImages, setVarImages] = useState([]);
  const [isVarDragging, setIsVarDragging] = useState(false);
  const [varImageError, setVarImageError] = useState('');

  // Category Form & Edit states
  const [newCatName, setNewCatName] = useState('');
  const [editingCatOldName, setEditingCatOldName] = useState(null);
  const [editingCatNewName, setEditingCatNewName] = useState('');
  const [isUpdatingCat, setIsUpdatingCat] = useState(false);

  // Subcategory Form & Edit states
  const [newSubcatInputs, setNewSubcatInputs] = useState({}); // { [catName]: string }
  const [editingSubcat, setEditingSubcat] = useState(null); // { catName, oldName, newName }
  const [isUpdatingSubcat, setIsUpdatingSubcat] = useState(false);

  // Database Connection Diagnostics State
  const [dbTestState, setDbTestState] = useState('idle'); // idle, testing, success, error
  const [dbTestMessage, setDbTestMessage] = useState('');

  // Toast Notification State
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [isSaving, setIsSaving] = useState(false);
  const [generatingLabelId, setGeneratingLabelId] = useState(null);

  const showToast = (message, type = 'success', duration = 4000) => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => {
        if (prev.message === message) {
          return { ...prev, show: false };
        }
        return prev;
      });
    }, duration);
  };

  // Generar Guía de Envío oficial con Envia.com
  const handleGenerateLabel = async (order) => {
    setGeneratingLabelId(order.id);
    try {
      const carrier = order.shippingDetails?.carrier || 'fedex';
      const service = order.shippingDetails?.service || 'ground';

      const idToken = auth?.currentUser ? await auth.currentUser.getIdToken() : '';
      const res = await fetch('/api/generate-label', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {})
        },
        body: JSON.stringify({
          orderId: order.id,
          carrier,
          service,
          destination: {
            name: order.customerName || 'Cliente ED',
            email: order.customerEmail || 'cliente@edvictory.com',
            phone: order.customerPhone || '+525500000000',
            street: order.shippingAddress?.address || 'Calle',
            district: order.shippingAddress?.colonia || order.shippingAddress?.district || order.shippingAddress?.city || 'Centro',
            city: order.shippingAddress?.city || 'Ciudad',
            state: order.shippingAddress?.state || '',
            postalCode: order.shippingAddress?.zip || '',
            country: 'MX'
          }
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Error al generar la guía en Envia.com');
      }

      await updateOrderStatus(order.id, 'Enviado', {
        labelUrl: data.labelUrl,
        trackingNumber: data.trackingNumber
      });
      showToast(`¡Guía generada con éxito (${data.carrier?.toUpperCase()})! Guía: ${data.trackingNumber}`, 'success');
      
      if (data.labelUrl) {
        window.open(data.labelUrl, '_blank');
      }
    } catch (err) {
      console.error('Error generando guía:', err);
      showToast(err.message || 'Error al conectar con Envia.com', 'error');
    } finally {
      setGeneratingLabelId(null);
    }
  };

  const exportToCSV = (data, filename, headers) => {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += headers.map(h => `"${h}"`).join(",") + "\n";
    
    data.forEach(item => {
      const row = headers.map(header => {
        let val = item[header] !== undefined && item[header] !== null ? item[header] : '';
        val = String(val).replace(/"/g, '""');
        return `"${val}"`;
      });
      csvContent += row.join(",") + "\n";
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportUsersCSV = () => {
    if (!users || users.length === 0) {
      showToast("No hay usuarios para exportar.", "error");
      return;
    }
    const headers = ["ID", "Nombre", "Email", "Fecha Registro", "Rol", "Acepta Marketing"];
    const csvData = users.map(u => ({
      ID: u.id,
      Nombre: u.name,
      Email: u.email,
      "Fecha Registro": u.createdAt ? new Date(u.createdAt).toISOString() : '',
      Rol: u.role === 'admin' ? 'Administrador' : 'Cliente',
      "Acepta Marketing": u.acceptsMarketing ? 'SÍ' : 'NO'
    }));

    exportToCSV(csvData, "clientes_ov33_market.csv", headers);
    showToast("Base de usuarios exportada con éxito.", "success");
  };

  const handleExportSubscribersCSV = () => {
    if (!subscribers || subscribers.length === 0) {
      showToast("No hay suscriptores para exportar.", "error");
      return;
    }
    const headers = ["ID", "Email", "Fecha Suscripcion"];
    const csvData = subscribers.map(s => ({
      ID: s.id,
      Email: s.email,
      "Fecha Suscripcion": s.createdAt ? new Date(s.createdAt).toISOString() : ''
    }));

    exportToCSV(csvData, "suscriptores_boletin_ov33.csv", headers);
    showToast("Lista de suscriptores exportada con éxito.", "success");
  };

  const handleExportWholesaleCSV = () => {
    if (!wholesaleLeads || wholesaleLeads.length === 0) {
      showToast("No hay prospectos de mayoreo para exportar.", "error");
      return;
    }
    const headers = ["ID", "Fecha", "Nombre", "Negocio", "Ciudad", "Estado", "WhatsApp", "Email", "Piezas Estimadas", "Estilos", "Notas", "Estatus"];
    const csvData = wholesaleLeads.map(l => ({
      ID: l.id,
      Fecha: l.createdAt ? new Date(l.createdAt).toLocaleDateString() : '',
      Nombre: l.name || '',
      Negocio: l.businessName || '',
      Ciudad: l.city || '',
      Estado: l.state || '',
      WhatsApp: l.phone || '',
      Email: l.email || '',
      "Piezas Estimadas": l.estimatedPieces || '',
      Estilos: Array.isArray(l.categories) ? l.categories.join(' - ') : (l.categories || ''),
      Notas: (l.notes || '').replace(/"/g, '""'),
      Estatus: l.status || 'Nuevo'
    }));

    exportToCSV(csvData, "prospectos_mayoristas_ov33.csv", headers);
    showToast("Base de mayoristas exportada con éxito.", "success");
  };

  const handleUpdateLeadStatus = async (leadId, newStatus) => {
    const updated = wholesaleLeads.map(l => l.id === leadId ? { ...l, status: newStatus } : l);
    setWholesaleLeads(updated);

    if (isFirebaseEnabled && db) {
      try {
        const { doc, updateDoc } = await import('firebase/firestore');
        await updateDoc(doc(db, 'wholesale_leads', leadId), { status: newStatus });
      } catch (err) {
        console.warn("Error actualizando status de prospecto en Firestore:", err);
      }
    }
    localStorage.setItem('ov33_wholesale_leads', JSON.stringify(updated));
    showToast(`Estado de prospecto actualizado a "${newStatus}".`, 'success');
  };

  const handleDeleteLead = async (leadId) => {
    if (!window.confirm("¿Seguro que desea eliminar esta solicitud de mayoreo?")) return;
    const updated = wholesaleLeads.filter(l => l.id !== leadId);
    setWholesaleLeads(updated);

    if (isFirebaseEnabled && db) {
      try {
        const { doc, deleteDoc } = await import('firebase/firestore');
        await deleteDoc(doc(db, 'wholesale_leads', leadId));
      } catch (err) {
        console.warn("Error eliminando lead en Firestore:", err);
      }
    }
    localStorage.setItem('ov33_wholesale_leads', JSON.stringify(updated));
    showToast("Prospecto mayorista eliminado con éxito.", "success");
  };

  // Protect route
  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <main className="pt-[120px] max-w-[1440px] mx-auto px-4 md:px-12 pb-16 md:pb-24 min-h-screen text-center flex flex-col justify-center items-center">
        <span className="material-symbols-outlined text-[48px] text-red-600 mb-6">warning</span>
        <h1 className="font-display-xl text-[24px] uppercase mb-4 text-red-650">Acceso Denegado</h1>
        <p className="font-body-md text-secondary mb-8">Esta área es de uso exclusivo para administradores de OV33 Marketplace.</p>
        <button 
          onClick={() => navigate('/auth')} 
          className="bg-black text-white px-8 py-3 uppercase tracking-widest font-button text-button hover:bg-neutral-800 transition-colors"
        >
          Iniciar Sesión como Admin
        </button>
      </main>
    );
  }

  // Dashboard Stats Calculations
  const totalSales = (orders || []).reduce((sum, order) => sum + (Number(order?.total) || 0), 0);
  const totalOrdersCount = orders.length;
  const averageOrderValue = totalOrdersCount > 0 ? Math.round(totalSales / totalOrdersCount) : 0;
  const activeProductsCount = products.length;
  const registeredUsersCount = users.length;

  // Open Form for Adding Product
  const handleOpenAdd = () => {
    setEditingId(null);
    setFormName('');
    setFormBrand('OV33');
    const defaultCat = categories[0] || 'Tecnología & Gadgets';
    setFormCategory(defaultCat);
    const catObj = categoryTree.find(c => c.name.toLowerCase() === defaultCat.toLowerCase());
    setFormSubcategory(catObj?.subcategories?.[0] || 'Varios');
    setFormPrice('');
    setFormOriginalPrice('');
    setFormIsOnSale(false);
    setFormIsFlashDeal(false);
    setFormBadge('');
    setFormDescription('');
    setFormSizes(['Talla Única']);
    setFormStock({ 'Talla Única': 15 });
    setFormImages([]);
    setFormVariants([]);
    setImageError('');
    setShowVariantForm(false);
    setIsFormOpen(true);
  };

  // Open Form for Editing Product
  const handleOpenEdit = (product) => {
    setEditingId(product.id);
    setFormName(product.name);
    setFormBrand(product.brand || 'OV33');
    setFormCategory(product.category || 'Tecnología & Gadgets');
    setFormSubcategory(product.subcategory || '');
    setFormPrice(product.price);
    setFormOriginalPrice(product.originalPrice || '');
    setFormIsOnSale(Boolean(product.isOnSale));
    setFormIsFlashDeal(Boolean(product.isFlashDeal));
    setFormBadge(product.badge || '');
    setFormDescription(product.description || '');
    
    const sizes = product.sizes || ['Talla Única'];
    setFormSizes(sizes);
    
    // Set stock values, default to 10
    const stock = {};
    sizes.forEach(size => {
      stock[size] = product.stock && product.stock[size] !== undefined ? product.stock[size] : 10;
    });
    setFormStock(stock);
    
    // Set images
    setFormImages(product.images && product.images.length > 0 ? [...product.images] : [product.image]);
    
    // Set variants
    setFormVariants(product.variants ? JSON.parse(JSON.stringify(product.variants)) : []);
    
    setImageError('');
    setShowVariantForm(false);
    setIsFormOpen(true);
  };

  // Process selected file list (for single product images)
  const processFiles = async (files) => {
    setImageError('Optimizando e integrando imágenes...');
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      setImageError('Por favor seleccione archivos de imagen válidos.');
      return;
    }

    if (formImages.length + imageFiles.length > 8) {
      setImageError('Límite excedido. Solo se permiten hasta 8 imágenes por producto.');
    }

    const remainingSlots = 8 - formImages.length;
    const filesToLoad = imageFiles.slice(0, remainingSlots);

    for (const file of filesToLoad) {
      try {
        const compressedBase64 = await compressImage(file);
        setFormImages(prev => {
          if (prev.length >= 8) return prev;
          return [...prev, compressedBase64];
        });
      } catch (err) {
        console.error("Error comprimiendo imagen:", err)
        setImageError("Error al procesar y optimizar la imagen.");
      }
    }
    setImageError('');
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  const handleRemoveImage = (index) => {
    setFormImages(formImages.filter((_, idx) => idx !== index));
  };

  // Drag and drop handlers for main files
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  // Process selected file list for color variant images
  const processVariantFiles = async (files) => {
    setVarImageError('Optimizando imágenes de variante...');
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      setVarImageError('Por favor seleccione archivos de imagen válidos.');
      return;
    }

    if (varImages.length + imageFiles.length > 8) {
      setVarImageError('Límite excedido. Solo se permiten hasta 8 imágenes por color.');
    }

    const remainingSlots = 8 - varImages.length;
    const filesToLoad = imageFiles.slice(0, remainingSlots);

    for (const file of filesToLoad) {
      try {
        const compressedBase64 = await compressImage(file);
        setVarImages(prev => {
          if (prev.length >= 8) return prev;
          return [...prev, compressedBase64];
        });
      } catch (err) {
        console.error("Error comprimiendo imagen de variante:", err)
        setVarImageError("Error al procesar y optimizar la imagen de la variante.");
      }
    }
    setVarImageError('');
  };

  const handleVarDragOver = (e) => {
    e.preventDefault();
    setIsVarDragging(true);
  };

  const handleVarDragLeave = () => {
    setIsVarDragging(false);
  };

  const handleVarDrop = (e) => {
    e.preventDefault();
    setIsVarDragging(false);
    if (e.dataTransfer.files) {
      processVariantFiles(e.dataTransfer.files);
    }
  };

  // Open variant sub-modal for adding/editing a color variant
  const handleOpenAddVariant = () => {
    setVarEditIdx(null);
    setVarName('');
    setVarHex('#FFFFFF');
    // Pre-populate size stock from active product sizes
    const stock = {};
    formSizes.forEach(size => {
      stock[size] = 10;
    });
    setVarStock(stock);
    setVarImages([]);
    setVarImageError('');
    setShowVariantForm(true);
  };

  const handleOpenEditVariant = (index) => {
    setVarEditIdx(index);
    const variant = formVariants[index];
    setVarName(variant.colorName);
    setVarHex(variant.colorHex);
    
    // Set stock values, default to 10 for active sizes
    const stock = {};
    formSizes.forEach(size => {
      stock[size] = variant.stock && variant.stock[size] !== undefined ? variant.stock[size] : 10;
    });
    setVarStock(stock);
    setVarImages([...variant.images]);
    setVarImageError('');
    setShowVariantForm(true);
  };

  // Remove a variant entirely
  const handleRemoveVariant = (index) => {
    setFormVariants(formVariants.filter((_, idx) => idx !== index));
  };

  // Toggle size inclusion on variant level
  const handleVariantStockChange = (size, val) => {
    const num = Math.max(0, parseInt(val) || 0);
    setVarStock({
      ...varStock,
      [size]: num
    });
  };

  // Save color variant to variant array
  const handleSaveVariant = (e) => {
    e.preventDefault();
    if (!varName) {
      alert('Escriba un nombre de color.');
      return;
    }

    if (varImages.length === 0) {
      alert('Debe cargar al menos una foto para esta variante de color.');
      return;
    }

    const variantPayload = {
      colorName: varName,
      colorHex: varHex,
      images: varImages,
      stock: varStock
    };

    if (varEditIdx !== null) {
      // Edit mode
      const updated = formVariants.map((item, idx) => idx === varEditIdx ? variantPayload : item);
      setFormVariants(updated);
    } else {
      // Add mode
      setFormVariants([...formVariants, variantPayload]);
    }

    setShowVariantForm(false);
  };

  // Toggle size inclusion (for main product fallback)
  const handleSizeToggle = (size) => {
    if (formSizes.includes(size)) {
      setFormSizes(formSizes.filter(s => s !== size));
      const updatedStock = { ...formStock };
      delete updatedStock[size];
      setFormStock(updatedStock);
    } else {
      setFormSizes([...formSizes, size]);
      setFormStock({ ...formStock, [size]: 10 });
    }
  };

  // Handle main product fallback stock change
  const handleStockChange = (size, value) => {
    const numericValue = Math.max(0, parseInt(value) || 0);
    setFormStock({
      ...formStock,
      [size]: numericValue
    });
  };

  // Save product payload to database
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!formName || !formPrice) {
      showToast('Por favor llene los campos de Nombre y Precio.', 'error');
      return;
    }

    setIsSaving(true);
    showToast('Optimizando imágenes para la web...', 'info', 2000);

    try {
      // 1. Comprimir imágenes a alta resolución antes de subirlas (para optimizar velocidad de carga)
      const compressedFormImages = await Promise.all(
        formImages.map(img => compressSingleBase64(img, 1200, 1600, 0.8))
      );

      const compressedVariants = await Promise.all(
        formVariants.map(async (variant) => {
          const compressedVarImages = await Promise.all(
            (variant.images || []).map(img => compressSingleBase64(img, 1200, 1600, 0.8))
          );
          return {
            ...variant,
            images: compressedVarImages
          };
        })
      );

      // 2. Subir imágenes Base64 a ImgBB para obtener enlaces HTTPS directos
      showToast('Subiendo fotos en alta calidad a internet (ImgBB)...', 'info', 5000);
      
      let uploadedFormImages = [];
      let uploadedVariants = [];

      try {
        uploadedFormImages = await Promise.all(
          compressedFormImages.map(img => uploadToImgBB(img))
        );

        uploadedVariants = await Promise.all(
          compressedVariants.map(async (variant) => {
            const uploadedVarImages = await Promise.all(
              (variant.images || []).map(img => uploadToImgBB(img))
            );
            return {
              ...variant,
              images: uploadedVarImages
            };
          })
        );
      } catch (uploadErr) {
        console.error("Error al subir a ImgBB:", uploadErr);
        showToast('Error de conexión al subir imágenes a ImgBB. Inténtalo de nuevo.', 'error', 5500);
        setIsSaving(false);
        return;
      }

      // Determine product photos
      let primaryImage = '';
      let allImages = [];

      if (uploadedVariants.length > 0) {
        primaryImage = uploadedVariants[0].images[0];
        allImages = uploadedVariants[0].images;
      } else {
        // Fallback single product images
        if (uploadedFormImages.length === 0) {
          showToast('Debe cargar al menos una foto para el producto.', 'error');
          setIsSaving(false);
          return;
        }
        primaryImage = uploadedFormImages[0];
        allImages = uploadedFormImages;
      }

      const productPayload = {
        name: sanitizeInput(formName),
        brand: sanitizeInput(formBrand || 'OV33'),
        category: sanitizeInput(formCategory),
        subcategory: sanitizeInput(formSubcategory),
        price: formPrice.trim(),
        originalPrice: formOriginalPrice.trim(),
        isOnSale: formIsOnSale,
        isFlashDeal: formIsFlashDeal,
        badge: sanitizeInput(formBadge || ''),
        image: primaryImage,
        images: allImages,
        description: sanitizeInput(formDescription),
        sizes: formSizes,
        stock: uploadedVariants.length > 0 ? uploadedVariants[0].stock : formStock, // sync fallback stock
        variants: uploadedVariants.map(v => ({
          ...v,
          colorName: sanitizeInput(v.colorName)
        }))
      };

      // Validar tamaño total del documento para evitar superar límite de Firestore (1 MB)
      const payloadString = JSON.stringify(productPayload);
      const payloadSize = new Blob([payloadString]).size;
      
      console.log(`Document size: ${payloadSize} bytes`);
      if (payloadSize > 980000) {
        showToast(`El tamaño del producto (${(payloadSize / 1024 / 1024).toFixed(2)} MB) supera el límite. Intenta usar menos imágenes o variantes.`, 'error', 6000);
        setIsSaving(false);
        return;
      }

      showToast(editingId ? 'Actualizando prenda en la nube...' : 'Creando prenda en la nube...', 'info', 2000);

      if (editingId) {
        await updateProduct(editingId, productPayload);
        showToast('Prenda actualizada con éxito.', 'success');
      } else {
        await addProduct(productPayload);
        showToast('Nueva prenda creada con éxito.', 'success');
      }
      setIsFormOpen(false);
    } catch (error) {
      console.error("Error al guardar producto:", error);
      showToast('Error al conectar con la base de datos centralizada.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Category Submit
  const handleAddCategorySubmit = async (e) => {
    e.preventDefault();
    const cleanCatName = sanitizeInput(newCatName);
    if (!cleanCatName) return;
    try {
      showToast('Guardando nueva categoría...', 'info', 2000);
      await addCategory(cleanCatName);
      showToast(`Categoría "${cleanCatName}" agregada con éxito.`, 'success');
      setNewCatName('');
    } catch (error) {
      showToast(error.message || 'Error al agregar categoría.', 'error');
    }
  };

  // Handle Subcategory Add
  const handleAddSubcategorySubmit = async (catName) => {
    const subName = sanitizeInput(newSubcatInputs[catName] || '');
    if (!subName) return;
    try {
      showToast(`Agregando subcategoría "${subName}"...`, 'info', 2000);
      await addSubcategory(catName, subName);
      showToast(`Subcategoría "${subName}" agregada a "${catName}".`, 'success');
      setNewSubcatInputs(prev => ({ ...prev, [catName]: '' }));
    } catch (error) {
      showToast(error.message || 'Error al agregar subcategoría.', 'error');
    }
  };

  // Handle Subcategory Update
  const handleUpdateSubcategorySubmit = async (e) => {
    e.preventDefault();
    if (!editingSubcat) return;
    const { catName, oldName, newName } = editingSubcat;
    const cleanName = sanitizeInput(newName);
    if (!cleanName || cleanName === oldName) {
      setEditingSubcat(null);
      return;
    }
    try {
      setIsUpdatingSubcat(true);
      showToast('Actualizando subcategoría...', 'info', 1500);
      await updateSubcategory(catName, oldName, cleanName);
      showToast(`Subcategoría renombrada a "${cleanName}".`, 'success');
      setEditingSubcat(null);
    } catch (err) {
      showToast(err.message || 'Error al actualizar subcategoría.', 'error');
    } finally {
      setIsUpdatingSubcat(false);
    }
  };

  // Handle Subcategory Delete
  const handleDeleteSubcategory = async (catName, subName) => {
    const prodCount = products.filter(p => 
      (p.category || '').toLowerCase() === catName.toLowerCase() && 
      (p.subcategory || '').toLowerCase() === subName.toLowerCase()
    ).length;

    if (prodCount > 0) {
      showToast(`No puede eliminar la subcategoría "${subName}" porque tiene ${prodCount} prenda(s) vinculada(s).`, 'error');
      return;
    }

    if (window.confirm(`¿Seguro que desea eliminar la subcategoría "${subName}" de la categoría "${catName}"?`)) {
      try {
        showToast('Eliminando subcategoría...', 'info', 2000);
        await deleteSubcategory(catName, subName);
        showToast(`Subcategoría "${subName}" eliminada con éxito.`, 'success');
      } catch (err) {
        showToast(err.message || 'Error al eliminar la subcategoría.', 'error');
      }
    }
  };

  // Handle System Reset
  const handleSystemReset = () => {
    if (window.confirm('¿Está seguro de que desea restablecer todo a los valores iniciales? Esto borrará productos y pedidos personalizados.')) {
      resetToDefaults();
      alert('Sistema restablecido con éxito.');
      window.location.reload();
    }
  };

  // Sincronizar catálogo local a la nube (ImgBB + Firestore)
  const handleSyncLocalToCloud = async () => {
    const stored = localStorage.getItem('ov33_products') || localStorage.getItem('ed_victory_products');
    if (!stored) {
      showToast("No se encontraron productos en la memoria local.", "error");
      return;
    }

    try {
      const localProducts = JSON.parse(stored);
      // Filtrar sólo productos que NO son los por defecto (por ejemplo, ID > 8) o que tienen imágenes base64 locales
      const customProducts = localProducts.filter(p => p.id > 8 || (p.image && p.image.startsWith('data:image/')));

      if (customProducts.length === 0) {
        showToast("No hay productos personalizados nuevos para sincronizar.", "info");
        return;
      }

      setIsSaving(true);
      showToast(`Sincronizando ${customProducts.length} productos locales a la nube...`, "info", 4000);

      const uploadedProductPayloads = [];

      for (const product of customProducts) {
        showToast(`Optimizando imágenes para "${product.name}"...`, "info", 2000);
        
        const compressedImage = await compressSingleBase64(product.image, 1200, 1600, 0.8);
        const compressedImages = await Promise.all(
          (product.images || []).map(img => compressSingleBase64(img, 1200, 1600, 0.8))
        );

        const compressedVariants = await Promise.all(
          (product.variants || []).map(async (variant) => {
            const compressedVarImages = await Promise.all(
              (variant.images || []).map(img => compressSingleBase64(img, 1200, 1600, 0.8))
            );
            return {
              ...variant,
              images: compressedVarImages
            };
          })
        );

        // Subir a ImgBB
        showToast(`Subiendo imágenes de "${product.name}" a ImgBB...`, "info", 4000);
        const uploadedImage = await uploadToImgBB(compressedImage);
        const uploadedImages = await Promise.all(
          compressedImages.map(img => uploadToImgBB(img))
        );
        const uploadedVariants = await Promise.all(
          compressedVariants.map(async (variant) => {
            const uploadedVarImages = await Promise.all(
              (variant.images || []).map(img => uploadToImgBB(img))
            );
            return {
              ...variant,
              images: uploadedVarImages
            };
          })
        );

        const productPayload = {
          ...product,
          image: uploadedImage,
          images: uploadedImages,
          variants: uploadedVariants
        };

        // Subir a Firestore
        if (isFirebaseEnabled) {
          const { db } = await import('../utils/firebase');
          const { doc, setDoc } = await import('firebase/firestore');
          await setDoc(doc(db, 'ov33_products', String(product.id)), productPayload);
        }

        uploadedProductPayloads.push(productPayload);
      }

      // Guardar de vuelta en localStorage los productos actualizados con las URLs de ImgBB para mantener consistencia
      const updatedLocalProducts = localProducts.map(p => {
        const uploadedP = uploadedProductPayloads.find(up => up.id === p.id);
        return uploadedP ? uploadedP : p;
      });
      localStorage.setItem('ov33_products', JSON.stringify(updatedLocalProducts));

      // Recargar catálogo
      showToast("¡Catálogo sincronizado con éxito!", "success");
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error("Error sincronizando catálogo:", error);
      showToast("Error al sincronizar. Verifica tu conexión.", "error");
    } finally {
      setIsSaving(false);
    }
  };


  // Run Real-Time Cloud Database Diagnostics Test
  const handleTestDatabase = async () => {
    const withTimeout = (promise, ms = 4000) => {
      let timeoutId;
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error("Timeout: La conexión con Firestore tardó más de " + ms + "ms.\n\nCausa más probable:\n1. Creaste el proyecto en Firebase, pero NO has creado físicamente la base de datos de Firestore en la consola web.\n2. La conexión a los servidores de Google está siendo bloqueada por tu red o extensiones del navegador.\n\nSolución:\nVe a console.firebase.google.com -> Tu Proyecto -> Firestore Database -> presiona 'Crear base de datos' en Modo de Prueba."));
        }, ms);
      });
      return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
    };

    setDbTestState('testing');
    setDbTestMessage('Iniciando prueba de lectura/escritura en Google Firebase...');
    
    if (!isFirebaseEnabled) {
      setDbTestState('error');
      setDbTestMessage('Firebase no está habilitado en este entorno. Las variables de entorno VITE_FIREBASE_... no están configuradas en tu panel de Vercel o están vacías en tu archivo .env local.');
      return;
    }
    
    try {
      const { db } = await import('../utils/firebase');
      const { doc, setDoc, getDoc, deleteDoc } = await import('firebase/firestore');
      
      const testRef = doc(db, 'system_diagnostics', 'test_write');
      
      // Test write
      setDbTestMessage(prev => prev + '\n→ Escribiendo documento de diagnóstico en la nube ("system_diagnostics/test_write")...');
      await withTimeout(setDoc(testRef, {
        timestamp: new Date().toISOString(),
        testedBy: currentUser.email,
        status: 'OK'
      }), 4000);
      
      // Test read
      setDbTestMessage(prev => prev + '\n→ Leyendo documento de diagnóstico desde la nube...');
      const docSnap = await withTimeout(getDoc(testRef), 4000);
      if (docSnap.exists()) {
        setDbTestMessage(prev => prev + '\n✓ Documento leído con éxito.');
        
        // Test delete
        setDbTestMessage(prev => prev + '\n→ Limpiando base de datos (eliminando documento de prueba)...');
        await withTimeout(deleteDoc(testRef), 4000);
        setDbTestMessage(prev => prev + '\n✓ Limpieza completada.');
        
        setDbTestState('success');
        setDbTestMessage(prev => prev + '\n\n🎉 ¡PRUEBA EXITOSA! La base de datos centralizada de Firestore está operando al 100% de forma segura y con permisos plenos de lectura y escritura.');
      } else {
        throw new Error('El documento fue guardado pero falló la lectura (Retornó vacío).');
      }
    } catch (error) {
      console.error("Error en test de base de datos:", error);
      setDbTestState('error');
      let msg = error.message || 'Error desconocido';
      
      if (msg.includes('permission-denied') || error.code === 'permission-denied') {
        msg = 'Permisos Insuficientes (Permission Denied).\n\nCausa:\nEl proyecto Firestore en tu consola de Google tiene activas reglas de seguridad bloqueadas (Modo Producción).\n\nSolución:\n1. Ve a console.firebase.google.com -> Firestore Database -> Reglas (Rules).\n2. Cambia la regla para permitir lecturas/escrituras en modo de prueba:\n\nallow read, write: if true;';
      } else if (msg.includes('not-found') || error.code === 'not-found') {
        msg = 'Base de datos no encontrada (Not Found).\n\nCausa:\nCreaste el proyecto en Firebase pero no has hecho clic en "Firestore Database" -> "Crear base de datos" en tu consola de Google.\n\nSolución:\n1. Ve a console.firebase.google.com -> Tu Proyecto -> Firestore Database.\n2. Presiona "Crear base de datos" y actívala en "Modo de prueba".';
      } else if (msg.includes('Timeout')) {
        msg = 'Límite de tiempo excedido (Timeout).\n\nCausa:\nEl navegador no pudo contactar con los servidores de Google Firebase en menos de 4 segundos (bloqueo de red o base de datos no inicializada).\n\nSolución:\nVerifica que hayas completado el paso de crear la base de datos "Firestore Database" en tu consola web y que las reglas permitan la escritura.';
      }
      
      setDbTestMessage(prev => prev + `\n\n❌ FALLO EN DIAGNÓSTICO:\n${msg}`);
    }
  };

  // Filter products for Catalog view
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.category.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <main className="pt-[96px] min-h-screen flex flex-col lg:flex-row bg-[#f6f6f6]">
      {/* Admin Sidebar Navigation */}
      <aside className="w-full lg:w-72 bg-black text-white p-8 flex flex-col justify-between shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-10 pb-6 border-b border-neutral-800">
            <span className="material-symbols-outlined text-[32px] text-amber-500">shield_person</span>
            <div>
              <h2 className="font-label-caps text-sm tracking-wider uppercase font-bold">Consola Admin</h2>
              <span className="font-body-md text-[10px] text-neutral-400">OV33 MARKET ADMIN</span>
            </div>
          </div>

          <nav className="space-y-2">
            {[
              { id: 'dashboard', label: 'Resumen Financiero', icon: 'dashboard' },
              { id: 'products', label: 'Gestionar Catálogo', icon: 'apparel' },
              { id: 'categories', label: 'Gestionar Categorías', icon: 'sell' },
              { 
                id: 'wholesale', 
                label: 'Mayoristas / B2B', 
                icon: 'storefront',
                badge: wholesaleLeads.filter(l => l.status === 'Nuevo').length
              },
              { id: 'users', label: 'Gestionar Usuarios', icon: 'group' },
              { id: 'settings', label: 'Restablecer Datos', icon: 'restart_alt' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-between py-3 px-4 text-xs font-label-caps tracking-widest text-left uppercase transition-all rounded-none ${
                  activeTab === tab.id 
                    ? 'bg-amber-600 text-white font-bold' 
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                  <span>{tab.label}</span>
                </div>
                {Boolean(tab.badge) && tab.badge > 0 && (
                  <span className="bg-amber-500 text-black text-[10px] px-2 py-0.5 font-bold font-mono">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-12 pt-6 border-t border-neutral-800 space-y-4">
          <p className="font-body-md text-[11px] text-neutral-400">
            Identificado como:<br/>
            <strong className="text-white">{currentUser.name}</strong>
          </p>
          <button 
            onClick={() => navigate('/account')}
            className="w-full border border-neutral-700 py-2.5 font-button text-[10px] uppercase tracking-widest hover:border-white transition-colors"
          >
            VOLVER AL SITIO
          </button>
        </div>
      </aside>

      {/* Main Admin Console Area */}
      <section className="flex-1 p-8 md:p-12 overflow-y-auto max-w-[1200px] mx-auto w-full">
        {/* Tab 1: Dashboard Overview */}
        {activeTab === 'dashboard' && (
          <div className="space-y-12 animate-[fadeIn_0.3s_ease]">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <span className="font-label-caps text-xs text-neutral-400 uppercase tracking-widest">VISIÓN GENERAL</span>
                <h1 className="font-display-xl text-[28px] uppercase tracking-wide mt-2">Resumen Financiero y Métricas</h1>
              </div>
              
              {/* Cloud Database Connection Indicator */}
              <div className={`flex items-center gap-2.5 px-4 py-2 border text-xs font-label-caps tracking-wider uppercase font-semibold ${
                isFirebaseEnabled 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                  : 'bg-amber-50 text-amber-800 border-amber-250'
              }`}>
                <span className={`w-2 h-2 rounded-full block animate-pulse ${
                  isFirebaseEnabled ? 'bg-emerald-500' : 'bg-amber-500'
                }`} />
                {isFirebaseEnabled ? 'Nube de Google Activa (Firestore)' : 'Base de Datos de Respaldo Local'}
              </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {[
                { title: 'INGRESOS TOTALES', val: `$${totalSales.toLocaleString()} MXN`, icon: 'payments', color: 'text-emerald-600' },
                { title: 'PEDIDOS REALIZADOS', val: totalOrdersCount, icon: 'shopping_cart_checkout', color: 'text-blue-600' },
                { title: 'TICKET MEDIO', val: `$${averageOrderValue.toLocaleString()} MXN`, icon: 'analytics', color: 'text-amber-600' },
                { title: 'PRODUCTOS DE ALTA', val: activeProductsCount, icon: 'inventory', color: 'text-indigo-600' },
                { title: 'USUARIOS REGISTRADOS', val: registeredUsersCount, icon: 'badge', color: 'text-purple-600' }
              ].map((card, i) => (
                <div key={i} className="bg-white p-6 border border-neutral-200 shadow-xs flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-4">
                    <span className="font-label-caps text-[9px] text-neutral-400 uppercase tracking-wider">{card.title}</span>
                    <span className={`material-symbols-outlined text-[20px] ${card.color}`}>{card.icon}</span>
                  </div>
                  <span className="font-headline-md text-[18px] font-bold text-black">{card.val}</span>
                </div>
              ))}
            </div>

            {/* Recent Orders Section */}
            <div className="bg-white border border-neutral-200 p-8 shadow-xs">
              <h3 className="font-display-xl text-[18px] uppercase mb-6">Pedidos Recientes de Clientes</h3>
              
              {orders.length === 0 ? (
                <p className="font-body-md text-sm text-secondary text-center py-8">No se han registrado transacciones aún.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-body-md text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-200 font-label-caps text-[10px] text-neutral-400">
                        <th className="pb-4">Nº PEDIDO</th>
                        <th className="pb-4">CLIENTE</th>
                        <th className="pb-4">FECHA</th>
                        <th className="pb-4">TOTAL</th>
                        <th className="pb-4">ESTADO</th>
                        <th className="pb-4">PAQUETERÍA / ENVIA.COM</th>
                        <th className="pb-4 text-right">ACCIONES</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 text-xs">
                      {orders.map(order => {
                        const carrierInfo = order.shippingDetails?.carrierName || order.carrier || 'FedEx Nacional';
                        const isGenerating = generatingLabelId === order.id;

                        return (
                          <tr key={order.id} className="hover:bg-neutral-50">
                            <td className="py-4 font-bold text-black">{order.id}</td>
                            <td className="py-4">
                              <strong className="text-black block">{order.customerName}</strong>
                              <span className="text-[10px] text-neutral-400">{order.customerEmail}</span>
                            </td>
                            <td className="py-4">
                              {order.createdAt ? new Date(order.createdAt).toLocaleDateString('es-MX', { year: '2-digit', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Reciente'}
                            </td>
                            <td className="py-4 font-bold text-black">${order.total?.toLocaleString()} MXN</td>
                            <td className="py-4">
                              <span className={`inline-block font-label-caps text-[9px] px-2 py-0.5 rounded font-bold ${
                                order.status === 'Entregado' || order.status === 'Enviado'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                  : 'bg-amber-50 text-amber-700 border border-amber-100'
                              }`}>
                                {order.status}
                              </span>
                            </td>
                            <td className="py-4">
                              <div className="space-y-1">
                                <span className="font-label-caps text-[10px] font-bold text-neutral-800 block">
                                  {carrierInfo}
                                </span>
                                {order.labelUrl ? (
                                  <div className="flex items-center gap-2">
                                    <a 
                                      href={order.labelUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 font-label-caps text-[9px] text-blue-600 hover:text-blue-800 underline font-bold"
                                    >
                                      <span className="material-symbols-outlined text-[12px]">picture_as_pdf</span>
                                      IMPRIMIR GUÍA
                                    </a>
                                    {order.trackingNumber && (
                                      <span className="text-[9px] text-neutral-400 font-mono">
                                        ({order.trackingNumber})
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleGenerateLabel(order)}
                                    disabled={isGenerating}
                                    className="font-label-caps text-[9px] bg-black text-white px-2.5 py-1 uppercase tracking-wider hover:bg-neutral-800 disabled:opacity-50 transition-colors inline-flex items-center gap-1"
                                  >
                                    <span className="material-symbols-outlined text-[12px]">local_shipping</span>
                                    {isGenerating ? 'GENERANDO...' : 'GENERAR GUÍA'}
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="py-4 text-right">
                              <button
                                onClick={() => updateOrderStatus(
                                  order.id, 
                                  order.status === 'Procesando' ? 'Entregado' : 'Procesando'
                                )}
                                className="font-label-caps text-[9px] border border-neutral-300 py-1.5 px-3 uppercase tracking-widest hover:bg-black hover:text-white transition-colors"
                              >
                                Cambiar a {order.status === 'Procesando' ? 'Entregado' : 'Procesando'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Catalog Management */}
        {activeTab === 'products' && (
          <div className="space-y-8 animate-[fadeIn_0.3s_ease]">

            {/* ⚠️ Firebase Offline Warning — bloquea edición si no hay conexión a la nube */}
            {isUsingFallback && (
              <div className="border-2 border-red-500 bg-red-50 rounded-sm p-4 flex items-start gap-4">
                <span className="material-symbols-outlined text-red-600 text-[28px] mt-0.5 flex-shrink-0">cloud_off</span>
                <div>
                  <p className="font-semibold text-red-700 text-sm uppercase tracking-wider mb-1">⚠️ Sin conexión a Firebase — Edición bloqueada</p>
                  <p className="text-red-600 text-sm">
                    La plataforma no puede conectar con la base de datos en la nube. Cualquier producto que agregues o edites ahora <strong>se perderá</strong> al recargar la página. Por tu seguridad, las acciones del catálogo están bloqueadas hasta restaurar la conexión.
                  </p>
                  <p className="text-red-500 text-xs mt-2">Recarga la página o verifica tu conexión a internet para intentar reconectar.</p>
                </div>
              </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="font-label-caps text-xs text-neutral-400 uppercase tracking-widest">PRODUCTOS</span>
                <h1 className="font-display-xl text-[28px] uppercase tracking-wide mt-2">Gestionar Catálogo</h1>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button 
                  onClick={isUsingFallback ? undefined : handleOpenAdd}
                  disabled={isUsingFallback}
                  title={isUsingFallback ? 'No disponible: Firebase sin conexión' : 'Añadir nuevo producto'}
                  className={`px-6 py-3 font-button text-xs uppercase tracking-widest flex items-center gap-2 transition-colors ${
                    isUsingFallback
                      ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                      : 'bg-black text-white hover:bg-neutral-800 cursor-pointer'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">{isUsingFallback ? 'block' : 'add'}</span>
                  {isUsingFallback ? 'BLOQUEADO — SIN CONEXIÓN' : 'AÑADIR PRODUCTO'}
                </button>
              </div>
            </div>

            {/* Search filter bar */}
            <div className="bg-white border border-neutral-200 p-4 flex gap-4">
              <span className="material-symbols-outlined text-[20px] text-neutral-400 self-center pl-2">search</span>
              <input 
                type="text"
                placeholder="Buscar por nombre de camisa, categoría..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full bg-transparent border-none outline-none py-1 text-sm font-body-md"
              />
            </div>

            {/* Products Table */}
            <div className="bg-white border border-neutral-200 p-8 shadow-xs">
              {filteredProducts.length === 0 ? (
                <p className="font-body-md text-sm text-secondary text-center py-8">No se encontraron productos.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-body-md text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-200 font-label-caps text-[10px] text-neutral-400">
                        <th className="pb-4">FOTO</th>
                        <th className="pb-4">PRENDA / ACCESORIO</th>
                        <th className="pb-4">CATEGORÍA</th>
                        <th className="pb-4">PRECIO</th>
                        <th className="pb-4">COLORES / STOCK TALLAS</th>
                        <th className="pb-4 text-right">ACCIONES</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 text-xs">
                      {filteredProducts.map(product => {
                        const sizesList = product.sizes || [];
                        const hasVars = product.variants && product.variants.length > 0;
                        
                        return (
                          <tr key={product.id} className="hover:bg-neutral-50">
                            <td className="py-4">
                              <div className="w-10 h-13 bg-white border border-neutral-200 overflow-hidden flex items-center justify-center">
                                <img src={product.image} alt={product.name} className="w-full h-full object-contain" />
                              </div>
                            </td>
                            <td className="py-4">
                              <div className="flex items-center gap-2">
                                <strong className="text-black block uppercase tracking-wide text-sm">{product.name}</strong>
                                {hasVars && (
                                  <span className="bg-amber-100 text-amber-800 text-[8px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[10px]">palette</span>
                                    {product.variants.length} COLORES
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-neutral-400 line-clamp-1 max-w-[250px]">{product.description || 'Sin descripción.'}</span>
                            </td>
                            <td className="py-4 font-label-caps text-[10px] text-neutral-600">
                              <div className="font-bold text-neutral-900 uppercase tracking-wider">{product.category || 'Camisas'}</div>
                              {product.subcategory && (
                                <span className="inline-block mt-0.5 px-1.5 py-0.5 bg-neutral-100 text-neutral-600 text-[9px] font-medium tracking-normal border border-neutral-200">
                                  {product.subcategory}
                                </span>
                              )}
                            </td>
                            <td className="py-4 font-bold text-black">
                              <div>${product.price} MXN</div>
                              {product.isOnSale && (
                                <div className="flex items-center gap-1 mt-1">
                                  <span className="bg-[#b91c1c] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-xs uppercase tracking-wider">
                                    {product.originalPrice ? `-${Math.round(((Number(String(product.originalPrice).replace(/,/g, '')) - Number(String(product.price).replace(/,/g, ''))) / Number(String(product.originalPrice).replace(/,/g, ''))) * 100)}%` : 'OFERTA'}
                                  </span>
                                  {product.originalPrice && (
                                    <span className="line-through text-neutral-400 text-[10px] font-normal">
                                      ${product.originalPrice}
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                            
                            <td className="py-4 font-body-md text-[11px] text-neutral-600">
                              {hasVars ? (
                                <div className="space-y-1.5">
                                  {product.variants.map((v, vIdx) => (
                                    <div key={vIdx} className="flex items-center gap-2">
                                      <span 
                                        style={{ backgroundColor: v.colorHex }}
                                        className="w-2.5 h-2.5 rounded-full border border-neutral-300 block"
                                        title={v.colorName}
                                      />
                                      <span className="font-bold text-neutral-700 text-[10px]">{v.colorName}:</span>
                                      <span className="text-[9px] text-neutral-400">
                                        {sizesList.map(sz => `${sz}(${v.stock && v.stock[sz] !== undefined ? v.stock[sz] : 0})`).join(', ')}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="flex flex-wrap gap-x-2 gap-y-1">
                                  {sizesList.map(sz => {
                                    const stk = product.stock && product.stock[sz] !== undefined ? product.stock[sz] : 10;
                                    return (
                                      <span key={sz} className={`inline-block px-1.5 py-0.5 rounded-sm font-semibold text-[10px] ${
                                        stk === 0 
                                          ? 'bg-red-50 text-red-600 border border-red-100 line-through' 
                                          : stk <= 3 
                                            ? 'bg-amber-50 text-amber-600 border border-amber-100' 
                                            : 'bg-neutral-50 text-neutral-800 border border-neutral-100'
                                      }`}>
                                        {sz}: <strong>{stk}</strong>
                                      </span>
                                    );
                                  })}
                                </div>
                              )}
                            </td>

                            <td className="py-4 text-right space-x-2 shrink-0">
                              <button
                                onClick={() => !isUsingFallback && handleOpenEdit(product)}
                                disabled={isUsingFallback}
                                title={isUsingFallback ? 'Sin conexión a Firebase' : 'Editar producto'}
                                className={`font-label-caps text-[9px] border py-1.5 px-3 uppercase transition-colors ${
                                  isUsingFallback
                                    ? 'border-neutral-200 text-neutral-300 cursor-not-allowed'
                                    : 'border-neutral-300 hover:border-black hover:text-black cursor-pointer'
                                }`}
                              >
                                Editar
                              </button>
                              <button
                                onClick={async () => {
                                  if (isUsingFallback) return;
                                  if (window.confirm(`¿Seguro que desea eliminar "${product.name}"?`)) {
                                    try {
                                      showToast('Eliminando prenda...', 'info', 2000);
                                      await deleteProduct(product.id);
                                      showToast('Prenda eliminada con éxito.', 'success');
                                    } catch (err) {
                                      showToast('Error al eliminar la prenda.', 'error');
                                    }
                                  }
                                }}
                                disabled={isUsingFallback}
                                title={isUsingFallback ? 'Sin conexión a Firebase' : 'Eliminar producto'}
                                className={`font-label-caps text-[9px] border py-1.5 px-3 uppercase transition-colors ${
                                  isUsingFallback
                                    ? 'border-neutral-200 text-neutral-300 cursor-not-allowed'
                                    : 'border-red-200 text-red-600 hover:bg-red-50 cursor-pointer'
                                }`}
                              >
                                Eliminar
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Slide-out Overlay drawer for editing or creating product */}
            {isFormOpen && (
              <>
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]" onClick={() => setIsFormOpen(false)} />
                <div className="fixed top-0 right-0 h-full w-full max-w-[550px] bg-white z-[70] shadow-2xl p-8 flex flex-col overflow-y-auto animate-[slideInRight_0.4s_ease-out] rounded-none">
                  
                  <header className="flex justify-between items-center mb-6 border-b border-neutral-100 pb-4">
                    <h3 className="font-display-xl text-[18px] uppercase font-bold">
                      {editingId ? 'Editar Prenda / Catálogo' : 'Añadir Nueva Prenda'}
                    </h3>
                    <button onClick={() => setIsFormOpen(false)} className="hover:text-amber-600 transition-colors">
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </header>

                  <form onSubmit={handleSaveProduct} className="space-y-6 flex-1 flex flex-col justify-between">
                    <div className="space-y-6">
                      {/* Name & Brand input */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-2 relative border-b border-neutral-200 focus-within:border-black transition-colors">
                          <label className="block font-label-caps text-[9px] text-neutral-400 tracking-wider uppercase mb-1">Nombre Comercial del Producto *</label>
                          <input 
                            type="text" 
                            value={formName}
                            onChange={(e) => setFormName(e.target.value)}
                            className="w-full bg-transparent border-none outline-none py-2 text-sm font-body-md"
                            placeholder="Ej. Sneakers Nike Air Max Excee"
                            required
                          />
                        </div>
                        <div className="relative border-b border-neutral-200 focus-within:border-black transition-colors">
                          <label className="block font-label-caps text-[9px] text-neutral-400 tracking-wider uppercase mb-1">Marca Comercial *</label>
                          <input 
                            type="text" 
                            value={formBrand}
                            onChange={(e) => setFormBrand(e.target.value)}
                            className="w-full bg-transparent border-none outline-none py-2 text-sm font-body-md font-bold text-orange-600"
                            placeholder="Ej. Nike, Apple, Xiaomi, Casio"
                            required
                          />
                        </div>
                      </div>

                      {/* Category and Subcategory select */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block font-label-caps text-[9px] text-neutral-400 tracking-wider uppercase mb-2">Categoría Principal *</label>
                          <select
                            value={formCategory}
                            onChange={(e) => {
                              const newCat = e.target.value;
                              setFormCategory(newCat);
                              const catObj = categoryTree.find(c => c.name.toLowerCase() === newCat.toLowerCase());
                              if (catObj && catObj.subcategories && catObj.subcategories.length > 0) {
                                if (!catObj.subcategories.includes(formSubcategory)) {
                                  setFormSubcategory(catObj.subcategories[0]);
                                }
                              } else {
                                setFormSubcategory('');
                              }
                            }}
                            className="w-full border border-neutral-200 py-3 px-3 font-label-caps text-xs focus:border-black outline-none bg-white"
                          >
                            {categories.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block font-label-caps text-[9px] text-neutral-400 tracking-wider uppercase mb-2">Subcategoría</label>
                          {(() => {
                            const currentCatObj = categoryTree.find(c => c.name.toLowerCase() === (formCategory || '').toLowerCase());
                            const availableSubs = currentCatObj?.subcategories || [];
                            if (availableSubs.length > 0) {
                              return (
                                <select
                                  value={formSubcategory}
                                  onChange={(e) => setFormSubcategory(e.target.value)}
                                  className="w-full border border-neutral-200 py-3 px-3 font-label-caps text-xs focus:border-black outline-none bg-white"
                                >
                                  <option value="">-- Sin subcategoría --</option>
                                  {availableSubs.map(sub => (
                                    <option key={sub} value={sub}>{sub}</option>
                                  ))}
                                </select>
                              );
                            }
                            return (
                              <input
                                type="text"
                                value={formSubcategory}
                                onChange={(e) => setFormSubcategory(e.target.value)}
                                placeholder="Opcional (Ej. Lisas, Cuadros)"
                                className="w-full border border-neutral-200 py-2.5 px-3 font-body-md text-xs focus:border-black outline-none bg-white"
                              />
                            );
                          })()}
                        </div>
                      </div>

                      {/* Price input */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="relative border-b border-neutral-200 focus-within:border-black transition-colors">
                          <label className="block font-label-caps text-[9px] text-neutral-400 tracking-wider uppercase mb-1">Precio de Venta ($ MXN) *</label>
                          <input 
                            type="text" 
                            value={formPrice}
                            onChange={(e) => setFormPrice(e.target.value)}
                            className="w-full bg-transparent border-none outline-none py-2 text-sm font-body-md font-bold"
                            placeholder="Ej. 1,890"
                            required
                          />
                        </div>

                        <div className="relative border-b border-neutral-200 focus-within:border-black transition-colors">
                          <label className="block font-label-caps text-[9px] text-neutral-400 tracking-wider uppercase mb-1">Precio Original / Tachado ($ MXN)</label>
                          <input 
                            type="text" 
                            value={formOriginalPrice}
                            onChange={(e) => setFormOriginalPrice(e.target.value)}
                            className="w-full bg-transparent border-none outline-none py-2 text-sm font-body-md font-medium text-neutral-600"
                            placeholder="Ej. 2,350 (opcional)"
                          />
                        </div>
                      </div>

                      {/* Sale toggle */}
                      <div className="p-3.5 bg-neutral-50 border border-neutral-200 flex items-center justify-between">
                        <div>
                          <span className="font-label-caps text-[10px] font-bold text-neutral-900 uppercase block">¿Poner en Oferta Especial?</span>
                          <span className="font-body-md text-[10px] text-neutral-500">Aparecerá en la sección de Ofertas y mostrará etiqueta de descuento</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormIsOnSale(!formIsOnSale)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            formIsOnSale ? 'bg-[#b91c1c]' : 'bg-neutral-300'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              formIsOnSale ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Description input */}
                      <div className="relative border-b border-neutral-200 focus-within:border-black transition-colors">
                        <label className="block font-label-caps text-[9px] text-neutral-400 tracking-wider uppercase mb-1">Descripción de la Prenda</label>
                        <textarea 
                          value={formDescription}
                          onChange={(e) => setFormDescription(e.target.value)}
                          className="w-full bg-transparent border-none outline-none py-2 text-sm font-body-md min-h-[70px]"
                          placeholder="Escriba los detalles de confección, corte o tela..."
                        />
                      </div>

                      {/* General Tallas Selector */}
                      <div>
                        <label className="block font-label-caps text-[9px] text-neutral-400 tracking-wider uppercase mb-3">Tallas Habilitadas en este Modelo *</label>
                        <div className="flex flex-wrap gap-2">
                          {['Única', 'S', 'M', 'L', 'XL', 'XXL'].map(size => {
                            const isSizeActive = formSizes.includes(size);
                            return (
                              <button
                                key={size}
                                type="button"
                                onClick={() => handleSizeToggle(size)}
                                className={`border py-2 px-4 text-[10px] font-bold transition-all ${
                                  isSizeActive
                                    ? 'border-black bg-black text-white' 
                                    : 'border-neutral-200 text-neutral-400 hover:bg-neutral-50'
                                }`}
                              >
                                TALLA {size}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* ──────────────────────────────────────────────────────── */}
                      {/* MULTI-COLOR VARIANTS SECTION */}
                      {/* ──────────────────────────────────────────────────────── */}
                      <div className="border-t border-neutral-200 pt-6 space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="font-label-caps text-[11px] text-black tracking-widest uppercase font-bold">Variantes de Color ({formVariants.length})</h4>
                          {!showVariantForm && (
                            <button
                              type="button"
                              onClick={handleOpenAddVariant}
                              className="border border-black text-black text-[9px] font-label-caps py-1.5 px-3 uppercase tracking-wider hover:bg-black hover:text-white transition-colors"
                            >
                              + Añadir Color
                            </button>
                          )}
                        </div>

                        {/* List of active color variants */}
                        {formVariants.length > 0 && !showVariantForm && (
                          <div className="space-y-3 bg-[#fafafa] p-4 border border-neutral-150">
                            {formVariants.map((variant, idx) => (
                              <div key={idx} className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-none">
                                <div className="flex items-center gap-3">
                                  <span 
                                    style={{ backgroundColor: variant.colorHex }}
                                    className="w-5 h-5 rounded-full border border-neutral-300 block shrink-0"
                                  />
                                  <div>
                                    <strong className="font-body-md text-xs uppercase block text-neutral-800">{variant.colorName}</strong>
                                    <span className="font-body-md text-[9px] text-neutral-400">
                                      Fotos: {variant.images.length} | Stock total: {Object.values(variant.stock).reduce((s, v) => s + v, 0)} pzs
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditVariant(idx)}
                                    className="font-label-caps text-[8px] border border-neutral-300 px-2 py-1 uppercase hover:border-black transition-colors"
                                  >
                                    Editar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveVariant(idx)}
                                    className="font-label-caps text-[8px] border border-red-200 text-red-600 px-2 py-1 uppercase hover:bg-red-50 transition-colors"
                                  >
                                    Quitar
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Variant Add/Edit Sub-Form inside sidebar */}
                        {showVariantForm && (
                          <div className="bg-[#fcfcfc] border border-amber-600 p-6 space-y-6 animate-[fadeIn_0.3s_ease] rounded-none">
                            <h5 className="font-label-caps text-[10px] text-amber-700 tracking-wider uppercase font-bold border-b border-amber-250 pb-2">
                              {varEditIdx !== null ? `Editar Variante: ${varName}` : 'Nueva Variante de Color'}
                            </h5>

                            {/* Color Name Input */}
                            <div className="relative border-b border-neutral-200 focus-within:border-black transition-colors">
                              <label className="block font-label-caps text-[9px] text-neutral-400 tracking-wider uppercase mb-1">Nombre del Color *</label>
                              <input 
                                type="text" 
                                value={varName}
                                onChange={(e) => setVarName(e.target.value)}
                                className="w-full bg-transparent border-none outline-none py-1.5 text-xs font-body-md uppercase"
                                placeholder="Ej. Azul Celeste"
                                required
                              />
                            </div>

                            {/* Color Hex Input */}
                            <div className="flex items-center gap-4">
                              <div className="flex-1 relative border-b border-neutral-200 focus-within:border-black transition-colors">
                                <label className="block font-label-caps text-[9px] text-neutral-400 tracking-wider uppercase mb-1">Código del Swatch (HEX) *</label>
                                <input 
                                  type="text" 
                                  value={varHex}
                                  maxLength="7"
                                  onChange={(e) => setVarHex(e.target.value)}
                                  className="w-full bg-transparent border-none outline-none py-1.5 text-xs font-body-md uppercase font-bold"
                                  placeholder="Ej. #A0C4DF"
                                  required
                                />
                              </div>
                              <input 
                                type="color" 
                                value={varHex.startsWith('#') ? varHex : '#FFFFFF'} 
                                onChange={(e) => setVarHex(e.target.value)}
                                className="w-10 h-10 border border-neutral-200 cursor-pointer shrink-0 rounded-full"
                              />
                            </div>

                            {/* Drag-and-Drop Local Image Loader for Variant Color */}
                            <div>
                              <label className="block font-label-caps text-[9px] text-neutral-400 tracking-wider uppercase mb-2">
                                Fotos de esta Variante ({varImages.length}/8)*
                              </label>
                              
                              <div 
                                onClick={() => variantFileInputRef.current?.click()}
                                onDragOver={handleVarDragOver}
                                onDragLeave={handleVarDragLeave}
                                onDrop={handleVarDrop}
                                className={`border-2 border-dashed p-5 text-center cursor-pointer transition-all select-none rounded-none flex flex-col items-center justify-center min-h-[90px] ${
                                  isVarDragging 
                                    ? 'border-amber-600 bg-amber-50/50' 
                                    : 'border-neutral-200 hover:border-black hover:bg-neutral-50/50'
                                }`}
                              >
                                <input 
                                  type="file" 
                                  multiple 
                                  accept="image/*"
                                  onChange={(e) => e.target.files && processVariantFiles(e.target.files)}
                                  ref={variantFileInputRef}
                                  className="hidden"
                                />
                                <span className="material-symbols-outlined text-[24px] text-neutral-400 mb-1">
                                  add_photo_alternate
                                </span>
                                <p className="font-label-caps text-[8px] tracking-wider text-neutral-600 uppercase mb-0.5">
                                  {isVarDragging ? '¡SUELTA FOTOS!' : 'Cargar Fotos de este Color'}
                                </p>
                              </div>

                              {varImageError && (
                                <p className="text-[9px] text-red-600 mt-2 font-body-md">{varImageError}</p>
                              )}

                              {/* Variant Image Previews */}
                              {varImages.length > 0 && (
                                <div className="grid grid-cols-4 gap-2 mt-3">
                                  {varImages.map((img, idx) => (
                                    <div key={idx} className="aspect-[3/4] border border-neutral-200 relative group overflow-hidden bg-neutral-50">
                                      <img src={img} alt="Miniatura color" className="w-full h-full object-contain bg-white" />
                                      <button
                                        type="button"
                                        onClick={() => setVarImages(varImages.filter((_, i) => i !== idx))}
                                        className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/80 hover:bg-red-600 text-white flex items-center justify-center text-[10px] font-bold"
                                      >
                                        ×
                                      </button>
                                      {idx === 0 && (
                                        <span className="absolute bottom-0 left-0 right-0 bg-black/75 text-white text-[7px] font-label-caps py-0.5 text-center uppercase tracking-widest">
                                          PRINCIPAL
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Variant stock quantities per size */}
                            <div>
                              <label className="block font-label-caps text-[9px] text-neutral-400 tracking-wider uppercase mb-2">Inventario por Talla (para este Color) *</label>
                              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 hide-scrollbar bg-white p-3 border border-neutral-100">
                                {formSizes.map(sz => (
                                  <div key={sz} className="flex items-center justify-between text-xs py-1 border-b border-neutral-50 last:border-none">
                                    <strong className="font-label-caps text-[9px] text-neutral-600 uppercase">TALLA {sz}</strong>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[9px] text-neutral-400">Stock:</span>
                                      <input 
                                        type="number"
                                        min="0"
                                        value={varStock[sz] !== undefined ? varStock[sz] : 10}
                                        onChange={(e) => handleVariantStockChange(sz, e.target.value)}
                                        className="border border-neutral-200 text-center py-0.5 w-12 font-body-md text-xs font-bold focus:border-black outline-none"
                                        required
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Sub-form action buttons */}
                            <div className="flex gap-2 pt-2">
                              <button
                                type="button"
                                onClick={handleSaveVariant}
                                className="flex-1 bg-amber-600 text-white py-2 font-button text-[10px] uppercase tracking-wider hover:bg-amber-700 transition-colors"
                              >
                                {varEditIdx !== null ? 'Guardar Color' : 'Añadir Color'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setShowVariantForm(false)}
                                className="flex-1 border border-neutral-300 text-neutral-600 py-2 font-button text-[10px] uppercase tracking-wider hover:bg-neutral-50 transition-colors"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* ──────────────────────────────────────────────────────── */}
                      {/* SINGLE PRODUCT FALLBACK MEDIA / STOCK SECTION */}
                      {/* ──────────────────────────────────────────────────────── */}
                      {formVariants.length === 0 && (
                        <div className="border-t border-neutral-200 pt-6 space-y-6 animate-[fadeIn_0.3s_ease]">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-label-caps text-[11px] text-neutral-600 tracking-widest uppercase">Fotografías de Portada y Galería *</h4>
                          </div>

                          {/* Drag zone for single mode */}
                          <div>
                            <div 
                              onClick={() => fileInputRef.current?.click()}
                              onDragOver={handleDragOver}
                              onDragLeave={handleDragLeave}
                              onDrop={handleDrop}
                              className={`border-2 border-dashed p-6 text-center cursor-pointer transition-all select-none rounded-none flex flex-col items-center justify-center min-h-[120px] ${
                                isDragging 
                                  ? 'border-amber-600 bg-amber-50/50' 
                                  : 'border-neutral-200 hover:border-black hover:bg-neutral-50/50'
                              }`}
                            >
                              <input 
                                type="file" 
                                multiple 
                                accept="image/*"
                                onChange={handleFileChange}
                                ref={fileInputRef}
                                className="hidden"
                              />
                              <span className="material-symbols-outlined text-[32px] text-neutral-400 mb-2">
                                add_photo_alternate
                              </span>
                              <p className="font-label-caps text-[9px] tracking-wider text-neutral-600 uppercase mb-1">
                                Arrastra tus imágenes aquí
                              </p>
                              <p className="font-body-md text-[10px] text-neutral-400 font-light">
                                o haz clic para explorar tus archivos locales
                              </p>
                            </div>

                            {imageError && (
                              <p className="text-[10px] text-red-600 mt-2 font-body-md">{imageError}</p>
                            )}

                            {/* Images previews */}
                            {formImages.length > 0 && (
                              <div className="grid grid-cols-4 gap-3 mt-4">
                                {formImages.map((img, idx) => (
                                  <div key={idx} className="aspect-[3/4] border border-neutral-200 relative group overflow-hidden bg-neutral-50">
                                    <img src={img} alt="Vista cargada" className="w-full h-full object-contain bg-white" />
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveImage(idx)}
                                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/80 hover:bg-red-600 text-white flex items-center justify-center transition-colors text-xs font-bold"
                                    >
                                      ×
                                    </button>
                                    {idx === 0 && (
                                      <span className="absolute bottom-0 left-0 right-0 bg-black/75 text-white text-[8px] font-label-caps py-0.5 text-center uppercase tracking-widest">
                                        PORTADA
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Stock grid for single mode */}
                          <div>
                            <label className="block font-label-caps text-[9px] text-neutral-400 tracking-wider uppercase mb-3">Tallas Disponibles y Stock en Tienda *</label>
                            <div className="space-y-3 bg-[#fafafa] p-4 border border-neutral-100">
                              {['Única', 'S', 'M', 'L', 'XL', 'XXL'].map(size => {
                                const isSizeActive = formSizes.includes(size);
                                return (
                                  <div key={size} className="flex items-center justify-between gap-4 py-1.5 border-b border-neutral-100 last:border-none">
                                    <button
                                      type="button"
                                      onClick={() => handleSizeToggle(size)}
                                      className={`border py-1.5 px-3 text-[10px] font-bold w-20 transition-all ${
                                        isSizeActive
                                          ? 'border-black bg-black text-white' 
                                          : 'border-neutral-200 text-neutral-400 hover:bg-neutral-50'
                                      }`}
                                    >
                                      TALLA {size}
                                    </button>
                                    
                                    {isSizeActive ? (
                                      <div className="flex items-center gap-2">
                                        <span className="font-label-caps text-[9px] text-neutral-500 uppercase">UNIDADES EN STOCK:</span>
                                        <input
                                          type="number"
                                          min="0"
                                          max="999"
                                          value={formStock[size] !== undefined ? formStock[size] : 10}
                                          onChange={(e) => handleStockChange(size, e.target.value)}
                                          className="border border-neutral-200 bg-white font-bold text-center py-1 text-xs w-16 focus:border-black outline-none font-body-md"
                                          required
                                        />
                                      </div>
                                    ) : (
                                      <span className="font-body-md text-[10px] text-neutral-400 italic">Desactivada</span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-8 border-t border-neutral-100 mt-8 space-y-3">
                      <button 
                        type="submit"
                        disabled={isSaving}
                        className="w-full bg-black text-white py-4 font-button text-button uppercase tracking-widest hover:bg-neutral-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isSaving && (
                          <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                        )}
                        {isSaving ? 'GUARDANDO CAMBIOS...' : (editingId ? 'GUARDAR CAMBIOS' : 'CREAR PRODUCTO')}
                      </button>
                      <button 
                        type="button"
                        disabled={isSaving}
                        onClick={() => setIsFormOpen(false)}
                        className="w-full border border-neutral-200 text-neutral-700 py-3.5 font-button text-xs uppercase tracking-widest hover:bg-neutral-50 transition-colors disabled:opacity-50"
                      >
                        CANCELAR
                      </button>
                    </div>
                  </form>
                </div>
              </>
            )}
          </div>
        )}

        {/* Tab 3: Category & Subcategory Management */}
        {activeTab === 'categories' && (
          <div className="space-y-8 animate-[fadeIn_0.3s_ease]">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="font-label-caps text-xs text-neutral-400 uppercase tracking-widest">JERARQUÍA DEL CATÁLOGO</span>
                <h1 className="font-display-xl text-[28px] uppercase tracking-wide mt-1">Categorías y Subcategorías</h1>
                <p className="text-xs text-neutral-500 mt-1">Organice las familias de prendas principales y sus respectivas subcategorías (ej. Camisas › Cuadros, Lisas, Líneas).</p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  if (window.confirm("¿Deseas restaurar la estructura oficial del catálogo: Categoría principal 'Camisas' con subcategorías 'Lisas', 'Cuadros' y 'Líneas'?")) {
                    try {
                      showToast("Sincronizando estructura oficial...", "info", 3000);
                      await resetToDefaults();
                      showToast("Estructura oficial de camisas restaurada con éxito.", "success");
                    } catch (e) {
                      showToast("Error al sincronizar: " + (e.message || e), "error");
                    }
                  }
                }}
                className="self-start sm:self-auto font-label-caps text-[10px] border border-neutral-300 hover:border-black text-neutral-700 hover:text-black hover:bg-neutral-50 px-4 py-2 uppercase tracking-widest transition-colors font-bold cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                Restaurar Estructura Oficial
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Nueva Categoría Principal */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white border border-neutral-200 p-6 shadow-xs rounded-none">
                  <h3 className="font-display-xl text-[16px] uppercase mb-4 border-b border-neutral-100 pb-3 font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-neutral-700">folder_open</span>
                    Nueva Categoría Principal
                  </h3>
                  <form onSubmit={handleAddCategorySubmit} className="space-y-4">
                    <div className="relative border-b border-neutral-200 focus-within:border-black transition-colors">
                      <label className="block font-label-caps text-[9px] text-neutral-400 tracking-wider uppercase mb-1">Nombre de la Categoría</label>
                      <input 
                        type="text" 
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        className="w-full bg-transparent border-none outline-none py-2 text-sm font-body-md uppercase tracking-wider font-semibold"
                        placeholder="Ej. Camisas, Polos, Trajes..."
                        required
                      />
                    </div>
                    <p className="text-[11px] text-neutral-400 font-body-md leading-relaxed">
                      Crea la categoría base. Luego podrás añadirle todas sus subcategorías de confección o estilo.
                    </p>
                    <button 
                      type="submit"
                      className="w-full bg-black text-white py-3 font-button text-xs uppercase tracking-widest hover:bg-neutral-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">add</span>
                      AÑADIR CATEGORÍA
                    </button>
                  </form>
                </div>

                {/* Resumen Card */}
                <div className="bg-[#fafafa] border border-neutral-200 p-6">
                  <h4 className="font-label-caps text-[11px] font-bold text-neutral-800 uppercase tracking-widest mb-3">Guía de Organización</h4>
                  <ul className="text-xs text-neutral-600 space-y-2 leading-relaxed">
                    <li className="flex items-start gap-2">
                      <span className="text-[#c5a880] font-bold">1.</span>
                      <span><strong>Categoría:</strong> Prenda principal (ej. <em>Camisas</em>).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#c5a880] font-bold">2.</span>
                      <span><strong>Subcategoría:</strong> Tipología de diseño (ej. <em>Lisas, Cuadros, Líneas</em>).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#c5a880] font-bold">3.</span>
                      <span>Tanto la categoría como la subcategoría pueden filtrarse en el catálogo de clientes.</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Right Column: Árbol de Categorías y Subcategorías */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white border border-neutral-200 p-6 shadow-xs rounded-none">
                  <div className="flex justify-between items-center mb-6 border-b border-neutral-100 pb-4">
                    <h3 className="font-display-xl text-[18px] uppercase font-bold">
                      Categorías Registradas ({categoryTree.length})
                    </h3>
                    <span className="font-label-caps text-[10px] text-neutral-400 uppercase tracking-wider">
                      {products.length} prendas en total
                    </span>
                  </div>

                  {categoryTree.length === 0 ? (
                    <div className="text-center py-12 text-neutral-400">
                      <span className="material-symbols-outlined text-4xl mb-2 block">category</span>
                      <p className="text-sm">No hay categorías registradas. Crea una a la izquierda.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {categoryTree.map((cat) => {
                        const catProducts = products.filter(p => (p.category || '').toLowerCase() === cat.name.toLowerCase());
                        const isEditingCat = editingCatOldName === cat.name;
                        const subcategories = cat.subcategories || [];

                        return (
                          <div key={cat.id || cat.name} className="border border-neutral-200 bg-white">
                            {/* Category Header */}
                            <div className="p-4 bg-neutral-50/70 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              {isEditingCat ? (
                                <form
                                  onSubmit={async (e) => {
                                    e.preventDefault();
                                    const clean = sanitizeInput(editingCatNewName);
                                    if (!clean) return;
                                    if (clean.toLowerCase() === cat.name.toLowerCase()) {
                                      setEditingCatOldName(null);
                                      return;
                                    }
                                    try {
                                      setIsUpdatingCat(true);
                                      showToast('Actualizando categoría...', 'info', 1500);
                                      await updateCategory(cat.name, clean);
                                      showToast(`Categoría actualizada a "${clean}".`, 'success');
                                      setEditingCatOldName(null);
                                      setEditingCatNewName('');
                                    } catch (err) {
                                      showToast(err.message || 'Error al actualizar categoría.', 'error');
                                    } finally {
                                      setIsUpdatingCat(false);
                                    }
                                  }}
                                  className="flex items-center gap-2 flex-1"
                                >
                                  <input
                                    type="text"
                                    value={editingCatNewName}
                                    onChange={(e) => setEditingCatNewName(e.target.value)}
                                    autoFocus
                                    disabled={isUpdatingCat}
                                    className="border border-neutral-400 bg-white px-3 py-1.5 text-xs uppercase tracking-wider font-bold outline-none flex-1"
                                  />
                                  <button
                                    type="submit"
                                    disabled={isUpdatingCat}
                                    className="bg-black text-white px-3 py-1.5 font-button text-[9px] uppercase tracking-widest hover:bg-neutral-800"
                                  >
                                    Guardar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingCatOldName(null);
                                      setEditingCatNewName('');
                                    }}
                                    className="border border-neutral-300 bg-white text-neutral-600 px-3 py-1.5 font-button text-[9px] uppercase tracking-widest"
                                  >
                                    Cancelar
                                  </button>
                                </form>
                              ) : (
                                <div className="flex items-center gap-3">
                                  <span className="w-2.5 h-2.5 bg-[#c5a880] inline-block" />
                                  <strong className="font-display-xl text-base uppercase tracking-wider text-black">
                                    {cat.name}
                                  </strong>
                                  <span className="text-[10px] font-label-caps text-neutral-500 bg-neutral-200/70 px-2 py-0.5 rounded-sm">
                                    {catProducts.length} {catProducts.length === 1 ? 'prenda' : 'prendas'}
                                  </span>
                                </div>
                              )}

                              {!isEditingCat && (
                                <div className="flex items-center gap-1 self-end sm:self-center">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingCatOldName(cat.name);
                                      setEditingCatNewName(cat.name);
                                    }}
                                    className="text-neutral-600 hover:text-black p-1.5 hover:bg-neutral-200/60 rounded transition-colors text-xs flex items-center gap-1"
                                    title={`Renombrar categoría ${cat.name}`}
                                  >
                                    <span className="material-symbols-outlined text-[16px]">edit</span>
                                    <span className="font-label-caps text-[9px] uppercase tracking-wider">Renombrar</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      if (catProducts.length > 0) {
                                        showToast(`No puede eliminar la categoría "${cat.name}" porque tiene ${catProducts.length} prenda(s) asignada(s).`, 'error');
                                        return;
                                      }
                                      if (window.confirm(`¿Seguro que desea eliminar la categoría "${cat.name}" y todas sus subcategorías?`)) {
                                        try {
                                          showToast('Eliminando categoría...', 'info', 2000);
                                          await deleteCategory(cat.name);
                                          showToast(`Categoría "${cat.name}" eliminada.`, 'success');
                                        } catch (err) {
                                          showToast(err.message || 'Error al eliminar categoría.', 'error');
                                        }
                                      }
                                    }}
                                    className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded transition-colors text-xs flex items-center gap-1 ml-2"
                                    title={`Eliminar categoría ${cat.name}`}
                                  >
                                    <span className="material-symbols-outlined text-[16px]">delete</span>
                                    <span className="font-label-caps text-[9px] uppercase tracking-wider">Eliminar</span>
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Subcategories List and Add Box */}
                            <div className="p-5 space-y-4">
                              <div>
                                <span className="block font-label-caps text-[9px] text-neutral-400 uppercase tracking-widest mb-3">
                                  Subcategorías de {cat.name} ({subcategories.length}):
                                </span>

                                {subcategories.length === 0 ? (
                                  <p className="text-xs text-neutral-400 italic py-2">
                                    No hay subcategorías definidas para esta categoría.
                                  </p>
                                ) : (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    {subcategories.map((sub) => {
                                      const subProductsCount = catProducts.filter(p => (p.subcategory || '').toLowerCase() === sub.toLowerCase()).length;
                                      const isEditingSub = editingSubcat?.catName === cat.name && editingSubcat?.oldName === sub;

                                      if (isEditingSub) {
                                        return (
                                          <form
                                            key={sub}
                                            onSubmit={handleUpdateSubcategorySubmit}
                                            className="col-span-full flex items-center gap-2 p-2 bg-amber-50 border border-amber-300"
                                          >
                                            <input
                                              type="text"
                                              value={editingSubcat.newName}
                                              onChange={(e) => setEditingSubcat({ ...editingSubcat, newName: e.target.value })}
                                              autoFocus
                                              disabled={isUpdatingSubcat}
                                              className="border border-neutral-300 bg-white px-2 py-1 text-xs font-semibold uppercase tracking-wider flex-1 outline-none"
                                            />
                                            <button
                                              type="submit"
                                              disabled={isUpdatingSubcat}
                                              className="bg-black text-white px-3 py-1 text-[9px] uppercase tracking-widest font-button"
                                            >
                                              Guardar
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => setEditingSubcat(null)}
                                              className="border border-neutral-300 bg-white text-neutral-600 px-2.5 py-1 text-[9px] uppercase tracking-widest font-button"
                                            >
                                              Cancelar
                                            </button>
                                          </form>
                                        );
                                      }

                                      return (
                                        <div
                                          key={sub}
                                          className="flex items-center justify-between px-3 py-2 border border-neutral-100 bg-[#fafafa] hover:bg-neutral-100/60 transition-colors"
                                        >
                                          <div className="flex items-center gap-2">
                                            <span className="text-neutral-400 text-xs">›</span>
                                            <span className="font-semibold text-neutral-800 text-xs uppercase tracking-wide">
                                              {sub}
                                            </span>
                                            <span className="text-[9px] text-neutral-400">
                                              ({subProductsCount})
                                            </span>
                                          </div>

                                          <div className="flex items-center gap-1">
                                            <button
                                              type="button"
                                              onClick={() => setEditingSubcat({ catName: cat.name, oldName: sub, newName: sub })}
                                              className="p-1 text-neutral-400 hover:text-black transition-colors"
                                              title={`Editar subcategoría ${sub}`}
                                            >
                                              <span className="material-symbols-outlined text-[15px]">edit</span>
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleDeleteSubcategory(cat.name, sub)}
                                              className="p-1 text-neutral-400 hover:text-red-600 transition-colors"
                                              title={`Eliminar subcategoría ${sub}`}
                                            >
                                              <span className="material-symbols-outlined text-[15px]">delete</span>
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>

                              {/* Inline Form: Añadir Subcategoría */}
                              <div className="pt-3 border-t border-neutral-100">
                                <form
                                  onSubmit={(e) => {
                                    e.preventDefault();
                                    handleAddSubcategorySubmit(cat.name);
                                  }}
                                  className="flex items-center gap-2"
                                >
                                  <input
                                    type="text"
                                    value={newSubcatInputs[cat.name] || ''}
                                    onChange={(e) => setNewSubcatInputs({ ...newSubcatInputs, [cat.name]: e.target.value })}
                                    placeholder={`Nueva subcategoría para ${cat.name}...`}
                                    className="border border-neutral-200 px-3 py-2 text-xs font-body-md flex-1 outline-none focus:border-black bg-white"
                                  />
                                  <button
                                    type="submit"
                                    className="bg-neutral-900 hover:bg-black text-white px-4 py-2 font-button text-[10px] uppercase tracking-widest transition-colors flex items-center gap-1 cursor-pointer flex-shrink-0"
                                  >
                                    <span className="material-symbols-outlined text-[14px]">add</span>
                                    Añadir
                                  </button>
                                </form>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: User Management */}
        {activeTab === 'users' && (
          <div className="space-y-8 animate-[fadeIn_0.3s_ease]">
            {/* Header */}
            <div>
              <span className="font-label-caps text-xs text-neutral-400 uppercase tracking-widest">USUARIOS Y BOLETÍN</span>
              <h1 className="font-display-xl text-[28px] uppercase tracking-wide mt-2">Gestionar Usuarios y Leads</h1>
            </div>

            {/* Users list database */}
            <div className="bg-white border border-neutral-200 p-8 shadow-xs rounded-none">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-neutral-100 pb-4">
                <h3 className="font-display-xl text-[18px] uppercase font-bold">Base de Usuarios ({users.length})</h3>
                <button
                  onClick={handleExportUsersCSV}
                  className="bg-black text-white text-[9px] font-label-caps py-2 px-4 uppercase tracking-widest hover:bg-neutral-800 transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[14px]">download</span>
                  Exportar Clientes (CSV)
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left font-body-md text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-200 font-label-caps text-[10px] text-neutral-400">
                      <th className="pb-4">ID</th>
                      <th className="pb-4">NOMBRE COMPLETO</th>
                      <th className="pb-4">CORREO ELECTRÓNICO</th>
                      <th className="pb-4">FECHA REGISTRO</th>
                      <th className="pb-4">MARKETING</th>
                      <th className="pb-4">ROL ACTUAL</th>
                      <th className="pb-4 text-right">ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-xs">
                    {users.map(user => (
                      <tr key={user.id} className="hover:bg-neutral-50">
                        <td className="py-4 text-neutral-400">#{user.id}</td>
                        <td className="py-4 font-bold text-black uppercase">{user.name}</td>
                        <td className="py-4">{user.email}</td>
                        <td className="py-4">
                          {new Date(user.createdAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'numeric', day: 'numeric' })}
                        </td>
                        <td className="py-4">
                          <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded ${
                            user.acceptsMarketing 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                              : 'bg-red-50 text-red-700 border border-red-100'
                          }`}>
                            {user.acceptsMarketing ? 'SÍ' : 'NO'}
                          </span>
                        </td>
                        <td className="py-4">
                          <span className={`inline-block font-label-caps text-[9px] px-2.5 py-0.5 font-bold uppercase rounded ${
                            user.role === 'admin' 
                              ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                              : 'bg-neutral-100 text-neutral-700 border border-neutral-200'
                          }`}>
                            {user.role === 'admin' ? 'Administrador' : 'Cliente'}
                          </span>
                        </td>
                        <td className="py-4 text-right space-x-2">
                          <button
                            onClick={async () => {
                              const newRole = user.role === 'admin' ? 'customer' : 'admin';
                              if (user.id === currentUser.id) {
                                alert('No puedes degradar tu propio rol mientras estás en sesión.');
                                return;
                              }
                              await updateUserRole(user.id, newRole);
                            }}
                            className="font-label-caps text-[9px] border border-neutral-300 py-1.5 px-3 uppercase tracking-widest hover:border-black hover:text-black transition-colors"
                          >
                            Hacer {user.role === 'admin' ? 'Cliente' : 'Admin'}
                          </button>
                          
                          <button
                            onClick={async () => {
                              if (window.confirm(`¿Seguro que desea eliminar al usuario "${user.name}"?`)) {
                                try {
                                  await deleteUser(user.id);
                                  showToast('Usuario eliminado con éxito.', 'success');
                                } catch (err) {
                                  alert(err.message || 'Error al eliminar usuario.');
                                }
                              }
                            }}
                            className="font-label-caps text-[9px] border border-red-200 text-red-600 py-1.5 px-3 uppercase hover:bg-red-50 transition-colors"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Newsletter subscribers database */}
            <div className="bg-white border border-neutral-200 p-8 shadow-xs rounded-none">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-neutral-100 pb-4">
                <h3 className="font-display-xl text-[18px] uppercase font-bold">Suscriptores al Boletín ({subscribers.length})</h3>
                <button
                  onClick={handleExportSubscribersCSV}
                  className="bg-black text-white text-[9px] font-label-caps py-2 px-4 uppercase tracking-widest hover:bg-neutral-800 transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[14px]">download</span>
                  Exportar Boletín (CSV)
                </button>
              </div>
              
              {subscribers.length === 0 ? (
                <div className="py-8 text-center text-neutral-400 text-xs font-body-md italic">
                  No hay suscriptores registrados en el boletín.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-body-md text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-200 font-label-caps text-[10px] text-neutral-400">
                        <th className="pb-4">ID</th>
                        <th className="pb-4">CORREO ELECTRÓNICO</th>
                        <th className="pb-4">FECHA SUSCRIPCIÓN</th>
                        <th className="pb-4 text-right">ACCIONES</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 text-xs">
                      {subscribers.map(sub => (
                        <tr key={sub.id} className="hover:bg-neutral-50">
                          <td className="py-4 text-neutral-400">#{sub.id}</td>
                          <td className="py-4 font-bold text-black">{sub.email}</td>
                          <td className="py-4">
                            {new Date(sub.createdAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-4 text-right">
                            <button
                              onClick={async () => {
                                if (window.confirm(`¿Seguro que desea eliminar a "${sub.email}" del boletín?`)) {
                                  try {
                                    showToast('Eliminando suscriptor...', 'info', 2000);
                                    await deleteSubscriber(sub.id);
                                    showToast('Suscriptor eliminado con éxito.', 'success');
                                  } catch (err) {
                                    showToast('Error al eliminar suscriptor.', 'error');
                                  }
                                }
                              }}
                              className="font-label-caps text-[9px] border border-red-200 text-red-600 py-1.5 px-3 uppercase hover:bg-red-50 transition-colors"
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab: Wholesale / B2B Leads Management */}
        {activeTab === 'wholesale' && (
          <div className="space-y-8 animate-[fadeIn_0.3s_ease]">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <span className="font-label-caps text-xs text-amber-600 uppercase tracking-widest font-bold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">storefront</span>
                  CANAL B2B & DISTRIBUIDORES
                </span>
                <h1 className="font-display-xl text-[28px] uppercase tracking-wide mt-1">Prospectos Mayoristas</h1>
                <p className="font-body-md text-xs text-neutral-500 mt-1">
                  Atención directa y cotizaciones para boutiques y tiendas de ropa masculina desde Sahuayo (C.P. 59000).
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={fetchWholesaleLeads}
                  disabled={loadingLeads}
                  className="border border-neutral-300 hover:border-black bg-white text-neutral-800 text-[10px] font-label-caps py-2.5 px-4 uppercase tracking-widest transition-colors flex items-center gap-2"
                >
                  <span className={`material-symbols-outlined text-[15px] ${loadingLeads ? 'animate-spin' : ''}`}>sync</span>
                  Actualizar
                </button>
                <button
                  onClick={handleExportWholesaleCSV}
                  disabled={wholesaleLeads.length === 0}
                  className="bg-black text-white text-[10px] font-label-caps py-2.5 px-5 uppercase tracking-widest hover:bg-neutral-800 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[15px]">download</span>
                  Exportar CSV
                </button>
                <a
                  href="/mayoristas"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border border-[#c5a880] text-[#a07c50] hover:bg-[#c5a880]/10 text-[10px] font-label-caps py-2.5 px-4 uppercase tracking-widest transition-colors flex items-center gap-1.5 font-bold"
                >
                  <span className="material-symbols-outlined text-[15px]">open_in_new</span>
                  Ver Portal Público
                </a>
              </div>
            </div>

            {/* Metric KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-neutral-200 p-5">
                <span className="text-[10px] font-label-caps tracking-widest text-neutral-400 uppercase block mb-1">Total Solicitudes</span>
                <div className="font-display-xl text-3xl font-bold">{wholesaleLeads.length}</div>
              </div>
              <div className="bg-white border-2 border-amber-500/80 p-5 bg-amber-50/20">
                <span className="text-[10px] font-label-caps tracking-widest text-amber-700 uppercase block mb-1 font-bold">Por Atender (Nuevos)</span>
                <div className="font-display-xl text-3xl font-bold text-amber-600">
                  {wholesaleLeads.filter(l => (l.status || 'Nuevo') === 'Nuevo').length}
                </div>
              </div>
              <div className="bg-white border border-neutral-200 p-5">
                <span className="text-[10px] font-label-caps tracking-widest text-neutral-400 uppercase block mb-1">En Negociación</span>
                <div className="font-display-xl text-3xl font-bold text-neutral-700">
                  {wholesaleLeads.filter(l => l.status === 'Contactado' || l.status === 'Cotizado').length}
                </div>
              </div>
              <div className="bg-white border border-neutral-200 p-5">
                <span className="text-[10px] font-label-caps tracking-widest text-neutral-400 uppercase block mb-1">Ventas Concretadas</span>
                <div className="font-display-xl text-3xl font-bold text-emerald-600">
                  {wholesaleLeads.filter(l => l.status === 'Cerrado / Venta Realizada').length}
                </div>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white border border-neutral-200 p-4 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <span className="material-symbols-outlined text-[18px] text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2">search</span>
                <input
                  type="text"
                  value={leadSearch}
                  onChange={(e) => setLeadSearch(e.target.value)}
                  placeholder="Buscar por negocio, contacto, ciudad o WhatsApp..."
                  className="w-full bg-[#f9f9f9] border border-neutral-300 pl-10 pr-4 py-2.5 text-xs text-neutral-900 focus:bg-white focus:outline-none focus:border-black transition-colors"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'all', label: 'Todos' },
                  { id: 'Nuevo', label: 'Nuevos' },
                  { id: 'Contactado', label: 'Contactados' },
                  { id: 'Cotizado', label: 'Cotizados' },
                  { id: 'Cerrado / Venta Realizada', label: 'Cerrados' }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setLeadStatusFilter(f.id)}
                    className={`px-3 py-1.5 text-[10px] font-label-caps uppercase tracking-wider transition-colors ${
                      leadStatusFilter === f.id
                        ? 'bg-black text-white font-bold'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Leads Table */}
            <div className="bg-white border border-neutral-200 shadow-xs">
              {(() => {
                const filtered = wholesaleLeads.filter(lead => {
                  const matchesSearch = 
                    (lead.name || '').toLowerCase().includes(leadSearch.toLowerCase()) ||
                    (lead.businessName || '').toLowerCase().includes(leadSearch.toLowerCase()) ||
                    (lead.city || '').toLowerCase().includes(leadSearch.toLowerCase()) ||
                    (lead.state || '').toLowerCase().includes(leadSearch.toLowerCase()) ||
                    (lead.phone || '').includes(leadSearch) ||
                    (lead.id || '').toLowerCase().includes(leadSearch.toLowerCase());

                  const matchesStatus = leadStatusFilter === 'all' || (lead.status || 'Nuevo') === leadStatusFilter;

                  return matchesSearch && matchesStatus;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="py-16 text-center text-neutral-400 space-y-3">
                      <span className="material-symbols-outlined text-[42px] text-neutral-300">inbox</span>
                      <p className="text-xs font-body-md uppercase tracking-wider">
                        {wholesaleLeads.length === 0 
                          ? 'Aún no se han recibido solicitudes de mayoreo.' 
                          : 'No hay prospectos que coincidan con la búsqueda o filtro seleccionado.'}
                      </p>
                      {wholesaleLeads.length === 0 && (
                        <p className="text-[11px] text-neutral-500 max-w-sm mx-auto">
                          Las solicitudes enviadas desde la página pública <a href="/mayoristas" target="_blank" className="underline text-black font-bold">/mayoristas</a> se registrarán automáticamente aquí.
                        </p>
                      )}
                    </div>
                  );
                }

                return (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-body-md text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-neutral-200 font-label-caps text-[10px] text-neutral-400 bg-neutral-50">
                          <th className="py-3.5 px-4">FOLIO / FECHA</th>
                          <th className="py-3.5 px-4">NEGOCIO & CONTACTO</th>
                          <th className="py-3.5 px-4">UBICACIÓN</th>
                          <th className="py-3.5 px-4">VOLUMEN & ESTILOS</th>
                          <th className="py-3.5 px-4">WHATSAPP / ATENCIÓN</th>
                          <th className="py-3.5 px-4">ESTATUS</th>
                          <th className="py-3.5 px-4 text-right">ACCIONES</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {filtered.map(lead => {
                          const cleanPhone = (lead.phone || '').replace(/[^0-9]/g, '');
                          const formattedPhone = cleanPhone.startsWith('52') ? cleanPhone : `52${cleanPhone}`;
                          const greetingMsg = `Hola ${lead.name || ''}, te saluda el equipo de OV33 Marketplace respecto a tu solicitud de compra al mayoreo para ${lead.businessName || 'tu negocio'}. Con gusto te comparto nuestro catálogo B2B multimarca y condiciones de compra.`;
                          const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(greetingMsg)}`;

                          return (
                            <tr key={lead.id} className="hover:bg-neutral-50/80 transition-colors">
                              <td className="py-4 px-4 align-top">
                                <span className="font-mono text-[10px] font-bold text-neutral-700 block">{lead.id}</span>
                                <span className="text-[10px] text-neutral-400 block mt-0.5">
                                  {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                                </span>
                              </td>

                              <td className="py-4 px-4 align-top">
                                <strong className="text-black text-sm block">{lead.businessName || 'Sin nombre comercial'}</strong>
                                <span className="text-neutral-600 block">{lead.name}</span>
                                {lead.email && (
                                  <a href={`mailto:${lead.email}`} className="text-[10px] text-neutral-400 hover:text-black transition-colors block mt-0.5 underline">
                                    {lead.email}
                                  </a>
                                )}
                              </td>

                              <td className="py-4 px-4 align-top text-neutral-600">
                                <div>{lead.city || 'No especificada'}</div>
                                <div className="text-[10px] text-neutral-400">{lead.state || 'México'}</div>
                              </td>

                              <td className="py-4 px-4 align-top">
                                <span className="inline-block bg-neutral-900 text-white font-mono text-[10px] font-bold px-2 py-0.5 mb-1">
                                  {lead.estimatedPieces || '12-24'} pzas
                                </span>
                                <div className="text-[10px] text-neutral-500">
                                  {Array.isArray(lead.categories) ? lead.categories.join(', ') : (lead.categories || 'Lisas, Cuadros')}
                                </div>
                                {lead.notes && (
                                  <div className="mt-1 p-1.5 bg-neutral-100 text-[10px] text-neutral-700 italic border-l-2 border-amber-500 max-w-xs">
                                    "{lead.notes}"
                                  </div>
                                )}
                              </td>

                              <td className="py-4 px-4 align-top">
                                <div className="space-y-1.5">
                                  <span className="font-mono text-xs font-semibold text-neutral-800 block">
                                    {lead.phone || 'Sin teléfono'}
                                  </span>
                                  {cleanPhone && (
                                    <a
                                      href={waUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-label-caps text-[9px] uppercase tracking-wider py-1 px-2.5 transition-colors shadow-xs"
                                    >
                                      <span className="material-symbols-outlined text-[13px]">chat</span>
                                      Abrir WhatsApp
                                    </a>
                                  )}
                                </div>
                              </td>

                              <td className="py-4 px-4 align-top">
                                <select
                                  value={lead.status || 'Nuevo'}
                                  onChange={(e) => handleUpdateLeadStatus(lead.id, e.target.value)}
                                  className={`font-label-caps text-[10px] uppercase font-bold py-1 px-2 border focus:outline-none transition-colors ${
                                    (lead.status || 'Nuevo') === 'Nuevo'
                                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                                      : lead.status === 'Contactado'
                                        ? 'bg-blue-100 text-blue-900 border-blue-300'
                                        : lead.status === 'Cotizado'
                                          ? 'bg-purple-100 text-purple-900 border-purple-300'
                                          : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                  }`}
                                >
                                  <option value="Nuevo">Nuevo</option>
                                  <option value="Contactado">Contactado</option>
                                  <option value="Cotizado">Cotizado</option>
                                  <option value="Cerrado / Venta Realizada">Venta Cerrada</option>
                                </select>
                              </td>

                              <td className="py-4 px-4 align-top text-right">
                                <button
                                  onClick={() => handleDeleteLead(lead.id)}
                                  className="text-neutral-400 hover:text-red-600 p-1 transition-colors"
                                  title="Eliminar solicitud"
                                >
                                  <span className="material-symbols-outlined text-[18px]">delete</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Tab 5: Settings / Factory Reset */}
        {activeTab === 'settings' && (
          <div className="space-y-8 animate-[fadeIn_0.3s_ease] max-w-4xl">
            {/* Header */}
            <div>
              <span className="font-label-caps text-xs text-neutral-400 uppercase tracking-widest">CONFIGURACIÓN</span>
              <h1 className="font-display-xl text-[28px] uppercase tracking-wide mt-2">Mantenimiento y Diagnóstico</h1>
            </div>

            {/* Cloud Database Diagnostics Panel */}
            <div className="bg-white border border-neutral-200 p-8 shadow-xs rounded-none">
              <h3 className="font-display-xl text-[18px] uppercase text-black mb-4 font-bold border-b border-neutral-100 pb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-amber-500">cloud_sync</span>
                Diagnóstico de Conectividad en la Nube (Google Firebase)
              </h3>
              <p className="font-body-md text-sm text-secondary mb-6 leading-relaxed">
                Ejecuta una prueba automática de lectura, escritura y eliminación en tiempo real para verificar el estado de tu base de datos centralizada de Firestore.
              </p>

              {/* Console logs */}
              {dbTestState !== 'idle' && (
                <div className={`p-4 mb-6 text-xs font-mono rounded-none border ${
                  dbTestState === 'testing'
                    ? 'bg-neutral-50 text-neutral-800 border-neutral-200 animate-pulse'
                    : dbTestState === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-red-50 text-red-800 border-red-200'
                }`}>
                  <div className="flex items-center gap-2 mb-2 font-bold uppercase tracking-wider">
                    <span className="material-symbols-outlined text-[16px]">
                      {dbTestState === 'testing' ? 'sync' : dbTestState === 'success' ? 'check_circle' : 'error'}
                    </span>
                    {dbTestState === 'testing' ? 'PROBANDO...' : dbTestState === 'success' ? 'PRUEBA EXITOSA' : 'ERROR DE CONEXIÓN'}
                  </div>
                  <p className="whitespace-pre-line leading-relaxed">{dbTestMessage}</p>
                </div>
              )}

              {/* Show loaded configuration metadata safely */}
              <div className="mb-8 bg-neutral-50 border border-neutral-100 p-4 font-mono text-[11px] text-neutral-600 space-y-1">
                <h4 className="font-label-caps text-[9px] font-bold text-neutral-400 mb-2 uppercase tracking-widest">METADATOS DE CONFIGURACIÓN CARGADOS</h4>
                <div><strong>Base de Datos Nube:</strong> {isFirebaseEnabled ? 'HABILITADA (Conectado)' : 'DESHABILITADA (Corriendo Local)'}</div>
                <div><strong>Proyecto ID:</strong> {import.meta.env.VITE_FIREBASE_PROJECT_ID || 'No definido'}</div>
                <div><strong>API Key cargada:</strong> {import.meta.env.VITE_FIREBASE_API_KEY ? `${import.meta.env.VITE_FIREBASE_API_KEY.slice(0, 8)}...XXXX` : 'No definida'}</div>
                <div><strong>App ID cargada:</strong> {import.meta.env.VITE_FIREBASE_APP_ID ? 'Sí (Cargado)' : 'No definida'}</div>
              </div>

              <button
                onClick={handleTestDatabase}
                disabled={dbTestState === 'testing'}
                className="bg-black text-white px-8 py-4 font-button text-xs uppercase tracking-widest hover:bg-neutral-800 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">settings_ethernet</span>
                {dbTestState === 'testing' ? 'PROBANDO CONEXIÓN...' : 'EJECUTAR PRUEBA DE CONEXIÓN'}
              </button>
            </div>

            <div className="bg-white border border-neutral-250 p-8 shadow-xs rounded-none max-w-xl animate-[fadeIn_0.3s_ease]">
              <h3 className="font-display-xl text-[18px] uppercase text-black mb-4 font-bold border-b border-neutral-100 pb-3">Sincronizar Catálogo Local</h3>
              <p className="font-body-md text-sm text-secondary mb-8 leading-relaxed">
                Si has creado productos personalizados o variantes de color mientras trabajabas de forma local (offline) y deseas subirlos a la base de datos central de Firestore, puedes hacerlo ahora. Se optimizarán y subirán las fotos automáticamente a ImgBB.
              </p>
              
              <button
                onClick={handleSyncLocalToCloud}
                disabled={isSaving}
                className="bg-amber-600 text-white px-8 py-4 font-button text-xs uppercase tracking-widest hover:bg-amber-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">cloud_upload</span>
                {isSaving ? 'SINCRONIZANDO...' : 'SINCRONIZAR PRODUCTOS LOCALES A LA NUBE'}
              </button>
            </div>

            <div className="bg-white border border-neutral-200 p-8 shadow-xs rounded-none max-w-xl">
              <h3 className="font-display-xl text-[18px] uppercase text-red-700 mb-4 font-bold border-b border-neutral-100 pb-3">Área de Peligro</h3>
              <p className="font-body-md text-sm text-secondary mb-8 leading-relaxed">
                Si ha estado probando las opciones del catálogo, eliminando productos, cambiando precios o añadiendo usuarios de prueba y desea devolver la plataforma **OV33 Marketplace** a su estado original de demostración, puede ejecutar la restauración total del sistema.
              </p>
              
              <div className="bg-red-50 border border-red-200 text-red-800 p-4 mb-8 text-xs font-body-md flex items-start gap-3">
                <span className="material-symbols-outlined text-[20px] shrink-0 text-red-700">warning</span>
                <p>
                  <strong>Atención:</strong> Esta acción restablecerá el catálogo con los productos y marcas oficiales predeterminadas, eliminará todos los pedidos generados y restaurará la lista de categorías original. Las sesiones activas de usuarios no se perderán.
                </p>
              </div>

              <button
                onClick={handleSystemReset}
                className="bg-red-600 text-white px-8 py-4 font-button text-xs uppercase tracking-widest hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                RESTABLECER VALORES DE FÁBRICA
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Floating Premium Toast Notification */}
      {toast.show && (
        <div className="fixed top-24 right-8 z-[100] flex items-center gap-3 bg-black text-white border border-neutral-800 px-6 py-4 shadow-2xl animate-[slideInRight_0.3s_ease-out] max-w-sm rounded-none">
          <span className={`material-symbols-outlined text-[20px] ${
            toast.type === 'success' ? 'text-amber-500' : toast.type === 'error' ? 'text-red-500' : 'text-neutral-400'
          }`}>
            {toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'error' : 'info'}
          </span>
          <div className="flex flex-col">
            <span className="font-label-caps text-[9px] tracking-widest text-neutral-400 uppercase font-bold">
              {toast.type === 'success' ? 'Éxito' : toast.type === 'error' ? 'Error de Sistema' : 'Información'}
            </span>
            <p className="font-body-md text-xs text-white mt-0.5 leading-snug">{toast.message}</p>
          </div>
          <button 
            type="button"
            onClick={() => setToast({ ...toast, show: false })}
            className="ml-4 text-neutral-500 hover:text-white transition-colors text-xs font-bold font-mono bg-transparent border-none cursor-pointer outline-none"
          >
            ×
          </button>
        </div>
      )}
    </main>
  );
}
