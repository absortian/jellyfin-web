# Absorflix en NAS1

Destino: `root@192.168.1.110`, Compose en `/mnt/user/system/docker-compose/jellyfin_new`.
Imagen conservada: `linuxserver/jellyfin:10.11.6`.

La configuración NVIDIA del servidor y su verificación están documentadas en
[nvidia.md](nvidia.md). Conservar estos ajustes al recrear Jellyfin.

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

## Actualizar la web sin recrear el contenedor

Para cambios del cliente compatibles con el servidor 10.11.6, se puede compilar
en una carpeta nueva y empaquetarla con
`python3 deployment/nas1/package.py --dist-dir /ruta/a/la/compilacion`.
Esto conserva el `dist` anterior. Copia el paquete y `apply-web-overlay.sh` al NAS,
extrae el paquete en una carpeta nueva y ejecuta
`bash apply-web-overlay.sh /ruta/a/la/version/extraida`.

El script verifica el paquete y el montaje activo, respalda cada archivo que
sustituye en `overlay-backup/web`, conserva los archivos adicionales (incluidos
los APK) y publica `index.html` después de sus recursos. Si falla, restaura los
archivos anteriores sin eliminar los recursos añadidos. No cambia Compose ni
reinicia Jellyfin. Comprueba después la pantalla afectada y la descarga de la app.

El enlace **Descargar la app para TV** del login apunta a
`https://player.absor.top/tv`, está disponible sin iniciar sesión y mantiene el
acceso por teclado y mando. La plantilla, estilos y traducciones de `master`
se aplicaron también al árbol 10.11.6 antes de compilar.

Despliegue del enlace: `10.11.6-absorflix-20260915-44ea57a5`.
Paquete, script y archivos originales conservados en NAS1:
`/mnt/user/system/docker-compose/jellyfin_new/absorflix-login-link-20260915-bCsQag/`.
Los archivos sustituidos están en `release/overlay-backup/web/` dentro de esa ruta.
El ajuste final de foco se aplicó como una corrección de ocho archivos sobre la
primera compilación verificada; su respaldo está en `final-release/overlay-backup/web/`.
El paquete completo final también se conserva en `deployment/artifacts/` del proyecto.
Validado con la compilación de producción 10.11.6, Stylelint, ShellCheck y tres
pruebas del overlay (conservación, rechazo de corrupción y recuperación ante fallo).
En el login público se comprobó Tab → foco visible → Enter → página de descarga;
el APK conservó su SHA-256 y Jellyfin no se reinició.

La mejora de fluidez de la intro está publicada como
`10.11.6-absorflix-20260915-332c13f5`. Se separaron el zoom y los fundidos para
evitar frenadas entre fases, y las luces se mueven en dos planos. La comparación
del componente en Chrome (1512 × 744) midió una pausa visible del logo de 1208 ms
antes y 0 ms después; es una medida del movimiento, no una garantía de FPS en TV.
Pasaron las 17 pruebas de intro, Stylelint y la compilación de producción 10.11.6.
Se verificaron el hash del CSS público y su carga en Chrome, la API y `/tv`.
El overlay actualizó tres archivos web, conservando los originales en
`/mnt/user/system/docker-compose/jellyfin_new/absorflix-intro-smooth-20260915-sbUz5I/release/overlay-backup/`.
El contenedor mantuvo su fecha de arranque. El APK nativo usa su propia intro.

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
