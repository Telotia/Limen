#!/usr/bin/env bash
set -Eeuo pipefail

# Sync the daily Art + News knowledge output into Limen, publish a content-only
# PR against dev, and let GitHub Actions validate/deploy it. The script always
# works from a clean origin/dev worktree so unrelated local website changes are
# never staged or pushed.

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
KNOWLEDGE_ROOT="${KNOWLEDGE_ROOT:-/mnt/c/Users/whyke/Nextcloud/Library/knowledge}"
DATE="$(date +%Y-%m-%d)"
DRY_RUN=0
AUTO_MERGE="${AUTO_MERGE:-1}"
WAIT_MINUTES="${WAIT_MINUTES:-45}"
WAIT_INTERVAL_SECONDS="${WAIT_INTERVAL_SECONDS:-60}"

usage() {
  echo "usage: $0 [--date YYYY-MM-DD] [--dry-run] [--no-merge] [--no-wait|--wait-minutes N]" >&2
}

while (($#)); do
  case "$1" in
    --date) DATE="$2"; shift 2;;
    --dry-run) DRY_RUN=1; shift;;
    --no-merge) AUTO_MERGE=0; shift;;
    --no-wait) WAIT_MINUTES=0; shift;;
    --wait-minutes) WAIT_MINUTES="$2"; shift 2;;
    -h|--help) usage; exit 0;;
    *) usage; exit 2;;
  esac
done

if [[ ! "$DATE" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
  echo "invalid date: $DATE" >&2
  exit 2
fi
if [[ ! "$WAIT_MINUTES" =~ ^[0-9]+$ ]]; then
  echo "invalid wait duration: $WAIT_MINUTES" >&2
  exit 2
fi

LOG_DIR="${RESOURCE_LOG_DIR:-$HOME/.local/state/telotia/daily-resources}"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/$DATE.log"
exec > >(tee -a "$LOG_FILE") 2>&1
echo "[$(date --iso-8601=seconds)] publish start date=$DATE wait_minutes=$WAIT_MINUTES"

YEAR="${DATE:0:4}"; MONTH="${DATE:5:2}"; DAY="${DATE:8:2}"
ART_ROOT="$KNOWLEDGE_ROOT/art/$YEAR/$MONTH/$DAY"
NEWS_ROOT="$KNOWLEDGE_ROOT/finance/$YEAR/$MONTH/$DAY/daily-news"
REPO_NAME="$(git -C "$ROOT" remote get-url origin | sed -E 's#.*github.com[:/]##; s#\.git$##')"
BRANCH="automation/daily-resources-$DATE"
WORKTREE="${TMPDIR:-/tmp}/limen-daily-resources-$DATE"
PR_BODY="${TMPDIR:-/tmp}/limen-daily-resources-$DATE-pr.md"

sources_ready() {
  [[ -d "$ART_ROOT" && -d "$NEWS_ROOT" ]] || return 1
  local art_slug art_source
  art_slug="$(find "$ART_ROOT" -mindepth 1 -maxdepth 1 -type d -printf '%f\n' | sort | head -1)"
  [[ -n "$art_slug" ]] || return 1
  art_source="$ART_ROOT/$art_slug"
  [[ -f "$art_source/en/index.html" && -f "$art_source/en/cards.html" ]] || return 1
  [[ -f "$art_source/zh/index.html" && -f "$art_source/zh/cards.html" ]] || return 1
  find "$art_source" -maxdepth 1 -type f \
    \( -iname 'source.jpg' -o -iname 'source.jpeg' -o -iname 'source.png' -o -iname 'source.webp' \) \
    -print -quit | grep -q . || return 1
  [[ -f "$NEWS_ROOT/en/index.html" && -f "$NEWS_ROOT/en/cards.html" ]] || return 1
  [[ -f "$NEWS_ROOT/zh/index.html" && -f "$NEWS_ROOT/zh/cards.html" ]] || return 1
}

deadline=$((SECONDS + WAIT_MINUTES * 60))
until sources_ready; do
  if ((SECONDS >= deadline)); then
    [[ -d "$ART_ROOT" ]] || echo "missing Art source: $ART_ROOT" >&2
    [[ -d "$NEWS_ROOT" ]] || echo "missing News source: $NEWS_ROOT" >&2
    echo "daily resources were not complete after ${WAIT_MINUTES} minute(s)" >&2
    exit 1
  fi
  echo "[$(date --iso-8601=seconds)] sources incomplete; retrying in ${WAIT_INTERVAL_SECONDS}s"
  sleep "$WAIT_INTERVAL_SECONDS"
done

ART_SLUG="$(find "$ART_ROOT" -mindepth 1 -maxdepth 1 -type d -printf '%f\n' | sort | head -1)"
[[ -n "$ART_SLUG" ]] || { echo "no Art entry under $ART_ROOT" >&2; exit 1; }
ART_SOURCE="$ART_ROOT/$ART_SLUG"
ART_SOURCE_IMAGE="$(find "$ART_SOURCE" -maxdepth 1 -type f \
  \( -iname 'source.jpg' -o -iname 'source.jpeg' -o -iname 'source.png' -o -iname 'source.webp' \) \
  -print | sort | head -1)"
[[ -n "$ART_SOURCE_IMAGE" ]] || { echo "no Art source image under $ART_SOURCE" >&2; exit 1; }
ART_COVER_EXT="jpg"

# English resources must remain English-only.  Fail before creating a PR if
# the source generator accidentally places CJK text in an English page/card.
if rg -nP '[\x{4e00}-\x{9fff}]' "$ART_SOURCE/en" "$NEWS_ROOT/en" >/dev/null 2>&1; then
  echo "English resource contains CJK text; fix the source before publishing" >&2
  rg -nP '[\x{4e00}-\x{9fff}]' "$ART_SOURCE/en" "$NEWS_ROOT/en" >&2 || true
  exit 1
fi

if ((DRY_RUN)); then
  echo "[dry-run] date=$DATE"
  echo "[dry-run] art=$ART_ROOT/$ART_SLUG -> public/resource/art/$YEAR/$MONTH/$DAY/$ART_SLUG"
  echo "[dry-run] news=$NEWS_ROOT -> public/resource/news/$YEAR/$MONTH/$DAY/daily-news"
  echo "[dry-run] branch=$BRANCH repo=$REPO_NAME auto_merge=$AUTO_MERGE"
  exit 0
fi

cleanup() {
  rm -f "$PR_BODY"
  git -C "$ROOT" worktree remove --force "$WORKTREE" >/dev/null 2>&1 || true
}
trap cleanup EXIT

git -C "$ROOT" fetch origin dev
rm -rf "$WORKTREE"
git -C "$ROOT" worktree add -B "$BRANCH" "$WORKTREE" origin/dev

ART_DEST="$WORKTREE/public/resource/art/$YEAR/$MONTH/$DAY/$ART_SLUG"
NEWS_DEST="$WORKTREE/public/resource/news/$YEAR/$MONTH/$DAY/daily-news"
mkdir -p "$ART_DEST" "$NEWS_DEST"
copy_locale() {
  local source="$1" destination="$2" fallback_index="${3:-}"
  mkdir -p "$destination"
  if [[ -f "$source/index.html" ]]; then
    cp -a "$source/index.html" "$destination/"
  elif [[ -n "$fallback_index" && -f "$fallback_index" ]]; then
    cp -a "$fallback_index" "$destination/index.html"
  else
    echo "missing locale index: $source/index.html" >&2
    return 1
  fi
  [[ -f "$source/cards.html" ]] && cp -a "$source/cards.html" "$destination/"
  find "$source" -maxdepth 1 -type f \( -iname 'card-*.*' \) -exec cp -a {} "$destination/" \;
}
copy_locale "$ART_SOURCE/en" "$ART_DEST/en"
copy_locale "$ART_SOURCE/zh" "$ART_DEST/zh"
IMAGE_PYTHON="${RESOURCE_IMAGE_PYTHON:-$HOME/venv/bin/python}"
[[ -x "$IMAGE_PYTHON" ]] || {
  echo "image Python is unavailable: $IMAGE_PYTHON" >&2
  exit 1
}
"$IMAGE_PYTHON" -c 'import PIL' || {
  echo "Pillow is unavailable in $IMAGE_PYTHON" >&2
  exit 1
}
"$IMAGE_PYTHON" "$ROOT/scripts/resize-resource-image.py" \
  "$ART_SOURCE_IMAGE" "$ART_DEST/cover.jpg" --max-width 2200 --quality 86
cp -a "$ART_DEST/cover.jpg" "$ART_DEST/source.jpg"

# Locale pages can reference the source image by its original extension, while
# publishing always emits a size-safe JPEG. Keep those relative links valid.
ART_DEST="$ART_DEST" python3 - <<'PY'
import os
import re
from pathlib import Path

for path in Path(os.environ["ART_DEST"]).rglob("*.html"):
    text = path.read_text(encoding="utf-8")
    text = re.sub(r"source\.(?:png|jpe?g|webp)", "source.jpg", text, flags=re.I)
    path.write_text(text, encoding="utf-8")
PY

# Copy top-level audio/video linked by the article. Cloudflare Pages rejects
# individual assets above 25 MiB, so oversized MP4 files are transcoded to a
# web-ready 720p H.264/AAC version when ffmpeg is available.
FFMPEG="${RESOURCE_FFMPEG:-$(command -v ffmpeg || true)}"
if [[ -z "$FFMPEG" ]]; then
  FFMPEG="$HOME/sglang-venv/lib/python3.11/site-packages/imageio_ffmpeg/binaries/ffmpeg-linux64-v4.2.2"
fi
while IFS= read -r media; do
  media_name="$(basename "$media")"
  media_dest="$ART_DEST/$media_name"
  media_size="$(stat -c %s "$media")"
  if [[ "${media_name,,}" == *.mp4 && "$media_size" -gt 24000000 ]]; then
    [[ -x "$FFMPEG" ]] || {
      echo "oversized Art video needs ffmpeg: $media ($media_size bytes)" >&2
      exit 1
    }
    "$FFMPEG" -y -i "$media" -vf scale=1280:-2 -c:v libx264 -preset medium \
      -crf 26 -pix_fmt yuv420p -c:a aac -b:a 96k -movflags +faststart "$media_dest"
  else
    cp -a "$media" "$media_dest"
  fi
  published_size="$(stat -c %s "$media_dest")"
  [[ "$published_size" -le 25000000 ]] || {
    echo "Art media exceeds the 25 MB publish limit: $media_dest ($published_size bytes)" >&2
    exit 1
  }
done < <(find "$ART_SOURCE" -maxdepth 1 -type f \
  \( -iname '*.mp4' -o -iname '*.webm' -o -iname '*.mp3' -o -iname '*.m4a' -o -iname '*.wav' \) \
  -print | sort)

copy_locale "$NEWS_ROOT/en" "$NEWS_DEST/en"
copy_locale "$NEWS_ROOT/zh" "$NEWS_DEST/zh" "$NEWS_ROOT/index.html"
if [[ -f "$NEWS_ROOT/source.jpg" ]]; then
  cp -a "$NEWS_ROOT/source.jpg" "$NEWS_DEST/cover.jpg"
  NEWS_COVER_EXT="jpg"
else
  NEWS_CARD="$(find "$NEWS_ROOT/en" -maxdepth 1 -type f -iname 'card-1.*' | head -1)"
  [[ -n "$NEWS_CARD" ]] || { echo "news has no cover or card-1: $NEWS_ROOT" >&2; exit 1; }
  NEWS_EXT="${NEWS_CARD##*.}"
  cp -a "$NEWS_CARD" "$NEWS_DEST/cover.$NEWS_EXT"
  NEWS_COVER_EXT="$NEWS_EXT"
fi

# Source generators may leave more than one newline at EOF. Git's whitespace
# gate treats that harmless HTML formatting as an error, so normalize copied
# HTML inside the disposable worktree before staging. Source files are not
# modified.
ART_DEST="$ART_DEST" NEWS_DEST="$NEWS_DEST" python3 - <<'PY'
import os
from pathlib import Path

for root_name in ("ART_DEST", "NEWS_DEST"):
    for path in Path(os.environ[root_name]).rglob("*.html"):
        content = path.read_bytes()
        path.write_bytes(content.rstrip(b"\r\n") + b"\n")
PY

CATALOG="$WORKTREE/src/data/resource-catalog.json"
DATE="$DATE" ART_SLUG="$ART_SLUG" ART_SOURCE="$ART_SOURCE" ART_COVER_EXT="$ART_COVER_EXT" NEWS_ROOT="$NEWS_ROOT" NEWS_COVER_EXT="$NEWS_COVER_EXT" CATALOG="$CATALOG" python3 - <<'PY'
import html, json, os, re
from pathlib import Path

date = os.environ['DATE']
art_slug = os.environ['ART_SLUG']
art_root = Path(os.environ['ART_SOURCE'])
art_cover_ext = os.environ['ART_COVER_EXT']
news_root = Path(os.environ['NEWS_ROOT'])
news_cover_ext = os.environ['NEWS_COVER_EXT']
catalog_path = Path(os.environ['CATALOG'])
label = f"{date[5:7]}/{date[8:10]}/{date[:4]}"
date_label = __import__('datetime').datetime.strptime(date, '%Y-%m-%d').strftime('%b %-d, %Y')

def title(path, fallback):
    text = path.read_text(encoding='utf-8', errors='replace')
    for pattern in (r'<h1[^>]*>(.*?)</h1>', r'<title[^>]*>(.*?)</title>'):
        match = re.search(pattern, text, re.I | re.S)
        if match:
            value = re.sub(r'<[^>]+>', ' ', match.group(1))
            value = ' '.join(html.unescape(value).split())
            if value:
                return value
    return fallback.replace('-', ' ').title()

def cards(base, root_url):
    return sorted(str(p.relative_to(base)).replace('\\', '/') for p in base.glob('en/card-*.*'))

art_url = f'/resource/art/{date[:4]}/{date[5:7]}/{date[8:10]}/{art_slug}'
news_url = f'/resource/news/{date[:4]}/{date[5:7]}/{date[8:10]}/daily-news'
entries = json.loads(catalog_path.read_text(encoding='utf-8'))
entries = [e for e in entries if not (e.get('date') == date and e.get('kind') in {'art', 'news'})]
entries.extend([
    {'kind':'art','categories':['art'],'title':title(art_root/'en/index.html', art_slug),
     'date':date,'dateLabel':date_label,'folderLabel':f'{date[:4]}/{date[5:7]}/{date[8:10]}/{art_slug}',
     'href':f'{art_url}/en/index.html','zhHref':f'{art_url}/zh/index.html',
     'image':f'{art_url}/cover.{art_cover_ext}','cards':[f'{art_url}/{p}' for p in cards(art_root, art_url)]},
    {'kind':'news','categories':['news'],'title':title(news_root/'en/index.html','Daily news'),
     'date':date,'dateLabel':date_label,'folderLabel':f'{date[:4]}/{date[5:7]}/{date[8:10]}/daily-news',
     'href':f'{news_url}/en/index.html','zhHref':f'{news_url}/zh/index.html',
     'image':f'{news_url}/cover.{news_cover_ext}','cards':[f'{news_url}/{p}' for p in cards(news_root, news_url)]},
])
entries.sort(key=lambda e: (e.get('date',''), 1 if e.get('kind') == 'news' else 0), reverse=True)
catalog_path.write_text(json.dumps(entries, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
PY

git -C "$WORKTREE" add "public/resource/art/$YEAR/$MONTH/$DAY/$ART_SLUG" "public/resource/news/$YEAR/$MONTH/$DAY/daily-news" src/data/resource-catalog.json
git -C "$WORKTREE" diff --cached --check
git -C "$WORKTREE" diff --cached --stat
git -C "$WORKTREE" commit -m "feat(content): publish daily resources $DATE"
git -C "$WORKTREE" push -u origin "$BRANCH"

cat > "$PR_BODY" <<EOF
## What changed

- Publish the local daily Art entry for $DATE.
- Publish the local daily News entry for $DATE.
- Update the resource catalog used by the resource archive and navigation.

## Automation

This is a content-only daily-resource PR from the Nextcloud knowledge output.
CI must pass before the PR is merged; the dev deployment then publishes the
resource pages to https://dev.telotia.com/resource.

## Validation

- Source directories exist for both Art and News.
- Staged diff is limited to the dated resource directories and catalog.
- `git diff --cached --check` passed.
EOF

PR_URL="$(gh -R "$REPO_NAME" pr create --base dev --head "$BRANCH" --title "feat(content): publish daily resources $DATE" --body-file "$PR_BODY")"
echo "created PR: $PR_URL"
if [[ "$AUTO_MERGE" == "1" ]]; then
  gh -R "$REPO_NAME" pr merge "$PR_URL" --auto --squash
  echo "auto-merge enabled: $PR_URL"
fi
echo "[$(date --iso-8601=seconds)] publish completed date=$DATE"
