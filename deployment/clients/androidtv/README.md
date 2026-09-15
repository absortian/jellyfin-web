# Absorflix TV: código y versión publicada

Versión **1.0.0-preview.2**, código **2**, aplicación `top.absor.absorflix.tv`.
Descarga: **https://player.absor.top/tv**. También aparece desde el login web.
La app instalada consulta la actualización desde Ajustes → Acerca de →
Actualizaciones de Absorflix. Android pide confirmar la instalación.

Esta versión elimina la pausa del logo y mantiene el zoom en movimiento durante
el fundido hacia las luces, con las mismas curvas y tiempos relativos que la web.
Dos planos de luces se desplazan de forma independiente. Los shaders y sus colores
se preparan una vez, fuera de `onDraw`, y la animación empieza al preparar el audio.
Conserva el audio original, el logo vectorial, los controles OK/Atrás y la firma
de la versión 1. No requiere desinstalar la versión anterior.

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
los 1053 archivos resultantes incluidos en la distribución coinciden byte a byte
con el código fuente publicado junto al APK.

El [código fuente correspondiente al APK](https://player.absor.top/web/absorflix/tv/absorflix-tv-1.0.0-preview.2-source.tar.gz)
tiene SHA-256 `28889e0026595811119e732abc922e644ab4ae115a943564ccd0b531925caff1`.
El APK tiene 21 872 160 bytes y SHA-256
`d0ba3a5905622f7a21be1be7275935aaa17701141acf856a269254f0760df111`.

## Despliegue y validación

Paquete y extracción conservados en NAS1:
`/mnt/user/system/docker-compose/jellyfin_new/absorflix-tv2-smooth-20260915-oLOI5b/`.
El instalador conserva la versión anterior y respalda página/manifiesto antes de
publicar. Jellyfin mantuvo su fecha de arranque; no se cambiaron credenciales.

- Debug y release compilados; 19 pruebas unitarias correctas.
- Firma idéntica a preview.1, audio idéntico al original.
- Emulador Android TV API 31: intro completa, OK omite y Atrás cancela.
- `gfxinfo` durante la intro: percentil 95 del renderizado de 18 ms antes y 6 ms
  después en esta ejecución del emulador. No garantiza FPS en televisores físicos.
- Los 35 errores de lint existentes corresponden al upstream, sin errores en la
  personalización de branding; el build configura `abortOnError=false`.
- APK, fuente, página, manifiesto, licencia y logo descargados por HTTPS y sus
  hashes comprobados. `/tv` anuncia preview.2; el APK preview.1 conserva su hash.
- Actualización real de preview.1 a preview.2 desde la pantalla de actualizaciones
  de la app en Android TV API 31: descarga del dominio público, permiso de origen,
  confirmación del instalador Android y código 2 instalado, manteniendo la fecha
  de primera instalación. No se desinstaló la versión anterior.

Queda la validación en televisores físicos: reproducción, mando, subtítulos,
HDR/sonido multicanal, siguiente episodio y reproductores externos. El APK cubre
Android TV, Google TV y Fire TV con Android/Fire OS. Otros sistemas y el cliente
oficial de Jellyfin TV necesitan su propia integración.
