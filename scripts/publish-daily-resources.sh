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

usage() {
  echo "usage: $0 [--date YYYY-MM-DD] [--dry-run] [--no-merge]" >&2
}

while (($#)); do
  case "$1" in
    --date) DATE="$2"; shift 2;;
    --dry-run) DRY_RUN=1; shift;;
    --no-merge) AUTO_MERGE=0; shift;;
    -h|--help) usage; exit 0;;
    *) usage; exit 2;;
  esac
done

if [[ ! "$DATE" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
  echo "invalid date: $DATE" >&2
  exit 2
fi

YEAR="${DATE:0:4}"; MONTH="${DATE:5:2}"; DAY="${DATE:8:2}"
ART_ROOT="$KNOWLEDGE_ROOT/art/$YEAR/$MONTH/$DAY"
NEWS_ROOT="$KNOWLEDGE_ROOT/finance/$YEAR/$MONTH/$DAY/daily-news"
REPO_NAME="$(git -C "$ROOT" remote get-url origin | sed -E 's#.*github.com[:/]##; s#\.git$##')"
BRANCH="automation/daily-resources-$DATE"
WORKTREE="${TMPDIR:-/tmp}/limen-daily-resources-$DATE"
PR_BODY="${TMPDIR:-/tmp}/limen-daily-resources-$DATE-pr.md"

[[ -d "$ART_ROOT" ]] || { echo "missing Art source: $ART_ROOT" >&2; exit 1; }
[[ -d "$NEWS_ROOT" ]] || { echo "missing News source: $NEWS_ROOT" >&2; exit 1; }

ART_SLUG="$(find "$ART_ROOT" -mindepth 1 -maxdepth 1 -type d -printf '%f\n' | sort | head -1)"
[[ -n "$ART_SLUG" ]] || { echo "no Art entry under $ART_ROOT" >&2; exit 1; }
ART_SOURCE="$ART_ROOT/$ART_SLUG"

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
cp -a "$ART_SOURCE/source.jpg" "$ART_DEST/source.jpg"
cp -a "$ART_SOURCE/source.jpg" "$ART_DEST/cover.jpg"
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

CATALOG="$WORKTREE/src/data/resource-catalog.json"
DATE="$DATE" ART_SLUG="$ART_SLUG" ART_SOURCE="$ART_SOURCE" NEWS_ROOT="$NEWS_ROOT" NEWS_COVER_EXT="$NEWS_COVER_EXT" CATALOG="$CATALOG" python3 - <<'PY'
import html, json, os, re
from pathlib import Path

date = os.environ['DATE']
art_slug = os.environ['ART_SLUG']
art_root = Path(os.environ['ART_SOURCE'])
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
     'image':f'{art_url}/cover.jpg','cards':[f'{art_url}/{p}' for p in cards(art_root, art_url)]},
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
