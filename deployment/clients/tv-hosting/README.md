# Descargas de Absorflix TV en NAS1

Publicado el 15 de septiembre de 2026:

- Acceso corto: https://player.absor.top/tv
- Página: https://player.absor.top/web/absorflix/tv/index.html
- Manifiesto: https://player.absor.top/web/absorflix/tv/latest.json
- APK: `absorflix-tv-1.0.0-preview.1.apk`, 21 870 974 bytes.
- SHA-256: `64e4a8b4c12c61c4a68ccffc07b4ce68f1fa59c81ed1b0084a191345c7a7db96`.

Jellyfin 10.11.6 devuelve 404 para `.apk`, aunque el archivo exista en su montaje web. Este contenedor Nginx sirve la carpeta de descargas con el tipo `application/vnd.android.package-archive`. Sólo escucha en `127.0.0.1:18967` del NAS; HAProxy publica la ruta del dominio existente.

## Despliegue instalado

Configuración del servicio:

`/mnt/user/system/docker-compose/jellyfin_new/absorflix-tv-hosting/`

Carpeta de archivos, montada como `/downloads` en modo de sólo lectura:

`/mnt/user/system/docker-compose/jellyfin_new/absorflix/releases/10.11.6-108a3928/web/absorflix/tv`

Se añadieron estas reglas a `web_443_frontend`, antes de `use_backend plex_backend if plex_host`:

```haproxy
acl absorflix_tv_path path_beg /web/absorflix/tv/
use_backend absorflix_tv_backend if plex_host absorflix_tv_path
```

Después de declarar `plex_host`, una redirección ofrece la dirección corta:

```haproxy
http-request redirect location /web/absorflix/tv/index.html code 302 if plex_host { path /tv /tv/ }
```

Y este backend:

```haproxy
backend absorflix_tv_backend
    mode http
    option httpchk GET /web/absorflix/tv/latest.json
    http-check expect status 200
    server absorflix_tv 127.0.0.1:18967 check
```

La configuración original de HAProxy se conserva en:

`/mnt/user/system/docker-compose/jellyfin_new/absorflix-tv-deploy-20260915-vf5j6Z/haproxy.before-absorflix-tv.cfg`

El paquete completo, su extracción y el candidato de HAProxy están en ese mismo directorio. El archivo `.part` del intento anterior también se conserva. El despliegue añadió un contenedor y una ruta; no cambió credenciales, eliminó archivos ni reinició Jellyfin. HAProxy se recargó después de validar la sintaxis.

## Actualizar

El instalador `branding/install-nas.sh` del repositorio `absorflix-androidtv` publica las versiones en la carpeta del montaje web. Nginx ve los nuevos archivos al instante. Usa siempre un número de versión y código superiores, manteniendo la clave de firma privada.

Si se cambia el montaje de Jellyfin a una nueva versión web, copia primero las descargas al nuevo montaje y ajusta `ABSORFLIX_TV_DIRECTORY` en un archivo `.env` de este servicio. Después aplica `docker compose up -d` desde este directorio. Conserva los archivos y configuraciones anteriores como respaldo.

## Verificación realizada

Se descargaron por HTTPS los seis archivos públicos (página, manifiesto, APK, fuente, licencia y logo), con HTTP 200 y SHA-256 idéntico al paquete local. El APK se entrega con el tipo MIME correcto. La API pública de Jellyfin continuó respondiendo tras recargar HAProxy. El APK release instalado en un emulador Android TV consultó el manifiesto público y mostró que ya tenía la última versión. La actualización entre dos versiones y la validación en televisores físicos siguen pendientes.
