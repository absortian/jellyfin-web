# Absorflix TV: código y versión publicada

Versión **1.0.0-preview.3**, código **3**, aplicación `top.absor.absorflix.tv`.
Descarga: **https://player.absor.top/tv**. También aparece desde el login web.
La app instalada consulta la actualización desde Ajustes → Acerca de →
Actualizaciones de Absorflix. Android pide confirmar la instalación.

Esta versión declara el banner horizontal como banner, logo e icono del acceso
de TV y de su alias antiguo. Los launchers que consultan el icono de la actividad
reciben ahora el logotipo completo en 16:9. El icono cuadrado adaptativo de la
aplicación se conserva para ajustes e instalación. No modifica el código de
reproducción ni la intro respecto a preview.2; mantiene la misma firma para
actualizar sin desinstalar.

También incluye una [imagen Fire TV de 1280×720](https://player.absor.top/web/absorflix/tv/absorflix-tv-1.0.0-preview.3-fire-tv-tile.png),
opaca y con el logotipo dentro del área segura central de 882×448.
La imagen de una ficha de Amazon Appstore se entrega por separado del icono del
APK. Los launchers de Fire TV pueden aplicar su propio tratamiento a apps
instaladas manualmente; no se garantiza el mismo aspecto en todos los modelos.
No se ha publicado una ficha de Amazon Appstore. Referencias oficiales:
[Android TV](https://developer.android.com/design/ui/tv/guides/system/tv-app-icon-guidelines)
y [recursos Fire TV de Amazon](https://developer.amazon.com/docs/app-submission/appstore-details.html).

## Código reproducible

`absorflix-tv.patch` contiene la personalización nativa completa, incluidos la
intro, recursos, actualización, empaquetado, pruebas y guía de compilación.
Se aplica sobre Jellyfin Android TV **v0.19.10**, commit
`984181a3d6ab14e9a6d2dcc850c582e1c138bd95`:

```sh
git clone --branch v0.19.10 https://github.com/jellyfin/jellyfin-androidtv.git absorflix-androidtv
cd absorflix-androidtv
git apply /ruta/jellyfin-web/deployment/clients/androidtv/absorflix-tv.patch
```

Consulta `branding/README.md` en el árbol resultante. Requiere JDK 21 y Android SDK.
`branding/release.py` genera cada versión en una carpeta nueva y rechaza reemplazar
una salida existente. Para actualizar instalaciones existentes hay que reutilizar
la clave privada original; no está en este repositorio ni en los paquetes públicos.
La aplicación de este parche se comprobó en un checkout limpio del commit base;
los **1054 archivos** incluidos en la distribución coinciden byte a byte con el
código fuente publicado junto al APK.

El [código fuente correspondiente al APK](https://player.absor.top/web/absorflix/tv/absorflix-tv-1.0.0-preview.3-source.tar.gz)
tiene SHA-256 `cab1ada1980d84952945575fcb8fefdc8ef4a54c1f6ee68c7c0ce3724e2409a9`.
El APK tiene 21 872 219 bytes y SHA-256
`16a981d3000c892c8e11fe2ec6ddee4fb31e064c0501679bd1493e52a26b13f0`.

## Despliegue y validación

Paquete y extracción conservados en NAS1:
`/mnt/user/system/docker-compose/jellyfin_new/absorflix-tv3-banner-20260915-DlEhxJ/`.
El instalador conserva las versiones anteriores y respalda página/manifiesto antes
de publicar. Jellyfin mantuvo su fecha de arranque; no se cambiaron credenciales.

- Compilación release correcta; firma idéntica a preview.1 y preview.2.
- Manifiesto del APK inspeccionado con `aapt2`: el acceso principal referencia el
  PNG del banner; el icono de aplicación continúa siendo el recurso adaptativo.
- Emulador Android TV API 31: actualización con `adb install -r` de código 2 a 3,
  conservando la fecha de primera instalación. Banner completo visible en la fila
  de aplicaciones, selección con mando y apertura del cliente desde ese acceso.
- Imagen Fire TV verificada como PNG RGB opaco de 1280×720 y revisada visualmente.
- Los siete archivos públicos se descargaron por HTTPS con HTTP 200 y SHA-256
  idéntico al paquete local. `/tv` y `latest.json` anuncian preview.3; los APK
  preview.1 y preview.2 siguen disponibles y conservan sus hashes.
- Comparación con el fuente de preview.2: sólo cambian manifiesto, versión,
  generador, empaquetado, documentación y el nuevo recurso Fire TV. El código de
  reproducción, intro y audio permanece idéntico.

La versión anterior pasó 19 pruebas unitarias y la actualización preview.1 →
preview.2 desde la pantalla de actualizaciones de la propia app. No se repitieron
pruebas de reproducción para este cambio de recursos de launcher.

Queda comprobar el resultado en un Fire Stick físico. El APK cubre Android TV,
Google TV y Fire TV con Android/Fire OS. Otros sistemas y el cliente oficial de
Jellyfin TV necesitan su propia integración.
