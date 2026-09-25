// Catálogo inicial de productos para el Marketplace OV33
// Multimarca, multicategoría, con atributos de marketplace (descuentos, ventas, calificaciones, marcas oficiales)

export const INITIAL_BRANDS = [
  { id: 'nike', name: 'Nike', category: 'Moda & Sneakers', logo: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=120&auto=format&fit=crop&q=80', description: 'Just Do It. Calzado y ropa deportiva líder mundial.' },
  { id: 'apple', name: 'Apple', category: 'Tecnología & Gadgets', logo: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=120&auto=format&fit=crop&q=80', description: 'Innovación, diseño y tecnología premium.' },
  { id: 'xiaomi', name: 'Xiaomi', category: 'Tecnología & Gadgets', logo: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=120&auto=format&fit=crop&q=80', description: 'Tecnología de vanguardia con la mejor relación calidad-precio.' },
  { id: 'sony', name: 'Sony', category: 'Audio & Gadgets', logo: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=120&auto=format&fit=crop&q=80', description: 'Pioneros en sonido de alta fidelidad y cancelación de ruido.' },
  { id: 'samsung', name: 'Samsung', category: 'Tecnología & Gadgets', logo: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=120&auto=format&fit=crop&q=80', description: 'Potencia, pantallas AMOLED y ecosistema Galaxy.' },
  { id: 'casio', name: 'Casio', category: 'Relojes & Accesorios', logo: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=120&auto=format&fit=crop&q=80', description: 'Diseño icónico retro y resistencia extrema G-Shock.' },
  { id: 'stanley', name: 'Stanley', category: 'Hogar & Estilo de Vida', logo: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=120&auto=format&fit=crop&q=80', description: 'Los vasos y termos térmicos más deseados del mercado.' },
  { id: 'logitech', name: 'Logitech', category: 'Computación & Gaming', logo: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=120&auto=format&fit=crop&q=80', description: 'Periféricos de alta precisión para trabajo y gaming.' },
  { id: 'levis', name: "Levi's", category: 'Moda & Sneakers', logo: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=120&auto=format&fit=crop&q=80', description: 'El denim legendario y auténtico desde 1873.' },
  { id: 'jbl', name: 'JBL', category: 'Audio & Gadgets', logo: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=120&auto=format&fit=crop&q=80', description: 'Graves potentes, resistencia al agua y fiesta portátil.' },
  { id: 'anker', name: 'Anker', category: 'Tecnología & Gadgets', logo: 'https://images.unsplash.com/photo-1609592424109-dd9892f1b177?w=120&auto=format&fit=crop&q=80', description: 'Carga ultrarrápida, baterías portátiles y accesorios confiables.' },
  { id: 'zara', name: 'Zara', category: 'Moda & Sneakers', logo: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=120&auto=format&fit=crop&q=80', description: 'Tendencias globales de moda contemporánea.' }
];

export const INITIAL_PRODUCTS = [
  {
    id: 101,
    name: "Apple AirPods Pro (2da Generación) USB-C con Cancelación Activa de Ruido",
    brand: "Apple",
    category: "Tecnología & Gadgets",
    subcategory: "Audio & Auriculares",
    price: "3,899",
    originalPrice: "5,299",
    isOnSale: true,
    discountPercentage: 26,
    rating: 4.9,
    reviewsCount: 1420,
    salesCount: "+3.8k vendidos",
    isFlashDeal: true,
    badge: "🔥 Super Oferta",
    freeShipping: true,
    shippingDays: "Llega mañana",
    image: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1588423771073-b8903fbb85b5?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=800&auto=format&fit=crop&q=80"
    ],
    description: "Los AirPods Pro (2da gen.) cuentan con el chip H2 de Apple, cancelación activa de ruido hasta 2 veces más potente, audio espacial personalizado y estuche de carga MagSafe con USB-C y altavoz integrado.",
    features: [
      "Cancelación de Ruido Activa de nivel profesional",
      "Modo Ambiente Adaptativo para escuchar el entorno de forma natural",
      "Audio Espacial con seguimiento dinámico de la cabeza",
      "Hasta 30 horas de reproducción total con el estuche MagSafe",
      "Resistencia al agua y al sudor IP54 en auriculares y estuche"
    ],
    sizes: ["Talla Única"],
    variants: [
      {
        colorName: "Blanco Glaciar",
        colorHex: "#FFFFFF",
        images: ["https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&auto=format&fit=crop&q=80"],
        stock: { "Talla Única": 45 }
      }
    ],
    stock: { "Talla Única": 45 }
  },
  {
    id: 102,
    name: "Sneakers Nike Air Max Excee Urban Lifestyle Edition",
    brand: "Nike",
    category: "Moda & Sneakers",
    subcategory: "Sneakers & Calzado",
    price: "1,699",
    originalPrice: "2,599",
    isOnSale: true,
    discountPercentage: 35,
    rating: 4.8,
    reviewsCount: 930,
    salesCount: "+2.1k vendidos",
    isFlashDeal: true,
    badge: "⚡ Oferta Relámpago",
    freeShipping: true,
    shippingDays: "Llega en 24-48 hrs",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1552346154-21d32810aba3?w=800&auto=format&fit=crop&q=80"
    ],
    description: "Inspirados en las icónicas Air Max 90, los Nike Air Max Excee rinden homenaje al diseño clásico con una perspectiva moderna. Su unidad Max Air visible aporta amortiguación ligera en cada paso.",
    features: [
      "Unidad Max Air visible amortiguada en el talón",
      "Parte superior combinada de piel auténtica, ante y malla transpirable",
      "Suela de goma duradera con patrón de tracción multisuperficie",
      "Diseño ergonómico para uso diario continuo sin fatiga"
    ],
    sizes: ["25.5 MX", "26.0 MX", "26.5 MX", "27.0 MX", "27.5 MX", "28.0 MX"],
    variants: [
      {
        colorName: "Rojo Carmín / Blanco",
        colorHex: "#DC2626",
        images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80"],
        stock: { "25.5 MX": 5, "26.0 MX": 12, "26.5 MX": 8, "27.0 MX": 15, "27.5 MX": 6, "28.0 MX": 4 }
      },
      {
        colorName: "Negro Stealth",
        colorHex: "#1E293B",
        images: ["https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&auto=format&fit=crop&q=80"],
        stock: { "25.5 MX": 8, "26.0 MX": 10, "26.5 MX": 14, "27.0 MX": 9, "27.5 MX": 3, "28.0 MX": 2 }
      }
    ],
    stock: { "25.5 MX": 13, "26.0 MX": 22, "26.5 MX": 22, "27.0 MX": 24, "27.5 MX": 9, "28.0 MX": 6 }
  },
  {
    id: 103,
    name: "Termo Stanley The Quencher H2.0 FlowState 40oz (1.18L) Acero Inoxidable",
    brand: "Stanley",
    category: "Hogar & Estilo de Vida",
    subcategory: "Termos & Hidratación",
    price: "849",
    originalPrice: "1,399",
    isOnSale: true,
    discountPercentage: 39,
    rating: 4.9,
    reviewsCount: 2150,
    salesCount: "+5.4k vendidos",
    isFlashDeal: false,
    badge: "⭐ Más Vendido #1",
    freeShipping: true,
    shippingDays: "Llega en 48 hrs",
    image: "https://images.unsplash.com/photo-1577937927133-66ef06acdf18?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1577937927133-66ef06acdf18?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80"
    ],
    description: "El vaso térmico Stanley Quencher H2.0 FlowState mantiene tus bebidas frías hasta por 11 horas y heladas hasta por 2 días completos. Fabricado en acero inoxidable 90% reciclado con tapa FlowState de 3 posiciones.",
    features: [
      "Capacidad generosa de 40 oz (1,180 ml)",
      "Aislamiento al vacío de doble pared de grado quirúrgico",
      "Tapa giratoria con popote reutilizable antisalpicaduras",
      "Asa ergonómica de agarre cómodo y base apta para portavasos de auto",
      "Libre de BPA y apto para lavavajillas"
    ],
    sizes: ["40 oz (1.18L)"],
    variants: [
      {
        colorName: "Verde Eucalipto",
        colorHex: "#5B7A6A",
        images: ["https://images.unsplash.com/photo-1577937927133-66ef06acdf18?w=800&auto=format&fit=crop&q=80"],
        stock: { "40 oz (1.18L)": 30 }
      },
      {
        colorName: "Rosa Cream",
        colorHex: "#FAD2E1",
        images: ["https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80"],
        stock: { "40 oz (1.18L)": 24 }
      },
      {
        colorName: "Negro Mate",
        colorHex: "#222222",
        images: ["https://images.unsplash.com/photo-1577937927133-66ef06acdf18?w=800&auto=format&fit=crop&q=80"],
        stock: { "40 oz (1.18L)": 18 }
      }
    ],
    stock: { "40 oz (1.18L)": 72 }
  },
  {
    id: 104,
    name: "Reloj Casio Vintage Digital Unisex Gold A168WG Retro Illuminator",
    brand: "Casio",
    category: "Relojes & Accesorios",
    subcategory: "Relojes Clásicos & Vintage",
    price: "799",
    originalPrice: "1,250",
    isOnSale: true,
    discountPercentage: 36,
    rating: 4.8,
    reviewsCount: 1680,
    salesCount: "+4.1k vendidos",
    isFlashDeal: true,
    badge: "⚡ Oferta Relámpago",
    freeShipping: true,
    shippingDays: "Llega mañana",
    image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&auto=format&fit=crop&q=80"
    ],
    description: "El auténtico clásico Casio Vintage en acabado dorado con luz electroluminiscente que ilumina toda la esfera. Cuenta con cronómetro de precisión, alarma diaria y calendario automático.",
    features: [
      "Iluminación electroluminiscente azul verdosa",
      "Cronómetro de 1/100 segundos con tiempo transcurrido y fracciones",
      "Alarma diaria y señal horaria conmutable",
      "Brazalete de acero inoxidable ajustable con cierre auto-bloqueo",
      "Batería de larga duración estimada en 7 años"
    ],
    sizes: ["Ajustable"],
    variants: [
      {
        colorName: "Dorado Oro 18K",
        colorHex: "#D4AF37",
        images: ["https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&auto=format&fit=crop&q=80"],
        stock: { "Ajustable": 40 }
      },
      {
        colorName: "Plata Cromado",
        colorHex: "#C0C0C0",
        images: ["https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&auto=format&fit=crop&q=80"],
        stock: { "Ajustable": 25 }
      }
    ],
    stock: { "Ajustable": 65 }
  },
  {
    id: 105,
    name: "Smartwatch Xiaomi Band 8 Pantalla AMOLED 1.62'' 60Hz 150+ Modos Deportivos",
    brand: "Xiaomi",
    category: "Tecnología & Gadgets",
    subcategory: "Smartwatches & Wearables",
    price: "689",
    originalPrice: "1,099",
    isOnSale: true,
    discountPercentage: 37,
    rating: 4.7,
    reviewsCount: 3100,
    salesCount: "+6.8k vendidos",
    isFlashDeal: false,
    badge: "🔥 Top Ventas",
    freeShipping: true,
    shippingDays: "Llega en 24 hrs",
    image: "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&auto=format&fit=crop&q=80"
    ],
    description: "La pulsera inteligente más vendida de Xiaomi ahora con pantalla AMOLED de 60Hz ultra fluida, ajuste de brillo automático, monitoreo continuo de SpO2, ritmo cardíaco y hasta 16 días de autonomía por carga.",
    features: [
      "Pantalla táctil AMOLED de 1.62 pulgadas con Always-on Display",
      "Tasa de refresco de 60Hz con brillo pico de 600 nits",
      "Monitoreo continuo de frecuencia cardíaca, oxígeno en sangre y sueño",
      "Resistencia acuática 5 ATM apta para natación",
      "Batería recargable magnética de hasta 16 días de duración"
    ],
    sizes: ["Talla Única"],
    variants: [
      {
        colorName: "Negro Carbón",
        colorHex: "#1A1A1A",
        images: ["https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=800&auto=format&fit=crop&q=80"],
        stock: { "Talla Única": 50 }
      },
      {
        colorName: "Oro Champagne",
        colorHex: "#E5D3B3",
        images: ["https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&auto=format&fit=crop&q=80"],
        stock: { "Talla Única": 32 }
      }
    ],
    stock: { "Talla Única": 82 }
  },
  {
    id: 106,
    name: "Audífonos Inalámbricos Sony WH-1000XM5 Hi-Res Noise Cancelling",
    brand: "Sony",
    category: "Tecnología & Gadgets",
    subcategory: "Audio & Auriculares",
    price: "5,999",
    originalPrice: "8,499",
    isOnSale: true,
    discountPercentage: 29,
    rating: 4.9,
    reviewsCount: 890,
    salesCount: "+1.3k vendidos",
    isFlashDeal: true,
    badge: "⚡ Oferta Premium",
    freeShipping: true,
    shippingDays: "Llega mañana",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&auto=format&fit=crop&q=80"
    ],
    description: "Los mejores audífonos con cancelación de ruido del mundo según la crítica. Cuentan con dos procesadores y ocho micrófonos para una inmersión acústica total y llamadas nítidas sin eco ni viento.",
    features: [
      "Tecnología Noise Cancelling Auto NC Optimizer líder en la industria",
      "Controladores de 30 mm de precisión con diafragma de fibra de carbono",
      "Compatibilidad con audio de alta resolución inalámbrico LDAC",
      "Hasta 30 horas de batería con recarga ultrarrápida (3 min = 3 horas)",
      "Conexión multipunto simultánea para dos dispositivos Bluetooth"
    ],
    sizes: ["Ajustable"],
    variants: [
      {
        colorName: "Negro Mate Suave",
        colorHex: "#1F2022",
        images: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80"],
        stock: { "Ajustable": 14 }
      },
      {
        colorName: "Plata Platino",
        colorHex: "#E6E2DD",
        images: ["https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&auto=format&fit=crop&q=80"],
        stock: { "Ajustable": 10 }
      }
    ],
    stock: { "Ajustable": 24 }
  },
  {
    id: 107,
    name: "Mouse Gamer Inalámbrico Logitech G305 LIGHTSPEED Hero 12K DPI",
    brand: "Logitech",
    category: "Tecnología & Gadgets",
    subcategory: "Computación & Gaming",
    price: "699",
    originalPrice: "1,149",
    isOnSale: true,
    discountPercentage: 39,
    rating: 4.8,
    reviewsCount: 1980,
    salesCount: "+4.5k vendidos",
    isFlashDeal: false,
    badge: "🔥 Super Ventas",
    freeShipping: true,
    shippingDays: "Llega en 24 hrs",
    image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&auto=format&fit=crop&q=80"
    ],
    description: "Mouse inalámbrico para juegos LIGHTSPEED diseñado para un rendimiento sobresaliente con tecnología de punta a un precio asequible. Sensor HERO con resolución ajustable hasta 12,000 DPI.",
    features: [
      "Sensor HERO de última generación: 12,000 DPI y 400 IPS sin suavizado",
      "Tecnología inalámbrica LIGHTSPEED con respuesta ultra veloz de 1 ms",
      "Duración de batería extraordinaria: hasta 250 horas con una sola pila AA",
      "Diseño ultraligero de 99 gramos con almacenamiento para receptor USB",
      "6 botones mecánicos programables a través de Logitech G HUB"
    ],
    sizes: ["Estándar"],
    variants: [
      {
        colorName: "Negro Gaming",
        colorHex: "#111111",
        images: ["https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&auto=format&fit=crop&q=80"],
        stock: { "Estándar": 28 }
      },
      {
        colorName: "Blanco Polar",
        colorHex: "#F8F9FA",
        images: ["https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&auto=format&fit=crop&q=80"],
        stock: { "Estándar": 20 }
      }
    ],
    stock: { "Estándar": 48 }
  },
  {
    id: 108,
    name: "Bocina Portátil Bluetooth JBL Flip 6 Resistente al Agua IP67 Potencia 30W",
    brand: "JBL",
    category: "Tecnología & Gadgets",
    subcategory: "Audio & Auriculares",
    price: "1,799",
    originalPrice: "2,799",
    isOnSale: true,
    discountPercentage: 35,
    rating: 4.8,
    reviewsCount: 1450,
    salesCount: "+3.2k vendidos",
    isFlashDeal: true,
    badge: "⚡ Oferta Relámpago",
    freeShipping: true,
    shippingDays: "Llega mañana",
    image: "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&auto=format&fit=crop&q=80"
    ],
    description: "Lleva el ritmo a cualquier parte con la JBL Flip 6. Sistema de altavoces de dos vías diseñado para ofrecer un sonido potente, cristalino y graves profundos e impactantes en un cuerpo impermeable.",
    features: [
      "Potencia RMS de 30W con woofer optimizado y tweeter independiente",
      "Certificación IP67 resistente al polvo y sumergible en agua",
      "Hasta 12 horas de música continua con una sola carga rápida",
      "Modo PartyBoost para emparejar dos o más bocinas compatibles JBL",
      "Diseño eco-amigable con empaque reciclable"
    ],
    sizes: ["Talla Única"],
    variants: [
      {
        colorName: "Azul Océano",
        colorHex: "#1E40AF",
        images: ["https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&auto=format&fit=crop&q=80"],
        stock: { "Talla Única": 16 }
      },
      {
        colorName: "Negro Profundo",
        colorHex: "#171717",
        images: ["https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&auto=format&fit=crop&q=80"],
        stock: { "Talla Única": 24 }
      }
    ],
    stock: { "Talla Única": 40 }
  },
  {
    id: 109,
    name: "Jeans Levi's 501 Original Fit Denim 100% Algodón Clásico",
    brand: "Levi's",
    category: "Moda & Sneakers",
    subcategory: "Jeans & Pantalones",
    price: "1,199",
    originalPrice: "1,899",
    isOnSale: true,
    discountPercentage: 36,
    rating: 4.7,
    reviewsCount: 1120,
    salesCount: "+2.7k vendidos",
    isFlashDeal: false,
    badge: "👖 Clásico Auténtico",
    freeShipping: true,
    shippingDays: "Llega en 48 hrs",
    image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1582552938357-32b906df40cb?w=800&auto=format&fit=crop&q=80"
    ],
    description: "El modelo que lo inició todo. El jean Levi's 501 Original tiene un corte recto clásico desde la cadera hasta el tobillo y la emblemática bragueta con botones distintiva de la marca.",
    features: [
      "100% Algodón denim resistente de alta durabilidad",
      "Corte recto icónico Original Fit que favorece cualquier silueta",
      "Bragueta clásica de botones y remaches metálicos de cobre",
      "Etiqueta trasera de piel Two Horse Pull icónica de Levi Strauss & Co."
    ],
    sizes: ["30x32", "32x32", "34x32", "36x32"],
    variants: [
      {
        colorName: "Azul Medio Stonewash",
        colorHex: "#3B82F6",
        images: ["https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&auto=format&fit=crop&q=80"],
        stock: { "30x32": 8, "32x32": 15, "34x32": 12, "36x32": 6 }
      },
      {
        colorName: "Negro Lavado",
        colorHex: "#333333",
        images: ["https://images.unsplash.com/photo-1582552938357-32b906df40cb?w=800&auto=format&fit=crop&q=80"],
        stock: { "30x32": 5, "32x32": 10, "34x32": 8, "36x32": 4 }
      }
    ],
    stock: { "30x32": 13, "32x32": 25, "34x32": 20, "36x32": 10 }
  },
  {
    id: 110,
    name: "Power Bank Anker 737 Batería Externa 24,000mAh Carga Rápida 140W Pantalla Digital",
    brand: "Anker",
    category: "Tecnología & Gadgets",
    subcategory: "Cargadores & Accesorios",
    price: "1,999",
    originalPrice: "3,299",
    isOnSale: true,
    discountPercentage: 39,
    rating: 4.9,
    reviewsCount: 780,
    salesCount: "+1.9k vendidos",
    isFlashDeal: true,
    badge: "⚡ 140W Ultra Rápido",
    freeShipping: true,
    shippingDays: "Llega mañana",
    image: "https://images.unsplash.com/photo-1609592424109-dd9892f1b177?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1609592424109-dd9892f1b177?w=800&auto=format&fit=crop&q=80"
    ],
    description: "Carga tu laptop, smartphone y tablet a toda velocidad con la batería Anker 737 (PowerCore 24K). Salida combinada masiva de 140W mediante Power Delivery 3.1 y pantalla OLED interactiva en tiempo real.",
    features: [
      "Potencia monstruosa de hasta 140W de salida bidireccional USB-C",
      "Capacidad colosal de 24,000 mAh: carga una MacBook Pro o hasta 5 veces un iPhone",
      "Pantalla digital a color que muestra potencia en vatios, estado de salud y tiempo restante",
      "Tecnología GaNPrime para máxima eficiencia energética sin calentamiento excesivo"
    ],
    sizes: ["24,000 mAh"],
    variants: [
      {
        colorName: "Gris Titanio",
        colorHex: "#4B5563",
        images: ["https://images.unsplash.com/photo-1609592424109-dd9892f1b177?w=800&auto=format&fit=crop&q=80"],
        stock: { "24,000 mAh": 22 }
      }
    ],
    stock: { "24,000 mAh": 22 }
  },
  {
    id: 111,
    name: "Sudadera Hoodie Oversize Unisex Fleece Grueso Algodón Orgánico",
    brand: "Zara",
    category: "Moda & Sneakers",
    subcategory: "Sudaderas & Hoodies",
    price: "749",
    originalPrice: "1,199",
    isOnSale: true,
    discountPercentage: 37,
    rating: 4.6,
    reviewsCount: 640,
    salesCount: "+1.6k vendidos",
    isFlashDeal: false,
    badge: "✨ Tendencia",
    freeShipping: true,
    shippingDays: "Llega en 48 hrs",
    image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80"
    ],
    description: "Sudadera holgada tipo hoodie confeccionada en mezcla de algodón orgánico con interior afelpado térmico de gran calidez. Acabados con puños de canalé y bolsillo canguro frontal.",
    features: [
      "Corte relajado Oversize Fit moderno",
      "Tejido interior de felpa suave de alto gramaje (380 g/m²)",
      "Capucha con cordones ajustables al tono",
      "Composición: 80% Algodón / 20% Poliéster reciclado"
    ],
    sizes: ["S", "M", "L", "XL"],
    variants: [
      {
        colorName: "Beige Avena",
        colorHex: "#E5DEC9",
        images: ["https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80"],
        stock: { S: 10, M: 18, L: 14, XL: 6 }
      },
      {
        colorName: "Gris Jaspe",
        colorHex: "#9CA3AF",
        images: ["https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80"],
        stock: { S: 8, M: 12, L: 15, XL: 4 }
      }
    ],
    stock: { S: 18, M: 30, L: 29, XL: 10 }
  },
  {
    id: 112,
    name: "Smartphone Samsung Galaxy S24 Ultra 256GB Titanium Gray con Galaxy AI",
    brand: "Samsung",
    category: "Tecnología & Gadgets",
    subcategory: "Smartphones & Tablets",
    price: "18,999",
    originalPrice: "24,999",
    isOnSale: true,
    discountPercentage: 24,
    rating: 4.9,
    reviewsCount: 520,
    salesCount: "+850 vendidos",
    isFlashDeal: true,
    badge: "🔥 Super Flagship",
    freeShipping: true,
    shippingDays: "Llega mañana",
    image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&auto=format&fit=crop&q=80"
    ],
    description: "El buque insignia definitivo de Samsung con marco de titanio resistente, cámara cuádruple de 200MP con zoom óptico 5x, procesador Snapdragon 8 Gen 3 y el poder integrado de la inteligencia artificial Galaxy AI.",
    features: [
      "Pantalla Dynamic AMOLED 2X de 6.8 pulgadas QHD+ a 120Hz con protección Gorilla Armor antirreflejos",
      "Cámara principal de 200 megapíxeles con estabilización óptica avanzada y Nightography",
      "S Pen integrado para notas, dibujo y productividad rápida",
      "Procesador Snapdragon 8 Gen 3 for Galaxy y 12GB de memoria RAM",
      "Batería masiva de 5,000 mAh con carga súper rápida de 45W"
    ],
    sizes: ["256GB", "512GB"],
    variants: [
      {
        colorName: "Gris Titanio",
        colorHex: "#6B7280",
        images: ["https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&auto=format&fit=crop&q=80"],
        stock: { "256GB": 10, "512GB": 5 }
      }
    ],
    stock: { "256GB": 10, "512GB": 5 }
  }
];

export const INITIAL_CATEGORY_TREE = [
  {
    id: "tecnologia-gadgets",
    name: "Tecnología & Gadgets",
    icon: "devices",
    subcategories: [
      "Audio & Auriculares",
      "Smartphones & Tablets",
      "Smartwatches & Wearables",
      "Computación & Gaming",
      "Cargadores & Accesorios"
    ]
  },
  {
    id: "moda-sneakers",
    name: "Moda & Sneakers",
    icon: "apparel",
    subcategories: [
      "Sneakers & Calzado",
      "Sudaderas & Hoodies",
      "Jeans & Pantalones",
      "Playeras & Polos",
      "Chamarras & Abrigos"
    ]
  },
  {
    id: "relojes-accesorios",
    name: "Relojes & Accesorios",
    icon: "watch",
    subcategories: [
      "Relojes Clásicos & Vintage",
      "Relojes Inteligentes",
      "Lentes de Sol",
      "Mochilas & Bolsos",
      "Billeteras"
    ]
  },
  {
    id: "hogar-estilo-de-vida",
    name: "Hogar & Estilo de Vida",
    icon: "home",
    subcategories: [
      "Termos & Hidratación",
      "Smart Home & Luces",
      "Organización & Deco",
      "Cocina Práctica"
    ]
  }
];

export const INITIAL_CATEGORIES = [
  "Tecnología & Gadgets",
  "Moda & Sneakers",
  "Relojes & Accesorios",
  "Hogar & Estilo de Vida"
];

export const INITIAL_ORDERS = [
  {
    id: "OV33-7721",
    customerEmail: "jesus@ov33.com",
    customerName: "Jesús M.",
    items: [
      {
        id: 101,
        name: "Apple AirPods Pro (2da Generación) USB-C",
        price: "3,899",
        quantity: 1,
        brand: "Apple",
        category: "Tecnología & Gadgets",
        image: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&auto=format&fit=crop&q=80",
        selectedSize: "Talla Única"
      }
    ],
    subtotal: 3899,
    discount: 0,
    total: 3899,
    shippingAddress: {
      address: "Av. Chapultepec 220",
      city: "Guadalajara",
      zip: "44100",
      country: "México"
    },
    createdAt: "2026-09-20T14:22:00.000Z",
    status: "Entregado"
  },
  {
    id: "OV33-8832",
    customerEmail: "cliente@ov33.com",
    customerName: "Laura R.",
    items: [
      {
        id: 103,
        name: "Termo Stanley The Quencher H2.0 40oz",
        price: "849",
        quantity: 1,
        brand: "Stanley",
        category: "Hogar & Estilo de Vida",
        image: "https://images.unsplash.com/photo-1577937927133-66ef06acdf18?w=800&auto=format&fit=crop&q=80",
        selectedSize: "40 oz (1.18L)"
      },
      {
        id: 104,
        name: "Reloj Casio Vintage Digital Gold",
        price: "799",
        quantity: 1,
        brand: "Casio",
        category: "Relojes & Accesorios",
        image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&auto=format&fit=crop&q=80",
        selectedSize: "Ajustable"
      }
    ],
    subtotal: 1648,
    discount: 100,
    total: 1548,
    shippingAddress: {
      address: "Paseo de la Reforma 500",
      city: "Ciudad de México",
      zip: "11560",
      country: "México"
    },
    createdAt: "2026-09-24T18:40:00.000Z",
    status: "En Camino"
  }
];
