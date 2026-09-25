// Utilidades para la integración con Envia.com en OV33 Marketplace
export const DEFAULT_ORIGIN = {
  name: 'OV33 Centro Logístico',
  company: 'OV33 MARKETPLACE',
  email: 'contacto@ov33.com',
  phone: '+523312345678',
  street: 'Av. Chapultepec',
  number: '220',
  district: 'Americana',
  city: 'Guadalajara',
  state: 'JA',
  country: 'MX',
  postalCode: '44160'
};

/**
 * Calcula dimensiones y peso estimado para pedidos de OV33 Marketplace
 * @param {Array} items Lista de productos en el carrito
 */
export function calculatePackage(items = []) {
  const totalItems = items.reduce((acc, item) => acc + (Number(item.quantity) || 1), 0) || 1;
  
  // Peso estimado: ~450g por artículo multimarca + 200g empaque
  const weight = Math.max(0.6, Math.round((totalItems * 0.45 + 0.2) * 10) / 10);
  
  const length = 32;
  const width = 24;
  const height = Math.min(40, Math.max(8, totalItems * 4));
  
  return [{
    type: 'box',
    content: `Artículos OV33 Marketplace (${totalItems} ${totalItems === 1 ? 'artículo' : 'artículos'})`,
    amount: 1,
    declaredValue: Math.max(500, totalItems * 600),
    lengthUnit: 'CM',
    weightUnit: 'KG',
    weight: weight,
    dimensions: { length, width, height }
  }];
}

/**
 * Mapeo de estados de la República Mexicana a códigos estándar de 2-3 letras
 */
export const STATE_CODES_MX = {
  'Aguascalientes': 'AG',
  'Baja California': 'BC',
  'Baja California Sur': 'BS',
  'Campeche': 'CM',
  'Chiapas': 'CS',
  'Chihuahua': 'CH',
  'Ciudad de México': 'CX',
  'CDMX': 'CX',
  'Coahuila': 'CO',
  'Colima': 'CL',
  'Durango': 'DG',
  'Guanajuato': 'GT',
  'Guerrero': 'GR',
  'Hidalgo': 'HG',
  'Jalisco': 'JAL',
  'Estado de México': 'EM',
  'México': 'EM',
  'Michoacán': 'MI',
  'Morelos': 'MO',
  'Nayarit': 'NA',
  'Nuevo León': 'NL',
  'Oaxaca': 'OA',
  'Puebla': 'PU',
  'Querétaro': 'QT',
  'Quintana Roo': 'QR',
  'San Luis Potosí': 'SL',
  'Sinaloa': 'SI',
  'Sonora': 'SO',
  'Tabasco': 'TB',
  'Tamaulipas': 'TM',
  'Tlaxcala': 'TL',
  'Veracruz': 'VE',
  'Yucatán': 'YU',
  'Zacatecas': 'ZA'
};
