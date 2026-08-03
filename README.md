# Juegos de Casa

Suite de juegos de navegador en español para jugar en casa (PC y tablet).

## v1

- Login local (usuario + contraseña en el navegador)
- Hub con **Fuerte de Mates** y **Animales** (arrastrar a sombras)
- Shooter 3ª persona: defiende el fuerte, oleadas de 1 minuto + descanso de 1 minuto
- Tienda de armas y quiz de matemáticas para ganar monedas
- Animales: SVG grandes, rondas de 3–4, modos Libre / Suave / Guiado
- Guardado y récord de oleada en `localStorage`

## Estructura del código

```
src/
  app/                 # Router / shell de la suite
  config/              # Constantes de juego
  shared/              # Utilidades compartidas (DOM, device)
  domain/              # Lógica pura (auth, save, score, math, economy, quiz, weapons, waves, animals)
  game/
    GameSession.ts     # Orquestación de una partida (shooter)
    animals/           # Sesión DOM del matching de animales
    input/             # Controles teclado/mouse/touch
    ui/
      screens/         # Login, hub
      overlays/        # Tienda, quiz, pausa, game over, ajuste animales
      hud.ts
    world/             # Three.js: mundo, player, zombies, proyectiles, entorno
  styles/
```

Alias de imports: `@/` → `src/` (ej. `import { World } from '@/game/world'`).

## Comandos

```bash
npm install
npm run dev      # http://localhost:5173
npm test
npm run build
```

## Controles

**PC:** WASD/flechas mover, mouse mirar (clic para pointer lock), clic disparar, E tienda, Esc pausa.

**Tablet:** joystick izquierdo, zona derecha para mirar, botones Disparar / Tienda / Pausa.

## Resetear datos

En el navegador: borrar datos del sitio (localStorage) para eliminar jugadores y partidas.
