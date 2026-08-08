# Admin (solo dev)

No hay enlace en el hub. La ruta no está pensada para jugadores.

- URL local: `http://localhost:3000/ops-k7m2x9`
- URL prod: `https://<tu-dominio>/ops-k7m2x9`

Login (lo que escribís en la pantalla):

- Usuario: `admin`
- Contraseña inicial: `JdcOps#8k2mNq`

Supabase Auth no acepta `admin` como email. Por debajo el usuario es `admin@juegos.local`. `ADMIN_EMAIL=admin` cuenta como el mismo.

Si el login falla, corre `node scripts/ensure-admin.mjs`.
