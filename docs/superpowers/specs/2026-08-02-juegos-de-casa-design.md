# Juegos de Casa — Design Spec (v1)

**Date:** 2026-08-02  
**Status:** Approved for planning  
**Scope v1:** Hub + shooter de mates (3ª persona) + juego de animales (ver `2026-08-02-animales-design.md`).

---

## 1. Producto

Suite de juegos de navegador en **español** para uso en casa, pensada para:

- Niño ~7 años: shooter que incentiva matemáticas vía economía de monedas.
- Niña ~2 años: juego 2D de animales (drag a sombras); detalle en `2026-08-02-animales-design.md`.

**Nombre provisional:** Juegos de Casa.

**Dispositivos:** PC y tablet desde el día 1 (controles duales).

**Stack:** Vite + TypeScript + Three.js para el mundo 3D; hub / tienda / quiz / login como UI HTML/CSS (overlays DOM). Sin backend. Todo local (`localStorage`).

---

## 2. Arquitectura

Un solo proyecto. Pantallas principales:

1. **Login / crear jugador** (usuario + contraseña local)
2. **Hub** — lista de juegos
3. **Shooter** — canvas Three.js + overlays

### Módulos

| Módulo | Responsabilidad |
|--------|-----------------|
| `auth` | Crear/entrar perfiles locales; aislar datos por jugador |
| `hub` | Menú de juegos; placeholder atenuado del segundo juego |
| `world` | Mapa, fuerte, spawns, colisiones AABB |
| `player` | Movimiento 3ª persona, apuntar, disparar |
| `waves` | Ciclo oleada/descanso, spawns, escalado de HP de zombies |
| `weapons` | Stats de daño/cadencia/alcance; inventario y equipado |
| `economy` | Monedas; precios; compras |
| `shop` | UI tienda + entrada al quiz |
| `quiz` | Pregunta, recompensa visible, intentos, fácil/difícil/salir |
| `math` | Generador de preguntas por tema y nivel de dificultad |
| `save` | Una partida activa por jugador; high score; auto-guardado |
| `input` | Teclado/mouse + joystick/botones táctiles |
| `hud` | Monedas, vidas, oleada, arma, temporizador, high score |

### Hub

- Tarjeta jugable: shooter de mates.
- Tarjeta del juego de animales: **visible pero sombreada/atenuada**, texto **“Próximamente”**, no navegable.

---

## 3. Loop de juego (shooter)

### Mundo

- Estilo visual **bloque / Roblox-like** (geometría simple, sin animaciones complejas).
- Cámara **tercera persona**.
- Arena pequeña con **fuerte en el centro**.
- Zombies spawnean en el borde y caminan hacia el fuerte.
- Colisiones: AABB simples.

### Ciclo de tiempo

- **Oleada:** 1 minuto — zombies activos.
- **Descanso:** 1 minuto — sin amenaza (o spawns detenidos); ventana natural para tienda/quiz.
- Luego siguiente oleada, infinito hasta game over.
- Aviso claro de cambio de fase (“¡Oleada 3!”, “Descanso”).

### Vidas y derrota

- El fuerte tiene **3 vidas**.
- Si un zombie **entra al fuerte:** −1 vida y **termina la ronda actual**: se eliminan los zombies restantes, no hay más castigo en ese momento, y se pasa al **descanso de 1 minuto** (si aún quedan vidas).
- Al perder las **3 vidas:** **game over** (no hay descanso).
- Game over: se **borra la partida guardada** de ese jugador; debe empezar de nuevo.
- El **high score** (mejor oleada alcanzada) **se conserva**.

### Combate y economía básica

- Matar un zombie = **1 moneda**.
- Arma equipada define daño y cadencia.
- Proyectiles / hitscan simples.

### Escalado de resistencia de zombies

Los zombies se vuelven más resistentes entre rondas. El daño de armas se balancea para que armas mejores sean necesarias más adelante.

**Ejemplo de equivalencia (valores de diseño a afinar en implementación):**

| Ronda (ej.) | Resistencia orientativa |
|-------------|-------------------------|
| Ronda 1 | ~3 golpes de cuchillo = 1 tiro de pistola (zombie cae con 1 pistola o 3 cuchillo) |
| Ronda 5 | ~5 tiros de pistola = 1 tiro de escopeta |
| Rondas posteriores | HP sigue subiendo; rifle/escopeta se vuelven la vía eficiente |

Implementación: cada arma tiene un valor de `damage` entero; cada zombie tiene `hp` que escala con el número de oleada (fórmula simple, p.ej. curva lineal o por tramos). Las tablas de “golpes para matar” se validan jugando, no hace falta simular Roblox exacto.

### Tienda en el mundo

- Zona/interacción en el fuerte + botón HUD (sobre todo tablet).
- Regla v1: **abrir tienda o quiz pausa el juego** (temporizador de fase y enemigos congelados).

---

## 4. Tienda, monedas y quiz

### Monedas

- Zombie = 1 moneda (vía secundaria).
- Quiz = N monedas según dificultad (vía principal incentivada).
- Armas se **compran** con monedas (no desbloqueo directo por pregunta).

### Tienda (UI)

- Lista de armas: nombre, precio, daño/rol corto, estado (bloqueada / comprada / equipada).
- Comprar / equipar.
- Botón destacado: **“Ganar más monedas”** → abre el quiz.

### Quiz (UI)

- Muestra: pregunta + **recompensa en monedas** (antes de responder).
- Entrada de respuesta (teclado numérico grande en tablet).
- **3 intentos** sobre la misma pregunta.
  - Si acierta en un intento: gana la recompensa mostrada.
  - Si agota los 3 intentos: **0 monedas** en esa pregunta; puede seguir con otra (misma dificultad o cambiar con fácil/difícil).
- Acciones fijas abajo:
  - **Salir** — vuelve a la tienda.
  - **Más fácil :c** — baja dificultad, nueva pregunta, ajusta recompensa.
  - **Más difícil :D** — sube dificultad, nueva pregunta, ajusta recompensa.

### Temas de mates (elección al iniciar / menú)

- Sumas
- Restas
- Multiplicaciones
- Divisiones fáciles
- Mixto

La dificultad del quiz (fácil/difícil) ajusta rangos numéricos, cantidad de operandos, etc., dentro del tema elegido.

**Recompensas orientativas:** fácil ~3–5, media ~8–12, difícil ~15–25 monedas (visibles siempre; números finales tuneables).

---

## 5. Armas v1

| Arma | Rol | Precio (aprox.) |
|------|-----|-----------------|
| Cuchillo | Melee corto; **gratis al inicio** | 0 |
| Pistola | Equilibrio | 15 |
| Escopeta | Alto daño, más lenta | 40 |
| Rifle | Rápida, daño medio-alto | 70 |

Precios y `damage` se calibran para cumplir el escalado de la sección 3.

---

## 6. Controles

### PC

- WASD / flechas: mover
- Mouse: cámara / apuntar
- Clic: disparar
- E o botón: tienda
- Esc: pausa

### Tablet

- Joystick virtual izquierdo: mover
- Arrastre zona derecha: cámara
- Botón grande de disparo
- Botón Tienda siempre en HUD
- Quiz con teclado numérico en pantalla

### HUD

Monedas, vidas (3), oleada, arma actual, temporizador de fase (oleada/descanso), high score del jugador.

---

## 7. Cuentas y guardado (todo local)

### Auth

- Crear jugador: usuario + contraseña.
- Entrar con usuario + contraseña.
- Varios perfiles en el mismo navegador; datos aislados por `userId`/nombre.
- Contraseña: hash básico en cliente. Sin recuperación de contraseña en v1 (se pueden borrar datos del sitio si hace falta en casa).
- **No hay servidor.**

### Persistencia por jugador

- **Una sola partida activa** a la vez.
- Contenido de partida: oleada, fase (oleada/descanso) + tiempo restante, vidas, monedas, armas compradas, arma equipada, tema de mates, dificultad actual del quiz (opcional).
- **High score:** mejor oleada alcanzada (persiste tras game over).
- Auto-guardar: al entrar en descanso, al comprar, al pausar / salir al menú.
- Hub: “Continuar” si hay partida; si no, “Nueva partida”.
- Game over: elimina partida activa; high score se mantiene.

---

## 8. Fuera de v1

- Juego 2D de animales (drag a sombras) — solo placeholder en hub.
- Modo historia / misiones.
- Multijugador.
- Skins, más mapas, más armas.
- Cuentas en servidor / sync entre dispositivos.
- Audio elaborado (SFX mínimos opcionales si hay tiempo).

---

## 9. Criterios de éxito v1

1. Un niño de ~7 puede entrar con su usuario, jugar oleadas, abrir tienda y ganar monedas con el quiz sin ayuda constante.
2. Las mates son claramente la forma más rápida de conseguir armas mejores.
3. En tablet los botones y el quiz son usables con el dedo.
4. Cerrar y reabrir el navegador permite continuar la partida del mismo jugador.
5. Game over borra la partida pero conserva el high score.
6. El hub muestra el segundo juego atenuado con “Próximamente”.

---

## 10. Notas de implementación (límites)

- Gráficos y mecánicas simples a propósito.
- Sin motor de físicas avanzado.
- Balance de HP/daño y precios: datos en un solo archivo de config para tunear sin reescribir lógica.
- El segundo juego se añadirá después reutilizando `auth`, `hub` y el shell Vite.
