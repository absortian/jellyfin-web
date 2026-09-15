# NVIDIA en NAS1

El 15 de septiembre de 2026, Jellyfin tenía NVENC activado, pero su contenedor
usaba `runc` sin inyección de las bibliotecas NVIDIA. Los intentos de convertir
«Chicas malas» fallaban antes de generar vídeo con `Cannot load libcuda.so.1`
y código de salida 255. El host sí detectaba la RTX 3050 de 6 GB.

## Configuración aplicada

En `/mnt/user/system/docker-compose/jellyfin_new/docker-compose.yml`, dentro
del servicio `jellyfin`:

```yaml
runtime: nvidia
environment:
  # Conservar también las variables existentes.
  - NVIDIA_VISIBLE_DEVICES=GPU-88d95104-54b0-c725-b7c5-af601b952732
  - NVIDIA_DRIVER_CAPABILITIES=compute,video,utility
volumes:
  - ./config:/config:rw
  - /mnt/user/directsave/jellyfin/data:/data:rw
```

Este fragmento no sustituye el Compose completo. Se conservan la imagen
10.11.6, el puerto, el usuario, `privileged`, `/dev/dri`, el mod Intel existente
y los overrides de la web Absorflix y Compose Manager.

Fue necesario sustituir `rw,rshared` por `rw` en ambos montajes. En este NAS,
con Unraid 7.3.2, NVIDIA Container Toolkit 1.20.0 y runc 1.3.5, el arranque con
NVIDIA y esos montajes compartidos fallaba con
`error jailing process inside rootfs: open /proc/self/mountinfo: no such file or directory`.
Desactivar `privileged` no resolvió el error; cambiar la propagación sí,
manteniendo finalmente el valor original de `privileged`.
Los montajes ahora usan la propagación privada predeterminada de Docker;
no se propagarán nuevos submontajes del host al contenedor en caliente.
No se cambiaron los controladores, el runtime global ni la configuración de
transcodificación de Jellyfin.

## Recreación

Interrumpe las sesiones; acordar un momento de mantenimiento. Usar los tres
archivos para conservar el branding y las etiquetas de Unraid:

```sh
cd /mnt/user/system/docker-compose/jellyfin_new
docker compose -p jellyfin_new \
  -f docker-compose.yml \
  -f docker-compose.override.yml \
  -f /boot/config/plugins/compose.manager/projects/jellyfin_new/docker-compose.override.yml \
  up -d --no-deps --pull never jellyfin
```

El mod Intel existente instala paquetes durante el arranque y puede retrasar
varios minutos la disponibilidad HTTP, aunque Docker ya indique `running`.

## Verificación y recuperación

Comprobar `docker exec jellyfin nvidia-smi`, las bibliotecas CUDA/NVENC dentro
del contenedor y una transcodificación real, además de `/health` y la API pública.
Que la GPU esté al 0 % en reposo o durante reproducción directa es normal.

La prueba del 15 de septiembre reutilizó la línea FFmpeg del intento fallido de
«Chicas malas», conservando CUDA, el filtro `overlay_cuda` de subtítulos y
`hevc_nvenc`. Se limitó a 120 fotogramas y sustituyó la salida HLS por salida
nula para no escribir segmentos de una sesión ajena. Terminó con código 0,
120 fotogramas, 103,56 FPS y sin fotogramas descartados. También pasó una
prueba de decodificación CUDA y escalado a 1080p de esa película.
Estas pruebas verifican la conversión en el servidor; no sustituyen una
reproducción completa en cada modelo de cliente.

Respaldo anterior al cambio, conservado en el NAS:
`/mnt/user/system/docker-compose/jellyfin_new/nvidia-fix-backup-20260915-TPRIOk/`.
Contiene el Compose principal, el override de la web y `encoding.xml` originales.
Para revertir este cambio, restaurar solo su `docker-compose.yml` en el
directorio del proyecto y recrear con el comando anterior. Esto recuperaría
la configuración previa, incluido su fallo de transcodificación NVIDIA.

La prueba aislada `absorflix-gpu-check-20260915` queda detenida y conservada;
no tiene montajes de la biblioteca ni de la configuración de producción.

Referencias: [LinuxServer NVIDIA](https://docs.linuxserver.io/images/docker-jellyfin/#nvidia)
y [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/cdi-support.html).
