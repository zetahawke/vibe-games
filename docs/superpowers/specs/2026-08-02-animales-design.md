# Juego de Animales — Design Spec

**Date:** 2026-08-02  
**Status:** Approved for planning  
**Scope:** Matching 2D drag-to-shadow for ~2 años; unlock hub card; reuse suite auth/shell.

---

## 1. Producto y loop

Juego 2D en **español** para niña ~2 años: arrastrar animales SVG grandes a su sombra coincidente.

- Dispositivos: PC y tablet (Pointer Events).
- Al tocar la tarjeta **Animales** en el hub: modal de **ajuste** (modo de soltar) + **Jugar** / cancelar.
- Cada ronda: **3 o 4** animales al azar (uniforme entre ambos), ids únicos de un catálogo fijo.
- Al completar la ronda: celebración corta + botón grande **“Otra vez”** + **Salir** al hub.
- Sin monedas, oleadas ni high score del shooter. Reutiliza login/perfil del suite (`localStorage` por usuario).

---

## 2. Modos de soltar (ajuste)

Guardados **por jugador** en `localStorage`. Se eligen **solo en el modal del hub** antes de entrar (no engranaje in-game).

| Id | Nombre UI | Comportamiento |
|----|-----------|----------------|
| `libre` | Libre | Suelta en cualquier sitio; si no es la sombra correcta, el animal vuelve al origen. Sin feedback negativo. |
| `suave` | Suave | Igual que Libre + feedback negativo breve (shake CSS + tono “uh-oh” vía Web Audio simple). |
| `guiado` | Guiado | Solo “encaja” si el drop hit-testea la sombra del mismo id; si no, no se suelta ahí y vuelve al origen. |

- **Default:** `guiado`.
- **Acierto (todos los modos):** snap a la sombra + feedback positivo (pop visual; tono alegre opcional). El animal queda fijado (ya no se arrastra).
- Drop fuera de cualquier sombra: vuelve al origen (en `guiado`/`libre`/`suave` igual).

---

## 3. Arquitectura

Misma app Vite + TypeScript. Nueva pantalla de router: `'animals'` (junto a login / hub / shooter).

| Módulo | Responsabilidad |
|--------|-----------------|
| `domain/animals/catalog` | Ids, nombres en español, color/SVG helper |
| `domain/animals/round` | `pickRound(): AnimalId[]` — length 3 o 4, sin duplicados |
| `domain/animals/dropRules` | Dado modo + targetId + animalId → `{ accept, feedback }` |
| `domain/animals/settings` | get/set modo de soltar por `username` |
| `game/animals/AnimalsSession` | Monta DOM, drag/drop, celebración, Otra vez / Salir |
| `game/ui/screens` / overlays | Modal ajuste desde hub; pantalla de juego |
| Hub | Quitar “Próximamente”; tarjeta abre modal → Jugar |

**Stack UI:** HTML + CSS + SVG inline (o módulos TS que devuelven markup SVG). **Sin Three.js** en este juego.

**Layout de juego:**

- Portrait / tablet: zona superior = sombras; inferior = animales sueltos.
- Landscape: sombras a un lado, animales al otro (o mismo criterio responsive con flex/grid).
- Targets táctiles grandes (≥ ~72px CSS).

---

## 4. Visual y contenido

**Catálogo v1 (8):** `perro`, `gato`, `pajaro`, `pez`, `vaca`, `cerdo`, `conejo`, `pato`.

- SVG planos, colores fuertes, formas reconocibles.
- Sombra = misma silueta en gris/negro semitransparente (o filtro CSS sobre el SVG).
- Fondo alegre (gradiente cielo/césped en CSS), tipografía grande en español.
- Celebración: overlay “¡Muy bien!” + animación breve (confetti CSS o scale bounce).

---

## 5. Datos y persistencia

- Modo de soltar: clave tipo `juegos-de-casa:animals:settings:<username>` → `{ dropMode: 'libre' \| 'suave' \| 'guiado' }`.
- No hay partida guardada mid-round; cada entrada al juego empieza ronda nueva.
- Auth/session: sin cambios de contrato; mismo `getSession()` / hub.

---

## 6. Interacción (drag)

- Pointer down en animal no fijado → picking; move con `setPointerCapture`.
- Pointer up: hit-test centro (o bounding box) contra sombras libres.
- Aplicar `dropRules`; animar retorno o snap.
- Cuando todos los de la ronda están fijados → estado `complete` → overlay celebración.

---

## 7. Pruebas

Unitarias (Vitest):

- `pickRound` → length ∈ {3,4}, ids únicos, subset del catálogo.
- `dropRules` para cada modo (acierto / fallo / fuera de sombra).
- settings get default `guiado`; set/get persiste (mock `localStorage` si hace falta).

Manual: hub → modal → cada modo → completar ronda → Otra vez → Salir; touch + mouse.

---

## 8. Fuera de scope (v1 animales)

- Economía / scores compartidos con el shooter.
- Timer, fallos contados, estrellas.
- TTS / nombres hablados.
- Sets temáticos extra (granja vs selva).
- Engranaje in-game o hold-to-open settings.

---

## 9. Criterios de aceptación

1. La tarjeta Animales ya no dice “Próximamente” y abre el modal de ajuste.
2. Se puede elegir Libre / Suave / Guiado; la elección persiste por usuario y es el default al volver.
3. Default al primer uso: Guiado.
4. Cada ronda muestra 3 o 4 animales distintos con sombras correspondientes.
5. Los tres modos se comportan según la tabla de la sección 2.
6. Completar ronda muestra celebración + Otra vez + Salir.
7. Otra vez genera una ronda nueva; Salir vuelve al hub.
8. Funciona con mouse y touch en el layout responsive.

---

## 10. Relación con el suite

Reusa auth, hub shell y estilos base. El design spec v1 del suite (`2026-08-02-juegos-de-casa-design.md`) marcaba animales como placeholder; este documento lo reemplaza para el alcance del segundo juego.
