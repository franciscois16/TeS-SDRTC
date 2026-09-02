/**
 * DATASET DE LÍNEAS DE TAXIS COLECTIVOS — PUNTA ARENAS (BETA DE PRUEBA)
 * ======================================================================
 * Estructura de datos geoespacial para la prueba de concepto de la tesis.
 * 
 * ESPECIFICACIONES:
 * 1. Formato de Coordenadas: GeoJSON estándar [longitud, latitud].
 *    - Longitud: Oeste (valores negativos aprox. -70.86 a -70.95)
 *    - Latitud:  Sur (valores negativos aprox. -53.09 a -53.20)
 * 
 * 2. Sentido de Circulación (Orden de puntos):
 *    - Cada línea posee dos listas ordenadas: 'ida' y 'vuelta'.
 *    - El orden de las coordenadas en el arreglo marca la dirección real del recorrido.
 *    - 4 líneas (L01, L02, L03, L04) poseen lazos asimétricos para simular calles de un solo sentido.
 *    - 6 líneas (L05 a L10) poseen vuelta simétrica (inversa de ida).
 */

const DATASET_COLECTIVOS = [
  {
    id: "L01",
    nombre: "L01 - Costanera - Sur",
    color: "#2563eb", // Azul
    descripcion: "Conecta el sector Sur con el Norte a través del eje Costanera del Estrecho.",
    // Ida: Sur hacia Norte por borde costero
    ida: [
      [-70.930, -53.185],
      [-70.922, -53.178],
      [-70.915, -53.170],
      [-70.910, -53.165],
      [-70.906, -53.162],
      [-70.902, -53.155],
      [-70.898, -53.148],
      [-70.892, -53.140]
    ],
    // Vuelta: Norte hacia Sur internándose por Av. España y Chiloé (lazo asimétrico)
    vuelta: [
      [-70.892, -53.140],
      [-70.903, -53.147],
      [-70.910, -53.156],
      [-70.914, -53.164],
      [-70.920, -53.172],
      [-70.926, -53.179],
      [-70.930, -53.185]
    ]
  },
  {
    id: "L02",
    nombre: "L02 - Centro - Norte",
    color: "#dc2626", // Rojo
    descripcion: "Eje estructurante Poniente - Centro - Norte con paso por calle Bories.",
    // Ida: Poniente -> Centro (Bories) -> Norte
    ida: [
      [-70.942, -53.164],
      [-70.932, -53.164],
      [-70.920, -53.163],
      [-70.910, -53.163],
      [-70.907, -53.158],
      [-70.902, -53.150],
      [-70.896, -53.142],
      [-70.890, -53.134]
    ],
    // Vuelta: Norte -> Centro (Magallanes / Colón) -> Poniente (lazo asimétrico)
    vuelta: [
      [-70.890, -53.134],
      [-70.897, -53.144],
      [-70.904, -53.152],
      [-70.912, -53.160],
      [-70.918, -53.165],
      [-70.930, -53.166],
      [-70.942, -53.164]
    ]
  },
  {
    id: "L03",
    nombre: "L03 - 18 de Septiembre - Zona Franca",
    color: "#059669", // Verde Esmeralda
    descripcion: "Conecta Barrio 18 de Septiembre con el polo comercial de Zona Franca.",
    // Ida: Barrio 18 -> Magallanes -> Zona Franca
    ida: [
      [-70.936, -53.180],
      [-70.927, -53.174],
      [-70.919, -53.169],
      [-70.910, -53.164],
      [-70.907, -53.160],
      [-70.900, -53.151],
      [-70.893, -53.140],
      [-70.886, -53.128]
    ],
    // Vuelta: Zona Franca -> Bulnes -> 21 de Mayo -> Barrio 18 (lazo asimétrico)
    vuelta: [
      [-70.886, -53.128],
      [-70.895, -53.138],
      [-70.903, -53.149],
      [-70.909, -53.157],
      [-70.915, -53.166],
      [-70.923, -53.173],
      [-70.936, -53.180]
    ]
  },
  {
    id: "L04",
    nombre: "L04 - Cerro La Cruz - Hospital",
    color: "#d97706", // Ámbar
    descripcion: "Ruta desde la parte alta poniente hasta el Hospital Clínico de Magallanes.",
    // Ida: Cerro -> Centro -> Av. Bulnes -> Hospital
    ida: [
      [-70.948, -53.158],
      [-70.938, -53.159],
      [-70.924, -53.161],
      [-70.911, -53.162],
      [-70.908, -53.157],
      [-70.904, -53.147],
      [-70.898, -53.137],
      [-70.892, -53.124]
    ],
    // Vuelta: Hospital -> Sarmiento / Fagnano -> Cerro (lazo asimétrico)
    vuelta: [
      [-70.892, -53.124],
      [-70.899, -53.135],
      [-70.906, -53.146],
      [-70.914, -53.155],
      [-70.920, -53.164],
      [-70.935, -53.161],
      [-70.948, -53.158]
    ]
  },
  {
    id: "L05",
    nombre: "L05 - Playa Norte - Barrio Prat",
    color: "#7c3aed", // Púrpura
    descripcion: "Conector transversal entre el sector nororiente y los barrios del surponiente.",
    ida: [
      [-70.892, -53.145],
      [-70.902, -53.148],
      [-70.912, -53.153],
      [-70.916, -53.159],
      [-70.909, -53.163],
      [-70.913, -53.170],
      [-70.923, -53.176],
      [-70.933, -53.183]
    ],
    vuelta: [
      [-70.933, -53.183],
      [-70.923, -53.176],
      [-70.913, -53.170],
      [-70.909, -53.163],
      [-70.916, -53.159],
      [-70.912, -53.153],
      [-70.902, -53.148],
      [-70.892, -53.145]
    ]
  },
  {
    id: "L06",
    nombre: "L06 - Circunvalación Poniente",
    color: "#0891b2", // Cian
    descripcion: "Línea perimetral que recorre el anillo poniente sin ingresar al centro denso.",
    ida: [
      [-70.944, -53.144],
      [-70.950, -53.153],
      [-70.953, -53.164],
      [-70.950, -53.174],
      [-70.942, -53.182],
      [-70.932, -53.188],
      [-70.922, -53.192],
      [-70.912, -53.195]
    ],
    vuelta: [
      [-70.912, -53.195],
      [-70.922, -53.192],
      [-70.932, -53.188],
      [-70.942, -53.182],
      [-70.950, -53.174],
      [-70.953, -53.164],
      [-70.950, -53.153],
      [-70.944, -53.144]
    ]
  },
  {
    id: "L07",
    nombre: "L07 - Archipiélago de Chiloé - Centro",
    color: "#db2777", // Rosa
    descripcion: "Línea radial directa desde el extremo sur (Manuel Rodríguez / Archipiélago) a Plaza Muñoz Gamero.",
    ida: [
      [-70.942, -53.195],
      [-70.935, -53.186],
      [-70.927, -53.178],
      [-70.919, -53.171],
      [-70.912, -53.166],
      [-70.908, -53.163],
      [-70.906, -53.159]
    ],
    vuelta: [
      [-70.906, -53.159],
      [-70.908, -53.163],
      [-70.912, -53.166],
      [-70.919, -53.171],
      [-70.927, -53.178],
      [-70.935, -53.186],
      [-70.942, -53.195]
    ]
  },
  {
    id: "L08",
    nombre: "L08 - Pampa Redonda - Tres Puentes",
    color: "#4b5563", // Gris
    descripcion: "Conector de los sectores altos del norte con el terminal de Tres Puentes.",
    ida: [
      [-70.938, -53.134],
      [-70.926, -53.132],
      [-70.914, -53.129],
      [-70.901, -53.127],
      [-70.889, -53.123],
      [-70.882, -53.117],
      [-70.876, -53.110]
    ],
    vuelta: [
      [-70.876, -53.110],
      [-70.882, -53.117],
      [-70.889, -53.123],
      [-70.901, -53.127],
      [-70.914, -53.129],
      [-70.926, -53.132],
      [-70.938, -53.134]
    ]
  },
  {
    id: "L09",
    nombre: "L09 - Mirador - Puerto",
    color: "#4f46e5", // Índigo
    descripcion: "Desciende desde el sector Mirador poniente hacia el área portuaria y Muelle Prat.",
    ida: [
      [-70.946, -53.169],
      [-70.936, -53.168],
      [-70.924, -53.167],
      [-70.915, -53.165],
      [-70.909, -53.164],
      [-70.905, -53.163],
      [-70.898, -53.163]
    ],
    vuelta: [
      [-70.898, -53.163],
      [-70.905, -53.163],
      [-70.909, -53.164],
      [-70.915, -53.165],
      [-70.924, -53.167],
      [-70.936, -53.168],
      [-70.946, -53.169]
    ]
  },
  {
    id: "L10",
    nombre: "L10 - Río Seco - Centro Rápido",
    color: "#ca8a04", // Dorado
    descripcion: "Ruta troncal de acceso rápido por Ruta 9 y Av. España hacia el centro de la ciudad.",
    ida: [
      [-70.865, -53.095],
      [-70.876, -53.112],
      [-70.886, -53.127],
      [-70.894, -53.139],
      [-70.900, -53.149],
      [-70.906, -53.157],
      [-70.909, -53.162],
      [-70.913, -53.165]
    ],
    vuelta: [
      [-70.913, -53.165],
      [-70.909, -53.162],
      [-70.906, -53.157],
      [-70.900, -53.149],
      [-70.894, -53.139],
      [-70.886, -53.127],
      [-70.876, -53.112],
      [-70.865, -53.095]
    ]
  }
];
