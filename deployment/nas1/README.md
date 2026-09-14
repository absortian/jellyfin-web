# Absorflix en NAS1

Destino: `root@192.168.1.110`, Compose en `/mnt/user/system/docker-compose/jellyfin_new`.
Imagen conservada: `linuxserver/jellyfin:10.11.6`.

El paquete se compila desde la rama `absorflix/10.11.6`, basada en el tag oficial
`v10.11.6`. El árbol de trabajo está en `../jellyfin-web-10.11.6`.
No se debe desplegar el `dist` de la rama de desarrollo 12.0 como este paquete.

El instalador añade `docker-compose.override.yml`, que Compose carga por defecto.
Monta la carpeta `web` de la versión en `/usr/share/jellyfin/web`, en modo de solo
lectura. Conserva el Compose original, la imagen, `/config`, `/data`, los puertos,
el mod OpenCL y `/dev/dri`. Recrear el contenedor interrumpe las reproducciones activas.
Si ya existe un override de otro origen, el instalador se detiene para revisarlo.

## Instalación

1. Copiar el archivo `absorflix-web-10.11.6-*.tar.gz` al NAS, por ejemplo mediante
   `scp`, SMB o el administrador de archivos de Unraid.
2. Crear una carpeta nueva dentro de
   `/mnt/user/system/docker-compose/jellyfin_new/absorflix/releases/` y extraer allí
   el paquete con `tar -xzf /ruta/al/paquete.tar.gz -C /ruta/a/la/version`.
3. Ejecutar `bash /ruta/a/la/version/deploy.sh` como root.

El script verifica los hashes, la versión del servidor y la configuración de
Compose. Comprueba la API y la identificación de la web servida tras el reinicio;
restaura el override anterior si falla. La carpeta extraída debe conservarse:
contiene la web montada y el estado necesario para deshacer el despliegue.

Para volver atrás: `bash /ruta/a/la/version/rollback.sh`.
Los arranques posteriores deben usar Compose desde el directorio original, sin
omitir el override mediante un `-f docker-compose.yml` aislado. Al actualizar
Jellyfin, preparar primero una web Absorflix compatible con esa versión.

## Comprobación desde los clientes

- Abrir `http://192.168.1.110:8096/web/` y hacer una recarga completa.
- En Android, cerrar completamente la app oficial y volver a abrirla. Si conserva
  archivos web antiguos, borrar solo la caché de la app y reconectar al servidor.
- Verificar inicio de sesión, biblioteca, inicio y reanudación de una película,
  subtítulos, calidad y paso al siguiente episodio.
- En la app oficial Android, la intro se muestra en el WebView antes de entregar
  la reproducción a ExoPlayer o al reproductor externo. Las transiciones de
  episodios que ExoPlayer gestione internamente no pasan por este código.
- Android TV, Findroid y otros clientes totalmente nativos requieren su propia
  integración. No heredan esta interfaz web.
- No se introduce la intro en TV en directo, tráileres, SyncPlay o casting. Si el
  navegador bloquea el audio, la animación termina y permite continuar.

Fuentes: [LinuxServer](https://docs.linuxserver.io/images/docker-jellyfin/),
[arranque del contenedor](https://github.com/linuxserver/docker-jellyfin/blob/master/root/etc/s6-overlay/s6-rc.d/svc-jellyfin/run),
[puente Android](https://github.com/jellyfin/jellyfin-android/blob/master/app/src/main/assets/native/ExoPlayerPlugin.js).
