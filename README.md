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

- **Sin backend ni base de datos:** El motor geoespacial corre directamente en el motor JavaScript del navegador.
- **Sin instalación ni dependencias locales:** Funciona de forma inmediata abriendo el archivo `index.html` en cualquier navegador moderno.
- **Librería de mapas:** [Leaflet 1.9.4](https://leafletjs.com/) cargada vía CDN sobre cartografía base de [OpenStreetMap](https://www.openstreetmap.org/).

### 📁 Estructura de Archivos del Proyecto
```text
tesis/
├── index.html     # Interfaz visual, motor de cálculo y lógica de mapa
├── rutas.js       # Dataset modular de las 10 líneas (ida, vuelta, colores)
├── README.md      # Documentación técnica, metodológica y bitácora
└── SPEC.md ...    # Especificación de requisitos original de la beta
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

---

## 7. Próximos Pasos hacia el Prototipo Final de Tesis

1. **Digitalización del Dataset Real:** Reemplazar las líneas ficticias por los trazados oficiales de la SEREMI de Transportes y Telecomunicaciones de Magallanes.
2. **Modelo de Grafo y Backend:** Evaluar la integración con bases de datos espaciales (PostgreSQL + PostGIS / pgRouting) si se requiere cálculo de transbordos o matrices origen-destino a gran escala.
3. **Métricas de Tiempo y Congestión:** Estimar tiempos de espera y trayecto considerando velocidades promedio por sector.
