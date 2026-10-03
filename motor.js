/**
 * MOTOR DE CÁLCULO GEOESPACIAL Y RECOMENDACIÓN DE RUTAS (TeS-SDRTC)
 * ================================================================
 * Módulo compartido entre index.html (usuario) y editor.html (administrador).
 * No depende de ningún backend ni framework (Vanilla JS).
 */

const EARTH_RADIUS_METERS = 6371000;

/**
 * Calcula la distancia ortodrómica (Haversine) entre dos coordenadas en metros.
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const rLat1 = lat1 * Math.PI / 180;
  const rLat2 = lat2 * Math.PI / 180;

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(rLat1) * Math.cos(rLat2) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}

/**
 * Proyección ortogonal y distancia perpendicular de un punto P a un segmento [A, B].
 * Retorna { distance: metros, t: fracción 0..1 sobre el segmento }.
 */
function projectPointToSegment(pLat, pLon, aLat, aLon, bLat, bLon) {
  const cosLat = Math.cos(aLat * Math.PI / 180);
  const kx = (Math.PI / 180) * EARTH_RADIUS_METERS * cosLat;
  const ky = (Math.PI / 180) * EARTH_RADIUS_METERS;

  const px = (pLon - aLon) * kx;
  const py = (pLat - aLat) * ky;

  const bx = (bLon - aLon) * kx;
  const by = (bLat - aLat) * ky;

  const segLenSq = bx * bx + by * by;

  if (segLenSq === 0) {
    return { distance: Math.hypot(px, py), t: 0 };
  }

  let t = (px * bx + py * by) / segLenSq;
  t = Math.max(0, Math.min(1, t));

  const projX = t * bx;
  const projY = t * by;
  const distance = Math.hypot(px - projX, py - projY);

  return { distance, t };
}

/**
 * Genera la lista de trayectorias evaluables (ida y vuelta) a partir de un dataset de colectivos.
 */
function generarTrayectorias(dataset) {
  const trayectorias = [];
  if (!Array.isArray(dataset)) return trayectorias;

  dataset.forEach(linea => {
    if (linea.ida && linea.ida.length > 0) {
      trayectorias.push({
        lineaId: linea.id,
        nombre: linea.nombre,
        sentido: "ida",
        etiqueta: `${linea.nombre} (ida)`,
        color: linea.color,
        coords: linea.ida
      });
    }
    if (linea.vuelta && linea.vuelta.length > 0) {
      trayectorias.push({
        lineaId: linea.id,
        nombre: linea.nombre,
        sentido: "vuelta",
        etiqueta: `${linea.nombre} (vuelta)`,
        color: linea.color,
        coords: linea.vuelta
      });
    }
  });

  return trayectorias;
}

/**
 * ESTRATEGIA 1: Proximidad métrica simple a vértices
 * - Busca el nodo más cercano al origen y su distancia acumulada.
 * - Busca el nodo más cercano al destino y su distancia acumulada.
 * - Valida radio de cobertura y sentido de circulación (posOrigen < posDestino).
 * - Ordena por menor distancia de caminata total (dOrigen + dDestino).
 */
function estrategia1(origen, destino, trayectorias, r) {
  const recomendadas = [];

  for (const trayecto of trayectorias) {
    const coords = trayecto.coords; // Formato estándar [[lon, lat], ...]
    if (!coords || coords.length < 2) continue;

    const cumDist = new Float64Array(coords.length);
    cumDist[0] = 0;
    for (let i = 1; i < coords.length; i++) {
      const [lonPrev, latPrev] = coords[i - 1];
      const [lonCurr, latCurr] = coords[i];
      cumDist[i] = cumDist[i - 1] + haversineDistance(latPrev, lonPrev, latCurr, lonCurr);
    }

    let bestOrigDist = Infinity;
    let bestOrigPos = 0;
    let bestDestDist = Infinity;
    let bestDestPos = 0;

    for (let i = 0; i < coords.length; i++) {
      const [lon, lat] = coords[i];

      const dOrig = haversineDistance(origen.lat, origen.lng, lat, lon);
      if (dOrig < bestOrigDist) {
        bestOrigDist = dOrig;
        bestOrigPos = cumDist[i];
      }

      const dDest = haversineDistance(destino.lat, destino.lng, lat, lon);
      if (dDest < bestDestDist) {
        bestDestDist = dDest;
        bestDestPos = cumDist[i];
      }
    }

    if (bestOrigDist <= r && bestDestDist <= r && bestOrigPos < bestDestPos) {
      recomendadas.push({
        ...trayecto,
        dOrigen: Math.round(bestOrigDist),
        dDestino: Math.round(bestDestDist),
        dTotalCaminata: Math.round(bestOrigDist + bestDestDist),
        distanciaRecorrido: Math.round(bestDestPos - bestOrigPos)
      });
    }
  }

  recomendadas.sort((a, b) => a.dTotalCaminata - b.dTotalCaminata);
  return recomendadas;
}

/**
 * ESTRATEGIA 2: Proyección perpendicular continua sobre segmentos de calle
 * - Proyecta ortogonalmente el origen y el destino a cada segmento de calzada.
 * - Calcula la distancia perpendicular real a la línea y su posición acumulada continua.
 * - Valida radio de cobertura y sentido de circulación (posOrigen < posDestino).
 * - Ordena por menor distancia de caminata total (dOrigen + dDestino).
 */
function estrategia2(origen, destino, trayectorias, r) {
  const recomendadas = [];

  for (const trayecto of trayectorias) {
    const coords = trayecto.coords;
    if (!coords || coords.length < 2) continue;

    const segCount = coords.length - 1;
    const cumSegDist = new Float64Array(segCount + 1);
    const segLengths = new Float64Array(segCount);

    cumSegDist[0] = 0;
    for (let i = 0; i < segCount; i++) {
      const [aLon, aLat] = coords[i];
      const [bLon, bLat] = coords[i + 1];
      const len = haversineDistance(aLat, aLon, bLat, bLon);
      segLengths[i] = len;
      cumSegDist[i + 1] = cumSegDist[i] + len;
    }

    let bestOrigDist = Infinity;
    let bestOrigPos = 0;
    let bestDestDist = Infinity;
    let bestDestPos = 0;

    for (let i = 0; i < segCount; i++) {
      const [aLon, aLat] = coords[i];
      const [bLon, bLat] = coords[i + 1];

      const projOrig = projectPointToSegment(origen.lat, origen.lng, aLat, aLon, bLat, bLon);
      if (projOrig.distance < bestOrigDist) {
        bestOrigDist = projOrig.distance;
        bestOrigPos = cumSegDist[i] + projOrig.t * segLengths[i];
      }

      const projDest = projectPointToSegment(destino.lat, destino.lng, aLat, aLon, bLat, bLon);
      if (projDest.distance < bestDestDist) {
        bestDestDist = projDest.distance;
        bestDestPos = cumSegDist[i] + projDest.t * segLengths[i];
      }
    }

    if (bestOrigDist <= r && bestDestDist <= r && bestOrigPos < bestDestPos) {
      recomendadas.push({
        ...trayecto,
        dOrigen: Math.round(bestOrigDist),
        dDestino: Math.round(bestDestDist),
        dTotalCaminata: Math.round(bestOrigDist + bestDestDist),
        distanciaRecorrido: Math.round(bestDestPos - bestOrigPos)
      });
    }
  }

  recomendadas.sort((a, b) => a.dTotalCaminata - b.dTotalCaminata);
  return recomendadas;
}

/**
 * ==========================================================================
 * ESTRATEGIAS DE RECOMENDACIÓN CON TRANSBORDO (1 TRANSBORDO ENTRE 2 LÍNEAS)
 * ==========================================================================
 * Se calculan cuando no existe una línea directa que conecte origen y destino
 * en el sentido solicitado, o como alternativa de viaje multimodal.
 *
 * Basado en los principios de ruteo por rondas (RAPTOR, Delling et al., 2014)
 * y minimización de caminata de enlace (Vuchic, 2005).
 */

/**
 * Estrategia 1 con Transbordo: Proximidad métrica nodal
 * 1. Filtra líneas T1 que abordan en Origen (dOrig <= r).
 * 2. Filtra líneas T2 que descienden en Destino (dDest <= r).
 * 3. Para cada par (T1, T2) con T1 != T2, busca nodos de enlace donde:
 *    posBajada(T1) > posSubida(T1) && posSubida(T2) < posBajada(T2)
 *    y la distancia a pie entre el transbordo d(T1, T2) <= maxTransferWalk.
 * 4. Ordena por menor distancia de caminata total (dOrig + dTransbordo + dDest).
 */
function estrategia1Transbordo(origen, destino, trayectorias, r, maxTransferWalk = 500) {
  // Precalcular distancias acumuladas
  const tInfo = trayectorias.map(t => {
    const coords = t.coords;
    const cumDist = new Float64Array(coords.length);
    cumDist[0] = 0;
    for (let i = 1; i < coords.length; i++) {
      cumDist[i] = cumDist[i - 1] + haversineDistance(coords[i - 1][1], coords[i - 1][0], coords[i][1], coords[i][0]);
    }
    return { trayecto: t, coords, cumDist };
  });

  // Candidatos para Etapa 1 (acceso desde Origen)
  const candEtapa1 = [];
  for (const item of tInfo) {
    let bestOrigDist = Infinity;
    let bestOrigIdx = -1;
    for (let i = 0; i < item.coords.length; i++) {
      const [lon, lat] = item.coords[i];
      const d = haversineDistance(origen.lat, origen.lng, lat, lon);
      if (d < bestOrigDist) {
        bestOrigDist = d;
        bestOrigIdx = i;
      }
    }
    if (bestOrigDist <= r && bestOrigIdx < item.coords.length - 1) {
      candEtapa1.push({
        ...item,
        origDist: bestOrigDist,
        origIdx: bestOrigIdx,
        origPos: item.cumDist[bestOrigIdx]
      });
    }
  }

  // Candidatos para Etapa 2 (llegada a Destino)
  const candEtapa2 = [];
  for (const item of tInfo) {
    let bestDestDist = Infinity;
    let bestDestIdx = -1;
    for (let i = 0; i < item.coords.length; i++) {
      const [lon, lat] = item.coords[i];
      const d = haversineDistance(destino.lat, destino.lng, lat, lon);
      if (d < bestDestDist) {
        bestDestDist = d;
        bestDestIdx = i;
      }
    }
    if (bestDestDist <= r && bestDestIdx > 0) {
      candEtapa2.push({
        ...item,
        destDist: bestDestDist,
        destIdx: bestDestIdx,
        destPos: item.cumDist[bestDestIdx]
      });
    }
  }

  const combinaciones = [];

  for (const c1 of candEtapa1) {
    for (const c2 of candEtapa2) {
      // No transferir a la misma línea
      if (c1.trayecto.lineaId === c2.trayecto.lineaId) continue;

      let bestTransfDist = Infinity;
      let bestT1Idx = -1;
      let bestT2Idx = -1;

      // Buscar nodos de transbordo en orden cronológico del sentido vial
      for (let i = c1.origIdx + 1; i < c1.coords.length; i++) {
        const [lon1, lat1] = c1.coords[i];
        for (let j = 0; j < c2.destIdx; j++) {
          const [lon2, lat2] = c2.coords[j];
          const d = haversineDistance(lat1, lon1, lat2, lon2);
          if (d < bestTransfDist) {
            bestTransfDist = d;
            bestT1Idx = i;
            bestT2Idx = j;
          }
        }
      }

      if (bestTransfDist <= maxTransferWalk && bestT1Idx !== -1 && bestT2Idx !== -1) {
        const distRecorrido1 = c1.cumDist[bestT1Idx] - c1.origPos;
        const distRecorrido2 = c2.destPos - c2.cumDist[bestT2Idx];

        combinaciones.push({
          tipo: 'transbordo',
          trayecto1: c1.trayecto,
          trayecto2: c2.trayecto,
          etiqueta: `${c1.trayecto.nombre} (${c1.trayecto.sentido}) ➔ ${c2.trayecto.nombre} (${c2.trayecto.sentido})`,
          puntoSubida1: { lat: c1.coords[c1.origIdx][1], lon: c1.coords[c1.origIdx][0] },
          puntoBajada1: { lat: c1.coords[bestT1Idx][1], lon: c1.coords[bestT1Idx][0] },
          puntoSubida2: { lat: c2.coords[bestT2Idx][1], lon: c2.coords[bestT2Idx][0] },
          puntoBajada2: { lat: c2.coords[c2.destIdx][1], lon: c2.coords[c2.destIdx][0] },
          dOrigen: Math.round(c1.origDist),
          dTransbordo: Math.round(bestTransfDist),
          dDestino: Math.round(c2.destDist),
          dTotalCaminata: Math.round(c1.origDist + bestTransfDist + c2.destDist),
          distanciaRecorridoT1: Math.round(distRecorrido1),
          distanciaRecorridoT2: Math.round(distRecorrido2),
          distanciaRecorridoTotal: Math.round(distRecorrido1 + distRecorrido2)
        });
      }
    }
  }

  combinaciones.sort((a, b) => a.dTotalCaminata - b.dTotalCaminata);

  // Descartar duplicados redundantes de las mismas dos líneas quedándose con la óptima
  const unicos = [];
  const vistas = new Set();
  for (const comb of combinaciones) {
    const key = `${comb.trayecto1.lineaId}_${comb.trayecto1.sentido}__${comb.trayecto2.lineaId}_${comb.trayecto2.sentido}`;
    if (!vistas.has(key)) {
      vistas.add(key);
      unicos.push(comb);
    }
  }

  return unicos;
}

/**
 * Estrategia 2 con Transbordo: Proyección perpendicular continua
 * Calcula el transbordo proyectando el punto de enlace de manera continua a lo largo
 * de los segmentos de calle de ambas trayectorias.
 */
function estrategia2Transbordo(origen, destino, trayectorias, r, maxTransferWalk = 500) {
  // Precalcular longitudes acumuladas por segmento para cada trayectoria
  const tInfo = trayectorias.map(t => {
    const coords = t.coords;
    const segCount = coords.length - 1;
    const cumSegDist = new Float64Array(segCount + 1);
    const segLengths = new Float64Array(segCount);
    cumSegDist[0] = 0;
    for (let i = 0; i < segCount; i++) {
      const len = haversineDistance(coords[i][1], coords[i][0], coords[i + 1][1], coords[i + 1][0]);
      segLengths[i] = len;
      cumSegDist[i + 1] = cumSegDist[i] + len;
    }
    return { trayecto: t, coords, segCount, cumSegDist, segLengths };
  });

  // Candidatos Etapa 1 proyectados
  const candEtapa1 = [];
  for (const item of tInfo) {
    let bestOrigDist = Infinity;
    let bestOrigPos = 0;
    let bestOrigSegIdx = -1;

    for (let i = 0; i < item.segCount; i++) {
      const [aLon, aLat] = item.coords[i];
      const [bLon, bLat] = item.coords[i + 1];
      const proj = projectPointToSegment(origen.lat, origen.lng, aLat, aLon, bLat, bLon);
      if (proj.distance < bestOrigDist) {
        bestOrigDist = proj.distance;
        bestOrigPos = item.cumSegDist[i] + proj.t * item.segLengths[i];
        bestOrigSegIdx = i;
      }
    }

    if (bestOrigDist <= r) {
      candEtapa1.push({
        ...item,
        origDist: bestOrigDist,
        origPos: bestOrigPos,
        origSegIdx: bestOrigSegIdx
      });
    }
  }

  // Candidatos Etapa 2 proyectados
  const candEtapa2 = [];
  for (const item of tInfo) {
    let bestDestDist = Infinity;
    let bestDestPos = 0;
    let bestDestSegIdx = -1;

    for (let i = 0; i < item.segCount; i++) {
      const [aLon, aLat] = item.coords[i];
      const [bLon, bLat] = item.coords[i + 1];
      const proj = projectPointToSegment(destino.lat, destino.lng, aLat, aLon, bLat, bLon);
      if (proj.distance < bestDestDist) {
        bestDestDist = proj.distance;
        bestDestPos = item.cumSegDist[i] + proj.t * item.segLengths[i];
        bestDestSegIdx = i;
      }
    }

    if (bestDestDist <= r) {
      candEtapa2.push({
        ...item,
        destDist: bestDestDist,
        destPos: bestDestPos,
        destSegIdx: bestDestSegIdx
      });
    }
  }

  const combinaciones = [];

  for (const c1 of candEtapa1) {
    for (const c2 of candEtapa2) {
      if (c1.trayecto.lineaId === c2.trayecto.lineaId) continue;

      let bestTransfDist = Infinity;
      let bestT1Pos = 0;
      let bestT2Pos = 0;
      let bestPt1 = null;
      let bestPt2 = null;

      // Buscar aproximación mínima entre los segmentos posteriores al origen en T1
      // y los segmentos previos al destino en T2
      for (let i = c1.origSegIdx; i < c1.segCount; i++) {
        const [aLon, aLat] = c1.coords[i + 1]; // Vértices a lo largo del recorrido
        const pos1 = c1.cumSegDist[i + 1];
        if (pos1 <= c1.origPos) continue;

        for (let j = 0; j <= c2.destSegIdx; j++) {
          const [bLon1, bLat1] = c2.coords[j];
          const [bLon2, bLat2] = c2.coords[j + 1];

          // Proyectar vértice de T1 sobre segmento j de T2
          const proj = projectPointToSegment(aLat, aLon, bLat1, bLon1, bLat2, bLon2);
          const pos2 = c2.cumSegDist[j] + proj.t * c2.segLengths[j];

          if (pos2 < c2.destPos && proj.distance < bestTransfDist) {
            bestTransfDist = proj.distance;
            bestT1Pos = pos1;
            bestT2Pos = pos2;
            bestPt1 = { lat: aLat, lon: aLon };
            // Punto proyectado en segmento de T2
            bestPt2 = {
              lat: bLat1 + proj.t * (bLat2 - bLat1),
              lon: bLon1 + proj.t * (bLon2 - bLon1)
            };
          }
        }
      }

      if (bestTransfDist <= maxTransferWalk && bestPt1 && bestPt2) {
        const distRecorrido1 = bestT1Pos - c1.origPos;
        const distRecorrido2 = c2.destPos - bestT2Pos;

        combinaciones.push({
          tipo: 'transbordo',
          trayecto1: c1.trayecto,
          trayecto2: c2.trayecto,
          etiqueta: `${c1.trayecto.nombre} (${c1.trayecto.sentido}) ➔ ${c2.trayecto.nombre} (${c2.trayecto.sentido})`,
          puntoSubida1: { lat: origen.lat, lon: origen.lng },
          puntoBajada1: bestPt1,
          puntoSubida2: bestPt2,
          puntoBajada2: { lat: destino.lat, lon: destino.lng },
          dOrigen: Math.round(c1.origDist),
          dTransbordo: Math.round(bestTransfDist),
          dDestino: Math.round(c2.destDist),
          dTotalCaminata: Math.round(c1.origDist + bestTransfDist + c2.destDist),
          distanciaRecorridoT1: Math.round(distRecorrido1),
          distanciaRecorridoT2: Math.round(distRecorrido2),
          distanciaRecorridoTotal: Math.round(distRecorrido1 + distRecorrido2)
        });
      }
    }
  }

  combinaciones.sort((a, b) => a.dTotalCaminata - b.dTotalCaminata);

  const unicos = [];
  const vistas = new Set();
  for (const comb of combinaciones) {
    const key = `${comb.trayecto1.lineaId}_${comb.trayecto1.sentido}__${comb.trayecto2.lineaId}_${comb.trayecto2.sentido}`;
    if (!vistas.has(key)) {
      vistas.add(key);
      unicos.push(comb);
    }
  }

  return unicos;
}

/**
 * Parser de texto con coordenadas en formato natural [latitud, longitud].
 * Convierte internamente a [longitud, latitud] (formato estándar GeoJSON RFC 7946).
 */
function parseCoordinateText(rawText) {
  const lines = rawText.split('\n');
  const validPoints = [];
  let invalidCount = 0;

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    // Limpiar corchetes, paréntesis y caracteres residuales
    line = line.replace(/[\[\]\(\)]/g, '').trim();

    const matches = line.match(/[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?/g);
    if (matches && matches.length >= 2) {
      const lat = parseFloat(matches[0]);
      const lon = parseFloat(matches[1]);

      if (!isNaN(lat) && !isNaN(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
        // Entrada: latitud, longitud -> Almacenamiento GeoJSON: [longitud, latitud]
        validPoints.push({
          lat: lat,
          lon: lon,
          geojson: [lon, lat]
        });
      } else {
        invalidCount++;
      }
    } else {
      invalidCount++;
    }
  }

  return { validPoints, invalidCount };
}

/**
 * Genera el string formateado del archivo rutas.js
 */
function serializeDatasetToJS(dataset) {
  const json = JSON.stringify(dataset, null, 2);
  return `/**
 * DATASET DE LÍNEAS DE TAXIS COLECTIVOS — PUNTA ARENAS
 * ======================================================
 * Trazados ajustados a la red vial y ejes de calles reales de Punta Arenas.
 * Formato de coordenadas: GeoJSON estándar [longitud, latitud].
 * Actualizado el: ${new Date().toLocaleString()}
 * Total de líneas: ${dataset.length}
 */

const DATASET_COLECTIVOS = ${json};
`;
}

/**
 * Genera la representación estándar GeoJSON FeatureCollection (RFC 7946)
 */
function serializeDatasetToGeoJSON(dataset) {
  const features = [];
  dataset.forEach(linea => {
    if (linea.ida && linea.ida.length > 0) {
      features.push({
        type: "Feature",
        properties: {
          linea_id: linea.id,
          nombre: linea.nombre,
          sentido: "ida",
          color: linea.color,
          descripcion: `${linea.descripcion || linea.nombre} (Sentido Ida)`
        },
        geometry: {
          type: "LineString",
          coordinates: linea.ida
        }
      });
    }

    if (linea.vuelta && linea.vuelta.length > 0) {
      features.push({
        type: "Feature",
        properties: {
          linea_id: linea.id,
          nombre: linea.nombre,
          sentido: "vuelta",
          color: linea.color,
          descripcion: `${linea.descripcion || linea.nombre} (Sentido Vuelta)`
        },
        geometry: {
          type: "LineString",
          coordinates: linea.vuelta
        }
      });
    }
  });

  const geojson = {
    type: "FeatureCollection",
    name: "Lineas_Taxis_Colectivos_Punta_Arenas",
    crs: {
      type: "name",
      properties: {
        name: "urn:ogc:def:crs:OGC:1.3:CRS84"
      }
    },
    features: features
  };

  return JSON.stringify(geojson, null, 2);
}

/**
 * Descarga de archivo mediante Blob de respaldo para navegadores sin File System Access
 */
function downloadBlob(content, fileName, contentType) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 200);
}

/**
 * CATÁLOGO EXTENDIDO DE HITOS Y PUNTOS DE INTERÉS (POIs) DE PUNTA ARENAS
 * ======================================================================
 * Base de datos geoespacial curada para TeS-SDRTC.
 * Permite autocompletado instantáneo (0 ms), 100% Offline, sin dependencias
 * de servidores externos ni errores de numeración domiciliaria.
 */
const HITOS_PUNTA_ARENAS = [
  // ==========================================
  // 1. COLEGIOS Y LICEOS (EDUCACIÓN BÁSICA Y MEDIA)
  // ==========================================
  { id: 'poi-col-sanjose', nombre: 'Liceo San José', alias: 'san jose colegio fagnano salesianos centro basica media', detalle: 'Colegio Salesiano • Monseñor Fagnano 550', lat: -53.1620, lon: -70.9100, icono: '🏫', categoria: 'Colegio' },
  { id: 'poi-col-donbosco', nombre: 'Instituto Don Bosco (IDB)', alias: 'don bosco colegio maipu salesianos idb industrial tecnico', detalle: 'Colegio Técnico Salesiano • Calle Maipú 615', lat: -53.1575, lon: -70.9080, icono: '🏫', categoria: 'Colegio' },
  { id: 'poi-col-sarabraun', nombre: 'Liceo Sara Braun', alias: 'sara braun liceo de ninas colon plaza centro municipal', detalle: 'Liceo Municipal • Av. Colón 1027', lat: -53.1630, lon: -70.9070, icono: '🏫', categoria: 'Colegio' },
  { id: 'poi-col-luisbarrera', nombre: 'Liceo Luis Alberto Barrera', alias: 'luis alberto barrera liceo de hombres colon bories', detalle: 'Liceo Tradicional • Av. Colón 1250', lat: -53.1618, lon: -70.9125, icono: '🏫', categoria: 'Colegio' },
  { id: 'poi-col-mariabehety', nombre: 'Liceo Polivalente María Behety', alias: 'maria behety politecnico arturo prat liceo tecnico', detalle: 'Liceo Polivalente • Arturo Prat 1875', lat: -53.1685, lon: -70.9195, icono: '🏫', categoria: 'Colegio' },
  { id: 'poi-col-industrial', nombre: 'Liceo Industrial Armando Sanhueza', alias: 'liceo industrial 21 de mayo sanhueza libardi tecnico', detalle: 'Liceo Industrial • Calle 21 de Mayo 2074', lat: -53.1755, lon: -70.9170, icono: '🏫', categoria: 'Colegio' },
  { id: 'poi-col-mariaaux', nombre: 'Colegio María Auxiliadora', alias: 'maria auxiliadora sarmiento salesianas monjas bories', detalle: 'Colegio Particular Subvencionado • Sarmiento 298', lat: -53.1590, lon: -70.9085, icono: '🏫', categoria: 'Colegio' },
  { id: 'poi-col-insafa', nombre: 'Instituto Sagrada Familia (INSAFA)', alias: 'insafa sagrada familia mejicana monjas colegio', detalle: 'Colegio Técnico Femenino • Mejicana 840', lat: -53.1600, lon: -70.9115, icono: '🏫', categoria: 'Colegio' },
  { id: 'poi-col-leumag', nombre: 'Liceo Experimental UMAG (LEUMAG)', alias: 'leumag liceo experimental umag angamos bulnes', detalle: 'Liceo Universitario • Angamos 17', lat: -53.1510, lon: -70.8980, icono: '🏫', categoria: 'Colegio' },
  { id: 'poi-col-cruzdelsur', nombre: 'Colegio Cruz del Sur', alias: 'cruz del sur chiloe colegio particular', detalle: 'Colegio Particular • Chiloé 450', lat: -53.1585, lon: -70.9095, icono: '🏫', categoria: 'Colegio' },
  { id: 'poi-col-nobelius', nombre: 'Colegio Nobelius', alias: 'nobelius colegio manuel aguilar barrio prat', detalle: 'Colegio Particular • Manuel Aguilar 0230', lat: -53.1490, lon: -70.9150, icono: '🏫', categoria: 'Colegio' },
  { id: 'poi-col-british', nombre: 'The British School', alias: 'british school colegio britanico waldo seguel ingles', detalle: 'Colegio Británico • Waldo Seguel 454', lat: -53.1635, lon: -70.9130, icono: '🏫', categoria: 'Colegio' },
  { id: 'poi-col-aleman', nombre: 'Colegio Alemán de Punta Arenas', alias: 'colegio aleman manantiales german school el bosque', detalle: 'Colegio Alemán • Av. El Bosque 0489', lat: -53.1310, lon: -70.9030, icono: '🏫', categoria: 'Colegio' },
  { id: 'poi-col-charlesdarwin', nombre: 'Colegio Charles Darwin', alias: 'charles darwin darwin manantiales colegio', detalle: 'Colegio Particular • Manantiales 0314', lat: -53.1320, lon: -70.9015, icono: '🏫', categoria: 'Colegio' },
  { id: 'poi-col-pierrefaure', nombre: 'Colegio Pierre Faure', alias: 'pierre faure balmaceda colegio', detalle: 'Colegio Particular • Balmaceda 659', lat: -53.1650, lon: -70.9080, icono: '🏫', categoria: 'Colegio' },
  { id: 'poi-col-cervantes', nombre: 'Colegio Miguel de Cervantes', alias: 'cervantes miguel de cervantes sarmiento colegio', detalle: 'Colegio • Sarmiento 1055', lat: -53.1565, lon: -70.9175, icono: '🏫', categoria: 'Colegio' },
  { id: 'poi-col-puntaarenas', nombre: 'Colegio Punta Arenas', alias: 'colegio punta arenas espana colegio particular', detalle: 'Colegio • Av. España 0850', lat: -53.1515, lon: -70.9050, icono: '🏫', categoria: 'Colegio' },
  { id: 'poi-col-silvahenriquez', nombre: 'Liceo Politécnico Cardenal Silva Henríquez', alias: 'cardenal silva henriquez politecnico karukinka playa norte', detalle: 'Liceo Politécnico • Karukinka 140', lat: -53.1430, lon: -70.9040, icono: '🏫', categoria: 'Colegio' },
  { id: 'poi-col-esc-portugal', nombre: 'Escuela Portugal', alias: 'escuela portugal mejicana basica escuela d-25', detalle: 'Escuela Básica • Mejicana 527', lat: -53.1595, lon: -70.9090, icono: '🏫', categoria: 'Colegio' },
  { id: 'poi-col-esc-espana', nombre: 'Escuela España', alias: 'escuela espana av espana basica municipal', detalle: 'Escuela Básica • Av. España 0225', lat: -53.1450, lon: -70.9010, icono: '🏫', categoria: 'Colegio' },
  { id: 'poi-col-esc-croacia', nombre: 'Escuela Croacia', alias: 'escuela croacia calle croacia basica d-23', detalle: 'Escuela Básica • Croacia 1135', lat: -53.1580, lon: -70.9150, icono: '🏫', categoria: 'Colegio' },
  { id: 'poi-col-esc-ohiggins', nombre: 'Escuela Bernardo O\'Higgins', alias: 'escuela ohiggins bernardo ohiggins chiloe basica', detalle: 'Escuela Básica • Chiloé 1443', lat: -53.1670, lon: -70.9140, icono: '🏫', categoria: 'Colegio' },
  { id: 'poi-col-esc-18sept', nombre: 'Escuela 18 de Septiembre', alias: 'escuela 18 de septiembre mateo toro y zambrano basica', detalle: 'Escuela Básica • Mateo de Toro y Zambrano 250', lat: -53.1710, lon: -70.9320, icono: '🏫', categoria: 'Colegio' },
  { id: 'poi-col-esc-hurtado', nombre: 'Escuela Padre Alberto Hurtado', alias: 'escuela padre alberto hurtado pedro borquez sur', detalle: 'Escuela Básica • Pedro Bórquez 0580', lat: -53.1680, lon: -70.9250, icono: '🏫', categoria: 'Colegio' },
  { id: 'poi-col-esc-milagrosa', nombre: 'Escuela La Milagrosa', alias: 'escuela la milagrosa frei sur vicentinas catolica', detalle: 'Escuela • Av. Presidente Frei 0399', lat: -53.1480, lon: -70.9260, icono: '🏫', categoria: 'Colegio' },
  { id: 'poi-col-esc-nieves', nombre: 'Escuela Villa Las Nieves', alias: 'escuela villa las nieves los generales norte', detalle: 'Escuela Básica • Av. Los Generales 0530', lat: -53.1250, lon: -70.8870, icono: '🏫', categoria: 'Colegio' },
  { id: 'poi-col-esc-argentina', nombre: 'Escuela República Argentina', alias: 'escuela republica argentina manuel aguilar prat', detalle: 'Escuela Básica • Manuel Aguilar 01028', lat: -53.1455, lon: -70.9230, icono: '🏫', categoria: 'Colegio' },
  { id: 'poi-col-esc-magallanes', nombre: 'Escuela Hernando de Magallanes', alias: 'escuela hernando de magallanes jose gonzales sur', detalle: 'Escuela Básica • José Gonzáles 0450', lat: -53.1750, lon: -70.9350, icono: '🏫', categoria: 'Colegio' },
  { id: 'poi-col-esc-lemaitre', nombre: 'Escuela Pedro Pablo Lemaitre', alias: 'escuela lemaitre pedro pablo lemaitre el ovejero', detalle: 'Escuela Básica • El Ovejero 0220', lat: -53.1350, lon: -70.9110, icono: '🏫', categoria: 'Colegio' },
  { id: 'poi-col-esc-rioseco', nombre: 'Escuela Elba Ojeda Gómez (Río Seco)', alias: 'escuela rio seco elba ojeda gomez norte rural', detalle: 'Escuela Básica • Ruta 9 Norte km 13.5', lat: -53.0610, lon: -70.8520, icono: '🏫', categoria: 'Colegio' },

  // ==========================================
  // 2. EDUCACIÓN SUPERIOR E INSTITUTOS
  // ==========================================
  { id: 'poi-umag', nombre: 'Universidad de Magallanes (UMAG)', alias: 'umag u magallanes campus central rectoria bulnes universidad', detalle: 'Campus Central Universitario • Av. Manuel Bulnes 01855', lat: -53.1325, lon: -70.8797, icono: '🎓', categoria: 'Educación Superior' },
  { id: 'poi-umag-cadi', nombre: 'CADI-UMAG (Centro Asistencial Docente)', alias: 'cadi umag cadi-umag centro de investigacion frei hospital salud', detalle: 'Centro Médico Docente UMAG • Av. Frei 01364', lat: -53.1215, lon: -70.8955, icono: '🎓', categoria: 'Educación Superior' },
  { id: 'poi-inacap', nombre: 'INACAP Punta Arenas', alias: 'inacap cft inacap universidad tecnologica bulnes norte', detalle: 'Instituto Profesional • Av. Manuel Bulnes km 4 Norte', lat: -53.1305, lon: -70.8755, icono: '🎓', categoria: 'Educación Superior' },
  { id: 'poi-santotomas', nombre: 'Instituto Santo Tomás', alias: 'santo tomas ust ip santo tomas cft mejicana bories', detalle: 'Educación Superior • Calle Mejicana 665', lat: -53.1580, lon: -70.9065, icono: '🎓', categoria: 'Educación Superior' },

  // ==========================================
  // 3. SALUD (HOSPITALES, CLÍNICAS, CESFAM Y URGENCIAS)
  // ==========================================
  { id: 'poi-hospital', nombre: 'Hospital Clínico de Magallanes', alias: 'hospital regional lautaro navarro hospital frei urgencias clinico', detalle: 'Hospital Regional • Av. Pdte. Eduardo Frei Montalva 01364', lat: -53.1221, lon: -70.8963, icono: '🏥', categoria: 'Salud' },
  { id: 'poi-redsalud', nombre: 'Clínica RedSalud Magallanes', alias: 'clinica redsalud clinica magallanes salvador allende frei', detalle: 'Clínica Privada • Av. Salvador Allende con Av. Frei', lat: -53.1410, lon: -70.8990, icono: '🏥', categoria: 'Salud' },
  { id: 'poi-hospital-naval', nombre: 'Hospital de las Fuerzas Armadas (Hospital Naval)', alias: 'hospital naval fuerzas armadas armada bulnes', detalle: 'Hospital Naval • Av. Manuel Bulnes 0200', lat: -53.1450, lon: -70.8940, icono: '🏥', categoria: 'Salud' },
  { id: 'poi-cesfam-damianovic', nombre: 'CESFAM Dr. Juan Damianovic', alias: 'consultorio sur damianovic cesfam sur salud sur rengifo zenteno', detalle: 'Salud Primaria Sur • Zenteno 2850 (Barrio Sur)', lat: -53.1788, lon: -70.9295, icono: '🩺', categoria: 'Salud' },
  { id: 'poi-cesfam-bencur', nombre: 'CESFAM Dr. Mateo Bencur', alias: 'consultorio 18 cesfam bencur mateo bencur cesfam 18 dieciocho', detalle: 'Salud Primaria • Capitán Guillermo con José Perich', lat: -53.1652, lon: -70.9320, icono: '🩺', categoria: 'Salud' },
  { id: 'poi-sar-bencur', nombre: 'SAR Dr. Mateo Bencur (Urgencias 18)', alias: 'sar bencur urgencia 18 urgencias bencur noche', detalle: 'Servicio de Alta Resolutividad • Cap. Guillermo con Perich', lat: -53.1650, lon: -70.9325, icono: '🚑', categoria: 'Salud' },
  { id: 'poi-cesfam-fenton', nombre: 'CESFAM Thomas Fenton', alias: 'cesfam fenton consultorio norte fenton suiza playa norte', detalle: 'Salud Primaria • Calle Suiza con Vicente Kusanovic', lat: -53.1415, lon: -70.9015, icono: '🩺', categoria: 'Salud' },
  { id: 'poi-cesfam-ibanez', nombre: 'CESFAM Carlos Ibáñez', alias: 'cesfam ibanez consultorio ibanez santa juana frei', detalle: 'Salud Primaria • Av. Eduardo Frei con Santa Juana', lat: -53.1550, lon: -70.9250, icono: '🩺', categoria: 'Salud' },
  { id: 'poi-cecosf-valencia', nombre: 'CECOSF Fortunato Valencia', alias: 'cecosf 18 fortunato valencia ramon freire', detalle: 'Salud Comunitaria • Ramón Freire 01275 (B° 18)', lat: -53.1730, lon: -70.9390, icono: '🩺', categoria: 'Salud' },
  { id: 'poi-cecosf-rioseco', nombre: 'CECOSF Río Seco', alias: 'cecosf rio seco posta rural norte', detalle: 'Posta de Salud • Ruta 9 Norte km 13.5', lat: -53.0600, lon: -70.8500, icono: '🩺', categoria: 'Salud' },

  // ==========================================
  // 4. COMERCIO, SUPERMERCADOS Y MALLS
  // ==========================================
  { id: 'poi-zofra', nombre: 'Zona Franca (ZonAustral)', alias: 'zonAustral zonaustral zofra mall zona franca modulos recinto franco', detalle: 'Recinto Franco Comercial • Av. Manuel Bulnes', lat: -53.1351, lon: -70.8704, icono: '🛍️', categoria: 'Comercio' },
  { id: 'poi-mall', nombre: 'Mall Espacio Urbano Pionero', alias: 'mall pionero lider frei falabella ripley espacio urbano zenteno cine', detalle: 'Centro Comercial • Av. Eduardo Frei Montalva con Zenteno', lat: -53.1362, lon: -70.8878, icono: '🛍️', categoria: 'Comercio' },
  { id: 'poi-mercado', nombre: 'Mercado Municipal', alias: 'mercado municipal 21 de mayo cocinerias pescaderia puerto', detalle: 'Mercado y Gastronomía • Calle 21 de Mayo 1480', lat: -53.1672, lon: -70.9085, icono: '🐟', categoria: 'Comercio' },
  { id: 'poi-unimarc-bories', nombre: 'Supermercado Unimarc (Bories)', alias: 'unimarc centro bories supermercado compras', detalle: 'Supermercado • Bories 637', lat: -53.1605, lon: -70.9055, icono: '🛒', categoria: 'Comercio' },
  { id: 'poi-unimarc-sur', nombre: 'Supermercado Unimarc (Sur)', alias: 'unimarc sur martinez de aldunate barrio sur', detalle: 'Supermercado • Av. Martínez de Aldunate 1499', lat: -53.1720, lon: -70.9280, icono: '🛒', categoria: 'Comercio' },
  { id: 'poi-unimarc-espana', nombre: 'Supermercado Unimarc (España)', alias: 'unimarc espana manantiales norte', detalle: 'Supermercado • Av. España con Manantiales', lat: -53.1330, lon: -70.8950, icono: '🛒', categoria: 'Comercio' },
  { id: 'poi-lider-frei', nombre: 'Supermercado Líder (Av. Frei)', alias: 'lider frei hiper lider supermercado mall', detalle: 'Supermercado • Av. Eduardo Frei Montalva 01110', lat: -53.1370, lon: -70.8885, icono: '🛒', categoria: 'Comercio' },
  { id: 'poi-sodimac', nombre: 'Sodimac Homecenter / Constructor', alias: 'sodimac homecenter constructor frei manantiales ferreteria', detalle: 'Ferretería y Hogar • Av. Eduardo Frei con Manantiales', lat: -53.1350, lon: -70.8890, icono: '🔨', categoria: 'Comercio' },

  // ==========================================
  // 5. CÍVICOS, TRÁMITES Y SERVICIOS PÚBLICOS
  // ==========================================
  { id: 'poi-plaza-armas', nombre: 'Plaza Muñoz Gamero (Plaza de Armas)', alias: 'plaza de armas plaza centro centro civico hernando de magallanes indio pata kessel', detalle: 'Plaza de Armas • Centro Cívico e Histórico', lat: -53.1627, lon: -70.9080, icono: '🏛️', categoria: 'Cívico' },
  { id: 'poi-muni-alcaldia', nombre: 'Municipalidad de Punta Arenas (Alcaldía)', alias: 'municipalidad alcaldia plaza munigobernacion centro', detalle: 'Edificio Consistorial • Plaza Muñoz Gamero 770', lat: -53.1630, lon: -70.9075, icono: '🏛️', categoria: 'Cívico' },
  { id: 'poi-muni-transito', nombre: 'Dirección de Tránsito Municipal', alias: 'transito licencia de conducir 21 de mayo permisos municipalidad', detalle: 'Tránsito y Licencias • Av. 21 de Mayo 1133', lat: -53.1660, lon: -70.9090, icono: '🚗', categoria: 'Cívico' },
  { id: 'poi-gore', nombre: 'Gobierno Regional de Magallanes (GORE)', alias: 'gore gobierno regional intendencia plaza munoz gamero', detalle: 'Edificio del GORE • Plaza Muñoz Gamero 1028', lat: -53.1625, lon: -70.9085, icono: '🏛️', categoria: 'Cívico' },
  { id: 'poi-registro-civil', nombre: 'Registro Civil e Identificación', alias: 'registro civil carnet pasaporte certificados ignacio carrera pinto', detalle: 'Registro Civil • Ignacio Carrera Pinto 618', lat: -53.1590, lon: -70.9070, icono: '📝', categoria: 'Cívico' },
  { id: 'poi-chileatiende', nombre: 'ChileAtiende / IPS Punta Arenas', alias: 'chileatiende ips pensiones tramites pedro montt', detalle: 'Atención Ciudadana • Pedro Montt 895', lat: -53.1642, lon: -70.9065, icono: '🏛️', categoria: 'Cívico' },
  { id: 'poi-sii', nombre: 'Servicio de Impuestos Internos (SII)', alias: 'sii impuestos internos tributario bories', detalle: 'Oficina SII • Bories 873', lat: -53.1590, lon: -70.9045, icono: '💼', categoria: 'Cívico' },
  { id: 'poi-serviu', nombre: 'SERVIU Magallanes', alias: 'serviu vivienda subsidio croacia minvu', detalle: 'Vivienda y Urbanismo • Calle Croacia 722', lat: -53.1598, lon: -70.9100, icono: '🏠', categoria: 'Cívico' },
  { id: 'poi-fonasa', nombre: 'FONASA (Sucursal Centro)', alias: 'fonasa salud bonos bories seguros', detalle: 'Sucursal Fonasa • Bories 710', lat: -53.1600, lon: -70.9050, icono: '💳', categoria: 'Cívico' },
  { id: 'poi-correos', nombre: 'Correos de Chile (Edificio Central)', alias: 'correos chile cartas encomiendas bories correosdechile', detalle: 'Correo Central • Bories 911', lat: -53.1585, lon: -70.9040, icono: '📦', categoria: 'Cívico' },
  { id: 'poi-tribunales', nombre: 'Tribunales de Justicia / Corte de Apelaciones', alias: 'tribunales corte de apelaciones juzgado nogueira', detalle: 'Poder Judicial • José Nogueira 1430', lat: -53.1650, lon: -70.9110, icono: '⚖️', categoria: 'Cívico' },
  { id: 'poi-carabineros-1ra', nombre: '1ª Comisaría de Carabineros', alias: 'primera comisaria carabineros carrera pinto policial', detalle: 'Comisaría Central • Ignacio Carrera Pinto 0145', lat: -53.1605, lon: -70.9200, icono: '👮', categoria: 'Seguridad' },
  { id: 'poi-pdi', nombre: 'Policía de Investigaciones (PDI)', alias: 'pdi investigaciones cuartel policial errazuriz', detalle: 'Prefectura PDI • Errázuriz 977', lat: -53.1645, lon: -70.9120, icono: '🕵️', categoria: 'Seguridad' },
  { id: 'poi-bomberos-1ra', nombre: '1ª Compañía de Bomberos (Bomba Magallanes)', alias: 'bomberos primera compania bomba magallanes roca', detalle: 'Cuartel de Bomberos • Roca 826', lat: -53.1620, lon: -70.9060, icono: '🚒', categoria: 'Seguridad' },

  // ==========================================
  // 6. DEPORTES, CULTURA Y ESPACIOS PÚBLICOS
  // ==========================================
  { id: 'poi-gimnasio-fiscal', nombre: 'Gimnasio Fiscal / Piscina Fiscal', alias: 'gimnasio fiscal estadio fiscal alberca piscina fiscal enrique abello bulnes deportes', detalle: 'Complejo Deportivo • Enrique Abello con Av. Bulnes', lat: -53.1530, lon: -70.8995, icono: '🏊', categoria: 'Deportes' },
  { id: 'poi-estadio-confederacion', nombre: 'Estadio Ramón Cañas (Confederación)', alias: 'estadio confederacion ramon canas cancha futbol bulnes ovejero', detalle: 'Estadio de Fútbol • Av. Bulnes con El Ovejero', lat: -53.1480, lon: -70.8970, icono: '⚽', categoria: 'Deportes' },
  { id: 'poi-polideportivo-18', nombre: 'Polideportivo 18 de Septiembre', alias: 'polideportivo 18 de septiembre gimnasio 18 dieciocho salvador allende', detalle: 'Gimnasio Polideportivo • Salvador Allende 0291', lat: -53.1695, lon: -70.9388, icono: '🏀', categoria: 'Deportes' },
  { id: 'poi-teatro-municipal', nombre: 'Teatro Municipal José Bohr', alias: 'teatro municipal jose bohr cultura magallanes', detalle: 'Teatro y Cultura • Magallanes 823', lat: -53.1625, lon: -70.9070, icono: '🎭', categoria: 'Cultura' },
  { id: 'poi-museo-braun', nombre: 'Museo Regional Palacio Braun Menéndez', alias: 'palacio braun menendez museo regional historia magallanes', detalle: 'Museo y Monumento Histórico • Magallanes 949', lat: -53.1615, lon: -70.9065, icono: '🏛️', categoria: 'Cultura' },
  { id: 'poi-museo-borgatello', nombre: 'Museo Mayorino Borgatello', alias: 'museo salesiano mayorino borgatello historia natural bulnes', detalle: 'Museo Salesiano • Av. Bulnes 336', lat: -53.1565, lon: -70.9015, icono: '🦖', categoria: 'Cultura' },
  { id: 'poi-cementerio', nombre: 'Cementerio Municipal Sara Braun', alias: 'cementerio municipal sara braun cipreses bulnes mausoleos', detalle: 'Monumento Histórico • Av. Manuel Bulnes 929', lat: -53.1495, lon: -70.8988, icono: '🌲', categoria: 'Turismo' },
  { id: 'poi-parque-maria-behety', nombre: 'Parque María Behety', alias: 'parque maria behety parque sur dinosaurios 21 de mayo laguna juegos', detalle: 'Parque Urbano • Costanera Sur / 21 de Mayo', lat: -53.1843, lon: -70.9255, icono: '🌳', categoria: 'Recreación' },
  { id: 'poi-mirador-cruz', nombre: 'Mirador Cerro de la Cruz', alias: 'cerro de la cruz senoret mirador cruz vista panoramica fagnano', detalle: 'Mirador Turístico • Calle Señoret con Fagnano', lat: -53.1610, lon: -70.9168, icono: '🌄', categoria: 'Turismo' },
  { id: 'poi-muelle-prat', nombre: 'Muelle Arturo Prat / Costanera', alias: 'muelle prat puerto costanera del estrecho embarcadero estrecho pedro montt', detalle: 'Costanera del Estrecho • Pedro Montt s/n', lat: -53.1648, lon: -70.9030, icono: '🚢', categoria: 'Turismo' },

  // ==========================================
  // 7. TERMINALES DE BUSES Y CONEXIÓN
  // ==========================================
  { id: 'poi-terminal-bussur', nombre: 'Terminal de Buses Bus-Sur', alias: 'bus sur bussur buses colon terminal bus-sur buses a natales torres del paine', detalle: 'Terminal de Buses • Av. Cristóbal Colón 842', lat: -53.1606, lon: -70.9077, icono: '🚌', categoria: 'Transporte' },
  { id: 'poi-terminal-fernandez', nombre: 'Terminal Buses Fernández', alias: 'buses fernandez armando sanhueza terminal rodoviario natales', detalle: 'Terminal Interurbano • Armando Sanhueza 745', lat: -53.1600, lon: -70.9060, icono: '🚌', categoria: 'Transporte' },
  { id: 'poi-terminal-queilen', nombre: 'Terminal Buses Queilen Bus', alias: 'queilen bus terminal lautaro navarro buses', detalle: 'Terminal de Buses • Lautaro Navarro 975', lat: -53.1625, lon: -70.9050, icono: '🚌', categoria: 'Transporte' },
  { id: 'poi-tres-puentes-ferry', nombre: 'Terminal Tres Puentes (Ferry Porvenir)', alias: 'tres puentes ferry barcaza porvenir tabsa tierra del fuego', detalle: 'Terminal Marítimo TABSA • Av. Pdte. Ibáñez km 5 Norte', lat: -53.1110, lon: -70.8650, icono: '⛴️', categoria: 'Transporte' },

  // ==========================================
  // 8. BARRIOS Y POBLACIONES EMBLEMÁTICAS
  // ==========================================
  { id: 'poi-barrio-18', nombre: 'Barrio 18 de Septiembre', alias: 'barrio 18 la 18 dieciocho sector alto plaza 18', detalle: 'Sector Habitacional Alto • Plaza 18 de Septiembre', lat: -53.1700, lon: -70.9350, icono: '🏘️', categoria: 'Barrio' },
  { id: 'poi-barrio-prat', nombre: 'Barrio Prat', alias: 'barrio prat plaza condell general del canto zenteno manuel aguilar', detalle: 'Sector Tradicional • Plaza Condell / General del Canto', lat: -53.1510, lon: -70.9180, icono: '🏘️', categoria: 'Barrio' },
  { id: 'poi-barrio-chiloe', nombre: 'Barrio Archipiélago de Chiloé', alias: 'archipielago de chiloe santa juana sur barrio sur alto ancud castro', detalle: 'Sector Habitacional Sur • Santa Juana con Ancud', lat: -53.1820, lon: -70.9380, icono: '🏘️', categoria: 'Barrio' },
  { id: 'poi-playa-norte', nombre: 'Playa Norte', alias: 'playa norte jorge montt costanera norte karukinka bilbao', detalle: 'Sector Costero Norte • Av. Jorge Montt', lat: -53.1420, lon: -70.8950, icono: '🏘️', categoria: 'Barrio' },
  { id: 'poi-barrio-croata', nombre: 'Barrio Croata', alias: 'barrio croata calle croacia sanhueza caucenes centro', detalle: 'Sector Típico • Croacia con Armando Sanhueza', lat: -53.1590, lon: -70.9100, icono: '🏘️', categoria: 'Barrio' },
  { id: 'poi-pob-santosmardones', nombre: 'Población Santos Mardones', alias: 'santos mardones cancha santos mardones frei alto', detalle: 'Sector Poniente • Av. Frei con Santos Mardones', lat: -53.1520, lon: -70.9330, icono: '🏘️', categoria: 'Barrio' },
  { id: 'poi-pob-sanpedro', nombre: 'Población San Pedro', alias: 'poblacion san pedro canal chacao barrio sur', detalle: 'Sector Residencial Sur • Canal de Chacao', lat: -53.1810, lon: -70.9320, icono: '🏘️', categoria: 'Barrio' },
  { id: 'poi-pob-fitzroy', nombre: 'Población Fitz Roy', alias: 'fitz roy poblacion fitz roy manuel rodriguez sur', detalle: 'Sector Residencial Sur • Manuel Rodríguez', lat: -53.1740, lon: -70.9220, icono: '🏘️', categoria: 'Barrio' },
  { id: 'poi-sector-rioseco', nombre: 'Río Seco', alias: 'rio seco caleta rio seco norte ruta 9 km 13', detalle: 'Sector Periurbano Norte • Ruta 9 Norte km 13', lat: -53.0620, lon: -70.8510, icono: '🏘️', categoria: 'Barrio' },
  { id: 'poi-sector-barranco', nombre: 'Barranco Amarillo', alias: 'barranco amarillo humedal norte ruta 9 km 8', detalle: 'Sector Periurbano Norte • Ruta 9 Norte km 8', lat: -53.0900, lon: -70.8600, icono: '🏘️', categoria: 'Barrio' },
  { id: 'poi-pampa-redonda', nombre: 'Pampa Redonda', alias: 'pampa redonda periurbano alto poniente prolongacion martinez', detalle: 'Sector Periurbano Alto Poniente', lat: -53.1450, lon: -70.9400, icono: '🏘️', categoria: 'Barrio' }
];


/**
 * Normaliza una cadena de texto para búsquedas insensibles a mayúsculas y acentos.
 */
function normalizeSearchText(str) {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Búsqueda de hitos y puntos de interés locales de Punta Arenas en memoria (0ms, 100% Offline)
 */
function buscarHitosLocales(query, limit = 8) {
  const normQ = normalizeSearchText(query);
  if (!normQ || normQ.length < 2) return [];

  const words = normQ.split(/\s+/).filter(w => w.length > 0);
  const matches = [];

  for (const h of HITOS_PUNTA_ARENAS) {
    const hay = normalizeSearchText(`${h.nombre} ${h.alias || ''} ${h.detalle || ''} ${h.categoria || ''}`);
    const matchesAllWords = words.every(w => hay.includes(w));
    if (matchesAllWords) {
      const normNombre = normalizeSearchText(h.nombre);
      let score = 1;
      if (normNombre === normQ) score = 10;
      else if (normNombre.startsWith(normQ)) score = 5;
      else if (normNombre.includes(normQ)) score = 3;
      else if (normalizeSearchText(h.alias || '').includes(normQ)) score = 2;

      matches.push({
        nombre: h.nombre,
        detalle: h.detalle,
        categoria: h.categoria,
        icono: h.icono || '📍',
        lat: h.lat,
        lon: h.lon,
        fuente: 'local',
        score: score
      });
    }
  }

  matches.sort((a, b) => b.score - a.score);
  return matches.slice(0, limit);
}

/**
 * Búsqueda de Ubicaciones: Resuelve instantáneamente destinos clave (Colegios, Hospitales, Malls, etc.)
 */
async function buscarUbicacionesHibrido(query, limit = 8) {
  return buscarHitosLocales(query, limit);
}

// Exportación compatible tanto con navegadores (window) como con Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    EARTH_RADIUS_METERS,
    haversineDistance,
    projectPointToSegment,
    generarTrayectorias,
    estrategia1,
    estrategia2,
    estrategia1Transbordo,
    estrategia2Transbordo,
    parseCoordinateText,
    serializeDatasetToJS,
    serializeDatasetToGeoJSON,
    downloadBlob,
    HITOS_PUNTA_ARENAS,
    normalizeSearchText,
    buscarHitosLocales,
    buscarUbicacionesHibrido
  };
}
