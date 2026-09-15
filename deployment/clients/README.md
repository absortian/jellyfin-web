# Clientes nativos Absorflix

La personalización web no cambia la interfaz del cliente oficial de Android TV.

El cliente Absorflix TV está compilado y firmado en el repositorio hermano `/Users/absor/Documents/DEV/absorflix-androidtv`. Ver su [guía de compilación, firma y despliegue](../../../absorflix-androidtv/branding/README.md).

Servidor confirmado: **https://player.absor.top**, Jellyfin 10.11.6. Web pública ya desplegada con release `10.11.6-absorflix-20260914-108a3928`.

Primera entrega nativa: Android/Google TV y Fire TV con Android/Fire OS, app `top.absor.absorflix.tv`, versión preliminar `1.0.0-preview.1`. El instalador del NAS añade la página de descarga y el manifiesto a `/web/absorflix/tv/` del montaje persistente de Absorflix; no reinicia Jellyfin.

La app está publicada en [Descargar Absorflix TV](https://player.absor.top/tv), con manifiesto, código fuente y licencia. Se verificaron las descargas completas y sus SHA-256. Jellyfin no sirve `.apk`; un contenedor Nginx dedicado atiende la ruta pública a través de HAProxy. Consulta la [configuración instalada y el respaldo](tv-hosting/README.md).

Pendiente para el objetivo completo: probar la app y la actualización en los dispositivos físicos del usuario y confirmar qué otras plataformas necesitan cliente propio. No se ha marcado el objetivo como completado.
