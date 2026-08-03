# Identificar — Design Spec

**Date:** 2026-08-02  
**Status:** Approved for planning  
**Scope:** Drag-to-match learning game with three themes (Vocales, Números, Abecedario); shared matching engine with Animales; Spanish speech on success.

---

## 1. Producto y loop

Juego 2D en **español** (misma suite, PC + tablet) para practicar reconocimiento.

- Hub: tarjeta **Identificar** (junto a Fuerte de Mates y Animales).
- Al tocar → modal de inicio:
  - **Temática:** Vocales | Números | Abecedario
  - **Modo de soltar:** Libre | Suave | Guiado (igual semántica que Animales)
  - **Jugar** / Cancelar
- Cada ronda: **3 o 4** ítems al azar (uniforme), únicos, del pool de la temática.
- Acierto: snap + **voz** del ítem (`speechSynthesis`, español).
- Ronda completa: overlay “¡Muy bien!” + **Otra vez** + **Salir** al hub.
- Sin monedas ni score del shooter. Preferencias por usuario en `localStorage`.

---

## 2. Temáticas y voz

| Id | Nombre UI | Pool | UI | Texto hablado (es) |
|----|-----------|------|----|--------------------|
| `vocales` | Vocales | A E I O U | Letra mayúscula grande | `a`, `e`, `i`, `o`, `u` |
| `numeros` | Números | 1–10 | Dígito grande | `uno` … `diez` |
| `abecedario` | Abecedario | A–Z | Letra mayúscula grande | Nombre de letra en español (`a`, `be`, `ce`, `de`, … `jota`, … `zeta`) |

- Pieza arrastrable y sombra usan el **mismo glifo**; sombra = mismo glifo en gris / opacidad baja.
- **Visual (v1):** HTML/CSS tipografía grande (o SVG de un solo `<text>`). **No PNGs** — más barato y nítido. Ilustraciones PNG quedan fuera de scope.
- Voz: wrapper `speakEs(text)` sobre `speechSynthesis` con `lang = 'es-ES'` (fallback `'es'`). Si la API no existe o falla: acierto solo visual.
- Al acertar se habla **una vez** el `spokenLabel` del ítem (no se corta a medias de forma agresiva; cancelar utterance previa al nuevo acierto está bien).

---

## 3. Modos de soltar

Idénticos a Animales (`libre` / `suave` / `guiado`) vía `resolveDrop` existente o compartido:

- Default Identificar: `guiado`.
- Persistidos en settings de Identificar (independientes de Animales), junto con última `theme` elegida.

---

## 4. Arquitectura

Reutilizar matching (enfoque A):

| Módulo | Responsabilidad |
|--------|-----------------|
| `game/match/` | Motor DOM: drag pointer, sombras, apply drop rules, celebración, Otra vez/Salir. API genérica: ítems `{ id, label, artHtml, spokenText? }` + `DropMode` + callbacks |
| `domain/identify/catalog` | Pools por temática, labels UI, `spokenLabel(theme, id)` |
| `domain/identify/round` | `pickIdentifyRound(theme): ItemId[]` length 3\|4 |
| `domain/identify/settings` | `{ dropMode, theme }` por username |
| `shared/speech.ts` | `speakEs(text: string): void` |
| `game/identify/` | Orquesta: settings modal → MatchSession con catálogo identify + speak on success |
| `game/animals/` | Refactor para montar MatchSession con catálogo animals (comportamiento igual al actual) |
| Hub + router | Tarjeta + `setIdentifyStarter` |

**CSS:** reutilizar clases de matching (`.animal-piece` puede generalizarse a `.match-piece` / `.match-shadow` en el refactor; alias o rename con cuidado de no romper Animales).

---

## 5. Persistencia

- Clave: `` `${STORAGE_PREFIX}identify:settings:${username}` ``
- Shape: `{ dropMode: 'libre'|'suave'|'guiado', theme: 'vocales'|'numeros'|'abecedario' }`
- Defaults: `dropMode: 'guiado'`, `theme: 'vocales'`

---

## 6. Pruebas

- `pickIdentifyRound`: length ∈ {3,4}, ids en pool, únicos.
- `spokenLabel`: muestras (1→uno, J→jota, A vocal→a).
- settings get/set roundtrip.
- `speakEs`: mock / no-op seguro si no hay `window.speechSynthesis` (unit test no requiere audio real).

Manual: hub → cada temática → acierto oye voz → completar → Otra vez / Salir; touch + mouse. Animales sigue funcionando tras el refactor.

---

## 7. Fuera de scope (v1)

- PNG / ilustraciones por letra o número.
- Audios grabados (MP3); solo Web Speech.
- Mezclar temáticas en una ronda.
- TTS de Animales.
- Teclado físico para tipear (solo drag).

---

## 8. Criterios de aceptación

1. Tarjeta Identificar en hub abre modal con temática + modos + Jugar.
2. Tres temáticas con pools correctos; rondas de 3–4.
3. Drag/modos se comportan como en Animales.
4. Acierto dispara voz española del ítem (o silencio degradado sin API).
5. Celebración + Otra vez / Salir.
6. Settings persisten por usuario.
7. Animales no regresa; misma UX de matching tras compartir motor.

---

## 9. Relación con el suite

Tercer juego del hub. Spec de Animales (`2026-08-02-animales-design.md`) sigue vigente; este documento añade Identificar y el motor `match` compartido.
