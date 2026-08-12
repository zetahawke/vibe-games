# Boxing models + arsenal — Design Spec

**Date:** 2026-08-11  
**Status:** Approved for planning  
**Depends on:** `2026-08-02-juegos-de-casa-design.md` (armas v1, tienda, perfil)

---

## 1. Goal

Aislar los modelos blocky (Roblox-like) de armas y player en una estructura importable, con un loader que hoy instancia cajas y mañana puede apuntar a GLB sin cambiar combate, tienda ni rig.

En la misma entrega:

- Segmentar el player en **base + overlays** (`hat`, `shirt`, `pants`) editables **gratis en el perfil** (sin economía), para probar personalización.
- Ampliar el repertorio: **arco**, **espada + escudo** (un solo equip), **espada larga** (dos manos), cada una con versión `_upgraded`, hasta la tienda.
- Combate: **solo stats + visual/poses**. Sin reglas nuevas (el escudo no bloquea; el arco no tiene munición). Las vidas siguen siendo del fuerte.

Éxito: las armas actuales se ven igual (migradas a catálogo); las nuevas se compran/equipan en la tienda; el preview de perfil muestra overlays dummy (camiseta/armadura en torso); un save viejo no crashea.

---

## 2. Architecture

El mundo 3D no construye `BoxGeometry` a mano. Pide un modelo al loader.

```
src/assets/boxing/
  manifest.ts          # ids, grip, overlay slots, BoxingRef (boxes | glb)
  loader.ts            # createBoxingModel(ref) → THREE.Group
  schema.ts            # BoxPart, BoxingRef, Grip, OverlaySlot
  boxes/
    weapons/           # knife, pistol, shotgun, rifle + upgraded + bow, sword, shield, longsword
    player/base/       # head, hair_boy, hair_girl, torso, leftArm, rightArm, leftLeg, rightLeg, skirt
    player/overlays/
      hat/
      shirt/           # dummy: camiseta de fútbol y/o peto de armadura
      pants/
public/boxing/         # vacío al inicio; GLB futuros (`/boxing/...`)
```

### Loader contract

```ts
type BoxingRef =
  | { type: 'boxes'; id: string }
  | { type: 'glb'; url: string };

interface BoxPart {
  size: [number, number, number];
  position: [number, number, number];
  rotation?: [number, number, number]; // euler radians, optional
  color: number;
  metal?: number;
  rough?: number;
  emissive?: number;
  emissiveIntensity?: number;
}
```

- **boxes:** cada `BoxPart` → `BoxGeometry` + `MeshStandardMaterial` → `Group` en origen local.
- **glb:** `GLTFLoader` desde `url` bajo `/boxing/...`. Si falla: fallback a cajas del mismo `id` si existen; si no, placeholder 1×1×1 y `console.warn`.
- El grupo queda listo para enganchar a un slot (mano, cabeza, torso, etc.). Sin stats ni input.

### Boundaries

| Unit | Does | Does not |
|------|------|----------|
| `boxing/loader` | Instancia visual | Stats, tienda, input |
| `weapons.ts` | id, kind, grip, daño, precio, cooldown, range | Geometría |
| `player.ts` | Rig, animación, anclas de slot | Definir cajas |
| `profile` | sex, color, overlay ids libres | Precios de cosméticos |
| `shop` | Comprar/equipar armas | Saber si el modelo es boxes o GLB |

`createWeaponModel` y `buildPlayer` se mantienen como API pública. `weaponVisuals.ts` y las `BoxGeometry` de `buildPlayer` migran a catálogos. World, preview de perfil y tienda no se reescriben de golpe.

---

## 3. Player: base + overlays

El rig actual se conserva (mismos pivotes de caminar / apuntar / melee).

### Base (siempre presente)

`head`, `hair` (boy/girl), `torso`, `leftArm`, `rightArm`, `leftLeg`, `rightLeg`, `skirt` (solo girl).

- Color de perfil sigue tiñendo **torso** (y falda).
- Piel / pantalón base como hoy.
- Pelo sigue siendo variante de sexo en la **base**, no un overlay.

### Slots nuevos

| Slot | Dónde | Uso |
|------|--------|-----|
| `rightHand` | extremo del brazo derecho | armas `right` / mano derecha de `paired` / ancla 2H |
| `leftHand` | extremo del brazo izquierdo | escudo en `paired`; pose 2H |
| `hat` | sobre `head` | overlay |
| `shirt` | sobre `torso` (no lo reemplaza) | overlay |
| `pants` | sobre piernas (no las reemplaza) | overlay |

### Overlays en perfil (gratis, para probar)

- Sexo + color como hoy.
- Selectores: sombrero / camisa / pantalón, opción **Ninguno** (`none`).
- **1–2 dummies por slot**, ids fijos:

  | Slot | Ids | Look |
  |------|-----|------|
  | `hat` | `cap` | gorra boxy |
  | `shirt` | `jersey`, `armor` | **camiseta de fútbol** (caja mayor sobre el torso, franja + número) y **peto** (pecho + hombreras) |
  | `pants` | `shinguards` | canilleras simples sobre las piernas |

- Guardado en perfil: `hatId`, `shirtId`, `pantsId` (string; default `none`). Sin precio ni tienda.
- Preview de perfil, player local y avatares coop usan el mismo look. Coop extiende el payload `peer` con `hatId`, `shirtId`, `pantsId` (además de `sex` / `color`).
- Persistencia online: columnas en `players` (`avatar_hat`, `avatar_shirt`, `avatar_pants`, default `'none'`) + API `/api/players/profile` get/update. Sin eso, un login/recover borraría los overlays locales.

### Animación

- Caminar / apuntar / melee 1H: igual que hoy.
- `paired`: brazo derecho melee; izquierdo casi quieto (escudo).
- `twoHand`: ambos brazos siguen la pose de arma (arco ≈ rifle a dos manos; espada larga ≈ melee con los dos brazos).

---

## 4. Weapons, grips, shop

Un `WeaponId` = un equip de tienda.

### Grips

| Grip | Manos | Armas |
|------|--------|--------|
| `right` | solo `rightHand` | knife, pistol, shotgun, rifle (+ `_upgraded`) |
| `paired` | `rightHand` + `leftHand` | `sword_shield` / `sword_shield_upgraded` (espada + escudo) |
| `twoHand` | las dos (un modelo de arma) | `bow`, `longsword` (+ `_upgraded`) |

`WeaponDef` gana `grip: 'right' | 'paired' | 'twoHand'`. Las armas v1 quedan en `right`.

`WeaponKind` se extiende:

```ts
type WeaponKind =
  | 'knife' | 'pistol' | 'shotgun' | 'rifle'
  | 'bow' | 'sword_shield' | 'longsword';
```

`paired` referencia **dos** modelos boxing (`sword` + `shield`). `_upgraded` usa las mismas piezas en materiales gold (como pistola/escopeta/rifle mejorados). `twoHand` referencia **un** modelo (`bow` o `longsword`).

### Combat (stats + visual only)

- Arco ≈ rifle: mismo path ranged; proyectil con mesh de **flecha** (no esfera); un poco más lento / más daño que el rifle base. Sin munición. SFX: reutilizar `playGunshot('rifle')` o un “thwip” corto con el mismo motor de tonos; **no** bloquear por assets de audio nuevos.
- Espadas ≈ cuchillo: melee (`isMelee: true`). Escudo **solo visual**. SFX melee: mismo tono que el cuchillo.
- `playWeaponUpgrade` sigue reciclando los 4 jingles; los ids nuevos entran en `UPGRADE_SFX_ORDER`.
- `zombieHpForWave` **no cambia**.
- Vidas siguen siendo del fuerte. No hay HP de player ni bloqueo.

### Shop numbers (tuneable)

| Id | Nombre | Precio | Daño | Cooldown | Rango |
|----|--------|--------|------|----------|-------|
| sword_shield | Espada y escudo | 20 | 22 | 450ms | 2.8 |
| sword_shield_upgraded | Espada y escudo + | 60 | 40 | 400ms | 3.0 |
| longsword | Espada larga | 35 | 35 | 700ms | 3.2 |
| longsword_upgraded | Espada larga + | 95 | 60 | 650ms | 3.4 |
| bow | Arco | 50 | 50 | 400ms | 45 |
| bow_upgraded | Arco + | 140 | 90 | 360ms | 48 |

Orden en tienda: melee (cuchillo → espadas) y luego ranged (pistola → arco → escopeta → rifle), cada una junta a su mejorada.

Iconos SVG nuevos para arco / espada+escudo / espada larga (y variantes gold si `_upgraded`).

Saves viejos: ids nuevos ausentes se ignoran; default sigue `knife`. Migración de ids españoles de armas v1 se mantiene.

Coop: el payload `weapon` sigue siendo string; el peer reconstruye grip + modelos con `getWeapon` + loader.

---

## 5. Data flow

1. Perfil carga `sex`, `color`, `hatId` / `shirtId` / `pantsId` (local + API) → `buildPlayer` pide base + overlays al loader → ancla en hat/shirt/pants.
2. Equipar arma → `getWeapon` (stats + grip) → loader coloca modelo(s) en `rightHand` / `leftHand`.
3. Disparo/melee: mismo código que hoy; arco entra por el path ranged con flecha visual.
4. Tienda itera `WEAPON_IDS` (v1 + nuevas + upgraded).
5. Coop: cada `peer` publica look completo (`sex`, `color`, overlays) + `weapon`; el receptor reconstruye avatar + grip.

---

## 6. Errors

- Overlay desconocido o corrupto → tratar como `none`.
- Arma desconocida al equipar → `knife`.
- GLB falla → cajas del mismo id si existen; si no, placeholder + `console.warn`.
- Save sin campos de overlay → `none` / `none` / `none`.
- `leftHand` vacío en grip `right` (no dejar basura de un equip anterior).

---

## 7. Testing

- Schema/manifest: cada `WeaponId` y cada overlay dummy tiene catálogo `boxes`.
- Grip: `right` solo slot derecho; `paired` ambos; `twoHand` no deja modelo huérfano en la izquierda.
- `createWeaponModel` / `buildPlayer` no rompen muzzle ni preview de perfil.
- Economía/tienda: nuevos ids comprables y equipables; save viejo migra sin crash.
- `zombieHpForWave` invariante (mismos valores que hoy).
- Overlay inválido en perfil → se ignora (`none`).
- `profileFromApi` / localStorage: perfiles sin overlays → `none`; round-trip API conserva ids válidos.

---

## 8. Out of scope

- Economía / tienda de cosméticos (overlays siguen gratis en perfil).
- Archivos GLB reales (solo la carpeta `public/boxing/` y el branch del loader).
- Migrar zombies/enemigos/entorno al boxing loader.
- Bloqueo de escudo, knockback, ralentizar zombies, munición de arco, draw-time.
- Split extra de huesos (upper/lower arm, manos, pies).
- Cambiar la fórmula de HP de oleadas.

---

## 9. Profile shape (additive)

```ts
interface PlayerProfile {
  // existing: grade, sex, color, displayName
  hatId: string;    // 'none' | 'cap' | …
  shirtId: string;  // 'none' | 'jersey' | 'armor'
  pantsId: string;  // 'none' | 'shinguards'
}
```

Default: `'none'` en los tres. Migración al leer perfil viejo (local + API + columnas SQL default `'none'`).
