# Fire TV: encuadre del logo en el menú de Amazon

## Resultado confirmado

La foto facilitada del dispositivo muestra la fila de aplicaciones del menú
oficial de Fire TV. Absorflix ocupa una tarjeta rectangular, pero el logotipo
queda comprimido dentro de un cuadrado oscuro y el menú añade dos franjas
grises laterales. La versión preview.4 aparece registrada en Jellyfin.

Preview.3 modificó el icono de la actividad. Preview.4 modificó también el de
ApplicationInfo. Ambas versiones contienen el banner 16:9, pero ninguna ha
resuelto el encuadre del menú mostrado en la foto.

La prueba `check_launcher_icons.py` sólo comprueba los drawables entregados por
PackageManager. No comprueba los límites, el escalado ni el fondo dibujados por
el launcher propietario de Amazon. No debe usarse como prueba de que este
problema visual está resuelto.

## Causa y alcance

El resultado observado coincide con el tratamiento de iconos de aplicaciones
instaladas por APK en Fire TV: se utiliza un área cuadrada dentro de la tarjeta.
Declarar `android:banner`, `android:logo` o un `android:icon` rectangular no
modifica el área que el launcher reserva para ese icono.

La documentación de Amazon distingue el icono del manifiesto de la imagen de
Appstore para Fire TV. Esta última es un PNG opaco de 1280×720 utilizado en la
fila de aplicaciones. Un reporte reproducible de otro cliente describe el
mismo resultado: icono cuadrado y bandas grises pese a incluir un banner 16:9.

- [Amazon: recursos de Appstore y Fire TV](https://developer.amazon.com/docs/app-submission/appstore-details.html)
- [Reporte de reproducción en Fire TV OS 8](https://github.com/NuvioMedia/NuvioTV/issues/2347)

## Vía para ocupar la tarjeta completa

Manteniendo el menú oficial, la vía de distribución es una ficha de Amazon
Appstore con su imagen Fire TV de 1280×720. Requiere acceso a una cuenta de
Amazon Developer y completar el proceso de publicación de Amazon; desplegar
otro APK en el NAS no crea esa ficha ni cambia las imágenes de Amazon.

El recurso de Absorflix está preparado y publicado:

[absorflix-tv-1.0.0-preview.4-fire-tv-tile.png](https://player.absor.top/web/absorflix/tv/absorflix-tv-1.0.0-preview.4-fire-tv-tile.png)

- PNG RGB, 1280×720, sin transparencia.
- Logo original dentro del área segura central de 882×448.
- SHA-256: `2778a24669e51f005769255407230b807fbfcc1c6eb8cc848fe59bca6e61dd98`.

Este recurso por sí solo no constituye una entrega completa a Appstore. Quedan
la cuenta, la ficha, el resto de materiales y requisitos de publicación, y la
verificación del resultado de esa distribución. No se ha enviado ni publicado
ninguna ficha de Amazon Appstore.

Un icono transparente o con fondo gris podría disimular las franjas, pero
seguiría limitado al área cuadrada. No cumpliría la petición de ocupar toda la
tarjeta y no debe presentarse como una solución completa.

El usuario ha rechazado conexiones al Fire TV. El diagnóstico continúa con la
foto proporcionada y los artefactos locales; no requiere acceso al dispositivo.
