# Especificación Técnica (Beta de prueba) — Recomendador de Rutas de Colectivos

> **Nota de alcance:** esta es una beta interna de un solo desarrollador, con datos **ficticios**, cuyo único
> propósito es validar que el algoritmo de recomendación y la visualización en el mapa funcionan de punta a
> punta. No es el prototipo final de la tesis (ese usará datos reales digitalizados desde la SEREMI). Por eso
> esta versión deliberadamente NO tiene backend, base de datos, ni requisitos de producción.

## 1. Resumen y objetivo

**Problema que se está probando:** dado un origen y un destino, ¿un algoritmo geoespacial puede identificar
correctamente qué líneas de colectivo (de un set de datos ficticio) conectan ambos puntos?

**Objetivo de esta beta:** tener, en un solo archivo HTML autocontenido, un mapa con 3-4 líneas de ejemplo
(inventadas) donde se pueda marcar origen y destino, y ver cuál de dos estrategias algorítmicas recomienda
qué líneas, y cuánto se demora cada una.

**Usuario de esta beta:** solo el desarrollador (Francisco), para verificar el concepto antes de mostrarlo al
profesor guía. No se diseña todavía para usuarios finales ni para analistas externos.

## 2. Alcance

**Incluye:**
- Un archivo HTML autocontenido (o carpeta mínima) con Leaflet + JavaScript.
- Un dataset ficticio de 3-4 líneas, embebido directamente en el código como GeoJSON (sin subir archivos).
- Selección de origen y destino con clics en el mapa.
- Dos estrategias de recomendación, ejecutadas en el navegador (sin backend).
- Resaltado visual de las líneas recomendadas.
- Medición simple del tiempo de cálculo de cada estrategia (con `performance.now()` en JS), mostrado en pantalla.

**Explícitamente fuera de esta beta** (se evalúan más adelante, en el prototipo real de la tesis):
- Backend, API REST, base de datos (PostgreSQL/PostGIS).
- Requisitos de uptime, concurrencia o carga (nada de "50 peticiones simultáneas").
- Diseño responsivo pulido, exportación de resultados, autenticación.
- Dataset real de la SEREMI (se usan solo líneas inventadas).

## 3. Requisitos funcionales

| ID | Nombre | Descripción |
|----|--------|-------------|
| RF-01 | Dataset ficticio | 3-4 líneas de ejemplo, como constante GeoJSON dentro del propio código (no requiere carga de archivos). |
| RF-02 | Selección de puntos | Clic en el mapa marca "Origen" (verde); segundo clic marca "Destino" (rojo). |
| RF-03 | Estrategia 1: proximidad simple | Considera una línea "servida" si algún punto de su trazado está a menos de *r* metros del origen y del destino. |
| RF-04 | Estrategia 2: proyección sobre segmento | Proyecta el origen y el destino sobre el segmento más cercano de cada línea, y calcula la distancia perpendicular real (más preciso que el punto más cercano). |
| RF-05 | Visualización | Las líneas que cumplen la condición se resaltan (más gruesas/opacas); el resto se atenúa. |
| RF-06 | Comparación simple | Al calcular, mostrar en pantalla cuánto tardó cada estrategia (milisegundos) y si dieron el mismo resultado. |

## 4. Requisitos no funcionales

- **RNF-01:** Debe correr 100% en el navegador, sin servidor ni instalación (abrir el HTML alcanza).
- **RNF-02:** Usar Leaflet + OpenStreetMap (gratis, sin llave de API).
- **RNF-03:** Código simple y legible antes que optimizado — es una prueba de concepto, no producto final.

## 5. Diseño algorítmico

Se define una línea como una secuencia ordenada de puntos `[lon, lat]` (formato GeoJSON estándar: **longitud
primero, luego latitud** — cuidado con no invertir el orden en ningún ejemplo o dataset).

**Estrategia 1 — Proximidad simple:** para cada línea, revisar si existe al menos un punto de su trazado a
menos de *r* metros (ej. 400-800m) del origen, y al menos un punto a menos de *r* metros del destino.

**Estrategia 2 — Proyección sobre segmento:** para cada segmento de la línea (par de puntos consecutivos),
calcular la proyección ortogonal del origen/destino sobre ese segmento y la distancia real a la línea (no solo
al punto más cercano). Más preciso, especialmente en zonas donde varias líneas casi se tocan.

## 6. Dataset ficticio de ejemplo

Todas las coordenadas en formato `[longitud, latitud]` (orden GeoJSON correcto):

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": { "linea": "L1 - Costanera (ficticia)", "color": "#2c3e50" },
      "geometry": { "type": "LineString", "coordinates": [[-70.918, -53.172], [-70.910, -53.163], [-70.905, -53.158]] }
    },
    {
      "type": "Feature",
      "properties": { "linea": "L2 - Centro-Norte (ficticia)", "color": "#c0392b" },
      "geometry": { "type": "LineString", "coordinates": [[-70.935, -53.163], [-70.920, -53.163], [-70.909, -53.163], [-70.895, -53.163]] }
    },
    {
      "type": "Feature",
      "properties": { "linea": "L3 - Zona Franca (ficticia)", "color": "#1d9e75" },
      "geometry": { "type": "LineString", "coordinates": [[-70.920, -53.172], [-70.915, -53.168], [-70.909, -53.163], [-70.900, -53.155]] }
    }
  ]
}
```

*(Corregido respecto al spec original: se usó `[lon, lat]` de forma consistente en todo el documento; el spec
original mezclaba ese orden en el ejemplo de la API.)*

## 7. Plan de implementación (una sola fase, para Antigravity)

1. Crear un archivo `index.html` con Leaflet cargado desde CDN y un `<div id="map">`.
2. Embeber el dataset ficticio de la sección 6 como constante JavaScript y dibujarlo con `L.polyline`.
3. Manejar clics en el mapa: primer clic = origen, segundo clic = destino, tercer clic = reinicia.
4. Implementar `estrategia1(origen, destino, lineas)` y `estrategia2(origen, destino, lineas)` como funciones
   JS puras, midiendo tiempo con `performance.now()`.
5. Al tener origen y destino, ejecutar ambas estrategias, resaltar las líneas coincidentes y mostrar un texto
   con el resultado y los tiempos de cada una.
6. Probar con las 3-4 líneas ficticias y distintos pares de origen/destino, incluyendo un caso donde las
   líneas se crucen cerca (para simular el problema del centro).

## 8. Preguntas pendientes (sin resolver todavía, no bloquean la beta)

- ¿Se debe considerar el sentido de circulación de cada línea? (para la beta: no, se ignora).
- Radio óptimo de *r* para la Estrategia 1 (para la beta: probar con 500m y ajustar a ojo).

## 9. Criterios de aceptación de la beta

- El mapa carga y muestra las 3-4 líneas ficticias con colores distintos.
- Al hacer clic en dos puntos, el sistema resalta correctamente las líneas que "sirven" ese trayecto según
  cada estrategia.
- En un caso de prueba donde las líneas se cruzan cerca de un punto, la Estrategia 1 y la Estrategia 2 pueden
  dar resultados distintos — eso es esperado y es justamente lo que se quiere observar.
- Todo funciona abriendo un único archivo HTML en el navegador, sin instalar nada ni levantar un servidor.