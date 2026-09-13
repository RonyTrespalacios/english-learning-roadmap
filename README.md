# English Roadmap (A1 → C1)

> Interactive roadmap to learn English from A1 to C1 — a 100 % static site with curated free resources per topic.

Mapa de estudio interactivo para aprender inglés con orden analítico-práctico. Cada tema (caja) abre una modal con explicación corta, estructura (afirmativo / negativo / pregunta) y tarjetas de recursos gratuitos de terceros: teoría, videos, listening, canciones, lecturas y tests.

## Uso

Sitio 100 % estático, sin build. Abre `index.html` directamente o, mejor, sírvelo con HTTP para activar el service worker que cachea las vistas previas:

```bash
npx serve .
# o
python -m http.server 8080
```

## Estructura

- `data/curriculum.js` — niveles, clusters y temas (orden pedagógico, explicaciones, estructuras).
- `data/resources/*.js` — recursos por `topic id` (theory, videos, listening, songs, reading, tests).
- `js/app.js` — render del roadmap, conectores SVG, modal, progreso (localStorage), caché de imágenes (IndexedDB + service worker).
- `css/styles.css` — estilos (fondo blanco, estilo roadmap.sh).
- `sw.js` — service worker cache-first para vistas previas.

## Progreso

Se guarda en `localStorage` bajo `er:progress:v2`. Puedes exportarlo/importarlo como JSON desde la cabecera.

## Añadir o corregir recursos

Edita el archivo correspondiente en `data/resources/` respetando el esquema:

```js
"topic-id": {
  theory: [{ title, url, source, desc, lang }],
  videos: [], listening: [], songs: [{ title, artist, url, source, desc }], reading: [], tests: []
}
```

## Verificar recursos

```bash
node tools/check-resources.js          # cobertura por tema (faltantes / por debajo del mínimo)
node tools/check-resources.js --links  # además comprueba cada URL por HTTP
```

Los 403/429 suelen ser bloqueos anti-bot (Cloudflare) y el enlace funciona en el navegador; se listan aparte como "dudosos".
