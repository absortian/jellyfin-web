# Absorflix TV: código y versión publicada

Versión **1.0.0-preview.4**, código **4**, aplicación `top.absor.absorflix.tv`.
Descarga: **https://player.absor.top/tv**. También aparece desde el login web.
La app instalada consulta la actualización desde Ajustes → Acerca de →
Actualizaciones de Absorflix. Android pide confirmar la instalación.

Cuando un launcher consulta el icono principal de aplicación, preview.3 todavía
entregaba el icono cuadrado adaptativo: sólo el acceso de TV tenía el banner.
Preview.4 cambia también `application android:icon` a `@mipmap/app_banner`.
ApplicationInfo y ResolveInfo entregan ahora el logotipo completo en 16:9.
Los menús del sistema que impongan un marco cuadrado podrán ajustar la imagen
a ese marco. No modifica la reproducción ni la intro; conserva la misma firma
para actualizar sin desinstalar.

También incluye una [imagen Fire TV de 1280×720](https://player.absor.top/web/absorflix/tv/absorflix-tv-1.0.0-preview.4-fire-tv-tile.png),
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
los **1056 archivos** incluidos en la distribución coinciden byte a byte con el
código fuente publicado junto al APK.

El [código fuente correspondiente al APK](https://player.absor.top/web/absorflix/tv/absorflix-tv-1.0.0-preview.4-source.tar.gz)
tiene SHA-256 `dd1c7f9a93e9aad057ac24af6f5ac1e7f0dd6ee095d951b8d122034a8cb3c5c2`.
El APK tiene 21 872 210 bytes y SHA-256
`d9887d7328d860527b0e8612f75a767de7f68e44932c87bacc4a1c2e3f334683`.

## Despliegue y validación

Paquete y extracción conservados en NAS1:
`/mnt/user/system/docker-compose/jellyfin_new/absorflix-tv4-app-icon-20260915-zztdqr/`.
El instalador conserva las versiones anteriores y respalda página/manifiesto antes
de publicar. Jellyfin mantuvo su fecha de arranque; no se cambiaron credenciales.

- Compilación release correcta; firma idéntica a las tres versiones anteriores.
- Manifiesto del APK inspeccionado con `aapt2`: tanto la aplicación como el
  acceso principal referencian el PNG del banner.
- Prueba externa `branding/check_launcher_icons.py`, usando PackageManager sobre
  el APK release instalado en Android TV API 31: preview.3 falla porque
  ApplicationInfo devuelve AdaptiveIconDrawable de 144×144; preview.4 pasa las
  siete comprobaciones, todas BitmapDrawable de 320×180. Comprueba también los
  accesos LAUNCHER y LEANBACK_LAUNCHER. No simula la interfaz de Amazon.
- Actualización con `adb install -r` de código 3 a 4, conservando la fecha de
  primera instalación; el cliente abre correctamente tras actualizar.
- Los siete archivos públicos se descargaron por HTTPS con HTTP 200 y SHA-256
  idéntico al paquete local. `/tv` y `latest.json` anuncian preview.4; los APK
  preview.1, preview.2 y preview.3 conservan sus hashes y siguen disponibles.
- Comparación con el fuente de preview.3: sólo cambian manifiesto, versión,
  documentación y las dos herramientas de diagnóstico externas al APK. El código
  de reproducción, intro y audio permanece idéntico.

Preview.2 pasó 19 pruebas unitarias y la actualización preview.1 →
preview.2 desde la pantalla de actualizaciones de la propia app. No se repitieron
pruebas de reproducción para este cambio de recursos de launcher.

El usuario comunicó que preview.3 seguía mostrándose cuadrada. Preview.4 corrige
la consulta de ApplicationInfo que no se había validado antes. Queda comprobar
el resultado en el dispositivo físico: el marco que dibuja el launcher de
Amazon no se puede verificar con el emulador Android TV. El APK cubre Android TV,
Google TV y Fire TV con Android/Fire OS. Otros sistemas y el cliente oficial de
Jellyfin TV necesitan su propia integración.
