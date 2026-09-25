// src/data/articles.js
// Artículos del Blog y Tendencias OV33 — contenido SEO rico en keywords
// En producción, estos datos vendrían de Firestore o un CMS headless.

export const ARTICLES = [
  {
    slug: 'guia-camisa-oxford',
    title: 'La Guía Definitiva de la Camisa Oxford para Hombre',
    subtitle: 'Todo lo que necesitas saber sobre el tejido, el corte y los ocasiones perfectas para vestirla',
    category: 'ESTILO',
    author: 'Equipo Editorial OV33',
    date: '2026-06-15T00:00:00Z',
    readTime: '7 min',
    image: 'https://images.unsplash.com/photo-1598808503746-f34c53b9323e?auto=format&fit=crop&q=80&w=1200',
    imageAlt: 'Camisa Oxford de algodón premium — detalle del tejido',
    excerpt: 'La camisa Oxford es la pieza más versátil en el guardarropa masculino. En esta guía, te explicamos su origen, sus características únicas y cómo sacarle el máximo partido a esta prenda atemporal.',
    tags: ['camisa oxford', 'estilo masculino', 'moda hombre', 'guía de estilo'],
    content: [
      {
        type: 'lead',
        text: 'Si hay una prenda que ha superado la prueba del tiempo en el guardarropa masculino, es la camisa Oxford. Nacida en las universidades de la Ivy League norteamericana a finales del siglo XIX, esta camisa ha evolucionado de uniforme académico a símbolo del lujo discreto y la elegancia cotidiana.',
      },
      {
        type: 'h2',
        text: '¿Qué hace única a una camisa Oxford?',
      },
      {
        type: 'paragraph',
        text: 'El secreto está en su tejido: el Oxford cloth es un tejido de cesta (basket weave) que crea una superficie ligeramente texturizada, más robusta que el popelín pero más suave que el denim. Esta textura hace que la camisa tenga un "drape" (caída) particular que le da estructura sin rigidez.',
      },
      {
        type: 'paragraph',
        text: 'En el catálogo de OV33 recomendamos camisas con tejido Oxford texturizado de 100% algodón peinado con un gramaje de 130-140 g/m², el punto exacto entre ligereza y estructura duradera.',
      },
      {
        type: 'h2',
        text: 'El collar button-down: seña de identidad',
      },
      {
        type: 'paragraph',
        text: 'La Oxford clásica se distingue por su cuello button-down, con botoncillos que anclan las puntas del cuello a la pechera. Este detalle, que surgió para que los jugadores de polo no tuvieran el cuello al aire durante el juego, se convirtió en el elemento definitorio de un estilo inteligente y sin pretensiones.',
      },
      {
        type: 'tip',
        text: 'Truco de experto: Con el cuello button-down siempre abrochado si llevas corbata. Sin corbata y con el primer botón abierto, los botoncillos del cuello pueden ir abrochados o desabrochados — ambas son opciones válidas según el nivel de formalidad que busques.',
      },
      {
        type: 'h2',
        text: '¿Para qué ocasiones es perfecta?',
      },
      {
        type: 'paragraph',
        text: 'Esta es la mayor virtud de la Oxford: su adaptabilidad. Una sola camisa puede acompañarte desde una reunión de trabajo hasta una cena informal, solo cambiando lo que llevas debajo y encima de ella.',
      },
      {
        type: 'list',
        items: [
          'Smart casual en oficina: Oxford azul celeste + pantalón chino beige + mocasines.',
          'Fin de semana: Oxford blanca sin tucking + jeans oscuros + sneakers blancos.',
          'Reunión ejecutiva: Oxford azul marino + traje gris carbón + corbata borgoña.',
          'Cena de verano: Oxford en lino oxford texturizado + lino blanco + sandalias de cuero.',
        ],
      },
      {
        type: 'h2',
        text: 'Cómo cuidar tu camisa Oxford',
      },
      {
        type: 'paragraph',
        text: 'El algodón Oxford es relativamente fácil de mantener. Lavado a máquina a 30°C con ciclo suave, sin centrifugado agresivo. Planchado con vapor mientras está ligeramente húmeda para lograr ese acabado impecable. Guárdala colgada en un gancho con percha de madera para preservar la forma del hombro.',
      },
      {
        type: 'cta',
        text: 'Explora nuestra colección de camisas Oxford en múltiples colores y variantes de corte.',
        link: '/catalog',
        label: 'Ver Camisas Oxford',
      },
    ],
  },
  {
    slug: 'minimalismo-masculino',
    title: 'El Arte del Minimalismo Masculino: Menos es Más Poderoso',
    subtitle: 'Cómo construir un guardarropa cápsula que comunique autoridad sin esfuerzo',
    category: 'FILOSOFÍA',
    author: 'Equipo Editorial OV33',
    date: '2026-06-08T00:00:00Z',
    readTime: '5 min',
    image: 'https://images.unsplash.com/photo-1594938298596-033785bef05c?auto=format&fit=crop&q=80&w=1200',
    imageAlt: 'Guardarropa minimalista masculino con camisas de colores neutros',
    excerpt: 'El hombre que viste con menos piezas pero de mayor calidad comunica algo que el hombre que acumula ropa nunca puede: intencionalidad. Te explicamos cómo construir un guardarropa cápsula que funcione los 365 días del año.',
    tags: ['minimalismo', 'guardarropa cápsula', 'estilo masculino', 'moda sostenible'],
    content: [
      {
        type: 'lead',
        text: 'Steve Jobs vestía el mismo jersey negro todos los días. Barack Obama limitó su armario a trajes azules y grises. Mark Zuckerberg tiene una fila de camisetas grises idénticas. El patrón no es casualidad: los hombres que operan en los más altos niveles de su industria, muchos de ellos, han eliminado la decisión de qué vestir para dedicar esa energía cognitiva a lo que importa.',
      },
      {
        type: 'h2',
        text: 'El costo oculto del armario saturado',
      },
      {
        type: 'paragraph',
        text: 'La "paradoja de la elección", documentada por el psicólogo Barry Schwartz, establece que más opciones producen más ansiedad, no más satisfacción. Un armario con 40 camisas crea más estrés matutino que uno con 8. Además, la mayoría de las personas usa el 20% de su ropa el 80% del tiempo.',
      },
      {
        type: 'h2',
        text: 'Las 8 piezas que conforman el guardarropa cápsula perfecto',
      },
      {
        type: 'list',
        items: [
          '2 camisas Oxford (blanca y azul celeste) — base de cualquier look formal o smart casual.',
          '1 camisa de lino en tono natural o beige — para el calor y los ambientes relajados.',
          '1 camisa negra (Oxford o popelín) — el comodín nocturno.',
          '1 camisa de cuadros discretos — para romper la monotonía con elegancia.',
          '2 pares de pantalones (negro y gris/beige).',
          '1 blazer azul marino — el multiplicador de outfits más poderoso.',
        ],
      },
      {
        type: 'paragraph',
        text: 'Con estas 8 piezas puedes crear más de 40 combinaciones distintas. La clave no está en la cantidad sino en la coherencia cromática y la calidad de cada pieza.',
      },
      {
        type: 'h2',
        text: 'Calidad sobre cantidad: la inversión que se amortiza',
      },
      {
        type: 'paragraph',
        text: 'Una prenda de fast fashion que dura pocos meses tiene un costo real mucho más alto al año. Elegir prendas y calzado de calidad certificada en OV33 Marketplace garantiza durabilidad, mejor confección y ahorro inteligente a largo plazo.',
      },
      {
        type: 'tip',
        text: 'La regla del costo por uso: Divide el precio de cualquier prenda o gadget entre el número de veces que lo usarás. Invertir en calidad con precios de marketplace es la verdadera compra inteligente.',
      },
      {
        type: 'cta',
        text: 'Construye tu estilo y equipamiento con la selección de marcas oficiales de OV33.',
        link: '/catalog',
        label: 'Ver Catálogo Completo',
      },
    ],
  },
  {
    slug: 'como-planchar-camisa',
    title: 'Cómo Planchar una Camisa Perfectamente en 6 Pasos',
    subtitle: 'La técnica profesional que marca la diferencia entre verse bien y verse impecable',
    category: 'CUIDADO',
    author: 'Equipo Editorial OV33',
    date: '2026-05-28T00:00:00Z',
    readTime: '4 min',
    image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&q=80&w=1200',
    imageAlt: 'Camisa de algodón premium siendo planchada con técnica profesional',
    excerpt: 'Una camisa de $5,000 MXN con arrugas se ve peor que una de $500 MXN perfectamente planchada. El planchado es la habilidad que separa al hombre que viste bien del que viste impecable.',
    tags: ['cuidado de camisas', 'cómo planchar', 'mantenimiento ropa', 'consejos estilo'],
    content: [
      {
        type: 'lead',
        text: 'No existe inversión en ropa que compense la falta de cuidado. Una camisa de primera calidad mal planchada es una oportunidad perdida. Esta guía te enseña la secuencia exacta que usan los profesionales para lograr ese acabado de sastrería que marca la diferencia.',
      },
      {
        type: 'h2',
        text: 'Antes de empezar: temperatura correcta por tejido',
      },
      {
        type: 'list',
        items: [
          'Algodón (Oxford, popelín): temperatura alta, vapor abundante.',
          'Lino: temperatura muy alta, humedecer bien antes de planchar.',
          'Mezcla algodón-poliéster: temperatura media, poco vapor.',
          'Seda: temperatura baja, sin vapor directo, usa un paño protector.',
        ],
      },
      {
        type: 'h2',
        text: 'El orden correcto: la secuencia profesional',
      },
      {
        type: 'paragraph',
        text: 'El orden en que planchas cada parte de la camisa determina si al final terminas re-arrugando lo que ya planchaste. Este es el orden correcto:',
      },
      {
        type: 'list',
        items: [
          'Paso 1 — El cuello: Empieza por los puntos del cuello y avanza hacia el centro. Nunca en sentido circular (crea pliegues). Plancha la parte interior primero, luego la exterior.',
          'Paso 2 — Los puños: Abre el botón, extiende el puño plano. Plancha el interior, luego el exterior. La costura del puño debe quedar perfectamente alineada.',
          'Paso 3 — Las mangas: Coloca la manga extendida con la costura alineada al borde de la tabla. Plancha de la muñeca al hombro. Gira y repite por el otro lado. La línea del pliegue debe coincidir con la costura.',
          'Paso 4 — La espalda: Empieza por el canesú (el panel superior de la espalda). Luego baja hacia los faldones. La parte más larga — tómate tu tiempo aquí.',
          'Paso 5 — Las solapas frontales: Plancha alrededor de los botones, nunca sobre ellos (los aplana y deforma). Usa la punta de la plancha para trabajar entre los botones.',
          'Paso 6 — El frontal y los faldones: La recta final. Mantén la plancha en movimiento constante para no quemar el tejido.',
        ],
      },
      {
        type: 'tip',
        text: 'El truco del profesional: Plancha la camisa ligeramente húmeda (no mojada). Si ya está seca, usa el vapor de la plancha generosamente o rocía agua con un atomizador. El calor + humedad es lo que libera las fibras y las reordena en posición plana.',
      },
      {
        type: 'h2',
        text: 'Cómo guardarla para que dure el planchado',
      },
      {
        type: 'paragraph',
        text: 'Usa siempre perchas de madera o con forma de hombro, nunca de alambre — deforman el hombro de la camisa en semanas. Deja espacios entre las camisas en el armario para que el tejido respire. Nunca guardes una camisa doblada si la planchaste — se marcará en los pliegues del doblado.',
      },
      {
        type: 'cta',
        text: 'Descubre nuestras camisas de algodón premium, diseñadas para mantener su forma impecable.',
        link: '/catalog',
        label: 'Ver Camisas',
      },
    ],
  },
  {
    slug: 'colores-camisa-piel-morena',
    title: 'Los Mejores Colores de Camisa para Piel Morena y Piel Canela',
    subtitle: 'La guía definitiva de combinaciones cromáticas para el hombre latinoamericano',
    category: 'ESTILO',
    author: 'Equipo Editorial OV33',
    date: '2026-05-20T00:00:00Z',
    readTime: '6 min',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=1200',
    imageAlt: 'Hombre de piel morena con camisa de color tierra — estilo masculino latinoamericano',
    excerpt: 'La teoría del color aplicada a la moda masculina tiene en cuenta el tono de piel como variable fundamental. Para el hombre latinoamericano, ciertos colores no solo combinan: potencian.',
    tags: ['colores para piel morena', 'moda hombre latino', 'teoría del color', 'estilo masculino México'],
    content: [
      {
        type: 'lead',
        text: 'México tiene una de las paletas de tonos de piel más ricas y diversas del mundo. Desde el moreno claro con undertones dorados hasta el moreno profundo con undertones rojizos. Entender tu subtono es el primer paso para elegir colores que no solo combinen, sino que te hagan brillar.',
      },
      {
        type: 'h2',
        text: 'Los colores que siempre funcionan en piel morena',
      },
      {
        type: 'paragraph',
        text: 'Hay colores que por contraste y complementariedad funcionan invariablemente bien en tonos de piel oscuros o medios:',
      },
      {
        type: 'list',
        items: [
          'Blanco roto o marfil: Más favorecedor que el blanco puro, que puede dar aspecto lavado. El marfil añade calidez.',
          'Azul marino: El contraste profundo en piel morena es poderoso. Proyecta autoridad y elegancia.',
          'Terracota y teja: Los tonos tierra resuenan con los undertones cálidos de la piel latinoamericana.',
          'Verde botella y verde olivo: Complementarios a los rojizos de la piel morena. Sofisticados y poco comunes.',
          'Burdeos y vino: El contraste oscuro-cálido es particularmente elegante en pieles morenas.',
          'Mostaza y ocre: Para los que tienen undertones muy dorados, estos colores crean un efecto armónico extraordinario.',
        ],
      },
      {
        type: 'h2',
        text: 'Colores a evitar (o usar con cuidado)',
      },
      {
        type: 'list',
        items: [
          'Neón y fosforescentes: Compiten con el tono de piel en lugar de complementarlo.',
          'Gris claro y beige muy claro: Pueden apagar la calidez natural de la piel morena.',
          'Rosa pálido y lavanda: Requieren el subtono de piel correcto para funcionar bien.',
        ],
      },
      {
        type: 'tip',
        text: 'El test del subtono: Mira las venas en el interior de tu muñeca. Si son azuladas/moradas, tienes subtono frío. Si son verdosas, subtono cálido. Si no puedes decidir, neutro. Los subtonos cálidos responden mejor a colores tierra, ocre y verde. Los fríos, a azules, grises y vinos.',
      },
      {
        type: 'cta',
        text: 'Encuentra tu color ideal en nuestra colección. Todas las camisas disponibles en múltiples variantes de color.',
        link: '/catalog',
        label: 'Explorar Colores',
      },
    ],
  },
];

export const CATEGORIES = ['TODOS', 'ESTILO', 'FILOSOFÍA', 'CUIDADO'];

export function getArticleBySlug(slug) {
  return ARTICLES.find(a => a.slug === slug) || null;
}

export function getRelatedArticles(currentSlug, limit = 2) {
  return ARTICLES.filter(a => a.slug !== currentSlug).slice(0, limit);
}
