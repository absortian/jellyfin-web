#!/usr/bin/env bash
set -euo pipefail

# Run on NAS1, from the extracted release. The existing Compose file is retained.
release_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)
compose_dir=${ABSORFLIX_COMPOSE_DIR:-/mnt/user/system/docker-compose/jellyfin_new}
override="$compose_dir/docker-compose.override.yml"
state="$release_dir/deployment-state"

die() { printf '%s\n' "$*" >&2; exit 1; }
[[ $(id -u) == 0 ]] || die 'Ejecuta este script como root en NAS1.'
[[ -f "$compose_dir/docker-compose.yml" ]] || die 'No se encuentra el Compose de jellyfin_new.'
[[ -f "$release_dir/web/index.html" && -s "$release_dir/web/assets/audio/absorflix/intro.mp3" ]] || die 'El paquete web está incompleto.'
[[ -f "$release_dir/RELEASE" ]] || die 'Falta RELEASE.'
release_id=$(cat "$release_dir/RELEASE")
[[ "$release_id" == 10.11.6-absorflix-* ]] || die 'Este instalador requiere el paquete 10.11.6.'
[[ "$release_dir" =~ ^/[a-zA-Z0-9_./-]+$ ]] || die 'Extrae el paquete en una ruta sin espacios ni caracteres especiales.'

cd "$release_dir"
sha256sum -c SHA256SUMS --quiet || die 'La verificación del paquete ha fallado.'
cd "$compose_dir"
if docker compose version >/dev/null 2>&1; then
    compose=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
    compose=(docker-compose)
else
    die 'Docker Compose no está disponible.'
fi

image=$(docker inspect jellyfin --format '{{.Config.Image}}')
[[ "$image" == linuxserver/jellyfin:10.11.6 || "$image" == lscr.io/linuxserver/jellyfin:10.11.6 ]] || die "Imagen inesperada: $image. No se modifica el contenedor."
version=$(curl --fail --silent --show-error --max-time 10 http://127.0.0.1:8096/System/Info/Public)
[[ "$version" =~ \"Version\"[[:space:]]*:[[:space:]]*\"10\.11\.6\" ]] || die 'El servidor no responde como Jellyfin 10.11.6.'

if [[ -f "$override" ]] && ! head -n 1 "$override" | grep -qx '# Managed by Absorflix deployment'; then
    die 'Ya existe un docker-compose.override.yml ajeno a Absorflix. Hay que revisar cómo combinarlo antes de instalar.'
fi
if [[ -d "$state" ]]; then
    if cmp -s "$override" "$state/applied.override.yml"; then
        printf 'Esta versión de Absorflix ya está instalada.\n'
        exit 0
    fi
    die 'Este paquete ya tiene un historial de despliegue. Usa una extracción nueva para reinstalar.'
fi
mkdir -p "$state"
cp -p docker-compose.yml "$state/docker-compose.original.yml"
if [[ -f "$override" ]]; then
    cp -p "$override" "$state/previous.override.yml"
else
    touch "$state/no-previous-override"
fi
cat > "$state/applied.override.yml" <<EOF
# Managed by Absorflix deployment
version: "3.3"
services:
  jellyfin:
    volumes:
      - "$release_dir/web:/usr/share/jellyfin/web:ro"
EOF

restore_override() {
    if [[ -f "$state/previous.override.yml" ]]; then
        cp -p "$state/previous.override.yml" "$override"
    else
        rm -f "$override"
    fi
}
rollback_on_error() {
    trap - ERR INT TERM
    printf 'El despliegue ha fallado; restaurando la configuración anterior.\n' >&2
    restore_override
    "${compose[@]}" up -d --no-deps jellyfin || true
    exit 1
}
trap rollback_on_error ERR INT TERM
cp "$state/applied.override.yml" "$override"
"${compose[@]}" config --quiet
printf 'Instalando %s. Jellyfin se reiniciará para montar la nueva web.\n' "$release_id"
"${compose[@]}" up -d --no-deps jellyfin

healthy=false
for ((attempt=0; attempt<60; attempt++)); do
    if curl --fail --silent --max-time 3 http://127.0.0.1:8096/web/absorflix-release.json | grep -Fq "\"release\": \"$release_id\"" \
        && curl --fail --silent --max-time 3 http://127.0.0.1:8096/System/Info/Public >/dev/null; then
        healthy=true
        break
    fi
    sleep 2
done
if [[ "$healthy" != true ]]; then
    rollback_on_error
fi
trap - ERR INT TERM
printf 'Absorflix desplegado y verificado en http://192.168.1.110:8096/web/\n'
printf 'Vuelta atrás: bash %q/rollback.sh\n' "$release_dir"
