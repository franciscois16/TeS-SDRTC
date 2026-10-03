# Sistema de Recomendación de Rutas de Taxis Colectivos — Punta Arenas

> **Documentación del Proyecto de Tesis de Pregrado**  
> **Autor:** Francisco  
> **Estado:** Prototipo Beta / Prueba de Concepto (PoC) Interactiva  
> **Tecnología:** HTML5, Vanilla JavaScript, Leaflet.js, OpenStreetMap  

---

## 1. Resumen y Contexto del Proyecto

El proyecto aborda la problemática de movilidad y elección de rutas de taxis colectivos en la ciudad de **Punta Arenas, Chile**. Debido a la alta densidad de líneas que convergen y se superponen en el centro histórico, para los usuarios suele ser complejo determinar con certeza qué línea y en qué sentido de circulación tomar para conectar un origen y un destino específicos.

Este repositorio contiene la **Beta de Prueba / PoC interactiva**, cuyo objetivo es validar de forma empírica y visual:
1. El comportamiento y precisión de diferentes estrategias algorítmicas de recomendación geoespacial.
2. El filtrado estricto por sentido de avance (*ida* vs. *vuelta*).
3. El tiempo de ejecución y rendimiento en milisegundos de cada enfoque.

---

## 2. Arquitectura de la Beta

Para esta fase de validación rápida antes de la integración con datos reales de la SEREMI, la aplicación se diseñó deliberadamente bajo una arquitectura **100% en cliente (frontend puro)**:

- **Arquitectura Offline-First / Edge Computing:** El motor de recomendación corre en el dispositivo del usuario, eliminando latencia de red y costos de servidor.
- **PWA (Progressive Web App):** Instalable en la pantalla de inicio de celulares y con soporte offline mediante Service Worker (`sw.js`).
- **Librería de mapas:** [Leaflet 1.9.4](https://leafletjs.com/) con cartografía base de [OpenStreetMap France](https://openstreetmap.fr/) (datos abiertos de [OpenStreetMap](https://www.openstreetmap.org/)).

### 📁 Estructura de Archivos del Proyecto
```text
tesis/
├── assets/
│   └── icons/
│       ├── icon.svg       # Ícono vectorial de la aplicación
│       ├── icon-192.png   # Ícono PWA resolución estándar (192x192)
│       └── icon-512.png   # Ícono PWA alta resolución (512x512)
├── data/
│   ├── rutas.geojson      # Dataset estándar RFC 7946 interoperable (QGIS / SIG / Python)
│   └── rutas.js           # Dataset de rutas estructurado para JavaScript
├── docs/
│   ├── FUENTES_BIBLIOGRAFICAS.md # Referencias académicas de la tesis (APA 7ma y BibTeX)
│   ├── presentaciones/    # Presentaciones y propuesta de tesis (PPTX / PDF)
│   ├── SPEC.md ...        # Especificación de requisitos original de la beta
│   └── Stack_Tecnologico_y_Reunion_Profesor.md # Bitácora técnica y acuerdos
├── editor.html            # Vista de Administrador/Digitalizador (Desktop, File System API)
├── index.html             # Vista Ciudadano/Usuario (Recomendador puro, Mobile-First PWA)
├── motor.js               # Motor geoespacial compartido (Haversine, E1, E2, Parsers)
├── manifest.json          # Manifiesto de instalación PWA para dispositivos móviles
├── sw.js                  # Service Worker para funcionamiento 100% Offline (v5)
└── README.md              # Documentación técnica, metodológica y bitácora
```

---

## 3. Estructura de Datos (Dataset Ficticio)

El dataset incluye **10 líneas ficticias** representativas de la geografía y topología de Punta Arenas (sectores Centro, Sur, Norte, Poniente, Costanera, Zona Franca, Hospital y periféricos).

### 3.1. Formato de Coordenadas
Siguiendo el estándar GeoJSON, todas las coordenadas se definen en el orden **`[longitud, latitud]`**:
```javascript
// Longitud primero (aprox -70.9°), Latitud después (aprox -53.1°)
[-70.910, -53.163]
```

### 3.2. Sentidos de Circulación Independientes
Cada línea cuenta con dos trazados diferenciados:
- **`ida`**: Polilínea ordenada que representa el recorrido de ida.
- **`vuelta`**: Polilínea ordenada que representa el recorrido de retorno.

Para simular la realidad urbana de calles con sentido único:
- **Líneas con lazo asimétrico (4 líneas):** `L01`, `L02`, `L03` y `L04` cuentan con recorridos de vuelta que se desvían por avenidas/calles paralelas en el sector céntrico en lugar de devolverse por la misma vía.
- **Líneas simétricas (6 líneas):** `L05` a `L10` tienen el trazado de vuelta como la inversión del trazado de ida.

---

## 4. Algoritmos Geoespaciales Implementados

Ambas estrategias toman como parámetros:
- Punto de Origen: $O(\text{lat}_O, \text{lon}_O)$
- Punto de Destino: $D(\text{lat}_D, \text{lon}_D)$
- Radio de Búsqueda: $r$ (metros, configurable dinámicamente)
- Conjunto de Trayectorias: $T = \{ \tau_1, \tau_2, \dots \}$

### 📐 Estrategia 1: Proximidad Discreta a Vértices
1. Para cada vértice $v_i$ de la trayectoria $\tau$, se calcula la distancia acumulada a lo largo de la ruta:
   $$cumDist(v_i) = \sum_{k=0}^{i-1} \text{dist}_{\text{Haversine}}(v_k, v_{k+1})$$
2. Se localiza el vértice $v_{O}^*$ más cercano al origen $O$, obteniendo su distancia $d_O$ y posición $pos_O = cumDist(v_O^*)$.
3. Se localiza el vértice $v_{D}^*$ más cercano al destino $D$, obteniendo su distancia $d_D$ y posición $pos_D = cumDist(v_D^*)$.
4. **Criterio de recomendación y ranking:**
   $$d_O \le r \quad \land \quad d_D \le r \quad \land \quad pos_O < pos_D$$
   Las trayectorias válidas se ordenan de forma ascendente por **Distancia de Caminata Total**:
   $$D_{\text{caminata}} = d_O + d_D$$

---

### 📐 Estrategia 2: Proyección Ortogonal Continua sobre Segmentos
1. Para cada segmento consecutivo $S_k = [v_k, v_{k+1}]$ de la trayectoria:
   - Se proyecta ortogonalmente el origen y el destino mediante cálculo vectorial en proyección métrica local plana:
     $$t = \text{clamp}\left(\frac{\vec{AP} \cdot \vec{AB}}{\|\vec{AB}\|^2}, 0, 1\right)$$
   - Se obtiene la distancia perpendicular mínima real a la línea y la posición acumulada exacta:
     $$pos = cumSegDist(k) + t \cdot \text{longitud}(S_k)$$
2. Se determina el punto más cercano en toda la línea para el origen ($d_O, pos_O$) y para el destino ($d_D, pos_D$).
3. **Criterio de recomendación y ranking:**
   $$d_O \le r \quad \land \quad d_D \le r \quad \land \quad pos_O < pos_D$$
   Las trayectorias se ordenan por menor caminata total ($D_{\text{caminata}} = d_O + d_D$), reflejando la distancia perpendicular exacta a la calzada.

---

## 5. Funcionalidades de la Interfaz

| Componente | Descripción |
|---|---|
| **Marcación por Clics** | 1er clic marca **Origen (Verde - O)**; 2do clic marca **Destino (Rojo - D)**; 3er clic reinicia. |
| **Ranking por Caminata** | Las líneas recomendadas se muestran ordenadas por menor distancia caminable total ($d_O + d_D$), con desglose de subida, bajada y distancia a bordo. |
| **Geolocalización GPS** | Botón **`📍 Usar mi GPS`** y solicitud automática inicial para fijar el origen con la ubicación del dispositivo. |
| **Control de Radio ($r$)** | Slider interactivo entre $100\text{ m}$ y $1500\text{ m}$ (por defecto $500\text{ m}$) con recálculo en tiempo real. |
| **Diferenciación de Trazos** | Rutas de **Ida** en trazo continuo (`──`); rutas de **Vuelta** en trazo punteado (`╌╌`). |
| **Resaltado Dinámico** | Las líneas recomendadas aumentan grosor y opacidad; las no coincidentes se atenúan al fondo. |
| **Inspección de Vértices** | Puntos circulares en cada vértice de las líneas recomendadas con tooltip de depuración. |
| **Panel Comparativo** | Muestra tiempos de cómputo en milisegundos (`performance.now()`) y analiza si ambas estrategias coinciden o difieren. |

---

## 6. Historial de Versiones y Evolución

- **v1.0 (Beta Inicial):**
  - Implementación base en un archivo HTML con Leaflet.
  - 3 líneas ficticias rectas.
  - Evaluación básica de Estrategia 1 y Estrategia 2.
- **v1.1 (Expansión del Dataset):**
  - Aumento a 10 líneas ficticias con 7-8 puntos intermedios por línea.
  - Simulación de quiebres de calles y alta convergencia en el sector Centro.
- **v1.2 (Sentido de Circulación y Distancia Acumulada):**
  - Separación de cada línea en trazados independientes de `ida` y `vuelta`.
  - Incorporación de 4 lazos asimétricos por calles de un solo sentido.
  - Validación del orden $pos_O < pos_D$.
  - Estilos de trazo sólido vs. punteado.
- **v1.3 (GPS y Visualización de Nodos):**
  - Integración de API Geolocation del navegador.
  - Visualización temporal de vértices para verificación de algoritmos.
- **v1.4 (Ranking y Desglose de Caminata):**
  - Ordenamiento automático de resultados por menor distancia total a pie ($d_O + d_D$).
  - Tarjetas de resultado con insignia de posición (`#1`, `#2`, etc.), desglose en metros de caminata al subir/bajar y distancia a bordo en kilómetros.
- **v1.5 (PWA Offline-First y Exportación GeoJSON):**
  - Conversión a Progressive Web App (PWA) instalable en celulares (`manifest.json` e `icon.svg`).
  - Soporte de ejecución 100% Offline mediante Service Worker (`sw.js`).
  - Desacoplamiento del dataset modular (`rutas.js`) y generación de dataset estándar interoperable `rutas.geojson` (RFC 7946) para SIG/QGIS.
- **v1.6 (Trazados ajustados a la Red Vial Real de Punta Arenas):**
  - Generación de geometrías vectoriales que siguen con total precisión el eje de las calles de OpenStreetMap (Av. Bulnes, Av. Costanera, Bories, Magallanes, Av. España, Zenteno, 21 de Mayo, etc.).
  - Conservación de sentidos de circulación y lazos asimétricos por calles unidireccionales del centro.
  - Limpieza visual del mapa eliminando sobrecarga de marcadores de vértices.
- **v1.7 (Reorganización Modular del Repositorio y Agentes):**
  - Reestructuración de archivos en directorios semánticos: datos en `data/` (`rutas.geojson`, `rutas.js`), assets en `assets/icons/` (`icon.svg`, `icon-192.png`, `icon-512.png`), y presentaciones/documentos en `docs/`.
  - Exclusión de configuración de agentes (`.agents/`) en `.gitignore`.
  - Actualización de referencias en `index.html`, `manifest.json` y Service Worker (`sw.js` v3).
- **v1.9 (Dos Vistas Separadas, File System Access API y Recomendador con Transbordo):**
  - **Separación de Vistas:** `index.html` como vista limpia y optimizada para ciudadanos/evaluadores (móvil y escritorio sin controles de edición); `editor.html` como vista de administración y digitalización para computador.
  - **Motor Compartido (`motor.js`):** Desacoplamiento de fórmulas geoespaciales (Haversine, proyección ortogonal), parsers y algoritmos de recomendación en un script modular sin dependencias externas.
  - **Recomendación con Transbordo:** Detección automática cuando no existe una línea directa entre origen y destino, calculando la mejor combinación de dos líneas con 1 transbordo peatonal óptimo, desglosando caminata inicial, tramo 1, transbordo a pie, tramo 2 y caminata final, con marcador `🔄` e itinerario visual en el mapa Leaflet.
  - **Guardado Directo en Disco:** Integración de la *File System Access API* (`showOpenFilePicker` / `createWritable`) en `editor.html` para persistir los cambios directamente en `data/rutas.js` con indicador de cambios sin guardar.
- **v2.0 (Geocodificación Híbrida y Brushing & Linking Coordinado):**
  - **Buscador de Direcciones y Lugares (Geocodificación):** Integración de autocompletado híbrido en `index.html` con catálogo de 32 hitos urbanos de Punta Arenas (0 ms, offline) y geocodificación en tiempo real sobre OpenStreetMap (Nominatim API acotada a la comuna).
  - **Interacción Coordinada (*Brushing & Linking*):** Selección por clic de alternativas (#1, #2, #3), previsualización al pasar el cursor (*hover*) y atenuación de líneas no seleccionadas.
- **v2.1 (Desambiguación de Direcciones, Marcadores Arrastrables y Mobile No Oclusivo):**
  - **Desambiguación Inteligente de Direcciones:** Clasificación semántica entre calles (🛣️) y barrios/poblaciones residenciales (🏘️), deduplicación y zonificación automática de tramos viales (Sur, Centro, Centro-Norte, Norte) priorizando según la altura numérica de la puerta (#401, #1200, etc.).
  - **Marcadores Arrastrables (*Draggable*):** Pines de Origen (O) y Destino (D) arrastrables con el dedo o ratón directamente en el mapa para ajustar con precisión métrica la puerta o esquina deseada, recalculando las rutas en tiempo real al soltar el pin.
  - **Optimización Móvil No Oclusiva:** Panel inferior deslizable limitado a 48dvh, auto-minimización a barra de 50px al calcular para mantener el mapa y los recorridos 100% visibles.
  - **Caché Offline v7:** Actualización del Service Worker (`sw.js`).
- **v2.2 (Catálogo Local Extendido de 90+ Hitos Urbanos y Búsqueda Local 100% Offline):**
  - **Catálogo Exhaustivo de Puntos de Interés (POIs):** Incorporación de más de 90 hitos verificados de Punta Arenas clasificados por categoría: Colegios y Liceos (San José, Don Bosco, Sara Braun, Industrial, María Auxiliadora, LEUMAG, Charles Darwin, etc.), Educación Superior (UMAG, CADI-UMAG, INACAP, Santo Tomás), Salud (Hospital Clínico, RedSalud, Hospital Naval, CESFAMs, SAR Bencur), Comercio y Malls (Zona Franca, Mall Pionero, Mercado, supermercados), Cívicos y Servicios (Plaza, GORE, Municipalidad, Registro Civil, FONASA, SII), Deportes, Parques y Terminales de Buses.
  - **Búsqueda Instantánea y Privacidad (0 ms):** Eliminación de peticiones externas de geocodificación por número de calle (debido a la ausencia estructural de numeración domiciliaria en OpenStreetMap Chile que generaba ambigüedad) a favor de un autocompletado local ultrarrápido, tokenizado y resiliente a tildes y abreviaciones.
  - **Micro-posicionamiento por Arrastre o Toque:** Cualquier dirección residencial o punto específico de una calle se define de manera intuitiva y exacta tocando el mapa o arrastrando el pin hasta la puerta deseada.
  - **Caché Offline v12:** Actualización del Service Worker (`sw.js`).

---

## 7. Próximos Pasos hacia el Prototipo Final de Tesis

1. **Digitalización del Dataset Real:** Reemplazar las líneas ficticias por los trazados oficiales de la SEREMI de Transportes y Telecomunicaciones de Magallanes.
2. **Modelo de Grafo y Backend:** Evaluar la integración con bases de datos espaciales (PostgreSQL + PostGIS / pgRouting) si se requiere cálculo de transbordos o matrices origen-destino a gran escala.
3. **Métricas de Tiempo y Congestión:** Estimar tiempos de espera y trayecto considerando velocidades promedio por sector.
