# Fuentes de Información y Referencias Bibliográficas
## Proyecto de Tesis: Sistema de Recomendación de Rutas de Taxis Colectivos (TeS-SDRTC — Punta Arenas)

Este documento recopila de manera sistemática y estandarizada todas las fuentes de información, referencias teóricas, normativas legales, especificaciones técnicas y herramientas cartográficas utilizadas durante la concepción, diseño e implementación del sistema. 

Las citas están estructuradas bajo la norma **APA 7.ª edición** (la más extendida en universidades chilenas y latinoamericanas) y se acompaña al final su respectivo bloque en formato **BibTeX** para su integración directa con gestores de referencias (Zotero, Mendeley) o documentos redactados en LaTeX / Overleaf.

---

### 1. Marco Teórico, Algoritmos Geoespaciales y Ruteo en Transporte

1. **Bast, H., Delling, D., Goldberg, A., Müller-Hannemann, M., Pajor, T., Sanders, P., Wagner, D., & Werneck, R. F.** (2016). Route planning in transportation networks. En *Algorithm Engineering: Selected Results and Surveys* (Lecture Notes in Computer Science, Vol. 9220, pp. 19–80). Springer. https://doi.org/10.1007/978-3-319-49487-6_2
   * *Aporte al proyecto:* Fundamentos sobre modelos de grafos para redes de transporte público, algoritmos de cálculo de rutas óptimas y estrategias de reducción de tiempos de búsqueda en redes viales.

2. **Ceder, A.** (2007). *Public transit planning and operation: Theory, modelling and practice*. Butterworth-Heinemann / Elsevier.
   * *Aporte al proyecto:* Criterios de diseño de redes de transporte urbano, modelación de frecuencias, análisis de trayectorias unidireccionales/bidireccionales y comportamiento de los pasajeros ante distancias de caminata a paraderos o nodos.

3. **Schneider, P. J., & Eberly, D. H.** (2003). *Geometric tools for computer graphics*. Morgan Kaufmann Publishers.
   * *Aporte al proyecto:* Algoritmo de proyección ortogonal continua de un punto sobre un segmento de línea en el espacio euclidiano y su adaptación a sistemas de coordenadas planas locales (base matemática de la **Estrategia 2**).

4. **Sinnott, R. W.** (1984). Virtues of the Haversine. *Sky and Telescope*, 68(2), 159.
   * *Aporte al proyecto:* Formulación trigonométrica de la distancia del gran círculo (fórmula del Haversine) entre dos pares de coordenadas geográficas considerando la curvatura esférica de la Tierra (base métrica del cálculo de caminata).

5. **Inman, J.** (1835). *Navigation and nautical astronomy: For the use of British seamen* (3.ª ed.). W. Woodward.
   * *Aporte al proyecto:* Referencia histórica original sobre la definición matemática de la función semiverseno ($haversin(\theta) = \sin^2(\theta/2)$).

---

### 2. Planificación de Redes con Transbordos (Multi-leg Transit Routing)

6. **Delling, D., Pajor, T., & Werneck, R. F.** (2014). Round-based public transit routing. *Transportation Science*, 49(3), 428–440. https://doi.org/10.1287/trsc.2014.0534
   * *Aporte al proyecto:* Algoritmo RAPTOR; fundamento formal para la búsqueda de itinerarios en transporte público organizados por rondas de transbordo ($k=1$ transbordo), optimizando de forma biobjetivo el tiempo de viaje y el número de etapas.

7. **Vuchic, V. R.** (2005). *Urban transit: Operations, planning, and economics*. John Wiley & Sons.
   * *Aporte al proyecto:* Teoría de diseño operacional de redes de transporte, modelación de penalización psicológica por transbordo (*transfer penalty*) y cálculo de radios aceptables de caminata peatonal para enlaces entre líneas.

8. **Guan, J., Yang, H., & Wirasinghe, S. C.** (2006). Simultaneous transit line design and frequency setting considering passenger transfers. *Transportation Research Part B: Methodological*, 40(8), 706–726. https://doi.org/10.1016/j.trb.2005.09.006
   * *Aporte al proyecto:* Modelación matemática de la función de costo generalizado de viaje en redes con transbordo entre líneas disjuntas o parcialmente superpuestas.

9. **Ibarra-Rojas, O. J., Delgado, F., Giesen, R., & Muñoz, J. C.** (2015). Planning, operation, and control of bus transport systems: A literature review. *Transportation Research Part B: Methodological*, 77, 38–75. https://doi.org/10.1016/j.trb.2015.03.002
   * *Aporte al proyecto:* Revisión sistemática sobre coordinación de horarios, sincronización de transbordos en paraderos comunes y optimización de redes de transporte urbano en Latinoamérica.

---

### 3. Estándares Abiertos, Formatos de Datos e Interoperabilidad

10. **Butler, H., Daly, M., Doyle, A., Gillies, S., Hagen, S., & Schaub, T.** (2016). *The GeoJSON format* (RFC 7946). Internet Engineering Task Force (IETF). https://doi.org/10.17487/RFC7946
    * *Aporte al proyecto:* Estándar oficial para la representación de entidades geográficas (`FeatureCollection`, `LineString`, `Point`) y el orden de coordenadas interoperable `[longitud, latitud]` bajo el sistema de referencia espacial WGS84 (EPSG:4326).

11. **OpenStreetMap Contributors.** (2026). *OpenStreetMap data for Punta Arenas, Región de Magallanes y de la Antártica Chilena*. OpenStreetMap Foundation. https://www.openstreetmap.org
    * *Aporte al proyecto:* Cartografía base y trazados de la red vial de Punta Arenas (calles, avenidas principales, rotondas y sentidos del tránsito). Licencia de datos abiertos Open Database License (ODbL).

12. **OpenStreetMap France.** (2026). *Tuiles cartographiques OSM France*. Association OpenStreetMap France. https://openstreetmap.fr
    * *Aporte al proyecto:* Servidor de teselas cartográficas abiertas de alta disponibilidad utilizado como capa base visual en la aplicación web sin requerir llaves privadas ni cuotas de uso comercial.

13. **World Wide Web Consortium (W3C).** (2023). *File System Access API* (W3C Working Draft). W3C. https://www.w3.org/TR/file-system-access/
    * *Aporte al proyecto:* Especificación técnica para la lectura y escritura directa de archivos en el sistema local del usuario (`window.showOpenFilePicker`, `FileSystemFileHandle.createWritable`) empleada en el módulo de administración y digitalización (`editor.html`).

14. **World Wide Web Consortium (W3C).** (2022). *Service Workers 1* (W3C Candidate Recommendation). W3C. https://www.w3.org/TR/service-workers/
    * *Aporte al proyecto:* Estándar de la arquitectura *Offline-First* y Progressive Web Apps (PWA) para interceptar peticiones de red y servir la aplicación desde la caché local en dispositivos móviles sin conectividad.

---

### 4. Marco Legal, Normativo y Regulatorio Chileno (Taxis Colectivos)

15. **Ministerio de Transportes y Telecomunicaciones de Chile [MTT].** (1992). *Decreto Supremo N.º 212: Reglamento de los servicios nacionales de transporte público de pasajeros*. Biblioteca del Congreso Nacional de Chile (BCN). https://www.bcn.cl/leychile/navegar?idNorma=10103
    * *Aporte al proyecto:* Marco reglamentario nacional que rige a los taxis colectivos urbanos en Chile, definiendo requisitos técnicos, concesiones, variantes, trazados autorizados y condiciones de operación.

16. **Ministerio de Transportes y Telecomunicaciones de Chile [MTT].** (1984). *Ley N.º 18.290: Ley de Tránsito*. Biblioteca del Congreso Nacional de Chile (BCN). https://www.bcn.cl/leychile/navegar?idNorma=29708
    * *Aporte al proyecto:* Definición legal de sentidos de circulación, paradas, seguridad vial y regulación del uso de vías públicas.

17. **Secretaría Regional Ministerial de Transportes y Telecomunicaciones [SEREMI XII Región de Magallanes y de la Antártica Chilena].** (2024). *Registro Nacional de Servicios de Transporte de Pasajeros: Líneas de taxis colectivos urbanos de Punta Arenas*. Subsecretaría de Transportes / División de Transporte Público Regional (DTPR).
    * *Aporte al proyecto:* Catálogo y descripción física de los trazados de las líneas de colectivos que operan en Punta Arenas (recorridos Centro, Norte, Sur, Playa Norte, Cerro de la Cruz, 18 de Septiembre y Archipiélago de Chiloé).

---

### 5. Interacción Persona-Computador y Cartografía Interactiva (Brushing & Linking)

18. **Becker, R. A., & Cleveland, W. S.** (1987). Brushing scatterplots. *Technometrics*, 29(2), 127–142. https://doi.org/10.1080/00401706.1987.10488204
    * *Aporte al proyecto:* Técnica de interacción de selección y vinculación coordinada (*brushing and linking*) entre elementos de una lista o panel de control y su representación gráfica en el mapa.

19. **Roth, R. E.** (2013). An empirically-derived taxonomy of interaction primitives for interactive cartography and geovisualization. *IEEE Transactions on Visualization and Computer Graphics*, 19(12), 2356–2365. https://doi.org/10.1109/TVCG.2013.130
    * *Aporte al proyecto:* Taxonomía formal de primitivas de interacción en mapas digitales (resaltado bajo demanda, previsualización interactiva al pasar el cursor y retroalimentación bidireccional entre alternativas de viaje).

---

### 6. Software y Librerías de Código Abierto

20. **Agafonkin, V., & Leaflet Contributors.** (2024). *Leaflet: An open-source JavaScript library for mobile-friendly interactive maps* (Versión 1.9.4) [Software]. https://leafletjs.com
    * *Aporte al proyecto:* Motor cartográfico liviano en el lado del cliente (Frontend Vanilla) para renderizado de capas vectoriales, marcadores táctiles y manejo de proyecciones espaciales en el navegador.

---

### 7. Archivo BibTeX (para Overleaf / LaTeX)

A continuación se presenta el bloque de citas en formato BibTeX para copiar y pegar directamente en su archivo `.bib`:

```bibtex
@article{delling2014round,
  author    = {Daniel Delling and Thomas Pajor and Renato F. Werneck},
  title     = {Round-Based Public Transit Routing},
  journal   = {Transportation Science},
  volume    = {49},
  number    = {3},
  pages     = {428--440},
  year      = {2014},
  doi       = {10.1287/trsc.2014.0534}
}

@book{vuchic2005urban,
  author    = {Vukan R. Vuchic},
  title     = {Urban Transit: Operations, Planning, and Economics},
  publisher = {John Wiley \& Sons},
  address   = {Hoboken, NJ},
  year      = {2005},
  isbn      = {978-0-471-63777-6}
}

@article{guan2006simultaneous,
  author    = {Jian Guan and Hai Yang and S. C. Wirasinghe},
  title     = {Simultaneous Transit Line Design and Frequency Setting Considering Passenger Transfers},
  journal   = {Transportation Research Part B: Methodological},
  volume    = {40},
  number    = {8},
  pages     = {706--726},
  year      = {2006},
  doi       = {10.1016/j.trb.2005.09.006}
}

@article{ibarra2015planning,
  author    = {Omar J. Ibarra-Rojas and Felipe Delgado and Ricardo Giesen and Juan Carlos Mu{\~n}oz},
  title     = {Planning, Operation, and Control of Bus Transport Systems: A Literature Review},
  journal   = {Transportation Research Part B: Methodological},
  volume    = {77},
  pages     = {38--75},
  year      = {2015},
  doi       = {10.1016/j.trb.2015.03.002}
}

@incollection{bast2016route,
  author    = {Hannah Bast and Daniel Delling and Andrew Goldberg and Matthias M{\"u}ller-Hannemann and Thomas Pajor and Peter Sanders and Dorothea Wagner and Renato F. Werneck},
  title     = {Route Planning in Transportation Networks},
  booktitle = {Algorithm Engineering: Selected Results and Surveys},
  series    = {Lecture Notes in Computer Science},
  volume    = {9220},
  pages     = {19--80},
  publisher = {Springer},
  year      = {2016},
  doi       = {10.1007/978-3-319-49487-6_2}
}

@book{ceder2007public,
  author    = {Avishai Ceder},
  title     = {Public Transit Planning and Operation: Theory, Modelling and Practice},
  publisher = {Butterworth-Heinemann / Elsevier},
  address   = {Oxford, UK},
  year      = {2007},
  isbn      = {978-0-7506-6166-9}
}

@book{schneider2003geometric,
  author    = {Philip J. Schneider and David H. Eberly},
  title     = {Geometric Tools for Computer Graphics},
  publisher = {Morgan Kaufmann Publishers},
  address   = {San Francisco, CA},
  year      = {2003},
  isbn      = {978-1-55860-594-7}
}

@article{sinnott1984virtues,
  author  = {Roger W. Sinnott},
  title   = {Virtues of the Haversine},
  journal = {Sky and Telescope},
  volume  = {68},
  number  = {2},
  pages   = {159},
  year    = {1984}
}

@techreport{rfc7946,
  author       = {Howard Butler and Martin Daly and Allan Doyle and Sean Gillies and Stefan Hagen and Tim Schaub},
  title        = {The GeoJSON Format},
  howpublished = {Internet Engineering Task Force (IETF) RFC 7946},
  year         = {2016},
  month        = aug,
  doi          = {10.17487/RFC7946},
  url          = {https://www.rfc-editor.org/info/rfc7946}
}

@misc{osm2026puntaarenas,
  author       = {{OpenStreetMap Contributors}},
  title        = {OpenStreetMap Data for Punta Arenas, Magallanes, Chile},
  howpublished = {\url{https://www.openstreetmap.org}},
  year         = {2026},
  note         = {Open Database License (ODbL)}
}

@misc{w3c_filesystemaccess_2023,
  author       = {{World Wide Web Consortium}},
  title        = {File System Access API - W3C Working Draft},
  howpublished = {\url{https://www.w3.org/TR/file-system-access/}},
  year         = {2023}
}

@misc{w3c_serviceworker_2022,
  author       = {{World Wide Web Consortium}},
  title        = {Service Workers 1 - W3C Candidate Recommendation},
  howpublished = {\url{https://www.w3.org/TR/service-workers/}},
  year         = {2022}
}

@misc{mtt_ds212_1992,
  author       = {{Ministerio de Transportes y Telecomunicaciones de Chile}},
  title        = {Decreto Supremo N.{\textordmasculine} 212: Reglamento de los Servicios Nacionales de Transporte P{\'u}blico de Pasajeros},
  howpublished = {Biblioteca del Congreso Nacional de Chile (BCN)},
  year         = {1992},
  url          = {https://www.bcn.cl/leychile/navegar?idNorma=10103}
}

@misc{seremi_magallanes_dtpr,
  author       = {{SEREMI de Transportes y Telecomunicaciones Regi{\'o}n de Magallanes y de la Ant{\'a}rtica Chilena}},
  title        = {Registro Nacional de Servicios de Transporte de Pasajeros: Red de Taxis Colectivos de Punta Arenas},
  institution  = {Divisi{\'o}n de Transporte P{\'u}blico Regional (DTPR)},
  year         = {2024}
}

@article{becker1987brushing,
  author  = {Richard A. Becker and William S. Cleveland},
  title   = {Brushing Scatterplots},
  journal = {Technometrics},
  volume  = {29},
  number  = {2},
  pages   = {127--142},
  year    = {1987},
  doi     = {10.1080/00401706.1987.10488204}
}

@article{roth2013interaction,
  author  = {Robert E. Roth},
  title   = {An Empirically-Derived Taxonomy of Interaction Primitives for Interactive Cartography and Geovisualization},
  journal = {IEEE Transactions on Visualization and Computer Graphics},
  volume  = {19},
  number  = {12},
  pages   = {2356--2365},
  year    = {2013},
  doi     = {10.1109/TVCG.2013.130}
}

@manual{leaflet2024,
  title  = {Leaflet: An open-source JavaScript library for mobile-friendly interactive maps},
  author = {Volodymyr Agafonkin and {Leaflet Contributors}},
  year   = {2024},
  note   = {Version 1.9.4},
  url    = {https://leafletjs.com}
}
```
