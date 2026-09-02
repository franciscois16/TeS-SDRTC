## Stack tecnológico propuesto y puntos clave de la reunión

Documento de apoyo para la próxima conversación con el profesor guía

## 1. Resumen de la reunión con el profesor

- Recepción de la idea: al profesor le gustó el proyecto y se ofreció a ayudarte a desarrollarlo.

- Advertencia sobre la defensa: dijo explícitamente que la comisión no evalúa tanto el producto final —"el producto final es un prototipo, generalmente todo lo que uno presenta"— sino lo que hay detrás: qué modelo o técnica se usa, si es un aporte propio, y si se usó algún agente de IA para construirlo. Hay que llegar con una respuesta técnica clara a esa pregunta.

- Requisito de accesibilidad: se conversó que las aplicaciones de transporte suelen hacerse en tecnologías pesadas y lentas, lo que deja afuera a personas con celulares más simples —como muchos adultos mayores, justamente parte del público que más usa colectivos. Esto se puede convertir en un argumento técnico a favor del proyecto: elegir un stack liviano a propósito.

- Posible mejora sugerida (no comprometida aún): se mencionó la idea de indicar cuánto tiempo falta o si conviene ir a esperar a otro lugar. Esto normalmente requeriría seguimiento GPS en tiempo real de los vehículos, que ya quedó definido como fuera del alcance de la tesis (ver sección 3). Vale la pena mencionarla en la reunión como posible trabajo futuro, no como algo a implementar ahora.

- Pendiente del profesor: va a revisar si hubo compañeros con tesis anteriores sobre transporte en Punta Arenas —le sonó a que usaron tarjetas RFID o GPS— para ayudarte a diferenciar tu proyecto del de ellos.

- Próximo paso acordado: tú redactas la idea completa esta semana para conversarla con más detalle la próxima semana.

## 2. Respuesta lista para "¿cuál es la novedad?"

Esta es la pregunta que, según el profesor, seguro te va a hacer la comisión. Aquí tienes una respuesta corta y directa para memorizar:

"La novedad no está en la aplicación en sí, sino en dos partes: primero, transformar un dato que hoy solo existe como trámite administrativo en la SEREMI en un dataset abierto y estructurado; segundo, diseñar y comparar dos estrategias algorítmicas de búsqueda geoespacial para resolver la ambigüedad de recomendación en zonas donde muchas líneas se superponen, evaluando cuál ofrece mejor precisión y tiempo de respuesta. La aplicación es solo la forma de demostrar que eso funciona."

## 3. Stack tecnológico propuesto

Elegido con dos criterios explícitos: costo cero (nada de licencias ni suscripciones) y liviandad (que corra bien en celulares simples y antiguos, respondiendo directamente a lo que planteó el profesor).

| Componente | Herramienta propuesta | Por qué |
| --- | --- | --- |
| Formato de la | Aplicación web (PWA) en vez | Corre en cualquier navegador sin instalar nada |
| aplicación | de app nativa | pesado; funciona en celulares antiguos y de gama |
|   |   | baja; sin costo de tiendas de aplicaciones. |
| Mapa y | Leaflet.js + capas de | Gratuito, sin necesidad de llave de API (a diferencia |
| visualización | OpenStreetMap | de Google Maps); librería liviana y muy documentada. |


| Componente | Herramienta propuesta | Por qué |
| --- | --- | --- |
| Backend / | Python con Flask o FastAPI | Gratuito, ampliamente documentado, ideal para |
| algoritmo |   | implementar y explicar el algoritmo con claridad ante |
|   |   | la comisión. |
| Procesamiento | Shapely / GeoPandas (y | Librerías estándar de Python para representar |
| geoespacial | opcionalmente R-tree para | trazados y comparar estrategias de búsqueda |
|   | indexación espacial) | geoespacial; dan contenido técnico concreto para |
|   |   | responder "qué hay detrás". |
| Almacenamiento | Archivos GeoJSON estáticos | No requiere un servidor de base de datos; mantiene el |
| del dataset | (o SQLite si se necesitan | dataset abierto y portable. |
|   | consultas más complejas) |   |
| Hosting para la | GitHub Pages (frontend) + | Cero costo para tener el prototipo funcionando en |
| demo | Render o PythonAnywhere, | línea durante la evaluación. |
|   | planes gratuitos (backend) |   |
| Control de | Git + GitHub | Gratuito; además sirve como evidencia de trabajo |
| versiones |   | incremental para la memoria. |

## 3.1. Cómo se instala para usuarios poco familiarizados con la tecnología

Ser una aplicación web no significa que el usuario tenga que "usar un navegador" en el sentido tradicional. Configurando la app como PWA (Progressive Web App), se logra que:

- La persona entra al link una vez (por WhatsApp o un código QR) y toca "Agregar a pantalla de inicio".

- Desde ese momento queda un ícono en su pantalla de inicio, con nombre e ícono propios, igual que cualquier otra aplicación que ya tenga instalada.

- Al tocar ese ícono, la app se abre en pantalla completa, sin barra de direcciones ni botones de navegador (modo "standalone"): para el usuario es indistinguible de una app nativa.

Opción a futuro: con Capacitor (gratuito) el mismo código web puede empaquetarse como un archivo .apk real, o incluso publicarse en la Play Store, sin reescribir la aplicación. No es necesario para el prototipo de tesis, pero queda disponible como mejora posterior.

## 4. Pendientes antes de la próxima reunión

- Redactar la idea completa (puedes usar la propuesta ya armada como base) para llevarla la próxima semana.

- Esperar la respuesta del profesor sobre tesis anteriores de compañeros con temas de transporte (RFID/GPS) y, si existen, revisar en qué se diferencia tu enfoque.

- Tener lista la respuesta de la sección 2 para la pregunta de la novedad, y el argumento de accesibilidad (stack liviano) como refuerzo si preguntan por qué elegiste estas tecnologías.

Nota: este documento es un complemento de apoyo personal, no parte formal de la propuesta de tesis.
