#!/usr/bin/env bash
set -euo pipefail
release_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)
compose_dir=${ABSORFLIX_COMPOSE_DIR:-/mnt/user/system/docker-compose/jellyfin_new}
state="$release_dir/deployment-state"
override="$compose_dir/docker-compose.override.yml"
[[ -f "$state/applied.override.yml" ]] || { echo 'Este paquete no se ha desplegado.' >&2; exit 1; }
cmp -s "$override" "$state/applied.override.yml" || { echo 'La configuración cambió después de este despliegue. Revisa la versión activa antes de restaurar.' >&2; exit 1; }
cd "$compose_dir"
if docker compose version >/dev/null 2>&1; then
    compose=(docker compose)
else
    compose=(docker-compose)
fi
if [[ -f "$state/previous.override.yml" ]]; then
    cp -p "$state/previous.override.yml" "$override"
elif [[ -f "$state/no-previous-override" ]]; then
    rm "$override"
else
    echo 'No se encuentra la copia de la configuración anterior.' >&2
    exit 1
fi
"${compose[@]}" config --quiet
"${compose[@]}" up -d --no-deps jellyfin
echo 'Restaurada la configuración web anterior. Los datos y las bibliotecas se conservan.'
