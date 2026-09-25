import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES, INITIAL_CATEGORY_TREE, INITIAL_ORDERS, INITIAL_BRANDS } from './initialProducts';
import { db, isFirebaseEnabled } from '../utils/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';

const ProductContext = createContext();
const CACHE_KEY_PRODUCTS = 'ov33_products_cache';
const CACHE_KEY_CATEGORIES = 'ov33_categories_cache';
const CACHE_KEY_CATEGORY_TREE = 'ov33_category_tree_cache';
const CACHE_KEY_TIMESTAMP = 'ov33_cache_timestamp';
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutos de cache en navegador

// Función de tiempo límite para evitar bloqueos por red lenta o bloqueada
const withTimeout = (promise, ms = 4000) => {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error("Timeout: La conexión con Firestore tardó más de " + ms + "ms"));
    }, ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
};

// Función centralizada para obtener el stock real de un producto por talla y variante
export function getProductStock(product, selectedSize = 'M', selectedColor = null) {
  if (!product) return 0;

  // 1. Si el producto tiene variantes de color
  if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
    let targetVariant = null;
    if (selectedColor) {
      targetVariant = product.variants.find(
        v => (v.colorName || '').trim().toLowerCase() === String(selectedColor).trim().toLowerCase()
      );
    }
    if (!targetVariant) {
      targetVariant = product.variants[0];
    }

    if (targetVariant && targetVariant.stock) {
      const val = targetVariant.stock[selectedSize];
      if (val !== undefined && val !== null) {
        return Math.max(0, parseInt(val, 10) || 0);
      }
    }
  }

  // 2. Stock a nivel de producto raíz
  if (product.stock && typeof product.stock === 'object') {
    const val = product.stock[selectedSize];
    if (val !== undefined && val !== null) {
      return Math.max(0, parseInt(val, 10) || 0);
    }
  } else if (typeof product.stock === 'number') {
    return Math.max(0, product.stock);
  }

  return 10; // Fallback stock positivo
}

// Helper para determinar si un producto está en oferta
export function isProductOnSale(p) {
  if (!p) return false;
  if (p.isOnSale) return true;
  const orig = Number(String(p.originalPrice || '').replace(/,/g, ''));
  const curr = Number(String(p.price || '').replace(/,/g, ''));
  return orig > 0 && curr > 0 && orig > curr;
}

// Helper para calcular el porcentaje de descuento
export function getDiscountPercentage(originalPrice, currentPrice) {
  const orig = Number(String(originalPrice || '').replace(/,/g, ''));
  const curr = Number(String(currentPrice || '').replace(/,/g, ''));
  if (orig > 0 && curr > 0 && orig > curr) {
    return Math.round(((orig - curr) / orig) * 100);
  }
  return 0;
}

// Validador de producto de marketplace
export function isValidMarketplaceProduct(p) {
  return p && (p.id || p.id === 0) && (p.name || '').trim().length > 0;
}

// Normalización de la estructura de categorías y subcategorías
export function normalizeCategoryTree(rawTreeOrList) {
  if (!rawTreeOrList) return INITIAL_CATEGORY_TREE;

  // Si ya es un árbol estructurado de objetos
  if (Array.isArray(rawTreeOrList) && rawTreeOrList.length > 0 && typeof rawTreeOrList[0] === 'object' && rawTreeOrList[0].name) {
    return rawTreeOrList.map(item => ({
      id: item.id || (item.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name: item.name,
      icon: item.icon || 'category',
      subcategories: Array.isArray(item.subcategories) ? item.subcategories : []
    }));
  }

  // Si es un arreglo de strings
  if (Array.isArray(rawTreeOrList) && rawTreeOrList.length > 0 && typeof rawTreeOrList[0] === 'string') {
    return rawTreeOrList.map(name => ({
      id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name: name,
      icon: 'category',
      subcategories: []
    }));
  }

  return INITIAL_CATEGORY_TREE;
}

// Normalización de clasificación de producto para Marketplace multimarca
export function normalizeProductClassification(p) {
  if (!p) return { category: 'General', subcategory: 'Varios', brand: 'OV33' };
  const rawCat = (p.category || '').trim();
  const rawSub = (p.subcategory || '').trim();
  const rawBrand = (p.brand || '').trim();

  return {
    ...p,
    brand: rawBrand || 'OV33 Direct',
    category: rawCat || 'Tecnología & Gadgets',
    subcategory: rawSub || 'Varios',
    rating: Number(p.rating) || 4.8,
    reviewsCount: Number(p.reviewsCount) || 120,
    salesCount: p.salesCount || '+500 vendidos',
    freeShipping: p.freeShipping !== undefined ? p.freeShipping : true
  };
}

export function ProductProvider({ children }) {
  const [products, setProducts] = useState(() => {
    try {
      const cached = typeof window !== 'undefined' ? localStorage.getItem(CACHE_KEY_PRODUCTS) : null;
      if (cached) {
        const parsed = JSON.parse(cached).filter(isValidMarketplaceProduct);
        if (parsed.length > 0) return parsed.map(normalizeProductClassification);
      }
    } catch (e) {}
    return INITIAL_PRODUCTS.map(normalizeProductClassification);
  });

  const [categoryTree, setCategoryTree] = useState(() => {
    try {
      const cached = typeof window !== 'undefined' ? localStorage.getItem(CACHE_KEY_CATEGORY_TREE) : null;
      if (cached) return normalizeCategoryTree(JSON.parse(cached));
    } catch (e) {}
    return INITIAL_CATEGORY_TREE;
  });

  const categories = categoryTree.map(c => c.name);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isUsingFallback, setIsUsingFallback] = useState(false);

  // Lista dinámica de marcas disponibles
  const brands = React.useMemo(() => {
    const brandMap = new Map();
    INITIAL_BRANDS.forEach(b => brandMap.set(b.name.toLowerCase(), b));
    products.forEach(p => {
      if (p.brand && !brandMap.has(p.brand.toLowerCase())) {
        brandMap.set(p.brand.toLowerCase(), {
          id: p.brand.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          name: p.brand,
          category: p.category || 'Varios',
          description: `Catálogo oficial y productos de ${p.brand}`
        });
      }
    });
    return Array.from(brandMap.values());
  }, [products]);

  useEffect(() => {
    const loadInitialData = async () => {
      // 0. Cache inteligente de 15 minutos
      try {
        const cachedTime = localStorage.getItem(CACHE_KEY_TIMESTAMP);
        const cachedProds = localStorage.getItem(CACHE_KEY_PRODUCTS);
        const cachedTree = localStorage.getItem(CACHE_KEY_CATEGORY_TREE) || localStorage.getItem(CACHE_KEY_CATEGORIES);
        const isCacheFresh = cachedTime && (Date.now() - Number(cachedTime) < CACHE_TTL_MS);

        if (isCacheFresh && cachedProds) {
          const rawProds = JSON.parse(cachedProds).filter(isValidMarketplaceProduct);
          const parsedProds = rawProds.map(normalizeProductClassification);
          
          let parsedTree = INITIAL_CATEGORY_TREE;
          if (cachedTree) {
            try {
              parsedTree = normalizeCategoryTree(JSON.parse(cachedTree));
            } catch (e) {}
          }

          if (Array.isArray(parsedProds) && parsedProds.length > 0) {
            setProducts(parsedProds);
            setCategoryTree(parsedTree);
            setLoading(false);
            if (import.meta.env.DEV) {
              console.log(`⚡ Catálogo OV33 cargado desde cache local (${parsedProds.length} productos, ${parsedTree.length} categorías).`);
            }
            return;
          }
        }
      } catch (cacheErr) {
        console.warn("Aviso leyendo cache:", cacheErr);
      }

      if (isFirebaseEnabled && db) {
        if (import.meta.env.DEV) {
          console.log("⚡ Consultando Firestore para catálogo OV33...");
        }

        try {
          const productsCol = collection(db, 'ov33_products');
          const productsSnapshot = await withTimeout(getDocs(productsCol), 15000);
          const loadedProducts = [];
          productsSnapshot.forEach(docSnap => {
            const prod = { id: docSnap.id, ...docSnap.data() };
            if (isValidMarketplaceProduct(prod)) {
              loadedProducts.push(normalizeProductClassification(prod));
            }
          });
          loadedProducts.sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));
          
          let finalTree = INITIAL_CATEGORY_TREE;
          try {
            const categoriesCol = collection(db, 'ov33_categories');
            const categoriesSnapshot = await withTimeout(getDocs(categoriesCol), 8000);
            if (!categoriesSnapshot.empty) {
              const treeDoc = categoriesSnapshot.docs.find(d => d.id === 'tree');
              const listDoc = categoriesSnapshot.docs.find(d => d.id === 'list');
              if (treeDoc && Array.isArray(treeDoc.data().tree)) {
                finalTree = normalizeCategoryTree(treeDoc.data().tree);
              } else if (listDoc && Array.isArray(listDoc.data().categories)) {
                finalTree = normalizeCategoryTree(listDoc.data().categories);
              }
            }
          } catch (catErr) {
            console.warn("Categorías usando valor predeterminado:", catErr);
          }

          // Si Firestore está vacío, usar el catálogo de iniciales
          if (loadedProducts.length === 0) {
            setProducts(INITIAL_PRODUCTS.map(normalizeProductClassification));
          } else {
            setProducts(loadedProducts);
          }
          setCategoryTree(finalTree);
          setIsUsingFallback(false);

          try {
            localStorage.setItem(CACHE_KEY_PRODUCTS, JSON.stringify(loadedProducts.length > 0 ? loadedProducts : INITIAL_PRODUCTS));
            localStorage.setItem(CACHE_KEY_CATEGORY_TREE, JSON.stringify(finalTree));
            localStorage.setItem(CACHE_KEY_CATEGORIES, JSON.stringify(finalTree.map(c => c.name)));
            localStorage.setItem(CACHE_KEY_TIMESTAMP, Date.now().toString());
          } catch (e) {}

        } catch (prodErr) {
          console.error("Error cargando productos de Firestore:", prodErr);
          setIsUsingFallback(true);
          loadFromLocalStorageFallback();
          setLoading(false);
          return;
        }
      } else {
        setIsUsingFallback(true);
        loadFromLocalStorageFallback();
      }
      setLoading(false);
    };

    loadInitialData();
  }, []);

  const loadFromLocalStorageFallback = () => {
    if (import.meta.env.DEV) {
      console.log("💡 Usando persistencia local de respaldo OV33.");
    }
    try {
      const storedProducts = localStorage.getItem('ov33_products');
      if (storedProducts) {
        try {
          const parsed = JSON.parse(storedProducts).filter(isValidMarketplaceProduct).map(normalizeProductClassification);
          setProducts(parsed);
        } catch (e) {
          setProducts(INITIAL_PRODUCTS.map(normalizeProductClassification));
        }
      } else {
        localStorage.setItem('ov33_products', JSON.stringify(INITIAL_PRODUCTS));
        setProducts(INITIAL_PRODUCTS.map(normalizeProductClassification));
      }

      const storedTree = localStorage.getItem('ov33_category_tree') || localStorage.getItem('ov33_categories');
      if (storedTree) {
        try {
          const parsed = JSON.parse(storedTree);
          setCategoryTree(normalizeCategoryTree(parsed));
        } catch (e) {
          setCategoryTree(INITIAL_CATEGORY_TREE);
        }
      } else {
        localStorage.setItem('ov33_category_tree', JSON.stringify(INITIAL_CATEGORY_TREE));
        setCategoryTree(INITIAL_CATEGORY_TREE);
      }

      const storedOrders = localStorage.getItem('ov33_orders');
      if (storedOrders) {
        try {
          setOrders(JSON.parse(storedOrders));
        } catch (e) {
          setOrders(INITIAL_ORDERS);
        }
      } else {
        localStorage.setItem('ov33_orders', JSON.stringify(INITIAL_ORDERS));
        setOrders(INITIAL_ORDERS);
      }
    } catch (error) {
      console.error("❌ Error accediendo a localStorage fallback:", error);
      setProducts(INITIAL_PRODUCTS.map(normalizeProductClassification));
      setCategoryTree(INITIAL_CATEGORY_TREE);
      setOrders(INITIAL_ORDERS);
    }
  };

  const addProduct = async (product) => {
    const maxId = products.reduce((max, p) => (Number(p.id) > max ? Number(p.id) : max), 100);
    const newId = maxId + 1;
    const newProduct = normalizeProductClassification({
      ...product,
      id: newId,
      sizes: product.sizes || ["Talla Única"],
      stock: product.stock || 10,
      images: product.images || [product.image],
      variants: product.variants || []
    });

    const updatedProducts = [...products, newProduct];
    setProducts(updatedProducts);

    if (isFirebaseEnabled && db) {
      try {
        await setDoc(doc(db, 'ov33_products', String(newId)), newProduct);
      } catch (error) {
        console.error("❌ Error guardando producto en Firestore:", error);
      }
    }
    localStorage.setItem('ov33_products', JSON.stringify(updatedProducts));
    localStorage.setItem(CACHE_KEY_PRODUCTS, JSON.stringify(updatedProducts));
    localStorage.setItem(CACHE_KEY_TIMESTAMP, Date.now().toString());
    return newProduct;
  };

  const updateProduct = async (id, updatedProduct) => {
    const updated = products.map(p => p.id === id ? normalizeProductClassification({ ...p, ...updatedProduct }) : p);
    setProducts(updated);

    if (isFirebaseEnabled && db) {
      try {
        const target = updated.find(p => p.id === id);
        if (target) {
          await setDoc(doc(db, 'ov33_products', String(id)), target);
        }
      } catch (error) {
        console.error("❌ Error actualizando producto en Firestore:", error);
      }
    }
    localStorage.setItem('ov33_products', JSON.stringify(updated));
    localStorage.setItem(CACHE_KEY_PRODUCTS, JSON.stringify(updated));
    localStorage.setItem(CACHE_KEY_TIMESTAMP, Date.now().toString());
  };

  const deleteProduct = async (id) => {
    const updated = products.filter(p => String(p.id) !== String(id));
    setProducts(updated);

    if (isFirebaseEnabled && db) {
      try {
        await deleteDoc(doc(db, 'ov33_products', String(id)));
      } catch (error) {
        console.error("❌ Error eliminando producto en Firestore:", error);
      }
    }
    localStorage.setItem('ov33_products', JSON.stringify(updated));
    localStorage.setItem(CACHE_KEY_PRODUCTS, JSON.stringify(updated));
    localStorage.setItem(CACHE_KEY_TIMESTAMP, Date.now().toString());
  };

  const resetToDefaults = async () => {
    const defaultProducts = INITIAL_PRODUCTS.map(normalizeProductClassification);
    setProducts(defaultProducts);
    setCategoryTree(INITIAL_CATEGORY_TREE);
    setOrders(INITIAL_ORDERS);

    if (isFirebaseEnabled && db) {
      try {
        for (const p of defaultProducts) {
          await setDoc(doc(db, 'ov33_products', String(p.id)), p);
        }
        await setDoc(doc(db, 'ov33_categories', 'tree'), { tree: INITIAL_CATEGORY_TREE });
        await setDoc(doc(db, 'ov33_categories', 'list'), { categories: INITIAL_CATEGORIES });
      } catch (e) {
        console.warn("Aviso reiniciando en Firebase:", e);
      }
    }

    try {
      localStorage.setItem('ov33_products', JSON.stringify(defaultProducts));
      localStorage.setItem('ov33_category_tree', JSON.stringify(INITIAL_CATEGORY_TREE));
      localStorage.setItem('ov33_categories', JSON.stringify(INITIAL_CATEGORIES));
      localStorage.setItem('ov33_orders', JSON.stringify(INITIAL_ORDERS));
      localStorage.setItem(CACHE_KEY_PRODUCTS, JSON.stringify(defaultProducts));
      localStorage.setItem(CACHE_KEY_CATEGORY_TREE, JSON.stringify(INITIAL_CATEGORY_TREE));
      localStorage.setItem(CACHE_KEY_CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
      localStorage.setItem(CACHE_KEY_TIMESTAMP, Date.now().toString());
    } catch (e) {}
  };

  const saveCategoryTreeToStorage = async (tree, affectedProducts = [], allProducts = null) => {
    const categoryNames = tree.map(c => c.name);
    
    if (isFirebaseEnabled && db) {
      try {
        await setDoc(doc(db, 'ov33_categories', 'tree'), { tree });
        await setDoc(doc(db, 'ov33_categories', 'list'), { categories: categoryNames });
        for (const prod of affectedProducts) {
          await setDoc(doc(db, 'ov33_products', String(prod.id)), prod);
        }
      } catch (error) {
        console.error("❌ Error guardando categorías en Firestore:", error);
      }
    }

    try {
      localStorage.setItem('ov33_category_tree', JSON.stringify(tree));
      localStorage.setItem('ov33_categories', JSON.stringify(categoryNames));
      localStorage.setItem(CACHE_KEY_CATEGORY_TREE, JSON.stringify(tree));
      localStorage.setItem(CACHE_KEY_CATEGORIES, JSON.stringify(categoryNames));
      if (allProducts) {
        localStorage.setItem(CACHE_KEY_PRODUCTS, JSON.stringify(allProducts));
        localStorage.setItem('ov33_products', JSON.stringify(allProducts));
      }
      localStorage.setItem(CACHE_KEY_TIMESTAMP, Date.now().toString());
    } catch (e) {}
  };

  const addCategory = async (categoryName) => {
    const trimmed = (categoryName || '').trim();
    if (!trimmed) return;
    if (categoryTree.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) {
      throw new Error(`Ya existe una categoría llamada "${trimmed}".`);
    }

    const newCat = {
      id: trimmed.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-'),
      name: trimmed,
      icon: 'category',
      subcategories: []
    };
    const updatedTree = [...categoryTree, newCat];
    setCategoryTree(updatedTree);
    await saveCategoryTreeToStorage(updatedTree);
  };

  const updateCategory = async (oldName, newName) => {
    const trimmedNew = (newName || '').trim();
    if (!trimmedNew || oldName === trimmedNew) return;

    if (categoryTree.some(c => c.name.toLowerCase() === trimmedNew.toLowerCase() && c.name.toLowerCase() !== oldName.toLowerCase())) {
      throw new Error(`Ya existe una categoría llamada "${trimmedNew}".`);
    }

    const updatedTree = categoryTree.map(c => c.name === oldName ? { ...c, name: trimmedNew } : c);
    setCategoryTree(updatedTree);

    const affectedProducts = [];
    const updatedProducts = products.map(p => {
      if ((p.category || '').toLowerCase() === oldName.toLowerCase()) {
        const updatedP = { ...p, category: trimmedNew };
        affectedProducts.push(updatedP);
        return updatedP;
      }
      return p;
    });
    setProducts(updatedProducts);
    await saveCategoryTreeToStorage(updatedTree, affectedProducts, updatedProducts);
  };

  const deleteCategory = async (categoryName) => {
    const hasProducts = products.some(p => (p.category || '').toLowerCase() === categoryName.toLowerCase());
    if (hasProducts) {
      throw new Error(`No puede eliminar la categoría "${categoryName}" porque tiene productos vinculados.`);
    }

    const updatedTree = categoryTree.filter(c => c.name.toLowerCase() !== categoryName.toLowerCase());
    setCategoryTree(updatedTree);
    await saveCategoryTreeToStorage(updatedTree);
  };

  const addSubcategory = async (categoryName, subcategoryName) => {
    const trimmedSub = (subcategoryName || '').trim();
    if (!trimmedSub) return;

    const targetCat = categoryTree.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
    if (!targetCat) throw new Error(`Categoría "${categoryName}" no encontrada.`);

    if ((targetCat.subcategories || []).some(s => s.toLowerCase() === trimmedSub.toLowerCase())) {
      throw new Error(`Ya existe la subcategoría "${trimmedSub}" en "${categoryName}".`);
    }

    const updatedTree = categoryTree.map(c => {
      if (c.name.toLowerCase() === categoryName.toLowerCase()) {
        return {
          ...c,
          subcategories: [...(c.subcategories || []), trimmedSub]
        };
      }
      return c;
    });
    setCategoryTree(updatedTree);
    await saveCategoryTreeToStorage(updatedTree);
  };

  const updateSubcategory = async (categoryName, oldSubName, newSubName) => {
    const trimmedNew = (newSubName || '').trim();
    if (!trimmedNew || oldSubName === trimmedNew) return;

    const targetCat = categoryTree.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
    if (!targetCat) throw new Error(`Categoría "${categoryName}" no encontrada.`);

    const updatedTree = categoryTree.map(c => {
      if (c.name.toLowerCase() === categoryName.toLowerCase()) {
        return {
          ...c,
          subcategories: (c.subcategories || []).map(s => s === oldSubName ? trimmedNew : s)
        };
      }
      return c;
    });
    setCategoryTree(updatedTree);

    const affectedProducts = [];
    const updatedProducts = products.map(p => {
      if ((p.category || '').toLowerCase() === categoryName.toLowerCase() && p.subcategory === oldSubName) {
        const updatedP = { ...p, subcategory: trimmedNew };
        affectedProducts.push(updatedP);
        return updatedP;
      }
      return p;
    });
    setProducts(updatedProducts);
    await saveCategoryTreeToStorage(updatedTree, affectedProducts, updatedProducts);
  };

  const deleteSubcategory = async (categoryName, subcategoryName) => {
    const hasProducts = products.some(
      p => (p.category || '').toLowerCase() === categoryName.toLowerCase() && p.subcategory === subcategoryName
    );
    if (hasProducts) {
      throw new Error(`No puede eliminar la subcategoría "${subcategoryName}" porque tiene productos vinculados.`);
    }

    const updatedTree = categoryTree.map(c => {
      if (c.name.toLowerCase() === categoryName.toLowerCase()) {
        return {
          ...c,
          subcategories: (c.subcategories || []).filter(s => s !== subcategoryName)
        };
      }
      return c;
    });
    setCategoryTree(updatedTree);
    await saveCategoryTreeToStorage(updatedTree);
  };

  const addOrder = async (orderData) => {
    const newOrder = {
      ...orderData,
      id: orderData.id || `OV33-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString(),
      status: 'Procesando'
    };

    const updatedOrders = [newOrder, ...orders];
    setOrders(updatedOrders);

    if (isFirebaseEnabled && db) {
      try {
        await setDoc(doc(db, 'orders', newOrder.id), newOrder);
      } catch (e) {
        console.error("Error guardando orden en Firestore:", e);
      }
    }
    localStorage.setItem('ov33_orders', JSON.stringify(updatedOrders));
    return newOrder;
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    const updated = orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
    setOrders(updated);

    if (isFirebaseEnabled && db) {
      try {
        await setDoc(doc(db, 'orders', orderId), { status: newStatus }, { merge: true });
      } catch (e) {
        console.error("Error actualizando status de orden:", e);
      }
    }
    localStorage.setItem('ov33_orders', JSON.stringify(updated));
  };

  const fetchOrders = async () => {
    if (isFirebaseEnabled && db) {
      try {
        const snap = await getDocs(collection(db, 'orders'));
        const loaded = [];
        snap.forEach(d => loaded.push({ id: d.id, ...d.data() }));
        loaded.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        setOrders(loaded);
        return loaded;
      } catch (e) {
        console.warn("Aviso obteniendo órdenes de Firestore:", e);
      }
    }
    return orders;
  };

  const fetchOrderById = async (targetId) => {
    if (!targetId) return null;
    const local = orders.find(o => o.id?.toLowerCase() === targetId.trim().toLowerCase());
    if (local) return local;

    if (isFirebaseEnabled && db) {
      try {
        const snap = await getDoc(doc(db, 'orders', targetId.trim()));
        if (snap.exists()) {
          return snap.data();
        }
      } catch (e) {
        console.warn("Aviso buscando orden por ID:", e.message);
      }
    }
    return null;
  };

  return (
    <ProductContext.Provider value={{
      products,
      categories,
      categoryTree,
      brands,
      orders,
      loading,
      isFirebaseEnabled,
      isUsingFallback,
      addProduct,
      updateProduct,
      deleteProduct,
      resetToDefaults,
      addCategory,
      deleteCategory,
      updateCategory,
      addSubcategory,
      updateSubcategory,
      deleteSubcategory,
      addOrder,
      updateOrderStatus,
      fetchOrders,
      fetchOrderById,
      getProductStock,
      normalizeProductClassification
    }}>
      {loading ? (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-center items-center font-sans">
          <div className="mb-6 flex flex-col items-center">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black text-2xl px-3 py-1 rounded-xl shadow-lg shadow-orange-500/30">
                OV33
              </span>
              <span className="text-xl font-bold tracking-tight text-white">MARKET</span>
            </div>
            <span className="text-xs tracking-wider text-orange-400 font-semibold uppercase">Grandes Marcas • Mejores Precios</span>
          </div>
          <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full animate-pulse w-full" />
          </div>
          <span className="text-xs text-slate-400 mt-4 animate-pulse">Cargando catálogo multimarca...</span>
        </div>
      ) : children}
    </ProductContext.Provider>
  );
}

export const useProducts = () => useContext(ProductContext);
