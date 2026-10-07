#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(
    cd -- "$(dirname -- "$0")/.." &&
    pwd
)"

MARKED_VERSION="18.1.0"
DOMPURIFY_VERSION="3.4.16"
GITHUB_MARKDOWN_CSS_VERSION="5.9.0"

VENDOR_JS="$ROOT_DIR/assets/js/vendor"
VENDOR_CSS="$ROOT_DIR/assets/css/vendor"

mkdir -p \
    "$VENDOR_JS" \
    "$VENDOR_CSS"

printf '[Docs] Fetching Marked %s...\n' \
    "$MARKED_VERSION"

curl -fL \
    "https://cdn.jsdelivr.net/npm/marked@${MARKED_VERSION}/lib/marked.umd.js" \
    -o "$VENDOR_JS/marked.umd.js"

printf '[Docs] Fetching DOMPurify %s...\n' \
    "$DOMPURIFY_VERSION"

curl -fL \
    "https://cdn.jsdelivr.net/npm/dompurify@${DOMPURIFY_VERSION}/dist/purify.min.js" \
    -o "$VENDOR_JS/purify.min.js"

printf '[Docs] Fetching github-markdown-css %s...\n' \
    "$GITHUB_MARKDOWN_CSS_VERSION"

curl -fL \
    "https://cdn.jsdelivr.net/npm/github-markdown-css@${GITHUB_MARKDOWN_CSS_VERSION}/github-markdown.css" \
    -o "$VENDOR_CSS/github-markdown.css"

printf '[Docs] Assets ready.\n'

printf '  %s\n' \
    "$VENDOR_JS/marked.umd.js"

printf '  %s\n' \
    "$VENDOR_JS/purify.min.js"

printf '  %s\n' \
    "$VENDOR_CSS/github-markdown.css"