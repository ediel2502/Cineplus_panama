CINEPLUS PANAMÁ — DEMO PARA PROBAR
Sube index.html, manifest.json y sw.js a la raíz de tu repositorio GitHub Pages y espera la publicación. Luego abre https://ediel2502.github.io/Cineplus_panama/ .
Prueba con tu cuenta Supabase. La reproducción de Big Buck Bunny exige sesión y una fila vigente devuelta por check_my_subscription().
LÍMITES: no hay pagos reales, canales IPTV reales ni películas comerciales/adultas incluidas. Solo hay un vídeo de muestra externo; las otras fichas son 
demostraciones. El control del navegador no protege una URL pública contra extracción. Para producción hace falta backend que valide pagos y entregue vídeos privados mediante URLs firmadas. No introduzcas datos de tarjeta en esta demo. Verifica licencias antes de cualquier uso comercial. La clave incluida es una clave pública publishable; nunca publiques una service_role/secret key.


# Configurar pagos con tarjeta en CinePlus Panamá

## Proveedor elegido para preparar la integración
PagueloFacil ofrece checkout alojado para tarjetas Visa/Mastercard y separa credenciales de pruebas y producción. Esta integración redirige al checkout del proveedor: CinePlus no recoge ni almacena números de tarjeta o CVV.

## Antes de activar pagos reales
1. Formaliza el negocio y confirma los requisitos del comercio. La guía del MICI explica el Aviso de Operación, los datos de contacto, términos/condiciones, política de privacidad y uso de un procesador de pagos: https://mici.gob.pa/comercio-por-internet-2/
2. Solicita afiliación de comercio en https://app.paguelofacil.com/ o consulta sus documentos oficiales: https://developers.paguelofacil.com/guias/enlace-de-pago
3. Pide credenciales separadas de sandbox y producción. No pegues credenciales en `index.html`, GitHub, capturas ni este chat.
4. En el proyecto Supabase asociado a CinePlus, abre SQL Editor y ejecuta `supabase/migrations/202610200001_payment_orders.sql`.
5. Instala Supabase CLI en un entorno con terminal y vincula el proyecto; despliega la función:
   `supabase functions deploy create-card-checkout`
6. Configura los secretos de la función desde el panel de Supabase (Edge Functions > Secrets) o CLI:
   - `PAGUELOFACIL_CCLW` = código web asignado al comercio.
   - `SUPABASE_URL`, `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` = valores del proyecto Supabase. La service role solo debe existir en el servidor.
7. Prueba primero con las credenciales sandbox y las tarjetas de prueba publicadas por PagueloFacil. No uses tarjetas reales durante pruebas.
8. Antes de activar suscripciones, solicita a PagueloFacil la configuración de webhook. El webhook debe validar el evento con el mecanismo acordado con el proveedor, comprobar importe, moneda, order id y operación, y solo entonces marcar la orden como pagada y activar acceso. No se debe confiar en la URL de retorno del navegador.
9. Confirma con PagueloFacil si tu afiliación permite cobros recurrentes automáticos. El checkout de pago único de esta primera función cobra USD 3 por una orden; no renueva mensualmente ni activa el período de prueba por sí solo.

## Estado actual
- El botón de tarjeta invoca `create-card-checkout` y redirige a un checkout seguro solo si la función responde con una URL de PagueloFacil.
- La función y la migración son archivos preparados en GitHub, pero deben desplegarse/ejecutarse en Supabase y configurarse las credenciales antes de que funcionen.
- El retorno del checkout no activa la suscripción. Falta integrar y verificar el webhook oficial antes de habilitar acceso pagado.
- No hay secretos reales en este repositorio.

## Checkout manual (Yappy, transferencia y PayPal)

Se añadió una solicitud de pago con revisión manual. La aplicación **no cobra automáticamente** ni activa acceso al enviar una referencia; el administrador debe verificar el movimiento y activar el usuario.

1. En Supabase SQL Editor, ejecuta `supabase/migrations/202610210001_manual_payment_requests.sql`.
2. Despliega la función: `supabase functions deploy create-manual-payment-request`.
3. Confirma que los secretos `SUPABASE_URL`, `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` estén configurados en Edge Functions. La clave `service_role` nunca se pone en el navegador.
4. Comparte dentro de la app los datos de cobro oficiales de CinePlus (número Yappy comercial, cuenta bancaria o enlace PayPal). Aún deben configurarse; no se inventan números ni enlaces.
5. Revisa las filas nuevas de `public.manual_payment_requests`. Solo después de comprobar el pago, marca la solicitud como revisada y activa manualmente la suscripción en la tabla que usa la función RPC `check_my_subscription`. Esta activación final depende del esquema de suscripciones que tengas configurado en tu proyecto Supabase.

**Importante:** el checkout manual registra una solicitud y una referencia, no demuestra que el dinero haya llegado. No se debe activar una cuenta solo porque el usuario escribió un número de operación. La tarjeta queda deshabilitada hasta conectar un procesador real.
