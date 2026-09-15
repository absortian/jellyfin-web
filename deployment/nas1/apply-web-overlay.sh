#!/usr/bin/env bash
set -Eeuo pipefail

# Update an existing 10.11.6 web bind without removing files or recreating Jellyfin.
release_dir=$(cd -- "${1:?Usage: bash apply-web-overlay.sh /path/to/extracted/release}" && pwd -P)
cd "$release_dir"
sha256sum -c SHA256SUMS --quiet
[[ $(docker inspect jellyfin --format '{{.Config.Image}}') == linuxserver/jellyfin:10.11.6 ]]
web_root=$(docker inspect jellyfin --format '{{range .Mounts}}{{if eq .Destination "/usr/share/jellyfin/web"}}{{.Source}}{{end}}{{end}}')
[[ -n "$web_root" && -f "$web_root/absorflix-release.json" && -f web/index.html ]]
curl --fail --silent --show-error --max-time 10 http://127.0.0.1:8096/System/Info/Public >/dev/null

backup="$release_dir/overlay-backup"
mkdir "$backup"
mkdir "$backup/web"
touch "$backup/added-files.txt"

restore() {
    trap - ERR INT TERM
    while IFS= read -r -d '' previous; do
        relative=${previous#"$backup/web/"}
        cp -p -- "$previous" "$web_root/$relative"
    done < <(find "$backup/web" -type f -print0)
    echo "Overlay failed; previous files restored. New assets retained. Backup: $backup" >&2
    exit 1
}
trap restore ERR INT TERM

publish() {
    local file=$1 relative destination temporary
    relative=${file#web/}
    destination="$web_root/$relative"
    if [[ -f "$destination" ]] && cmp -s -- "$file" "$destination"; then
        return
    fi
    mkdir -p -- "$(dirname -- "$destination")"
    if [[ -e "$destination" ]]; then
        [[ -f "$destination" && ! -L "$destination" ]]
        mkdir -p -- "$backup/web/$(dirname -- "$relative")"
        cp -p -- "$destination" "$backup/web/$relative"
    else
        printf '%s\n' "$relative" >> "$backup/added-files.txt"
    fi
    temporary=$(mktemp "$(dirname -- "$destination")/.absorflix-update.XXXXXX")
    cp -p -- "$file" "$temporary"
    mv -f -- "$temporary" "$destination"
}

# Keep the previous entry page available until all its replacement assets exist.
while IFS= read -r -d '' file; do
    publish "$file"
done < <(find web -type f ! -path web/index.html -print0)
publish web/index.html

(cd "$web_root"; sed -n 's@  web/@  @p' "$release_dir/SHA256SUMS" | sha256sum -c - >/dev/null)
curl --fail --silent --show-error --max-time 10 http://127.0.0.1:8096/System/Info/Public >/dev/null
trap - ERR INT TERM
printf 'Web updated without restarting Jellyfin. Previous files: %s\n' "$backup"
