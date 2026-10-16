# CinePlus Panamá — prototipo

Este proyecto es un prototipo web móvil con catálogo de demostración, búsqueda, fichas, enlaces a servicios legales y una pantalla ilustrativa de cuenta/suscripción.

## Importante
- **No procesa pagos reales.**
- **No crea cuentas reales ni ofrece autenticación segura todavía.**
- La prueba de 8 días solo está descrita como flujo de interfaz; no está implementada como control de acceso de servidor.
- Los títulos incluidos son ejemplos ficticios. Antes de publicar contenido real, confirma derechos y permisos de distribución.
- No se incluyen películas comerciales ni enlaces de reproducción no autorizados.

## Publicar gratis con GitHub Pages
1. Crea un repositorio público en https://github.com/new, por ejemplo `cineplus-panama`.
2. Sube `index.html`, `manifest.json`, `sw.js` y este README a la raíz del repositorio.
3. En el repositorio, abre **Settings → Pages**.
4. En **Build and deployment**, selecciona **Deploy from a branch**.
5. Selecciona la rama `main` y la carpeta `/ (root)`, guarda.
6. Espera a que GitHub publique el sitio y abre la URL mostrada en Settings → Pages.

GitHub Pages sirve sitios estáticos. No puede gestionar por sí solo cuentas privadas, suscripciones seguras ni webhooks de pagos.

## Siguiente etapa para una versión comercial
- Añadir Supabase Auth y tablas con políticas Row Level Security.
- Controlar trial_start y trial_end en servidor y limitar la prueba a una vez por usuario, con controles antifraude razonables.
- Integrar un proveedor de pagos que acepte comerciantes en Panamá, usando una función de servidor/webhook para validar pagos.
- No guardar claves secretas ni confiar en el estado de suscripción enviado por el navegador.
- Probar cancelaciones, fallos de pago, expiración y seguridad antes de cobrar a clientes.
