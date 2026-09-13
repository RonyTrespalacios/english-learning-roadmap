# Brief para subagentes de recursos

Lee `D:\workspace\english-roadmap\data\curriculum.js` y localiza tus topic ids (campo `id`). Para CADA topic asignado, busca recursos web REALES de terceros (usa WebSearch; carga las herramientas con ToolSearch "select:WebSearch,WebFetch" primero).

## Salida
Escribe UN archivo `D:\workspace\english-roadmap\data\resources/<nombre>.js` con exactamente este formato:

```js
window.ER_RESOURCES = Object.assign(window.ER_RESOURCES || {}, {
  "topic-id": {
    theory:    [ { title: "…", url: "https://…", source: "britishcouncil.org", desc: "1 línea en español", lang: "en" } ],
    videos:    [ … ],
    listening: [ … ],
    songs:     [ { title: "Song name", artist: "Artist", url: "https://…", source: "youtube.com", desc: "por qué es relevante para el tema", lang: "en" } ],
    reading:   [ … ],
    tests:     [ … ]
  },
  …
});
```

## Cantidades por topic (mínimos)
- theory: 2-3 (explicación escrita; puede haber 1 en español y el resto en inglés)
- videos: 2-3 (YouTube: engVid, BBC Learning English, English with Lucy, Rachel's English, mmmEnglish, Learn English with TV Series, Papa Teach Me, Bob the Canadian, etc. Usa URLs de video concretas `https://www.youtube.com/watch?v=…` que hayas encontrado en resultados de búsqueda; si no encuentras el video exacto, usa una URL de búsqueda de YouTube `https://www.youtube.com/results?search_query=…`, máximo 1 por topic)
- listening: 1-2 (audios con transcripción: ELLLO, BBC 6 Minute English, VOA Learning English, ESL Fast, Randall's ESL Cyber Listening Lab, LearnEnglish podcasts, Luke's English Podcast, etc.)
- songs: 1-2 canciones REALES cuya letra use claramente la estructura/vocabulario del tema (ej. "Yesterday" para pasado simple, "If I Were a Boy" para 2º condicional, "I Still Haven't Found What I'm Looking For" para present perfect). Enlaza a LyricsTraining (https://lyricstraining.com/…) o YouTube. Si NO hay canción realmente relevante, deja `songs: []`.
- reading: 1-3 lecturas: mini-noticias en inglés fácil (newsinlevels.com, breakingnewsenglish.com, learnenglish.britishcouncil.org reading, ESL Fast, Simple English Wikipedia), lectores graduados / mini-libros gratuitos (Project Gutenberg, freeenglishreaders, english-e-reader.net, Sherlock Holmes adaptado, etc.) apropiados al nivel, o cartillas/handouts en PDF. Para topics gramaticales, una lectura que USE ese tiempo/estructura.
- tests: 3-4 ejercicios/tests GRATUITOS del tema (test-english.com, perfect-english-grammar.com exercises, englishpage.com, agendaweb.org, esl-lounge.com, englisch-hilfen.de, learnenglish.britishcouncil.org grammar tests, ego4u.com, englishclub.com, liveworksheets, Cambridge sample tests para exam topics).

## Reglas
- Solo URLs que hayas visto en resultados de búsqueda o verificado con WebFetch. NUNCA inventes rutas. Prefiere páginas raíz de sección estables si dudas de una URL profunda.
- Verifica con WebFetch al menos las URLs de las que no estés seguro (responde 200 y contenido relacionado).
- `source` = dominio sin `www.`. `desc` = 1 línea en español (máx ~120 caracteres) explicando qué es y por qué sirve.
- Prioriza sitios reconocidos y gratuitos: British Council LearnEnglish, BBC Learning English, Cambridge, Perfect English Grammar, English Page, Test-English, Woodward English, EnglishClub, Grammarly blog, Lingolia, ELLLO, VOA, engVid, Anki/AnkiWeb shared decks (para vocab/verbos irregulares), Youglish, Quizlet sets públicos.
- Para topics de "vocabulario": theory = listas/imágenes con audio (EnglishClub, Games4esl, LearnEnglish Kids/Teens, Vocabulary.com, Quizlet), tests = quizzes de vocabulario.
- Para topics de "método", "diagnóstico" y "exam": theory = guías (Anki, comprehensible input, Refold, Cambridge/EF test de nivel), tests = tests de nivel/ sample papers oficiales.
- Para topics de "skills" (listening/reading/speaking/writing): listening y reading pueden ser 3-5 recursos cada uno; tests = ejercicios de comprensión con corrección.
- El archivo debe ser JS válido (comillas dobles, escapa comillas dentro de strings, sin comas colgantes problemáticas, sin comentarios rotos). Al terminar, valida con: `node -e "global.window={};require('<ruta>');console.log(Object.keys(window.ER_RESOURCES).length)"`.
- No modifiques ningún otro archivo del proyecto.
- Responde al final SOLO con: ruta del archivo, número de topics cubiertos y lista de URLs que no pudiste verificar.
