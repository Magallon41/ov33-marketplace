import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { INITIAL_PRODUCTS, INITIAL_CATEGORY_TREE, INITIAL_CATEGORIES } from '../src/context/initialProducts.js';

const firebaseConfig = {
  apiKey: "AIzaSyA_z-6o1IJId00eQLlRMA3C39DpCGIv7nQ",
  authDomain: "ov33-marketplace.firebaseapp.com",
  projectId: "ov33-marketplace",
  storageBucket: "ov33-marketplace.firebasestorage.app",
  messagingSenderId: "387856414897",
  appId: "1:387856414897:web:6f83ee2ebd9f2c0f69ca90"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seed() {
  console.log("🚀 Sincronizando catálogo inicial con Firestore en ov33-marketplace...");

  // 1. Guardar categorías
  await setDoc(doc(db, 'ov33_categories', 'tree'), { tree: INITIAL_CATEGORY_TREE });
  await setDoc(doc(db, 'ov33_categories', 'list'), { categories: INITIAL_CATEGORIES });
  console.log(`✅ Árbol de categorías guardado (${INITIAL_CATEGORY_TREE.length} departamentos).`);

  // 2. Guardar productos
  for (const prod of INITIAL_PRODUCTS) {
    await setDoc(doc(db, 'ov33_products', String(prod.id)), prod);
    console.log(`  - Guardado producto: [${prod.brand}] ${prod.name}`);
  }

  console.log(`\n🎉 ¡Catálogo sembrado con éxito! ${INITIAL_PRODUCTS.length} productos en la nube.`);
  process.exit(0);
}

seed().catch(err => {
  console.error("❌ Error sembrando catálogo:", err);
  process.exit(1);
});
